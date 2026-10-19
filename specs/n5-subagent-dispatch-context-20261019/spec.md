# 功能规格：子代理派发与回传合同

读者：build-code 实施者、verify-code 验收者、五阶段派发者与规则维护者。读完能找到当前行为、全局设计、各 Phase 与唯一验收判据。

- 功能：`n5-subagent-dispatch-context-20261019`；`content_profile: post`；范围 `non_ui`。
- 来源：[decision-log.md](decision-log.md) 的 R-001…R-013、D-001…D-037 与 AC-001…AC-012；父 PRD N5 卡（`specs/archive/skills-framework-redesign-20261014/prd.md:375-392`）只读保留产品目标权威。
- 状态说明：实施计划已由用户确认，原件为任务库 `quality/evidence/human-confirmations/2026-10-19-002-build-plan-approved.json`；build-code 已开展。当前执行位置、Phase 材料与真实审查/欠账事实，分别读 `phases/index.md` 所指当前材料及任务库 `facts.jsonl`，不由本说明推定阶段完成。用户现已选择按批准范围带欠账收口（`quality/evidence/2026-10-19-117-build-code-user-debt-boundary.json`），不表示全部原始验收通过。

## 速读卡（30 秒）

- **一句话需求**：派发者凭同一份回传合同判断子代理回传够不够用、主 Agent 保住整体判断；活动治理文件不再有并发数字与悬空指向。
- **核心改动点**：
  - `AGENTS.md` 派发段写入四要素、三处缺口、回传六项固定开头与进入面纪律；删掉「2–5」区间与指向不存在的「build-plan 当前并行方案」的指针。
  - `skills/deep-research/SKILL.md` 删两处并发硬上限，研究回传对齐同一合同（保既有来源/覆盖）。
  - 两项外部采用在三处登记：`skills/catalog.yaml`、`THIRD_PARTY_NOTICES.md`、`skills/reuse-registry.md`。
  - `GLOSSARY.md` 新增「并发」「派发与回传合同」两条术语。
- **最大影响面**：五个阶段的所有派发者与子代理；常驻三文件（AGENTS/CLAUDE/GLOSSARY）字节与既有常驻预算断言。
- **验收信号**：两类真实派发六项齐且引用可回读；三种异常可判；活动治理层无并发数字与悬空指针；减法有逐条理由；字节与成本分面披露；外部采用三处登记可核；常驻预算断言预计为红并如实披露。

## 材料导航

本导航可重生成，不是第二份进度或契约。

| 去哪里 | 读什么 | 何时读 |
| --- | --- | --- |
| 来源与决策映射 | 原始来源与当前翻译关系 | 核范围或追溯来源 |
| 第 3—5 节 | 场景、PFACT、FR | 实施前理解行为 |
| 测试标准、实现设计 | 对象、接口、文件边界与 Task | 选定具体改动时 |
| Appendix A | 唯一验收条件与预期证据 | 测试、审查、逐项验收 |
| 第 12 节、补充材料 | 风险、未知与原始材料 | 触及对应依赖时 |

## 来源与决策映射

R 的原义、来源地址与真实用户答复由 decision-log 原节维护；本表只绑定当前翻译。D 编号是本任务 provenance，不把它们改写成新 ADR 决定。上游编号 `AC-006`、`AC-T6-1…5` 在本卡沿用原号；`AC-T6-1…5` 的词条定义不在 `prd.md`，只在任务库上游材料 母任务库 `tasks/skills-framework-redesign-20261014/quality/evidence/decision-log-refs/s3/T4-T10-remaining.md:137-141`，本规格引用其原义，不冒 `prd.md` 原文。

| 原始来源 | 决定 provenance | FR | AC | source_status / 场景 | 原件入口 |
| --- | --- | --- | --- | --- | --- |
| R-001 | D-001、D-031 | —（过程约束） | — | current / 全阶段纪律 | 任务身份；本文件状态行 |
| R-002 | D-011、D-019、D-022、D-032 | FR-N5-001、FR-N5-002 | AC-N5-001、AC-N5-002、AC-N5-012 | current / SCN-001…SCN-005 | `prd.md:375-377` |
| R-003 | D-002、D-006、D-020、D-032 | FR-N5-003、FR-N5-004、FR-N5-007 | AC-N5-004、AC-N5-005、AC-N5-007、AC-N5-011 | current / SCN-005、SCN-009 | `prd.md:378` |
| R-004 | D-012、D-019、D-022、D-030 | FR-N5-001、FR-N5-002 | AC-N5-001、AC-N5-002、AC-N5-003 | current / SCN-001…SCN-004 | `prd.md:379` |
| R-005 | D-007、D-022、D-024、D-032 | FR-N5-002、FR-N5-003、FR-N5-006 | AC-N5-001、AC-N5-004、AC-N5-006、AC-N5-007、AC-N5-008 | current / SCN-001…003、SCN-008 | `prd.md:380-381`；AC-006 |
| R-006 | D-004、D-023、D-036 | FR-N5-002 | AC-N5-002 | current / SCN-003 | `prd.md:382`（ORACLE-T6） |
| R-007 | D-019、D-020、D-035 | FR-N5-001、FR-N5-004 | AC-N5-001、AC-N5-012 | current / SCN-006 | `prd.md:384` |
| R-008 | D-009、D-014、D-023、D-024、D-036 | FR-N5-002、FR-N5-003、FR-N5-006 | AC-N5-001、AC-N5-002、AC-N5-003、AC-N5-008、AC-N5-009 | current / SCN-001…003、SCN-008 | `prd.md:385` |
| R-009 | D-027 | FR-N5-005 | AC-N5-010 | current / SCN-007 | `prd.md:683`、`prd.md:727`；`tasks/N5.md:5-10` |
| R-010 | D-005、D-018、D-024、D-026 | FR-N5-006 | AC-N5-008、AC-N5-009 | current / SCN-008 | `prd.md:195-199` |
| R-011 | D-002、D-019、D-030 | —（依赖约束） | — | current / 任务身份；第 12 节 | `prd.md:383`、`prd.md:592`、`prd.md:600` |
| R-012 | D-006、D-020、D-021、D-033 | —（非目标） | — | non-goal 见第 10 节 | `prd.md:263`、`prd.md:378`、`prd.md:390` |
| R-013 | D-027、D-031 | —（来源读取） | — | current / 补充材料 | `prd.md:391`；`tasks/N5.md` |
| US-04（`prd.md:147`） | D-019、D-020 | FR-N5-001、FR-N5-004 | AC-N5-001、AC-N5-012 | current / SCN-006 | 母 PRD |
| US-05（`prd.md:148`） | D-019、D-030 | FR-N5-001、FR-N5-002 | AC-N5-001、AC-N5-002 | current / SCN-001、SCN-002 | 母 PRD |
| US-13（`prd.md:156`） | D-024、D-026 | FR-N5-006 | AC-N5-008、AC-N5-009 | current / SCN-008 | 母 PRD |
| AC-T6-1…5 / ORACLE-T6（母任务库 `quality/evidence/decision-log-refs/s3/T4-T10-remaining.md:137-141`） | D-006、D-007、D-022、D-024、D-032 | FR-N5-002、FR-N5-003、FR-N5-006 | AC-N5-001…AC-N5-008 | current（AC-T6-4/5 字面已由 AC-008 改写，见口径注记） | 当前 decision-log 验收面 |

每条 FR/AC 都必须能回到本表；范围修订只追加受影响映射与修订说明，不另建需求账本。`AC-001…AC-012` 与本规格 `AC-N5-001…AC-N5-012` 同号一一对应，原编号保 provenance。

## 1. 需求解释：问题与紧迫性

主会话现在靠记忆与多处零散表述派活：继承摘要一处、研究回传一处、审查回传一处、跨阶段交接一处，没有一份共同的回传形状。结果是派发者拿回一段叙述却无法判断缺了什么，只能整段重读或退回重做；同一事实在派发与回传里被反复引入主上下文。

同时，`AGENTS.md:20` 写着「五阶段共用并发区间为 2–5」，并把具体并发指向「build-plan 的当前并行方案」——该方案在任何活动文件里都不存在，`build-plan` 也没有这一节。读者会以为仓库里有一份可引用的并发权威，实际没有。两项已核实可用的外部做法（`context-engineering`、`orchestrate.md`）在仓内零登记，来源与拒绝项只散在任务材料里。

本卡的目标不是新增机制，而是把派发与回传写成一份可判的合同、把失效的并发指针与数字移除、把两项采用登记到既有来源权威处。它服务 US-04／US-05／US-13：材料变短仍保失败与权限边界、重活交给有边界的子代理且主 Agent 保住整体上下文、成本与质量可对照。

## 2. 背景、目标与范围

### 背景

- `AGENTS.md:15-16` 已有「重活交子代理，主上下文只收摘要」与「全仓 grep…主上下文只收路径、exit_code、结论清单」；`:19` 已有继承摘要的 ref＋sha256＋≤500 字上限；`:20` 的并发区间与并行方案指针是本卡要删的对象；`:21` 是防冲突写者规则，保留。
- `workflows/build-code/SKILL.md:13-17` 的「Task graph 与 context pointers」已承接四要素中的目标、边界、输入引用与「不复制指针全文」「主会话收实际结果与原 ref」「修复回原实施会话」，本卡只指针引用，不重写（D-013／D-030）。
- `skills/deep-research/SKILL.md:36` 与 `:82` 各有一处「最多 4 个」的并发硬上限；其研究回传原义是来源、关键证据、冲突、置信度与未决项。
- `skills/wh-review/SKILL.md:44` 的八类冻结字段与 `skills/stage-handoff/SKILL.md` 的 13 区块固定发布口是保留不并的两族（D-032）。
- 两项外部来源已由上游任务保存并实读：`context-engineering` 固定 commit 与 sha256、`orchestrate.md` 的包摘要与 sha256 见「补充材料」。

### 目标

- 派发者能按同一份回传合同在固定位置读出缺什么、为什么缺，不再靠重读正文判断。
- 活动治理文件里不再存在并发数字声明，也不存在指向不存在的并发方案的指针；不新设替代判据。
- 两项外部采用有唯一的机器登记与人读说明，采用与拒绝都有来源行号。
- 减法有逐条理由，字节与成本按「可控面／常驻面／宿主注入面」分列披露，未测写未测。

### 范围内

- 六个文件的文本与登记：`AGENTS.md` 派发段、`GLOSSARY.md` 两条术语、`skills/deep-research/SKILL.md` 的并发上限与回传对齐、`skills/catalog.yaml`、`THIRD_PARTY_NOTICES.md`、`skills/reuse-registry.md`。
- 两类真实派发与三种异常回传的样本取得、取消与修复事实、进入面纪律的执行事实；这些事实落任务库外置原件，不新增仓库文件。
- 五族旧回传的逐族说明与交付说明素材（D-032／AC-007）。

> 非目标只在第 10 节维护，避免两份真相。

## 3. 用户场景与状态覆盖

### SCN-001：研究类派发按同一合同回传

- **角色**：五阶段的主会话与独立上下文的研究子代理。
- **前提**：研究问题仍未饱和；派发说明已知目标、边界、输入引用与可检查结果。
- **触发**：主会话按新合同派研究子代理；子代理只读分配的来源包。
- **结果**：回传在开头固定写六项，另有来源与覆盖（来源到 `路径:行号`，覆盖分列查了／没查／为什么）；派发者能直接指出缺项或直接用。
- **回写**：本次真实研究类试样已存在于任务库 `quality/evidence/decision-log-refs/research-candidates.md`；其格式缺陷（字段与正文混排）由本卡「六项固定开头」处置（D-012）。

### SCN-002：实施类派发按同一合同回传

- **角色**：build-code 主会话与实施子代理。
- **前提**：存在有产物的派活（含写任务库外置原件），派发说明含允许写集与可检查结果。
- **触发**：主会话派实施子代理；子代理独立工作并留下产物或原件。
- **结果**：回传六项齐，实施类另有改动路径、命令与退出码；派发者能在不重读全文的情况下核对。
- **回写**：实施类真实派发在 build-code 出现（D-009）；不足时按 D-023／D-036 记缺口。

### SCN-003：三种异常回传

- **角色**：派发者与独立审查者。
- **前提**：回传可能出现缺字段、引用不可读、状态词不在既有语义内三种情形。
- **触发**：派发者按六项固定位置核对。
- **结果**：三种情形都能在固定位置指出缺什么、为什么缺；判据只用存在性、引用形状可回读与既有状态语义；不使用构造件冒充真实派发证据。
- **回写**：三种情形本次未取得真实样本（D-014）；按 D-023 先真实派发、再真实形状构造件并显式标注；仍不足按 D-036 带欠账完成。

### SCN-004：取消与修复

- **角色**：派发者、实施子代理与审查者。
- **前提**：派发可能被取消，或回传引出的有效问题需要修复。
- **触发**：取消发生；或独立审查给出有效 finding。
- **结果**：取消回传在「已做与未做」给出真实界线；有效问题回原实施会话修复并留下修复后的原件；原会话不可用时如实披露；派发说明缺可选事实时，已能安全执行的部分继续并记明所缺。
- **回写**：事实落任务库原件；原会话身份与可用性如实记录。

### SCN-005：并发权威与旧记录口径

- **角色**：规则维护者、后续卡作者与读者。
- **前提**：`AGENTS.md:20` 有「2–5」与指向不存在的「并行方案」；`skills/deep-research/SKILL.md` 有两处「最多 4 个」。
- **触发**：读者检索并发规则或维护者改规则文件。
- **结果**：活动治理文件中没有并发数字声明、没有指向不存在方案的指针；防冲突写者规则保留；历史材料、工具自身上限与 `docs/adr/0034` 不覆写；决策日志与交付说明各有一句说明旧并发决定已不再与规则文件一致（D-033）。
- **回写**：五族逐族说明见第 12 节与 `FR-N5-007`。

### SCN-006：进入面纪律

- **角色**：主会话、子代理与回传读者。
- **前提**：派发与回传最容易把材料原文整段灌回主上下文。
- **触发**：写派发说明或整理回传。
- **结果**：只给指针与结论，不复述原文、不重复读已读内容；事实外置成可回读原件；回传给原件指针；授权与失败边界不省。
- **回写**：派发与回传的字节对比、原件指针回读记录在任务库。

### SCN-007：两项外部采用登记

- **角色**：维护者、来源 owner 与后续读者。
- **前提**：仓内两项外部工作零条目；来源坐标与许可已核实。
- **触发**：读登记找来源，或维护者更新来源。
- **结果**：`skills/catalog.yaml` 的 absorbed 条目、`THIRD_PARTY_NOTICES.md` 的版权与采用说明、`skills/reuse-registry.md` 的索引各就位；`orchestrate.md` 的 commit 为 null，按既有口径写未证实，不编造 pin。
- **回写**：拒绝项逐条有理由与来源行号（R1–R6）。

### SCN-008：字节与成本分面

- **角色**：build-code 实施者、verify-code 验收者与后续卡作者。
- **前提**：常驻三文件当前合计 36,849 B，既有断言上限 36,861 B，余量 12 B。
- **触发**：本卡正常写入 `AGENTS.md` 与 `GLOSSARY.md`。
- **结果**：可控面（派发说明与回传摘要）相对开工基线逐项记录实际增减；常驻面逐文件单列实际增减且不作不增承诺；宿主注入面 `not_reported`；主会话成本四组分列，缺项 `unavailable`／`not_reported`；既有常驻预算断言预计为红并如实报告。
- **回写**：开工基线在动手前保存；字节与成本原件落任务库。

### SCN-009：与 N6 的共享文件

- **角色**：本卡实施者与 N6 后续实施者。
- **前提**：`AGENTS.md`、`skills/deep-research/SKILL.md`、`skills/catalog.yaml`、`THIRD_PARTY_NOTICES.md`、`skills/reuse-registry.md` 五处与 N6 重叠；本卡先合（D-028）。
- **触发**：本卡先写这五处；N6 后写。
- **结果**：五处各只由本卡一个 writer 写入；N6 后写时逐处读回并保全本卡内容；若 N6 先动，按真实 HEAD 与真实 diff 对账（OI-021）。
- **回写**：逐文件 `git diff` 与读回记录在任务库。

### 状态覆盖清单

- [x] **默认态**：SCN-001／SCN-002；两类派发各回一次。
- [x] **空态**：SCN-003；未取得字段在该位置写「未取得」及原因，不留空。
- [x] **错误态**：SCN-003；引用不可读、状态词不在既有语义内均可在固定位置指出。
- [ ] **加载态**：N/A — 本卡只改文本与登记，无加载视图或异步状态。
- [x] **取消态**：SCN-004；取消回「已做与未做」的真实界线。
- [x] **边界态**：SCN-005；历史材料、工具自身能力上限与 `docs/adr/0034` 不属本卡范围。
- [ ] **权限态**：N/A — 本卡不改权限、认证或授权模型；共享文件写者规则保留。
- [x] **竞态**：SCN-009；五处共享文件由唯一当次 writer 串行，N6 后写读回保全。

## 4. 产品事实与假设（PFACT）

- **PFACT-001**：`AGENTS.md:20` 含「五阶段共用并发区间为 2–5」与指向「build-plan 的当前并行方案」的指针；`workflows/build-plan/SKILL.md` 无「并行方案」节（56 行全文、标题清单实读；`rg -n '并行方案' workflows/build-plan/SKILL.md` 无匹配）。
  - **状态**：`verified`
  - **证据或来源**：本次实读 `AGENTS.md:20`、`workflows/build-plan/SKILL.md:7-54`。
  - **关联**：FR-N5-003、AC-N5-004、RISK-04。
- **PFACT-002**：`skills/deep-research/SKILL.md:36`「最多 4 个独立上下文子代理」与 `:82` 表格「最多 4 个，来源包隔离」是两处并发硬上限。
  - **状态**：`verified`
  - **证据或来源**：本次实读该文件第 36、82 行。
  - **关联**：FR-N5-003、AC-N5-004。
- **PFACT-003**：既有常驻预算断言取 `AGENTS.md`、`CLAUDE.md`、`GLOSSARY.md` 三文件合计，上限 36,861 B；当前合计 36,849 B（11,253＋1,081＋24,515），余量 12 B。
  - **状态**：`verified`
  - **证据或来源**：`tests/contract/delivery-closeout-charter-contract.test.mjs:15-16`、`:69-73`；`wc -c` 实测。
  - **关联**：FR-N5-006、AC-N5-008、RISK-01。
- **PFACT-004**：既有派发与回传规则的真实位置：`AGENTS.md:15`、`:16`、`:19`、`:20`、`:21`；`workflows/build-code/SKILL.md:13-17`；`skills/stage-handoff/SKILL.md` 的 13 区块；`skills/wh-review/SKILL.md:44` 的八类冻结字段。
  - **状态**：`verified`
  - **证据或来源**：本次逐文件实读；五族逐族见第 12 节表。
  - **关联**：FR-N5-002、FR-N5-007、AC-N5-007。
- **PFACT-005**：`skills/catalog.yaml` 的 absorbed 外部采用登记在 `capability_decisions`（节起 `:1101`），每项含 `name`、`status`、`purpose`、`design_idea`、`used_by_stages`、`local_path`、`upstream[]`（`github_url`／`commit`／`license`／`reviewed_at`／`review_outcome`／`path`／`skill_url`／`adopted[]`，固定 commit 的来源另有 `commit_url`；pstack 行按既有口径无 `commit_url`）、`local_changes`、`dependency_closure`、`update_policy`；`context-engineering` 与 `orchestrate.md` 两词在 catalog 零条目（两次 `grep -n` 均 exit 1）。
  - **状态**：`verified`
  - **证据或来源**：`skills/catalog.yaml:1101` 起及 `:1624-1767` 的 absorbed 既有条目（条目头在 `:1624`）；两次 grep。
  - **关联**：FR-N5-005、AC-N5-010。
- **PFACT-006**：`THIRD_PARTY_NOTICES.md` 的既有形状为「MIT-licensed sources」下的每源一条 bullet（版权行有两种写法：`Copyright (c) YEAR Holder.` 与 `copyright © YEAR Holder`；个别条目无版权行，只给来源链接），pstack 条目在 `:16`；`skills/reuse-registry.md` 的 N4 采用索引表头为「条目｜采用或复用动作｜既有正文入口」（`:62`）；两文件对两项外部工作零条目。
  - **状态**：`verified`
  - **证据或来源**：本次实读两文件；两次 `grep -n` 均 exit 1。
  - **关联**：FR-N5-005、AC-N5-010。
- **PFACT-007**：`GLOSSARY.md` 250 行、60 条、9 个主题组，条目形如 `**术语**：一句定义。` 加 `_Avoid_: …`；无「并发」「派发」条目；`tools/cli/verify-structure.mjs:93-106` 要求含五个阶段术语且不含 denylist（`Wish,Dispatcher,harness,host,checkpoint,runtime,metering,observability,email-reply`）。
  - **状态**：`verified`
  - **证据或来源**：本次实读 `GLOSSARY.md`、`tools/cli/verify-structure.mjs:15-16`、`:93-106`。
  - **关联**：FR-N5-003、FR-N5-002、AC-N5-004、RISK-05。
- **PFACT-008**：两项外部来源坐标：`context-engineering` 为 `addyosmani/agent-skills` 固定 commit `aeac41d4d005999432bb7312f7ff06383a91d59d`、路径 `skills/context-engineering/SKILL.md`、sha256 `8b736cb9e55b82b265ab6ff78349c0e826e8a6df550deddf665b7fb3ff858b63`、MIT；`orchestrate.md` 为 `backnotprop/pstack`、上游 commit 未证实（catalog 既有口径写 `unresolved-pstack-content-snapshot`，不写 commit URL）、路径 `skills/poteto-mode/playbooks/orchestrate.md`、sha256 `d42b4375f1bd4ce23da0b575a198571a2117df7eea10c3c9fc6d92ae1053f7be`、MIT、包 sha256 `f08746cbd6067834e095332d0a25bdec65529dcfc436809c2cb419717d0363b8`。
  - **状态**：`verified`
  - **证据或来源**：外部参考包 `manifest.json` 两项 `version_provenance`；`skills/catalog.yaml:24-52`；任务库 `quality/evidence/decision-log-refs/direction-review-objective-facts.md:47-48`（`research-candidates.md:140` 只有相对路径，不含 sha256/commit）。
  - **关联**：FR-N5-005、AC-N5-010。
- **PFACT-009**：实施类真实派发会在 build-code 出现（实施子代理产生仓库改动或任务库外置原件）。
  - **状态**：`inferred`
  - **证据或来源**：推断 — 依据 `AGENTS.md:15-16` 的重活委派与 `workflows/build-code/SKILL.md` 的派发方法；本阶段尚无该样本。
  - **负责人、影响**：build-code 实施者；影响 AC-N5-001 的实施类字段证据与 AC-N5-003 的取消/修复证据。
  - **关联**：FR-N5-002、AC-N5-001、AC-N5-003、OPEN-01。
- **PFACT-010**：本卡正常写入后常驻三文件合计将超过 36,861 B 上限。
  - **状态**：`inferred`
  - **证据或来源**：推断 — 依据 PFACT-003 的 12 B 余量与本卡拟新增文本（远超 12 B）；实际字节由 build-code 实测。
  - **负责人、影响**：build-code 测量；影响 AC-N5-008 与既有预算断言的交付状态（红因归属 N6 未执行的删除）。
  - **关联**：FR-N5-006、AC-N5-008、RISK-01。
- **PFACT-011**：可控面（`AGENTS.md` 派发段与回传要求）预计净增，难以在 D-008 的削减范围内做到「相对开工基线不增」。
  - **状态**：`inferred`
  - **证据或来源**：推断 — 依据拟新增合同文本（约 1.2–1.5 KB）与本卡可删文本（`:20` 末句约 0.15 KB、deep-research 两处硬上限约 0.05 KB）；实际字节由 build-code 实测。
  - **负责人、影响**：build-code 测量；影响 AC-N5-008 的可控面条件与是否需用户选择进一步削减。
  - **关联**：FR-N5-006、AC-N5-008、RISK-02。
- **PFACT-012**：本卡无 UI 面：写集为 5 个 `.md` 与 1 个 `.yaml`，认证工作区无 `apps/`、无 `.tsx`/`.vue`/`.jsx` 源文件。
  - **状态**：`verified`
  - **证据或来源**：写集表；`ls apps` 报不存在；`find . -maxdepth 2 -name '*.tsx'` 无结果。
  - **关联**：测试标准「浏览器可见面 N/A」。
- **PFACT-013**：同 cohort 连续 N≥3 的成本样本无法在本卡内取得（本卡只产生 build-plan 与 build-code 两次观测）。
  - **状态**：`unknown`
  - **证据或来源**：本卡只有一次 build-plan 窗口；N≥3 需其它同 cohort 任务。未取得，不补造。
  - **负责人、影响**：后续同 cohort 卡与 verify-code；影响 AC-N5-009 的回归判据只能报单次观测。
  - **关联**：FR-N5-006、AC-N5-009、OPEN-03。
- **PFACT-014**：三种异常回传（缺字段／引用不可读／状态词不在既有语义内）本次未取得真实样本。
  - **状态**：`unknown`
  - **证据或来源**：任务库 `research-candidates.md:173` 如实记录；D-014 与 D-023 约定取得顺序。
  - **负责人、影响**：build-code 实施者；影响 AC-N5-002 的样本证据。
  - **关联**：FR-N5-002、AC-N5-002、OPEN-02。

## 5. 功能需求

### 派发与回传合同（N5-001—N5-004）

`AGENTS.md` 派发段是派发说明与回传要求的唯一权威；研究、实施、检索三类「派活干活」共用一份回传合同；审查回传与跨阶段交接保留各自冻结合同。术语「派发与回传合同」「并发」在 `GLOSSARY.md` 定义，供读者共用同一语言。

- **FR-N5-001**：派发说明必须写四要素与三处缺口，并保住授权与失败边界。
  - **范围边界**：目标是目标与范围、边界是不做什么与允许写集、输入引用是既有 spec/Phase/研究原件与提交、可检查结果是本次要核对的产物、命令或事实；三处缺口为可检查结果、任务重点靠后（本次目标、当前失败或文件、允许写集放末尾）与上游结论中继（依赖下游时给上游原件路径与最小必要结论）。篇幅随活缩放：只涉及一个文件且不新增对外行为的改动可压成一段但仍含目标、边界、可检查结果与回传形状；超出则完整写。摘要保目标、最新决定、未解风险、当前路径与原件引用；授权、失败边界与证据规则不得省掉。既有「折叠成路径＋exit_code＋结论清单」「修复回原实施会话」两条不重写，用指针引用（D-013）。
  - **依据**：D-019、D-030、D-034、D-035；R-002／R-004／R-007；US-05。
  - **场景**：SCN-001、SCN-002、SCN-006。
  - **验收**：AC-N5-001、AC-N5-012。
- **FR-N5-002**：回传按固定六项开头，并按研究/实施两类补字段；缺项有固定报法。
  - **范围边界**：六项顺序固定为任务、结论与状态、已做与未做、产物或原件引用、失败与限制、下一消费者动作；正文随后且不重述状态。研究类加来源与覆盖（来源到 `路径:行号`，覆盖分列查了／没查／为什么）；实施类加改动路径、命令与退出码。未取得字段写「未取得」及真实原因，不留空、不删字段、不用占位；状态词只用既有语义（可用／部分／不可用、未取得、不适用），不新增枚举、schema 或运行时状态。取消回「已做与未做」的真实界线；有效问题回原实施会话修复，原会话不可用如实披露；缺可选事实时安全部分继续。回传不强制落盘，但必须给可回读的原件指针。
  - **依据**：D-012、D-022、D-035、D-023、D-036、D-004；R-004／R-005／R-006；US-04。
  - **场景**：SCN-001、SCN-002、SCN-003、SCN-004。
  - **验收**：AC-N5-001、AC-N5-002、AC-N5-003。
- **FR-N5-003**：活动治理文件不设并发数字与悬空指针，也不留替代判据；旧记录只披露不覆写。
  - **范围边界**：全仓活动治理文件（`AGENTS.md`、`CLAUDE.md`、`GLOSSARY.md`、`README.md`、`docs/*.md` 非 archive、`workflows/**/SKILL.md`、`skills/**/SKILL.md`、`skills/catalog.yaml`）不再有并发数字声明，也不再有指向不存在方案的指针。保留防冲突写者规则（`AGENTS.md:21`、`workflows/build-code/SKILL.md:15`）与工具自身能力上限（`skills/anysearch` 的批量请求数）。已交付旧任务材料、`docs/adr/0034` 与其它历史记录不覆写、不加标注；`docs/adr/0034` 的并发决定不再与规则文件一致这一事实，在决策日志（已有 D-033）与交付说明各写一句。`GLOSSARY.md` 的「并发」条目解释「不设数值上限、由各阶段按真实独立输入与互斥写面临场决定」。
  - **依据**：D-003、D-006、D-010、D-015、D-016、D-025、D-033、D-037；R-003；AC-T6-2 词条。
  - **场景**：SCN-005。
  - **验收**：AC-N5-004、AC-N5-005。
- **FR-N5-004**：进入面纪律只让指针与结论进入主上下文。
  - **范围边界**：派发与回传不复述材料原文、不重复读已读过的内容；事实外置成可回读原件，回传给原件指针；主会话不自行压缩自身上下文（宿主无该能力，D-021 已退役原动作），也不以容量百分比触发；替换方案是「进入面纪律」。`GLOSSARY.md` 的「派发与回传合同」条目承载共同口径。授权与失败边界不得省。
  - **依据**：D-013、D-020、D-021、D-035；R-007；退役登记。
  - **场景**：SCN-006。
  - **验收**：AC-N5-012、AC-N5-001。

### 外部采用与拒绝清单（AC-N5-010 的唯一清单）

采用项与拒绝项以任务库 `quality/evidence/decision-log-refs/research-candidates.md` 的逐条来源行号为原 ref；本节只给落点与一句理由。

| 采用项 | 本地落点 | 理由（一句） |
| --- | --- | --- |
| A2 任务重点靠后 | `AGENTS.md`「### 派发与回传」 | 把本次目标/当前失败/写集放在末尾，贴近生成点 |
| A3 原始输出折成路径＋退出码＋结论 | 既有 `AGENTS.md:16` 与 build-code context pointers（指针引用） | 既有做法显式化，补「何时剪」 |
| A4 保护当前失败/约束/任务定义 | `AGENTS.md`「### 派发与回传」 | 压缩前保授权与失败边界不丢 |
| B1 依赖即内容中继 | `AGENTS.md`「### 派发与回传」 | 给上游原件指针与最小必要结论，防下游猜 |
| B2 brief 随单元缩放 | `AGENTS.md`「### 派发与回传」 | 微动作不套完整模板，防 4KB scaffold |
| B3 只报可核事实与真实进展 | 回传六项（失败与限制、已做与未做） | 状态、路径、退出事实、未做与偏差 |
| B4 修复回原实施会话 | 既有 `AGENTS.md:20` 与 build-code（指针引用） | 实施现场与授权链在原会话 |

| 拒绝项 | 理由（一句） | 来源行号 |
| --- | --- | --- |
| R1 75% 容量触发剪裁 | 本仓无可核窗口占用读数，会变成隐形门 | `context-engineering/SKILL.md:202` |
| R2 常驻 preferences.md 寄存器 | 撞「不新增常驻层/不改宿主注入」边界 | `orchestrate.md:25,49` |
| R3 store/ledger/frontier/status | 会成第二进度权威 | `orchestrate.md:21-32` |
| R4 默认重开新子代理 | 与「修复回原实施会话」相反 | `orchestrate.md:56`；`context-engineering/SKILL.md:117` |
| R5 整份粘贴上游报告 | 制造第二份事实、膨胀上下文 | `orchestrate.md:41-42`；`build-code/SKILL.md:17` |
| R6 TIMEBOX 到点停与 frontier tick | 时间不构成停止条件；本仓无 frontier | `orchestrate.md:45,71`；`docs/standard-workflow.md:55` |

### 外部采用、减法与交付（N5-005—N5-007）

- **FR-N5-005**：两项外部做法按采用项落地、按拒绝项留理由，并在三处登记。
  - **范围边界**：`context-engineering` 采用剪除与保护纪律（任务重点靠后、原始输出折成路径＋退出码＋结论、保护任务定义/当前失败/约束、指针不复述）；拒绝 75% 容量触发、常驻寄存器、默认新会话。`orchestrate.md` 采用适量 brief、依赖即内容中继、真事实进展与修复回原会话；拒绝 store/ledger/frontier、TIMEBOX 到点停审、tick 唤醒、默认重开子代理、整份粘贴上游报告。登记落 `skills/catalog.yaml` 的 absorbed 条目（来源仓、相对路径、固定版本、许可、采用简述、取回坐标）、`THIRD_PARTY_NOTICES.md` 的版权与采用说明、`skills/reuse-registry.md` 的索引。`orchestrate.md` 的 commit 为 null，按既有口径写未证实并给包 sha256，不编造 pin。
  - **依据**：D-027；R-009；AC-T6 采用条目；外部 `manifest.json`。
  - **场景**：SCN-007。
  - **验收**：AC-N5-010。
- **FR-N5-006**：每条删除或合并有可核理由；字节与成本分面披露。
  - **范围边界**：理由限于 token 与召回成本、副本漂移、权威冲突三类可核事实，不用「重复同句必然伤注意力」这类无依据论断。字节分三面：可控面＝两段具名规则文本（`AGENTS.md` 派发段、`deep-research` 的 R2 段）与 P1/T003 的实际派发说明/回传原件字节，相对开工基线逐项比较（载荷基线缺失记 `unavailable`）且不增；常驻面（`AGENTS.md`、`CLAUDE.md`、`GLOSSARY.md`）逐文件单列增减，不作不增承诺；宿主注入面 `not_reported`。成本四组：墙钟；input／output／cacheRead；步骤与轮次；子代理与命令调用数；缺项 `unavailable`、provider 未报 usage 记 `not_reported`。回归判据为 cacheRead 与墙钟均不劣化且 steps 或 cacheRead 至少一项下降，同 cohort 连续 N≥3；本卡只贡献一次观测，不能宣称 N≥3 达标。完整 N1 的对照报告不在本卡消费范围，终验读取时若未取得记 `unverified`。字节分母与范围不改：不把改动搬到未统计文件、不丢既有约束、不改分母。开工基线在动手前保存，不整目录快照。
  - **依据**：D-005、D-018、D-024、D-026；R-010；US-13；G1。
  - **场景**：SCN-008。
  - **验收**：AC-N5-006、AC-N5-008、AC-N5-009。
- **FR-N5-007**：五处共享文件串行合入，五族旧回传逐族说明。
  - **范围边界**：`AGENTS.md`、`skills/deep-research/SKILL.md`、`skills/catalog.yaml`、`THIRD_PARTY_NOTICES.md`、`skills/reuse-registry.md` 五处与 N6 重叠，本卡先合；N6 后写时逐处读回并保全本卡内容；若 N6 先动，按真实 HEAD 与真实 diff 对账（OI-021），不硬套约定。旧回传五族逐族写明：主会话检索回传、派发继承载荷、研究回传并入统一合同；审查回传（八类冻结字段）与跨阶段交接（13 区块与固定发布口）保留，理由为既有冻结字段与固定发布口。`shared 路径先交接` 沿用既有写者规则（`AGENTS.md:21`、`workflows/build-code/SKILL.md:15`），本卡不重写。该清单进入 spec 与交付说明。
  - **依据**：D-002、D-028、D-032；R-003／R-005；AC-T6-3 词条。
  - **场景**：SCN-005、SCN-009。
  - **验收**：AC-N5-007、AC-N5-011。

## 6. 模块划分

| 模块 | 负责什么 | 对外提供什么 | 依赖谁 | 交付验证 |
| --- | --- | --- | --- | --- |
| 派发说明 | 决定派发时给什么、排什么顺序、多长 | 可执行的派发说明写法 | `build-code` context pointers 段的既有表述 | 真实派发样本的字段与顺序 |
| 回传合同 | 决定回传的固定字段、缺项报法与两类补充字段 | 一张可机械读缺项的回传形状 | 派发说明与既有语义 | 两类真实派发＋三种异常 |
| 并发权威 | 决定「不设数字上限」与写者规则边界 | 全仓无可引用的并发数字，也无悬空指针 | 现有规则文件 | 全仓检索与逐处清单 |
| 进入面纪律 | 决定什么不得进入主上下文 | 指针＋结论的进入面规则 | 派发说明与回传合同 | 字节对比与原件指针回读 |
| 采用登记 | 决定两项外部做法如何被引用与更新 | 三处可核登记条目 | 前四个模块的最终文本 | 三处登记与来源坐标 |

依赖单向：派发说明 → 回传合同 → 进入面纪律；并发权威独立；采用登记最后并依赖前三者的最终文本。

## 7. 关键实体

- **回传合同（六项）**：字段顺序固定、每项非空或写「未取得」及原因；研究类加「来源」「覆盖」，实施类加「改动路径」「命令」「退出码」。
- **并发权威**：不是新对象，而是「活动治理文本中不存在数字声明与悬空指针」这一可检索事实；写者规则与工具能力上限是它保留的两个例外。
- **采用登记条目**：`catalog` 的 absorbed 行（`name`、`status`、`purpose`、`design_idea`、`used_by_stages`、`local_path`、`upstream[]`、`local_changes`、`dependency_closure`、`update_policy`）、notices 的 bullet、registry 的表格行；三处指向同一来源事实，权威在 catalog。
- **术语条目**：`**术语**：一句定义。` 加 `_Avoid_: …`；只收本项目特有概念。

## 8. 数据和生命周期

N/A — 本卡不新增持久数据、服务或缓存。产生的事实为任务库外置原件（`quality/evidence`、`quality/tests`、`quality/reviews`）与仓库文本；历史原件与旧材料不覆写、不删除。

## 9. 兼容性预留

- **既有消费方**：`AGENTS.md:15/16/19/21/22/23` 的既有规则、`workflows/build-code/SKILL.md:13-17` 的 context pointers、`skills/stage-handoff/SKILL.md` 的 13 区块、`skills/wh-review/SKILL.md:44` 的八类冻结字段、`skills/catalog.yaml` 的既有条目与 `skills[]` 形态保持。
- **命名预留**：不新增 public runtime 命令、schema 或持久对象；不新增第七回传族；回传状态沿用既有语义。
- **容器预留**：N/A — 不新增容器或目录；证据落既有任务库目录。
- **状态预留**：不新增状态机或枚举；回传的「可用／部分／不可用、未取得、不适用」是既有语义。
- **扩展边界**：本卡只到规则文本与来源登记；后续替换 consumer 时必须保全已交行为，N6 后写读回保全。

## 10. 明确不做与默认必须成立

### 明确不做

以下非目标来自 decision-log 的范围与非目标节，逐条继承；上游已接受的排除不重复展开。

- 不建 dispatcher、store、账本、状态机或第二进度权威（`prd.md:378`、`prd.md:263`）：会把派发变成第二套进度权威。
- 不把回传检查接入 stage、gate 或 CI 失败路径（母决策日志 `decision-log.md:469`）：检查只报告，不作许可证。
- 不新增第八公共 runtime 命令、schema、常驻服务或持久进度对象：公共面保持七类。
- 不新增 `check-agent-return.mjs` 一类机械 CLI：无复用消费者不加；若将来真需复用，先登记 owner、真实 consumer、替代关系与删除条件（D-004／`prd.md:263`）。
- 不改宿主全局注入与宿主全局技能目录（`prd.md:390`、母决策日志 `decision-log.md:488`）：不在本卡可控范围；宿主注入面只披露 `not_reported`。
- 不搬 pstack 的 store／ledger／frontier／tick／TIMEBOX 停审／默认新 spawn，也不搬常驻 `preferences.md` 寄存器：与既有「不空转轮询」「修复回原会话」「不新增常驻层」相反。
- 不宣称成本节省（`prd.md:385`）：未消费完整 N1 对照前保持未测；本卡只给单次观测。
- 不做「主会话自行剪裁上下文」（D-020／D-021）：当前宿主无该能力，改以进入面纪律承接；若将来宿主提供压缩能力需重新评估。
- 不清已交付的旧任务材料与外部工具自身上限（D-015／D-016）：避免覆写历史与改动真实工具能力。
- 不改两个既有检查（D-018）：常驻字节上限检查与旧验收测试的处置不归本卡，只如实记录事实。
- 不重写既有两条做法（D-013）：「把重活原始输出折成路径＋退出码＋结论清单」与「修复回原实施会话」保持原表述，只补缺口。
- 不建第二份术语真相、不新增第七回传族、不改 `CLAUDE.md`、`docs/standard-workflow.md`、`workflows/build-code/SKILL.md`、`skills/stage-handoff/SKILL.md`、`skills/wh-review/SKILL.md`。

### 默认必须成立

- 既有读者（五阶段派发者、研究技能读者、catalog/notices/registry 读者、术语读者）在改动后仍能找到原规则与来源；冻结合同与固定发布口不变。
- 回传的状态词只用既有语义；缺项写「未取得」及原因；结构齐全不等于质量通过，结论真实性由独立来源观察。
- 写共享文件的唯一当次 writer 规则与 `shared 路径先交接` 沿用既有表述：`AGENTS.md:21` 与 `workflows/build-code/SKILL.md:15`；本卡不重写、不去掉。
- 历史材料、旧审查、旧决定记录保持只读；本卡的新事实只进当前材料与 task facts。
- 字节分母与范围不改：不把改动搬到未统计文件、不丢既有约束、不改分母；开工基线在动手前保存。
- 未测、不可用、缺失分别记 `unavailable`／`incomplete`／`missing`，不写成 pass。

## 验收流程

从当前 decision-log 的 `## 验收面` 交接索引取可观察接口与成功/失败边界；每个场景入口依次定位 FR、`Appendix A` 的 `AC-N5-00N`、所属 Phase 的 `gate_cmd` 与可回读证据；需要原件时按 decision-log「外置事实索引」的到达条件读取唯一原 ref。本节只描述流程，不复制 AC 判据。

## 测试标准

按本任务自行声明测试面如下。每个要测的面与覆盖 AC 都指向所属 Phase 的一条可执行命令；精确命令与证据路径只在各 Phase 维护。判定前，材料作者与独立验收者读 `docs/architecture/test-asset-governance-rules.md#验收标准可执行形式der-01der-11r-001fr-16ac-16` 的真实好坏例、同尺、独立判定与匿名不自判要求；样本与判定身份留本任务原件，本节不复制第二标准。

| 测试面 | 适用性 | oracle | 证据类型 | 覆盖边界 | 覆盖 AC |
| --- | --- | --- | --- | --- | --- |
| 规则文本面（`AGENTS.md` 派发段、`GLOSSARY.md`） | 测：静态内容断言（字段名在场、禁止词缺席） | ORACLE-N5-RULES | 命令、cwd、exit、原始输出 | 只证明文本在场/缺席，不证明读者理解或执行 | AC-N5-001、AC-N5-002、AC-N5-004、AC-N5-012 |
| 研究技能文本面（`skills/deep-research/SKILL.md`） | 测：并发上限缺席、回传对齐在场 | ORACLE-N5-RESEARCH | 命令与原始输出 | 只证明该文件文本；不证明研究执行质量 | AC-N5-001、AC-N5-004 |
| 来源登记面（catalog、notices、registry） | 测：YAML 解析、必需字段、三处交叉与坐标 | ORACLE-N5-SOURCES | 解析输出与字段读回 | 只证明登记形状与坐标；不证明方法效果或许可适用性 | AC-N5-010 |
| 字节与常驻面 | 测：逐文件 `wc -c` 与 sha256 对比、既有预算断言实际结果 | ORACLE-N5-BYTES | 基线原件、收尾原件、测试原始输出 | 不证明宿主注入面；不证明常驻面不增 | AC-N5-008 |
| 成本观测面 | 部分测：stage 末既有测量入口；四组分列 | ORACLE-N5-COST | 测量入口输出原件 | 本卡只一次观测，N≥3 未达；不证明节省 | AC-N5-009 |
| 并发权威扫描面 | 测：全仓活动治理文件扫描与逐处清单 | ORACLE-N5-BYTES（同 gate 的扫描部分） | 命令、exit、hit 清单 | 只证明扫描集合内无数字/悬空指针，不证明语义理解 | AC-N5-004、AC-N5-005 |
| 派发合同执行面 | 「只能人读」：两类真实派发、三种异常、取消与修复、进入面纪律 | ORACLE-N5-DISPATCH | 派发记录、回传原件、字节对比、会话身份事实 | 结论真实性不可机械证明；构造件与真实样本须分列 | AC-N5-001、AC-N5-002、AC-N5-003、AC-N5-012 |
| 减法与五族面 | 「只能人读」＋可核 diff：逐条理由与逐族说明 | ORACLE-N5-G1 | 写集 diff、来源原 ref、清单 | 不证明读者认同；不替代质量裁决 | AC-N5-006、AC-N5-007 |
| 共享文件与交付面 | 测：逐文件 `git diff --name-only` 与读回；交付说明文本 | ORACLE-N5-HANDOFF | diff 原件、读回记录、交付说明 | 不证明 N6 后续不会覆盖；只证明本卡当次 | AC-N5-005、AC-N5-011 |
| 浏览器可见面 | N/A — 写集无页面/组件，认证工作区无 `apps/` 与 `.tsx`/`.vue`/`.jsx` | — | — | — | — |
| 数据库与服务面 | N/A — 本卡不改数据、服务、权限或部署 | — | — | — | — |

### 验收对象

本节填当前规格的实际验收对象数据；`ok=true` 只表示最小输入存在，不证明环境健康、业务通过或计划获批。三项 UI 事实均经实读核为 false：原始要求（本文件与 decision-log R-002／R-004／R-007）只涉规则文本与派发合同；项目库存（本次实读）无 `apps/`、无前端框架源文件；已接受计划或实际前端改动为零。因此选 CLI 对象分支。

```json
{
  "workspace": "/Users/Hugh/Hugh/Project/workflowhub-n5-subagent-dispatch-context-20261019",
  "state": { "execution": "not_run", "stage": "build-plan", "phase": "P5" },
  "cli": {
    "command": "node --input-type=module -e \"import assert from 'node:assert/strict'; import fs from 'node:fs'; const s=fs.readFileSync('specs/n5-subagent-dispatch-context-20261019/spec.md','utf8'); assert.ok(s.includes('AC-N5-001')); assert.ok(s.includes('Appendix A'));\"",
    "entry_ref": "draft_spec#/实现设计（全局权威）",
    "sample_ref": "real_research_return#/结论与状态",
    "oracle_ref": "appendix#/AC-N5-001"
  },
  "owner": "用户"
}
```

三源引用与实读范围：`raw_requirement` 取父 PRD N5 卡与本任务 decision-log R 表（已读 `prd.md:375-392`、`decision-log.md:35-57`）；`project_inventory` 取本次有界盘点（`ls`、`find`、`package.json` 与 `skills/` 结构）；`planned_or_changed_frontend_fact` 取本规格写集与第 10 节非目标（无 UI）。checker 的实际调用、返回与执行原件见任务库 `quality/tests/` 的本次对象检查原件。

## 架构边界

产品边界：`AGENTS.md` 派发段是派发说明与回传要求的唯一权威；`GLOSSARY.md` 只定义术语；`skills/deep-research/SKILL.md` 只补研究分支的并发与回传；三处登记只记录来源事实。工程边界：不新增 runtime 模块、命令、schema、适配器或持久对象；不改变 `workflows/build-code/SKILL.md`、`skills/stage-handoff/SKILL.md`、`skills/wh-review/SKILL.md` 的既有合同。真实消费者是五阶段主会话、子代理与规则读者，以及 `skills/catalog.yaml` 的登记读者。

## 实现设计（全局权威）

### 代码锚点

- **来源边界**：PRD 与 decision-log 只作来源映射；本设计不再造需求账本。
- **现状与目标差异**：现状是回传散落、并发数字与悬空指针、两项外部零登记；目标是同一合同、无数字无指针、三处登记。读取顺序：`AGENTS.md:11-25` → `workflows/build-code/SKILL.md:13-17` → `skills/deep-research/SKILL.md:32-38`、`:75-84` → `skills/catalog.yaml`（结构头 `:1-52`、`capability_decisions:1101` 起、条目样例 `:1641-1767`）→ `THIRD_PARTY_NOTICES.md:1-49` → `skills/reuse-registry.md:1-78` → `GLOSSARY.md:1-250`。
- **代码锚点**（符号/行号；行号是生成时刻快照，会漂移，不作契约）：
  - `AGENTS.md:19`（继承摘要 ref＋sha256＋≤500 字）、`:20`（并发区间与并行方案指针，本次删除末句）、`:21`（写者规则，保留）、`:15`、`:16`（重活委派与扫描回传口径，保留）。
  - `workflows/build-code/SKILL.md:13-17`「Task graph 与 context pointers」：四要素中目标、边界、输入引用与「不复制指针全文」「主会话收实际结果与原 ref」「修复回原实施会话」的既有落点；本卡只指针引用。
  - `skills/deep-research/SKILL.md:34-38`（R2 并行深读与返回字段）、`:75-84`（工具路由表 `:82` 行）；改写锚点为 `:36` 与 `:82`，回传对齐追加在 R2 的返回句之后。
  - `GLOSSARY.md:52-86`「材料与交付拆分」之后新增「### 派发与协作」组；条目格式沿用 `:9-10` 与 `:161-162`。
  - `skills/catalog.yaml:17-52`（`projects` 的 `addy-agent-skills` 与 `pstack` 已有仓库、commit、license）、`:1101` 起 `capability_decisions`、`:1641-1767` 的 N3 absorbed 条目样例（含 `local_path`、`upstream[]`、`local_changes`、`dependency_closure`、`update_policy`）。
  - `THIRD_PARTY_NOTICES.md:5-19`（MIT 源 bullet 列表）、`:31-43`（完整 MIT 文本，只在一次保留）、`:44-49`（N3 采用说明段，沿用其「P3 在…吸收…」写法）。
  - `skills/reuse-registry.md:3`（catalog 为登记权威）、`:60`（N4 索引只回 catalog）、`:62-78`（N4 采用索引表）。
  - 既有检查（只读、不改）：`tests/contract/delivery-closeout-charter-contract.test.mjs:15-16`、`:45-47`、`:69-73`（常驻预算 36,861 B；AGENTS 与 CLAUDE 必须含 `docs/delivery-closeout-charter.md`）、`tools/cli/verify-structure.mjs:15-16`、`:93-106`（GLOSSARY 五段术语与 denylist）、`tests/contract/business-repo-experience-file.test.mjs:28-51`（五文件不得引用 `Improvements.md`）、`tests/acceptance/card-03-current.mjs:440-473`、`:547`（HEAD 上已不可满足的历史断言，本卡不动）。
- **运行条件**：Node ESM＋vitest 2.1.9＋js-yaml 4.1.0（`package.json`）；`node tools/cli/check-skill-consistency.mjs --root <绝对包根>` 是既有闭包检查；`validatePostPhaseContract({spec,index,phases})` 由 `runtime/stage/stage-content-contracts.mjs:413` 导出、在 `tools/cli/stage-runtime.mjs:568`、`:611` 被真实调用，无独立 CLI。

### 接口与失败语义

- **选择的架构方案**：复用既有规则文件、既有来源登记与既有检查；只在 `AGENTS.md` 增加一个「派发与回传」小节、在 `GLOSSARY.md` 增加一个术语组、在 `deep-research` 改两处上限并加一句指针、在 catalog/notices/registry 各加一项登记。放弃备选：新建 `check-agent-return.mjs`（D-004：无复用消费者不加）、新建常驻寄存器或词表、把合同拆到五个阶段入口（D-030：会形成第二权威）。
- **模块职责**：派发说明（主会话写）→ 回传合同（子代理读并回）→ 派发者核对（存在性、引用可读、既有语义）→ 必要修复回原会话；采用登记（维护者写）→ 读者回查来源。
- **接口与数据流**：文本接口——`AGENTS.md` 派发段给出四要素、三处缺口、六项与缺项报法、进入面纪律；`GLOSSARY.md` 定义两个术语；`deep-research` 引用合同并删上限；三处登记用既有 YAML/表格形状。无新持久化，无跨模块函数调用。
- **失败语义**：回传缺字段、引用不可读、状态词不在既有语义、取消无界线、原会话不可用、登记缺来源坐标或编造 pin，都明确失败或如实记录；不用不完整事实冒充通过。`orchestrate.md` 的 commit 未证实即写未证实。
- **新增控制面**：N/A — 不新增命令、schema、校验器或运行时状态；既有检查保持原样并如实报告其红绿。

### 落笔文本（P1/T002、P1/T004、P2/T005 的唯一文本）

以下三段是本卡要写入仓库的最终文本；Phase 卡只引用本节，不另写第二份措辞。实现时按此逐字写入，除非实现中发现与真实文件冲突而走真实变更。

`AGENTS.md` 在 `:25` 的 wh-review 句之后、「### 测试硬规则」之前新增：

```text
### 派发与回传

派发说明（brief）写四要素：目标、边界、输入引用、可检查结果；其中目标、边界、输入引用指向 `workflows/build-code/SKILL.md` 的「Task graph 与 context pointers」，一句引用不复述全文。另写三处：可检查结果（本次要核对的产物、命令或事实）；任务重点靠后（本次目标、当前失败或文件、允许写集放在末尾贴近生成点）；上游结论中继（下游依赖上游时给上游原件路径与最小必要结论，不整份粘贴）。篇幅随活缩放：只涉及一个文件且不新增对外行为的改动可压成一段，但仍须含目标、边界、可检查结果与回传形状；超出则完整写。摘要保目标、最新决定、未解风险、当前路径与原件引用；授权、失败边界与证据规则不得省掉。

子代理回传把六项固定写在开头，正文随后且不重述状态：任务；结论与状态；已做与未做；产物或原件引用；失败与限制；下一消费者动作。研究类另写来源与覆盖（来源到「路径:行号」，覆盖分列查了／没查／为什么）；实施类另写改动路径、命令与退出码。任何未取得字段在该位置写「未取得」及真实原因，不留空、不删字段、不用占位。状态词沿用既有语义（可用／部分／不可用、未取得、不适用），不新增枚举或运行时状态。取消时在「已做与未做」写真实界线；有效问题回原实施子代理同一会话修复，原会话不可用如实披露；说明缺可选事实时，已能安全执行的部分继续并记明所缺。

进入面纪律：派发与回传只给指针与结论，不复述材料原文，不重复读已读过的内容；事实外置成可回读原件，回传给原件指针；主会话不自行压缩自身上下文，也不以容量百分比触发。
```

`AGENTS.md:20` 只删末句「五阶段共用并发区间为 2–5，具体每个任务开几个并发在 build-plan 的当前并行方案里逐任务确定。」，其前文保留。

`GLOSSARY.md` 在「材料与交付拆分」组之后、「知识与图谱」之前新增：

```text
### 派发与协作

**并发**：本项目不设并发数值上限，同时进行的工作由各阶段按真实独立输入与互斥写面临场决定，共享文件仍由唯一写者串行处理。
_Avoid_: 并发区间、并行上限、统一并发判据。

**派发与回传合同**：派发时给出目标、边界、输入引用与可检查结果，回传时在开头固定写任务、结论与状态、已做与未做、产物或原件引用、失败与限制、下一消费者动作的共同口径。
_Avoid_: 回传模板、五套回传、子代理格式。
```

`skills/deep-research/SKILL.md` 两处：`:36` 改为「对仍未饱和的问题并行派独立上下文子代理。每个子代理只读分配给它的来源包，返回来源、关键证据、冲突、置信度和未决项；不得共享未验证结论或把同一来源复制成多个独立来源。并行能力不足时串行深读，并记录降级事实。子代理回传按 `AGENTS.md` 的「### 派发与回传」六项固定开头；研究类另给来源与覆盖。」；`:82` 表格行改为「| 外部并行深读 | 独立上下文子代理 | 来源包隔离 |」。

### 全局文件边界与依赖

- **新增**：N/A — 本卡不新增仓库文件；证据原件落任务库既有目录。预写检查用 Phase 内的可执行命令，不新增测试文件。
- **修改**（精确路径，各一份唯一 writer）：`AGENTS.md`、`GLOSSARY.md`、`skills/deep-research/SKILL.md`、`skills/catalog.yaml`、`THIRD_PARTY_NOTICES.md`、`skills/reuse-registry.md`。
- **禁止改动**：`CLAUDE.md`（无派发内容且为常驻文件，D-029／D-030）；`docs/standard-workflow.md`（无并发数字且派发口径一致，D-029）；`workflows/build-code/SKILL.md`（context pointers 已承接，只读指针，D-030）；`skills/stage-handoff/SKILL.md`（交接侧已有等价表述，D-029）；`skills/wh-review/SKILL.md` 及 `contracts/`（八类冻结字段，D-032）；`specs/archive/**`、`docs/archive/**`、`docs/adr/**`（历史只读，D-015／D-033）；`tests/**`（含常驻预算断言 `tests/contract/delivery-closeout-charter-contract.test.mjs` 与历史 `tests/acceptance/card-03-current.mjs`，D-018；其红绿如实报告）；`runtime/**`、`tools/**`、`config/**`、`skills/` 下其它技能。
- **全局依赖**：P1（`AGENTS.md`＋`GLOSSARY.md`）→ P2（`deep-research`，引用 P1 的合同文本）→ P3（三处登记，描述 P1/P2 的最终采用）→ P4（只读核算，消费 P1–P3 的 diff 与基线）→ P5（只读全 AC 复核，消费 P1–P4）。同路径互斥：五处共享文件各只由本卡对应 Phase 写入；N6 后续写入须读回保全（D-028）。
- **文件归属**：P1 唯一持笔 `AGENTS.md`、`GLOSSARY.md`；P2 唯一持笔 `skills/deep-research/SKILL.md`；P3 唯一持笔 `skills/catalog.yaml`、`THIRD_PARTY_NOTICES.md`、`skills/reuse-registry.md`；P4、P5 零仓库写集。
- **回滚与恢复**：T001 在动手前保存六个文件的原始字节（每文件一份唯一原件；此类「随后会被改动」的总字节属证据例外）与 sha256；任一处写坏只恢复该文件该 hunk，不整份 checkout、不覆盖其它改动；历史原件不覆写。

### 需求到任务追踪

本节从当前 `decision-log.md` 的 `## 验收面` 与 R- 编号逐条核对已确认决定；上游 PRD 原件只读对照。每行给来源、原义强度、FR/AC、物理 Phase/Task、同义正反 oracle 与证据；缺原件的行标缺口，不猜补。

| 来源 / 决定（decision-log ID/位置） | 原义行为/强度 | FR / AC | Phase / Task | 正例 + 负例判据 / 证据 | 依赖 / 状态 |
| --- | --- | --- | --- | --- | --- |
| R-008、R-010；D-024、D-026 | 开工前保存基线；字节按面可核 | FR-N5-006 / AC-N5-008 | P1/T001 | ORACLE-N5-RULES：基线六文件可读、当前缺字段断言失败；负例＝无基线或跳读原字节 | 无；planned |
| R-002、R-004、R-007；D-019、D-030、D-034 | 派发四要素与三处缺口、摘要保值、授权边界不省 | FR-N5-001、FR-N5-002 / AC-N5-001、AC-N5-002、AC-N5-012 | P1/T002 | ORACLE-N5-RULES：节标题与六项在场、旧表述缺席；负例＝字段改名或残留「2–5」 | 无；planned |
| R-004、R-006、R-008；D-009、D-012、D-023、D-036 | 两类真实派发、三种异常、取消与修复 | FR-N5-002 / AC-N5-001、AC-N5-002、AC-N5-003、AC-N5-012 | P1/T003 | ORACLE-N5-DISPATCH：样本与回传原件可判；负例＝缺标注或构造件冒真实 | 无；planned |
| R-003；D-006、D-037 | 术语表两条与「不设数字上限」的定义 | FR-N5-003、FR-N5-002 / AC-N5-004、AC-N5-001 | P1/T004 | ORACLE-N5-RULES：两条在场且格式合规；负例＝撞 denylist 或改既有条目 | 无；planned |
| R-003、R-005；D-006、D-013、D-025 | 研究技能删两处上限并对齐回传 | FR-N5-003、FR-N5-002 / AC-N5-004、AC-N5-001、AC-N5-012 | P2/T005 | ORACLE-N5-RESEARCH：无「最多 4」且有合同指针；负例＝数字残留 | P1；planned |
| R-009；D-027 | 两项外部采用的三处登记 | FR-N5-005 / AC-N5-010、AC-N5-011 | P3/T006 | ORACLE-N5-SOURCES：三处登记齐、pstack 无 commit_url；负例＝缺 adopted 或编造 pin | P1、P2；planned |
| R-005、R-010；D-005、D-008、D-018、D-024、D-026、D-032、D-033 | G1 账、五族清单、字节三面、并发扫描、成本条件、旧记录口径 | FR-N5-006、FR-N5-003、FR-N5-007 / AC-N5-004、AC-N5-005、AC-N5-006、AC-N5-007、AC-N5-008、AC-N5-009、AC-N5-011 | P4/T007 | ORACLE-N5-BYTES：三面报告完整；负例＝缺面或基线不可读 | P1–P3；planned |
| R-001…R-013；AC-N5-001…AC-N5-012 | 整卡十二条验收逐条复核 | FR-N5-001、FR-N5-002、FR-N5-003、FR-N5-004、FR-N5-005、FR-N5-006、FR-N5-007 / AC-N5-001、AC-N5-002、AC-N5-003、AC-N5-004、AC-N5-005、AC-N5-006、AC-N5-007、AC-N5-008、AC-N5-009、AC-N5-010、AC-N5-011、AC-N5-012 | P5/T008 | ORACLE-N5-ACCEPTANCE：十二条逐条档位与证据；负例＝未达写 pass | P4；planned |

过程约束（R-001、R-011、R-012、R-013 与 G1 的适用边界）不产生产品 FR：R-001 是阶段纪律，R-011 是依赖事实，R-012 是非目标清单，R-013 是来源读取义务；它们分别由本文件「状态」「来源与决策映射」「第 10 节」「补充材料」承接，不冒充实现任务。US-04／US-05／US-13 已在上表按来源组映射到 FR-N5-001／002／006。

### 全局验证策略

- **验证策略**：每个 Phase 一条可执行 `gate_cmd`；文本面用 Node 内联断言（存在性／缺席／顺序），登记面用 `js-yaml` 解析＋字段断言，字节面用 `wc -c` 与 sha256 对比，共享文件面用 `git diff --name-only` 与逐文件读回。真实派发、异常、取消与修复属「只能人读」面，由未参与写作的读者按原件判定。可执行检查的统一形态是 `node --input-type=module -e`（内联断言）与 `npx vitest run tests/contract/delivery-closeout-charter-contract.test.mjs --reporter=dot`（既有常驻预算断言）。
- **RED/GREEN 设计**：P1／P2 是纯 `.md` 文档改动，按 G-2 不制造目标 RED，给客观替代（改动后静态断言 exit 0；改动前同一断言的实际失败另记「当前失败态」，不称 RED）。P3 含 YAML 写集，不适用 G-2：其内联检查在改动前因「条目不存在」而失败（具名断言失败），改动后同一命令 exit 0，属真实 RED→GREEN；RED 原件在 build-plan 阶段实测保存，GREEN 由 build-code 执行。
- **最终聚合**：P5 逐 AC 消费 P1–P4 的首次结论与原件，只补必要未闭环 case；不新增 AC 首次结论。
- **不能证明的内容**：不证明真实用户长期使用效果、不证明 N≥3 成本回归、不证明宿主注入面、不证明回传结论的真实性；常驻预算断言预计为红，红因归属 N6 未执行的删除。

## Appendix A — 验收判据（唯一权威）

以下每条均 `status: planned`，不是执行事实。每条继承 decision-log 同号原 AC 的条件与强度；`验证：` 只声明何时、由谁、用哪份输入观察，`证据：` 只声明预期证据类型，实际唯一原件由执行者按现有 task producer 发布。按 ORACLE-T6，判据只判存在性、枚举、引用可回读与集合/算术一致性，不判自然语言结论的真实性。

### AC-N5-001：两类真实派发共用一份回传合同

- [ ] **AC-N5-001**

状态：`planned`；原 AC-001 / AC-006 / AC-T6-1；判定方式：机器可判（结构部分）＋只能人读（结论真实性不作判据）。

来源：R-002、R-004、R-005、R-007、R-008；D-007、D-014、D-019、D-022、D-032；FR-N5-001、FR-N5-002；SCN-001、SCN-002；oracle ORACLE-N5-DISPATCH；P1/T002、P1/T003、P2/T005。

验证：一次研究类与一次实施类真实派发各回传一次，且都在 P1/T002 的合同文本之后发生：研究类由 P1/T003 在新合同下真实派发取得（任务库 `quality/evidence/decision-log-refs/research-candidates.md` 的旧试样只作改前对照，其字段与正文混排不满足固定位置）；实施类由同一 Task 的真实派活产生；未参与实施的读者按六项固定位置逐字核对。
通过：六项共同字段都在固定位置且非空（位置与顺序按 D-012）；研究类另有来源与覆盖；实施类另有改动路径、命令、退出码；两类共用同一字段表。
失败：字段交集为空；任一必填字段缺失且未写「未取得」及原因；拿改前旧试样或构造件充当新合同的研究类证据；把结构齐全称质量通过。
证据：两份回传原件路径、字段逐项核对表、引用回读结果。

### AC-N5-002：三种异常回传可被机械指出

- [ ] **AC-N5-002**

状态：`planned`；原 AC-002 / AC-006；判定方式：机器可判（存在性／引用形状／状态词）＋只能人读（样本真实性）。

来源：R-004、R-006、R-008；D-023、D-036、D-004、D-022；FR-N5-002；SCN-003；oracle ORACLE-N5-DISPATCH；P1/T003。

验证：取得缺字段、引用不可读、状态词不在既有语义内三种样本；真实派发优先，未自然出现时用真实回传原件改写出真实形状构造件并显式标注；未参与实施的读者按六项固定位置指出缺什么、为什么。
通过：三种样本各能在固定位置指出缺项与原因；引用形状可回读；状态词只在既有语义集合（可用／部分／不可用、未取得、不适用）内；未新增受控枚举、schema 或运行时状态。
失败：缺字段被静默放过；判据扩展成自然语言判读；为判此项新增枚举或状态；构造件冒充真实派发证据；三种情形未取得且未如实记为不完整。
证据：三种样本原件（真实／构造件分列标注）、逐项判定记录。

### AC-N5-003：取消与修复有真实界线

- [ ] **AC-N5-003**

状态：`planned`；原 AC-003 / AC-006（decision-log `:373` 与 `:381` 对该条的 provenance 冲突，按 `:381` 行执行，见口径注记 10）；判定方式：只能人读。

来源：R-004、R-008；D-009、D-035；FR-N5-002；SCN-004；oracle ORACLE-N5-DISPATCH；P1/T003。

验证：取取消的回传原件、修复回传原件与原会话身份事实；未参与实施的读者核界线与修复位置。
通过：取消回传在「已做与未做」给出真实界线；修复发生在原实施会话且留下修复后的事实原件；原会话不可用时如实披露；派发说明缺可选事实时，已能安全执行的部分继续并记明所缺。
失败：取消只报「已取消」而无界线；修复另开新会话却不说明；把原会话不可用写成已完成；因缺可选事实整体停摆。
证据：取消回传原件、修复回传原件、原会话身份事实、可选事实缺失记录；未发生时如实记缺口并交 OPEN-06。

### AC-N5-004：活动治理层无并发数字与悬空指针

- [ ] **AC-N5-004**

状态：`planned`；原 AC-004 / AC-T6-2；判定方式：机器可判。

来源：R-003、R-005；D-003、D-006、D-010、D-015、D-016、D-025；FR-N5-003；SCN-005；oracle ORACLE-N5-RULES；P1/T004、P2/T005、P4/T007。

验证：全仓检索活动治理文件（`AGENTS.md`、`CLAUDE.md`、`GLOSSARY.md`、`README.md`、非 archive 的 `docs/*.md`、`workflows/**/SKILL.md`、`skills/**/SKILL.md`、`skills/catalog.yaml`）中的并发数字声明与指向不存在方案的指针；P4/T007 的 `gate_cmd` 产出 `concurrency_hits` 与 `dangling_pointer_hits` 并逐处回读目标是否存在。
通过：上述文件不存在并发数字声明；不存在指向不存在的并发方案的指针；防冲突写者规则与工具自身能力上限作为例外逐条列出。
失败：仍有活动治理文件写数字上限；仍有指向不存在方案的指针；把历史材料、工具上限或 `docs/adr/0034` 算进通过面；把「写者规则」误报成并发判据。
证据：P4/T007 `gate_cmd` 的检索命令、退出码、原始输出与逐处清单。

### AC-N5-005：旧并发决定只披露不覆写

- [ ] **AC-N5-005**

状态：`planned`；原 AC-005 / AC-T6-2；判定方式：只能人读（文本在场）。

来源：R-003；D-033（D-017 已被 D-033 取代，不再执行）；FR-N5-003、FR-N5-007；SCN-005；oracle ORACLE-N5-HANDOFF；P4/T007。

验证：读 `decision-log.md` 的 D-033、`docs/adr/0034` 的前后 sha256（P4/T007 产出）与交付说明素材；交付说明本身由 build-code 阶段末落地、verify-code 复核（owner 在 AC 表内）。
通过：决策日志有一句明确说明，且交付说明素材含同一句：`docs/adr/0034` 的并发决定已不再与规则文件一致，本次不留替代记录；如实记「删悬空并发指针只完成一半」；`docs/adr/0034` 前后 sha256 相同（未覆写）。
失败：旧记录被覆写；声称已用新决定取代而无对应记录；不作任何说明让两份矛盾并存。
证据：D-033 原文、交付说明素材、`docs/adr/0034` 前后 sha256 与原始输出。

### AC-N5-006：每条减法理由可核

- [ ] **AC-N5-006**

状态：`planned`；原 AC-006 / AC-T6-3；判定方式：只能人读（理由与 diff 对照）。

来源：R-005、R-010；D-008、D-024；FR-N5-006；SCN-008；oracle ORACLE-N5-G1；P4/T007。

验证：逐条删除／合并登记理由，与写集 diff、来源原 ref 对照；未参与实施的读者判理由类别。
通过：每条删除或合并都有理由，且理由属 token 与召回成本、副本漂移、权威冲突这类可核事实；每条能指到 diff 位置与来源原 ref。
失败：用「重复同句必然伤注意力」这类无依据论断充当理由；有删除或合并但无逐条理由。
证据：逐条理由清单、写集 diff、来源原 ref。

### AC-N5-007：五族旧回传逐族说明

- [ ] **AC-N5-007**

状态：`planned`；原 AC-007 / AC-T6-3 / G1；判定方式：只能人读（清单与 diff）。

来源：R-003、R-005；D-002、D-032；FR-N5-003、FR-N5-007；SCN-005、SCN-009；oracle ORACLE-N5-G1；P4/T007。

验证：读 spec 第 12 节的五族清单与真实写集 diff，逐族核：该族当前落点、并入统一合同或保留、保留理由；交付说明由 build-code 阶段末复制该清单、verify-code 复核（owner 在 AC 表内）。
通过：逐族列出主会话检索回传、派发继承载荷、研究回传、审查回传、跨阶段交接；逐族写明并入或保留及理由；清单与真实 diff 一致。
失败：只写「已收敛旧五套」而无逐族清单；声称五族全并而实际未并；因冻结保留却不写理由。
证据：五族清单原文、写集 diff、逐族核对记录；交付说明由 build-code 落地，verify-code 复核。

### AC-N5-008：字节按面披露

- [ ] **AC-N5-008**

状态：`planned`；原 AC-008 / AC-T6-4 / AC-T6-5；判定方式：机器可判（数字与 diff）＋只能人读（面归属）。

来源：R-005、R-008、R-010；D-005、D-018、D-024、D-026；FR-N5-006；SCN-008；oracle ORACLE-N5-BYTES；P1/T001、P4/T007。

验证：开工前保存六个写集文件、常驻三文件与 `docs/adr/0034` 的字节/sha256 基线（每文件一份唯一原件）；收尾用 P4/T007 `gate_cmd` 逐项测量：可控面＝两段具名规则文本（`AGENTS.md` 的「## 给 agent 的规则」到「### 测试硬规则」之间、`deep-research` 的「## R2：并行深读」到下一个 `##` 之间）与 P1/T003 的实际派发说明/回传原件字节（改前无载荷基线时记 `unavailable`）；常驻面＝三文件逐文件；宿主注入面 `not_reported`；运行既有常驻预算断言并保留原始输出。
通过：可控面对开工基线逐项不增（载荷基线缺失的部分写 `unavailable` 并说明）；常驻面逐文件单列实际增减、不作不增承诺；宿主注入面 `not_reported`；测不到写未测；既有预算断言的实际红绿如实报告且红因归属写清。
失败：用常驻面或宿主注入面充当可控面收益；把常驻面增长写成「字节不增」；可控面净增却记 pass；未测即宣称节省；为让断言变绿而删内容或改断言。
证据：基线原件与 sha256、收尾原件与 sha256、既有断言的原始输出、分面表。

### AC-N5-009：主 Agent 成本四组观测

- [ ] **AC-N5-009**

状态：`planned`；原 AC-009 / R-010 / R-008；判定方式：机器可判（测量输出）＋只能人读（范围与不可比说明）。

来源：R-008、R-010；D-024、D-026；FR-N5-006；SCN-008；oracle ORACLE-N5-COST；P4/T007 与 build-code 阶段末。

验证：P4/T007 先给出首判输入：实测时点在 build-code 阶段末、owner 与命令，本轮记 `unavailable`（时点未到）并写取得条件；build-code 阶段末用既有入口 `tools/cli/measure-main-agent-cost.mjs` 按同窗口测量一次，四组分列，缺项按 `unavailable`／`not_reported` 记录；P5 消费该原件。
通过：四组分列（墙钟；input／output／cacheRead；步骤与轮次；子代理与命令调用数）；缺项如实记录；回归判据在真实数字上成立（cacheRead 与墙钟均不劣化且 steps 或 cacheRead 至少一项下降）；同 cohort 连续 N≥3 达到。任一条件未满足即不记 pass。
失败：只报字节不报四组；用审查 provider token 或材料字节冒充主会话 token；未测即宣称节省；缺项不记 unavailable；单次观测宣 N≥3 达标；N≥3 未达却记 pass。
证据：测量入口输出原件与窗口说明、四组读数、样本量说明。

### AC-N5-010：两项外部采用与拒绝登记

- [ ] **AC-N5-010**

状态：`planned`；本次新增；判定方式：机器可判（YAML／字段／坐标）＋只能人读（采用项落点）。

来源：R-009；D-027；FR-N5-005；SCN-007；oracle ORACLE-N5-SOURCES；P3/T006。

验证：解析 `skills/catalog.yaml` 的 absorbed 条目、读 notices 的版权与采用说明、读 registry 的索引行；逐项核来源仓、相对路径、固定版本、许可、采用简述与取回坐标；回读每个采用点的最终文本；核拒绝项理由与来源行号。
通过：采用项逐条落到具体文件位置并带来源仓、路径、固定版本与许可；拒绝项逐条有理由与来源行号；`orchestrate.md` 的 commit 写未证实并给包 sha256，不写 commit URL；三处登记互相一致。
失败：采用项无落点；拒绝项缺失或理由空泛；版本坐标编造；三处登记互相矛盾。
证据：catalog 条目原文、notices 与 registry 原文、外部 `manifest.json` 的 sha256、采用点文本读回、拒绝项 R1–R6 的逐条理由与来源行号（引用 `research-candidates.md` 原 ref）。

### AC-N5-011：与 N6 的五处共享文件串行合入

- [ ] **AC-N5-011**

状态：`planned`；本次新增；判定方式：机器可判（diff／内容在场）。

来源：R-003、R-005；D-028；FR-N5-007；SCN-009；oracle ORACLE-N5-HANDOFF；P3/T006、P4/T007。

验证：逐处（`AGENTS.md`、`skills/deep-research/SKILL.md`、`skills/catalog.yaml`、`THIRD_PARTY_NOTICES.md`、`skills/reuse-registry.md`）用真实 `git diff` 与读回核对本卡改动完整在场；与 N6 实际先后按真实 HEAD 对账。
通过：五处各只有本卡一个 writer 的改动在场且完整；N6 后写时逐处读回保全本卡内容；若 N6 先动，按真实 HEAD 与 diff 对账并记录次序。
失败：任一处互相覆盖、丢内容或顺序冲突未处理；只处理部分文件。
证据：逐文件 `git diff --name-only`／`git diff`、读回记录、N6 先后对账记录。

### AC-N5-012：进入面只给指针与结论

- [ ] **AC-N5-012**

状态：`planned`；上游「预算动作」条；判定方式：只能人读（字节对比与指针回读）。

来源：R-002、R-004、R-007；D-013、D-020、D-021、D-035；FR-N5-001、FR-N5-004；SCN-006；oracle ORACLE-N5-DISPATCH；P1/T002、P1/T003。

验证：对派发记录与回传原件做字节对比（是否引入原文全文）；回读每个原件指针；核授权与失败边界是否在场；未参与实施的读者判定。
通过：主会话不因派发或回传重复引入原文全文；事实外置成原件且可回读；回传给出原件指针；授权与失败边界未被省掉。
失败：派发或回传把原文整段灌回主上下文；回传无原件指针；授权或失败边界被剪掉。
证据：派发记录与回传原件的字节对比、原件指针回读结果、授权与失败边界在场记录。

## 12. 风险、未决与交接

### 五族旧回传与逐族处置（AC-N5-007 的唯一清单）

| 旧回传族 | 当前落点（实读） | 处置 | 理由 |
| --- | --- | --- | --- |
| 主会话检索回传 | `AGENTS.md:16`「主上下文只收路径、exit_code、结论清单」 | 并入统一合同（保留该句为指针） | 与回传六项同义；避免第二处表述 |
| 派发继承载荷 | `AGENTS.md:19`「继承模式＋原文摘要 ref＋sha256＋≤500 字摘要」 | 并入统一合同（保留该句，六项把载荷字段说清） | 两者管不同环节，不合并也不互相替换（OI-012） |
| 研究回传 | `skills/deep-research/SKILL.md` R2 返回句与工具路由表 | 并入统一合同并保来源/覆盖 | 研究类附加字段沿用既有来源与覆盖写法 |
| 审查回传 | `skills/wh-review/SKILL.md:44` 八类冻结字段 | 保留，不并入 | 字段已冻结；并入会改审查合同 |
| 跨阶段交接 | `skills/stage-handoff/SKILL.md` 13 区块与固定发布口 | 保留，不并入 | 固定区块与 create-only 发布口；并入会制造第二发布口 |

### 偏离与口径注记（必须在计划确认与交付时再次展示）

1. **D-007**：上游要求「若还需以后重写该合同才能接外部方法，本卡未交完」；本卡把字段定稿建立在两类真实派发上，两类都在实施阶段按新合同取得，研究类的改前旧试样只作对照（偏离 1）。
2. **D-020／D-021**：上游「主会话先剪什么、保护什么」按宿主能力缺失改写为「进入面纪律」，原动作退役（偏离 2）。
3. **D-025**：上游「规则文件为唯一并发区间」改写为「无数字声明、无悬空指针、不设统一判据」；上游 FR-T6-002 的「任务实际并发写已有派发材料」同样不实现（偏离 3）。
4. **D-033**：上游「删悬空并发指针」只完成一半：指向已删，旧决定记录的并发正文未驳（偏离 4；D-033 取代 D-017，不新增 ADR）。
5. **D-026／D-028**：正常更新且本卡先合，使既有常驻预算断言在交付时为红，红因归属 N6 未执行的删除；与上游「不得由另一卡补本卡首次落点／验收」冲突（偏离 5，未消除的阻断项）。
6. **D-002／D-032**：上游「五套回传收敛一份 / G1 删旧五套」只并派发侧三族（主会话检索回传、派发继承载荷、研究回传）；审查回传与跨阶段交接因字段冻结与固定发布口保留（偏离 6；D-032 要求逐族展示，清单见第 12 节）。
7. **上游 `prd.md:584`**「Phase 与并发人数由 build-plan 沿 2–5 区间定」与 D-006／D-025 直接冲突；本计划不写任何并发数字，按用户真实改判执行（事实注记，不是新偏离）。
8. **AC-T6-4／AC-T6-5 口径**：其字面（常驻实测、净长与常驻不增）已由 AC-008 改写为分面披露；decision-log `:373` 自称「沿用原编号与强度」与表内实际不一致，此处按表内实际执行，不改上游材料。
9. **既有检查实跑口径**：`tests/acceptance/card-03-current.test.mjs` 在 build-plan 时点的 009 次历史运行实跑 exit 0（52 项，原件 `quality/tests/2026-10-19-009-build-plan-governance-regression.output`）；build-code 时点 055 次当前实跑为 exit 0（47 项，见 `quality/tests/2026-10-19-055-p4-card03.output` 与纠错 `quality/evidence/2026-10-19-120-p4-card03-count-correction.md`），与 decision-log OI-013／D-018 的「不可满足」表述不一致；本卡按实跑记录、不改测试，也不把该差异算作本卡红因。`tests/contract/delivery-closeout-charter-contract.test.mjs` 实跑 exit 0（6 项，36,849 B ≤ 36,861 B）；本卡写入后预计变红，按 RISK-01 披露。
10. **AC-003 来源冲突**：decision-log `:373` 把 AC-003 列为「本次新增」，`:381` 的 AC-003 行却写上「AC-006 / R-004 / R-008」；本规格按 `:381` 行执行并在 AC-003 保留两处 provenance，不改上游材料。
11. **AC-008 预期未达成**：可控面逐项「不增」来自已确认 AC；本卡正常写入后可控面预计净增，故 AC-008 预期不能记 pass（RISK-02），不把「记录实际增减」偷换成通过条件。

### 风险

- **RISK-01**：常驻预算断言为红。触发：本卡写入后三文件合计超过 36,861 B（PFACT-010）。后果：`tests/contract/delivery-closeout-charter-contract.test.mjs` 失败。缓解：正常更新、不删内容换绿、如实报告红因；由 N6 的删除承接。验证：运行该断言，保存原始输出。
- **RISK-02**：可控面净增使 AC-N5-008 达不到「不增」。触发：合同文本新增超过可删文本（PFACT-011）。后果：该 AC 只能如实记未达成，需用户决定「接受净增」或「授权扩大削减范围」。处理阶段：P4；owner：build-code 测量、用户决定。
- **RISK-03**：成本 N≥3 与完整 N1 对照不可在本卡取得（PFACT-013）。后果：AC-N5-009 只报单次观测，不能宣达标。处理阶段：build-code 阶段末与 verify-code；owner：后续同 cohort 卡。
- **RISK-04**：并发的历史口径仍在 `docs/adr/0034`。触发：读者只读旧记录。后果：两份矛盾并存（D-033 已绑定）。缓解：决策日志与交付说明各一句披露；不覆写旧记录。
- **RISK-05**：`GLOSSARY.md` 新条目受 `verify-structure` 的 denylist 与五段术语约束。触发：条目用词撞 denylist。后果：结构验收失败。缓解：只用中文术语、先本地跑 `node tools/cli/verify-structure.mjs`。
- **RISK-06**：样本真实性。触发：异常样本用构造件充真实派发。后果：AC-N5-002 失败。缓解：构造件显式标注并分列；真实派发优先。
- **RISK-07**：N6 先动共享文件。触发：`OI-021` 的次序改变。后果：合入冲突或覆盖。缓解：按真实 HEAD 与 diff 对账；逐处读回保全。
- **RISK-08**：方向挑战未执行（D-031）。触发：五处偏离只有用户确认一道关。后果：独立质疑不足。缓解：本文件逐条展示偏离；细节审查已覆盖三处（`review-dispositions.md`）。
- **RISK-09**：下游 N6／N8 失去可引用的并发数值判据。触发：N8 按旧「2–5」理解或引用旧记录。后果：下游按不存在依据派发。缓解：交付说明显式写「并发无数字判据、由各阶段按真实独立性临场决定」，并指向本文件与决策日志 D-006／D-025。

### 未决（OPEN）

- **OPEN-01**：实施类真实派发是否在 build-code 自然出现。负责人：build-code 实施者；影响 AC-N5-001、AC-N5-003；关闭条件：取得真实实施类回传原件，或如实记未取得。
- **OPEN-02**：三种异常样本是否取得。负责人：build-code 实施者；影响 AC-N5-002；关闭条件：取得真实或真实形状构造件并标注，或按 D-036 带欠账。
- **OPEN-03**：同 cohort N≥3 成本样本。负责人：后续同 cohort 卡与 verify-code；影响 AC-N5-009；关闭条件：累计三次同 cohort 观测。
- **OPEN-04**：确认原件不携带材料哈希（OI-023）。负责人：本阶段收口；影响「用户所见即所批」的可证性；关闭条件：不新增字段，交接如实披露。
- **OPEN-05**：`orchestrate.md` 的上游许可链未独立核实（`manifest.json` 的 `upstream_notice`）。负责人：来源维护者；影响 AC-N5-010 的许可陈述；关闭条件：取得权利 owner 的 grant 或保持「未证实」。
- **OPEN-06**：取消回传与「修复回原会话」的真实事实可能在本 task 内不自然出现。负责人：build-code 实施者；影响 AC-N5-003；关闭条件：取得真实取消/修复原件，或按 D-036 逐项写缺口、条件与 owner；不人为制造取消。

## 13. 业务影响与回归范围

### 规则读者与既有检查

- **既有行为**：五阶段派发者读 `AGENTS.md` 派发段；研究技能读者读 `deep-research`；维护者读 catalog/notices/registry；术语读者读 `GLOSSARY.md`。
- **本需求影响**：派发段新增一小节并删两处失效表述；研究技能删两处上限并加一句指针；三处登记各加一项；术语表加两条。其它规则与冻结合同不动。
- **回归路径**：`node tools/cli/verify-structure.mjs`（GLOSSARY 术语与 denylist）、`node tools/cli/check-skill-consistency.mjs --root <绝对包根>`（catalog 与 bundle 闭包）、`node tools/cli/run-checks.mjs`（既有报告，只作事实）、`tests/contract/business-repo-experience-file.test.mjs`（五文件不得引用 `Improvements.md`）、`tests/contract/delivery-closeout-charter-contract.test.mjs`（常驻预算，预计红并如实报告）。`tests/acceptance/card-03-current.test.mjs` 在 build-plan 时点 009 次历史运行实跑 exit 0（52 项通过，见任务库 `quality/tests/2026-10-19-009-build-plan-governance-regression.output`）；build-code 时点 055 次当前运行为 exit 0（47 项通过，原件 `quality/tests/2026-10-19-055-p4-card03.output`，数量纠错见 `quality/evidence/2026-10-19-120-p4-card03-count-correction.md`）；其同名 `.mjs` 原生采集脚本依赖本树不存在的 `specs/workflowhub-thin-core-card-03-20260919`，只作直接运行时的历史资产。decision-log OI-013 的「不可满足」表述与本次实跑不一致，本卡按实跑记录并披露差异，不改该测试、不冒红因归属。
- **验收**：AC-N5-004、AC-N5-008、AC-N5-009 与上述命令的原件。
- **可能受冲击的业务规则**：`AGENTS.md` 与 `CLAUDE.md` 必须含 `docs/delivery-closeout-charter.md` 的既有断言；GLOSSARY 的五段术语与 denylist；catalog `skills[]` 的 name/path 形态（本卡只加 `capability_decisions`，不动 `skills[]`）。
- **明确无影响**：runtime、tools、schemas、config、其它技能、Git 工作流、权限与部署；无 UI、无数据迁移、无外部服务。

## 补充材料

- 任务库 `quality/evidence/decision-log-refs/research-candidates.md`：研究类真实试样回传原文、8 条采用候选与 6 条拒绝候选，逐条来源行号。
- 任务库 `quality/evidence/decision-log-refs/talk-batches.md`：批 1–10 用户真实答复原文。
- 任务库 `quality/evidence/decision-log-refs/review-dispositions.md`：方向审查与细节审查 22 条发现的逐条处置。
- 任务库 `quality/evidence/decision-log-refs/coverage-matrix-5d.md`：R/U 覆盖矩阵与上游逐项补遗。
- 外部参考包 `manifest.json`（`/Users/Hugh/Downloads/workflowhub-skills-framework-references-20261014/manifest.json`）：两项采用的来源坐标与 sha256。
- 外部 `tasks/N5.md`：N5 固定资料索引与本地集成目标。
- 父 PRD：`specs/archive/skills-framework-redesign-20261014/prd.md:375-392`（N5 卡）、`:193-199`（G1）；母决策日志同目录 `decision-log.md`。

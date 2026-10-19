# 功能规格：先确认骨架，再逐工作包收敛

读者：计划确认者、六个 Phase 的实施者、独立审查者与 verify-code 验收者。读完能找到原始需求、完整交付单元、允许改动与唯一验收条款。

- 功能：N6 骨架与逐工作包决定。
- 来源：同目录 `decision-log.md` 的 ADR-001…ADR-012，以及下文具名原始来源。
- 状态：build-plan 草稿；方向已有真实答复，计划尚待真实确认。本文不证明实现或验收完成。
- 认证工作区：`/Users/Hugh/Hugh/Project/workflowhub-n6-skeleton-module-decision-20261019`；分支 `task/workflowhub/n6-skeleton-module-decision-20261019`；规划起点 `484e4cbf2f7359a8d0045496579783b79696a8ee`。
- 外置任务基准：`/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/n6-skeleton-module-decision-20261019`。下文 `quality/` 引用均相对该基准，不相对工作树。

## 材料导航

本导航可再生，只帮助定位。目标与取舍读 `decision-log.md#工作包与决定`；本规格的场景、事实与功能要求给行为解释；`Appendix A` 独占验收条件；实现设计给全局接口与写集；`phases/index.md` 只导航，具体动作、命令与停止条件读各独立 Phase。运行结果读外置 task facts 与质量原件，材料正文不存执行进度。

本件章节次序：`Appendix A` 之后仍有 **§12 风险、未决与交接** 与 **§13 业务影响与回归范围**，附录不是末节。〔已改正（审查修正 A2）：旧导航只列到 `Appendix A`，未交代其后两节，读者容易把附录当末节；依据独立审查 A2〕

本轮并行材料（同一构建计划内，均入读集）：`figma-make-prompt.md`（现行，776 行 / 37,423 字节；**读数只作对照**）、`figma-make-prompt-revision.md`（并行件，339 行 / 24,887 字节；**读数只作对照**）、`figma-make-prompt-revision-2.md`（第二轮补充件，141 行 / 8,638 字节；**读数只作对照**）。三件均由主会话唯一写，均不冒「模板已交付」或「视觉已验」。〔已改正（审查修正 B2 配套）：旧导航与读集未登记这三件，AC-108 的证据指向过期读回件；依据本次裁定与现行件实测〕

**合并影响登记（`6240f199`）**：主分支已并入 N5（PR #9）与其归档提交。**N5 改动的文件里有 5 个正是本卡写集**——`AGENTS.md`（新增 `### 派发与回传`；**删除**了「五阶段共用并发区间为 2–5」那句）、`GLOSSARY.md`（新增「并发」「派发与回传合同」两术语，其中「并发」明确**不设数值上限**）、`skills/deep-research/SKILL.md`（R2 去掉「最多 4 个」并新增指向 `AGENTS.md` 派发与回传的引用）、`skills/reuse-registry.md`（新增 `## N5既有方法采用索引` 节）、`skills/catalog.yaml`（新增 `n5-dispatch-and-return` 条目）、`THIRD_PARTY_NOTICES.md`（新增 2 条，含文件 SHA256／commit／许可／采用与拒绝）。**本卡一律在 N5 的现行基线上做增量**：新节排在其后、按同一形状写、写前读回其现行内容。`skills/deep-research/SKILL.md` 的两个行号锚点（`:15–19` 轻研究、`:49–55` 方向报告）合并后**实测仍成立**。归档的 `specs/archive/n5-subagent-dispatch-context-20261019/` 只读，与本卡无关。

P0 在场：目标与场景 written；全局设计与边界 written；唯一验收正文 written；测试面及对象 written（UI 输入缺项保 unknown）；来源、依赖、风险 written。驾驶舱视觉定稿 deferred 给用户后续 Figma 设计，不能把有规范当已交付视觉效果。

## 速读卡（30 秒）

用户先看到调研后的可核骨架并给真实答复，然后按固定工作包顺序逐包完成五段讨论。助手只问会改变交付的选择，事实已答和实现细节直接处理并说明。调研各归原 owner；日志保存影响决定的结论，报告全文仍单份。驾驶舱展示需求到任务、真实改动和测试的关系；缺环显露，页面不决定进度。六个 Phase 各交完整结果，末 Phase 逐条消费全部验收原件。新分级路由、旧模板修订与视觉定稿保持具名边界。

## 来源与决策映射

真实来源分母是 11 条已定义需求（R-001…R-008、R-010…R-012）、31 个派生单元、U-001…U-046、BT-001…BT-034，以及 AC-001…AC-122。R-009 没有定义、原件零命中，不编内容；父卡 R-017/R-018 只作为原父编号，不冒本卡新增需求。〔已改正（审查修正 B6）：旧写法在此处另有分句「原件里的『12 条需求』包含 R-009 空行，不能据此扩大真实需求分母」。该「12 条含 R-009 空行」在 `decision-log.md:735`（11 条原始需求、R-009 零命中）与 `requirement-index.md` §2／§3.10（11 条定义＋R-009 零命中）里查不到出处，故删去该分句，只留「11 条已定义＋R-009 零命中」。〕

原需逐字与类型：`quality/evidence/decision-log-refs/requirement-index.md` §3 逐条明细与可核单元、同件 §6b 逐字答复全文并入；对应覆盖：同目录 `coverage-matrix-5d.md` §2 五栏覆盖矩阵。五条有用户需求原话：R-001/R-005/R-008/R-011/R-012；R-006 是选择类答复；R-002/R-003/R-004/R-007/R-010 是文档转述，其中 R-010 为归纳。原件自带的截断照录，不补写。完整来源类型由该索引承载，本文不另抄逐字。〔已改正（审查修正 F2）：两处旧锚点 `#6b-逐字答复全文并入bt-001bt-034`、`#2-五栏覆盖矩阵` 与实读标题的 slug 不符（标题里带「〔已改正…〕」等括注，slug 会随括注变化），改用章节名写法，不依赖 slug〕

| 原始来源 | 决定 | 功能 / 场景 | Phase / Task | 来源状态 |
| --- | --- | --- | --- | --- |
| R-001a、R-002a；U-008/U-027 | ADR-001 | FR-N6-001；SCN-001 | P3/T003 | current |
| R-002b；U-009/U-022/U-028 | ADR-002 | FR-N6-002；SCN-001/003 | P3/T003 | current |
| R-002c；U-001/U-010/U-021/U-030 | ADR-003 | FR-N6-003；SCN-001/003 | P3/T003 | current |
| R-001b、R-003a/b；U-003/U-011/U-026/U-032 | ADR-004 | FR-N6-004；SCN-002/003 | P3/T003 | current |
| R-005a、R-006a/b；U-004/U-012/U-033 | ADR-005 | FR-N6-005；SCN-004 | P2/T002 | current |
| R-006c；U-013/U-034/U-035 | ADR-006 | FR-N6-006；SCN-005 | P4/T004 | current |
| R-004a；U-014/U-024 | ADR-007 | FR-N6-007；SCN-002 | P3/T003 | current |
| R-007a；U-002/U-007/U-015/U-031/U-034/U-039 | ADR-008 | FR-N6-008；SCN-006 | P1–P4/T001–T004 | current |
| R-008a/b/c；U-005/U-006/U-017–U-020/U-041 | ADR-009 | FR-N6-009；SCN-006 | P1/T001 | current；模板部分 deferred |
| R-010a/b；U-023/U-042 | ADR-010 | FR-N6-010；SCN-001 | P3/T003 | current；分级路由 non-goal |
| R-005b、R-011a/b；U-029 | ADR-011 | FR-N6-011；SCN-004 | P2/T002 | current |
| R-004b/c、R-012a…h；U-036–U-038/U-040/U-043–U-046 | ADR-012 | FR-N6-012；SCN-007 | P5/T005 | current；视觉定稿 deferred |
| U-016/U-025；父 PRD N6 与共同采用约束 | ADR-003/008/012 | 全部 FR；SCN-008 | P6/T006 | current；原审查失败保留 |

U-024 的四条合并保原编号：AC-002→AC-020，AC-004/AC-007→AC-021，AC-008→AC-024。其余 U 按上表决定或跨切面验收消费；U-025 是原审查处置事实，不是新增质量通过；U-031 是基线合并事实，不扩大本次写集。原始父 PRD `specs/archive/skills-framework-redesign-20261014/prd.md` 的 N6、ORACLE-T1、G1、54采用和受影响23保护是只读来源；精确分配见实现设计追踪。

**派生号展开（上表区间写法的明细，不新增编号）**：上表串写「R-001a」「R-003a/b」「R-004b/c」「R-006a/b」「R-008a/b/c」「R-010a/b」「R-011a/b」「R-012a…h」等区间写法，被折叠的派生号按下列独立行展开；承接工作包与验收编号照抄 `coverage-matrix-5d.md` §2／§4，逐条「谁接／落在哪／怎么验」读 `requirement-index.md` §3。本表只是同一分母的另一种写法，不是新单元、不改需求编号、不加验收号。

| 派生号（区间写法里被折叠的） | 承接工作包 | 落点 | 验收（仅导航） |
| --- | --- | --- | --- |
| R-003b | ④ | ADR-004 重收敛表（新增模块重走五段） | AC-021、AC-048 |
| R-004c | ⑫ | ADR-012（自动打开＋本次更新高亮） | AC-103…AC-105 |
| R-006b | ⑤ | 质询技能「把模糊语言说清」节 | AC-055 |
| R-008b | ⑨ | `skills/knowledge-graph/SKILL.md`、`skills/deep-research/SKILL.md`（三条保障各一套） | AC-092 |
| R-008c | ⑨ | 深度调研技能（留存＋命名）＋模板改错 | AC-093…AC-096 |
| R-010b | ⑩ | 非目标行（分级选择归 N8＋「应当尽早询问」） | AC-099、AC-100 |
| R-011b | ⑪ | ADR-011（格式六件＋「我替你定了这些」＋不写死数量） | AC-040、AC-057 |
| R-012b | ⑫ | ADR-012（自动打开＋本次更新高亮＋逐节点指纹） | AC-103…AC-105 |
| R-012c | ⑫ | ADR-012 升级块（全任务详情＋进度追踪，跨四阶段） | AC-109…AC-114 |
| R-012d | ⑫ | 写集三行（build-plan／build-code／verify-code 只登记不实现） | AC-113 |
| R-012e | ⑫ | ADR-012 驾驶舱块（四环追溯＋固定数据源＋空状态＋模板两区） | AC-117…AC-122 |
| R-012f | ⑫ | ADR-012 第⑥条（更新触发＝「较大更新时更新」） | AC-069 |
| R-012g | ⑫ | ADR-012 搬迁块（外部技能 `answer-as-page`） | AC-072…AC-078 |
| R-012h | ⑫ | ADR-012 追加块（HTML 模板＋下一阶段 Figma 提示词；路径与唯一写者归下一阶段写集） | AC-106…AC-108 |

〔已改正（审查修正 覆盖类①）：旧写法这 14 个单元只以上表区间串（`R-003a/b`、`R-004b/c`、`R-006a/b`、`R-008a/b/c`、`R-010a/b`、`R-011a/b`、`R-012a…h`）出现，单号在正文无独立行；依据独立审查覆盖类①与 `coverage-matrix-5d.md` §2／§4。〕

本次两项真实规格澄清保在 `quality/evidence/2026-10-19-001-build-plan-spec-clarify.md`：第5步先调用既有自查、第6步回读；报告全文单份、关键结论与排除理由进决定正文。它们修清实现解释，不代本spec/Phase最终计划确认。

## 1. 需求解释：问题与紧迫性

用户曾得到大量问答和台账，却看不清要改成什么。根因是把大纲当未确认假设、跨工作包攒讨论、收敛缺真实取舍、结论与原件关系不清。此次改造让用户在细节前确认骨架，并能逐包看见决定如何形成。自然语言质量必须由独立读者消费完整输入与真实产物判断，不能用标题、编号或测试命中替代。

## 2. 背景、目标与范围

现有 make-decision 有十五个步骤、两处提问技能和两个研究技能。选择保留这些 owner，以窄修改改正顺序与职责；现有 advisory chain 只补派生需求单元观察。新 `answer-as-page` 提供宿主无关的读者呈现方法，任务页继续是任务库里的只读派生物。

目标、理由与已接受风险仍读 decision-log；本文把它们变成场景、功能和工程合同。工作包⑧的减法嵌入各受影响交付，不能先交新增能力再把减法、登记、接线或首次验证推给末 Phase。步骤数量不增加，确认依赖用户真实答复，不增加机器推进门。

## 3. 用户场景与状态覆盖

### SCN-001：确认可核骨架

用户给原始需求，主会话先简单沟通方向与故事，再做全方向调研；设计大纲时才拆需求单元，形成稳定编号、四样工作包和两份外置原件。独立助手用既有覆盖、粒度、依赖和缺口判据做四查，定工作包顺序。主会话在第5步先调用既有自查，再一次展示骨架与输入并等待真实答复；第6步回读该自查结果，第7步才独立审查方向。分级只沿既有四字段产物，不在本卡实现 N8 路由。

### SCN-002：按工作包细化

主会话按已定顺序处理一个工作包，在正文五行小表里依次保调研、扩散、收敛、就地讨论、定验收的结论与原 ref。简单项消费前段研究与点状原文；复杂项补有边界研究。每批讨论只属当前工作包，同包独立问题可合问。整体形态与跨包核对供不读全日志的人理解。

### SCN-003：拒绝、未答、新增与修订

拒绝骨架只修受影响部分，旧答复作废但原文保留；未答、模糊和取消不产生确认。新增工作包追加编号并重走五段，由终末细节审查覆盖已接受风险；回改已有工作包走修订/取代和需重评，影响验收时改该格，不全量重跑五段。

### SCN-004：问题可理解且不多问

提问者从真实未决项组成队列，按影响与依赖出卡。内部词每次邻接白话解释，选项说明直接后果与主要风险，题号与总数在真实答复后重算。模糊答复保持具体未决并当场追问；地板规则提醒提问本身出了问题，不成为主观退出门。每轮末尾复述问题意义，并列「我替你定了这些」。

### SCN-005：技术分歧取事实

两个办法都实现同一目标、差异只能运行观察且无需真实数据/权限/他人时，助手在任务库做隔离草图。草图给事实与反例，结论回讨论由用户决定；真实数据、产品偏好、外部副作用或不可逆动作不走草图。原件留存，工作树不存草图或目录快照。

### SCN-006：研究可消费且不重复

内部研究按知识图谱方法选择图或文件；外部研究由深度调研方法调用搜索与原文工具。两侧分别声明找什么、相关性和零结果。外部报告沿证据目录日期＋主题命名；影响方向、范围、验收的结论和排除理由进入决定正文，全文不复制，其余只留指针。每任务可查，不恢复已删除的跨任务索引。

### SCN-007：查看任务驾驶舱

用户从左结构树与右详情理解任务。内容来自当前材料、需求索引、覆盖表、任务事实、真实改动清单、测试与审查原件；一条需求能循任务、文件、结果找回，缺环与不一致显露。更新高亮只来自逐节点内容指纹，来源变化与措辞漂移分别说明。视觉设计已暂停，直到用户给后续设计与真实确认，不再生成样张冒定稿。

### SCN-008：独立全任务验收

独立验收者取得同原需求、受控输入、基线与候选真实产物及已有证据，先按同尺判断正反结果，再逐条报告所有 AC。受控答复只证方法分支，真实用户效果须有实际旅程与答复；来源送达、结构检查、局部绿不能补真实确认、视觉效果或成本缺数。

### 状态覆盖清单

默认 SCN-001/002；空输入 SCN-006/007 显露缺来源；错误 SCN-003/006 保失败与未决；加载 N/A（本卡没有服务加载协议，派生页生成未完成时仍用旧页且显露来源时间）；取消 SCN-003 保未完成；边界 SCN-004/005；权限 SCN-005/007（付费、Chrome 系统权限或数据不可用只停相应路径）；竞态 SCN-006/007 沿唯一writer与既有安全写入串行。数据、当前/历史两项沿第8节处理。

## 4. 产品事实与假设（PFACT）

- **PFACT-001**；状态 `verified`。证据：实读 `workflows/make-decision/steps.json` 的 `schema_version: "2.0.0"`、`stage_slug: "make-decision"`、step_id 1…15、末步 `closeout` 和 `completion_evidence`。关联全部 FR、AC-009/010/044。
- **PFACT-002**；状态 `verified`。证据：实读 `tools/cli/check-decision-log-chain.mjs` 的 `checkDecisionLogChain({ markdown, source_ref = "decision-log.md" } = {})`、`CURRENT_FIELDS` 与 CLI `--file`。现函数只收文本，不读任务库。关联 FR-N6-001/002、AC-016/032/033。
- **PFACT-003**；状态 `verified`。证据：实读 `skills/talk-with-zhipeng/SKILL.md#3-每答重排` 与 `skills/grill-with-docs/SKILL.md#during-the-session`；现有问答字段映射、真实回复、四项退出检查须保留。关联 FR-N6-005/011、AC-003/022/039/040/054–058。〔已改正（审查修正 F1）：旧锚点 `#每答重排` 与实读标题 `### 3. 每答重排` 的 slug 不符，改为 `#3-每答重排`〕
- **PFACT-004**；状态 `verified`。证据：需求索引§3与覆盖表§2当前原件、decision-log最新更正；真实分母按来源映射首段，逐字不存在与未取到不同。关联 FR-N6-001/002/012、AC-014–018/115/116。
- **PFACT-005**；状态 `unknown`。负责人：用户提供后续Figma设计，P5实施者核实际模板、页面与viewport。影响：FR-N6-012、AC-064/086–089/106/107/114/121；关联 OPEN-01/RISK-01。没有最终视觉设计或当前业务浏览器验收。
- **PFACT-006**；状态 `verified`。证据：实读 `skills/decision-log/templates/decision-log-template.md#外置事实索引` 中的 `research.md`、`talk-batches.md`、`requirement-index.md` 登记，与本decision OI-012同源缺口。写权归上游模板owner，本卡不修。关联 FR-N6-001/009、AC-093；OPEN-02。
- **PFACT-007**；状态 `unknown`。负责人：阶段主会话与verify-code，取得同任务/命令/条件/预算的成本原数。影响 FR-N6-008、AC-029；关联 OPEN-03/RISK-03。无同条件读数不证明收益。
- **PFACT-008**；状态 `verified`。证据：decision-log OI-015及过程事实，既有确认机制不支持按步骤区分用途。本卡不改确认schema。关联 FR-N6-003、AC-047；OPEN-04。

## 5. 功能需求

- **FR-N6-001**：需求条目与工作包通过原文/类型、派生号、最后变更批次和双向覆盖关联。场景SCN-001，PFACT-004；来源R-001/R-002、ADR-001；验收AC-014–018/030–033/115/116。
- **FR-N6-002**：独立四查把结论、依据与三类缺口留正文，沿原判据同时判断应拆和应并，不把工时、行数或条数作门。场景SCN-001/003，PFACT-002；来源R-002、ADR-002；验收AC-019/034–038/041。
- **FR-N6-003**：骨架与最终决定分别取得真实答复，展示对象不同，拒绝、未答和机制缺口显露。场景SCN-001/003，PFACT-001/008；来源R-002、ADR-003；验收AC-002/005/006/020/042–048。
- **FR-N6-004**：每个工作包形成五段完整收敛，新包追加后重走五段、旧包修订只重评影响。场景SCN-002/003，PFACT-001；来源R-001/R-003、ADR-004；验收AC-001/004/007/021/050–053。
- **FR-N6-005**：七透镜按真实问题选用；模糊答复分类、追问与地板提示帮助形成真实选择。场景SCN-004，PFACT-003；来源R-005/R-006、ADR-005；验收AC-003/022/054–058。
- **FR-N6-006**：技术分歧仅在客观适用条件下取得隔离草图事实，产物保留在任务库，产品选择归用户。场景SCN-005，PFACT-001；来源R-006、ADR-006；验收AC-023/059–063。
- **FR-N6-007**：整体形态与跨包一致性供独立读者理解，文字故事在驾驶舱中作为内容来源，不能以需读全日志的清单代替。场景SCN-002/007，PFACT-004；来源R-004、ADR-007；验收AC-008/024。
- **FR-N6-008**：具名删除/合并/降档的含义与消费者保全，来源登记同步；成本原数与材料体积分开。场景SCN-006/008，PFACT-007；来源R-007、ADR-008；验收AC-011/012/025/029/049/079–085。
- **FR-N6-009**：两研究技能保留各自职责与三保障，报告单份、决定结论可消费、历史逐任务可查；零消费者研究校验器只登记缺口。场景SCN-006，PFACT-006；来源R-008、ADR-009；验收AC-013/027/091–096。
- **FR-N6-010**：四种任务分级沿既有四字段产物和大纲/收敛模式，定义与路由归N8，未实现的类型如实说明。场景SCN-001，PFACT-001；来源R-010、ADR-010；验收AC-028/097–102。
- **FR-N6-011**：问题可见文字解释内部词，保持单轴、真实总数与明确取舍；事实可定项直接处理并声明。场景SCN-004，PFACT-003；来源R-005/R-011、ADR-011；验收AC-039/040/056/057。
- **FR-N6-012**：宿主无关技能与驾驶舱共享一个呈现合同，支持离线结构导航、四环追溯、任务进度、缺环、逐节点高亮及具名设计延期。场景SCN-007，PFACT-005；来源R-004/R-012、ADR-012；验收AC-064–078/086–090/103–114/117–122。

## 6. 模块划分

P1调研方法、P2提问方法、P3骨架至逐包流程、P4技术草图、P5驾驶舱各有完整消费者与正反结果；P6独立验收完整任务。它们是可独立交付单元，不是十二工作包的等数量翻译。P1先交研究输入，P2先交提问能力，P3消费二者形成真实流程；P4无需等P3才能判草图适用边界；P5消费当前材料和前序原件，不把缺后续事实伪装成完整状态。

**十二个工作包 → 六个 Phase 的最小映射**（工作包是决定期的收敛单元，Phase 是交付与验收单元；两边不是等数量翻译，同一 Phase 可接多个工作包，⑧ 的减法按受影响交付分散、见 AC-079／AC-080，P6 不接工作包而是逐条消费全部原件）：

| 工作包 | 名称 | Phase / Task |
| --- | --- | --- |
| ① | 需求条目化与大纲结构 | P3/T003 |
| ② | 大纲四查自检 | P3/T003 |
| ③ | 骨架确认动作 | P3/T003 |
| ④ | 逐模块五段节奏 | P3/T003 |
| ⑤ | 提问方法吸收 | P2/T002 |
| ⑥ | 技术分歧一次性草图分支 | P4/T004 |
| ⑦ | 完整故事与跨模块一致性 | P3/T003 |
| ⑧ | 减法与登记 | 分散：D7→P1、D1–D4→P2、D5/D6→P3、草图/预算处置→P4（AC-079／AC-080） |
| ⑨ | 调研标准化 | P1/T001 |
| ⑩ | 四级同模式 | P3/T003 |
| ⑪ | 说话与提问标准 | P2/T002 |
| ⑫ | 整体形态总览页＋外部技能搬迁 | P5/T005 |
| —（全任务） | 独立全任务验收 | P6/T006 |

〔已改正（审查修正 覆盖类②）：旧文只有「不是十二工作包的等数量翻译」这句否定，正文没有 ①–⑫ → 6 个 Phase 的映射，读者无法从工作包回 Phase；依据独立审查覆盖类②与 `coverage-matrix-5d.md` §4。〕

## 7. 关键实体

需求R与派生单元的类型、谁接/落在哪/怎么验由需求索引与覆盖表持有；工作包编号追加不重排。决定沿既有做什么/不做什么/风险/改动四字段。研究报告由原专业owner保存。任务进度由现task facts承载。页面节点只持有展示内容与稳定目标，不成为业务实体；逐节点侧车只是本次变更比较所需的派生缓存，不保存任务状态。

## 8. 数据和生命周期

原始输入、真实答复、失败与审查原件沿原ref保留；本卡不迁移或覆写历史。生成页与侧车放同一任务库证据位置，由同一页面承担者串行更新；写入中断时保旧页与旧侧车，后续如实说明比较基准缺失，不从整文件指纹推全节点变化。页面更新不反写task facts。草图保留已允许证据区域，非目录快照。原始记录同字节唯一，材料只引用，不复制树、归档整个目录或新建进度账本。

**逐节点侧车的件名、格式与删除条件（覆盖表 B-1 的 6 个单元由此到文件级）**：件名与格式＝`quality/evidence/<task-id>/overview-<date>.html`（页面本体）＋同目录 `<同名>.nodes.json`（逐节点侧车）；侧车 JSON 形状固定为 `{schema, generated_at, source_fingerprint, nodes:[{stable_id, content_digest}]}`，只存展示内容与稳定目标，不存任务状态、不作第二进度权威。件名最终由调用者指定：ADR-012 明写「文件名与子目录属实现细节」「页面落盘由调用者指定」，故本卡只留接口与格式约定，`<task-id>`／`<date>` 由调用者给定，建议件名不当已定事实。覆盖表 §3.B-1 点名的 6 个单元（R-004b、R-004c、R-012a、R-012b、R-012c、R-012e）落点即上述两件：本体落 `.html`、逐节点比较落 `.nodes.json`；两件同放任务库证据区，不进仓库写集、不随任务分支提交。删除条件：真实模板定稿（AC-107／AC-121）并经用户确认后，旧页与旧侧车由同一页面承担者一并移出活动证据区，转入该任务目录的只读历史位，并留一行「何时、由谁、为什么移出」与原 ref；不覆写、不静默删除原件。侧车缺失或与页面不同步时按 AC-105 如实登记比较基准缺失，不把整文件指纹当逐节点结论。〔已改正（审查修正 E4）：旧文只写「生成页与侧车放同一任务库证据位置，由同一页面承担者串行更新」，件名、格式与删除条件均未写，B-1 的 6 个单元只到「任务库证据区」；依据 ADR-012 与 `coverage-matrix-5d.md` §3.B-1〕

## 9. 兼容性预留

保十五步骤与原step_slug、证据kind/path、现问答工具字段映射、ADR四字段统计、既有catalog字段语义、七类公共入口与跨宿主方法能力。派生号也在既有legacy requirement_ids中合法，真正非法ID仍警告；新需求单元警告只扩已有chain函数的文本观察，不改 `recognized_blocks`/`recognized_fields` 的含义；`failures: []` 和CLI exit0保持。没有新的schema、命令、stage、selector、历史进度对象或恢复许可。

## 10. 明确不做与默认必须成立

非目标唯一放本节：N8的四级定义/选择/路由/技能矩阵；父卡全局文档标准与经验沉淀；上游N3/N4质量欠账补证；模板系四处修订；审查provider路由和轮次改造；runtime研究模块新caller；生产前端应用与后端服务；上游CLI/图表库/视频/主题市场/后台更新/自动清理/always-on；已暂停的样张或视觉设计定稿；通过字节或数字成本门证明收益。历史字节与版本读数只可追来源，不作接受分母；用户给出的选项上限与展示标签长度仍按其各自对象适用。

所有实施与验证保真实用户回复、受保护断言、定向测试、独立质量、权限与Git边界。技术事实、质量结论、用户体验、交付和物理close分开。输入不足不假装成功，也不把未知变成新的继续工作门。

第 11 节由验收流程／测试标准／架构边界／Appendix A 承接，编号沿用模板（模板把第 11 节列为验收章）；本节不自造一节。该编号缺口的根治由模板 owner 重排，本卡只登记承接关系，不改模板。〔已改正（审查修正 A1）：旧文第 10 节之后直接接「验收流程」，未交代第 11 节的去向与承接者；按模板编号补这一句承接说明，不自造新节，根治归模板 owner。〕

## 验收流程

从场景找到FR与同号Appendix A，再由Phase/Task定位目标命令、完整输入及原件。P1–P5各自完成首次消费者读回；P6一次消费其原件，执行尚未闭环的必要case。AC002/004/007/008只沿合并目标，不重复跑或重复报完成。受控输入与真实用户旅程分列；缺用户答复、Figma设计、Chrome许可、模板写权或成本原数的条件保具体unknown/incomplete，不整批宣布通过。

## 测试标准

项目测试面是方法消费、文本检查器、既有保护合同、独立完整旅程、驾驶舱浏览器交互、系统Chrome动作、成本原数和原始来源登记。P1、P2 的纯.md方法语义子面无可实用行为 RED 时具名 G-2；P2、P4 的 YAML 来源登记另用 method-adoption 真实 RED/GREEN（混合整卡不豁免）：独立读者消费完整正常/失败输入并给反例判定，静态合同只证字面保护。P3检查器用同一目标RED/GREEN，围栏、派生号与三种缺项作为独立事实oracle。P4删除既有预算断言是评分逻辑变化，必须沿TCR及同次独立审查，保旧断言字节与失败；不能改常量值绕开TCR。P5同一个技能合同测试按TCR-N6-PAGE-ORACLE-SPLIT区分core与template组：core的具名过滤只证技能本体、来源与职责登记；template组保原文件存在、bundle登记、离线与宿主边界断言全部强度，full命令仍包含全部组。无用户真实设计时core可得局部GREEN，但template/full保持RED及相关AC未完成，不能宣布技能模板完整可用；视觉和交互另按实际页面隔离浏览器实测。〔已改正（审查修正 I4）：旧写法主语写「P1/P2…具名G-2」而括注写「P2/P4含YAML来源登记」，主语与括注指向两套范围；现拆成「P1、P2 走 G-2；P2、P4 的 YAML 登记另用 method-adoption 红绿」〕

各面精确命令由对应Phase持有：P1/T001研究消费与既有研究合同；P2/T002问答完整正反材料及 `tests/contract/n6-method-adoption-target.test.mjs` 的P2来源登记目标；P3/T003 `tests/contract/n6-decision-unit-target.test.mjs`、`tests/contract/n6-decision-real-source-target.test.mjs`及受影响邻接；P4/T004同一method-adoption测试的P4来源登记目标、既有charter目标与草图实观；P5/T005 `tests/contract/answer-as-page-skill.test.mjs` 的core组、仍需设计输入的template组及完整suite，浏览器与系统动作分别核；P6/T006 ORACLE-T1全旅程、全部AC与成本。任何面若未测，按其原条件给具名理由；本卡没有数据库迁移、认证协议或服务API改动，不给它们制造测试。

oracle与样本在实现前固定，来源是父PRD原义、本decision已确认裁决和本Appendix A；不能从实现输出重算预期。自然语言质量由未参与写作的独立读者消费完整输入，按 `docs/architecture/test-asset-governance-rules.md#验收标准可执行形式der-01der-11r-001fr-16ac-16` 同尺判好坏。物理只读/隐藏未建立就记未建立，不以DO NOT TOUCH文案冒隔离。目标失败、环境/夹具失败、本来就通过分别归因；实际RED/GREEN退出与stdout/stderr原件存task facts，本文不预填结果。

### UI三源与规范职责

raw_requirement：需求索引§3.9的R012及BT024/028/031/032/033/034明确页面、双栏、折叠、高亮与驾驶舱，UI=true。project_inventory：实读package.json只见CLI检查/Vitest，无当前产品Web服务；已有首版HTML被判失败、历史渲染不是本次active设计，UI事实是任务库派生页而非产品路由。planned_or_changed_frontend_fact：ADR012及本规格P5规划单文件HTML模板/页面，UI=true且设计延期。三源合并按UI，不能以CLI仓库标签绕过Web验收对象。

| 专业类 | 实质来源 / 作用域 | owner → consumer | 适用规则 / 缺口 |
| --- | --- | --- | --- |
| 领域语义 | `GLOSSARY.md`及本decision编号解释；当前WH | 领域owner → 页面文案 | 沿真实术语，不以实现字段替读者概念 |
| 视觉设计系统 | ADR012 BT028修正、BT033/034；本驾驶舱 | 用户设计owner → 后续模板作者 | 克制配色/留白/层级为要求；token、Figma定稿missing |
| 组件及设计代码对应 | 外源17组件词汇/ADR012；仅方法采用 | answer-as-page owner → 生成者 | 不声称有现成生产组件；实际mapping deferred |
| 布局与场景 | ADR012层级树＋左右分栏/驾驶舱 | 布局owner → 模板/页面 | 当前是需求规范；响应式/overflow设计未定 |
| 通用交互 | ADR012折叠/跳转/高亮/已读 | 交互owner → 页面/验收 | 真实键盘焦点和状态需后续浏览器观察 |
| 前端工程 | package.json、单文件/零依赖要求 | P5实施者 → 生成者 | 无新框架/服务；HTML规范当前不冒可运行模板 |
| 内容与设计工艺 | WR001、ADR011/012与原始批次 | 内容owner → 用户 | 少字不丢指针/缺口，不重新复制规范 |
| 质量判据 | Appendix A；isolated-browser-qa/frontend-testing | 独立验收者 → 用户 | 视觉延期不宣通过；实际viewport与页面待提供 |

专业类定位沿已读 `skills/ui-project-init/SKILL.md#规范职责`；本动作只规划适用规则与缺口，没有执行八类专业设计生成。上游版本/字节来源沿catalog与参考原件；不把标题slug当现成设计绑定。缺Figma实质源影响视觉定稿，不影响其余方法与检查器规划。

### 验收对象

```json
{
  "workspace": "/Users/Hugh/Hugh/Project/workflowhub-n6-skeleton-module-decision-20261019",
  "service": "N/A（单文件 HTML、无后端服务；取得真实 HTML 后再定字段语义）",
  "route": "N/A（单文件 HTML、无路由；取得真实 HTML 后再定字段语义）",
  "state": {"execution": "not_run", "scope": "P5驾驶舱与独立全任务验收；当前只有规划合同"},
  "viewport": null,
  "owner": "用户"
}
```

workspace来自认证工作区；state来自本计划尚未实施的事实；service、route 记 `N/A`：单文件 HTML 没有 service／route，字段语义待取得真实 HTML 后再定（不先用 null 冒「待提供」，也不填示例端口或路由）；viewport 由用户后续设计／实际观察提供。缺项照实保持，不能拿旧失败页、默认尺寸或示例端口顶替。模板唯一 `checkAcceptanceObject` 的实际调用由build-plan核本对象与三源材料，输出仅证最小输入存在，不证健康或业务通过。〔已改正（审查修正 service/route）：旧写法 `"service": null`／`"route": null` 并在本段写「service、route 由 P5 页面 owner 在取得实际 HTML 产物后提供」；依据单文件 HTML 无服务/路由的事实与本次裁定，另注明「取得真实 HTML 后再定字段语义」〕

## 架构边界

主会话和独立子代理消费自然语言方法，runtime只保既有窄事实底座。chain检查器读显式传入文本，输出advisory事实；它不查找任务、不写进度，也不做语义质量裁决。页面生成者消费已有权威源后输出派生HTML与逐节点比较侧车，不能把展示状态写成第二进度来源。接口跨模块时只传内容/引用，不暴露任务存储对象或临时文件机制。

## 实现设计（全局权威）

### 代码锚点

先读 `workflows/make-decision/SKILL.md#方法` 的 `outline-hypothesis-talk`、`research-and-diverge`、`outline-revision-check`、`outline-talk`、`adversarial-direction-check`、`module-breadth-confirm`、`module-convergence`、`write-decision-draft`；steps.json只同步可观察结果与完成证据，deps只同步既有触发文本。P1先改第3步研究分工，P3读回P1后改完整流程，不能整份覆盖先写者。

研究锚点：knowledge-graph入口/查询/降级；deep-research轻研究/R1/R4/消费与所有权。提问锚点：talk用户可见说话、2.1、每答重排与公式；grill的Sharpen fuzzy language承载模糊分类与地板提示，四项退出保持。D1–D4在P2，D5–D6在P3，D7在P1，每处按当前实读正文定位而非旧行号。

工具锚点：`tools/cli/check-decision-log-chain.mjs` 的 `decisionSections`、`checkDecisionLogChain`、`main`；真实测试 `tests/contract/card05-decision-boundary-target.test.mjs` 钉四父字段的独立期望。预算锚点：charter合同的 `RESIDENT_BUDGET` 与唯一相关it块；断言删除走TCR，不动其余it。〔已改正（合并影响 6240f199）：**该预算门现在两棵树都是红的**——合并把 N5 的 `AGENTS.md` 与 `GLOSSARY.md` 带入本 worktree，实测 worktree 三件＝13,033＋1,081＋25,084＝**39,198 字节**，已超 `RESIDENT_BUDGET = 36861`（主仓同值）。故 P4 必须**先退役该断言、再写 `AGENTS.md`**；读数只作对照、不作判据。〕

### 接口与失败语义

沿 `checkDecisionLogChain({markdown,source_ref})` 原输入，识别文本内完整单元表（`单元|谁接|落在哪|怎么验`）。`R-002a`等派生号是同源单元ID，缺谁接/落点/验收分别报告警告；围栏里的示例不声明单元。复用现 `warnings` 字段、warning形状与 `source_ref`，不新增持久输出或自动修复。旧ADR父字段计数与历史分支不变。单元表兼容索引原件的“派生号”列名和覆盖表的“需求”列名：只沿明确表头匹配职责/落点/验收列，单元ID从对应单元格取派生号，不扫描任意散文数字；原unit test的“单元”只是最小fixture，新增冻结 `tests/contract/n6-decision-real-source-target.test.mjs` 用两真实表头及原行的固定小样例和缺项反例；实源字节已一次性独立核对，目标测试不在每次运行时依赖私有任务库，纳入P3同一gate，不把具名case留作散文。两个核查时点由方法明确用CLI `--file`分别读当前需求索引与覆盖原件；默认run-checks不会因为修改了函数就自动读任务库，不声称已接线。警告只给人看，CLI成功退出不说明语义覆盖通过。

研究留存的具体节位：需求索引§5保存本任务自己的研究导航；同件既有材料表/决定外置事实索引逐件登记原ref，取舍就近沿既有内容格写原因，不另产研究索引台账。零消费者 `runtime/evidence/research-report.mjs` 仅在reuse本卡新节登记职责、consumer缺口、owner与保留/删除条件；不修改或接线它。它的JSON报告契约不拿来强制自然语言报告。

驾驶舱技能只采用外源正文与设计词汇，按宿主无关核心写内容/呈现分责、出页判据、17组件词汇、选型、少写观与回复数据边界。输出路径由调用者提供。`skills/answer-as-page/templates/overview-template.html` 是预登记未来模板路径；当前只交规范与替换条件，不声称该文件存在或可用；有用户新设计及明确确认后，P5同一完整交付承担模板、bundle、页面与浏览器首次验证，不能把接线/测试另拆末任务。替换前后核离线、折叠、高亮、双栏、四环追溯与进度能力；未获设计保P5相关条件incomplete，不自动搬CLI兜底。

较大变化触发仍沿ADR012。各阶段接口在本规格登记，不改它们正文：build-plan主会话在spec/独立Phase定稿或实质范围/验收改变时更新计划区；build-code原执行owner在任务实际完成或完成声明被修正时更新任务/改动区；verify-code原验收owner在逐AC结果形成或修正时更新结果位置。更新由同一页面承担者执行，只读现有事实；若页面设计仍暂停，记录未更新与原因，不能生成新样张。`figma-make-prompt.md` 是本build-plan实际产物，由主会话唯一写，不推给build-code。

自动打开是生成步骤的系统动作，不把Chrome脚本塞成通用技能的宿主硬依赖；找到同名标签则切换刷新，没有才新开，权限缺失如实报未打开。浏览器QA走隔离网关，不借用户登录态；Chrome标签操作的真实系统能力另记，不能用隔离浏览器成功冒系统授权成功。

### 全局文件边界与依赖

以下是build-code允许范围，写集不是实施或接受事实。NEW只有已经具名当前consumer的能力；planned模板不能冒实际新增文件。各Phase写集必须为此子集，写入前读当前字节。任务材料只由本build-plan作者改，本节不授权build-code回改验收合同。

**NEW**：`skills/answer-as-page/SKILL.md`；`skills/answer-as-page/skill-bundle.json`。四个具名测试归本build-plan的source_audit唯一预写/冻结验收源，build-code只读：`tests/contract/n6-decision-unit-target.test.mjs`、`tests/contract/answer-as-page-skill.test.mjs`、`tests/contract/n6-decision-real-source-target.test.mjs`、`tests/contract/n6-method-adoption-target.test.mjs`。它们不是未来Phase可改实现文件；TCR只按下文具名范围修改评分。conditional NEW（真实设计返回及用户确认后才写）：`skills/answer-as-page/templates/overview-template.html`，由P5原owner在用户设计确认后同包落地与登记；没有该真实文件时bundle不伪列已交付文件。

**每个 NEW 项的替代关系与删除条件**（AGENTS 要求新增文件同时写明唯一 consumer、owner、替代关系和删除条件，本节逐项补齐）：`skills/answer-as-page/SKILL.md` ＝替代关系「无」（新技能，不替换任何现役文件；职责承接 ADR-012 搬迁块），删除条件＝若真实设计确认后判定只保留模板、或该技能的真实 consumer 消失，由 P5 原 owner 删除，删前在 `skills/catalog.yaml` 与 reuse 记退役理由与原 ref，模板与页面落点另按 AC-106 处置；`skills/answer-as-page/skill-bundle.json` ＝与 `SKILL.md` 同生同灭，随其删除条件一并处置，删前保同字节旧原件；`skills/answer-as-page/templates/overview-template.html`（conditional）＝替代关系「替换旧失败稿与暂停样张占用的视觉位」（不替代任何现役文件），删除条件＝真实模板定稿替换后，旧条件模板与样张由 P5 原 owner 移出活动路径、留 ref 与原因，不静默删。〔已改正（审查修正 E5）：旧 NEW 段只列路径与 owner，未写替代关系与删除条件；依据 AGENTS「新增生产文件必须同时写明唯一 consumer、owner、替代关系和删除条件」与本次审查〕

**MODIFY**：`workflows/make-decision/SKILL.md`；`workflows/make-decision/steps.json`；`workflows/make-decision/skill-deps.yaml`；`skills/knowledge-graph/SKILL.md`；`skills/deep-research/SKILL.md`；`skills/talk-with-zhipeng/SKILL.md`；`skills/grill-with-docs/SKILL.md`；`tools/cli/check-decision-log-chain.mjs`；`AGENTS.md`；`tests/contract/delivery-closeout-charter-contract.test.mjs`（仅已声明TCR）；`skills/catalog.yaml`；`skills/reuse-registry.md`；`THIRD_PARTY_NOTICES.md`；`docs/architecture/move-map.json`。

**build-plan材料NEW**：`specs/n6-skeleton-module-decision-20261019/spec.md`（spec作者唯一写）；`specs/n6-skeleton-module-decision-20261019/figma-make-prompt.md`（主会话唯一写）；六个独立Phase与纯指针index（Phase作者唯一写）；`tests/contract/n6-decision-unit-target.test.mjs`、`tests/contract/answer-as-page-skill.test.mjs`、`tests/contract/n6-decision-real-source-target.test.mjs`、`tests/contract/n6-method-adoption-target.test.mjs`（**四个**具名测试统一由 source_audit 在本 build-plan 唯一预写/冻结；此处按「本材料同批新增」列全，不再写成「2 个本阶段新建」＋「2 个此前已冻结」，因为四件都是本 build-plan 内新写，见上方 NEW 段的冻结声明）。不新增plan.md/tasks.md。〔已改正（审查修正 I1）：旧写法此处只列 2 个（real-source、method-adoption）并注「source_audit本阶段唯一作者」，而上文 NEW 段写「四个具名测试归本 build-plan 的 source_audit 唯一预写/冻结」，两处对不上；现统一为「四个由 source_audit 在本 build-plan 预写/冻结」〕

**build-plan材料 NEW 项的替代关系与删除条件**：`spec.md` ＝替代本任务此前的计划草稿（同路径就地改，不另立第二份），删除条件＝任务归档后随任务目录只读保留、不删；`figma-make-prompt.md` ＝替代关系「无」（新件；`figma-make-prompt-revision.md`／`figma-make-prompt-revision-2.md` 是并行件与第二轮补充件，不替代现行件），删除条件＝真实模板定稿并经用户确认后，由下一阶段 owner 登记为只读历史并留原 ref，不删原件；六个独立 Phase 与纯指针 index ＝替代关系「无」，删除条件＝随任务归档只读保留、不删；四个具名测试见上条统一口径，删除条件＝被具名 TCR 取代或对应能力退役时保留同字节旧原件并记原 ref，不静默删。〔已改正（审查修正 E5 材料侧）：旧 build-plan材料NEW 段未写替代关系与删除条件；依据 AGENTS「新增生产文件必须同时写明唯一 consumer、owner、替代关系和删除条件」与本次审查〕

**DO NOT TOUCH实读记录（2026-10-19，使用cat/sed直接读取，非历史摘要）**：

- `specs/n6-skeleton-module-decision-20261019/decision-log.md`：当前ADR001…012、原号AC001…122、OI008/011/012/013。本文承接，不改它的历史。
- `skills/decision-log/templates/decision-log-template.md`：覆盖原文 `来源／事实与处置／落点或缺口`；外置表中的 `research.md`、`talk-batches.md`；`requirement-index.md` 的 `source_id、一句原义、来源与落点`。这些与N6口径不一致，归OI012原owner，不能暗改。
- `skills/decision-log/SKILL.md`：`## 内容边界` 下 `talk-batches.md`、`requirement-change-log.md`、`requirement-index.md` 接收规则。归同一上游owner。
- `skills/grill-with-docs/GLOSSARY-FORMAT.md`：`## Structure`、`## Rules`、`## Single vs multi-context repos`；`docs/delivery-closeout-charter.md` 的领域行实链 `skills/grill-with-docs/SKILL.md#domain-awareness` 与格式件 `#rules`。保这些锚点与既有领域语义，不能因删重复静默断链。
- `runtime/evidence/research-report.mjs`：`validateResearchReport(report, expected = {})`、`parseResearchReport(raw, expected = {})`、`readResearchReport({ read, task, ref, taskId, stage } = {})`、`researchFacts(record)`；无本卡新caller，保历史协议与事实。
- `runtime/schemas/skill-bundle.schema.json`：`required: ["schema_version", "skill", "files"]`，`schema_version.const: 1`、`additionalProperties: false`；不为新技能加schema字段。
- `skills/talk-with-zhipeng/skill-bundle.json`：`schema_version: 1`、`skill: "talk-with-zhipeng"`、`files: ["SKILL.md"]`；grill bundle同版本，`files: ["SKILL.md","ADR-FORMAT.md","GLOSSARY-FORMAT.md"]`、sources路径 `../catalog.yaml#skills.grill-with-docs`。两技能未新增附件，不改files。
- `skills/frontend-prototype-render/SKILL.md`：实读frontmatter `name: frontend-prototype-render`、无version，以及 `## 方法` 四步的真实组件/fixture/viewport、现harness、隔离浏览器与展示后确认，`## 条件降级` 的用户真实同意及回传稿最终答复边界；本卡技术草图不改此文件或替代这些义务。
- `skills/stage-reflection/SKILL.md#方法` 第3步：`node tools/cli/measure-main-agent-cost.mjs --project=<本项目> --task=<本任务> --stage=<当前阶段> --record`；成本窗口与缺报沿该原owner，不复制新计量机制。
- `workflows/build-plan/SKILL.md`（frontmatter version `4.1.0`）、`workflows/build-code/SKILL.md`（`2.2.0`）、`workflows/verify-code/SKILL.md`（`5.2.0`）：读取其frontmatter与真实方法标题。本卡只登记页面接口与owner，不修改阶段逻辑；三份steps.json均实读 `schema_version: "2.0.0"`、对应 `stage_slug`、末步 `closeout`，首步依次 `read-current-materials` / `read-current-task-documents` / `read-current-materials-and-code`。接口保留在上方设计，不把计划文字当这些文件已更新。
- `tests/contract/card05-decision-boundary-target.test.mjs`：原oracle固定完整ADR四字段 `recognized_blocks=1`、`recognized_fields=4`，缺风险报warning，legacy五字段仍保持。
- 四份本阶段验收源只由source_audit预写/受控TCR，实施worker的写集排除 `tests/contract/n6-decision-unit-target.test.mjs`、`tests/contract/n6-decision-real-source-target.test.mjs`、`tests/contract/n6-method-adoption-target.test.mjs`、`tests/contract/answer-as-page-skill.test.mjs` 以及本spec/Phase验收源。P3两份test的真实表头、legacy派生号、缺项警告/统计/exit由原literal oracle规定；P2/P4目标只核真实采用元数据，方法质量另证；P5只有TCR-N6-PAGE-ORACLE-SPLIT允许core/template拆组，不削模板强度。DO NOT TOUCH声明不证明物理只读或隐藏，实际隔离未建立时保持未建立。

其它生产runtime、schema、config与历史来源不在本卡允许写集。未列路径若发现真需求，先回当前spec owner核来源与影响，不边写边扩面。

依赖图：P1/T001无前序。P2/T002的问法设计有独立方法消费者、独占正文准备可先做；其交付集成边依P1，仅因reuse同路径前后写序，不能说研究是提问产品前置。P3/T003真实消费P1、P2的已交研究/提问方法。P4/T004的草图独占准备无业务前序；其交付集成边依P3（传递包含P2），只为catalog/notices/reuse前后writer，P3在reuse的写入须先交回。P5/T005依P3的功能输入与P4的共享登记集成边。P6/T006依P1…P5全部原件做唯一全AC验收。

共享写者：make-decision正文先P1研究分工，后P3整体流程，再P5页面生成调用指针；steps只由P3同步整体流程（研究producer→流程consumer→呈现consumer）；catalog/notices/reuse先P2提问采用，再P4技术草图来源，最后P5新技能登记；同路径不同节仍串行。reuse完整写序为P1→P2→P3→P4→P5：每后写者读回并保留前写者当前内容；这条集成串行不改变草图/提问独占准备的业务依赖。后续只在本卡新节增量，不覆盖N4旧节。move-map最后由P5新能力owner写，P3测试/工具路径如需新增职责由P3先登记，P5读回保留。P2 先做的只是提问方法与问答正文本身；catalog／notices／reuse 不随 P2 先行，仍按 P1→P2→P3→P4→P5 串行，P2 只在自己的写序点上动这三件。不能因同一人或同层就合并业务单元，也不因共享文件就制造产品依赖。〔已改正（审查修正 G5）：旧文只写 reuse 的完整写序，未写明「P2 先做的是正文、三处登记件仍串行」，易被读成 P2 可先动 catalog/notices/reuse；依据本设计共享写者序与本次审查〕〔已改正（合并影响 6240f199）：**三处登记件的基线已被 N5 改动**（`reuse-registry.md` 新增 `## N5既有方法采用索引`；`catalog.yaml` 新增 `n5-dispatch-and-return`；`THIRD_PARTY_NOTICES.md` 新增 2 条）。本卡的新节与新条目**一律排在 N5 之后、按同一形状写**（reuse 节＝「来源、固定版本、许可与未证实项唯一回 `catalog.yaml`，此处只索引正文」），写前读回 N5 现行内容。〕

**本卡不设并发数值上限**（依据：合并 `6240f199` 带入的 `GLOSSARY.md`「并发」术语——「本项目不设并发数值上限，同时进行的工作由各阶段按真实独立输入与互斥写面临场决定，共享文件仍由唯一写者串行处理」，并明确 `_Avoid_: 并发区间、并行上限、统一并发判据`）。本卡当前的实际安排＝主会话＋独立验证者（研究/审查/验收读者）＋单一实施 writer 三个角色；共享文件只有一个 writer，独立读者只读、不同时写共享路径；**并发数不作判据、不作质量门**。〔已改正（合并影响 6240f199）：上游已取消「并发区间」这个概念——N5 从 `AGENTS.md` 删除了「五阶段共用并发区间为 2–5」那句，并在 `GLOSSARY.md` 新增「并发」术语明确「不设并发数值上限」且 `_Avoid_: 并发区间、并行上限、统一并发判据`。故本条不再写「2–5」这个取值，改为「不设数值上限＋按真实独立输入与互斥写面临场决定」；旧写法与旧「本卡规划取值」的口径保留在下一条已改正记录里。〕这与 P6 自有组合不同：P6 由同一独立验收者按 AC 顺序逐条消费全部原件、不再并行开共享 writer 槽、也不新开 3 槽，避免把「多读者」读成「多权威」。P1/P2 可先并行非共享正文准备，登记阶段按真实独占 writer 串行；Phase 顺序与文件集不能用口头「别撞」替代。〔已改正（审查修正 G6）：旧写法「任务级并发为2–5：当前采用3个工作槽…」未给来源、未写 3 槽的组成、也未说明与 P6 的差别；依据 AGENTS 并发相关句与本次审查。注：AGENTS 无「2–5」明文，故如实标为本卡规划取值〕

### 需求到任务追踪

| 来源 / 决定 | FR | AC原号（仅导航） | 完整交付 / oracle | 正反对象与边界 |
| --- | --- | --- | --- | --- |
| R-008；R-007；ADR-009/008；U-041及真实澄清 | FR-N6-009、FR-N6-008 | AC-011、AC-013、AC-025、AC-027、AC-079、AC-080、AC-084、AC-085、AC-091、AC-092、AC-093、AC-094、AC-095、AC-096 | P1/T001；ORACLE-N6-RESEARCH | 完整问题/内外三保障；零结果和上游模板缺口分别显露 |
| R-005；R-006；R-011；ADR-005/011/008；父PRD:287 FR-T11-001/FR-T11-002/FR-T11-004；AC-T11-1/2/4/5/7 | FR-N6-005、FR-N6-011、FR-N6-008 | AC-003、AC-010、AC-011、AC-012、AC-022、AC-025、AC-039、AC-040、AC-050、AC-054、AC-055、AC-056、AC-057、AC-058、AC-079、AC-080、AC-081、AC-082、AC-083、AC-084、AC-085 | P2/T002；ORACLE-N6-QUESTIONING | 真未决问题与模糊回应；不把受控答复冒真人 |
| R-001；R-002；R-003；R-004；R-010；ADR-001/002/003/004/007/010/008 | FR-N6-001、FR-N6-002、FR-N6-003、FR-N6-004、FR-N6-007、FR-N6-010、FR-N6-008 | AC-001、AC-002、AC-004、AC-005、AC-006、AC-007、AC-008、AC-009、AC-010、AC-011、AC-012、AC-014、AC-015、AC-016、AC-017、AC-018、AC-019、AC-020、AC-021、AC-024、AC-025、AC-026、AC-028、AC-030、AC-031、AC-032、AC-033、AC-034、AC-035、AC-036、AC-037、AC-038、AC-041、AC-042、AC-043、AC-044、AC-045、AC-046、AC-047、AC-048、AC-050、AC-051、AC-052、AC-053、AC-081、AC-082、AC-083、AC-091、AC-094、AC-097、AC-098、AC-099、AC-100、AC-101、AC-102、AC-115、AC-116、AC-079、AC-080 | P3/T003；ORACLE-N6-SKELETON | 同原需旅程与三缺表；拒绝/未答/新增/取消 |
| R-006；R-007；ADR-006/008；父PRD:287 FR-T11-001/FR-T11-002/FR-T11-004；AC-T11-1/2/4/5/7 | FR-N6-006、FR-N6-008 | AC-011、AC-012、AC-023、AC-025、AC-049、AC-058、AC-059、AC-060、AC-061、AC-062、AC-063、AC-079、AC-084、AC-085 | P4/T004；ORACLE-N6-SKETCH | 适用合成分歧与四类禁用；产品选择归用户 |
| R-012；R-004；ADR-012；同一采用纪律AC-T11-1/2/4/5/7 | FR-N6-012 | AC-064、AC-065、AC-066、AC-067、AC-068、AC-069、AC-070、AC-071、AC-072、AC-073、AC-074、AC-075、AC-076、AC-077、AC-078、AC-086、AC-087、AC-088、AC-089、AC-090、AC-103、AC-104、AC-105、AC-106、AC-107、AC-108、AC-109、AC-110、AC-111、AC-112、AC-113、AC-114、AC-117、AC-118、AC-119、AC-120、AC-121、AC-122 | P5/T005；ORACLE-N6-COCKPIT | 真来源四环/缺环/高亮；缺设计保持未验 |
| R-001；R-002；R-003；R-004；R-005；R-006；R-007；R-008；R-010；R-011；R-012；U-016；父PRD ORACLE-T1；只聚合AC-T11-1/2/4/5/7原件；AC-T11-6保原号且数字约束已退役 | FR-N6-001、FR-N6-002、FR-N6-003、FR-N6-004、FR-N6-005、FR-N6-006、FR-N6-007、FR-N6-008、FR-N6-009、FR-N6-010、FR-N6-011、FR-N6-012 | AC-001、AC-002、AC-003、AC-004、AC-005、AC-006、AC-007、AC-008、AC-009、AC-010、AC-011、AC-012、AC-013、AC-014、AC-015、AC-016、AC-017、AC-018、AC-019、AC-020、AC-021、AC-022、AC-023、AC-024、AC-025、AC-026、AC-027、AC-028、AC-029、AC-030、AC-031、AC-032、AC-033、AC-034、AC-035、AC-036、AC-037、AC-038、AC-039、AC-040、AC-041、AC-042、AC-043、AC-044、AC-045、AC-046、AC-047、AC-048、AC-049、AC-050、AC-051、AC-052、AC-053、AC-054、AC-055、AC-056、AC-057、AC-058、AC-059、AC-060、AC-061、AC-062、AC-063、AC-064、AC-065、AC-066、AC-067、AC-068、AC-069、AC-070、AC-071、AC-072、AC-073、AC-074、AC-075、AC-076、AC-077、AC-078、AC-079、AC-080、AC-081、AC-082、AC-083、AC-084、AC-085、AC-086、AC-087、AC-088、AC-089、AC-090、AC-091、AC-092、AC-093、AC-094、AC-095、AC-096、AC-097、AC-098、AC-099、AC-100、AC-101、AC-102、AC-103、AC-104、AC-105、AC-106、AC-107、AC-108、AC-109、AC-110、AC-111、AC-112、AC-113、AC-114、AC-115、AC-116、AC-117、AC-118、AC-119、AC-120、AC-121、AC-122 | P6/T006；ORACLE-N6-ACCEPTANCE | 全原号逐条件读回；首次验收留前序，不拿汇总冒实跑 |

共同采用原号在原trace对应格继承，精确原义读父任务原件 `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/skills-framework-redesign-20261014/quality/evidence/decision-log-refs/s3/T11-external-skill-migration.md#4-验收标准`（107–113）与父PRD:285–287：AC-T11-1的逐项处置/文件落点→本地AC-022/054–058（P2）、AC-023/059–063（P4）、AC-072/075/078（P5）；AC-T11-2的实际生效→AC-022/055（P2）、AC-023（P4）、AC-064/118（P5）；AC-T11-4的来源notice含pstack→AC-012/084/085（P2/P4）及AC-076/078（P5）；AC-T11-5的现编号一致→AC-012/084/085，本次当前owner为N6，历史T/M原文只读；AC-T11-7的制造违规→报出→撤销原始输出→AC-022/023/032/077各自首次Task，P6只消费已有原件及必要未闭环case。FR-T11-001/002/004沿父PRD:287引用这些聚合责任；已读原T11没有逐FR定义，不反造三条新功能定义。AC-T11-6旧净长度/常驻约束保原号与被取代来源，已被本decision U-007/U-034/AC-049取消，不作为当前成本通过条件。

受影响23保护按父PRD:751–756限本次采用：`research`→P1保持现轻分支内存、深分支R0–R5、原文/付费/失败边界；`prototype`→P4只新增隔离技术草图，既有 `skills/frontend-prototype-render/SKILL.md` 的真实组件Preview、隔离QA和展示后真实确认完整只读保留，技术草图不能扩大视觉原型许可。其余21项 `handoff`、`wait-what`、`chief-of-staff`、`deprecation-and-migration`、`frontend-ui-engineering`、`how`、`guard-the-context-window`、`separate-before-serializing-shared-state`、`migrate-callers-then-delete-legacy-apis`、`outcome-oriented-execution`、`feature.md`、`bug-fix.md`、`visual-parity.md`、`investigation.md`、`trace-forensics.md`、`babysit.md`、`shipping.md`、`session-pickup.md`、`pause-safely.md`、`authoring-a-skill.md`、`worktree-cleanup.md` 不作为本次三项机制采用或替换的来源，保持各原owner/消费者不动；不是宣布全仓保护已验证。独立审查按本Phase真实diff核有无触及其原消费者；出现实际波及即由该Task局部补核原文与失败边界，不因文件名未改就断言零影响，不启动无范围23项全量回归。

AC与Phase/Task的逐条分配以Appendix A同条“验证”唯一维护；P6覆盖全部原号，不重新定义标准。每个Task反向可回上表当前来源，不能用ID出现冒语义覆盖。

**AC 号 → 测试文件:case 名（最小对照，只作导航；没有 case 的写「人读，无 case」）**

| AC（按主题分组） | 测试文件 | case 名／读法 |
| --- | --- | --- |
| AC-032（扩检查器认派生号、两时点、只报不阻断；最小 fixture 面） | `tests/contract/n6-decision-unit-target.test.mjs` | `N6 unit: complete R-002a has no missing-field or invalid-id warning`；`N6 unit: a derived requirement id remains valid in legacy requirement_ids`；`N6 unit: CLI remains advisory and exits zero for an incomplete unit`；负例 `N6 unit: fenced fake tables cannot declare incomplete units` |
| AC-032、AC-016（真实表头「派生号」「需求」与派生号跨表；真实输入面） | `tests/contract/n6-decision-real-source-target.test.mjs` | `N6 real source: <sample> complete <id> has no warning`；`N6 real source: <sample> <id> missing <field> is identified`（逐字段参数化） |
| AC-056（来源「不许给用户列选项」逐字不采用）、AC-062／AC-084（第三项来源的 `capability_decisions` 条目） | `tests/contract/n6-method-adoption-target.test.mjs` | `P2: <name> registers its N6 Addy source and actual portable consumer`；`P2: source ban on offering options is explicitly not adopted for N6`；`P4: prototype capability records the N6 source, adopted scope and actual AGENTS owner boundary` |
| AC-077、AC-078、AC-084、AC-085（技能正文/bundle/职责登记/登记字段实测） | `tests/contract/answer-as-page-skill.test.mjs` | core 组六例（frontmatter、bundle、17 组件、catalog、职责登记、宿主边界）；template 组两例（`template: N6 page skill: bundle distributes the caller-filled single-file template offline`、`template: N6 page skill: active template contains no upstream host paths, background commands or bundled renderer`）。无用户设计时 core 可局部绿、template/full 保持红 |
| AC-049（删 charter 原预算断言，经具名 TCR 与同次独立审查） | `tests/contract/delivery-closeout-charter-contract.test.mjs` | 仅具名 TCR 的那个 it 块（原预算断言已删，其它内容检查保留） |
| **不属单条 AC**：ADR 四父字段统计与 legacy 五字段（§9 兼容性的受保护合同） | `tests/contract/card05-decision-boundary-target.test.mjs` | 既有断言 `recognized_blocks=1`／`recognized_fields=4` 与原 warning 形状（原 oracle，只读；不拿它冒任何 AC 通过） |
| 上表未列出的其余 AC | — | **人读，无 case**（含 P6/T006 ORACLE-T1 全旅程、方法与自然语言质量、视觉与浏览器条件、成本读数；缺设计／权限／凭证时保 `incomplete`／`unknown`） |

〔已改正（审查修正 G4）：旧 §需求到任务追踪只有 AC 列表与 Phase 分配，没有任何「AC 号 → 测试文件:case 名」的对照，读者无法从 AC 回具名 case；现补最小对照表，没有 case 的显式写「人读，无 case」。本表只作导航，不新增测试、不改判据。〕

### 全局验证策略

单轮050异源建议的修复边界：P2/P4新增method-adoption只验真实来源登记采用/拒绝边界，另由独立完整输入消费验方法质量；P3实源表头target与原最小fixture同gate，TCR-N6-REAL-SOURCE-FIXTURE只将输入供应改为已核真源的固定小样例，不改8case与评分；P5按AG049给出的替代方案执行TCR-N6-PAGE-ORACLE-SPLIT，不采用其早期默认模板建议（该建议已被BT-033/AC-122暂停样张与设计所取代）。拆组保原模板断言与full失败事实，core绿不是full绿。预算断言删除仍是另一具体TCR，原判据/失败字节与同次独立审查保留。

具名目标命令：`node node_modules/vitest/vitest.mjs run tests/contract/n6-decision-unit-target.test.mjs`。它是P3配对RED/GREEN入口，实际冻结输入、期望与失败原件见下；其它面的精确命令仍沿所属Phase，不把本条变成全量回归。

已读四份冻结目标测试与真实原件。原unit测试sha256 `95cc2456e263369b7944d826e7196509f2176f4fdb52292467b897370f35f4ea`，8 测（unit target）4 目标失败／4 通过〔已改正（审查修正 I5）：旧写法只写「8测4目标失败/4通过」，未说明是哪个文件的 8 个 case；现补文件名，读数与判据未改〕，原件 `quality/tests/2026-10-19-002-build-plan-n6-unit-red.output` 及同名json。原页面测试sha256 `ca66def16d8679f99ef8a81cb686e787d26a348a3ff97ea318d29b1d896dde6c` 的6个目标失败，仍保 `quality/tests/2026-10-19-004-build-plan-answer-page-red.output`；改前完整字节保 `quality/evidence/2026-10-19-013-answer-page-before-oracle-split.mjs`，不改写旧RED。

050建议后的当前冻结身份及RED：

- `tests/contract/n6-decision-real-source-target.test.mjs` 经TCR-N6-REAL-SOURCE-FIXTURE的当前sha256 `d83a8445d6d59390bd1b7e82552c2e4b14b0eab7b5cfdc6c7255ea13fe596744`：固定小样例取requirement-index的“派生号/R-002a”和coverage的“需求（含派生号单元）/R-001b”完整表头与字面原行；`quality/tests/2026-10-19-012-build-plan-real-source-readback.output` 一次性独立核源全文hash/header/row字节一致，output sha256 `48612c439c686c942113debb92b1e4648665095c47e52032c2b1daac390f687c`，exit0。每次target运行不读取私有任务库、不用fs或环境变量；全部 8 case（real-source target）／评分不变〔已改正（审查修正 I5）：旧写法只写「全部8case/评分不变」，未说明是哪个文件的 8 个 case；现补文件名，读数与判据未改〕。最新同命令两个完整case通过，六个分别缺谁接/落点/验收的目标case失败、零跳过；原件 `quality/tests/2026-10-19-013-build-plan-real-source-portable-red.output`，output sha256 `199c1cd89a73b0d6f89dc68610b694098d537f366d58a2e37d56b62020175395`，同名json记录具名Vitest命令、exit1与完整非截断事实。旧测试sha256 `1f34e4ccaa201d038f37cf591be0e8e1f0c1137303c74b362f95372f7b09486f` 留于 `quality/evidence/2026-10-19-021-real-source-before-fixture-tcr.mjs`，旧实源IO的RED仍保 `quality/tests/2026-10-19-006-build-plan-real-source-red.output`（output sha256 `d48387c59670b75380deb7d947a9447cc54b326b49b33d7ef1025709fa913cb0`）；供应修正事实见 `quality/evidence/2026-10-19-023-real-source-fixture-tcr.md`，不声称实际CI执行或GREEN。
- `tests/contract/n6-method-adoption-target.test.mjs` sha256 `1531f1ef1d6233192f3469640224ee955c265fbc6a726ead1ee6fba488cbf36c`：`--testNamePattern=^P2:` 实际3目标失败、另1项被过滤，原件 `quality/tests/2026-10-19-010-build-plan-p2-adoption-red.output`，output sha256 `a20d396d48dc3b3468c1b4d38483a0c48e715573a4dbbc7a22990b25f603801a`；`--testNamePattern=^P4:` 实际1目标失败、另3项被过滤，原件 `quality/tests/2026-10-19-011-build-plan-p4-adoption-red.output`，output sha256 `584827deb5f4d858bda807cdc8524f1ae6ad053006d9a92210ed0edf14201a0c`。命令/exit1沿各同名json；只证Addy两采用来源、逐字不采用条款及pstack能力登记缺口，不证自然语言方法有效。
- `tests/contract/answer-as-page-skill.test.mjs` 经TCR-N6-PAGE-ORACLE-SPLIT的当前sha256 `9d669a49bb299f8aaa599e518c7b68b67e594abdde7afad0f7ed3ecfba377c19`：core组6case、template组2case；`--testNamePattern=^core:` 实际6目标失败、2项被过滤，原件 `quality/tests/2026-10-19-008-build-plan-page-core-red.output`，output sha256 `461b2bd70862cce5526246f12f0dc1ef19c9caa72d2f5250de40623c02caf881`；无过滤full实际8目标失败、未跳过，原件 `quality/tests/2026-10-19-009-build-plan-page-full-red.output`，output sha256 `00356393077f1543326c2dd524c32073fb23c903e836a8e83f8c8c3305574254`，各同名json记录exit1。core的body宿主边界与template的宿主边界分别保原同尺断言，template文件/bundle/离线条件仍全部存在。

以上命令均走已存在 `node node_modules/vitest/vitest.mjs run` 的具名文件及具名过滤，cwd为认证工作区，精确实施gate见各Phase。过滤项未执行，不作通过；完整suite始终不带过滤。001旧原件是缺node_modules的环境失败，不计RED。模板路径继续 `templates/overview-template.html`，不靠改名或静态目标转绿扩大被暂停的设计范围。以上RED证明明确缺行为/产物/登记，不证明实现、方法质量、真实旅程或视觉通过。

本卡混合交付（方法、advisory CLI扩展与未来HTML），主测试路线至少feature；涉及系统浏览器与跨源页面的P5按fullstack预判，具体技能/面由Phase指定。P6必须保留，纯文档G-2不免混合任务末验收。

RED只有预写目标断言真正失败才有效；新chain测试原件归build-plan source_audit，实施者只读。同命令GREEN不能更改评分；预算断言删除经具体TCR与同次独立审查。仅跑受影响具名集合，禁止无范围vitest/npm test/test:safe。P6不再重跑已有充分通过项，只消费一次原件及必要未闭环case。生成页报告exit0不成为质量绿；原始失败、缺项与无独立结果留真实档位。

## Appendix A — 验收判据（唯一权威）

保留decision-log原号AC-001…AC-122。每条 `AC-N6-nnn` 只是同条canonical别名，不是新标准或第二分母。四条已合并标准只指目标条。本文条件覆盖历史更正后的现行语义，历史原文仍在decision-log，不重复粘贴更正链。所有证据均指预期类型，未发生的执行不预填通过。

**统一证据与来源规则（全 122 条共用一次；各条只写与本节规则的差异，不另重述）**

1. **原件命名规则**：证据件用 `<日期>-<序号>-<主题>.<ext>`（现 `quality/evidence/`、`quality/tests/` 的实际命名，如 `2026-10-19-013-build-plan-real-source-portable-red.output`）；来源调研件用 `<主题>-<日期>.md`（如 `research-n6-external-sources-2026-10-19.md`）。同一事实只留一个同字节原件，同字节多份就链回它；不存目录快照、整树 tar、`git archive` 产物或文件树清单。
2. **来源只列该条真实来源，不再全列**：每条「来源」只写该条的真实来源；历史形成的共列串（`R-001/R-002/R-003/R-004/R-007/R-010 / ADR-001/002/003/004/007/008/010`）按旧写法原样保留、不删，但自本修正起不再当来源清单读，也不承载判据；有来源差异的条目在「来源」行另列该差异。
3. **四判据形状不变**：「验证」写专属输入与读法，「通过／失败」写判据，「证据」写该条要留的原件形态。原 122 条「证据」行里的共用串（「该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围…」）即旧写法，保留不删，按本规则第 1、2 条读，不再逐条扩写。
4. **未发生不预填通过**：缺口照实写 `unknown`／`unavailable`／`incomplete`；读数（字节、行数、case 数）只作对照，不作判据。

〔已改正（审查修正 A3／C2／B5）：旧文没有统一的证据与来源规则，122 条各自重述同一串来源与同一串证据，且 `Appendix A` 开头无「来源只列该条真实来源」的口径；现于开头写一次（原件命名规则＋来源只列真实来源＋四判据形状＋未发生不预填），各条只写差异。判据（通过／失败条件）一字未删。〕

**本次 44 条「验证」由通用套话改为专属输入（旧写法原文与改动记录）**

旧写法原文＝「验证：P3/T003在交付该增量时取得当前make-decision十五步、需求索引/覆盖表、同原需求及正常/拒绝/未答/新增/取消输入；由非实施者读实际产物，执行“＜本条标题＞”；用本条通过与失败条件同尺判定，ORACLE-N6-SKELETON，精确命令见该Phase。」（AC-010／011／012／025／081／082／083／084／085 另有尾句「；跨Phase减法/字面/登记子面由P1–P4各自首验，P6只聚合原件」）。

本次把这 44 条的**输入**改为按本条主题点名的专属原件与读法，其余骨架（P3/T003 执行者、ORACLE-N6-SKELETON、四判据同尺）不动；**通过／失败条件一字未改**。受影响 44 条＝AC-006／009／010／011／012／015／016／017／018／024／025／026／028／030／031／034／035／036／037／038／041／042／043／044／045／046／048／050／051／052／053／081／082／083／084／085／097／098／099／100／101／102／115／116。依据：独立审查 B4。

- **AC-001** — 同一份原始需求加同一组受控提问输入，分别跑改造前与改造后

别名：AC-N6-001；关联FR-N6-004；来源R-001/R-002/R-003/R-004/R-007/R-010 / ADR-001/002/003/004/007/008/010。
验证：P3/T003由实施者取得父PRD ORACLE-T1同一份原始需求、同一组明确标注受控Talk输入、真实基线与候选方法，独立执行者分别消费后并排读两侧需求单元/骨架答复/五段/故事/新增回收；P6核完整原件。ORACLE-N6-SKELETON的受控答复只证分支，不冒本次真人确认；真实旅程另取主会话实际答复。
通过：两侧产物可并排读出需求单元、骨架答复、五段、故事与新模块回收。
失败：任一侧缺单元，或用旧答复代新骨架。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-002** — 已并入 AC-020（用户拒绝骨架的观察点）

别名：AC-N6-002；关联FR-N6-003；来源R-001/R-002/R-003/R-004/R-007/R-010 / ADR-001/002/003/004/007/008/010。
验证：P3/T003保原号指针，由P6/T006核AC-020真实原件，不重复执行。
通过：沿AC-020全部适用条件，本号不新增独立完成结论。
失败：被拒后仍进入逐模块（同 AC-020 的失败条件）。
证据：AC-020的唯一执行原件及本号映射。

- **AC-003** — 用户给模糊答复（如「你看着办」）

别名：AC-N6-003；关联FR-N6-005；来源R-005/R-006/R-011 / ADR-005/011。
验证：P2/T002由独立读者给当前提问方法完整工作包问题与答复“你看着办”，观察具体未决及当场追问；再给具名明确选择作为正对照。ORACLE-N6-QUESTIONING；真回复与受控输入分列，不以预置yes代真人。
通过：保住具体未决、不代选、再问一次。本条只判模糊答复这一面（识别、保持具体未决、当场追问、不代选），扩散菜单七类沿 AC-054、格式与总数沿 AC-040、数量不写死沿 AC-057。〔已改正（审查修正 C2b）：旧通过条件未写本条与邻条的判面边界；依据本次审查，通过/失败条件本身未改〕
失败：把模糊答复记成同意。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-004** — 已并入 AC-021（中途新增模块的观察点）

别名：AC-N6-004；关联FR-N6-004；来源R-001/R-002/R-003/R-004/R-007/R-010 / ADR-001/002/003/004/007/008/010。
验证：P3/T003保原号指针，由P6/T006核AC-021真实原件，不重复执行。
通过：沿AC-021全部适用条件，本号不新增独立完成结论。
失败：新增模块只进大纲不收敛（同 AC-021 的失败条件）。
证据：AC-021的唯一执行原件及本号映射。

- **AC-005** — 用户取消

别名：AC-N6-005；关联FR-N6-003；来源R-001/R-002/R-003/R-004/R-007/R-010 / ADR-001/002/003/004/007/008/010。
验证：P3/T003独立执行者在已展示骨架但尚未回复的状态消费用户取消输入，读产物、未答项与已发生动作；恢复时只消费该问题的真实新回复。ORACLE-N6-SKELETON，命令/原件见P3。
通过：保留当前材料与未答项，不补写完成。
失败：取消后仍出确认或收口。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-006** — 读材料找骨架答复

别名：AC-N6-006；关联FR-N6-003；来源R-001/R-002/R-003/R-004/R-007/R-010 / ADR-001/002/003/004/007/008/010。
验证：P3/T003取得当前 `workflows/make-decision/SKILL.md` 第5步正文、`decision-log.md` 的骨架展示与真实答复批次、`requirement-index.md` §2；非实施者读实际产物，执行“读材料找骨架答复”；人读判据，无命令（读展示内容与答复原文，不拿推荐项或模拟问答代替）；用本条通过与失败条件同尺判定，ORACLE-N6-SKELETON，精确命令见该Phase〔已改正（审查修正 B4）：旧写法为通用套话输入（原文见本节开头统一记录），本次按本条主题改为专属输入，通过/失败条件未改；依据 B4〕
通过：能独立读到用户对骨架的答复与当时展示的内容。
失败：只有推断、推荐项或模拟答复。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-007** — 已并入 AC-021（逐模块节奏的观察点）

别名：AC-N6-007；关联FR-N6-004；来源R-001/R-002/R-003/R-004/R-007/R-010 / ADR-001/002/003/004/007/008/010。
验证：P3/T003保原号指针，由P6/T006核AC-021真实原件，不重复执行。
通过：沿AC-021全部适用条件，本号不新增独立完成结论。
失败：出现跨模块的大批次讨论（同 AC-021 的失败条件）。
证据：AC-021的唯一执行原件及本号映射。

- **AC-008** — 已并入 AC-024（只读整体形态的观察点）

别名：AC-N6-008；关联FR-N6-007；来源R-001/R-002/R-003/R-004/R-007/R-010 / ADR-001/002/003/004/007/008/010。
验证：P3/T003保原号指针，由P6/T006核AC-024真实原件，不重复执行。
通过：沿AC-024全部适用条件，本号不新增独立完成结论。
失败：必须读完整日志才懂（同 AC-024 的失败条件）。
证据：AC-024的唯一执行原件及本号映射。

- **AC-009** — 核对步骤结构

别名：AC-N6-009；关联FR-N6-004；来源R-001/R-002/R-003/R-004/R-007/R-010 / ADR-001/002/003/004/007/008/010。
验证：P3/T003取得`workflows/make-decision/steps.json` 现状（`schema_version`、step_id 1…15、末步 `closeout`、`completion_evidence`）与 `SKILL.md` 末步描述；非实施者读实际产物，执行“核对步骤结构”；人读判据，无命令（逐字段读现状，不跑全量套件）；用本条通过与失败条件同尺判定，ORACLE-N6-SKELETON，精确命令见该Phase〔已改正（审查修正 B4）：旧写法为通用套话输入（原文见本节开头统一记录），本次按本条主题改为专属输入，通过/失败条件未改；依据 B4〕
通过：make-decision 恰 15 步、末步 slug 是 `closeout`、末步完成凭据形状不变（`phase_task_facts`／`facts.jsonl`）、末步描述同时含「收口」与成本入口。
失败：步数、末步 slug、完成凭据形状或末步描述变化。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-010** — 核对三处字面钉

别名：AC-N6-010；关联FR-N6-004；来源R-001/R-002/R-003/R-004/R-007/R-010 / ADR-001/002/003/004/007/008/010。
验证：P3/T003取得`workflows/make-decision/SKILL.md` 三处字面（`skills/knowledge-graph/SKILL.md` 路径、两提问技能关键词组、无绝对宿主路径）与钉住它们的既有合同；非实施者读实际产物，执行“核对三处字面钉”；人读判据＋定向 grep 读现状，无新增命令；用本条通过与失败条件同尺判定，ORACLE-N6-SKELETON，精确命令见该Phase；跨Phase减法/字面/登记子面由P1–P4各自首验，P6只聚合原件〔已改正（审查修正 B4）：旧写法为通用套话输入（原文见本节开头统一记录），本次按本条主题改为专属输入，通过/失败条件未改；依据 B4〕
通过：make-decision 保住 `skills/knowledge-graph/SKILL.md`；两个提问技能关键词组命中且无绝对宿主路径。
失败：任一钉子失效。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-011** — 读减法声明

别名：AC-N6-011；关联FR-N6-008；来源R-001/R-002/R-003/R-004/R-007/R-010 / ADR-001/002/003/004/007/008/010。
验证：P3/T003取得ADR-008 的 D1–D7 删除/合并/降档声明、受影响方法件当前正文、`git diff --name-only` 的真实改动清单；非实施者读实际产物，执行“读减法声明”；人读判据，无命令（diff 只作定位，不作判据）；用本条通过与失败条件同尺判定，ORACLE-N6-SKELETON，精确命令见该Phase；跨Phase减法/字面/登记子面由P1–P4各自首验，P6只聚合原件〔已改正（审查修正 B4）：旧写法为通用套话输入（原文见本节开头统一记录），本次按本条主题改为专属输入，通过/失败条件未改；依据 B4〕
通过：具名给出删除／合并／降档对象、理由与承接点。
失败：只加规则未简化且无声明。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-012** — 核对来源登记

别名：AC-N6-012；关联FR-N6-008；来源R-001/R-002/R-003/R-004/R-007/R-010 / ADR-001/002/003/004/007/008/010。
验证：P3/T003取得`skills/catalog.yaml`、`THIRD_PARTY_NOTICES.md`、两个 `skill-bundle.json`（talk-with-zhipeng、grill-with-docs）、`workflows/make-decision/skill-deps.yaml` 四处现状 ＋ `git diff` 的实际改动；非实施者读实际产物，执行“核对来源登记”；人读判据＋四处逐处读回与 diff 对照；`answer-as-page-skill.test.mjs` 的 catalog case 只证结构，不替代四处一致性；用本条通过与失败条件同尺判定，ORACLE-N6-SKELETON，精确命令见该Phase；跨Phase减法/字面/登记子面由P1–P4各自首验，P6只聚合原件〔已改正（审查修正 B4）：旧写法为通用套话输入（原文见本节开头统一记录），本次按本条主题改为专属输入，通过/失败条件未改；依据 B4〕
通过：`skills/catalog.yaml`、notices、两个 `skill-bundle.json`、`skill-deps.yaml` 四处一致，且不动 catalog 的 `used_by_stages`／`dependency_closure`；本次新增来源清单与落点使用当前N6 owner，历史T/M记录只作只读来源。
失败：任一处漂移；动了 `used_by_stages`／依赖闭包。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-013** — 读调研标准化八问与分工

别名：AC-N6-013；关联FR-N6-009；来源R-008 / ADR-009。
验证：P1/T001在交付该增量时取得两研究方法、现make-decision第3步与本任务完整研究/零结果输入；独立读者对照同一原始问题，执行“读调研标准化八问与分工”；用本条通过与失败条件同尺判定，ORACLE-N6-RESEARCH，精确命令见该Phase。
通过：八个问题各有真实答复与落点；分工写明（知识图谱＝内部、深度调研＝外部）；方法正文那句已改准（不再写成「内部与外部一起交给深度调研」）；没有新增第三套研究流程。
失败：问题无答复；直接定方案；正文仍把内外一起交给深度调研；写成「知识图谱可选」。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-014** — 打开需求索引件

别名：AC-N6-014；关联FR-N6-001；来源R-001/R-002/R-003/R-004/R-007/R-010 / ADR-001/002/003/004/007/008/010。
验证：P3/T003独立读者打开本任务真实requirement-index.md，按已定义11条R与31派生单元逐一回原ref核完整句和类型；再消费删一条真实原话、仅留压缩摘要的副本作为负例。副本仅为受控输入，不覆写唯一来源。
通过：每条有用户原话的需求保完整逐字、不压缩，索引按工作包分结构；无用户原话的按AC-115保真实类型与来源，不硬凑。
失败：缺真实需求行、压缩已有原话、结构缺失，或把转述当逐字。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-015** — 读索引每行的类型列

别名：AC-N6-015；关联FR-N6-001；来源R-001/R-002/R-003/R-004/R-007/R-010 / ADR-001/002/003/004/007/008/010。
验证：P3/T003取得`requirement-index.md` §2 总表与 §3 逐条明细的类型列 ＋ 对应原话/转述原件；非实施者读实际产物，执行“读索引每行的类型列”；人读判据，无命令；用本条通过与失败条件同尺判定，ORACLE-N6-SKELETON，精确命令见该Phase〔已改正（审查修正 B4）：旧写法为通用套话输入（原文见本节开头统一记录），本次按本条主题改为专属输入，通过/失败条件未改；依据 B4〕
通过：每行有需求原话／选择类答复／文档转述／推断四类之一；推断显式写“这是推断”，文档转述不得标需求原话。
失败：缺类型；推断无声明；缺文档转述类别或把提炼伪装原话。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-016** — 核对可核单元

别名：AC-N6-016；关联FR-N6-001；来源R-001/R-002/R-003/R-004/R-007/R-010 / ADR-001/002/003/004/007/008/010。
验证：P3/T003取得`requirement-index.md` §3 的可核单元表（派生号／谁接／落在哪／怎么验）；非实施者读实际产物，执行“核对可核单元”；具名定向命令 `node node_modules/vitest/vitest.mjs run tests/contract/n6-decision-unit-target.test.mjs`（只跑该目标，禁全量）；用本条通过与失败条件同尺判定，ORACLE-N6-SKELETON，精确命令见该Phase〔已改正（审查修正 B4）：旧写法为通用套话输入（原文见本节开头统一记录），本次按本条主题改为专属输入，通过/失败条件未改；依据 B4〕
通过：单元用派生号（如 `R-002a`），每单元三件齐全（谁接／落在哪／怎么验）。
失败：无派生号，或任一单元缺三件之一。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-017** — 给定任一需求编号，在索引与覆盖表两端查

别名：AC-N6-017；关联FR-N6-001；来源R-001/R-002/R-003/R-004/R-007/R-010 / ADR-001/002/003/004/007/008/010。
验证：P3/T003取得`requirement-index.md` §3 与 `coverage-matrix-5d.md` §2 两件的同一编号行；非实施者读实际产物，执行“给定任一需求编号，在索引与覆盖表两端查”；人读判据，无命令（两端对照）；用本条通过与失败条件同尺判定，ORACLE-N6-SKELETON，精确命令见该Phase〔已改正（审查修正 B4）：旧写法为通用套话输入（原文见本节开头统一记录），本次按本条主题改为专属输入，通过/失败条件未改；依据 B4〕
通过：两端都能查到归属与落点，且互相一致。
失败：任一端查不到，或两端不一致。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-018** — 读大纲里每个工作包的四样

别名：AC-N6-018；关联FR-N6-001；来源R-001/R-002/R-003/R-004/R-007/R-010 / ADR-001/002/003/004/007/008/010。
验证：P3/T003取得`decision-log.md`「工作包与决定」的 ①–⑫ 四字段正文 ＋ `coverage-matrix-5d.md` §4 反查；非实施者读实际产物，执行“读大纲里每个工作包的四样”；人读判据，无命令；用本条通过与失败条件同尺判定，ORACLE-N6-SKELETON，精确命令见该Phase〔已改正（审查修正 B4）：旧写法为通用套话输入（原文见本节开头统一记录），本次按本条主题改为专属输入，通过/失败条件未改；依据 B4〕
通过：目标／边界／与其它模块的关系／待弄清的问题四样齐全；写「不适用」必须带理由与依据。
失败：缺项且无理由；写「不适用」却无理由依据；写成空壳，或落点格只写编号占位而工作包里读不到实际处置。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-019** — 同一份原始需求跑一次，读四查结论

别名：AC-N6-019；关联FR-N6-002；来源R-001/R-002/R-003/R-004/R-007/R-010 / ADR-001/002/003/004/007/008/010。
验证：P3/T003独立四查助手读同原需求与真实大纲，并读specs/archive/design-execution-efficiency-20261014/phases/P8-终末逐AC验收.md中T022目标句（含“且末 Phase 首次结论数为0”），按原phase-template拆/并两半判断；“且/并且”同义是已声明可否决的语义解释，不用节占比判拆分。
通过：覆盖／粒度／依赖／缺口四查结论可独立读出，粒度查用语义三条；负例用归档真实卡 `specs/archive/design-execution-efficiency-20261014/phases/P8-终末逐AC验收.md:195`（目标句含「且末 Phase 首次结论数为 0」）。
失败：只有清单口号；粒度判据里出现工时、行数或验收条数门槛；负例报不出来。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-020** — 读骨架确认与未答处理

别名：AC-N6-020；关联FR-N6-003；来源R-001/R-002/R-003/R-004/R-007/R-010 / ADR-001/002/003/004/007/008/010。
验证：P3/T003由主会话在真实骨架展示后取得用户答复原ref，并由独立读者核展示内容、答复与进入逐包的先后；另外给拒绝/未答受控输入检验方法停止分支，受控分支不补真人答复。
通过：产出里有用户对骨架的真实答复；未确认不进入逐模块；用户打回时只改受影响骨架；未答停在草稿。
失败：用旧答复冒新骨架；把模拟问答当真实确认；被拒后仍进入逐模块（原 AC-002 的失败条件）。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-021** — 检查逐模块五段小表与新增模块

别名：AC-N6-021；关联FR-N6-004；来源R-001/R-002/R-003/R-004/R-007/R-010 / ADR-001/002/003/004/007/008/010。
验证：P3/T003独立读者消费本任务逐包实际问答/候选/取舍与当前方法产物，逐工作包核五段表和本包批次；给新增工作包和回改旧包两种明确输入，观察新增重走五段与旧包局部重评的区别。ORACLE-N6-SKELETON。
通过：每个工作包有 5 行小表且每格「一句结论＋一个指针」，空格写「不适用＋理由」；简单／复杂二档写在表里；回头改只走修订／取代并标「需重评」；新增模块重走五段并照建表。
失败：出现跨模块大批次讨论；某模块缺行或空格无理由；同一格两件事（讨论与验收同一句话）；新增模块没有重走五段。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-022** — 检查提问产物与模糊答复

别名：AC-N6-022；关联FR-N6-005；来源R-005/R-006/R-011 / ADR-005/011。
验证：P2/T002在交付该增量时取得两提问方法与具名工作包完整问题/真实或明确标注受控答复；独立读者消费完整上下文，执行“检查提问产物与模糊答复”；用本条通过与失败条件同尺判定，ORACLE-N6-QUESTIONING，精确命令见该Phase。
通过：扩散菜单 7 类逐条四要素且写明「一个都不用也合法但要写清用了哪几个或为什么不做」；真模块给出至少两个关键取舍不同的候选或具名「为什么不发散」；模糊答复按 4＋4 类识别、保持具体未决并当场用那句追问，只有真实答复才关闭选择。本条只判提问产物整体这一面（七类四要素＋至少两个取舍不同的候选＋模糊答复识别/未决/追问），说话标准沿 AC-039、格式与总数沿 AC-040、词义限定与不吸收记录沿 AC-056。〔已改正（审查修正 C2b）：旧通过条件未写本条与邻条的判面边界；依据本次审查，通过/失败条件本身未改〕
失败：凑方案数；把模糊答复记成已答；引入评分或固定问题数；新内容替换了测试命中的关键词组。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认；该Task新增检查/判据的制造违规→报出→撤销原始输出，与实际恢复结果同源保留；只写负例设计不算已执行。

- **AC-023** — 走一遍技术分歧分支

别名：AC-N6-023；关联FR-N6-006；来源R-006/R-007 / ADR-006/008。
验证：P4/T004独立观察者取得两个实现同目标的合成办法（例如独立脚本以两种顺序归并同组无敏感值），由实际运行给事实/反例；另给产品偏好、需真实数据/权限、无分歧、影响他人输入核拒用。草图实际路径、指纹与结论由生成者在当次交回，缺真实技术分歧时不为测试强造分歧。
通过：只在满足三项客观判据时造草图（两种做法都能实现同一目标、差别只能靠真实运行观察、不需要真实数据／权限／他人）；草图放任务库任务目录下、用完不删；四类禁用与限定语在场，末句「结论回讨论、由用户决定」；交接给路径与指纹，材料留一行「做过一次草图、结论是什么」。
失败：无分歧也造草图；草图替用户做产品选择；越过三类禁用；把草图当可交付代码；为跑草图放宽任务级测试；把草图放进工作树。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认；该Task新增检查/判据的制造违规→报出→撤销原始输出，与实际恢复结果同源保留；只写负例设计不算已执行。

- **AC-024** — 只读「改造后的整体形态」与跨模块核对段

别名：AC-N6-024；关联FR-N6-007；来源R-001/R-002/R-003/R-004/R-007/R-010 / ADR-001/002/003/004/007/008/010。
验证：P3/T003取得`decision-log.md`「改造后的整体形态」节与跨模块核对段；非实施者读实际产物，执行“只读「改造后的整体形态」与跨模块核对段”；人读判据，无命令；用本条通过与失败条件同尺判定，ORACLE-N6-SKELETON，精确命令见该Phase〔已改正（审查修正 B4）：旧写法为通用套话输入（原文见本节开头统一记录），本次按本条主题改为专属输入，通过/失败条件未改；依据 B4〕
通过：不读整份日志能说出要改成什么样；跨模块核对逐条给结论（唯一写者／依赖顺序／边界重叠／口径统一）。
失败：该节需要读整份日志才懂；核对只写「已核对」而无逐条结论（原 AC-008 的失败条件）。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-025** — 对比声明清单与实际改动

别名：AC-N6-025；关联FR-N6-008；来源R-001/R-002/R-003/R-004/R-007/R-010 / ADR-001/002/003/004/007/008/010。
验证：P3/T003取得ADR-008 减法声明清单、`git diff --name-only` 与逐文件 diff、`tests/contract/delivery-closeout-charter-contract.test.mjs` 的现断言；非实施者读实际产物，执行“对比声明清单与实际改动”；人读判据＋`git diff` 定位；diff 只作对照、不作判据；用本条通过与失败条件同尺判定，ORACLE-N6-SKELETON，精确命令见该Phase；跨Phase减法/字面/登记子面由P1–P4各自首验，P6只聚合原件〔已改正（审查修正 B4）：旧写法为通用套话输入（原文见本节开头统一记录），本次按本条主题改为专属输入，通过/失败条件未改；依据 B4〕
通过：声明删除清单与实际改动一致；三份文件仍可独立搬运；不确定的重复仍在；上游两处他人合并（ref 见 decision-log AC-025）不计入本卡减法账；声明里不出现任何字节量，且每条都带一个「删后谁还能读到」的消费者。〔对照读数（**只作对照**）：上游他人合并的旧读数为质询技能 −1606 B、术语格式件 +730 B；仅作对照，不作判据。〕〔已改正（审查修正 D3）：旧写法把「质询技能 −1606 B、术语格式件 +730 B」的读数直接写进通过条件，读数因此成了判据；现改为「上游两处他人合并（ref 见 decision-log AC-025）不计入本卡减法账」，读数移入紧邻的「对照读数」并标「只作对照」〕
失败：只加不减；删掉最小内联卡致技能无法独立使用；把不确定重复当同义删掉；把别人的合并算进本卡账；出现字节量或用「改前／改后」两列表。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-026** — 核对审查安排

别名：AC-N6-026；关联FR-N6-004；来源R-001/R-002/R-003/R-004/R-007/R-010 / ADR-001/002/003/004/007/008/010。
验证：P3/T003取得两次独立审查的派发原件与回执原件（方向审查两次、细节审查一次；细节回执 `2026-10-19-046`）＋ `decision-log.md` 过程事实段；非实施者读实际产物，执行“核对审查安排”；人读判据，无命令；用本条通过与失败条件同尺判定，ORACLE-N6-SKELETON，精确命令见该Phase〔已改正（审查修正 B4）：旧写法为通用套话输入（原文见本节开头统一记录），本次按本条主题改为专属输入，通过/失败条件未改；依据 B4〕
通过：方向独立审查一次、细节独立审查一次，且细节审查在全部模块收敛完成后做；两次都取异源独立上下文。
失败：审查次数超出或细节审查早于模块收敛；用同一上下文自审。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-027** — 读调研标准化收敛结果

别名：AC-N6-027；关联FR-N6-009；来源R-008 / ADR-009。
验证：P1/T001在交付该增量时取得两研究方法、现make-decision第3步与本任务完整研究/零结果输入；独立读者对照同一原始问题，执行“读调研标准化收敛结果”；用本条通过与失败条件同尺判定，ORACLE-N6-RESEARCH，精确命令见该Phase。
通过：保留两研究技能与入口判据，内部/外部各自三保障在原正文；报告全文留原件，改变方向、范围、验收的结论及排除理由进入决定正文，其余只给指针。
失败：新增研究控制面、接线零consumer模块、覆盖上游引用约束，或决定关键结论不可读。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-028** — 对四个级别各走一遍大纲与收敛

别名：AC-N6-028；关联FR-N6-010；来源R-001/R-002/R-003/R-004/R-007/R-010 / ADR-001/002/003/004/007/008/010。
验证：P3/T003取得`research-m10-four-levels-2026-10-19.md`、ADR-010、四级各自的大纲与收敛动作描述；非实施者读实际产物，执行“对四个级别各走一遍大纲与收敛”；人读判据，无命令（三级今天不可实跑照实标）；用本条通过与失败条件同尺判定，ORACLE-N6-SKELETON，精确命令见该Phase〔已改正（审查修正 B4）：旧写法为通用套话输入（原文见本节开头统一记录），本次按本条主题改为专属输入，通过/失败条件未改；依据 B4〕
通过：四种任务分级各能指认大纲与收敛动作并沿既有四字段产物，不写固定问题数或轮数；未成为正式类型的三种分级明确今天不可实跑。
失败：某级缺动作、重写格式、固定题数/轮数、把四级当层级，或假称三种类型已实跑。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-029** — 核对成本读数

别名：AC-N6-029；关联FR-N6-008；来源R-007 / ADR-008。
验证：P6/T006由原主会话使用stage-reflection第3步现入口提供同任务/同命令/同条件/同预算的前后原数与真实起止窗口，独立验收者核wall_s、input/output/cacheRead、steps/turns、subagent/bash四组，缺usage/来源保原原因码；一次性与常驻开销分列。原工具与27列/阶段支持只按真实版本读回，不从材料体积推成本。
通过：用已交付的成本观测能力做同条件读数（同任务、同命令、同条件、同预算，读数列清楚），并区分一次性投入与常驻成本；读数入口现接受 `--stage=build-prd`，缺报原因码为 `build_prd_material_refs_not_supplied`／`not_reported:no_stage_fact`，账本 27 列。
失败：用字节或其它代理量替代；读数不可得却不记未完成／`unknown`。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-030** — 骨架确认前核两份原件

别名：AC-N6-030；关联FR-N6-001；来源R-001/R-002/R-003/R-004/R-007/R-010 / ADR-001/002/003/004/007/008/010。
验证：P3/T003取得`requirement-index.md`、`coverage-matrix-5d.md` 两件的落盘时间与内容 ＋ 骨架展示批次记录；非实施者读实际产物，执行“骨架确认前核两份原件”；人读判据，无命令（本任务回溯情形单列，不补证当时已备）；用本条通过与失败条件同尺判定，ORACLE-N6-SKELETON，精确命令见该Phase〔已改正（审查修正 B4）：旧写法为通用套话输入（原文见本节开头统一记录），本次按本条主题改为专属输入，通过/失败条件未改；依据 B4〕
通过：新旅程中两份真实需求索引与覆盖对账在骨架展示确认前产生，逐条有原话指向/落点/验收及工作包归属；本任务历史时点不可补证，单列回溯事实。
失败：把事后补件写成当时已备，或确认时缺原件/缺内容却记完成。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-031** — 读索引的单列一节

别名：AC-N6-031；关联FR-N6-001；来源R-001/R-002/R-003/R-004/R-007/R-010 / ADR-001/002/003/004/007/008/010。
验证：P3/T003取得`requirement-index.md` §5「本次任务自己的调研」节；非实施者读实际产物，执行“读索引的单列一节”；人读判据，无命令；用本条通过与失败条件同尺判定，ORACLE-N6-SKELETON，精确命令见该Phase〔已改正（审查修正 B4）：旧写法为通用套话输入（原文见本节开头统一记录），本次按本条主题改为专属输入，通过/失败条件未改；依据 B4〕
通过：索引里单列「本次任务自己的调研（不是工作包）」一节，且这些调研不计入交付工作包。
失败：该节缺失，或把本任务自己的调研混进交付工作包计数。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-032** — 看自动核查的两次结果

别名：AC-N6-032；关联FR-N6-001；来源R-001/R-002/R-003/R-004/R-007/R-010 / ADR-001/002/003/004/007/008/010。
验证：P3/T003在新旅程大纲确认后与全部工作包谈完后，实际以checker的--file显式分别读取当前需求索引与覆盖原件，保存两个时点的命令、warnings与exit；独立读者用缺谁接/落点/验收的单元表和完整R-002a表判断可见警告，不声称默认run-checks读了任务库。
通过：扩 `tools/cli/check-decision-log-chain.mjs` 核「单元三件齐不齐」并认得派生号（如 `R-002a`），在大纲确认后与所有工作包谈完后各跑一次并给出结果，只报事实、不阻断。
失败：缺任一时点的结果；把核查做成阻断门。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认；该Task新增检查/判据的制造违规→报出→撤销原始输出，与实际恢复结果同源保留；只写负例设计不算已执行。

- **AC-033** — 负例实演（四条）

别名：AC-N6-033；关联FR-N6-001；来源R-001/R-002/R-003/R-004/R-007/R-010 / ADR-001/002/003/004/007/008/010。
验证：P3/T003独立读者取得完整正文/需求索引/覆盖原件；在受控副本逐一制造：原话换压缩、索引缺失但正文仍自洽、落点只编号无处置、四样不适用无理由；按原标准逐个报缺口后恢复。自然语言反例由完整输入独立判，不给checker强加语义裁决。
通过：四条都能被报出：索引里出现压缩原义而无逐字原文；删掉索引件后正文与覆盖结论一字不改仍自洽；落点格只写编号占位而工作包里读不到实际处置；四样写「不适用」却无理由依据。
失败：任一条报不出来，或把报出当阻断。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-034** — 读四查四项的判据来源

别名：AC-N6-034；关联FR-N6-002；来源R-001/R-002/R-003/R-004/R-007/R-010 / ADR-001/002/003/004/007/008/010。
验证：P3/T003取得ADR-002 重收敛表所指的四项既有权威（覆盖／粒度／依赖／缺口各自原判据）与 `decision-log.md` 引用行；非实施者读实际产物，执行“读四查四项的判据来源”；人读判据，无命令（判据来源逐项回原件）；用本条通过与失败条件同尺判定，ORACLE-N6-SKELETON，精确命令见该Phase〔已改正（审查修正 B4）：旧写法为通用套话输入（原文见本节开头统一记录），本次按本条主题改为专属输入，通过/失败条件未改；依据 B4〕
通过：覆盖／粒度／依赖／缺口各直接指向既有权威、不新造判据；粒度同时报「应拆」与「应当并」，并说明该规则原本管实施阶段边界、本处管大纲工作包粒度（同族不同消费者）。
失败：新造判据；粒度只报一头；未说明同族不同消费者。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-035** — 读正文的四查结论

别名：AC-N6-035；关联FR-N6-002；来源R-001/R-002/R-003/R-004/R-007/R-010 / ADR-001/002/003/004/007/008/010。
验证：P3/T003取得`decision-log.md` 正文四行（结论／依据／缺口）＋ `coverage-matrix-5d.md` 明细；非实施者读实际产物，执行“读正文的四查结论”；人读判据，无命令；用本条通过与失败条件同尺判定，ORACLE-N6-SKELETON，精确命令见该Phase〔已改正（审查修正 B4）：旧写法为通用套话输入（原文见本节开头统一记录），本次按本条主题改为专属输入，通过/失败条件未改；依据 B4〕
通过：结论写进正文四行（结论／依据／缺口），明细在覆盖表；实施计划与最终验收两个环节能直接读正文。
失败：四行缺项；正文读不出；把明细再抄一遍进正文。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-036** — 读缺口三类

别名：AC-N6-036；关联FR-N6-002；来源R-001/R-002/R-003/R-004/R-007/R-010 / ADR-001/002/003/004/007/008/010。
验证：P3/T003取得`coverage-matrix-5d.md` §3.A／§3.B／§3.C 三类缺口表；非实施者读实际产物，执行“读缺口三类”；人读判据，无命令；用本条通过与失败条件同尺判定，ORACLE-N6-SKELETON，精确命令见该Phase〔已改正（审查修正 B4）：旧写法为通用套话输入（原文见本节开头统一记录），本次按本条主题改为专属输入，通过/失败条件未改；依据 B4〕
通过：三类都报（没人接的／有人接但没落点的／有落点但没验收的），每条写明「谁接、什么时候接」。
失败：只报其中一类，或未写谁接／何时接。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-037** — 核对四查的执行者

别名：AC-N6-037；关联FR-N6-002；来源R-001/R-002/R-003/R-004/R-007/R-010 / ADR-001/002/003/004/007/008/010。
验证：P3/T003取得四查的派发原件与执行者身份（独立助手／子代理回执）；非实施者读实际产物，执行“核对四查的执行者”；人读判据，无命令；用本条通过与失败条件同尺判定，ORACLE-N6-SKELETON，精确命令见该Phase〔已改正（审查修正 B4）：旧写法为通用套话输入（原文见本节开头统一记录），本次按本条主题改为专属输入，通过/失败条件未改；依据 B4〕
通过：四查由独立助手执行，不是执行者自检；材料里写清它是前置自检、不是质量裁决。
失败：执行者自检；把四查当质量裁决。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-038** — 读确认材料里的工作包顺序

别名：AC-N6-038；关联FR-N6-002；来源R-001/R-002/R-003/R-004/R-007/R-010 / ADR-001/002/003/004/007/008/010。
验证：P3/T003取得ADR-002 四查结论里的工作包顺序 ＋ 第5步确认材料；非实施者读实际产物，执行“读确认材料里的工作包顺序”；人读判据，无命令；用本条通过与失败条件同尺判定，ORACLE-N6-SKELETON，精确命令见该Phase〔已改正（审查修正 B4）：旧写法为通用套话输入（原文见本节开头统一记录），本次按本条主题改为专属输入，通过/失败条件未改；依据 B4〕
通过：顺序在四查这一步已定，确认环节只确认。
失败：顺序留到确认时才定，或确认时顺序仍未定。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-039** — 读用户可见文字的说话标准

别名：AC-N6-039；关联FR-N6-011；来源R-005/R-006/R-011 / ADR-005/011。
验证：P2/T002在交付该增量时取得两提问方法与具名工作包完整问题/真实或明确标注受控答复；独立读者消费完整上下文，执行“读用户可见文字的说话标准”；用本条通过与失败条件同尺判定，ORACLE-N6-QUESTIONING，精确命令见该Phase。
通过：内部编号／文件名／机器字段名可以出现，但每处都紧跟一句大白话解释；每轮末尾有一句「我在问你什么、你为什么要在意」。
失败：内部词无解释；末尾无复述句；四处文案（标题／说明／选项／推荐理由）漏改任一处。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-040** — 看一轮提问的格式与总数

别名：AC-N6-040；关联FR-N6-011；来源R-005/R-006/R-011 / ADR-005/011。
验证：P2/T002在交付该增量时取得两提问方法与具名工作包完整问题/真实或明确标注受控答复；独立读者消费完整上下文，执行“看一轮提问的格式与总数”；用本条通过与失败条件同尺判定，ORACLE-N6-QUESTIONING，精确命令见该Phase。
通过：本轮用途、第几题／共几题、每题一个决策轴、2–3 个互斥选项（**用户给定、非质量门**：来源 decision-log:87（U-004「同一轮每个问题不超过 3 个选项」）与 decision-log:262（「每题 2–3 个互斥选项并给推荐」）；`requirement-index.md` §3.5 把「单题选项不超过 3 个」记为**文档转述、非逐字**）、每题一个推荐项及理由、每个选项的直接后果与主要风险；收到回答后重新排序并重算总数；每轮末尾有「我替你定了这些」段。〔已改正（审查修正 D1）：旧写法只写「2–3 个互斥选项」，未标「用户给定、非质量门」也未给来源；依据本次裁定，数值保留、标注与来源补齐，判据边界未改〕
失败：缺任一格式项；未重算总数；把完整候选队列倾倒给用户；末尾无「我替你定了这些」。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-041** — 发现工作包太大或太碎时的动作

别名：AC-N6-041；关联FR-N6-002；来源R-001/R-002/R-003/R-004/R-007/R-010 / ADR-001/002/003/004/007/008/010。
验证：P3/T003取得粒度结论（应拆／应并两半）与 `coverage-matrix-5d.md` §3.D 的落点泛称清单；非实施者读实际产物，执行“发现工作包太大或太碎时的动作”；人读判据，无命令；用本条通过与失败条件同尺判定，ORACLE-N6-SKELETON，精确命令见该Phase〔已改正（审查修正 B4）：旧写法为通用套话输入（原文见本节开头统一记录），本次按本条主题改为专属输入，通过/失败条件未改；依据 B4〕
通过：当场停下，由执行者改、改完给用户看，不带病往下走。
失败：带病往下走；或发现后不交给用户看。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-042** — 读第 5 步的确认材料

别名：AC-N6-042；关联FR-N6-003；来源R-001/R-002/R-003/R-004/R-007/R-010 / ADR-001/002/003/004/007/008/010。
验证：P3/T003取得`workflows/make-decision/SKILL.md` 第5步正文、`quality/evidence/human-confirmations/2026-10-19-001-make-decision-accepted.json` 的真实确认原件、`2026-10-19-001-build-plan-spec-clarify.md`；非实施者读实际产物，执行“读第 5 步的确认材料”；人读判据，无命令；用本条通过与失败条件同尺判定，ORACLE-N6-SKELETON，精确命令见该Phase〔已改正（审查修正 B4）：旧写法为通用套话输入（原文见本节开头统一记录），本次按本条主题改为专属输入，通过/失败条件未改；依据 B4〕
通过：第5步先消费既有自查，再一次展示需求清单及真实类型、工作包四样、四查四行与两份已备原件，取得用户真实答复；原话条件沿AC-115。
失败：缺展示组件、零散给、用旧答复或推荐代答，或确认前没有自查。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-043** — 读第 8 步的分诊与正文

别名：AC-N6-043；关联FR-N6-003；来源R-001/R-002/R-003/R-004/R-007/R-010 / ADR-001/002/003/004/007/008/010。
验证：P3/T003取得`workflows/make-decision/SKILL.md` 第8步正文与 `steps.json` 第8步条目；非实施者读实际产物，执行“读第 8 步的分诊与正文”；人读判据，无命令；用本条通过与失败条件同尺判定，ORACLE-N6-SKELETON，精确命令见该Phase〔已改正（审查修正 B4）：旧写法为通用套话输入（原文见本节开头统一记录），本次按本条主题改为专属输入，通过/失败条件未改；依据 B4〕
通过：分诊给出「哪些模块先补调研、哪些直接收敛」；只在步骤表里的入口规模事实义务已补回正文；分诊不改工作包顺序。
失败：分诊缺项；入口规模事实仍在正文缺席；分诊被写成重排工作包次序。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-044** — 核对审查位置与分工

别名：AC-N6-044；关联FR-N6-003；来源R-001/R-002/R-003/R-004/R-007/R-010 / ADR-001/002/003/004/007/008/010。
验证：P3/T003取得`SKILL.md` 第5／6／7步正文、`2026-10-19-001-build-plan-spec-clarify.md`、方向与细节审查回执；非实施者读实际产物，执行“核对审查位置与分工”；人读判据，无命令；用本条通过与失败条件同尺判定，ORACLE-N6-SKELETON，精确命令见该Phase〔已改正（审查修正 B4）：旧写法为通用套话输入（原文见本节开头统一记录），本次按本条主题改为专属输入，通过/失败条件未改；依据 B4〕
通过：依本次真实澄清：第5步先调用既有攻击过早锁定自查再展示确认，第6步回读该自查结果，第7步独立方向审查在真实骨架确认之后；步骤仍15。
失败：把第6步执行后才回补自查写成确认前已做，方向审查早于确认，或自查与独立审查混同。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-045** — 对比两次确认的对象

别名：AC-N6-045；关联FR-N6-003；来源R-001/R-002/R-003/R-004/R-007/R-010 / ADR-001/002/003/004/007/008/010。
验证：P3/T003取得第5步与第13步的确认材料与真实答复原件；非实施者读实际产物，执行“对比两次确认的对象”；人读判据，无命令；用本条通过与失败条件同尺判定，ORACLE-N6-SKELETON，精确命令见该Phase〔已改正（审查修正 B4）：旧写法为通用套话输入（原文见本节开头统一记录），本次按本条主题改为专属输入，通过/失败条件未改；依据 B4〕
通过：第 5 步确认「骨架／大纲」，第 13 步确认「方向／范围／验收／风险」，两次不重复问同样的问题。
失败：两次对象混同，或把同一问题问两遍。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-046** — 走一遍打回与未答

别名：AC-N6-046；关联FR-N6-003；来源R-001/R-002/R-003/R-004/R-007/R-010 / ADR-001/002/003/004/007/008/010。
验证：P3/T003取得受控打回／未答输入、须保留的旧答复原件；非实施者读实际产物，执行“走一遍打回与未答”；人读判据，无命令；用本条通过与失败条件同尺判定，ORACLE-N6-SKELETON，精确命令见该Phase〔已改正（审查修正 B4）：旧写法为通用套话输入（原文见本节开头统一记录），本次按本条主题改为专属输入，通过/失败条件未改；依据 B4〕
通过：打回只改受影响部分、旧答复作废但保留原文；未答停在草稿、不往下走。
失败：打回后重做整份骨架；未答仍往下推进；旧答复被删。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-047** — 核每次确认的凭证

别名：AC-N6-047；关联FR-N6-003；来源R-001/R-002/R-003/R-004/R-007/R-010 / ADR-001/002/003/004/007/008/010。
验证：P3/T003及P6/T006由独立读者取得第5步/第13步实际展示与真人答复、现confirm生成原件及其真实字段，核能否区分用途。已实测机制不按步区分，仍不新造schema/凭证；无区分能力的子条件保持incomplete并交原owner。
通过：真实确认沿现机制保原件及展示对象；现机制不支持按步骤区分用途时如实报告该条件未达，不硬造凭证/字段；两次确认的实际对象仍可从原问答读回。
失败：无真实确认原件、用途无法区分却宣全通过，或为补凭证新建机制；本条无法区分的子条件保incomplete。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-048** — 读中途新增模块的处置

别名：AC-N6-048；关联FR-N6-003；来源R-001/R-002/R-003/R-004/R-007/R-010 / ADR-001/002/003/004/007/008/010。
验证：P3/T003取得`accepted_risk` 登记、BT-018 第4条用户逐字、细节审查回执；非实施者读实际产物，执行“读中途新增模块的处置”；人读判据，无命令；用本条通过与失败条件同尺判定，ORACLE-N6-SKELETON，精确命令见该Phase〔已改正（审查修正 B4）：旧写法为通用套话输入（原文见本节开头统一记录），本次按本条主题改为专属输入，通过/失败条件未改；依据 B4〕
通过：新增模块不重跑方向审查，由最后那次细节审查覆盖，且登记为 `accepted_risk`（失败事实＋用户逐字答复在场）。
失败：把该处置写成「已验证无问题」；或重跑方向审查。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-049** — 核数字硬指标的处置

别名：AC-N6-049；关联FR-N6-008；来源R-006/R-007 / ADR-006/008。
验证：P4/T004在交付该增量时取得总则草图分支、已确认同目标两种纯合成办法及四类不适用输入；独立观察者核行为与边界，执行“核数字硬指标的处置”；用本条通过与失败条件同尺判定，ORACLE-N6-SKETCH，精确命令见该Phase。
通过：取消本卡成本类数字门（文件体积/常驻字节预算等）；经具体TCR与独立审查删除charter测试的原预算断言并保其它内容检查；用户功能/展示上限按其对象保持。
失败：保成本数字门、改常量绕TCR、放松其它断言、为凑数删内容，或把功能展示上限误删。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-050** — 读扩散段的取舍

别名：AC-N6-050；关联FR-N6-004；来源R-001/R-002/R-003/R-004/R-007/R-010 / ADR-001/002/003/004/007/008/010。
验证：P3/T003取得ADR-005 扩散段、外置候选件、真实决策轴取值；非实施者读实际产物，执行“读扩散段的取舍”；人读判据，无命令；用本条通过与失败条件同尺判定，ORACLE-N6-SKELETON，精确命令见该Phase〔已改正（审查修正 B4）：旧写法为通用套话输入（原文见本节开头统一记录），本次按本条主题改为专属输入，通过/失败条件未改；依据 B4〕
通过：外置件里至少两个在关键取舍上不同的候选（真实决策轴取值不同）＋取舍理由。
失败：只有措辞不同的候选；无取舍理由；候选数不足。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-051** — 核不攒批硬边界

别名：AC-N6-051；关联FR-N6-004；来源R-001/R-002/R-003/R-004/R-007/R-010 / ADR-001/002/003/004/007/008/010。
验证：P3/T003取得`decision-log.md` 各工作包批次表（批次号与模块名）；非实施者读实际产物，执行“核不攒批硬边界”；人读判据，无命令；用本条通过与失败条件同尺判定，ORACLE-N6-SKELETON，精确命令见该Phase〔已改正（审查修正 B4）：旧写法为通用套话输入（原文见本节开头统一记录），本次按本条主题改为专属输入，通过/失败条件未改；依据 B4〕
通过：同一批不跨模块；同一模块内互相独立的问题可以合问；表里每格带本模块批次号且同一批不出现两个模块名。
失败：同一批出现两个模块；格内无批次号；把「可合问」写成跨模块合批。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-052** — 读分诊判据的来源

别名：AC-N6-052；关联FR-N6-004；来源R-001/R-002/R-003/R-004/R-007/R-010 / ADR-001/002/003/004/007/008/010。
验证：P3/T003取得第8步的风险／优先级、入口规模事实、范围四维正文；非实施者读实际产物，执行“读分诊判据的来源”；人读判据，无命令；用本条通过与失败条件同尺判定，ORACLE-N6-SKELETON，精确命令见该Phase〔已改正（审查修正 B4）：旧写法为通用套话输入（原文见本节开头统一记录），本次按本条主题改为专属输入，通过/失败条件未改；依据 B4〕
通过：分诊用第 8 步已有的风险／优先级＋入口规模事实＋范围四维，不新造判据。
失败：新造分诊判据。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-053** — 走一遍回头改前面模块

别名：AC-N6-053；关联FR-N6-004；来源R-001/R-002/R-003/R-004/R-007/R-010 / ADR-001/002/003/004/007/008/010。
验证：P3/T003取得修订／取代登记与「需重评」标记、受影响验收格；非实施者读实际产物，执行“走一遍回头改前面模块”；人读判据，无命令；用本条通过与失败条件同尺判定，ORACLE-N6-SKELETON，精确命令见该Phase〔已改正（审查修正 B4）：旧写法为通用套话输入（原文见本节开头统一记录），本次按本条主题改为专属输入，通过/失败条件未改；依据 B4〕
通过：只走修订／取代并标「需重评」，不重走全部五段；改动影响验收时改写该格。
失败：重走全部五段；未标「需重评」；影响验收却不改格。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-054** — 读扩散菜单 7 类

别名：AC-N6-054；关联FR-N6-005；来源R-005/R-006/R-011 / ADR-005/011。
验证：P2/T002在交付该增量时取得两提问方法与具名工作包完整问题/真实或明确标注受控答复；独立读者消费完整上下文，执行“读扩散菜单 7 类”；用本条通过与失败条件同尺判定，ORACLE-N6-QUESTIONING，精确命令见该Phase。
通过：每类都有「中文名＋英文原名、一句说明、什么时候用、什么时候不该用」；并写明「一个都不用也合法，但要写清用了哪几个或为什么不做」。
失败：缺类或缺任一项；只给名称没有适用/不适用条件；把「不用」写成不允许。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-055** — 读模糊答复的全套落点

别名：AC-N6-055；关联FR-N6-005；来源R-005/R-006/R-011 / ADR-005/011。
验证：P2/T002在交付该增量时取得两提问方法与具名工作包完整问题/真实或明确标注受控答复；独立读者消费完整上下文，执行“读模糊答复的全套落点”；用本条通过与失败条件同尺判定，ORACLE-N6-QUESTIONING，精确命令见该Phase。
通过：4 类识别信号＋4 类「不算确认」＋那句追问（中文译、保留原意）＋地板规则（不写死轮数、与零问题合法不冲突）都在质询技能「把模糊语言说清」一节，且不进四项退出检查。本条只判落点这一面（4＋4＋追问＋地板规则落在该节、且不进四项退出检查），方法效果沿 AC-003、数量约束沿 AC-057。〔已改正（审查修正 C2b）：旧通过条件未写本条与邻条的判面边界；依据本次审查，通过/失败条件本身未改〕
失败：任一组件缺失；写进四项退出检查；地板规则写死轮数；追问被照搬英文。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-056** — 读词义限定与不吸收记录

别名：AC-N6-056；关联FR-N6-011；来源R-005/R-006/R-011 / ADR-005/011。
验证：P2/T002实际消费来源被拒条款“不许给用户列选项”（原条款词义沿源正文），在catalog该来源既有review_outcome或源名明确的reuse理由格选择唯一正文，逐字记“不采用”，另一处只给指针，理由为本用户已要求2–3互斥选项及推荐；保持候选队列只指问题队列，独立读者核未采用项没有混进实际方法。method-adoption目标RED/GREEN只证真实登记，独立完整问题输入另证方法效果。
通过：提问技能候选队列仅指本节问题队列，方案候选写既有外置件且不放宽问题队列约束；来源“不许给用户列选项”条款逐字记“不采用”，在既有review_outcome或源名明确的reuse理由格保唯一拒绝理由，其它位置只引用，不新增字段或误把整来源拒绝。
失败：没有词义限定；把禁令放宽；把不吸收写成吸收了。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-057** — 核数量约束

别名：AC-N6-057；关联FR-N6-011；来源R-005/R-006/R-011 / ADR-005/011。
验证：P2/T002在交付该增量时取得两提问方法与具名工作包完整问题/真实或明确标注受控答复；独立读者消费完整上下文，执行“核数量约束”；用本条通过与失败条件同尺判定，ORACLE-N6-QUESTIONING，精确命令见该Phase。
通过：不固定问题数、方案变体预算或轮数，不用数量作质量分；保持至少两个关键取舍不同的候选及简单模块有源例外；每题2–3选项、短标签展示上限仍适用。
失败：给问题/变体/轮数固定配额或凑数，或以“不限数量”为由删除用户指定的选项/展示边界。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-058** — 核来源侧缺口与 pin 强度

别名：AC-N6-058；关联FR-N6-005；来源R-005/R-006/R-011 / ADR-005/011。
验证：P2/T002在交付该增量时取得两提问方法与具名工作包完整问题/真实或明确标注受控答复；独立读者消费完整上下文，执行“核来源侧缺口与 pin 强度”；用本条通过与失败条件同尺判定，ORACLE-N6-QUESTIONING，精确命令见该Phase。
通过：材料写明三份配套文件未保存、未登记，且不声称吸收了「完整评分标准」；pin 记为「commit 级＋逐字节哈希，不是签名／发布级强绑定」。
失败：声称吸收完整评分标准；把 pin 写成签名/发布级强绑定；缺口不写。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-059** — 核草图触发判据

别名：AC-N6-059；关联FR-N6-006；来源R-006/R-007 / ADR-006/008。
验证：P4/T004在交付该增量时取得总则草图分支、已确认同目标两种纯合成办法及四类不适用输入；独立观察者核行为与边界，执行“核草图触发判据”；用本条通过与失败条件同尺判定，ORACLE-N6-SKETCH，精确命令见该Phase。
通过：三项判据同时成立才做：两种做法都能实现同一目标、差别只能靠真实运行观察、不需要真实数据／权限／他人；否则不做。
失败：缺任一项仍做；把「差别靠推理」当可观察分歧。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-060** — 核草图留存位置与命名

别名：AC-N6-060；关联FR-N6-006；来源R-006/R-007 / ADR-006/008。
验证：P4/T004在交付该增量时取得总则草图分支、已确认同目标两种纯合成办法及四类不适用输入；独立观察者核行为与边界，执行“核草图留存位置与命名”；用本条通过与失败条件同尺判定，ORACLE-N6-SKETCH，精确命令见该Phase。
通过：草图在任务库的任务目录下、按「日期＋主题」命名一个目录；不进工作树；用完不删。
失败：放进工作树；新增仓库内目录；用完即删。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-061** — 读禁用与限定语

别名：AC-N6-061；关联FR-N6-006；来源R-006/R-007 / ADR-006/008。
验证：P4/T004在交付该增量时取得总则草图分支、已确认同目标两种纯合成办法及四类不适用输入；独立观察者核行为与边界，执行“读禁用与限定语”；用本条通过与失败条件同尺判定，ORACLE-N6-SKETCH，精确命令见该Phase。
通过：四类禁用（无分歧／产品偏好／需真实数据权限凭证／会影响他人或不可逆）＋限定语（三句宽松只限隔离、一次性、非生产）＋末句「结论回讨论、由用户决定」都在。
失败：缺任一禁用；限定语被写成一般许可；无末句。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-062** — 读来源写法

别名：AC-N6-062；关联FR-N6-006；来源R-006/R-007 / ADR-006/008。
验证：P4/T004在交付该增量时取得总则草图分支、已确认同目标两种纯合成办法及四类不适用输入；独立观察者核行为与边界，执行“读来源写法”；用本条通过与失败条件同尺判定，ORACLE-N6-SKETCH，精确命令见该Phase。
通过：只写「提交未证实＋归档指纹＋镜像带自行改动」；不写「已绑定上游版本」；4 项未保存内容不声称吸收。
失败：写成已绑定上游版本；声称吸收未保存内容。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-063** — 核草图目录的数据边界

别名：AC-N6-063；关联FR-N6-006；来源R-006/R-007 / ADR-006/008。
验证：P4/T004在交付该增量时取得总则草图分支、已确认同目标两种纯合成办法及四类不适用输入；独立观察者核行为与边界，执行“核草图目录的数据边界”；用本条通过与失败条件同尺判定，ORACLE-N6-SKETCH，精确命令见该Phase。
通过：草图目录里没有真实凭据、密钥、敏感数据、真实用户数据；若必须真实数据才看得出差别，则该分歧归「需真实数据」禁用类、不做草图。
失败：目录内含真实数据或凭据；用真实数据硬做草图。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-064** — 打开总览页看形态

别名：AC-N6-064；关联FR-N6-012；来源R-004/R-012 / ADR-012。
验证：P5/T005只在用户返回真实后续设计并确认后，由同一页面owner填真实任务内容生成页，独立验收者经isolated-browser-qa打开实际离线HTML并观察整体形态；本build-plan不再造样张，缺设计时仅核规范并标真实效果未验。ORACLE-N6-COCKPIT。
通过：视觉优先：思维导图／层级树／卡片矩阵一类，用内联 SVG 或纯 CSS 手绘；单文件 HTML、内联样式、零外部依赖、断网可开；不引入任何图表库。
失败：仍是纯文字索引；内嵌正文；引入图表库或外部资源；需要联网。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-065** — 核页面与指针不依赖行号

别名：AC-N6-065；关联FR-N6-012；来源R-004/R-012 / ADR-012。
验证：P5/T005在取得实际页后，独立验收者选一个真实稳定编号与一个不存在目标，观察正确跳转、坏目标“指针失效”且其它页面仍可读；生成者提供逐指针检查原件。不得以源码无:行号字符串替代真实目标行为。
通过：页面内一个行号都不出现；指针只用稳定编号；生成时逐个校验目标存在，对不上的标「指针失效」且页面仍可读。
失败：出现行号；指针失效导致整页崩掉；未校验。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-066** — 读页面顶部状态行

别名：AC-N6-066；关联FR-N6-012；来源R-004/R-012 / ADR-012。
验证：P5/T005在交付该增量时取得answer-as-page原始来源、实际技能/登记、Figma提示词和未来真实页面；独立验收者区分规范、可用模板与用户效果，执行“读页面顶部状态行”；用本条通过与失败条件同尺判定，ORACLE-N6-COCKPIT，精确命令见该Phase。
通过：写明「本页是只读派生视图，不是权威；进度权威是当前材料与任务事实」，并显示来源指纹（决策日志 sha256／字节／行数）＋生成时间＋当前步骤。
失败：缺权威声明；无来源指纹或时间；把页面写成权威。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-067** — 看一致性比对

别名：AC-N6-067；关联FR-N6-012；来源R-004/R-012 / ADR-012。
验证：P5/T005页面owner对真实页与原材料运行只报告比对，输入包括当前来源指纹和编号/锚点集合，再给一个坏指针受控副本；独立验收者核警告及exit0，另用一条措辞漂移案例说明机械比对未覆盖语义。
通过：生成后跑一条只报告、`exit 0` 的比对（来源指纹＋决定编号集合、工作包数、验收条数、锚点是否存在）；如实写明它管不住「一行结论的措辞漂移」。
失败：做成 gate 或 CI 失败路径；漏写「管不住措辞漂移」。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-068** — 核页面落点与生成者

别名：AC-N6-068；关联FR-N6-012；来源R-004/R-012 / ADR-012。
验证：P5/T005在交付该增量时取得answer-as-page原始来源、实际技能/登记、Figma提示词和未来真实页面；独立验收者区分规范、可用模板与用户效果，执行“核页面落点与生成者”；用本条通过与失败条件同尺判定，ORACLE-N6-COCKPIT，精确命令见该Phase。
通过：页面在任务库任务目录的证据区；不进仓库、不随任务分支提交、不占写集行；由同一个承担者生成。
失败：页面进仓库或工作树；每次换人写；新增写集行。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-069** — 核更新触发

别名：AC-N6-069；关联FR-N6-012；来源R-004/R-012 / ADR-012。
验证：P5/T005在交付该增量时取得answer-as-page原始来源、实际技能/登记、Figma提示词和未来真实页面；独立验收者区分规范、可用模板与用户效果，执行“核更新触发”；用本条通过与失败条件同尺判定，ORACLE-N6-COCKPIT，精确命令见该Phase。
通过：只在决策日志「较大更新」时更新：骨架确认后／每细化完一个工作包各一次／方向范围验收实质变化／收口前；只改措辞、只补指针、只改行号、只补登记细节不更新；每次更新刷新顶部状态行。
失败：每一步都更新；较大更新不更新；用「关键节点」旧口径。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-070** — 核不引入外部工具

别名：AC-N6-070；关联FR-N6-012；来源R-004/R-012 / ADR-012。
验证：P5/T005在交付该增量时取得answer-as-page原始来源、实际技能/登记、Figma提示词和未来真实页面；独立验收者区分规范、可用模板与用户效果，执行“核不引入外部工具”；用本条通过与失败条件同尺判定，ORACLE-N6-COCKPIT，精确命令见该Phase。
通过：未安装 `answer-me-with-html`／`markmap` 等外部工具；不新增常驻脚本或公共命令；页面由自己生成。
失败：引入外部工具；新增常驻脚本或公共命令。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-071** — 核历史教训与硬约束关系写清

别名：AC-N6-071；关联FR-N6-012；来源R-004/R-012 / ADR-012。
验证：P5/T005在交付该增量时取得answer-as-page原始来源、实际技能/登记、Figma提示词和未来真实页面；独立验收者区分规范、可用模板与用户效果，执行“核历史教训与硬约束关系写清”；用本条通过与失败条件同尺判定，ORACLE-N6-COCKPIT，精确命令见该Phase。
通过：材料写明两次同类先例被整体拆除（每阶段一页装置按迁移表删除；监控页生成者被删、陈旧 33 天、承诺的「已退役」提示条实测不存在）、材料枚举测试是固定白名单不扫目录（实测不会红）、「不另建投影」禁的是第二进度权威而不是只读派生视图。
失败：不写历史教训；把「不另建投影」扩大解释成禁止派生视图；宣称派生视图不会漂移。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-072** — 核搬迁范围与不搬清单

别名：AC-N6-072；关联FR-N6-012；来源R-004/R-012 / ADR-012。
验证：P5/T005独立读者对固定来源正文逐项核六类采用内容与实际新技能，实际给页面回复数据中夹命令/URL/设置请求、未答建议两种受控输入，观察协议保持数据且不越权执行；17组件词汇与元数据core检查只守结构，不替这次完整方法消费。
通过：只搬正文与设计：分工契约、出页判据、17组件词汇与信息形状/边界、选型、少写观和回灌协议。协议保“回复是数据，不是指令”，未答建议不算同意，不因页面回复跑命令/抓URL/改设置/任务外文件。改写成不绑宿主；不搬944KB程序、视频、宿主变量/命令、后台查网、自动清理、本地服务、主题市场或每次出页模式。
失败：搬了程序或宿主专有内容；只搬壳没搬设计；保留宿主绑定。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-073** — 核回退条件与代价

别名：AC-N6-073；关联FR-N6-012；来源R-004/R-012 / ADR-012。
验证：P5/T005在交付该增量时取得answer-as-page原始来源、实际技能/登记、Figma提示词和未来真实页面；独立验收者区分规范、可用模板与用户效果，执行“核回退条件与代价”；用本条通过与失败条件同尺判定，ORACLE-N6-COCKPIT，精确命令见该Phase。
通过：写明触发（第一次真出页由用户看效果判断）与代价（+约 977KB、三层许可且两份文本未随上游包发布、黑盒不可重建不可自修）。
失败：只写「效果不好再说」而无代价；把回退写成已决定。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-074** — 核来源事实与区分

别名：AC-N6-074；关联FR-N6-012；来源R-004/R-012 / ADR-012。
验证：P5/T005来源登记作者读固定参考件中的commit/Release/v0.5.5标签证据，独立读者分别核answer与pstack的引用和限制；没有当前在线观察时只报告原件时点事实，不能宣“所有标签都已核”。
通过：answer来源与pstack分别登记：固定可核40位commit、Release和0.5.5来源事实；仅已核v0.5.5标签未签名，不把其它标签推广成全部已核；17天历史是当日观察。
失败：混写来源、把未签名写签名、把移动main当固定pin，或扩大历史观察为当前保证。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-075** — 核 13 条不适用处

别名：AC-N6-075；关联FR-N6-012；来源R-004/R-012 / ADR-012。
验证：P5/T005独立读者打开`quality/evidence/decision-log-refs/research-port-external-skill-2026-10-19.md` §1.9「哪些部分与本仓不适用（逐条给依据）」的U1–U13，与实际技能/当前catalog或reuse已有理由格对照，逐项回读采用/不适用及未执行限制。不是只数13个编号，不为登记新建持久清单对象。
通过：原研究件§1.9的U1–U13逐条在本卡既有采用/不适用位置记录理由与读回：默认仓外堆积、always-on写宿主规则、每天后台查GitHub、am clean定期删历史、Node≥20与本仓≥24口径、CLAUDE_SKILL_DIR变量、宿主命令/工具、update_check下载追新、argument-hint未消费、视频依赖、交互回灌与只读边界、src读取真实代码嵌页双写、打包许可文本不完整；不把这些未采用能力写成已适配。
失败：漏项；把不适用处写成已适配。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-076** — 核登记与许可

别名：AC-N6-076；关联FR-N6-012；来源R-004/R-012 / ADR-012。
验证：P5/T005独立验收者用真实catalog条目和THIRD_PARTY_NOTICES逐项读upstream字段、改编状态、单层MIT及原版权行，与固定源LICENSE对照；同一合同测试的metadata结果只证结构，许可/采用边界由原件读回。
通过：`status: adapted`＋非空 `upstream[]`（含 github_url／commit／commit_url／license／reviewed_at／review_outcome／path／skill_url／adopted[]）；无 `content_sha256`；许可单层 MIT；notices 按现行格式加一条并保留版权行逐字；不新增 Apache-2.0／OFL-1.1 节。
失败：缺字段；写了 `content_sha256`；加了两份未搬许可的节。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-077** — 核技能与 bundle 的现行约束

别名：AC-N6-077；关联FR-N6-012；来源R-004/R-012 / ADR-012。
验证：P5/T005按TCR-N6-PAGE-ORACLE-SPLIT在同一测试文件分别执行具名core过滤与完整suite。前者核实际skill/bundle基础/17组件/来源/职责，后者包含template文件存在、bundle登记、离线和宿主边界全部原强度；无设计时保存core结果与full仍失败，不把过滤结果当完整技能通过。方法及17规则语义由独立完整输入另验，设计/浏览器条件沿AC-106/107/114/121。
通过：正文指向写作规范（不复制、不新建规范层）；frontmatter 只 name＋description（无 `version`）；有「依赖」小节并登记静态依赖；bundle `files` 含 `SKILL.md`；配一个合同测试（不搬上游约 90 个）。
失败：复制规范；出现 `version`；无依赖小节；bundle 缺 `SKILL.md`；搬上游测试群。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认；该Task新增检查/判据的制造违规→报出→撤销原始输出，与实际恢复结果同源保留；只写负例设计不算已执行。

- **AC-078** — 核消费者与删除条件

别名：AC-N6-078；关联FR-N6-012；来源R-004/R-012 / ADR-012。
验证：P5/T005在交付该增量时取得answer-as-page原始来源、实际技能/登记、Figma提示词和未来真实页面；独立验收者区分规范、可用模板与用户效果，执行“核消费者与删除条件”；用本条通过与失败条件同尺判定，ORACLE-N6-COCKPIT，精确命令见该Phase。
通过：写明 consumer＝用户直接调用＋本任务总览页、`used_by_stages: []`、owner 与删除条件，并登记进来源清单与目录职责；页面落盘由调用者指定（本需求＝任务库）；不用 always-on。
失败：缺 consumer／删除条件；默认落仓外；启用 always-on。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-079** — 读减法账写法

别名：AC-N6-079；关联FR-N6-008；来源R-001/R-002/R-003/R-004/R-007/R-010 / ADR-001/002/003/004/007/008/010。
验证：P1/T001首验D7，P2/T002首验D1–D4，P3/T003首验D5/D6方法删除/指针与本地独有义务，P4/T004核本卡草图/预算处置相关减法。各原writer提供实际diff及删后消费者读回，P3的Done明确承接AC-079/AC-080的D5/D6子面；P6/T006只聚合全部D1–D7唯一原件，缺一不报整条完成。
通过：逐条列「删了什么／合并了什么／降档了什么」＋每条一个「删后谁还能读到」的消费者；不出现任何字节量；不用「改前／改后」两列表。
失败：出现字节量；缺消费者；用两列表。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-080** — 逐处核 D1–D7

别名：AC-N6-080；关联FR-N6-008；来源R-001/R-002/R-003/R-004/R-007/R-010 / ADR-001/002/003/004/007/008/010。
验证：P1/T001首验D7，P2/T002首验D1–D4，P3/T003首验D5/D6方法删除/指针与本地独有义务，P4/T004核本卡草图/预算处置相关减法。各原writer提供实际diff及删后消费者读回，P3的Done明确承接AC-079/AC-080的D5/D6子面；P6/T006只聚合全部D1–D7唯一原件，缺一不报整条完成。
通过：D1／D2／D3 删质询侧（D2 留题号公式、D3 留一句通则）；D4 任删一侧；D5／D6 压方法侧为指针（D5 留两行、D6 留末句）；D7 只留「本阶段固定来源」＋写作规范指针；旧行号 `144–151` 记为 `140–147`。
失败：删错一侧；把必须保留的部分删掉；沿用旧行号。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-081** — 核锚点保全

别名：AC-N6-081；关联FR-N6-008；来源R-001/R-002/R-003/R-004/R-007/R-010 / ADR-001/002/003/004/007/008/010。
验证：P3/T003取得`docs/delivery-closeout-charter.md` 直接链接的锚点、`skills/grill-with-docs/GLOSSARY-FORMAT.md#rules`、删除区间；非实施者读实际产物，执行“核锚点保全”；人读判据＋定向 grep 读现状，无新增命令；用本条通过与失败条件同尺判定，ORACLE-N6-SKELETON，精确命令见该Phase；跨Phase减法/字面/登记子面由P1–P4各自首验，P6只聚合原件〔已改正（审查修正 B4）：旧写法为通用套话输入（原文见本节开头统一记录），本次按本条主题改为专属输入，通过/失败条件未改；依据 B4〕
通过：材料显式写明保住被总纲直接链接的那个锚点，不能只靠「不在删除区间内」。
失败：只靠区间判断；锚点丢失未被发现。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-082** — 核踩坑规避

别名：AC-N6-082；关联FR-N6-008；来源R-001/R-002/R-003/R-004/R-007/R-010 / ADR-001/002/003/004/007/008/010。
验证：P3/T003取得删除后空行卫生（markdown 检查）、术语文件名同行 `sha256` 陷阱、`:178-180` 悬空指针修复记录；非实施者读实际产物，执行“核踩坑规避”；人读判据＋既有 markdown 检查定向读回，不跑全量；用本条通过与失败条件同尺判定，ORACLE-N6-SKELETON，精确命令见该Phase；跨Phase减法/字面/登记子面由P1–P4各自首验，P6只聚合原件〔已改正（审查修正 B4）：旧写法为通用套话输入（原文见本节开头统一记录），本次按本条主题改为专属输入，通过/失败条件未改；依据 B4〕
通过：不收空行导致的 markdown 检查红已处理；未触发「同一行同时出现术语文件名与 `sha256`」的陷阱；方法正文指向质询技能的悬空行号指针（`:178-180`）已顺手修掉。
失败：只删行不收空行；踩术语文件名的陷阱；悬空指针未修。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-083** — 核最小内联卡粒度

别名：AC-N6-083；关联FR-N6-008；来源R-001/R-002/R-003/R-004/R-007/R-010 / ADR-001/002/003/004/007/008/010。
验证：P3/T003取得`workflows/make-decision/SKILL.md` 的最小内联卡现状（标题＋一句＋指向节名）；非实施者读实际产物，执行“核最小内联卡粒度”；人读判据，无命令；用本条通过与失败条件同尺判定，ORACLE-N6-SKELETON，精确命令见该Phase；跨Phase减法/字面/登记子面由P1–P4各自首验，P6只聚合原件〔已改正（审查修正 B4）：旧写法为通用套话输入（原文见本节开头统一记录），本次按本条主题改为专属输入，通过/失败条件未改；依据 B4〕
通过：标题＋一句话＋指向提问技能的节名；不抄回字段表。
失败：抄回字段表；只写标题没有指向。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-084** — 核跨卡重叠与第三项来源

别名：AC-N6-084；关联FR-N6-008；来源R-001/R-002/R-003/R-004/R-007/R-010 / ADR-001/002/003/004/007/008/010。
验证：P3/T003取得`skills/catalog.yaml` 的 `capability_decisions` 条目、`skills/reuse-registry.md` 相邻节与 N4 旧节；非实施者读实际产物，执行“核跨卡重叠与第三项来源”；人读判据，无命令；用本条通过与失败条件同尺判定，ORACLE-N6-SKELETON，精确命令见该Phase；跨Phase减法/字面/登记子面由P1–P4各自首验，P6只聚合原件〔已改正（审查修正 B4）：旧写法为通用套话输入（原文见本节开头统一记录），本次按本条主题改为专属输入，通过/失败条件未改；依据 B4〕
通过：与上一张卡同节相邻登记为跨卡重叠、本卡是后写方且只在自己新开的一节里加；第三项来源新开一条「能力决定」条目，名字与既有两条不冲突，写清来源、采用内容与删除条件；本次采用处置与登记的当前编号一致为N6，不以旧T/M号冒当前owner。
失败：改了对方那两节；第三项来源挂到不存在的技能条目；名字冲突。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-085** — 核登记字段实测口径

别名：AC-N6-085；关联FR-N6-008；来源R-001/R-002/R-003/R-004/R-007/R-010 / ADR-001/002/003/004/007/008/010。
验证：P3/T003取得`skills/catalog.yaml` 的 `upstream[]` 字段、`THIRD_PARTY_NOTICES.md`、`skills/answer-as-page/SKILL.md` frontmatter、`skill-deps.yaml`；非实施者读实际产物，执行“核登记字段实测口径”；具名定向命令 `node node_modules/vitest/vitest.mjs run tests/contract/answer-as-page-skill.test.mjs --testNamePattern=^core:` 证结构；字段实测口径仍由人读；用本条通过与失败条件同尺判定，ORACLE-N6-SKELETON，精确命令见该Phase；跨Phase减法/字面/登记子面由P1–P4各自首验，P6只聚合原件〔已改正（审查修正 B4）：旧写法为通用套话输入（原文见本节开头统一记录），本次按本条主题改为专属输入，通过/失败条件未改；依据 B4〕
通过：新增来源地址伴非空采用内容；依赖只指现存技能且不自指；新answer正文frontmatter无version；改编不写vendored逐字节指纹、不新增登记字段。
失败：有地址无采用、闭包自指/悬空、新技能头带version、伪造vendor指纹或新增字段；新登记或落点以已废M号或历史T号作当前owner。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-086** — 看首屏是否折叠

别名：AC-N6-086；关联FR-N6-012；来源R-004/R-012 / ADR-012。
验证：P5/T005在交付该增量时取得answer-as-page原始来源、实际技能/登记、Figma提示词和未来真实页面；独立验收者区分规范、可用模板与用户效果，执行“看首屏是否折叠”；用本条通过与失败条件同尺判定，ORACLE-N6-COCKPIT，精确命令见该Phase。
通过：首屏只显示「整体形态」，细节靠点击展开。
失败：首屏铺满细节；不能折叠。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-087** — 核文字量

别名：AC-N6-087；关联FR-N6-012；来源R-004/R-012 / ADR-012。
验证：P5/T005在交付该增量时取得answer-as-page原始来源、实际技能/登记、Figma提示词和未来真实页面；独立验收者区分规范、可用模板与用户效果，执行“核文字量”；用本条通过与失败条件同尺判定，ORACLE-N6-COCKPIT，精确命令见该Phase。
通过：短标签节点≤8 字、关键点≤12 字、卡片≤6 字（三者均为**用户给定、非质量门**：来源 BT-028／U-040 逐字「节点 ≤8 字、关键点 ≤12 字、卡片 ≤6 字」）；验收/风险用实际来源派生总数与展开入口，不全量铺首屏；完整需求详情可按需展开。〔已改正（审查修正 D2）：旧写法只写「≤8字／≤12字／≤6字」，未标「用户给定、非质量门」也未给来源；依据本次裁定，数值保留、标注与来源补齐〕
失败：短标签超界、把全部验收/风险铺首屏，或写死过期的78/42计数。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-088** — 核观感（好看是硬要求）

别名：AC-N6-088；关联FR-N6-012；来源R-004/R-012 / ADR-012。
验证：P5/T005在交付该增量时取得answer-as-page原始来源、实际技能/登记、Figma提示词和未来真实页面；独立验收者区分规范、可用模板与用户效果，执行“核观感（好看是硬要求）”；用本条通过与失败条件同尺判定，ORACLE-N6-COCKPIT，精确命令见该Phase。
通过：留白、层级、克制配色、字号层次；不满屏边框与表格线。
失败：满屏边框或表格线；层级不清；配色花乱。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-089** — 核样张暂停与后续设计输入

别名：AC-N6-089；关联FR-N6-012；来源R-004/R-012 / ADR-012。

〔已改正（审查修正 B1／G3，**显式取代说明**）：AC-089 的**现行语义由 AC-122 取代**——依据 BT-033 逐字「别再继续跑样张了，后续反正要重设计的」与 BT-034 把页面抬为「驾驶舱」；decision-log:700 的原判据（「先给一屏样张→用户挑定→才出整页」，状态 unavailable：本版未执行）**保原号原条、不再作当前判据**。旧写法要点：以「先出样张再出整页」作通过条件、未执行记 unavailable。现行判据读 AC-122；本条只保留「暂停样张＋后续设计输入」的衔接事实，不恢复样张要求。〕
验证：P5/T005在交付该增量时取得answer-as-page原始来源、实际技能/登记、Figma提示词和未来真实页面；独立验收者区分规范、可用模板与用户效果，执行“核样张暂停与后续设计输入”；用本条通过与失败条件同尺判定，ORACLE-N6-COCKPIT，精确命令见该Phase。
通过：按BT-033/034与AC-122的后续裁定暂停样张：本轮不再跑样张，不把旧失败样张当默认；后续用户返回重设计并确认后才完成整页视觉交付。
失败：继续无授权跑样张、把旧稿当定稿，或无用户设计确认便宣视觉验收完成。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-090** — 核兜底形态与其余不变项

别名：AC-N6-090；关联FR-N6-012；来源R-004/R-012 / ADR-012。
验证：P5/T005在交付该增量时取得answer-as-page原始来源、实际技能/登记、Figma提示词和未来真实页面；独立验收者区分规范、可用模板与用户效果，执行“核兜底形态与其余不变项”；用本条通过与失败条件同尺判定，ORACLE-N6-COCKPIT，精确命令见该Phase。
通过：索引式仅作兜底保留；不依赖行号、顶部自报非权威、只报告比对、落任务库、单文件离线、同一承担者、较大更新时更新等各条仍成立。
失败：丢掉自报状态或落点约束；把兜底当默认。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-091** — 核内外分工与方法正文

别名：AC-N6-091；关联FR-N6-009；来源R-008 / ADR-009。
验证：P1/T001在交付该增量时取得两研究方法、现make-decision第3步与本任务完整研究/零结果输入；独立读者对照同一原始问题，执行“核内外分工与方法正文”；用本条通过与失败条件同尺判定，ORACLE-N6-RESEARCH，精确命令见该Phase。
通过：知识图谱＝内部调研（查图、读文件）、深度调研＝外部调研（来源与检索）；方法正文那句改准，不得再写成「内部与外部一起交给深度调研」，也不得写成「知识图谱可选」。
失败：分工未写明；正文仍把内外一起交给深度调研；写成知识图谱可选。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-092** — 核三条保障内外各一套

别名：AC-N6-092；关联FR-N6-009；来源R-008 / ADR-009。
验证：P1/T001在交付该增量时取得两研究方法、现make-decision第3步与本任务完整研究/零结果输入；独立读者对照同一原始问题，执行“核三条保障内外各一套”；用本条通过与失败条件同尺判定，ORACLE-N6-RESEARCH，精确命令见该Phase。
通过：三项（搜前声明／相关性判据／零结果写法）在内部与外部各有一套、形状一样、内容各写各自的：内部落知识图谱技能正文（讲图与文件），外部落深度调研技能正文（讲来源与检索）。
失败：只有一套；两边内容抄同一份；落点放错技能。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-093** — 核留存与模板改错

别名：AC-N6-093；关联FR-N6-009；来源R-008 / ADR-009。
验证：P1/T001在交付该增量时取得两研究方法、现make-decision第3步与本任务完整研究/零结果输入；独立读者对照同一原始问题，执行“核留存与模板改错”；用本条通过与失败条件同尺判定，ORACLE-N6-RESEARCH，精确命令见该Phase。
通过：外部报告走既有证据目录的日期＋主题；全文只保原件，决定正文保影响方向/范围/验收的结论和排除理由，其余指针；模板不存在文件名的改正归OI-012原owner，未改子条件保持未完成。
失败：复制报告全文、关键结论消失、报告落点错误，或跨卡模板仍错却把本AC全部宣通过。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-094** — 核「内部调研」定义

别名：AC-N6-094；关联FR-N6-009；来源R-008 / ADR-009。
验证：P1/T001在交付该增量时取得两研究方法、现make-decision第3步与本任务完整研究/零结果输入；独立读者对照同一原始问题，执行“核「内部调研」定义”；用本条通过与失败条件同尺判定，ORACLE-N6-RESEARCH，精确命令见该Phase。
通过：方法正文里补上了「内部调研」的定义（该词全仓只出现一次且此前零定义）。
失败：仍无定义；定义写在别处而非方法正文。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-095** — 核跨任务查历史不新建索引

别名：AC-N6-095；关联FR-N6-009；来源R-008 / ADR-009。
验证：P1/T001在交付该增量时取得两研究方法、现make-decision第3步与本任务完整研究/零结果输入；独立读者对照同一原始问题，执行“核跨任务查历史不新建索引”；用本条通过与失败条件同尺判定，ORACLE-N6-RESEARCH，精确命令见该Phase。
通过：不新建索引或控制面；只保证「逐任务可查」＋决策日志索引里逐件登记；材料写明「现有任务索引已从主干删除」这一事实。
失败：新建索引文件；声称走已删除的任务索引。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-096** — 核调研件命名

别名：AC-N6-096；关联FR-N6-009；来源R-008 / ADR-009。
验证：P1/T001在交付该增量时取得两研究方法、现make-decision第3步与本任务完整研究/零结果输入；独立读者对照同一原始问题，执行“核调研件命名”；用本条通过与失败条件同尺判定，ORACLE-N6-RESEARCH，精确命令见该Phase。
通过：用「日期＋主题」；同主题多件用主题细分、不用序号。
失败：用序号（01／02）或数字编号；同主题重名。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-097** — 核「四级」的定义与依据

别名：AC-N6-097；关联FR-N6-010；来源R-001/R-002/R-003/R-004/R-007/R-010 / ADR-001/002/003/004/007/008/010。
验证：P3/T003取得`research-m10-four-levels-2026-10-19.md`、ADR-010、U-042／BT-014 的逐字；非实施者读实际产物，执行“核「四级」的定义与依据”；人读判据，无命令；用本条通过与失败条件同尺判定，ORACLE-N6-SKELETON，精确命令见该Phase〔已改正（审查修正 B4）：旧写法为通用套话输入（原文见本节开头统一记录），本次按本条主题改为专属输入，通过/失败条件未改；依据 B4〕
通过：材料写明四级＝四种任务分级（小改动／普通任务／复杂任务／规划任务）并给依据（用户原话＋已生效决定＋模板）；不得出现层级式读法。
失败：写成层级（任务／阶段／Phase／子代理）；缺依据。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-098** — 核「同模式」的落点

别名：AC-N6-098；关联FR-N6-010；来源R-001/R-002/R-003/R-004/R-007/R-010 / ADR-001/002/003/004/007/008/010。
验证：P3/T003取得ADR-004／ADR-010 的四字段产物与 `decision-log.md` 决定格式；非实施者读实际产物，执行“核「同模式」的落点”；人读判据，无命令；用本条通过与失败条件同尺判定，ORACLE-N6-SKELETON，精确命令见该Phase〔已改正（审查修正 B4）：旧写法为通用套话输入（原文见本节开头统一记录），本次按本条主题改为专属输入，通过/失败条件未改；依据 B4〕
通过：同模式＝同一套产物形态：各分级都用「做什么／不做什么／风险／改动」四字段，且写成「沿用既有决定格式」不重写一份。
失败：重写一份格式；写成动作序列／提问纪律／技能单一定义。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-099** — 核分级选择的非目标登记

别名：AC-N6-099；关联FR-N6-010；来源R-001/R-002/R-003/R-004/R-007/R-010 / ADR-001/002/003/004/007/008/010。
验证：P3/T003取得`decision-log.md`「范围与非目标」的非目标行、N8 去向、接口要求；非实施者读实际产物，执行“核分级选择的非目标登记”；人读判据，无命令；用本条通过与失败条件同尺判定，ORACLE-N6-SKELETON，精确命令见该Phase〔已改正（审查修正 B4）：旧写法为通用套话输入（原文见本节开头统一记录），本次按本条主题改为专属输入，通过/失败条件未改；依据 B4〕
通过：非目标行写明理由与去向＝N8，并附接口要求「应当尽早询问」。
失败：未登记非目标；未写去向；缺接口要求。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-100** — 核不重定义分级

别名：AC-N6-100；关联FR-N6-010；来源R-001/R-002/R-003/R-004/R-007/R-010 / ADR-001/002/003/004/007/008/010。
验证：P3/T003取得ADR-010 的边界句与 N8 归属登记；非实施者读实际产物，执行“核不重定义分级”；人读判据，无命令；用本条通过与失败条件同尺判定，ORACLE-N6-SKELETON，精确命令见该Phase〔已改正（审查修正 B4）：旧写法为通用套话输入（原文见本节开头统一记录），本次按本条主题改为专属输入，通过/失败条件未改；依据 B4〕
通过：本卡不重新定义四种任务分级（定义与选择归 N8），只写「各分级用同一套产物形态」。
失败：在本卡重定义分级或写选择逻辑。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-101** — 核三条「只给指针不新增」

别名：AC-N6-101；关联FR-N6-010；来源R-001/R-002/R-003/R-004/R-007/R-010 / ADR-001/002/003/004/007/008/010。
验证：P3/T003取得`AGENTS.md` 派发纪律、写作规范件、跨 Phase 写集声明；非实施者读实际产物，执行“核三条「只给指针不新增」”；人读判据＋定向 grep 证「零命中／只给指针」，无新增命令；用本条通过与失败条件同尺判定，ORACLE-N6-SKELETON，精确命令见该Phase〔已改正（审查修正 B4）：旧写法为通用套话输入（原文见本节开头统一记录），本次按本条主题改为专属输入，通过/失败条件未改；依据 B4〕
通过：「最小闭环固定回传格式」不新增（给指针指向既有派发纪律）、「一次说清不中途换规格」不新增（仓库零命中，给指针指向既有写作规范）、「只核本 Phase 声明写集」只给指针不重复正文。〔已改正（合并影响 6240f199）：N5 已在 `AGENTS.md` 新增 `### 派发与回传`（六项固定回传开头＋研究类另写来源与覆盖），故「既有派发纪律」的指针目标现在**真实存在**；本卡只给指针、不重复其正文。〕
失败：新增了新字段或新纪律；复制了既有正文。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-102** — 核「今天不可实跑」的如实标注

别名：AC-N6-102；关联FR-N6-010；来源R-001/R-002/R-003/R-004/R-007/R-010 / ADR-001/002/003/004/007/008/010。
验证：P3/T003取得四种任务分级的当前任务类型取值现状；非实施者读实际产物，执行“核「今天不可实跑」的如实标注”；人读判据，无命令；用本条通过与失败条件同尺判定，ORACLE-N6-SKELETON，精确命令见该Phase〔已改正（审查修正 B4）：旧写法为通用套话输入（原文见本节开头统一记录），本次按本条主题改为专属输入，通过/失败条件未改；依据 B4〕
通过：四级里三级还不是正式任务类型取值 → 那条验收如实标注今天不可实跑，不假装能跑。
失败：假装三级可实跑；把不可实跑写成通过。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-103** — 走一遍自动打开与刷新

别名：AC-N6-103；关联FR-N6-012；来源R-004/R-012 / ADR-012。
验证：P5/T005在真实页面生成完成后，生成owner执行已有授权范围的系统Chrome脚本，分别观察已打开同名标签与未打开时的实际标签数量/刷新；首次系统授权原事实附后。脚本缺失或权限拒绝只报未自动打开，停止该路径；隔离QA不冒真实Chrome授权。
通过：生成完成后用系统脚本操作 Chrome：找到已打开的同名标签则切过去并刷新，未找到才新开；不反复新开同名标签；首次授权如实登记；脚本不可用或未授权时如实报告「未自动打开」。
失败：反复新开同名标签；未授权却声称已打开；授权事实不登记。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-104** — 看本次变更高亮

别名：AC-N6-104；关联FR-N6-012；来源R-004/R-012 / ADR-012。
验证：P5/T005实际页面先显示一项真实变更，独立浏览器验收者点击顶部本次更新跳转/展开，再点我看过了清除，下一次真实内容更新观察高亮重新出现；原页/侧车输入与截图/操作原件由同一owner提供。
通过：顶部固定「本次更新」条列出变更项且可点击跳转；变更的节点／行加高亮；高亮保留到下次更新并可点「我看过了」清除，下次更新重新出现。
失败：无「本次更新」条；高亮不能点开跳转；清除后不再出现或永不消失。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-105** — 核变更判定

别名：AC-N6-105；关联FR-N6-012；来源R-004/R-012 / ADR-012。
验证：P5/T005生成者给连续两版真实节点内容与同处侧车，保持节点A不变、只改节点B，独立读者核仅B高亮；再给缺失侧车输入，观察明确失准事实而非全变假高亮。整文件hash变化不提供节点结论。
通过：用侧车文件里的逐节点内容指纹比对，只标真变了的；不得用整文件指纹当「所有节点都变了」；侧车放任务库、与页面同处。
失败：用整文件指纹判定；侧车缺失仍出高亮（未如实登记失准）。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-106** — 核模板时序与替换条件

别名：AC-N6-106；关联FR-N6-012；来源R-004/R-012 / ADR-012。
验证：P5/T005在交付该增量时取得answer-as-page原始来源、实际技能/登记、Figma提示词和未来真实页面；独立验收者区分规范、可用模板与用户效果，执行“核模板时序与替换条件”；用本条通过与失败条件同尺判定，ORACLE-N6-COCKPIT，精确命令见该Phase。
通过：只声明模板规范与替换条件；依据为用户选定层级树＋左右分栏和驾驶舱定位，旧失败页只作反例；真实Figma设计返回并经用户确认、独立实际读回后才定稿替换。
失败：把第一版负面优化稿当依据、缺替换条件，或在设计暂停时自行定稿/实施模板。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-107** — 核模板形态与登记

别名：AC-N6-107；关联FR-N6-012；来源R-004/R-012 / ADR-012。
验证：P5/T005在交付该增量时取得answer-as-page原始来源、实际技能/登记、Figma提示词和未来真实页面；独立验收者区分规范、可用模板与用户效果，执行“核模板形态与登记”；用本条通过与失败条件同尺判定，ORACLE-N6-COCKPIT，精确命令见该Phase。
通过：真实设计确认后，P5同一交付产生单文件HTML骨架，结构/样式/折叠/高亮/双栏在内，生成只填内容；真实文件存在时bundle.files登记；此前本条件保未完成。
失败：拆多文件、漏登记、生成每次重造样式，或仅有计划路径却声称模板可用。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-108** — 核本次build-plan Figma提示词交付

别名：AC-N6-108；关联FR-N6-012；来源R-004/R-012 / ADR-012。

〔已改正（审查修正 B2／G2，**显式取代说明**）：本阶段即 decision-log 所称「**下一阶段**」——依据 BT-032 逐字「请在build-plan过程中生成figma make提示词文件」；判据由旧「**接口声明**」转为现「**实产交付**」。decision-log:719 的旧判据（「提示词在下一阶段产生、本卡不产生」，状态 unavailable：本版未执行）**保原号原条、不再作当前判据**。旧写法要点：只要求材料写明路径与唯一写者、不要求本卡实产。〕
验证：本build-plan主会话现在提供已实产的specs/n6-skeleton-module-decision-20261019/figma-make-prompt.md，独立读者在计划确认前对照BT-032/033/034、本条清单和全局写集逐项核内容及唯一writer。P5/T005仅消费该已交设计输入，不把提示词首验推迟到实施。
通过：本次build-plan实际产生specs/n6-skeleton-module-decision-20261019/figma-make-prompt.md，主会话唯一写；包含双栏、十二工作包层级、详情九区、折叠、高亮更新条、离线零依赖零行号、颜色字号、状态含义、任务进度和四环追溯要求。
失败：把应在本次build-plan产生的提示词继续推后、缺精确写集/唯一writer，或漏源要求。
证据：**证据状态＝`incomplete`（现状不填通过）**——现行 `figma-make-prompt.md` 已被重写为 776 行 / 37,423 字节（**读数只作对照**），`quality/tests/2026-10-19-003-build-plan-figma-prompt-readback.json` 的旧读回 needle 已过期，须用现行版重做「结构＋语义」读回；重做前本条件保持 `incomplete`。并行件 `figma-make-prompt-revision.md`（339 行 / 24,887 字节，读数只作对照）与第二轮补充件 `figma-make-prompt-revision-2.md`（141 行 / 8,638 字节，读数只作对照）一并登记，均不冒模板已交付。〔已改正（审查修正 B2）：旧证据只写「已产原件/hash」并引用过期读回件，未标 `incomplete`；依据本次裁定与三件实测〕已产figma-make-prompt.md原件/hash、BT-032/033/034原条件；quality/evidence/2026-10-19-011-build-plan-final-spec-analyze.md的“AC108当下提示词完整内容核对”是独立读者完整语义核对。quality/tests/2026-10-19-003-build-plan-figma-prompt-readback.json仅证结构，未进入050包的事实保覆盖限制；包内context真实全文送达不等于不存在实际提示词文件，也不证明视觉已验。

- **AC-109** — 核页面定位与权威边界

别名：AC-N6-109；关联FR-N6-012；来源R-004/R-012 / ADR-012。
验证：P5/T005在交付该增量时取得answer-as-page原始来源、实际技能/登记、Figma提示词和未来真实页面；独立验收者区分规范、可用模板与用户效果，执行“核页面定位与权威边界”；用本条通过与失败条件同尺判定，ORACLE-N6-COCKPIT，精确命令见该Phase。
通过：定位为当前任务驾驶舱，覆盖全任务详情与任务进度；顶部声明只读且非进度权威，权威仍当前材料与task facts，无新增进度账本/投影。
失败：仍只第一阶段总览、无权威声明，或页面成为第二进度权威。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-110** — 核四阶段用途

别名：AC-N6-110；关联FR-N6-012；来源R-004/R-012 / ADR-012。
验证：P5/T005在交付该增量时取得answer-as-page原始来源、实际技能/登记、Figma提示词和未来真实页面；独立验收者区分规范、可用模板与用户效果，执行“核四阶段用途”；用本条通过与失败条件同尺判定，ORACLE-N6-COCKPIT，精确命令见该Phase。
通过：做方向＝工作包与决定；做计划＝补 phase 开发内容与 spec 内容；写代码＝显示当前哪些任务完成；验收＝显示验收结果在哪里。
失败：缺任一阶段用途；把阶段用途写错。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-111** — 核进度颗粒度

别名：AC-N6-111；关联FR-N6-012；来源R-004/R-012 / ADR-012。
验证：P5/T005在交付该增量时取得answer-as-page原始来源、实际技能/登记、Figma提示词和未来真实页面；独立验收者区分规范、可用模板与用户效果，执行“核进度颗粒度”；用本条通过与失败条件同尺判定，ORACLE-N6-COCKPIT，精确命令见该Phase。
通过：进度到任务级：每个任务一行（状态＋验收结果在哪）。
失败：只到阶段级；没有验收结果位置。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-112** — 核跨阶段更新责任登记

别名：AC-N6-112；关联FR-N6-012；来源R-004/R-012 / ADR-012。
验证：P5/T005在交付该增量时取得answer-as-page原始来源、实际技能/登记、Figma提示词和未来真实页面；独立验收者区分规范、可用模板与用户效果，执行“核跨阶段更新责任登记”；用本条通过与失败条件同尺判定，ORACLE-N6-COCKPIT，精确命令见该Phase。
通过：保持较大变化时更新；各阶段具体更新输入/时点由所属阶段owner在本计划接口登记，不回写旧方向记录冒当时已定；只改措辞/指针不触发生成；**本卡不写死后三阶段节点**——build-plan／build-code／verify-code 各自更新什么、何时更新只登记责任与输入（同 AC-113），具体节点时点归所属阶段 owner。〔已改正（审查修正 C1）：旧标题「核更新触发」与 AC-069 重名，通过条件也没写「本卡不写死后三阶段节点」；现标题改为「核跨阶段更新责任登记」并把该边界写进通过条件，AC-069 不动〕
失败：把旧本阶段未定节点冒当时已定，或完全无更新约定、每步强制生成。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-113** — 核跨阶段写集登记

别名：AC-N6-113；关联FR-N6-012；来源R-004/R-012 / ADR-012。
验证：P5/T005在交付该增量时取得answer-as-page原始来源、实际技能/登记、Figma提示词和未来真实页面；独立验收者区分规范、可用模板与用户效果，执行“核跨阶段写集登记”；用本条通过与失败条件同尺判定，ORACLE-N6-COCKPIT，精确命令见该Phase。
通过：本spec登记build-plan/build-code/verify-code各自页面更新内容、时点与原owner；相应六份方法/步骤文件本卡只读，不能把接口登记冒其正文逻辑已实现。
失败：漏阶段接口、越权改六份正文，或把仅登记写成已接线执行。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-114** — 核模板能否承载进度区

别名：AC-N6-114；关联FR-N6-012；来源R-004/R-012 / ADR-012。
验证：P5/T005在交付该增量时取得answer-as-page原始来源、实际技能/登记、Figma提示词和未来真实页面；独立验收者区分规范、可用模板与用户效果，执行“核模板能否承载进度区”；用本条通过与失败条件同尺判定，ORACLE-N6-COCKPIT，精确命令见该Phase。
通过：模板规范明确任务级进度区；实际模板条件同AC-107，文件存在及浏览器读回前不宣可用。
失败：只支持第一阶段、规范漏任务级区，或仅写要求就冒模板生效。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-115** — 核逐字缺口的如实登记

别名：AC-N6-115；关联FR-N6-001；来源R-001/R-002/R-003/R-004/R-007/R-010 / ADR-001/002/003/004/007/008/010。
验证：P3/T003取得`requirement-index.md` §3 各 R 的逐字栏与 §8.0 缺口表、`verbatim-recovery-2026-10-19.md`；非实施者读实际产物，执行“核逐字缺口的如实登记”；人读判据，无命令；用本条通过与失败条件同尺判定，ORACLE-N6-SKELETON，精确命令见该Phase〔已改正（审查修正 B4）：旧写法为通用套话输入（原文见本节开头统一记录），本次按本条主题改为专属输入，通过/失败条件未改；依据 B4〕
通过：有用户需求原话的R001/005/008/011/012保逐字；R006为选择类答复，R002/003/004/007/010为文档转述，R010无逐字；R009无定义不补；用户原话本不存在与取不到分开，原件自带不完整不补写。
失败：代写逐字、把推断/提炼当原话、硬凑不存在原话，或宣每条都有用户需求逐字。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-116** — 核 OI-017 的处置甲

别名：AC-N6-116；关联FR-N6-001；来源R-001/R-002/R-003/R-004/R-007/R-010 / ADR-001/002/003/004/007/008/010。
验证：P3/T003取得`requirement-index.md` §2／§3.9／§3.10、`decision-log.md` OI-017 段、R-009 零命中事实；非实施者读实际产物，执行“核 OI-017 的处置甲”；人读判据，无命令；用本条通过与失败条件同尺判定，ORACLE-N6-SKELETON，精确命令见该Phase〔已改正（审查修正 B4）：旧写法为通用套话输入（原文见本节开头统一记录），本次按本条主题改为专属输入，通过/失败条件未改；依据 B4〕
通过：保R010/R011/R012真实定义、来源类型及追加编号，不改已有号不重排；R010依AC-115声明归纳非逐字，R009无定义不补内容。
失败：重排编号、为R009编内容、只改引用不补定义，或把R010错误绑定BT014逐字。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-117** — 核驾驶舱定位

别名：AC-N6-117；关联FR-N6-012；来源R-004/R-012 / ADR-012。
验证：P5/T005在交付该增量时取得answer-as-page原始来源、实际技能/登记、Figma提示词和未来真实页面；独立验收者区分规范、可用模板与用户效果，执行“核驾驶舱定位”；用本条通过与失败条件同尺判定，ORACLE-N6-COCKPIT，精确命令见该Phase。
通过：材料写明页面是「当前任务的驾驶舱」：一眼看清每条原始需求的来源／调研／决策／任务／实现／测试，并能验证「每条需求都有对应、都有实现」；同时呈现需求详情、整个任务设计与进度。
失败：只写「详情＋进度追踪」；缺「需求都有对应都有实现」这条目的。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-118** — 走一遍四环追溯

别名：AC-N6-118；关联FR-N6-012；来源R-004/R-012 / ADR-012。
验证：P5/T005由独立读者给一条有真实改动/测试原件的需求及一条“声称完成但git diff无对应”的受控反例，沿实际页面逐环点击需求→任务→文件→结果；以真实git diff --name-only及任务证据交叉读回，缺环和不一致必须可见，受控反例不得写成真实任务事实。
通过：页面能逐条显示 `需求 → 任务 → 真实改动文件 → 测试结果`；任一环缺失标「缺」；实现以真实代码改动清单为准，与「声称完成」不一致处标出来；不得美化、不得用声称顶替真实改动。
失败：用「声称完成」顶替真实改动；缺环不标；把不一致写成一致。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-119** — 核数据源与不新增控制面

别名：AC-N6-119；关联FR-N6-012；来源R-004/R-012 / ADR-012。
验证：P5/T005生成者列本次实际读取的当前材料、requirement-index、coverage-matrix、task facts、测试/审查原件与真实diff来源ref；独立读者抽一需求回原件并核没有新进度存储writer。源码中出现来源名不等于实际消费。
通过：数据源固定＝当前材料＋任务事实＋测试结果＋审查结果＋真实代码改动清单；不得新增任何进度账本或投影。
失败：新增进度账本／投影／第二份进度权威；数据源里少了真实改动清单。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-120** — 核空状态

别名：AC-N6-120；关联FR-N6-012；来源R-004/R-012 / ADR-012。
验证：P5/T005在实际内容输入里明确指定尚未发生的build-code/verify条件，独立浏览器验收者观察对应区“尚未产生”与将填内容；再给确实发生失败的输入，观察其与未产生分开。不能把受控成功值替入真实当前状态。
通过：后面阶段尚未产生的区显示「尚未产生＋到时会填什么」；不显示空表、不隐藏。
失败：显示空表；把未产生的区隐藏；留白无说明。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-121** — 核模板承载两个区

别名：AC-N6-121；关联FR-N6-012；来源R-004/R-012 / ADR-012。
验证：P5/T005在交付该增量时取得answer-as-page原始来源、实际技能/登记、Figma提示词和未来真实页面；独立验收者区分规范、可用模板与用户效果，执行“核模板承载两个区”；用本条通过与失败条件同尺判定，ORACLE-N6-COCKPIT，精确命令见该Phase。
通过：模板规范具名要求四环追溯区与任务进度区，含需求/任务/真实改动/测试结果/缺口/空状态；实际可用性沿AC-107，缺设计或未实测保未完成。
失败：缺任一区、只有一阶段总览，或规范在场冒可用模板。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

- **AC-122** — 核「页面设计先搁置」

别名：AC-N6-122；关联FR-N6-012；来源R-004/R-012 / ADR-012。
验证：P5/T005在交付该增量时取得answer-as-page原始来源、实际技能/登记、Figma提示词和未来真实页面；独立验收者区分规范、可用模板与用户效果，执行“核「页面设计先搁置」”；用本条通过与失败条件同尺判定，ORACLE-N6-COCKPIT，精确命令见该Phase。
通过：当前只登记驾驶舱定位、数据/模板要求及替换条件，不产新设计、不再跑样张；后续真实设计是用户输入，取得新确认后才由P5原owner实施。
失败：本轮越过暂停制作设计或样张，或把未定稿写成定稿。
证据：该Task原始输入/产物ref、具名命令与输出/exit、独立读者逐条件结论及未覆盖范围；存在真实用户或系统前置时另附真实答复/权限事实，受控材料不冒真确认。

## 12. 风险、未决与交接

本节与 decision-log 的对应关系：本卡的 `RISK-xx` 承接 decision-log 的 `RK-xxx`，`OPEN-xx` 承接 `OI-xxx`；下表只做导航，不新增判据、不改严重度。严重度照抄 decision-log（**只作对照**，不作本卡质量门）；未在本表列出的 RK／OI 保持 decision-log 原状态。

**风险映射（RK-xxx ↔ RISK-xx）**

| 本卡 | decision-log | 严重度（照抄） | 状态 | 承接说明／影响 AC |
| --- | --- | --- | --- | --- |
| RISK-01 | RK-046、RK-040 | 中 | 未关闭 | 样张暂停与真实 Figma 设计未回；AC-064/086–089/106/107/114/121 |
| RISK-02 | RK-010、RK-009、RK-008（高）、RK-060（高） | 中／高 | 未关闭 | 上游模板、确认机制与双写缺口；AC-047/093；OPEN-02 |
| RISK-03 | RK-063 | 中 | 未关闭 | 同条件成本原数未取得；AC-029；OPEN-03 |
| RISK-04 | RK-057、RK-054 | 中 | 未关闭 | 检查器既有语义与登记字段被测试钉死；AC-016/032/085 |
| RISK-05 | RK-038 | 低 | 未关闭 | 系统 Chrome 能力或授权缺失；AC-103 |
| RISK-06 | RK-017、RK-045、RK-014 | 中 | 未关闭 | 共享文件不同节仍可能覆盖；全部 FR |
| RISK-07 | RK-015、RK-024、RK-025、RK-007（高） | 中／高 | 未关闭 | 减法误删最小内联卡／锚点／确认路径；AC-079/081/082/083 |
| RISK-08 | RK-047（高）、RK-048、RK-049 | 高 | 未关闭 | 只读页漂移、指针失效与被当权威；AC-066/067/105/118 |

〔已改正（审查修正 H1／H2）：旧 §12 只有 RISK-01…08 与 OPEN-01…04，没有 RK↔RISK、OI↔OPEN 的映射，也没有严重度与状态列，读者无法从本卡编号回 decision-log 风险表；现补映射表。严重度照抄、只作对照。〕

- **RISK-01**（FR-N6-012、PFACT-005）：用户已停止样张且真实Figma设计未回，若为静态测试绿自行造模板，会违背范围。P5只处理授权内技能/来源/规范，PAGE-ORACLE-SPLIT让core元数据有可执行子面；template/full失败原件继续保留，设计/模板实际可用/观感条件保incomplete；输入提供者用户，触发为用户返回设计并真实确认。P6逐条件读回，不能整体绿色。
- **RISK-02**（FR-N6-001/003/009）：上游模板与确认机制缺口可能被当本卡已解决。保DNT，分别由原模板与确认owner处理；本卡提供依据及实际缺项，不扩大schema或写集。验收AC-047/093明示未达子条件。
- **RISK-03**（FR-N6-008、PFACT-007）：同条件成本未取得会掩盖新增确认/研究的常驻开销。一次性改造与每次任务开销分列，真实成本provider缺项按原原因码保持unknown；不用字节、调用数或静态篇幅替净收益。P6与verify-code核AC-029。
- **RISK-04**（FR-N6-002）：目标fixture只用“单元”表头，若实现只认fixture会漏真实索引“派生号”和覆盖表“需求”表头。P3用两份真实原件的表头映射和坏行正反读回；冻结评分变更需TCR，不能假称目标绿即真实两时点已覆盖。
- **RISK-05**（FR-N6-012）：系统Chrome能力或用户授权缺失，隔离QA也不能证明真实Chrome标签复用。P5记录每条实际系统结果/未打开原因；拒绝或无权限第一次即停该外部路径，其它安全工作继续；不复制浏览器登录态。
- **RISK-06**（全部FR）：共享文件不同节仍可能覆盖。按本设计先后writer单写、读当前字节增量修改；旧历史与N4登记保留。坏hunk局部恢复，不整份checkout、不用目录快照。
- **RISK-07**（FR-N6-005/008）：压重复时丢最小内联卡、四项退出、真实回复或领域锚点会降低方法。P2/P3局部改后由独立读者用同输入消费，保 `#domain-awareness` 及格式附件既有锚点，不拿静态绿证明语义。
- **RISK-08**（FR-N6-012）：只读页会漂移，来源指纹/编号比对不检查一行结论措辞。每次实质更新核原ref，缺环/声明完成与真实diff矛盾显露，独立验收抽核；页面可重建但历史失败原件不删。

**本次补登的高风险项（decision-log 严重度为「高」而旧 §12 未列，处置逐条照抄 decision-log，不新增判据）**

- **RISK-09**（FR-N6-004；RK-001，严重度 高）：15 步、末步 slug `closeout`、末步完成凭据形状与末步描述里的「收口＋成本入口」被硬测试钉死；为落三段而拆步／合步，或顺手改末步描述，会直接变红。处置沿 RK-001：只在现有步内改造；AC-009／AC-010 逐字读回 raw 步表与三处字面钉。
- **RISK-10**（FR-N6-004/008；RK-002，严重度 高）：三处文件被测试盯字面（`skills/knowledge-graph/SKILL.md` 字面、两个提问技能关键词组、禁绝对宿主路径），改词或换结构即红。处置沿 RK-002：按词组清单先自检，改后只跑对应定向测试；AC-010／AC-012 读回。
- **RISK-11**（FR-N6-003；RK-006，严重度 高）：「确认骨架」可能退化成又一次细节对话，动作等于没生效。处置沿 RK-006：主会话在第一次实际问答后自检，确认前先调既有自查；AC-020／AC-042／AC-044 读回展示对象与先后。
- **RISK-12**（FR-N6-012；RK-029，严重度 高）：若第一次真出页效果不好就回退到搬 944KB 程序，会一次引入约 977KB、三层许可与不可重建的黑盒。处置沿 RK-029：先按只搬正文与设计执行；回退前把体积与许可缺口拿到用户面前再定；AC-073 读回。
- **RISK-13**（FR-N6-012；RK-033，严重度 高）：「声称完成」与真实改动不一致却没人发现，会形成假完成。处置沿 RK-033：四环缺环标「缺」、不一致处标出来，独立审查按真实 `git diff --name-only` 抽检；AC-118 读回。
- **RISK-14**（FR-N6-012；RK-035，严重度 高）：页面升级为「全任务详情＋进度追踪」后更容易被当成进度权威，与材料不一致即误导。处置沿 RK-035：顶部固定写「只读视图，不是进度权威」，不得新增进度账本或投影；AC-066／AC-109 读回。

〔已改正（审查修正 H2）：旧 §12 未列 decision-log 里严重度为「高」的 RK-001／RK-002／RK-006／RK-029／RK-033／RK-035（RK-007／RK-047／RK-060 已分别由 RISK-07／RISK-08／RISK-02 承接）；现补登为 RISK-09…RISK-14，编号沿用既有 RISK 系列，处置照抄 decision-log。〕

- **OPEN-01**：用户后续Figma实质设计、可用模板与视觉确认未有；owner用户/P5，影响AC-064/086–089/106/107/114/121。关闭条件是真实设计返回、用户确认及独立实际浏览器读回；当前不阻断无关安全实现，不算这些条件通过。
- **OPEN-02**：OI-012上游四处模板/登记未改；owner上一张卡模板系，影响AC-093及原件格式一致性。本卡只给五栏/类型/批次与文件名依据，取得原owner交付后才读回该子条件。
- **OPEN-03**：OI-011同条件成本原数未有；owner阶段主会话/verify-code，影响AC-029。真实来源、窗口、命令、预算一致且缺报清楚才闭合；无数据保unknown。
- **OPEN-04**（承接 OI-015；**状态：已核实不支持（保留为事实约束）**，不是待解未决项）：确认机制不支持按用途／按步骤区分，`stage`／`decision`／`reply`／`materialRefs` 四字段固定、多一个即 `INVALID_CONFIRMATION`，文件名 `${stage}-${decision}`，没有「哪一步」字段；owner既有确认机制维护者，影响AC-047。本卡不新建凭证，实际两次确认保问答对象与原ref，不能将这项未支持能力假报通过；作为事实约束保留，不再等 owner 动作。〔已改正（审查修正 H3）：旧写法把 OI-015 列为未决 OPEN 项；依据 decision-log OI-015「closed（已核实：机制不支持按步区分）」，改为「已核实不支持（保留为事实约束）」〕

**未决映射（OI-xxx ↔ OPEN-xx）**

| 本卡 | decision-log | 状态 | 影响 AC |
| --- | --- | --- | --- |
| OPEN-01 | —（无对应 OI；真实缺口＝用户后续 Figma 设计） | open | AC-064/086–089/106/107/114/121 |
| OPEN-02 | OI-012 | open（上游模板 owner） | AC-093 |
| OPEN-03 | OI-011 | open（成本原数未取得） | AC-029 |
| OPEN-04 | OI-015 | **已核实不支持（保留为事实约束）** | AC-047 |
| OPEN-05 | OI-008 | open（本卡已定部分，余项见下） | AC-013/091/093/095 |
| OPEN-06 | OI-013 | open（目前只有预写 RED） | AC-016/032/082 |

- **OPEN-05**（承接 OI-008；owner＝build-plan 本卡，交回模板／研究 owner）：① 两份索引类原件的实际件名与节位——件名已定（`requirement-index.md`、`coverage-matrix-5d.md`、`research-candidates.md`），本卡已给节位（本任务自己的研究导航落 `requirement-index.md` §5；取舍就近沿既有内容格写原因，不另产研究索引台账）；② 零消费者调研校验器 `runtime/evidence/research-report.mjs` 的职责／consumer 缺口／owner／保留与删除条件四件登记位置——沿 `skills/reuse-registry.md` 本卡新节；③ 工作包⑨与工作包④第3步写集重叠的定序——按 P1→P2→P3 串行。**关闭条件**＝①②③ 各有落点并被独立读者读回，缺一不闭合；当前 ②③ 已在本 spec 落位、① 的节位已给，故只待读回。影响 AC-013／AC-091／AC-093／AC-095。
- **OPEN-06**（承接 OI-013；owner＝build-code 实施者）：自动核查未实现——`tools/cli/check-decision-log-chain.mjs` 需扩「单元三件齐不齐」并认得派生号，且在大纲确认后与全部工作包谈完后各跑一次、只报事实不阻断。**关闭条件**＝实现落地 ＋ 两个真实时点的原件（命令、`warnings`、`exit`）留存并被独立读者按 AC-032 读回；当前只有预写 RED，不把计划当已实现。影响 AC-016／AC-032／AC-082。

〔已改正（审查修正 H3）：旧 §12 无 OI↔OPEN 映射表，OI-008／OI-013 只在一段散写里出现且无 owner／关闭条件／影响 AC 三栏；现补 OPEN-05／OPEN-06 承接并补齐三栏，OI-015 标为已核实不支持。〕

OI-008本卡可定部分：三原件沿现件名；本任务自身调研落需求索引§5，取舍沿现格，不增文件；零consumer研究模块的四件登记沿reuse本卡新节；研究与流程先后writer按全局依赖。OI-013由P3实际扩checker与两个时点调用；目前只有预写RED，不能把计划当已实现。〔已改正（审查修正 H3）：本段是旧写法、原样保留；其内容已由上方 OPEN-05（OI-008 的三项）与 OPEN-06（OI-013）两行承接，此后读这两行为准，本段不再单独承载未决项口径。〕

**交接**（对象／内容／时点）：交接对象＝verify-code／下一阶段；交接内容＝本 `spec.md` ＋ 六个独立 Phase（`phases/P1`…`phases/P6` 与纯指针 `phases/index.md`）＋ `figma-make-prompt.md`（含并行件 `figma-make-prompt-revision.md` 与第二轮补充件 `figma-make-prompt-revision-2.md`）；交接时点＝**计划确认后**。交接只给指针与最小必要结论、不复制正文；未达条件随件保留 `incomplete`／`unknown`／`unavailable`，不因交接被读成通过。〔已改正（审查修正 H5）：旧 §12 标题写了「交接」但正文没有交接对象／内容／时点；依据本次审查裁定补一行交接内容〕

## 13. 业务影响与回归范围

用户方向旅程、提问者与材料作者直接受影响；runtime业务协议、历史报告与上游任务质量不变更。受影响回归面限定：十五步末步/成本入口、知识图谱字面、问答工具键与真实reply、四项退出、领域锚点、ADR统计、bundle/candidate来源和当前材料枚举。各Phase点名命令/输入，已有证据充分时只读原件，未发生新改变不扩全量回归。

方案按四阶梯选择：复用两研究owner、原提问方法、原chain和事实底座；窄扩单元警告，不接线零consumer研究模块；独立新answer-as-page确有用户直接调用及当前驾驶舱consumer，只新增最小正文/bundle与条件模板。拒绝CLI/新进度存储/自动抓网，删除D1–D7低信息重复，独有义务仍由原owner承接。幂等依真实现文件与唯一writer；失败不覆盖原件，不新建恢复许可。

回退由各原owner只恢复本次受影响hunk：方法丢义务恢复该段，checker错误恢复单元解析，来源登记只移除未被consumer使用的本次条目；先核当前caller与已交付下游，不从全树快照重置。已有独立发现与原失败保留。页面未达用户效果时先保缺口，搬上游打包CLI需重新展示已记录体积/许可/黑盒代价并由用户决定，本计划没有接受该回退。

成本假设：复用已装Node/Vitest/js-yaml，无新依赖；研究/提问/验证主要成本来自完整输入的独立消费，精确时间/token不猜。一次性设计、方法迁入和每任务新增骨架确认/调研/分诊的常驻开销分开；同条件原数缺失时不承诺节省。

## 补充材料

父PRD只读锚：`specs/archive/skills-framework-redesign-20261014/prd.md#n6`（原文有显式 `<a id="n6">`）；其ORACLE-T1、G1、共同采用与23保护按实现设计所列原行区间定位。原文的净字节约束已由当前decision U-007/U-034及ADR0049退役裁决替代，不能重新带回。

原始调研：`quality/evidence/decision-log-refs/research-n6-raw-requirement-2026-10-19.md`、`research-n6-external-sources-2026-10-19.md`、`research-m9-research-standardization-2026-10-19.md`、`research-port-external-skill-2026-10-19.md`、`research-html-overview-2026-10-19.md`。它们是有时点限制的来源，旧计数/行号/候选被后续裁决替代时按当前决定读，不复制旧漂移正文。

固定外部采用沿catalog与原件精确版本：Addy `idea-refine/interview-me` commit `aeac41d4d005999432bb7312f7ff06383a91d59d`，MIT，commit与原文hash不冒签名/Release级绑定；pstack只有归档指纹、提交未证实、镜像自改，四未保存引用不得声称采用；answer来源固定 `7acea24024923eaae8647f5988e826062456dc86`，MIT，版本0.5.5，v0.5.5标签未签名，不把其它标签推广全核。直达原文分别为 [idea-refine](https://github.com/addyosmani/agent-skills/blob/aeac41d4d005999432bb7312f7ff06383a91d59d/skills/idea-refine/SKILL.md)、[interview-me](https://github.com/addyosmani/agent-skills/blob/aeac41d4d005999432bb7312f7ff06383a91d59d/skills/interview-me/SKILL.md)、[answer技能](https://github.com/QingYunA/answer-me-with-html/blob/7acea24024923eaae8647f5988e826062456dc86/skills/answer-me-with-html/SKILL.md)。本次采用边界来自可读原件与当前决定，不把来源pin当方法效果。

**外部来源登记三栏（章节／取回坐标／删除条件）**——每条只列自己的真实来源，不再全列：

| 来源 | 本 spec 登记章节 | 原件与章节 | 取回坐标（时间／工具） | 删除条件 |
| --- | --- | --- | --- | --- |
| Addy `idea-refine`（`aeac41d4…`，MIT） | §补充材料「固定外部采用」；AC-056／AC-022 | `quality/evidence/decision-log-refs/research-n6-external-sources-2026-10-19.md` §1.1、§2.1–§2.3 | 2026-10-19（该件「观察日期」）；对本地已保存原件用 `read`／`shasum -a 256` 逐字节核对，**非在线抓取** | 仅当 P5 采用决定被撤销或 `skills/catalog.yaml` 该 `upstream` 条退役时，由 P5 原 owner 删本条；删前留原 ref 与退役理由，不删历史研究原件 |
| Addy `interview-me`（同一 commit，MIT） | 同上；AC-022／AC-055 | 同上 §1.2、§2.1–§2.3 | 同上 | 同上 |
| pstack `prototype.md`（commit 未证实，仅归档指纹） | 同上；AC-062 | 同上 §1.3、§2.3（pin 强度小节） | 2026-10-19；同上；pin 为 tar 包 SHA256＋移动 `main` 引用，**不得升格**为签名／Release 级 | 同上；弱 pin 不得因登记被读成强绑定 |
| `answer-me-with-html`（`7acea24…`，MIT，v0.5.5） | 同上；AC-072…AC-078 | `research-port-external-skill-2026-10-19.md` §1.1（获取方式）、§1.4（许可逐字）、§1.6（pin 强度）、§6（读/取清单与 HTTP 状态） | 2026-10-19；GitHub 只读 `GET …/git/trees/main?recursive=1`（HTTP 200）与 `git ls-remote` 类只读，未安装、未执行外部代码 | 同上（P5 原 owner）；未签名标签与「其它标签未核」的事实随条保留 |

〔已改正（审查修正 E6）：旧登记只给 commit／许可与「采用边界来自可读原件」，没有章节、取回坐标（时间／工具）与删除条件，读者无法判断读数取回时点与工具、也不知道何时由谁删；依据本次审查与两件研究原件的实际章节。〕

### 作者对WR001的实际消费

| 项 | 本规格实际落点 | 依据与未观察 |
| --- | --- | --- |
| Q01 | 速读卡与材料导航只给当前读者所需入口 | 不估阅读token或真人认知收益 |
| Q02 | 条件原ref分别给原话、报告、独立验证与设计缺口 | 实施步骤留Phase，未冒已消费效果 |
| Q03 | 场景、PFACT、排除、AC各有原位置 | 追踪只指原号，不另写判据 |
| Q04 | Appendix A逐条四标签及明确未达子条件 | 可执行命令归各Task，未跑不填完成 |
| Q05 | 沿现工作包、四查、五段、只读视图用词 | 无新引领词或计数框架 |
| Q06 | FR以要得到的行为写明结果 | 受保护否定、权限和失败强度保留 |
| Q07 | 不伪答、不新进度权威与数据边界邻接相应行为 | 不是新增审批链 |
| Q08 | Appendix A独占全部122原号判据 | canonical别名不是第二份条件 |
| Q09 | 工程字段与版本只按本轮真实文件读取 | 未知Figma/viewport不填默认 |
| Q10 | D1–D7沿既有裁定压指针并保独有语义 | 没有仅凭相似/字数判无用 |
| Q11 | 旧方向、失败页和历史计数只原ref | 当前正文只给最新裁决，不粘更正链 |
| Q12 | 主干解释旅程，详细验收集中附录，Task动作留独立Phase | 122条必要分母不按长度删减；真人可用性仍待独立读回 |

编辑范围仅本spec；Appendix A采用现reader识别的加粗列表项，原号、顺序与同条四判据保持。原decision、冻结测试与历史证据只读。

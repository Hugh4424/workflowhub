# 决策日志（decision-log）

读者：build-plan 与 build-code 的材料作者。
读完要能：取到本任务的结论、写集、验收接口与指针，不读过程原件也能写出 `spec.md` 与 `phases/P<n>.md`。

**任务身份**（写作前先确认这一段）：

- 任务类型：普通任务（有实际执行目标：先诊断 card-05 真实过程缺陷，再按诊断结论修改 workflowhub 的 workflows／skills）。
- 任务 id：`workflowhub-card05-stage-defect-audit-20261012`。
- 认证工作区：`/Users/Hugh/Hugh/Project/workflowhub-workflowhub-card05-stage-defect-audit-20261012`，分支 `task/workflowhub/workflowhub-card05-stage-defect-audit-20261012`，baseline `2dcffd16`。
- 任务库根：`/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-card05-stage-defect-audit-20261012`。

**全局硬约束**（U-002，19 块共用）：不加新机制、不加新关卡、不加新账本；不引入会阻断推进的质量门，越简单越好。
**内容基准**：本主文与 `fa8fe594:specs/workflowhub-card05-stage-defect-audit-20261012/decision-log.md`（683 行／260,407 字节／sha256 `713a4a3f17ca43cb83c7b17c0d1648060c41c3df6e920b0b7cbc20960a3c0d0b`）逐项对齐；被更早的一次精炼压掉的内容已按该版本补回。
**编号唯一来源**：N1–N12、N14–N20 共 **19 块**；N13 经 U-009③ 由用户取消、编号保留占位、不实施；本材料之外的模块编号一律无效。

## 大纲地图

本节回答下游从哪里找到所需内容。

| 节 | 这一节给出什么 |
| --- | --- |
| 需求变更（U）最小索引 | 17 条需求变更（U-001…U-017）的一句话决定与落点；完整原话与「受影响决定」栏在外置件 |
| 原始需求 | 18 条 R 的索引、6 份用户手打原话逐字全文、痛点与边界、5 条会改变 build-plan 写法的事实 |
| 工作包与决定 | 4 个工作包、对抗性检查与方向审查结论、修订后大纲 |
| 模块清单 | 19 块决策（做什么／不做什么／风险／改动）＋每块的前提条件与主要风险 |
| 要改哪些文件 | 48 行写集，每行的完整改动原文与唯一 owner |
| 范围与非目标 | 4 项目标、5 项非目标、Supersedes |
| 验收面 | 23 条 AC 的用例、成功条件、失败条件、证据与负责人 |
| 未决项 | 8 条 OI 与 9 条已裁结论 |
| 风险与延期交接 | 10 项风险、处理阶段与 owner |
| 退役登记 | 4 行退役建议，决定人＝用户 |
| 外置事实索引 | 14 条到达条件，以及主文留了什么 |

完成判据：每行对应一个正文顶层节，按正文顺序排列；大纲地图自身省略。

## 需求变更（U）最小索引

本节回答每条需求变更（U）决定了什么、落在哪。**完整变更记录（含原话与「受影响决定」栏）在任务库根 `quality/evidence/decision-log-refs/requirement-change-log.md`；此处只给承重引用可解读所需的最小索引。**
**来源分类（本轮核对结论）**：17 条里 **5 条**有用户手打原件（`U-001`／`U-004`／`U-006`／`U-013`／`U-016`，原件 sha256 与字节数逐份吻合）；**10 条**是宿主提问工具的**选项文案**、非用户口述（`U-002`／`U-003`／`U-005`／`U-007` 到 `U-012`／`U-014`；材料各处一律如实写"宿主询问工具真实答复"）；**2 条**为会话内用户手打、原件在核对后补存（`U-015`＝`user-message-20261012-g.txt`，`U-017`＝`user-message-20261012-h.txt`，各带 sha256）。**没有任何一条把选项文案或主会话转述写成"用户原话"。**

编号以 `requirement-change-log.md` 实际登记的为准：**U-001 到 U-017 共 17 条**（逐条核过该件的 17 个表行，以及该件内 `U-016`／`U-017` 两个正文章节）。每行"一句话决定"结论在前；多轴 U 记录的各轴保留在同一句内，以便追到本轮 AC-C05AUD-21／22／23 的来源。

| U 编号 | 一句话决定 | 落点 |
| --- | --- | --- |
| U-001 | 追加两类现场指认缺陷（提问未走提问工具、面向用户输出带黑话与内部编号）。<br>并要求按 `ASD-STE100` 与 `ISO 24495-1:2023` 的核心思想标准化与用户的沟通过程 | R-010／R-011／R-012；N6；OI-008；AC-C05AUD-08 |
| U-002 | 验收口径＝修好后由用户另跑真实任务判定，复杂度红线＝不加新机制／新关卡／新账本 | 全局硬约束（本节上方）；N1–N20 全部；AC 全部；工作包④ |
| U-003 | 修复范围＝修根因；复盘沉淀＝给它落点 | N7；工作包② |
| U-004 | 追加 R-013 提交节奏、R-014 PR 生命周期、R-015 每 Phase 完整测试＋末 Phase 端到端验收＋verify-code 审计。<br>且先调研清楚再加 | R-013／R-014／R-015；N11／N12／N8–N10；AC-C05AUD-13／14／10–12 |
| U-005 | 提交粒度＝每 phase 一次＋verify-code 结束一次完整提交合并。<br>PR 在合并前可见。<br>末 phase 端到端验收成义务且 verify-code 逐 phase 核对。<br>测试命令真执行只记录不阻断 | N11／N12／N10／N1；AC-C05AUD-13／14／12／01 |
| U-006 | 需求不是"测试命令"，而是代码、接口、UI 的完整测试（含浏览器端到端），标准在 make-decision 与 build-plan 定、在 build-code 执行 | R-015 的"完整测试"口径；N8；AC-C05AUD-10 |
| U-007 | 模块清单通过（十五块、分四组），开工方式＝一次全做完 | 工作包②；风险表「19 块一次做完（U-007）」行 |
| U-008 | 越界处置按类别分。<br>回流按归属分流。<br>悬空要求＝删掉悬空名、对账落到现有小节 | N14／N7／N3；OI-003、OI-004（均已关闭） |
| U-009 | 测试层级不写死（各项目各任务各 phase 自定）。<br>执行者＝build-code 中的测试子代理。<br>N13 取消 | N8／N1／N13；AC-C05AUD-10／01 |
| U-010 | N8 只要求自己声明测哪些面＋理由＋每个面配一条可执行命令（工具仓库不给清单也不检查清单内容）。<br>N9 的「没跑」必须写清哪一面／卡在哪／什么条件下能跑。<br>N15 只写进写作规范、不动代码 | N8／N9／N15；AC-C05AUD-10／11／16 |
| U-011 | N12＝收尾拆两步但不阻塞、PR 链接推给用户。<br>N14＝只要求动手前显式读取并引用项目自己声明的类别。<br>N5＝现有覆盖矩阵加取值"已投递未执行"＋"登记了却没处置的项必须以缺口出现一次" | N12／N14／N5；AC-C05AUD-14／15／07 |
| U-012 | 第 9 批六条轴：回执由运行时汇总写入事实槽。<br>授权同阶段可重用。<br>新绑定只 build-code 生效。<br>未声明类别只记事实不停等。<br>测试面自查前移到 build-plan 审查。<br>PR 不阻塞但先推链接 | N1／N11／N14／N8／N10／N12 |
| U-013 | 追加 R-016 phase 文件名带工作包名、R-017 phase 数量与工作包对齐、R-018 decision-log 高度精炼＋外置＋按简明语言标准。<br>且先查根本原因 | R-016／R-017／R-018；N17／N16／N19／N20；AC-C05AUD-19／20–23 |
| U-014 | N16 形态＝扩外置＋加阈值＋记事实（其中"加阈值"部分被 U-015 作废）。<br>N17 判据＝按独立可交付、可验收划。<br>并当场精炼本材料 | N16／N17；AC-C05AUD-17／19 |
| U-015 | 否决以指标精炼：行数／文件大小／每行字节一律不作限制或驱动。<br>精炼改为内容判断。<br>U-014① 的"记事实"降级为纯观察记录 | N16；AC-C05AUD-17／18；`## 外置事实索引` 的划分判据段（来源：用户手打原件 `user-message-20261012-g.txt`，sha256 `f605890926c0…`） |
| U-016 | decision-log 只留 build-plan 要用的内容：`## 需求变更记录` 整节外置。<br>决策块改为四字段短要点形状（现场否决现版形态） | N16／N19；`## 需求变更记录` 外置到 `requirement-change-log.md`；AC-C05AUD-21／22 |
| U-017 | 按 4 处更新任务决策：重写 N16、新增 N19、新增 N20、验收标准与计数跟着改（模块 17→19 块、AC 20→23 条）。<br>覆盖矩阵逐项保持外置 | N16／N19／N20；AC-C05AUD-21／22／23；目标②计数 19（来源：用户手打原件 `user-message-20261012-h.txt`，sha256 `32376497bc58…`） |

完成判据：U-001 到 U-017 逐行有一句话决定与落点；每行结论在前；完整原话与「受影响决定」栏只在外置件，本表不复制。

## 原始需求

本节回答用户要什么、每条需求落在哪。**结论**：18 条需求（R-001…R-018）全部登记，范围采取"先诊断、范围后定"；用户手打原话 **6 份**逐字全文收录在本节，见下方「用户原话原件」。
上方 R 表是**索引**（摘要＋落点），逐字原件在下方「用户原话原件」子节就地可读；行号级索引明细外置到任务库根 `quality/evidence/raw-requirements/`，按 `## 外置事实索引` 的条件回读。

| source_id | 需求／约束 | 来源引用 | 落点 |
| --- | --- | --- | --- |
| R-001 | 20261008「技能现代化」与 20261010「技能质量回归修复」两个任务做完后，workflowhub 还是有不少问题 | 原文第 1 段 | 工作包①，诊断已完成（F-19…F-62） |
| R-002 | 最新版 workflowhub 做的 PaperBuilder CARD-05 任务，make-decision 与 build-plan 两个过程都有不少问题，最终产物质量也不太行 | 原文第 2 段 | 工作包①；F-15 到 F-31 |
| R-003 | 检查 `PB｜V3 Card05｜M` 会话（= card-05 的 make-decision 过程）与 `codex://threads/01a12b65-bbd8-7f41-b49f-b31509a07a23` 会话（= card-05 的 build-plan 过程），派子代理仔细检查都有哪些问题 | 原文第 3 段 | 9 路取证已完成；原件在 `quality/evidence/raw/` |
| R-004 | 判断这两个过程**是否符合** skill-modernization 与 skill-quality-regression 两个任务的预期 | 原文第 4 段 | F-30、F-31、F-32 |
| R-005 | 查清 stage 结尾的 **stage-reflection** 有没有做过、沉淀在哪里；按设计应当**既在 PaperBuilder 项目沉淀、也在 workflowhub 沉淀** | 原文第 5 段 | N7；U-008② 改为按归属分流 |
| R-006 | 基于两个任务的**原始需求**，派多个子代理仔细检查 card-05 过程：出现过哪些问题？**根本原因**是什么？**其他 stage 是不是也有类似的问题**？应该如何解决？ | 原文第 6 段 | 工作包①②③；第 15 路审计后重写模块清单 |
| R-007 | 按标准 WorkflowHub 执行：先创建 worktree，从 make-decision 开始，不跳阶段 | 原文第 7 段 | 已执行（`task-bootstrap` 建 worktree 与任务库；本阶段为 make-decision 全 15 步）；F-02 |
| R-008 | make-decision 过程中与用户一起梳理完整需求大纲与细节、扩散想法、实现方案、验收标准；Talk 与 grill 用**大白话**说明选项、后果和风险 | 原文第 7 段 | `## 工作包与决定` |
| R-009 | 主会话不做大量阅读和调研任务，保证主会话上下文控制与执行质量；方向审查与细节审查**各自只做一次**取得异源审查建议 | 原文第 7 段 | 方向审查已做一次，不得记为通过 |
| R-010 | **过程问题（现场指认）**：这次任务里提问**没有走 talk 方法的提问工具**，而是直接写在聊天里等用户看；card-05 里也**经常出现**同类问题 | `user-message-20261012-b.txt` 第 2 段 | 证据不支持（F-13 更正）；本任务当场复现一次 |
| R-011 | **沟通标准缺陷（现场指认）**：向用户提问时**大量带黑话、术语、内部编号**，用户看不懂；talk 方法本应规范这件事；要求按 `ASD-STE100` 与 `ISO 24495-1:2023` 简明语言标准的**核心思想标准化"与用户的沟通过程"** | `user-message-20261012-b.txt` 第 3 段 | N6；缺口登记为 OI-008 |
| R-012 | 范围决策方式：**先诊断，范围等诊断结果出来再定**（现场回答） | `user-message-20261012-b.txt` 第 1 段 | 工作包与决定 |
| R-013 | **build-code 的提交节奏**：应当"一个 phase 完成开发、测试、审查、彻底没问题了**再提交一次**"；现在是"开发完就提交、测试改完再提交、审查改完再提交"，一个 phase 来回提交太多次。实例：card-08 一个 PR 里有 **74 个提交** | `user-message-20261012-c.txt` 第 1 条 | N11；AC-C05AUD-13 |
| R-014 | **PR 生命周期偏离原设计**：原设计是 **make-decision 结束时创建 PR、verify-code 结束时关闭 PR**；现在变成"只在 verify-code 结束时创建并完成 PR" | `user-message-20261012-c.txt` 第 2 条 | N12；AC-C05AUD-14 |
| R-015 | **每 Phase 完整测试 ＋ 末 Phase 整任务端到端验收 ＋ verify-code 审计测试结果**：原设计要求每个 phase 都有完整的代码/UI 等测试，最后一个 phase 是全部功能开发完成后的**整任务端到端验收测试**，从而让 make-decision 与 build-plan 设计的验收标准在 build-code 中**被真实执行**，再由 verify-code 审计这些结果。判断任务是否彻底完成。现状：card-02／04／06／08／09 基本没做什么测试，直到 card-05 才发现大量需求与测试遗漏、系统根本没法正常运行，只能在 card-05 补大量需求与测试。要求查清**是验收标准设计的问题，还是测试验收执行的问题**，以及如何优化 | `user-message-20261012-c.txt` 第 3 条 | N8、N9、N10；AC-C05AUD-10 到 12。**结论（F-46）**：主要是执行问题，但有两处真正的设计问题放大它——(i)「末 Phase ＝ 整任务端到端验收」在 workflowhub 里**不是一条义务**（`workflows/build-plan/SKILL.md` 全文零次出现"验收 Phase"，只有 `phase-template.md:222-238` 一份"如果存在该怎么写"的格式规范，而 `verify-code/SKILL.md:18` **假设它存在** → 消费者假设、生产者无义务）；(ii) verify-code 被设计成**抽样审计**（`:18` 独立选样、`:20` 不重做全量上游测试），且校验结果在机制层被丢弃 |
| R-016 | **phase 文件名要带任务／工作包名**：每个 phase 文件名不要只叫 `P1`／`P2`，应把任务名或工作包名简短地放进文件名（例：`P1-门禁核验与开闸.md`） | `user-message-20261012-e.txt`（本轮新增，U-013） | N17；AC-C05AUD-19 |
| R-017 | **phase 数量不要太多**：应参考 make-decision 的工作包来划分，或**每个独立可交付、可验收的 task 划为一个 phase**，方便审查与测试；实例：card-05 设计了 **27 个 phase**，而 make-decision 根本没有那么多工作包 | `user-message-20261012-e.txt`（本轮新增，U-013） | N17；AC-C05AUD-19 |
| R-018 | **decision-log 要高度精炼**：不要大量过程、更正与记录导致**信息密度低**；应方便 build-plan 使用，**把对 build-plan 无影响的内容外置、正文只留指针路径**，并按 `ASD-STE100` 与 `ISO 24495-1:2023` 两个简明语言标准的核心思想优化写作。**该需求用户已提不下 10 次、一直未很好实现**，要求**检查最近的 decision-log 与 make-decision 阶段的改动，找出根本原因** | `user-message-20261012-e.txt`（本轮新增，U-013） | N16（形状）／N19／N20；AC-C05AUD-20、AC-C05AUD-21、AC-C05AUD-22、AC-C05AUD-23；根因见 F-67 |

### 用户原话原件（逐字全文，一份不漏）

本节收录用户**手打**的全部原话原件，逐字照录、未改一字；每份标注 sha256 与字节数。**判据**：build-plan 需要的"原始需求"在本节可直接逐字读到，不必先开外置件。

这些原件同时定义本材料的**写作标准来源**：R-011 与 R-018 要求按 `ASD-STE100` 与 `ISO 24495-1:2023` 简明语言标准的核心思想写作；本节自身的说明句亦按此写。

#### `user-message-20261012.txt`

- 本件提出 R-001～R-009（第一条用户消息，7 段），落点见上方 R 表。
- 定位：任务库根 `quality/evidence/raw-requirements/user-message-20261012.txt`；sha256 `e93feb8bdaa569e2850bda5a44ffaa344aa11361d0792909f3224b78b95d9af4`；**2125 字节**。
- 以下为逐字全文（引用块内为原文，一字未改）：

> 之前我做了一个“/Users/Hugh/Hugh/Project/workflowhub/specs/archive/workflowhub-skill-modernization-20261008”任务，又做了一个“/Users/Hugh/Hugh/Project/workflowhub/specs/archive/workflowhub-skill-quality-regression-20261010”任务修复之前任务的遗漏，但是两个任务做完后，workflowhub还是有不少问题。
> 刚刚用最新版的workflowhub做了一个“/Users/Hugh/Hugh/Project/PaperBuilder-paperbuilder-v3-card-05-live-activation-gate/specs/paperbuilder-v3-card-05-live-activation-gate”任务，但是make-decision和build-plan过程中都有不少问题，最终产物质量也不太行。
> 请你检查一下 @PB｜V3 Card05｜M 会话和“codex://threads/01a12b65-bbd8-7f41-b49f-b31509a07a23”会话，分别是这个新任务的make-decision和build-plan过程，需要你派出子代理仔细检查都有哪些问题。
> 以及这两个过程是否符合“skill-modernization”和“skill-quality-regression”两个任务的预期？
> 并且这个任务过程中除了这么多问题，最开始设计的stage结尾进行“stage-reflection”需要对当前阶段出现的问题进行总结和沉淀，有没有做过？沉淀的东西在哪里？按理说应该是在PaperBuilder项目里也沉淀一些问题，在workflowhub里也沉淀一些问题才合适吧。
> 我需要你基于“skill-modernization”和“skill-quality-regression”两个任务的原始需求，派出多个子代理，仔细检查新的card-05任务的过程，看看出现过哪些问题？根本原因是什么？其他stage是不是也有类似的问题？应该如何解决？
>
> 按标准 WorkflowHub 开始这个任务，先创建worktree，然后从 make-decision 开始，不要跳阶段。先基于原始需求，在make-decision的过程中和我一起仔细梳理完整需求大纲和细节、扩散想法、实现方案、验收标准，Talk 和grill请用大白话说明选项、后果和风险。注意主会话不要进行大量阅读和调研任务，保证主会话上下文控制和执行质量，方向和细节审查最好各自只进行一次获得异源审查建议即可。
>

#### `user-message-20261012-b.txt`

- 本件提出 R-010、R-011、R-012（第二条用户消息，3 段）与 U-001，落点见上方 R 表与 `requirement-change-log.md`。
- 定位：任务库根 `quality/evidence/raw-requirements/user-message-20261012-b.txt`；sha256 `dab74828204b4c489e4c4cad18b19a635617e343102423f856d6825024c52892`；**560 字节**。
- 以下为逐字全文（引用块内为原文，一字未改）：

> 先诊断再定。
> 另外。现在也是一个问题，有问题你没有使用talk技能的标准和提问工具与我沟通，而是直接写在聊天内容里等我看！这和不合适，在card-05中也经常出现这种问题！
> 另外，你和我提问时，总是带各种黑话、术语、内部ID，我经常看不懂你的问题到底是什么意思。按理说talk技能里面应该规范了相关标准才对，应该按照“ASD-STE100”和“ISO 24495-1:2023 简明语言标准”两个标准的核心思想来标准化和我的沟通过程！
>

#### `user-message-20261012-c.txt`

- 本件提出 R-013、R-014、R-015（第三条用户消息，三项）与 U-004，落点见上方 R 表与 `requirement-change-log.md`。
- 定位：任务库根 `quality/evidence/raw-requirements/user-message-20261012-c.txt`；sha256 `b1a5b9f285984c9135996f43bf73da5fe85fc7a9a38dbaa802f29f432f9f6a22`；**1478 字节**。
- 以下为逐字全文（引用块内为原文，一字未改）：

> 还有其他问题需要调研后加到当前任务中：
> 1：在build-code阶段，应该是一个phase完成开发、测试、审查之后，彻底没问题了再提交吧，现在是一个phase开发完成就提交，测试完成改完再提交，审查完成改完再提交，一个phase来来回回提交太多次了！card-08一个PR里面有74个提交，太离谱了！（https://github.com/Hugh4424/PaperBuilder/pull/2）
> 2：我们最开始设计的时候是make-decision结束的时候创建PR，verify-code结束的时候close这个pr，现在好像根本不是这样，现在只会在verify-code结束的时候创建并完成这个pr，也不太合适。
> 3：我们原来设计过，每个phase都应该有完整的代码、UI等完整测试，并且最后一个phase是所有功能都开发完成的整个任务的端到端验收测试，从而保证在make-decision和build-plan设计的验收标准，能在build-code中真实测试执行验收。在verify-code阶段检查并审计这些测试结果，从而判断任务是是否彻底完成。但是现在这些测试执行的也很不好，我做card-02、04、06、08、09等任务基本都没做什么测试，在做card-05的时候才发现大量需求和测试遗漏，导致整个系统根本没法正常运行，只能在card-05补充大量需求来填补、测试这些缺口。这也需要你来检查看看，是验收标准设计的问题，还是测试验收执行的问题？应该如何优化？
>

#### `user-message-20261012-d.txt`

- 本件为 U-006（本轮把需求缩小的当场纠正），对应 R-015 的"完整测试"口径，落点见 `requirement-change-log.md` 与 R-015。
- 定位：任务库根 `quality/evidence/raw-requirements/user-message-20261012-d.txt`；sha256 `7b908b64822993bc02df751808813a0e804565e45cf1cf48fdbed883f785c3da`；**376 字节**。
- 以下为逐字全文（引用块内为原文，一字未改）：

> 你说“测试命令＝真的执行，但只记录事实、不阻断。”，可是我的原始需求不仅是测试命令啊，是代码、接口、UI的完整测试，包括浏览器端到端测试，这些测试标准应该在make-decision和build-plan确定下来，在build-code正确执行。
> 你现在一直说的都是测试命令，我说的主要是完整测试！
>

#### `user-message-20261012-e.txt`

- 本件提出 R-016、R-017、R-018（本条用户消息，三项）与 U-013，落点见上方 R 表、N16／N17 与 `requirement-change-log.md`。
- 定位：任务库根 `quality/evidence/raw-requirements/user-message-20261012-e.txt`；sha256 `2157c4fff6f2f0da447f512c2e824f5bef1751f7e94851ad06a78da99b882cbe`；**1302 字节**。
- 以下为逐字全文（引用块内为原文，一字未改）：

> 我希望再加一些小需求：
> 1：未来build-plan设计phase文件时，每个phase文件名不要仅仅叫做P1、P2，可以把任务名或工作包名简短的放在文件名中，比如P1- 门禁核验与开闸.md 这种；
> 2：build-plan时，不要搞太多phase了，应该参考make-decision中的工作包来分配或每个独立可交付、验收的task，划分为一个phase，这样比较方便审查和测试，card-05设计了27个phase了太离谱了，make-decision时分明没有这么多工作包，这么多phase开发、测试审查都不方便；
> 3：make-decision产生的decision-log文件不要有那么多的过程、更正和记录，导致信息密度太低了！原来说过，decision-log的结果应该是高度精炼，方便后续build-plan使用的。现在的decision-log有大量过程、更正和记录，文件写法也没有使用“ASD-STE100”和“ISO 24495-1:2023 简明语言标准”两个标准的核心思想来优化。这个需求我说过不下10次了，一直没有很好的实现。导致现在的decision-log还是有点太啰嗦了，没有把那些对build-plan没什么影响的文件外置，只放指针路径在decision-log中。需要你检查最近的decision-log，以及make-decision阶段的改动，看看根本原因是什么。
>

#### `user-message-20261012-f.txt`

- 本件为 U-016（对现版 decision-log 形态的当场否决），落点见 N16／N19 与 `requirement-change-log.md`。
- 定位：任务库根 `quality/evidence/raw-requirements/user-message-20261012-f.txt`；sha256 `8a613dff2efba9c177d9d9ab2e4b216026e41e8dde179d7b60c2383db4f41897`；**594 字节**。
- 以下为逐字全文（引用块内为原文，一字未改）：

> 这个decision-log是用来给build-plan阶段使用的，所有build-plan要用到的所有内容都应该在decision-log里面，你不能把所有内容都外置啊，而且目前的decision-log里面的需求变更记录应该外置啊，这也属于流程记录内容。
> 还有，现在每一个决策五个字段也太啰嗦了，完全不符合“ASD-STE100”和“ISO 24495-1:2023 简明语言标准”两个标准啊。
> 每个决策不但啰嗦，而且信息松散，没有结构化，完全无法阅读。
> 请仔细检查根本原因！现在的decision-log还是不及格版本！
>

### 用户痛点、旅程与成功／失败边界（step 1）

- **痛点**：用户连续三轮（现代化 → 质量回归修复 → 真实使用）投入，仍然在使用最新版时看到「过程问题多、产物质量不行」。痛点是**修复不收敛**，不是单点 bug。
- **完整旅程**：用户在宿主项目上跑真实任务 → 用 workflowhub 的 make-decision 与 build-plan → 过程中反复纠正执行者 → 最终产物仍需多轮返工 → 用户回到工具仓库问「到底哪里坏了、为什么修了还坏」。
- **成功边界**：能指名具体哪一步、哪条判据失效；能给出**可核查的根因**；结论对其他 stage 有可验证的适用范围；修复方案不把仓库改复杂。
- **失败边界**：只罗列现象不给根因；把「执行者不听话」当唯一根因；未经取证就断言「符合／不符合预期」；修复引入新的机制／门／账本。

### 模糊需求的候选角度（已在 step 2–5 收敛）

- 「workflowhub 还是有不少问题」有三个读法：①过程方法文本有缺陷；②运行时校验器／工具有缺陷；③执行者纪律问题。**收敛结果**：三者都存在，但主因是③（已投递未执行），②表现为「算了结果没人读」，①表现为一处判据无定义处。
- 「应该如何解决」有两个读法：①本次全部修掉；②只诊断。**收敛结果**：U-003① 选「修根因」。
- 「沉淀到两个仓库」有两个读法：①沉淀问题条目；②沉淀规范知识。**收敛结果**：U-008② 按**归属分流**（别的项目的问题记在别的项目里、工具仓库的问题记在工具仓库根）。

`### 已知事实（68 条）`、`### 假设（H-01…H-03 与推翻依据）` 与更正、过程记录外置到 `facts-index.md`。

**H-02 的最终判定（第 9 路裁决后）**：**部分推翻**——五组关键要求中**四组是「已投递、已读懂、就是不交」**（不是判据不可执行），仅「未落项与处置」那组判为判据不可执行。故根因排序改为「执行者未交为主因」。

**会改变 build-plan 写法的 5 条关键事实**：

1. 决定块标题写作 `#### N1 — …`，此前不匹配 `check-decision-log-chain.mjs` 认的 `ADR-NNN` 形状，该检查器对本材料 `recognized_blocks = 0` 且恒定 exit 0（F-67）。**该检查器由 N20 承接修改**（认当前写法，并加"引用自洽／结构存在性"两项非长度检查），build-plan 规划改动时须以 N20 的改动栏为准。
2. 阶段卡里声明的 `gate_cmd` 全仓没有执行者；`ac_coverage` 与 `command_oracle_checks` 已算出但生产侧从不读（F-49）。
3. `facts.jsonl` 的 `evidence` 槽生产侧零 writer（唯一写方写 `null`），形状已由 `runtime/task/task-store.mjs:87` 定义为 `[{command, exit_code, failure_signature}]`（F-61）。
4. "末 Phase ＝ 整任务端到端验收"不是 workflowhub 的义务：消费者（verify-code）假设它存在，生产者（build-plan）零义务（F-46）。
5. 授权绑 HEAD 使每次提交作废旧授权；实测 card-08 有 58 条 authorize-commit 与 58 条 consumed-commit、57 个不同 `head`（F-41）。

完成判据（本条 2026-10-12 按 F-5 用户裁定改写）：**每条用户原话都能在主文里逐字读到，且能对应到 R／U 编号**；未逐字收录的必须写明为什么。未逐字收录的只有**通过宿主提问工具取得的答复**（U-002／U-003／U-005／U-007…U-012、U-014、U-015、U-017）——其逐字内容是**选项文案、不是用户手打**，不伪装成用户原话，仍按现有办法外置在 `requirement-change-log.md`，主文 R 表／外置索引留指针。
每条真实需求有来源与落点；缺来源逐项写明；行号级索引明细按 `## 外置事实索引` 的条件回读。

## 工作包与决定

本节回答要交付什么、失败后由谁处理。**结论**：四个工作包；主因判定＝"要求已读到却不交、且没有东西接住没交"。

### 修订后大纲（outline-revision-check，第 4 步）

初版大纲（step 2 摆给用户的五个工作包）经第 3 步九路取证后修订：① 诊断（已完成，只读）；② 扩散 → **③ 复核＋其他 stage，且必须先复核判据**；③ 沉淀 → **并入 ② 的 N7**；④ 修复 → **② 修复根因**；⑤ 交付 → **④ 交付与验收**。
**推翻了什么**：初版把根因排成「投递缺口优先」。九路取证＋裁决后改为：**主因是「要求已读到却不交、且没有东西接住没交」**；投递缺口降为并列项。

### 对抗性方向检查（第 6 步，不设否决权，只出有源风险清单）

17 条风险 ＋ 5 条 Kill 判据 ＋ 7 条 Recycle 判据，逐条有来源。**其中两条直接推翻本方向自己的前提**：**R6**（「workflowhub 永远收不到沉淀」是错的——本任务的目标项目根就是 workflowhub，真实缺口是**消费者项目场景**）；**R4**（「平台没有投递通路」不准确——有一条声明式通路且它是坏的）。另 **R7**（「看得见就会改」有反证）、**R1**（M1 四项缺因果链，已拆为 a/b）、**R14**（纯删「未落项」会丢对账）、**R9/R10/R11**（更小路径）均已处置。**K4 部分触发**——属**改修法而非停任务**。逐条处置外置到 `direction-review-dispositions.md`。

### 方向审查（第 7 步，wh-review，异源，只做一次）

- **调用**：`review --action=record --stage=make-decision`，方向轨只送三样必填，**未送任何禁字段**。
- **原件**：任务库 `quality/reviews/2026-10-12-005-make-decision-direction.json`（56,764 B）。
- **真实执行事实（不得记为通过）**：`status=available-with-failures`、`pair_status=partial`、`red_incomplete` 与 `blue_incomplete` **均为 true**；`kimi/coding` 与 `codex/luna` 两角色 completed，`antigravity/flash` **两角色均 failed**；运行时自报 `REVIEW_NO_SEMANTIC_RESULT`（「无任何语义结果」）**却同时返回 11 条 findings**；`material_coverage` 三个 provider 的 `read` 全空。**这本身又是一例同族缺陷**（自报与载荷矛盾）。
- **11 条发现逐条处置：accept 10、accept-with-modification 1、reject 0**。要点：M1 增加最小机械验证；被拒选项补理由；「未落项」只有保留并定义后才可进 M3；M4 须指明 workflowhub 现有 `Improvements.md` 是不是目的地；删除无定义口径与模板加节的分支取「删名不删义务」；M3 围绕现有依赖与自取路径。
- **交叉印证**：对抗性检查与异源审查**各自独立**指出「M1 前提未实测」「M4 落点未定义」「M2 与 M3 耦合」。

### 工作包 ① — 诊断（已完成，只读）

- **要交付什么**：取证原件 ＋ 合并诊断；消费者为工作包②③ 的方案设计与用户判定。
- **结果**：已知事实表 F-01…F-68 与三份审计（第 3／4／6／7／15 路）。

失败了怎么退：取证原件不可读或行号漂移时回会话日志重取；两路矛盾时**另派独立裁决**，不以其中一方为准。

### 工作包 ② — 修复根因

- **要交付什么**：**19 块**具名修复（N1–N12、N14–N20；**N13 经 U-009③ 由用户取消，编号保留占位、不实施**）；消费者为**下一个真实任务**（用户实跑判定）。
- **硬约束**（U-002）：不加新机制、不加新关卡、不加新账本；不引入会阻断推进的质量门。
- **细化顺序**：N2 → N1 → N6 → N5 → N4 → N8 → N9 → N10 → N11 → N12 → N14 → N15 → N3 → N7 → N16 → N17 → N18 → N19 → N20。
- **grill 交互裁决（第 11 步真实交互轮，U-012）**：六条轴＝回执由运行时汇总写入事实槽（执行者只留原始输出）／授权同阶段可重用／新绑定只 build-code 生效／未声明类别只记事实不停等／测试面自查前移到 build-plan 审查／PR 不阻塞但先推链接。**其中 U-012① 带一条实现约束**：写集内该处改动＝汇总写入 ＋ **防回落**（防止该槽被覆盖回 `null`）。逐条原文按 `grill-draft-and-challenges.md` 回读。

失败了怎么退：任一模块若被证明会引入事实上的门或新账本，**回退该模块并如实登记**，不整体停摆。

### 工作包 ③ — 复核跨阶段清单（＝N2）

- **要交付什么**：用**裁决后的正确判据**重判第 6 路那份跨阶段清单，产出「真正成立的通病清单 ＋ 被误判清单」。**仓库内写集为空**（只产出结论表）。
- **决定**：**先复核，再开修**；不复核就不动其他 stage。

失败了怎么退：复核无法定论时只登记「未确认」，不改文本。

### 工作包 ④ — 交付与验收

- **要交付什么**：修好的仓库 ＋ 材料 ＋ 交接；消费者为**用户**。
- **决定**：本次任务内**不自判修好**；验收由用户另跑一个真实任务判定（U-002）。

失败了怎么退：用户实跑仍复现同类问题时，按新的取证重开诊断，不辩解既有结论。

完成判据：每个工作包有结果、消费者与具名失败恢复路径；19 块决定全文见 `## 模块清单`。

## 模块清单

本节回答改哪些模块、每块做什么。每块固定 **4 个字段**：**做什么**、**不做什么**（只写真正会拦人的边界）、**风险**、**改动**（文件路径加行号）。
每个字段内**一条要点只讲一件事**。一个字段需要讲多件事时，用**子要点**（`  - `）逐条列，每条仍只讲一件事。**每条要点第一句即结论**，依据、边界与例外写在结论之后。
这条规则对 **76 个字段行本身**（19 块 × 4 字段）同样生效：每个字段行自带一句**字段级结论句**，不留只有标签、没有内容的字段行。

### N1 把已算出却被丢掉的校验结果接到边界，并让 Phase 声明的命令真跑

- **做什么**：把生产侧已算出却不被读取的校验结果接到边界。
  - 把生产侧不读的校验结果做成只读事实：`contract_ok`／`contract_error_count`／`ac_coverage`／`fr_coverage`／`command_oracle_checks`。
  - 让 Phase 卡声明的 `RED/GREEN gate_cmd` 与 Phase 级 `gate_cmd` 按字面真跑。
  - 把执行回执落 `quality/tests/`。
  - 把执行汇总写进已有 `evidence` 槽。
  - 写入方＝运行时**汇总写入 ＋ 防回落**（U-012①）。
  - 执行者＝build-code 中的测试子代理。
  - 全程只记录事实、不阻断。
- **不做什么**：不新增检查器或命令。
  - 不让 `parsed.errors` 进 `run-checks.mjs:143-148` 的 failures。
  - 明文禁止从 Phase 文本自动抓命令去跑。
  - 5 个检查器只登记"不接线＋理由"。
- **风险**：事实块与 `evidence` 槽都可能被误读为"通过"。
  - `stage-runtime.mjs:540` 的抛错条件与 `:539` 的过滤行为都不动。
  - `npm run check` 本身 exit 1，改后须显式跑 `npm run test:contract`。
- **改动**：`tools/cli/stage-runtime.mjs:533-545`（只插只读事实块，并入 `:576-579` 的 `source`）、`:866`（`evidence` 槽最小落盘）、`:827`、`:843`、`workflows/build-code/SKILL.md:29`、`skills/wh-review/scripts/simple-review-runner.mjs:1882`。

### N2 用正确判据复核跨阶段清单，只产结论表

- **做什么**：只产结论表——用正确判据重判跨阶段清单。
  - 判据取 `raw/09-criteria-adjudication.md` 的 U 口径。
  - 重判对象是 `raw/06-cross-stage-defect-audit.md` 的七类命中 C1 到 C7。
  - 逐类给出判据原文的 `文件:行号`。
  - 逐类给出 U 口径复核。
  - 逐类给出结论，取值 ∈ {U1,U2,U3,U4,未确认}。
  - 逐类给出挂钩哪个 N 模块。
  - 产出成立的通病清单。
  - 产出被误判清单。
  - 两张表写进 build-plan 的 `spec.md` 与 `phases/P<n>.md`。
- **不做什么**：不改任何 stage 文本。
  - 不做成新检查器。
  - 不等 OI-001／OI-002 全定再复核。
  - 六类不得一刀切。
- **风险**：每条依据须写本次实测行号并注明"以本次实测为准"——行号会漂移。
  - 复核可能被读成站队。
  - 每条结论要同时写"06 对的部分"与"06 错的部分"。
  - 通病若成立，修复面显著扩大，须回头与用户再确认范围。
- **改动**：无（仓库内写集＝空）
  - 只读 `workflows/{make-decision,build-plan,build-code,verify-code,build-prd}/SKILL.md`、五份 `workflows/*/steps.json`、`skills/stage-handoff/SKILL.md:38`。

### N3 删掉没有定义处的义务名，把对账落回现有小节

- **做什么**：删掉没有定义处的义务名。
  - 把 `workflows/make-decision/SKILL.md:41` 点名的"模块清单／写集表／未落项"解析为模板真实节名：`## 工作包与决定`、`## 要改哪些文件`、覆盖矩阵「落点或缺口」栏。
  - 在 `skills/decision-log/templates/decision-log-template.md:107` 追加穷尽义务（保留原句逐字）。
  - 在 `skills/decision-log/SKILL.md:64` 追加一句"没有落点不另建节"。
  - 缺口是合法取值——填不满时允许写"缺口"，不逼人编。
- **不做什么**：不新增任何承载结构。
  - 不新增节。
  - 不新增列。
  - 不新增账本。
  - 不改 `skills/decision-log/SKILL.md:34` 的"十二节"。
- **风险**：可能变成"多填一栏"的形式主义。
  - 只删不落会丢掉真实对账。
- **改动**：`workflows/make-decision/SKILL.md:41`（同一物理行）、`skills/decision-log/templates/decision-log-template.md:107`、`skills/decision-log/SKILL.md:64`。

### N4 让编号、计数、引用只有一个写者，并给漏掉的需求留签名

- **做什么**：让编号、计数与引用只有一个写者。
  - 在 `skills/decision-log/SKILL.md:62` 追加"任何计数与编号引用只写一次"。
  - 在 `skills/spec-specify/SKILL.md:72` 行尾追加"下游引用不再复述位数规则"。
  - 在 `skills/decision-log/templates/decision-log-template.md:101` 定义"需求遗漏签名"：出现却没落点的编号按缺口如实登记。
- **不做什么**：不新建编号权威。
  - 零新增字段。
  - 零新增文件。
  - 零新增校验器。
  - 零新增账本。
  - 不改 `runtime/stage/stage-content-contracts.mjs:455,481,597,619` 的正则。
- **风险**：`FR-1` 与 `FR-001` 的混用口径继续产出。
  - 该混用已登记为"不处理＋理由"。
  - 改动若被读成"每个数字都要标出处"，就只保留前两条并登记误读，不加解释性新节。
- **改动**：`skills/spec-specify/SKILL.md:72`、`skills/decision-log/SKILL.md:62`、`skills/decision-log/templates/decision-log-template.md:101`。

### N5 接住没交的项，并让"登记了却没处置"出现一次

- **做什么**：让没交的项被接住。
  - 在 `skills/decision-log/templates/decision-log-template.md:101` 的覆盖矩阵加一个取值**已投递未执行**。
  - 要求"登记了却没处置的项必须以缺口出现一次"。
- **不做什么**：不新增任何承载结构。
  - 不新增字段。
  - 不新增表。
  - 不新增台账。
  - 矩阵为空不判完成不成立。
  - 不改 `workflows/make-decision/SKILL.md:41` 与 `skills/decision-log/SKILL.md:64`
  - 本模块不碰 `tools/cli/check-decision-log-chain.mjs`。
  - 该文件在本块只登记为未决项。
  - 它的改动归 N20（见 `## 要改哪些文件` 第 33 行）。
- **风险**：最大风险是形式主义（本模块承认文本消不掉它）。
  - 按下一次真实任务测量。
  - 若"填了但没减少漏处置"，即为回退依据。
  - 可观察计数能否下降是**本批最关键的未确认项**（UN-A2-6）。
- **改动**：`skills/decision-log/templates/decision-log-template.md:101`（与 N3、N4 同一物理行，合并为一次编辑，单一 writer＝N3）。

### N6 让关键要求在用到它的那一刻仍在眼前

- **做什么**：让关键要求在用到它的那一刻仍在眼前。
  - 把 `workflows/make-decision/SKILL.md:32` 的条件读取改为在写 `## 需求变更记录` 或 `## 未决项` **之前**读取。
  - 在调用点原地保留三行最小指针。
  - U 行＝编号＋变更与处置＋原文锚点＋受影响决定。
  - OI 行＝问题与来源＋状态与真实处置＋解决者下一步。
  - coverage audit 行＝逐项有落点或有用户真实选择的排除理由（权威仍在原 owner）。
  - 把大白话单轴决策卡从"只在 `skill-deps.yaml` 声明"提到入口正文。
  - 把问答工具 IO 契约同样提到入口正文。
- **不做什么**：不整份无条件读入 `skills/decision-log/SKILL.md` 与 `skills/talk-with-zhipeng/SKILL.md`。
  - 不把正文复制进入口。
  - 不改 `.codex/hooks.json` 与 `workflows/make-decision/SKILL.md:42`。
- **风险**：指针被读到、条件也满足、目标仍零读取时，回退本模块并如实登记。
  - "读进正文后仍被压缩淘汰"这一半只能缓解、不能根治。
  - "看得见≠会做"的反证由 N5 承接。
- **改动**：`workflows/make-decision/SKILL.md:32`、`workflows/make-decision/steps.json`（step 1 的 `observable_result`）。

### N7 让阶段末没做复盘这件事必须留一句，并让问题按归属回流

- **做什么**：让"复盘未执行"必须在阶段末交接里留一句。
  - 在 `skills/stage-handoff/SKILL.md:44` 之后、`:50` 之前新增一句。
  - 这句要求：复盘未执行必须在交接写明"本轮未执行"加一句真实原因。
  - 未写明时，按 `## 回读结果`（`:36-42`）的 incomplete 处理。
  - 在 `skills/stage-reflection/SKILL.md:15` 加"未执行时同样要说明"。
  - 在 `skills/stage-reflection/SKILL.md:24` 加回流动作：别的项目的问题记在别的项目里，workflowhub 的问题记在工具仓库根 `Improvements.md`。
- **不做什么**：不新增任何承载结构（节／字段／机器校验）。
  - 不改五个 `workflows/*/steps.json`。
  - 不改 `Improvements.md:5`。
  - 不改 `docs/standard-workflow.md`
  - 不把回流写成"每任务必须写"。
  - 不把该句接进 `run-checks`。
- **风险**：这句最接近门。
  - 它只能被回读结果判为 incomplete。
  - 不得写成 failed。
  - 不得阻止同任务继续修复。
  - 连续 ≥3 个阶段理由逐字重复时收窄为"仅在阶段真结束时说明"，不加码。
- **改动**：`skills/stage-handoff/SKILL.md:44-49`、`skills/stage-reflection/SKILL.md:15`、`:24`。

### N8 让测试标准在 make-decision 与 build-plan 成为真义务

- **做什么**：让测试标准在 make-decision 与 build-plan 成为真义务。
  - 测试层级不写死，由每个项目每个任务每个 phase 自己定。
  - 每个任务与每张 Phase 卡自己声明"这次测哪些面 ＋ 每面测或不测的理由"。
  - 每个要测的面配一条可执行命令。
  - 把"测试面是否合适"的自查**前移到 build-plan 的 Phase 审查**（U-012⑤）。
- **不做什么**：工具仓库不提供也不检查清单内容。
  - 不新增字段。
  - 不新增枚举。
  - 不让 `routing_tier` 新增机器消费者。
  - 不把命令写进 AC。
  - 不再把测试面自查留到 verify-code（U-012⑤）。
  - 不改 `runtime/stage/stage-content-contracts.mjs:470-479` 与 `tools/cli/run-checks.mjs`。
- **风险**：新枚举可能经 N1 的接线变成事实上的门。
  - 须在 N1 接线范围（OI-005）明示"层级与命令字段的校验结果只作事实浮现，不作 Phase 推进前置"。
  - verify-code 只作二级核对、不复述自查。
  - 历史 Phase 材料不追改。
- **改动**：`skills/spec-plan/templates/phase-template.md:203`、`:249`、`:132`、`:208-212`、`skills/spec-plan/SKILL.md:49-57`、`:65-71`、`skills/spec-specify/SKILL.md:18-20`、`skills/spec-specify/templates/spec-template.md:218-223`、`skills/test-routing-advisor/SKILL.md:16-18`、`workflows/make-decision/SKILL.md:29`、`workflows/build-plan/SKILL.md:21`。

### N9 让 build-code 按声明的面真跑，并堵住两个逃逸口

- **做什么**：由 build-code 中的测试子代理逐面真跑，每面留下原命令、cwd、argv、exit、原始输出。
  - 写 `unavailable` 或 `incomplete` 时必须写清哪一面、卡在哪、什么条件下能跑。
  - 涉及浏览器可见行为时必须实际执行 `skills/isolated-browser-qa/SKILL.md`。
  - 把 engine、route／场景、截图路径或真实 `not_observed` 理由留在原 ref。
- **不做什么**：只跑受影响面，不用无范围全量回归代替。
  - `N/A — 理由` 只在声明写集不含任何浏览器可见面时可用。
  - 判据是声明写集，不是执行者的感觉。
  - 不给 build-code 加 `runtime_capabilities` 条目。
  - 不写死任何具体仓的历史脚本路径。
- **风险**：必须把写死的 `node tests/acceptance/card-09-session-ledger.mjs` 改为通用说法。
  - 它在任何宿主项目都不存在。
  - 改写只去具体仓路径，同一步的其余措辞保持逐字。
  - 逐面真跑会显著拉长 build-code 时长。
  - 自拟 `trigger` 名无既有惯例可对照（UN-B-2 同族）。
- **改动**：`workflows/build-code/skill-deps.yaml`、`workflows/verify-code/skill-deps.yaml`、`skills/catalog.yaml:807`、`workflows/build-code/SKILL.md:29`、`:30-31`、`:32`、`:36-37`、`workflows/build-code/steps.json`（step 5／6）、`workflows/verify-code/SKILL.md:22`。

### N10 让末 Phase 做整任务端到端验收，并让 verify-code 逐 phase 核对

- **做什么**：让"末 Phase ＝ 整任务端到端验收"成为义务。
  - 本任务必须有一个末 Phase 作整任务端到端验收 Phase。
  - 该 Phase 的契约头列出全部 AC。
  - 该 Phase 的 `Done` 逐条给 AC 编号加档位加一条具名证据路径。
  - verify-code 从抽样改为逐 phase 穷尽核对测试执行。
  - 逐 phase 写一行"Phase｜声明的面｜执行原件（路径与 exit）｜未跑的面与理由"。
- **不做什么**：只读 `quality/tests/` 既有原件、不重跑。
  - 不把 `semantic_test_adequacy` 改成分 phase 给值。
  - 不新建 schema。
  - 不新建独立的报告文件类型。
  - 不改 `runtime/stage/stage-content-contracts.mjs:611-613`。
- **风险**：本模块与"不加新关卡"红线的张力最大。
  - 末 Phase 义务与逐 phase 核对只写进 `skills/spec-plan/SKILL.md`、`phase-template.md:222-238` 与 `workflows/verify-code/SKILL.md:18`。
  - 这两项不进校验器。
  - verify-code 的"incomplete 不限制同任务继续修复"一句改后必须逐字仍在。
  - 适用范围仅当任务含可执行产物时必选。
    - 纯文档／工作流规范类任务可声明豁免并给具名理由（见 AC-C05AUD-12①）。
- **改动**：`workflows/verify-code/SKILL.md:18`、`:20`、`:22`、`workflows/verify-code/steps.json`（step 4）、`skills/spec-plan/SKILL.md:49-57`、`:65-71`、`skills/spec-plan/templates/phase-template.md:222-238`、`workflows/build-plan/SKILL.md:21`。

### N11 补回提交粒度的正面条款，并把授权粒度改成绑分支加阶段

- **做什么**：补回提交粒度的正面条款。
  - 一个 Phase 的实施、测试、独立审查与 finding 修复全部完成后，在本 Phase 提交一次。
  - 审查在提交前进行。
  - verify-code 结束时做一次完整的全部提交与合并。
  - 把授权改绑分支加阶段。
  - 同一阶段内一份授权可重用。
  - 把"用了几次、每次 HEAD"写进确认件。
- **不做什么**：不新增任何提交控制面。
  - 不新增提交门。
  - 不新增提交账本。
  - 不新增 `kind: commit` 完成证据。
  - 授权不只绑分支。
  - 该绑定只在 build-code 生效，其他阶段不传参数时仍走旧的 HEAD 严格相等。
  - 不给 push／merge／pr 做 phase 绑定。
  - 不改 `core/task-close.mjs:648-678`。
- **风险**：授权放宽后，误判风险最大。
  - 只有 `record` 显式写了 `phase` 才走宽松路径。
  - `consume` 收到带 `phase` 的授权时报 `AUTH_SCOPE`。
  - 旧记录路径逐字不变。
  - 已发生的误判只写清事实，不加补偿机制。
  - `phase` 值在 `stage-runtime.mjs` 的具体插入点未逐行定（UN-C-7）。
- **改动**：`workflows/build-code/SKILL.md:74`、`docs/standard-workflow.md:11`、`workflows/verify-code/SKILL.md:42`、`runtime/interface/git-authorize.mjs:539-551`、`:606-608`、`:553`、`tools/cli/stage-runtime.mjs:1047`、`:1121-1128`、`tests/contract/narrow-tool-git-authorize.test.mjs:89-97`、`tests/contract/close-authorization-diagnostics.test.mjs:19`。

### N12 让 PR 在合并前可见：收尾拆两步但不阻塞

- **做什么**：让 PR 在合并前可见。
  - 给 `core/task-close.mjs:603` 的 `executeClosePlan` 新增可选入参 `until`。
  - 传了 `until` 且某步骤完成后等于它就跳出，并返回 `{status:"partial", stopped_at, records, physical}`。
  - 默认形态不设停等。
  - 同一次执行流内先建 PR、把链接推给用户、再合并。
- **不做什么**：不真停等用户回话。
  - 不新增第二次确认。
  - 不新增 close 子命令。
  - 不拆成两份 plan。
  - 不授权 `merge` 让第一段报错停下。
  - 不新增持久状态。
- **风险**：改的是所有任务共享的收尾核心，但默认行为不变。
  - 与"仅最终 close 确认一次"须对齐。
  - `gh` 不可用时 `pr.status` 为 `unavailable`、plan 走五步。
  - 退路不改。
  - 停在 `partial` 的任务靠既有重放继续，不需要回滚。
- **改动**：`core/task-close.mjs:603`、`:605`、`:688-812`、`tools/cli/task-close.mjs:18`、`:19`、`:44`、`workflows/verify-code/SKILL.md:44`、`docs/standard-workflow.md:11`、`tests/close/close-contract.test.mjs:91`。

### N14 动手前读项目自己声明的受保护类别，越界即停

- **做什么**：动手前读项目自己声明的受保护类别。
  - 改动受保护面（引擎、DSL、数据库与迁移、既有通过测试、外部契约）之前，先显式读取并引用**该项目自己声明**的类别。
  - 再按授权原文核对"是否包含该改动"。
  - 按授权原文核对"是否超出声明写集"。
  - 两项核对各存一份原件。
  - 越界或授权未含的停下该处、继续其它安全部分。
  - build-plan 规划版同一条在材料里保持 pending，并写明待哪一条确认。
- **不做什么**：工具仓库不定义类别清单。
  - 不给授权记录新增 `scope` 字段。
  - 不给授权记录加校验器。
  - 不把"受保护面"做成清单文件。
  - 不新增审批门。
- **风险**：本块与"不增审批门"的张力最大。
  - 它只对超出声明写集或授权原文未含的改动生效，且不阻止继续其它安全部分。
  - 若被用户判成门，按备用写法降级为「继续实施，并在材料最显著处登记未获确认」。
- **改动**：`workflows/build-code/SKILL.md:27`、`workflows/build-plan/SKILL.md`（规划段，行号未定位）。

### N15 把编辑安全网写进写作规范，不动代码

- **做什么**：把编辑安全网写进写作规范。
  - 在 `skills/spec-specify/SKILL.md` 的「技能写作规范（WR001）」节（`:140-158`）增一条。
  - 锚点只用该文件唯一的原文串。
  - 替换不得跨过小节标题行（`^#{1,6} `）。
  - 改完逐条核对原有小节标题是否逐字仍在。
- **不做什么**：不改 `runtime/interface/safe-write.mjs`。
  - 不新增任何运行时拦截器。
    - 不新增运行时函数。
    - 不新增 CLI 工具。
    - 不新增 pre-hook。
  - 不挂进 `npm run check`。
- **风险**：收益完全依赖执行者自觉，这是 U-010③ 取舍的直接代价。
  - 标题丢失时只恢复被损坏的那一处，不对整份文件做 `git checkout`。
  - 同类事故本会话已发生 6 次（F-63，5 条提交号可核）。
- **改动**：`skills/spec-specify/SKILL.md:140-158`（只新增一条，与 N8 的 `:18-20` 按节切分）。

### N16 给决策块定形状，并消除同一结论存两遍

- **做什么**：给决策块定形状。
  - 在模板里写死决策块的**形状**：每块固定 **4 个字段**（做什么／不做什么／风险／改动），字段数固定即 4。
  - 不规定"每块恰好 4 条要点"。
  - 规定每个字段内一条要点只讲一件事。
  - 规定一个字段需要讲多件事时用子要点（`  - `）逐条列，每条仍只讲一件事。
  - 每条要点第一句即结论。
  - 把标题写成能读懂的目标句。
  - 在模板里写死**每个字段各管什么**，治"同一件事在五处各写一遍"。
  - 补一个**结构化示例**供模仿。
  - 消除"同一份结论既在主文、又在外置件"的**双份存储**。
  - 本块自身即按此形状写作，是当场证据。
- **不做什么**：不设任何长度或评分控制面（长度上限／字数门／评分器，`docs/adr/0037:20` 明文否掉）。
  - 不新增检查器（检查接在 N20 修的那个既有检查器上）。
  - 不再把"精炼／外置"写成散文要求（已失败 9 次）。
- **风险**：形状规定不是门——检查结果只报事实、不改变推进。
  - `tools/cli/run-checks.mjs:146-147` 逐字不入 `failures`，故物理上不卡推进。
  - `tools/cli/check-decision-log-chain.mjs` 的 `main()` 恒 `return 0`，同样不卡推进。
  - 形状规定若又写成散文要求，就会退回原状（`skills/decision-log/SKILL.md:79` 自认"不是质量门"）。
  - 改模板影响**所有任务**的 decision-log 形态。
- **改动**：`skills/decision-log/templates/decision-log-template.md:65`／`:69`、`skills/decision-log/SKILL.md`。

### N17 让 phase 文件名带工作包名，并让 phase 数量按可交付物划

- **做什么**：让 phase 文件名带工作包名。
  - 本模块定 phase 数量的划法。
  - phase 文件名形如 `P<n>-<任务或工作包短名>.md`。
  - phase 数量按"独立可交付、可验收"划：一个工作包只含一个可交付物就对应一个 phase。
  - 工作包多于可交付物时允许拆，但必须在 spec 里写明为什么拆。
- **不做什么**：不出现只有 `P1`、`P2` 的文件名。
  - 不按工作包硬切。
  - 不重复被审计的 card-05 那种 27 个 phase 而工作包远没那么多的情况。
- **风险**：主要风险是"独立可交付、可验收"缺具体判据时走回按工作包硬切。
- **改动**：`skills/spec-plan/templates/phase-template.md`、`skills/spec-plan/SKILL.md`（phase 文件命名与数量判据）。

### N18 修外置件内外路径不通，让 build-plan 真能读到外置原件

- **做什么**：让审查材料解析路径能读到外置原件。
  - 先定范围，再改解析路径（定范围在前）。
  - `ArtifactDir.open` 只允许 `<worktree>/specs/<task>/`。
  - 外置原件的位置是任务库 `quality/evidence/…`。
  - 本块新增一条要求：细节审查合同必须能读到"完整当前 decision-log"。
  - 该合同对送审材料本身早有同一要求（“完整当前 decision-log”），不是本次新增。
- **不做什么**：不另建第二份外置件副本。
  - 不在 worktree 与任务库之间留两个不一致的路径。
  - 范围未定前不改解析路径。
- **风险**：动的是审查材料解析路径，影响所有阶段的审查范围。
  - 须先定范围再改。
  - 这是"外置长期被抵制"的结构性原因。
- **改动**：`ArtifactDir.open` 的范围、细节审查合同的材料解析路径（范围待定）。

### N19 把"外置"的判据改成"下游哪一步读它"，并给出节级消费者表

- **做什么**：把外置判据从"像不像过程"改成「**下游哪一步读它**」。
  - 产出**节级消费者表**。
  - 本材料**第一次写明 build-plan 读 decision-log 的哪些节**。
  - **逐字带 `##` 前缀**被下游点名的只有两节：`## 验收面`（`skills/spec-specify/templates/spec-template.md:275`、`:302`）与 `## 原始需求`（`skills/spec-analyze/SKILL.md:35`）。
  - 按内容另点名两节：`## 风险与延期交接`（`skills/spec-analyze/SKILL.md:37`）与 `## 未决项`（`workflows/build-plan/SKILL.md:15`），合计 **4 节**。
  - 实测 0 处被下游点名的有其余 9 节（含 `## 大纲地图`）。
  - 消解方法里的自相矛盾。
  - `skills/decision-log/SKILL.md:33` 说变更只作指针行（矛盾一方）。
  - `:60` 说变更写索引表（矛盾另一方）。
  - 按 **U-016** 定为**需求变更记录整节外置**。
- **不做什么**：不新增任何关卡（门／账本）。
  - 消费者表只是"谁读什么"的定义，**不是校验关卡**。
  - 不改 build-plan 的产出物形态。
- **风险**：先定义"谁读什么"会暴露现有材料更多的缺节。
  - 若把消费者表做成校验清单，就越过"不加新关卡"红线。
- **改动**：`skills/decision-log/SKILL.md:32-34`／`:60`、`workflows/build-plan/SKILL.md`（补"读哪些节"）、`skills/spec-plan/templates/{spec-template.md,phase-template.md,index-template.md}`（按需补引用）。

### N20 修既有检查器：它现在识别 0 个决策块，且永远返回成功

- **做什么**：修 `tools/cli/check-decision-log-chain.mjs`。
  - 它是整条流水线上**唯一能立刻"会响"的信号**。
  - 让它认当前编号写法 `#### N1 — …`（现状只认 `ADR-NNN`）。
  - 加一项**非长度**检查：**引用自洽**（材料里指到的小节／编号是否真的存在）。
  - 加一项**非长度**检查：**结构存在性**（决策块是否真有那 4 个字段）。
  - 本材料现状实测：实跑 `recognized_blocks = 0` 且**恒 exit 0**。
- **不做什么**：不新增第二个检查器（那会变成重复控制面）。
  - 不做篇幅或字数检查。
  - 检查结果只报事实，**不改变推进**。
- **风险**：修活跃检查器会让此前"静默通过"的材料开始报错。
  - 须先确认不与 `tools/cli/run-checks.mjs:143-148` 的 advisory 语义冲突。
- **改动**：`tools/cli/check-decision-log-chain.mjs:42`、`tools/cli/run-checks.mjs:143-148`（接线方式，advisory 语义不变）。

### 各模块的前提条件与主要风险

本节回答每块依赖谁、主要风险是什么。

| 模块 | 依赖 | 主要风险 | 优先级 |
| --- | --- | --- | --- |
| N1 | — | 改公共运行时后**无自动回归**（无 CI，`npm run check` 本身 exit 1）；事实块可能被当门用 | 高 |
| N2 | — | 通病若成立，修复面显著扩大，须回头再确认范围 | 高（最先） |
| N3 | — | 只删不落会丢掉真实对账 | 中 |
| N4 | — | 若做成新账本会被红线否掉；须落在现有材料 | 中高 |
| N5 | N1、N4 | 可能退化为多填一栏的形式主义 | 高 |
| N6 | — | 压缩淘汰**无法根治**，只能缓解 | 高 |
| N7 | — | 可能退化为形式主义的一句话 | 中 |
| N8 | — | 属"加义务"，与"不加新关卡"有张力 | 高 |
| N9 | N8 | 执行面扩大；要区分"不适用"与"没跑" | 高 |
| N10 | N1、N8 | 属"加义务"，与红线张力未解 | 中 |
| N11 | — | 动的是公共运行时；授权放宽有误判风险 | 高 |
| N12 | N11 | 与"仅最终 close 确认一次"需对齐 | 中 |
| N13 | — | **已取消**（U-009③）：审查是取异源建议，要求"改完再审"会为追 0 findings 造成审查循环 | — |
| N14 | — | 与"不新增审批门"张力最大；项目未声明类别时约束为空 | 中 |
| N15 | — | 还是靠执行者自觉 | 中 |
| N16 | — | 若被做成篇幅判定或评分器即违反 ADR-0037；形状检查只报事实、不改变推进、不判定通过与否 | 高 |
| N17 | — | 工作包与 phase 不一一对应时容易走回硬切 | 高 |
| N18 | N16 | 动的是审查材料解析路径（影响所有阶段的审查范围） | 中高 |
| **N19** | 无 | 先定义「谁读什么」会暴露现有材料更多缺节；若把消费者表做成校验清单就越过「不加新关卡」红线 | 高 |
| **N20** | 无 | 修活跃检查器会让此前「静默通过」的材料开始报错，须先确认与 `run-checks.mjs` 的 advisory 语义不冲突 | 中高 |

**编号映射**（第 1 版与审计建议 → 本版）：M1→N1、M2→N3、M3→N6、M4→N7、M5→N11、M6→N12、M7 与 M8→N10、M9→N8／N9、M10→N2；审计建议 M11 到 M15→N5／N4／（取消）／N14／N15。第 1 版编号仍出现在历史记录里，不追改；引用模块以本映射为准。
**计数与缺口**（实测）：基准版有完整五字段全文的是 **14 块**（N1 到 N12、N14、N15），已外置到 `module-decision-blocks.md`；该外置件实测含 **17 个 `### N` 标题**，其中 **14 个**是上述五字段全文块，另 **3 个**（N16、N17、N18）只有标题、正文逐字注明"源文件中本模块**无五字段块**"——两者不矛盾。N16、N17、N18 在基准版没有五字段块，只出现在基准版 `## 模块清单:344-351` 与 U-013／U-014，本版按该处的模块行与 U-014 推导补齐。N19、N20 无五字段块（U-017 新增）。

完成判据：19 块各有目标句标题、固定 4 个字段（做什么／不做什么／风险／改动）、**76 个字段行各有一句字段级结论句**、字段内每条要点只讲一件事且第一句即结论、可核路径与行号；每块有依赖与主要风险可查；N13 不出现为待实施项。

## 要改哪些文件

本节回答每个文件改什么、由谁唯一 owner。**结论**：甲组 20 行（父代理已裁定 owner）加乙组 28 行＝**48 行**；同一文件中其它模块的追加 hunk 标"并入某 owner"，意思是由该 owner 的实施者一次落笔。
行号为本批实测值；材料之间不一致处已按父代理裁定对齐为单一取值。`runtime/interface/safe-write.mjs` 按 U-010③ 不再改，未列进表。
每条格式：`文件｜改什么｜唯一 owner 模块｜决定`。第 1 到 20 条是甲组，第 21 到 48 条是乙组。

- 1. `workflows/build-code/SKILL.md`｜`:29` 句末追加两句（Phase 卡与 Phase 级 `gate_cmd` 用既有 `verify`＝`capture-tests` 按字面执行、只记不阻断；执行汇总写进 task facts 的 `evidence` 槽，未执行写 `{value:null, reason}`）；**同文件追加 hunk**：N9 的 `:29` 按面真跑／`:30-31` `unavailable` 逐面具名／`:32` 浏览器面义务与 `N/A` 边界／`:36-37` 去硬编码宿主脚本路径；N11 的 `:74` 提交时点正面条款；N14 的 `:27` 受保护面改动先核授权原文与声明写集｜owner N1（N9／N11／N14 的 hunk 并入，一次落笔）｜决定 接（用户 U-005④ 点名"真的执行"）
- 2. `workflows/verify-code/SKILL.md`｜`:18` 逐 phase 穷尽核对（不抽样、只读不重跑、`semantic_test_adequacy` 由该表推导）；`:20` 消歧义（核对＝读既有原件，不违反"不重做全量上游测试"）；`:22` 去硬编码＋结论依据；**同文件追加 hunk**：N9 的 `:22` 通用化改写（同一步）；N11 的 `:42` 阶段末一次完整提交与合并；N12 的 `:44` 收口两段式；N13 原拟 `:20-21`（**已取消，该 hunk 作废**）｜owner N10（N9／N11／N12 的 hunk 并入）｜决定 接
- 3. `workflows/build-plan/SKILL.md`｜`:21`（step 7）加"末 Phase 必须是覆盖全部 AC 的整任务端到端验收 Phase"与"声明来源指向 `skills/spec-plan/templates/phase-template.md:249`"；**同文件追加 hunk**：N14 的规划段受保护面 pending 一条（**行号未定位**）｜owner N10（N14 追加并入 N10）｜决定 接
- 4. `workflows/make-decision/SKILL.md`｜`:29` 把"测试记录与实测记录"从十类排除项拆出、改写为"要求哪些面可问"｜owner N6（N8 的 `:29` 追加并入）｜决定 接；`:32` 是本文件的 N6 主体（去条件化＋三行锚＋talk-with-zhipeng 读取句）
- 5. `docs/standard-workflow.md`｜`:11` 追加同一口径一句（同一 Phase 内的提交消费该 Phase 授权；**HEAD 前进不使本 Phase 已记授权失效**；审查在提交前完成；每 Phase 收尾提交一次，最终完整提交与合并由默认安全收口执行一次）｜owner N11（N12 的两段式收口说明并入，同段一次编辑）｜决定 接
- 6. `tools/cli/stage-runtime.mjs`｜`:538-540` 之间**只插入**一个只读事实块（`contract_ok`／`contract_error_count`／截断后的 `contract_errors`／`ac_coverage`／`fr_coverage`／`command_oracle_checks`），并入 `:576-579` 已构造的 `source`；**不改 `:539` 过滤、不改 `:540` 抛错**；**并加 `evidence` 槽的最小落盘逻辑**（现状 `:866` 写 `null`；把 `quality/tests/` 的真实执行回执映射到该阶段行，形状由 `runtime/task/task-store.mjs:87` 定义为 `[{command, exit_code, failure_signature}]`，写入者＝build-code 的测试子代理执行命令后的回执）——**这是 AC-C05AUD-01 的必要条件**；**并纳入 `:827`／`:843` 的提交前置要求**（支持「一 phase 一次提交、审查以工作树 diff 为基线」，见 N11 行）｜owner N1（N11／N12 的追加并入）｜决定 接，行号以实测 `:533-545` 为准
- 7. `skills/wh-review/scripts/simple-review-runner.mjs`｜`:1882` 只改 `message`：按同载荷的 findings 数量分叉（`findingCount > 0` 时说明"paired review is incomplete；N finding(s) were still returned by the completed provider(s)"）；**`code`／返回结构／`status` 判定不变**｜owner N1｜决定 接（兑现 `workflows/verify-code/SKILL.md:18` 既有条款）
- 8. `skills/decision-log/templates/decision-log-template.md`｜`:107` 完成判据句后追加穷尽义务（保留原句逐字）；`:101` 覆盖矩阵引导句**合并两段**：先 N4 的遗漏签名定义句 → 再 N5 的「已投递未执行」＋「登记了却没处置必须以缺口出现一次」义务句；**不动 `:34` 计数**、不动 `:39-43`／`:103-105` 表头列｜owner N3（N4／N5 的 `:101` 句稿并入，同一物理行按 N4→N5 顺序一次落盘）｜决定 接
- 9. `skills/decision-log/SKILL.md`｜`:64` 追加"指向不定义"的指针句（"没有落点"不另建节，按覆盖矩阵「落点或缺口」栏与 `## 未决项`「状态与处置」栏写）；`:62` 由 N4 句稿并入：计数与编号引用**只写一次**、确需重述须写出处、同一事实两个值即缺陷；**不动 `:34`**（已核对为真：模板实测 12 节）｜owner N3（N4 的 `:62` 句稿并入）｜决定 接
- 10. `skills/spec-plan/templates/phase-template.md`｜`:203`＋`:249` 两处同时改（「测试层级 / 技能」取值域改为项目自己声明的**面**、允许多选、保留"恰好一条 `RED/GREEN gate_cmd`"）；`:132` 逐面"适用／不适用＋理由"（浏览器可见面未列须给具名理由）；`:208-212` 加"判定器与命令成对"一行注记；`:222-238`（`:224` 加"必须被使用一次"）＋`:42-43` 保留｜owner N8｜决定 接（N10 的 `:222-238` 句稿并入本行由 N8 落笔）
- 11. `skills/spec-plan/SKILL.md`｜`:49-57` 的 `tier` 语义随声明改写＋`:53` 后新增三段职责句（层级在 build-plan 定、命令在 Phase 定、执行事实在 build-code 产生）＋末 Phase 义务句（N10 供串）；`:65-71` index 完成判据加"最后一行指向末 Phase、不满足时如实写缺口"｜owner N8｜决定 接（N10 的末 Phase 义务句并入本行）
- 12. `skills/spec-specify/SKILL.md`｜`:18-20` 把 `test standard` 面的内容义务写清（写明**面与 oracle**；每条 AC 的验证面必须指向一条在该 Phase 可执行的命令，**命令本体在 Phase，不在 AC 复制**）；`:140-158`（WR001 节）由 N15 追加"编辑前后保留小节标题"一条｜owner N8（N15 的 WR001 追加并入）｜决定 接；**按节切分**：N8 持 `:18-20`，N15 持 `:140-158`
- 13. `skills/spec-specify/templates/spec-template.md`｜`:218-223`「## 测试标准」加一句：按面写哪些面适用／用什么 oracle／证据类型／覆盖边界，不适用面写 `N/A — 理由`；与 `phase-template.md:249` 的声明**同一份**，不另立第二份表｜owner N8｜决定 接
- 14. `skills/stage-handoff/SKILL.md`｜`:44-49` 段内**新增一句**：阶段末 stage-reflection 若未执行，交接必须写明"本轮未执行"＋一句真实原因；未写明即披露不完整，按 `## 回读结果`（`:36-42`）的 incomplete 处理；**不新增字段或机器校验**｜owner N7｜决定 接；只加一句、**不动 `## 回读结果` 的既有判定语义**
- 15. `skills/stage-reflection/SKILL.md`｜`:15`（`## 方法` 第 3 条末）加"未执行时同样要说明未执行"；`:24`（`## 用户选择后的归口`「判断待办」段末）加**按归属分流**的回流动作（别的项目的问题记在别的项目里、workflowhub 的问题记在 workflowhub 根目录）｜owner N7｜决定 接；回流承载位置沿用 `Improvements.md`＋本节，**不新建文件、不新增字段**
- 16. `runtime/interface/git-authorize.mjs`｜`:539-551`（`record`）新增**可选**字段 `phase`（`head` 保留）；`:606-608`（`consume`）有 `phase` 时**只校验分支**、无（旧记录）时 `:608` 逐字不变；`:553` `consume` 新增可选 `phase`，未传而授权带 `phase` 时报 `AUTH_SCOPE`｜owner N11｜决定 接（动公共运行时）
- 17. `core/task-close.mjs`｜`:603`（`executeClosePlan` 签名）新增**可选**入参 `until`（**同一次执行流内从建 PR 连续跑到合并**时可不传，`until` 只保留为可选的显式分段口，**不再是收尾的默认形态、不要求用户回话**）；`:688-812` 传了 `until` 时按它跳出（不新增持久状态）；`:605` `until` 不在 `plan.steps` 时报 `AUTH_SCOPE`｜owner N12｜决定 接（动公共运行时，收尾核心）
- 18. `workflows/build-code/skill-deps.yaml`｜`skills:` 段新增 `isolated-browser-qa`（`path: skills/isolated-browser-qa/SKILL.md`，`trigger: actual_ui_or_browser_e2e_tier`）｜owner N9｜决定 接
- 19. `workflows/verify-code/skill-deps.yaml`｜`skills:` 段新增同一条（`trigger: ui_acceptance_browser_fact_check`）｜owner N9｜决定 接
- 20. `skills/catalog.yaml`｜`:807` 的 `used_by_stages: []` 改为 `[build-code, verify-code]`｜owner N9｜决定 接（依据 `check-skill-consistency.mjs:109-116` 反向核对进 `reports` 不进 `failures`）
- 21. `tools/cli/task-close.mjs`｜`:19` 允许参数表加入 `until`；`:44` `executeClosePlan({ …, until: values.until })`；`:18` 用法串补 `[--until=<action>]`（**不改子命令集合**）｜owner N12｜决定 接（只改 `core/` 而不改命令侧，`--until` 传不进去）
- 22. `tests/close/close-contract.test.mjs`｜`:91` 保留七步不变量，新增一例覆盖 `--until=pr` 后 `status=partial`、第二次执行续跑｜owner N12｜决定 接（随源码同批）
- 23. `tests/contract/narrow-tool-git-authorize.test.mjs`｜`:89-97` 改为断言 phase 绑定下的同分支前进行为（旧记录仍报 `HEAD_MISMATCH`）｜owner N11｜决定 接（随源码同批）
- 24. `tests/contract/close-authorization-diagnostics.test.mjs`｜`:19` 同上｜owner N11｜决定 接（随源码同批）
- 25. `workflows/build-code/steps.json`｜step 5／6 的 `observable_result` 落到"逐面执行事实可读"与"UI／浏览器面要么有真实执行原件、要么具名理由"（照现有写法，**不新增字段**）｜owner N9｜决定 接；`steps.json` 的措辞受 `tests/contract/verify-architect-acceptance.test.mjs:64` 等措辞锁测试约束，改它须同时改测试
- 26. `workflows/verify-code/steps.json`｜step 4 的 `observable_result` 加"逐 phase 测试执行核对表可读、未跑面与理由逐项列出"（**不新增字段**）｜owner N10｜决定 接
- 27. `workflows/build-plan/steps.json`｜step 7／8 的 `observable_result`（**可选**）；N10 已主动让出｜owner N8｜决定 待裁（建议：不列，可选项，为避免与 N10 撞车；把声明要求只写在 `skills/spec-plan/SKILL.md` 权威处——材料 B 自己写了"若撞车，N8 主动让出本文件"）
- 28. `workflows/make-decision/steps.json`｜step 1（`load-context`）的 `observable_result` 末尾加读取披露句（实际读取了 `skills/talk-with-zhipeng/SKILL.md` 与写 `## 需求变更记录`／`## 未决项` 时的 `skills/decision-log/SKILL.md`；未读或读后未执行按未完成披露并给真实路径）｜owner N6｜决定 接
- 29. `skills/test-routing-advisor/SKILL.md`｜`:16-18`／`:22-41` 写明本技能输出只用于选择"该改动面应当覆盖哪些面"，**不是必填字段、不是门、不阻断推进**；`routing_tier` **不新增机器消费者**｜owner N8｜决定 接
- 30. `Improvements.md`（工具仓库根）｜`:5` 的"未写入任何问题条目"**不改**（状态自述）；N7 落地后由下一真实任务的 `stage-reflection` 就地追加｜owner N7｜决定 登记（N7 的落点，不是本任务写入）
- 31. `runtime/stage/stage-content-contracts.mjs`｜**不改**（`:455,481,597,619` 的正则登记为"不处理＋理由"：legacy 兼容读入口径；`:470-479` 的必填项判定沿用现有形态、接线归 N1；`:611-613` 不加"必须有验收 Phase"的机器判定；`:642-652` 的 `facts` 已算好、N1 只读它）｜owner N1（N4／N8／N10 的"不处理＋理由"登记并入）｜决定 不改
- 32. `tools/cli/run-checks.mjs`｜**不改**（`:143-148` advisory 语义是刻意的；把 advisory 接进 `failures` 属改门）；**本节只有这一处登记**——N1 影响面已按父代理裁定移除该文件（`## 工作包与决定` N1 块同步更正），不再存在"影响面列了它／写集不动它"的双写｜owner 不适用｜决定 不改；本表只有这一处登记
- 33. `tools/cli/check-decision-log-chain.mjs`｜**改**（owner 由 N1 改为 N20）：让它认当前编号写法 `#### N1 — …`（现状只认 `ADR-NNN`，本材料实跑 `recognized_blocks = 0` 且恒 `exit 0`），并加"引用自洽"与"结构存在性"两项**非长度**检查；`:42` 是落点，接线方式见 `tools/cli/run-checks.mjs:143-148`，**advisory 语义不变**（输出只报事实、不改变推进）。**保留原裁定文本**（本行旧版逐字）：「**不改**（`:131 exit_code: 0`、`:6-8` 源码自述 deliberately never becomes a gate、`:143-147` advisory 不入 failures）；只作 N5 的登记项（它只扫 repo 内 `specs/<task>/decision-log.md`、扫不到任务库材料）」——该"不改"是**按旧版编号写法定下的**，U-017 后**已被 N20 取代**；"扫不到任务库材料"这一事实仍然成立。｜owner N20｜决定 改（U-017 授权）
- 34. `runtime/evidence/acceptance-evidence-validator.mjs`｜**不动**（`:27` 保持零调用者）｜owner N1｜决定 不改（生产侧无 `acceptance-evidence.v1` 的 writer；接线＝新造账本/writer）
- 35. `tools/cli/check-stage-quality.mjs`｜**不动**（实测 `:179-182` 仍扫 `metrics/`＋`scripts/`，实跑 PASS）｜owner N1｜决定 不改（扫描面本身就是它的正确语义）
- 36. `tools/cli/verify-structure.mjs`｜**不动**（`:16 FIVE_STAGES` 与 `GLOSSARY.md:154` 的历史标签配对，实跑 exit 0 PASS）｜owner N1｜决定 不改（登记"不接线＋理由"，不是"要修"）
- 37. `runtime/stage/stage-skill-runtime.mjs`｜**不动**（`loadStageSkillStepManifest` 零调用者；"让方法正文进上下文"属 N6）｜owner N1｜决定 不改
- 38. `runtime/task/task-store.mjs`｜**不动**（`evidence` 槽形状 `:87` 已够用；改形状＝动现有 schema）｜owner N1｜决定 不改
- 39. `skills/isolated-browser-qa/SKILL.md`｜**不改**（`:246`「Do not claim browser verification without running it.」、`:227` 不得把缺失写成 pass、`:221-229` Output Contract 已具备正确语义）｜owner N9（登记）｜决定 不改
- 40. `tools/cli/check-skill-consistency.mjs`｜**不改**（`:109-116` 的反向核对只进 `reports`、不进 `failures`，是刻意的 report-only）｜owner N9（登记）｜决定 不改
- 41. `skills/spec-plan/templates/index-template.md`｜**本批不认领**（index 是"可再生导航、不承载完成权威"，`spec-plan/SKILL.md:69`）；末 Phase 义务写进 `spec-plan/SKILL.md` 的 Test design 节｜owner N8（待定）｜决定 不改；材料另有未确认项"是否需要改该模板"（见 `## 未确认项汇总` UN-B-6）
- 42. `runtime/interface/human-confirm.mjs`｜**不改**（N14 不走"新确认件"路线）｜owner N14（登记）｜决定 不改
- 43. `skills/decision-log/templates/decision-log-template.md` 之外的模板与 `skills/*/__tests__`｜本批未提出改动｜owner 不适用｜决定 不改
- 44. `workflows/verify-code/isolated-browser-qa.md`｜**建议退役登记（不删除）**：264 行孤儿旧副本，其机器证据通路 `browser-qa-evidence.v1`／`l3-e2e-report.json` **已从 runtime 整体移除**（`grep -rniE "browser-qa-evidence|l3-e2e" runtime/ tools/` 零命中）｜owner N9（登记）与用户（授权）｜决定 只登记"建议退役、未获授权"
- 45. `.codex/hooks.json`｜**不改**（该通路与"方法正文投递"无关：被删源码逐字自述 `Hook output is intentionally empty: no prompt injection`，由 ADR-0024（accepted，2026-09-05）主动删除；修它＝恢复一个已废弃的宿主会话自动绑定）｜owner N6（登记）｜决定 不改
- 46. `docs/archive/2026-07-13-unstaged-review-snapshots.md`｜**只读**（只作 N11 的退役来源引用，**不改写**）｜owner N11（登记）｜决定 不改；对应 `## 退役登记` 建议行
- 47. `specs/archive/**`、历史任务材料｜**只读**（本任务范围与非目标明文：不追改历史材料、不给历史 Phase 追溯判负）｜owner 全部模块（登记）｜决定 不改
- 48. `（产出物，非仓库文件）` build-plan 的 `spec.md` 与对应 `phases/P<n>.md`｜N2 写复核结论表（七类逐行＋两类清单）｜owner N2｜决定 输出＝结论，非代码（N2 的仓库内写集为空）

**行数**：甲 20 行 ＋ 乙 28 行 ＝ **48 行**。
**计数口径（单一事实源，N4）**：甲组＝父代理已裁定的 20 个文件（表体 20 行）；乙组＝四份材料里提到、但不在甲表的 28 条路径（表体 28 行）；两组合计 48 行。本节内不再出现第二个甲组计数。

完成判据：每行有文件、完整"改什么"、唯一 owner 与决定；同一文件的多个 hunk 只有一个 owner 落笔。

## 范围与非目标

本节回答做到哪、明确不做什么。**结论**：目标 4 项、非目标 5 项，全部过"不加新机制、门、账本"这道筛。

- **目标**（可观察）：
  - ① card-05 暴露的问题有**具名根因**，且根因与"谁的问题"分开（执行者未交／判据无定义处／检查器形同虚设／投递不均／上一轮修了句子长相／复盘无落点）。
  - ② 根因层完成 **19 块**（N1–N12、N14–N20；N13 经 U-009③ 取消）。
  - ③ 跨阶段清单经**正确判据复核**后，成立的通病有明确处置或明确不处置的理由。
  - ④ 全部改动通过"不加新机制／门／账本"这道筛。
- **范围**：本仓库（workflowhub）的方法文本、模板、检查接线与落点定义；诊断部分覆盖 PaperBuilder card-05 的**过程与材料**（只读取证，不改其产物）。实现设计由 spec 承载，执行事实由 task facts 承载。
- **非目标**（每条给理由与去向）：
  - 不修 PaperBuilder card-05 的产物材料（那 8 条"不符合"）。
    - 理由：本任务范围是 workflowhub 自身的根因。
    - 去向：已如实登记在 F-30／F-31，由用户决定是否另开任务。
  - 不做运行时阻断门。
    - 理由：宪法要求"记录事实而非阻断"，且用户红线禁新增关卡。
    - 去向：N1 明确写成"事实浮到边界"。
  - 不新增检查器、不新增账本、不新增阶段。
    - 理由：U-002 红线；已有检查器尚未接线，新增属重复控制面。
    - 去向：N1 只做接线与登记。
  - 不改 `specs/archive/**` 与历史任务材料。
    - 理由：只读保留。
    - 去向：取证只引用、不改写。
  - 不在本任务内判定"修好了"。
    - 理由：U-002 要求由用户另跑真实任务判定。
    - 去向：验收面全部写成用户可观察项。
- **Supersedes**：无。本任务**更正**了自身在 step 2 期间转述给用户的一条错误结论（"第 10 步判据的验收对象不存在"），更正在 F-33→F-35 与 U-003 有据，历史转述不删改、只在新条目里指明其不成立。

完成判据：目标可观察，范围具体，每个非目标一行理由与去向；被替代主张逐条可定位，历史事实保留。

## 验收面

本节回答"怎么算成功、什么算失败"，是 build-plan 的接口。**结论**：**23 条** AC（`AC-C05AUD-01` 到 `AC-C05AUD-23`）；前 16 条沿用基准版，17 到 20 为 U-013／U-014 新增（N16、N17、N18 各一条，编号顺延），21 到 23 为 U-017 新增（N16／N19／N20 各一条）。
按 U-002：**全部写成"用户另跑一个真实任务时可观察"，本任务内不自证通过**。每条给编号、可观察用例、成功条件、失败条件、证据、承接负责人与对应 U／F。
**本任务内只允许的机械验证**（材料 C 提出、异源审查发现 1／8 呼应）：N11／N12 各有一条不依赖实跑的本地断言，它**只证明"事实能否浮到边界"、不给通过结论、不改任何材料判定**，须与下表分开记录（原文按 `unconfirmed-summary.md` 回读；N15 与 N14 无机械形态，只能由真实任务观察）。

| AC 编号 | 可观察用例 | 成功条件 | 失败条件 | 证据 | 承接负责人 | 对应 U／F |
| --- | --- | --- | --- | --- | --- | --- |
| AC-C05AUD-01 | 下一个真实任务跑 build-code：看 Phase 卡声明的 `gate_cmd` 有没有被按字面跑过，以及 `facts.jsonl` 的 `evidence` 槽是否被填 | ① `quality/tests/` 下存在至少一条对应某条 `gate_cmd` 的真实回执（含真实 `argv`／`cwd`／`exit_code`／原始输出）；② 该阶段 stage 行的 `evidence.value` **不再是 `null`**（`tools/cli/stage-runtime.mjs:866` 的最小落盘逻辑已生效），每条含真实 `command`／`exit_code`／`failure_signature`，**且回执可按 `command` 与 `quality/tests/` 下的原件逐条核对**；③ 声明了却没跑的，`evidence` 里看得见这条未执行及原因，且**阶段照常收口** | 所有 `gate_cmd` 只有文本、`quality/tests/` 里没有任何对应该命令的回执；或 `evidence.value` 仍是 `null`（老行为）；或写了命令但 `exit_code` 全是 0 而回执显示失败；或反过来因未执行把阶段卡死 | 任务库 `quality/tests/` 回执原件（`stage-runtime.mjs:1098` `recordDir`）＋ `facts.jsonl`（形状由 `runtime/task/task-store.mjs:87` 强制） | N1（执行者＝build-code 中的测试子代理，U-009②；运行时只提供已有事实槽） | U-001／U-002／U-004／U-005④／U-009②；F-47／F-49／F-41 |
| AC-C05AUD-02 | 下一个真实任务发起 build-code 单 Phase 审查时，看送审材料里有没有契约校验的只读事实块 | 审查输入里能看到 `contract_ok`／`contract_error_count`／`ac_coverage`（含"某 AC 无 Phase Task 承接"这类既有错误串），且**该块的出现没有改变"是否发起审查"** | 审查输入里没有该块；或该块出现后改变了审查是否发起（＝变成门） | 审查材料原件（`captureSource` → `stage-runtime.mjs:576-579`） | N1 | U-005④；F-21／F-38／F-49 |
| AC-C05AUD-03 | 下一个真实任务若再出现"两个 role 都不完整"的方向审查，看回执的 `error.message` 与同一回执里的 `findings` 是否自洽 | 有 findings 时 `message` 不再声称"neither paired review produced a semantic result"，且明说存在 N 条 finding；`code`／`status`／`pair_status` 判定与改动前一致 | `code=REVIEW_NO_SEMANTIC_RESULT` ＋「neither paired review produced a semantic result」与 11 条 findings 并存（本任务已复现一次） | 任务库 `quality/reviews/*.json`（既有落点，`review-record-route.mjs:165`） | N1 | U-002；F-15⑥／`workflows/verify-code/SKILL.md:18` |
| AC-C05AUD-04 | 读下一个真实任务 build-plan 的产出物，看七类跨阶段命中是不是逐类有结论 | ① 产出物里七类各有一行，逐行给出「判据原文 `文件:行号` ＋ U 口径结论 ＋ 依据」，**没有一行是"结构名没逐字出现"**；② C4 被显式标为"判据被推翻"并给出同义形态的 `文件:行号`；③ 其余六类**没有被写成"已推翻"或"已成立"**，全部落在 {U1,U2,U3,U4,未确认} 之一并写明缺哪份证据；④ 显式登记 `stage-handoff` 兜底句行号误差（36→38）与 `06 §7.1`／`:296`／被审计项目 card-05 的 `decision-log.md:75` 三处的类别编号漂移；⑤ 下一个真实任务的 `git diff` 里**没有** stage 方法文本因本模块被改动 | 出现"某结构名全仓只命中该行自身 ⇒ 该义务不存在"这类推理；或 C4 仍被当作"五阶段通病"保留；或六类被一刀切成"都没问题／都有问题"；或 `workflows/*/SKILL.md`／`steps.json` 出现在本模块名下 | 产出物本身（build-plan 的 `spec.md`／`phases/P<n>.md`）＋该任务的 `git diff --name-only` | N2 | U-002／U-003；F-33／F-34／F-35／F-62 |
| AC-C05AUD-05 | 读下一个真实任务的 `decision-log.md`，看还有没有人去"造"那一节、以及矩阵是否穷尽 | ① `grep -c '^## 未落项与处置'` ＝ **0**，起草者**不需要造这一节**才能声称第 10 步完成；② `## 验收面` 覆盖矩阵里能逐行找到**每条 R 与每条 U** 编号，各自给"已落某节"或"缺口"两态之一（**口径已收窄为 R 与 U 两级**）；③ `## 未决项` 与 `## 风险与延期交接` 里**属于 R／U 两级**的未处置项在矩阵里各有一行指向它（发现编号／风险／OI 三类按覆盖矩阵「口径收窄」不强制，各自已有唯一落点）；④ **`## 大纲地图` 节存在**，其行数 ＝ 正文顶层节数 − 1（地图自身省略） | 材料里出现 `## 未落项与处置` 一节；或存在"在别处登记了、矩阵里没有"的编号 ≥1；或未处置项在矩阵无行；或 `## 大纲地图` 缺失或行数与顶层节数不符 | 该任务的 `decision-log.md`（grep ＋ 逐行核） | N3 | U-003／U-008③；F-20／F-34 第 3 组 |
| AC-C05AUD-06 | 读下一个真实任务的四份材料，看编号位数、同号取值与计数出处 | ① `FR-`／`AC-` 编号位数统一（同一 DOMAIN 不存在两位与三位同时出现）；② 同一编号跨材料取值一致（`decision-log.md` 与 `spec.md` 的 AC 编号同号）；③ 材料里出现的模块数／条目数／行数每处都能指出出处；④ 一条需求若在 `## 原始需求`／`## 需求变更记录` 有条目却在覆盖矩阵没有行（或"落点或缺口"为空）**能被指认，且被记为"缺口"而不是被悄悄补成"已落"**；⑤ `git diff --name-only` 里不出现新的 `tools/cli/*`、`runtime/**`、`schemas/**` | 出现 `FR-1` 与 `FR-001` 混用 ≥1 处；或出现 `V-013` 类"引用但原件只到 `V-012`"；或同一事实两个值（如"15 个模块"与同句枚举 16 个编号）；或遗漏签名被静默补成"已落"；或新增了校验器／schema 承载上述四项 | 该任务四份材料 ＋ `git diff --name-only` | N4 | U-002；F-15④／F-26／F-29④／F-56 |
| AC-C05AUD-07 | 下一个真实任务收口时，把所有登记项（对抗风险、审查发现、OI）逐一列出并与覆盖矩阵对账 | ① 任何"已投递却未落地"的项能在矩阵里找到一行**明写"已投递未执行"**并指到它应落的小节（不是散落在交接的散文里）；② "登记了却在矩阵中是空白格"的 **R／U 两级**项数 = **0**（发现编号／风险／OI 按覆盖矩阵「口径收窄」不在此口径内）（**由用户数，不由本任务自证**）；若 >0，则该项至少以 `缺口` 形态出现在矩阵里；③ `git diff --name-only` 中不出现新文件来承载该对账，仓库内不出现第二个"未处置项"清单；④ `raw/09:19` 的 grill 型实例（八键在 reasoning 里写全、材料里 0 命中）表现为**矩阵缺口栏里的可指名行**，而不是"事后审计才发现" | 未被处置的登记项无法当场数出；或收口时仍有"登记了却在矩阵是空白格"的项且未以缺口出现；或新增了台账／新字段 | 该任务收口材料（覆盖矩阵逐行）＋ `git diff --name-only` | N5 | U-011③；F-15③／F-34／`raw/09:21` |
| AC-C05AUD-08 | 下一个真实任务的 make-decision 会话记录里，看两份方法正文有没有在"用到它的那一刻"被读到 | ① 产物写入 `## 需求变更记录` 或 `## 未决项` 之前，会话记录里**存在一次**对 `skills/decision-log/SKILL.md` 的读取，且读取发生在该节首次落盘**之前**；② 同一会话里**存在一次**对 `skills/talk-with-zhipeng/SKILL.md` 的读取，且发生在该会话**第一次**向用户结构化提问**之前**；③ **同一套 grep 的两次计数**（2026-10-12-012 审查原件 F-1 的计数口径）：与会话中面向用户的消息条数同时统计"黑话消息数"＝含 ≥3 个内部编号的面向用户消息条数，**必须 < 基线 50 条的 40%（即 ≤ 20 条）**，两次计数用同一条命令、同一份会话文本，命令与计数结果原样写入回执；④ `grep -n "读取并执行" workflows/make-decision/SKILL.md` 里**不再出现**"…时，读取并执行"这一条件句形态，且与同文件 grill 那条读取形态一致；⑤ **向用户提问时必须使用宿主问答工具**：能读到该会话至少一次宿主问答工具的调用记录；**无该工具时**必须发一条与结构化提问同内容的文本卡，并在产物里记录"本轮降级为文本提问"＋真实原因（不记为通过、也不判失败） | 条件已满足、目标仍零读取；或 `skills/talk-with-zhipeng/SKILL.md` 路径全流仍 0 次；或黑话消息数 > 20 条（＝未低于基线 40%）；或未使用宿主问答工具且未记录降级 | 会话原文（读取序号与提问 call 序号可比）＋产物 mtime ＋同一套 grep 的两次计数 | N6 | U-001／U-009②；F-12／F-37／F-39／F-40 |
| AC-C05AUD-09 | 下一个真实任务阶段收口时，看交接件里"没做复盘"有没有被说明；若在宿主项目里跑，看问题有没有按归属分流 | ① 若该阶段 stage-reflection 未执行，交接**逐字**含"未执行"＋至少一句真实原因与真实路径或明确缺口（`grep -c "stage-reflection"` 非 0；card-05 基线 006 与 `2026-10-12-001` = 0）；② 若过程问题指向工具仓库本身（或目标项目根没有 `Improvements.md`），workflowhub 根 `Improvements.md` 新增至少一条含问题、来源路径（含宿主任务 id 与阶段）、真实选择／未解状态的条目；③ `skills/stage-handoff/SKILL.md` 与 `skills/stage-reflection/SKILL.md` **仍没有**新增节、没有新增必填字段、没有被任何校验器引用（`grep -n "stage-handoff\|stage-reflection" runtime/stage/stage-content-contracts.mjs` 仍为零）；④ 宿主项目侧**没有**被凭空创建 `Improvements.md` | "未执行"这句又消失；或两边沉淀仍为空；或新增了节／字段／校验器；或在宿主项目里凭空造文件 | 交接件原文 ＋ `git diff Improvements.md` ＋ `ls` 宿主项目根 ＋ grep 结果 | N7 | U-003②／U-008②；F-05／F-09／F-10／R-005 |
| AC-C05AUD-10 | 读下一个真实任务 `phases/P<n>.md` 的每张行为 Task 卡，看"这次测哪些面"有没有被声明、每个要测的面有没有命令 | ① 每张行为 Task 卡的「测试层级 / 技能」字段是**项目自己声明的面**的子集，**不再**只出现 `simple／feature／fullstack` 或任何由工具仓库下发的固定清单；② 同一批 Phase 卡里，每条 `覆盖 AC` 列出的 AC 的验证面**指向一条在该 Phase 可执行的命令**；③ `## 测试标准` 节逐面写出适用/不适用＋oracle/证据类型/覆盖边界；**涉及浏览器可见行为的层未列入浏览器端到端时，有具名理由**；④ `routing_tier` 在 `runtime/ tools/ workflows/ config/` 仍**零机器命中**（**不得**新增机器消费者）；⑤ `git diff --stat` 不含 `tools/cli/run-checks.mjs`，且 `stage-content-contracts.mjs` 的必填清单逐项未变 | 卡里仍是路由档位或自由文本；或 AC 没有任何可执行命令；或浏览器可见面缺具名理由；或新增了必填字段／校验器；或工具仓库下发了层级清单并检查清单内容 | 逐卡 grep ＋ spec.md 的 `## 测试标准` 节原文 ＋ 第三人真跑一条命令留真实 exit code ＋ `git diff --stat` | N8（层级不写死，由各项目各任务各 Phase 自定；工具仓库不给清单也不检查清单内容——U-009①／U-010①） | U-006／U-009①／U-010①；F-57／F-58／F-50 |
| AC-C05AUD-11 | 下一个真实任务 build-code 收尾时，逐面看有没有真跑、没跑的写了什么 | ① **每一个声明的面**在 `quality/tests/` 里能找到至少一条真实执行原件（含实际 `cwd`／`argv`／`exit`／原始输出）；② 未跑的面有**具名理由**：**哪一面／卡在哪／什么条件下能跑**，且**不存在**只有"没跑"三个字的条目；③ **涉及浏览器可见行为的 Phase**：要么有 `isolated-browser-qa` 的一次真实执行事实（engine、route/场景、截图路径或真实 `not_observed`＋理由、命令/输出/exit），要么有"该 Phase 声明写集不含浏览器可见面"的具名判断；④ `grep -rn "card-09-session-ledger" workflows/` **零命中**；⑤ `skills/isolated-browser-qa/SKILL.md` 同时出现在两个 `skill-deps.yaml`，`catalog.yaml:807` 与实际声明一致，`npm run check` 仍 PASS 且 `check-skill-consistency` 不再输出该技能的报告行 | 有声明却没跑且只写"没跑／不可用"；或浏览器可见面既没跑也没有具名判断依据；或仍有写死的本仓历史脚本路径；或 `used_by_stages` 与实际声明不一致 | 逐 Phase 逐面对账（AC-12 的表）＋ `quality/tests/` 原始回执 ＋ 三文件 diff ＋ `npm run check` 实际输出与 exit code | N9（执行者＝build-code 中的测试子代理，U-009②；没跑要写清哪一面／卡在哪／何时能跑，U-010②） | U-005④／U-006／U-009②／U-010②；F-58／F-59／F-47／F-50 |
| AC-C05AUD-12 | 读下一个真实任务的 `phases/`，看末 Phase 是不是整任务端到端验收；读 `quality/`，看 verify-code 有没有逐 phase 核对表 | ① `phases/` 里**恰有一个末 Phase**，其契约头列出**全部** AC 编号，其 `Done` 逐条给出 AC 编号＋档位＋一条具名证据路径，且 `phases/index.md` 末行指向它；**适用范围限制**：本条**仅当任务包含可执行产物时必选**，纯文档／工作流规范类任务允许在 Phase 契约里声明豁免并给**具名理由**（与 U-009① 一致；`phase-template.md:224` 的"不新增 stage／gate／schema／校验器"自述逐字保留）；② `quality/`（reviews 或 tests）存在**一张** verify-code 的逐 phase 测试执行核对表，**行数 = Phase 数**，每行含 Phase／声明的面／找到的执行原件（路径＋exit）／未跑或未取证的面与理由；③ 表里**任何**"未跑"都带具名理由与承接人，不存在空行或只有"未跑"的格子，且 `semantic_test_adequacy` 的取值能由该表推出；④ verify-code **没有重跑**上游全量测试（无新增的、与被改 file/case 无关的测试执行原件），`":20"` 的"不重做全量上游测试"与 `:22` 的"incomplete 只限制质量声明、不限制同一 task 继续修复"**逐字仍在**；⑤ `stage-content-contracts.mjs` 未改、`git diff --stat` 不含 `tools/cli/run-checks.mjs` | 末 Phase 仍是纯结算或没有覆盖全部 AC；或没有逐 phase 核对表；或表里有空行／只有"未跑"；或 verify-code 重跑全量；或新增了"必须有验收 Phase"的机器校验；或缺口的出现把任务冻结 | 该任务 `phases/` 原文 ＋ `phases/index.md` 末行 ＋ AC 全集对照 ＋ 核对表原文与行数 ＋ verify-code 回执 grep | N10 | U-005③／U-006；F-46／F-48／F-49／R-015 |
| AC-C05AUD-13 | 用户在真实任务上跑完至少两个 build-code phase，数提交条数与授权条数 | ① 对每个 phase 执行 `git log --oneline <phase base>..HEAD`，**该 phase 段内的提交数 = 1**（材料更新与 finding 修复都算在这 1 次里）；② `quality/evidence/git-authorizations/` 里 `*-authorize-commit*.json` 的条数 **≤ phase 数**（可能还有收尾那条），并抽样确认同一条 `commit` 授权的前后两个 HEAD 不同；③ 该 phase 的审查原件引用的送审对象是**当时的工作树 diff**（`git rev-parse HEAD` 在此期间未变），且该 phase 的提交发生在审查回执之后；④ verify-code 结束时目标分支已包含任务分支，且任务分支顶端提交包含该阶段全部材料与代码改动；⑤ 过程记录里**没有新增**任何"提交门"、提交账本或新的阶段字段 | 一个 phase 段内提交数 >1（开发一次、测试改一次、审查改一次）；或授权条数与提交条数同量级增长（HEAD 一 HEAD 一授权）；或提交发生在审查之前；或新增了提交门／账本／字段 | `git log --oneline <phase base>..HEAD` 逐 phase ＋ 授权 JSON 清单与 `head` 取值 ＋ 审查原件时间序 ＋ `git diff --stat` 与 `facts.jsonl` 无新字段 | **N11**（提交粒度＝每 phase 1 次 ＋ verify-code 结束一次完整的全部提交合并，U-004／U-005①） | U-004／U-005①；F-41／F-42／F-43／F-44／R-013 |
| AC-C05AUD-14 | 用户在真实任务上执行一次收尾，看 **PR 是否在合并前真实存在、链接是否已被推送给用户**、且全过程**没有阻塞** | ① **PR 在合并前真实存在**：close-action 记录里 `pr` 为 `completed`，且执行输出与 `inspectDeliveryCloseState` 的 `pr.url` 里能读到真实 PR 地址；② **其链接已被推送给用户**：面向用户的输出里含该 PR 地址（同一次执行流的输出即可核）；③ 同一次执行流内继续完成合并与归档：`commit`／`push-task`／`pr`／`merge` 均为 `completed`，目标分支已含任务提交、worktree 与本地任务分支按默认安全收口移除；④ `gh pr view <url>` 能查到该 PR，其 `createdAt` 早于 `mergedAt`（＝PR 确实先于合并存在；已合并＝`MERGED` 属正常，不判失败）——**按仓库内可复现的命令取证**；⑤ **没有**新增 close 子命令、第二次确认或新持久状态（仍只有那一条七步不变量）；⑥ 全过程**不等用户回话**（该次执行不停在 `partial`、不需要用户随后执行第二段） | PR 只在合并不成立（`pr` 记录缺失或 `pr.url` 打不开）；或 PR 被建但**链接没有推送给用户**；或该次执行停在 `partial` 等用户回话／需要用户随后执行第二段；或新增了第二次确认／新子命令／新持久状态 | 该次执行返回体与 close-action 记录 ＋ `gh pr view <url>` 的 `createdAt`／`mergedAt` 真实远端对照 ＋ `git merge-base --is-ancestor` ＋ `grep -rn "stopAfter" <close 收口路径>`（竖线在正文里写作"或"，避免破坏表列） | N12（**不阻塞，只把链接推送给用户**；收尾两段式＝同一次执行流内先建 PR、推送链接、再合并，**不等用户回话、不需新确认**——U-011①；父代理裁定见 `## 冲突待裁` 第 3 条） | U-004／U-005②／U-011①；F-51／F-52／F-53／F-54／R-014 |
| AC-C05AUD-15 | 用户在真实任务上，让人为把某一 Phase 的声明写集与任务授权范围**不一致**（声明写集只含 A，却准备改 B），看流程怎么处置 | ① 该处改动**被停下**，过程记录里能读到三项事实：越界的**具体文件／符号**、所依据的**授权原文位置**、缺的是**哪一条确认**；② 记录里**没有**出现由实施方自己写下的"已有裁决覆盖／不增审批门"式结论；③ 材料里凡出现"已确认／逐字／已产生"的断言，其指向的原件路径**真实存在且可打开**（把材料里所有此类断言的路径逐个打开，**0 个 404**）；④ 该任务全流程的"人确认"次数与既有口径一致（**最终 close 一次** ＋ 方向／计划两道既有选择），不因本模块新增；⑤ 动手前**显式读取并引用了项目自己声明的类别**（记录里能看到"按某项目某处声明的类别"这一引用），而**不是**引用工具仓库下发的类别清单；⑥ **停等只适用于项目声明的受保护类别**：本用例的 B 必须声明为该项目自己声明的受保护类别之一（如引擎／DSL／数据库／产品代码），该处**停下**；同一用例里另改一处**纯文档／注释／测试夹具**类的越界，则按 U-008① **继续做并登记**，不被停下——两条路径都要在本用例里出现并可判 | 越界改动由实施方自己认定"已有裁决覆盖"后放行；或材料里"已确认"指向的原件打不开／从未产生；或人确认次数增加（＝新审批门）；或工具仓库自己定义了一套类别清单让执行者照抄 | 该任务处置记录 ＋ 授权 JSON／确认件原文（`quality/evidence/git-authorizations/*.json` 与 `human-confirmations/`）＋ 逐个打开材料里"已确认"指向的路径 ＋ 人确认次数清单 | N14（工具仓库不定义类别，只要求动手前显式读取并引用项目自己声明的类别——U-011②） | U-008①／U-011②；F-23／F-24／F-25／F-60／R-006 |
| AC-C05AUD-16 | 用户另跑一个真实任务，其中至少发生一次会触碰小节标题的批量改写（例如替换某个标题下的整段内容） | ① 每个被改文件的小节标题数在改写前后一致，`grep -n '^#' <被改文件>` 里改写前存在的标题**逐字仍在**；② 当次编辑说明里能读到"本轮涉及文件＋标题清单"这一事实；③ 仓库里**没有**新增任何运行时函数、CLI 工具或 pre-hook 拦截器（`runtime/interface/safe-write.mjs` 逐字未改）；④ 发生标题丢失时按规范**先恢复原文件再重新编辑**，没有出现"手工补标题" | 被改文件的小节标题被旧锚点替换吃掉（card-05 重复 4–6 次的形态、本会话 6 次的形态）；或改写后靠手工补标题掩盖；或为兜住它新增了函数／命令／检查链条目 | `grep -n '^#' <被改文件>` 前后对照 ＋ 当次编辑说明 ＋ `git diff --name-only` 中 `runtime/interface/safe-write.mjs` 未出现 | N15（**只写进写作规范，不动代码**，U-010③） | U-010③；F-17／F-56（编辑事故重复）；`03:219-226`／F-63 |
| AC-C05AUD-17 | 读下一个真实任务的 `decision-log.md`，逐节问"build-plan 写 spec 与 phases 时要不要读它"，再核表与指针的去向 | 每一节都能被判为"build-plan 写 spec 与 phases 时要读"；节内一段一主题、结论在前、节首说明本节回答什么问题；**写集表与 AC 表逐行保留在主文**；只是证明与过程的内容以指针代替，指针能定位到原件 | 出现把多个主题硬挤成一句而读不出结论；或把写集表与 AC 表整块搬进外置件，导致 build-plan 必须读外置件才能取到接口 | 该任务 `decision-log.md` 逐节 ＋ 写集表与 AC 表所在节 ＋ `## 外置事实索引` 的到达条件 | N16 | U-014①／U-014③／U-015；F-65／F-67／F-68 |
| AC-C05AUD-18 | 读下一个真实任务的 `## 外置事实索引`，逐条核每个**被外置的原件是否可达、可读、可回读**（不核篇幅，不核"该不该外置"） | ① 索引列出的每条外置件**按索引的基准目录加相对路径逐个可打开**（与索引口径同一套路径，0 个 404）；② 每条指针写明**什么条件下要读**与**主文留了什么**，回读原件能取到索引声称的内容，不出现"指到不存在的位置"；③ 判断依据是**内容**（该节是否为 build-plan 直接消费）而**不是篇幅数字**（U-015） | 索引里指到的外置件打不开；或同一原件在 worktree 与任务库之间出现两个不一致的路径；或以篇幅数字为由删内容具名理由；或外置件建了但主文 0 引用 | 该任务 `## 外置事实索引` ＋ 逐条按基准目录打开外置件 ＋ `grep` 主文引用位置 | N18 | U-014①／U-016；F-68／`raw/20` 第 7 节 |
| AC-C05AUD-19 | 读下一个真实任务的 `phases/`，看文件名与 phase 数量 | 每个 phase 文件名形如 `P<n>-<任务或工作包短名>.md`；phase 数与"独立可交付、可验收"的划分一致；工作包多于可交付物而拆分时，spec 里写明为什么拆 | 文件名只有 `P1`、`P2`；或 phase 数明显多于工作包且 spec 没有说明 | 该任务 `phases/` 文件清单 ＋ `spec.md` 的拆分理由段 | N17 | U-013／U-014②；R-016／R-017 |
| AC-C05AUD-20 | 读下一个真实任务的外置件与主文，看外置件是否真的可达、可读 | 外置件位于主文索引给出的基准目录、**按索引的基准目录加相对路径可打开**（与索引口径同一套）；审查材料解析路径能读到外置原件（N18 定范围后核）；主文引用外置件的位置能被 `grep` 命中 | 外置件建了但不在被审查也读不到的路径上；或同一原件在 worktree 与任务库之间出现两个不一致的路径 | 该任务外置件路径逐个打开 ＋ 审查送审材料的实际解析路径 ＋ `grep` 主文引用 | N18 | U-014①／U-016；F-68／`raw/20` 第 7 节 |
| AC-C05AUD-21 | 读下一个真实任务的 `decision-log.md` 里任意一块决策，看形状是否达标 | ① 每块固定 **4 个字段**（做什么／不做什么／风险／改动），字段数固定即 4；② 每个字段内的**每一条要点**（含子要点）**只讲一件事**，一个字段需要讲多件事时以子要点（`  - `）逐条列；③ 每条第 1 句即结论，依据、边界与例外写在结论之后；④ 标题是含动作动词、脱离正文能读懂的目标句；⑤ **不含任何长度／字数要求**（不设上限、不设评分器、不据此判完成）；⑥ **不规定"每块恰好 4 条要点"**；⑦ 上述各项**由既有检查器以事实报告，不构成推进阻断**（`tools/cli/run-checks.mjs:146-147` 逐字不入 `failures`） | 某块缺少 4 个字段之一或出现第 5 个字段；或一条要点（含子要点）里塞 2 个以上主题；或要点以铺垫／背景／复述缺陷起头；或标题只写 `N1` 或只有抽象名词；或仍以"每块恰好／最多 4 条要点"判达标；或出现以字数／行数判定达标的写法 | 该任务 `decision-log.md` 的 `## 模块清单` 逐块原文（本材料 `## 模块清单` 的 19 块即同一形状的当场证据） | N16 | U-016③／U-017①；F-9 |
| AC-C05AUD-22 | 读下一个真实任务的 `decision-log.md` 的节级消费者表与 `## 外置事实索引`，看**外置面的划分**是否按"下游哪一步读它"判的 | ① 存在**节级消费者表**，逐节写明"这一节给下游哪一步读、判据是逐字带 `##` 前缀还是按内容"；② `## 需求变更记录` 按 U-016 **整节外置**，主文只留指针；③ 仍留在主文的每一节都能给出"build-plan 写 spec 或 phases 时读它"的具名理由 | 存在节级消费者表但某节未列且给不出理由；或以篇幅数字（行数／字节）作为外置与否的判据；或 `## 需求变更记录` 仍未外置、主文重复铺开 | 该任务 `decision-log.md` 的 `## 外置事实索引` 节级消费者表 ＋ `## 需求变更记录` 所在位置与指针 | N19 | U-016②／U-017②；F-4／F-65／F-67／F-68 |
| AC-C05AUD-23 | 对下一个真实任务的 decision-log 跑一次 `check-decision-log-chain`，看它是否真能识别决策块 | ① `recognized_blocks > 0`（修前实测为 0 且恒 exit 0）；② 材料指向不存在的小节／编号时**有输出**，"引用自洽"与"结构存在性"两项检查各自有输出形态；③ 输出只报事实、**不改变推进**（advisory 语义不变，不写入 `failures`）；④ **不含篇幅或字数检查** | 仍只认 `ADR-NNN` 而本材料用 `#### N — …` 时 `recognized_blocks = 0`；或引用自洽／结构存在性任一项无输出；或检查结果改变推进／写入 `failures`；或新增第二个检查器 | `tools/cli/check-decision-log-chain.mjs` 实跑输出与 exit code ＋ `tools/cli/run-checks.mjs:143-148` 的 advisory 语义未变 | N20 | U-017①；F-67 |

**覆盖矩阵口径**（本材料自身适用）：逐条穷尽义务只覆盖 R 与 U 两级；发现编号、风险、OI 三类已有各自唯一落点，不再逐条抄进矩阵；"缺口"是合法取值，未处置或未确认的一律按缺口登记，不补成"已落"。逐项结论按 `## 外置事实索引` 的条件回读 `coverage-matrix-itemized.md`。

完成判据：每条承诺有可观察用例、成功与失败边界、证据或具体缺口、承接负责人及对应来源；覆盖矩阵逐项有事实、处置与落点或缺口。

## 未决项

本节回答还没定的事、谁定、下一步做什么。**结论**：8 条（OI-001 到 OI-008），其中 **2 条已关闭（OI-003、OI-004）、6 条 open**。原本的主文 `## 冲突待裁` 那 9 条已全部裁定（**该节已随 U-016 外置**，全文与逐条裁定依据按 `## 外置事实索引` 的条件回读 `quality/evidence/decision-log-refs/unconfirmed-summary.md`），结论要点见本节下方。

| OI 编号 | 问题与来源 | 状态与处置 | 解决者与下一步 |
| --- | --- | --- | --- |
| OI-001 | 投递时点问题：两份方法正文的投递发生在 card-05 首次上下文压缩**之前**；若把"进入上下文"狭义化为"执行该步时仍在窗口内"，N6 与穷尽判据那组的结论会翻转。来源 F-36、第 9 路未确认项 | **open**；缺压缩摘要原文，无法判定 | 工作包③复核时补取压缩摘要；确证不了则如实保留"两种读法并存" |
| OI-002 | 跨阶段通病清单的真实成立范围：第 6 路判四类为五阶段通病，但其判据已被裁决推翻五组中的四组。来源 F-19、F-35 | **open**；不得照原清单开修 | 工作包③用正确判据重判后再定 |
| OI-003 | "问题回流"的承载位置 | **closed（U-008② ＋ N7 裁决）**：按**归属分流**——别的项目的问题记在别的项目里；workflowhub 的问题记在工具仓库根 `Improvements.md`，**不新建位置** | 已收敛；N7 按此实施、还是每次任务结束时的一个明确动作 |
| OI-004 | N3 的取舍：删掉"未落项"口径，还是在模板里定义它 | **closed（U-008③ ＋ N3 裁决）**：**删掉悬空名，对账落到模板现有小节**，不新增节；穷尽义务收窄为 R／U 两级 | 已收敛；N3 按此实施 |
| OI-005 | N1 的接线范围：哪些检查接、哪些如实登记"不接＋理由"。来源 F-21 | **open**；须逐项过"不新增门"这道筛。**本项含 N8 的硬要求**：接线范围必须明示"层级与命令字段的校验结果只作事实浮现，不作 Phase 推进前置" | 模块收敛后进 spec |
| OI-006 | card-05 那 8 条"不符合"要不要另开任务修。来源 F-30、F-31 | **open**；本任务已定为非目标 | 用户决定；本任务只如实登记 |
| OI-007 | `.codex/hooks.json` 声明（`SessionStart`／`UserPromptSubmit`／`SessionEnd` 三个钩子）指向一个**已被 ADR-0024（accepted，2026-09-05）主动删除**的脚本，属**残留声明**。来源：对抗性方向检查 R4 | **open（如实登记）**；**本任务不修**——修它＝恢复一个已废弃的宿主会话自动绑定 | 用户决定是否另开任务；本任务只登记 |
| OI-008 | 沟通标准（R-011）的**落地范围缺口**：`docs/adr/0037:18` 把 `ASD-STE100` 与 `ISO 24495-1:2023` 的落地范围限定为 **workflowhub 自己的文档输出物**，**不含与用户的对话过程**；而 R-011 要的正是"与用户的沟通过程"。**正式扩范围属 ADR 级决定** | **open（如实登记）**；本任务**只登记不处置**——已在 N6 落"读到方法正文"这一步，并把判据改写成 AC-C05AUD-08 的可复现度量 | 用户／ADR 决定是否扩范围；本任务按 AC-C05AUD-08 观察 |

**已裁结论 9 条**（全部已由父代理裁定、遗留 0 条；逐条裁定依据按索引条件回读 `unconfirmed-summary.md`）：

1. `workflows/build-code/SKILL.md` 的 owner 是 N1，N9／N11／N14 的改动作为追加 hunk 并入 N1 一次落笔；N13 的 `:33-34` hunk 作废。
2. 项目铁律（引擎／DSL／数据库改动必须人工确认）的原文在被审计的宿主项目 `PaperBuilder/AGENTS.md:10` 与 `:13`，不在本任务写集内；材料不得声称工具仓库引用了它的行号，只把它当"项目自己声明的类别"的示例。
3. N12 的"不阻塞"以用户口径 U-011① 为准，不采纳"未确认前不进入第二段"。
4. `runtime/interface/safe-write.mjs` 不改，`missingSectionHeadings` 及其测试作废。
5. 两个 decision-log 文件的 owner 是 N3，N4 与 N5 只交句稿。
6. `tools/cli/check-decision-log-chain.mjs` 处置＝不改、不接线并附理由，owner 是 N1；N5 只登记。**→ U-017 后已被 N20 取代**：该文件现由 N20 承接（认当前编号写法，并加"引用自洽"与"结构存在性"两项非长度检查），owner 改为 N20，写集第 33 行同步改（原裁定原文逐字保留在上句）。
7. `tools/cli/run-checks.mjs` 从 N1 影响面移除，只留在"明确不动＋理由"清单。
8. 行号对齐到单一取值：`stage-runtime.mjs` 用 `:533-545`；`stage-handoff` 兜底句由 36 改为 38 并显式登记；N13 的 `:20-21` hunk 作废。
9. `raw/06` 七类中只有 C4 的判据被 `raw/09` 推翻，C1、C2、C3、C5、C6、C7 一律"未确认"，归属是 N2。

完成判据：未决项在一张表中一条一行，逐项有问题、来源、真实状态、处置或下一步及解决者；零问题写无。

### 本轮遗留（终验判为不阻断，照原样登记）

- **C1**：`N7` 的「不新增任何承载结构（节／字段／机器校验）」是同类条文里**唯一未拆**的一处（`N3`／`N5`／`N11`／`N15` 同形态已拆）；终验按同一口径判**算违规**，故「一段一主题」实测为 **18/19**。
- **C2**：`U-002` 那一格建议用 `<br>` 拆点。
- **C3**：`AC-C05AUD-05` 丢了一句「理由见下方矩阵附注」的指引。
- **C4**：`R-017` 摘要（`## 原始需求` 内）有一处顿号用字不统一。（终验原报 `:85`，**更正为 `R-017` 摘要行**。）

### 本轮过程事实（自我登记，**本节记录的是本任务自己的病历**）

- **四轮修复，每轮都新引入内容丢失**：精炼版丢两个整节＋5 条 AC 缺条件＋写集被压缩；重建版 8 条必须补（1 条阻塞）；形状重写版 6 条；补回版 5 条阻塞（B1–B5）。四次都由独立核验发现，**没有一次是自检发现的**。
- **两次"零丢失"自报，核对范围不足**：修复方两次声称"内容零丢失"，但一次只核了 `## 模块清单` 一族、未覆盖写集／验收标准／需求三族，故 B1–B5 全部漏过。**这不是造假，是没有全族比对的机制。**
- **口径分歧一次**：同一份材料，修复方按自己的口径报「一段一主题 19/19」，核验者按明确写出的口径实测 **10/19**；根因是「不新增任何 X（a／b／c）」这类并列写法**每一项都是可独立成立的规定**。
- **提交信息与材料不符一次**：替换主文那次提交声称"遗留 4 项照原样登记"，而当时材料里**并无该登记**；本次已补齐（见上）。
- **确认链**：`2026-10-12-001` 绑的是**已被取代的 662 行版**，**已过时**；现行确认为 `2026-10-12-002`（绑 HEAD `267b8afa`）。
- **与模板的偏离**：`## 任务身份` 在本版降为文首粗体段落（模板为顶层节）；`## 需求变更记录` **整节外置**（依据 U-016② 用户明确指令，目录行已删）；`## 模块清单` 与 `## 需求变更（U）最小索引` 是**模板外新增节**。


## 风险与延期交接

本节回答有什么风险、谁在哪个阶段处理。**结论**：**10 项**风险与延期（实测：内容基准 `fa8fe594` 的风险表 7 行 ＋ 本轮新增 3 项＝N19 `:798`／N16 `:799`／N17 `:801`），质量缺口逐项可见；下表数据行实测 **10 行**。

| 内容 | 触发与后果 | 处理阶段与 owner | 来源 |
| --- | --- | --- | --- |
| **N11 动公共运行时** | 授权粒度由"绑 HEAD"改为"绑分支＋阶段"，**所有任务**的提交授权行为随之变化；旧记录无阶段字段者保持原样（逐字兼容），但有阶段字段的新记录语义变宽 | build-code；owner＝N11 实施者；spec 须写明"旧记录零影响"的验证方式 | F-41／F-44 |
| **N8／N9／N10 属"加义务"** | 与 U-002"不加新关卡"有张力；若被读成门，会阻断推进 | build-plan 收口与 verify-code；owner＝用户裁决；**已定为产出要求而非门**（不写进校验器） | U-009／U-010 |
| **N14 与"不新增审批门"张力最大** | 要求"动手前读取并引用项目自己声明的类别"，可能被读成新审批；若项目未声明类别，则约束为空 | build-code；owner＝N14 实施者；未声明时如实登记为"未声明" | U-011② |
| **N1 改公共运行时后无自动回归** | `npm run check` 本身 exit 1（markdownlint 先失败）、`test:contract` 不在 check 链上、仓库无 `.github/workflows` | spec／build-code；owner＝N1 实施者；spec 须写明"改后显式跑 `npm run test:contract`" | F-61；UN-A1-8 |
| **N19 扩外置覆盖面与 NEW 判据** | 外置判据由"像不像过程"改为"下游哪一步读它"，下游读者需按指针读外置件；若消费者表被当成校验清单，就越过"不加新关卡"红线 | 全部材料作者；只定义"谁读什么"，不判定通过与否 | U-017②；U-016② |
| **N16 与 ADR-0037 的边界** | 写死决策块"形状"（每块固定 4 个字段、字段内一条要点只讲一件事、每条第一句即结论）后，若形状检查被做成判定或评分器，即违反 ADR-0037 的明文否定 | 全部材料作者；形状检查只报事实、不判定通过与否 | U-017①；`ADR-0037:20` |
| **N7 回流承载位置** | 现行规则只允许写"目标项目根"；按 U-008② 改为**按归属分流**后，工具仓库侧写本仓根 `Improvements.md`，**不新建位置** | 阶段末交接；owner＝N7 实施者 | U-008②；F-32 |
| **N17 划 phase 的判据** | "独立可交付、可验收"需要具体判据；工作包与 phase 不一一对应时容易走回按工作包硬切 | build-plan；owner＝N17 实施者；拆分必须在 spec 写明理由 | U-014②；R-016／R-017 |
| **验收周期** | 验收由用户**另跑一个真实任务**判定，本任务内不自证；本次交付后到判定之间材料须保持可回读 | 交付后由用户执行；owner＝用户 | U-002 |
| **19 块一次做完（U-007）** | 涉及 48 行写集、其中 5 个在公共运行时或通用方法文本上；改动面大于前两轮；34 条未确认项（含 `32 类 vs 43 类`口径、`npm run check` 已红、零 CI、若干行号未逐条复核）**原样保留**，不写成已定 | spec 与 build-code；owner＝主会话在 spec 里分 Phase；未确认项 owner＝各模块实施者 | U-007；`unconfirmed-summary.md`；F-61 |

**质量边界**：材料、实施、测试、独立审查与物理交付分别报告；未执行保留具体缺口，用户确认引用外置原件。
**high_risk_fact**：`{"classification":"high_risk_user_visible","basis":"user_declaration"}` —— 依据：U-011①（PR 在合并前可见但**不阻塞**）与 U-009②（执行者＝build-code 测试子代理）均由用户逐字声明。

完成判据：每项风险或延期列触发、后果、阶段、owner 与来源；质量缺口逐项可见，高风险分类与不可逆授权分别有真实依据。

## 退役登记

本节回答哪些旧口径被取代、谁决定。**结论**：4 行，全部为"建议，决定人＝用户；未获批准前不声称已退役"。

| 日期 | 哪张（R/FR/AC/Phase/材料） | 为什么退役 | 谁决定 | 原来的需求编号 |
| --- | --- | --- | --- | --- |
| 待用户确认（无日期） | `docs/archive/2026-07-13-unstaged-review-snapshots.md:5` 的「整个 stage 只提交一次」口径 | 由 N11 的「每 phase 一次 ＋ verify-code 收尾一次完整提交合并」承接（U-005①） | **建议，决定人＝用户；未获批准前不声称已退役** | R-013 |
| 待用户确认（无日期） | `runtime/interface/git-authorize.mjs:608` 作为 phase 内唯一绑定口径 | 收窄为「绑分支＋阶段」；**无阶段字段的旧记录逐字保持 HEAD 严格相等**（向后兼容） | **建议，决定人＝用户** | R-013 |
| 待用户确认（无日期） | `workflows/verify-code/isolated-browser-qa.md`（264 行孤儿旧副本） | 其机器证据通路 `browser-qa-evidence.v1`／`l3-e2e-report.json` **已从 runtime 整体移除**（`grep -rniE` 零命中）；N9 登记为"建议退役、未获授权" | **建议，决定人＝用户** | R-015 |
| 待用户确认（无日期） | 「建 PR 与合并必须同一次 close 内完成」这一实践口径 | N12 改为收尾两段式（先建 PR、推链接、再合并）。**注**：该口径**全仓 0 命中**（`raw/13` §7.1），故此项仅在确认它曾有成文口径时才登记 | **建议，决定人＝用户** | R-014 |

完成判据：实际退役每行有日期、对象、理由、决定人与原需求编号去向；没有真实授权不声称已批准删除。

## 外置事实索引

本节回答每类过程内容外置到哪、什么条件下读、主文留什么。基准目录＝任务库根 `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-card05-stage-defect-audit-20261012`；下列路径**相对该目录**解析，不能按 worktree cwd 解析，也不能当作 worktree 内的绝对路径。
每条格式：`原件路径｜什么条件下要读｜主文留了什么`。

- `quality/evidence/human-confirmations/2026-10-12-002-make-decision-approved.json`｜需核对本阶段现行确认件（绑 `267b8afa`）时读｜留 确认结论与绑定 HEAD
- `quality/evidence/human-confirmations/2026-10-12-001-make-decision-approved.json`｜需核对**已过时**的上一次确认（绑 662 行版）时读｜留 已过时留痕
- `quality/evidence/raw/24-final-signoff-verification.md`、`25-refinal-verification.md`、`26-terminal-verification.md`｜需回读四轮核验（含终验"能签字"结论）时读｜留 各轮必须补项与真数
- `quality/evidence/raw/27-stage-end-spec-analyze.md`｜需核对 U 来源分类与确认链结论时读｜留 来源分类与必须补 3 条
- `quality/evidence/decision-log-refs/requirement-change-log.md`｜需核对 17 条需求变更（U-001…U-017）的逐条全文、原文指针与受影响决定时读｜留 各决策块内的用户口径编号（如 U-009②、U-010③、U-011①、U-012⑤）与全局硬约束
- `quality/evidence/decision-log-refs/facts-index.md`｜需核对 68 条已知事实（F-01…F-68）、3 条假设与推翻依据、以及全部更正与过程记录时读｜留 5 条会改变 build-plan 写法的关键事实与 H-02 判定
- `quality/evidence/decision-log-refs/unconfirmed-summary.md`｜需核对 34 条未确认项、9 条冲突的全部裁定与最小机械验证时读｜留 8 条未决项状态与 9 条已裁结论要点
- `quality/evidence/decision-log-refs/coverage-matrix-itemized.md`｜需核对覆盖矩阵逐项结论（每条 R 与 U 的事实、处置与落点）时读｜留 覆盖矩阵口径（R 与 U 两级穷尽、"缺口"为合法取值）
- `quality/evidence/decision-log-refs/write-set-reconciliation.md`｜需回读写集逐行的历史对账与 owner 归一化依据时读｜留 48 行写集的**完整"改什么"原文本体**
- `quality/evidence/decision-log-refs/module-decision-blocks.md`｜需回读 **14 块**的原五字段全文（决定、为什么、否掉了什么、后果与风险、影响面；该件实测 17 个 `### N` 标题，其中 14 个是五字段块）时读｜留 19 块的短要点与全部可核路径、行号；**该件是同一批结论的历史全文版，不是第二份权威**
- `quality/evidence/decision-log-refs/direction-review-dispositions.md`｜需核对对抗性检查 17 条风险、5 条 Kill、7 条 Recycle，以及方向审查 11 条发现的逐条处置时读｜留 处置计数与推翻项结论
- `quality/evidence/decision-log-refs/grill-draft-and-challenges.md`｜需回读第 11 步 grill 的挑战、选项与裁决原文（含 U-012①"防回落"约束原文）时读｜留 六条轴结论与"汇总写入＋防回落"这一实现约束
- `quality/evidence/raw-requirements/user-message-20261012{,-b,-c,-d,-e,-f}.txt`（**6 份**）｜需核对用户手打原话的 sha256 或行号级锚点时读——**逐字全文已就地收录进主文 `## 原始需求` 的「用户原话原件」子节**（F-5 用户裁定）｜留 **6 份逐字全文**（`user-message-20261012.txt` 2125 B／`sha256 e93feb8b…`；`-b.txt` 560 B／`dab74828…`；`-c.txt` 1478 B／`b1a5b9f2…`；`-d.txt` 376 B／`7b908b64…`；`-e.txt` 1302 B／`2157c4ff…`；`-f.txt` 594 B／`8a613dff…`）
- `quality/evidence/raw/01-standard-procedure.md` 到 `raw/22-decision-log-shape-rootcause.md`（截至本材料写作时目录实测 **22 份**，编号为 01–16、16a、18–22，**无 raw/17**；其后的 `23-restructured-verification.md` 是本材料的独立核验件，另行计数）｜需回读任一路取证原件时读，路次与路径对应见 `facts-index.md` 的来源栏｜留 路次结论摘要
- `quality/evidence/raw/21-refined-lossless-verification.md`｜需核对"450 行精炼版丢过内容"的逐条清单与本材料内容基准时读｜留 12 条丢失项与逐条处置结论
- `quality/evidence/decision-log-refs/convergence-A1-N1-N2.md`、`convergence-A2-N3-N5.md`、`convergence-B-N6-N10.md`、`convergence-C-N11-N15.md`｜需回读四组模块收敛件时读｜留 方案、替代、验收、风险摘要
- `quality/reviews/2026-10-12-005-make-decision-direction.json`｜需回读异源方向审查原件、真实执行事实与 11 条发现时读｜留 审查状态与处置计数
- `quality/reviews/2026-10-12-012-make-decision-detail.json`｜需回读细节审查 28 条发现与逐条处置时读｜留 发现编号与阻塞级

**主文与指针的划分判据**（U-014①，经 U-015 更正）：逐节问一句——build-plan 写 `spec.md` 与 `phases/P<n>.md` 时要不要读它？要读就留在主文，可以精简表达但不删必要信息；只是证明与过程的，外置成原件、主文留指针。**不设任何篇幅指标、阈值或目标值**；行数、文件大小、每行字节都不作为限制或驱动。

留在主文的六类内容：

1. `## 要改哪些文件` 的 48 行写集：每行的完整"改什么"原文、owner 与决定都留主文，build-plan 逐 Phase 分配写集时不必先读外置件。
2. `## 验收面` 的 23 条 AC：用例、成功／失败条件、证据与负责人是 build-plan 写 Appendix A 与 Phase 契约的直接输入。
3. `## 原始需求` 的 18 条 R 与痛点／旅程／成功·失败边界：spec 的来源绑定与验收边界由此来；逐条 U 全文按 `requirement-change-log.md` 回读。
4. `## 模块清单` 的 19 块决策要点与"前提条件与主要风险"表：build-plan 据此划 Phase 与写全局设计；14 块的原五字段全文（该外置件实测 17 个 `### N` 标题，含 14 个五字段块）按 `module-decision-blocks.md` 回读。
5. `## 工作包与决定` 的四个工作包、方向审查真实执行事实与 grill 裁决：消费者与失败恢复路径是 spec 的必要输入。
6. 本节索引的 **14 条**指针与 `## 未决项` 的已裁结论：它是全部过程原件的唯一到达条件表。

按同一条判据外置的内容：17 条需求变更记录、68 条已知事实、更正与过程记录、34 条未确认项、9 条冲突的全部裁定、覆盖矩阵逐项结论、写集的历史对账明细、14 块原五字段文本（该件标题共 17 个 `### N`，14 个为五字段块）、对抗检查 29 条判据与方向审查 11 条处置——这些是证明与过程，build-plan 只在需要核对时才按指针回读。

完成判据：每条指针说明基准目录、唯一原件定位、到达条件与主文留什么；缺失逐项说明；每类事实只留一份原始件。

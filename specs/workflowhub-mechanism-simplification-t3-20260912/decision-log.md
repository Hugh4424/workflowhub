# 决策记录 · workflowhub-mechanism-simplification-t3-20260912

## 任务身份

| 项 | 值 |
| --- | --- |
| project | workflowhub |
| task_id | `workflowhub-mechanism-simplification-t3-20260912` |
| stage | make-decision |
| worktree | `/Users/Hugh/Hugh/Project/workflowhub-workflowhub-mechanism-simplification-t3-20260912` |
| branch | `task/workflowhub/workflowhub-mechanism-simplification-t3-20260912` |
| baseline_commit | `3a061d4b9d19d1e42e41fe190aa2c8ed4d00c9a5`（= 主仓 `main` HEAD，开工实测；bootstrap 返回值） |
| task_path | `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-mechanism-simplification-t3-20260912`（bootstrap 实际落盘值；注意 bootstrap 的 stdout 打印的是配置解析值 `/Users/Hugh/Knowledge/...`，两者不同，见 §4 事实 F-11） |
| created_at | 2026-09-12 |
| 交付组 | **任务Ⅲ = 批次 ⑦ → ⑧（卡号 C7 → C8）**，一条合并列车；本记录在 step 1–2 阶段附带一个**待用户裁决的范围问题**（见 §2 OI-07）：是否把「PaperBuilder M1 现场撞出的四条阻塞」并入本任务 |
| 需求来源（只读参考） | 任务组 PRD `specs/workflowhub-mechanism-simplification-20260910/prd.md`（4,347 行，本任务工作树内）与其母决定 `specs/workflowhub-mechanism-simplification-20260910/decision-log.md` |
| 现场阻塞报告（只读参考） | `/Users/Hugh/Downloads/workflowhub-defects-from-paperbuilder-m1.md`（420 行，2026-09-12 由 PaperBuilder M1 任务现场产出） |
| 前序任务Ⅰ | **已合入 + 已归档**：merge `9f9d0c44`，四材料归档在 `specs/archive/workflowhub-mechanism-simplification-t1-20260911/`（归档提交 `35a6fb6f`） |
| 并发任务Ⅱ | **在研，未合入**：worktree `/Users/Hugh/Hugh/Project/workflowhub-workflowhub-mechanism-simplification-t2-20260911`，branch `task/workflowhub/workflowhub-mechanism-simplification-t2-20260911`（实测**无独立提交**，与 `main` 同点 `35a6fb6f` 起步；四份材料已产出，代码改动尚在工作区） |
| 任务类型 | 普通任务 |

> **任务类型声明（唯一一条，先于第一个正式需求问题写入）**：本任务按 **`普通任务`** 执行。
> 依据：用户 §1 原话要的是「按标准 WorkflowHub 做完第三个任务、让阻塞消失」，本任务的实体是仓库改造（治理同步 + runtime 缺陷修复 + 验收），不是纯规划产物。
> 读回方式：现有纯读函数 `readTaskTypeFromDecisionLog(markdown)`；本行是本文件唯一一处 `任务类型` 声明。
> 若用户在 Talk 中改判为 `规划任务`，则旧的按 `普通任务` 深度提出的问题与产物在逐条重新处理前不再被消费（现有技能规则，不新增状态）。

---

## 原始需求（用户原话，未改写）

| 需求 | 对应决定 | 状态 |
| --- | --- | --- |
| R-001 路线 = 任务Ⅲ | D-001 / D-007 | covered |
| R-002 任务Ⅱ 在研未合入 | D-007（T-012 集成顺序） | covered |
| R-003 所有已知阻塞消失 | D-002 / D-003（判据 + 权威清单） | covered |
| R-004 「总是出现类似阻塞」的模式 | D-002（八类防护 owner） / D-014 | covered |
| R-005 现场四条缺陷报告 | D-001 / D-004 / D-005 | covered |
| R-006 按标准五阶段、不跳阶段 | D-014（三处人工确认点） / OI-17 | covered |
| R-007 不依赖 build-spec 补需求 | 本材料 §8 逐条落地（C7/C8 全覆盖） | covered |
| R-008 六类边界共同梳理 | D-014（T-015 六类确认稿） | covered |
| R-009 上下文控制与子代理派发 | D-015 / OI-23 | covered |
| R-010 Talk/Grill 大白话 | 本材料 §5（四轮问题卡均含后果与风险） | covered |
| R-011 worktree 已建 + 官方 bootstrap | §4 F-01 | covered |
| R-012 任务Ⅲ = C7 → C8 | §8.1 / §8.2 | covered |
| R-013 C7 的 17 FR / 13 AC | §8.1 逐条落地 | covered |
| R-014 C8 的 10 FR / 9 AC | §8.2 逐条落地 | covered |
| R-015 X50–X56 归任务Ⅲ | D-006 / D-008 / §4.3 | covered |
| R-016 四条缺陷内容 | D-004 / D-005 / §4.2 / §4.4 | covered |
| R-017 Talk 真实答复为需求权威 | 全篇 D-001 ~ D-016 的来源列 | covered |
| R-018 PRD E-1 ~ E-20 排除项 | D-014（非目标沿用） | covered |
| R-019 hash 净减方向 | D-009 / §8.3（hash 用法清单） | covered |

> 请检查“/Users/Hugh/Hugh/Project/workflowhub/specs/workflowhub-mechanism-simplification-20260910/prd.md”，我准备开始其中第3个任务了。第一个任务已经提交，第2个任务已经完成了设计和计划“/Users/Hugh/Hugh/Project/workflowhub-workflowhub-mechanism-simplification-t2-20260911/specs/workflowhub-mechanism-simplification-t2-20260911”，正在研发中。
> 我希望现按标准 WorkflowHub 开始这个第3个任务吧，希望第三个任务做完所有workflowhub的阻塞都能消失。最近总是出现“/Users/Hugh/Downloads/workflowhub-defects-from-paperbuilder-m1.md”类似的阻塞。
> 先创建worktree，然后从 make-decision 开始，不要跳阶段，也不要依赖 build-spec 补需求。先基于原始需求，在make-decision的过程中和我一起仔细梳理完整用户流程、页面范围、数据状态、成功/失败边界、非目标和延期项。注意主会话上下文控制和子代理派发。Talk 和grill请用大白话说明选项、后果和风险；

### 1.1 可再生原始需求索引

本表只把 §1 原话与既有上游条目建立导航，不新增产品决定、不改写 PRD、不替代原文。

| Source ID | 原始来源 | 当前含义 |
| --- | --- | --- |
| R-001 | §1 原话第 1 句 | 本任务的路线来源 = PRD 的**第 3 个任务**（任务Ⅲ）；任务Ⅰ 已合入，任务Ⅱ 在研未合入 |
| R-002 | §1 原话第 1 句 | 任务Ⅱ 已产出四份材料（decision-log / spec / plan / tasks）且正在研发；本任务必须处理与它的**合并顺序与同文件冲突** |
| R-003 | §1 原话第 2 句 | **核心目标**：第三个任务做完之后，WorkflowHub 的**已知阻塞全部消失**（判据待定，见 OI-05） |
| R-004 | §1 原话第 2 句 | 用户的痛点**不是**某一条具体缺陷，而是「总是出现类似 PaperBuilder 报告这样的阻塞」这一**反复发生的模式** |
| R-005 | §1 原话第 3 句 | 现场证据：`/Users/Hugh/Downloads/workflowhub-defects-from-paperbuilder-m1.md`（四条缺陷报告） |
| R-006 | §1 原话第 4 句 | 流程纪律：按标准 WorkflowHub 五阶段执行；**不跳阶段** |
| R-007 | §1 原话第 4 句 | **不得依赖 build-spec 补需求**：方向、边界、非目标必须在 make-decision 内定完 |
| R-008 | §1 原话第 4 句 | make-decision 内必须与用户共同梳理六类：完整用户流程 / 页面范围 / 数据状态 / 成功失败边界 / 非目标 / 延期项 |
| R-009 | §1 原话第 4 句 | 主会话只收摘要，重读量动作派子代理（上下文纪律） |
| R-010 | §1 原话第 5 句 | Talk 与 Grill 一律用大白话说明选项、后果、风险；用户可以只回编号 |
| R-011 | 本会话已执行事实 | **worktree 已由官方 bootstrap 创建**：`node tools/cli/task-bootstrap.mjs --project=workflowhub --task=<本任务> --target-repo=/Users/Hugh/Hugh/Project/workflowhub`，输出 worktree/branch/baseline 与 task store；见 §4 F-01/F-11 |
| R-012 | PRD `### 任务地图` 任务Ⅲ 行（`prd.md:116-117`） | 任务Ⅲ = C7（治理同步，consumer = C8 + 未来所有改动）+ C8（双证验收，consumer = 用户） |
| R-013 | PRD `#### C7` 卡（`prd.md:3401-3646`） | C7：17 条 FR / 13 条 AC / 18 字段；治理文字与代码事实逐条一致 + 宪法负向条款 + 分类学常驻规则 + 父材料 X1–X14 更正 + 清零 10+2+82 条预存在 FAIL + `operations/close/**` 多文件计划收敛 |
| R-014 | PRD `#### C8` 卡（`prd.md:3649-3901`） | C8：10 条 FR / 9 条 AC；静态净减法 + M1–M5 对照 C0 基线 + D-015③ 链路验收 + 不可证伪标 `unknown` + 异源复核 |
| R-015 | 母材料与 PRD 的 X 清单（共 51 条，`prd.md:4231-4259`） | X50–X56 归任务Ⅲ；X1–X14 由 C7 在父材料文本侧更正 |
| R-016 | PaperBuilder 报告 `## 摘要` | 四条缺陷：① stage 行永久 stale（P0，阻挡任务收口）；② 旧审查结果路径身份不符不可消费；③ spec-analyze 静默跳过内容收敛检查；④ `direction_change` 类 finding 无「已由材料修复」终态 |
| R-017 | 本会话 Talk Round 1 / 2 / 3 的真实答复 | 见 §5 T 表；**本任务的需求权威**（凡与 PRD 冲突，以用户答复为准） |
| R-018 | PRD `### 明确排除` E-1 ~ E-20（`prd.md:156-183`） | 已裁定排除项；本任务的非目标草案默认沿用，其中 E-13（不产出延期项）与 E-20（宿主 worktree 增殖按 `non_goals` 登记）与本任务直接相关 |
| **R-019（本会话新增）** | 用户 R4-Q1 的真实原话 | **hash 净减方向**：「我希望整个workflowhub以后尽量不要再出现hash了，这是明显过程工程化的产物」⇒ 本任务承担：① 宪法层写出「**默认不新增 hash**，新增必须先证明必要」；② 产出一份**现有 hash 用法清单**（逐项分类：身份绑定 / 完整性校验 / 过程化产物）+ 逐条处置（本任务删 / 保留并写明为何不是过程化产物）；③ 不新增任何 hash 字段或校验 |

## 1.5 需求框架预设（先于研究/Talk 选定）

- **framework**：`functional`（背景 → 问题 → 目标 → 方案 → 验收 → 扩展）。
- **选择理由**：本任务是「把一套既有机制的治理文字与代码事实对齐 + 把现场撞出的阻塞收干净」，主体是行为/结构改动与验收，不是证据研究；上游 PRD 与 PaperBuilder 报告已把大部分事实研究做完，本阶段只需在既有节点下回填与收敛。
- **回填规则**：Talk、调研、审查、Grill 只更新本份 `decision-log.md` 的 OI 表（§2），不新建第二张表。混合内容以 `functional` 为外层。
- **六个功能骨架节点**：`background` / `problem` / `goal` / `solution` / `acceptance` / `extension`。
- **六类固定类别**：`complete_user_flow` / `page_scope` / `data_state` / `success_failure_boundary` / `non_goals` / `deferred`。

---

## 2. OI 大纲（唯一当前版本 · 版本 v1 · Round 2 收敛后；Talk 各轮只更新本表）

> 身份绑定：本表全部 OI 绑定 `task_id = workflowhub-mechanism-simplification-t3-20260912`、`outline_version = v1`。
> 状态取值只用四个合法值：`open` / `confirmed` / `deferred` / `not_applicable`。**Round 1 收敛 8 条、Round 2 再收敛 13 条，合计 21 条已有终态；仅 OI-15 仍 `open`，留给 Round 3（方向审查后）**；Talk 各轮只更新本表。
> 本表是本阶段唯一权威 OI 清单；§2.4 的 YAML 块是同一批记录（同一 `oi_id`），供现有 `analyzeDecisionOutline` 读取；两者同源，不得各写一套。

### 2.0 OI 骨架覆盖表（机器可读契约）

| framework_node | oi_ids | empty | reason |
| --- | --- | --- | --- |
| background | OI-01 OI-02 | false | — |
| problem | OI-03 OI-04 | false | — |
| goal | OI-05 OI-06 | false | — |
| solution | OI-07 OI-08 OI-09 OI-10 OI-11 OI-23 | false | — |
| acceptance | OI-12 OI-13 OI-14 | false | — |
| extension | OI-15 OI-16 OI-24 | false | — |

| category | oi_ids | empty | reason |
| --- | --- | --- | --- |
| complete_user_flow | OI-06 OI-17 OI-23 | false | — |
| page_scope | OI-18 | false | — |
| data_state | OI-02 OI-03 OI-04 OI-10 OI-19 | false | — |
| success_failure_boundary | OI-05 OI-08 OI-09 OI-11 OI-12 OI-13 OI-14 OI-15 OI-20 | false | — |
| non_goals | OI-01 OI-07 OI-16 OI-21 OI-24 | false | — |
| deferred | OI-22 | false | — |

> **口径说明**：每条 OI 记录的 `category` 取**六类固定类别**之一（现有分析器 `analyzeDecisionOutline` 的取值约束）；它属于哪一个**功能骨架节点**由 §2.1 的「节点」列与上表表达，两处同源。

### 2.1 需求框架节点（Round 1 收敛后）

| OI | 节点 · 类别 | 问题 / 未知（大白话） | 来源 | 状态 |
| --- | --- | --- | --- | --- |
| OI-01 | background · non_goals | 这次要做的「第三个任务」到底以谁为准：是 PRD 里写死的任务Ⅲ（C7 治理同步 + C8 双证验收），还是现场新出现的四条阻塞也要算进来？PRD 是不是唯一的路线来源？ | 用户 §1 原话 + `prd.md:116-117` | confirmed |
| OI-02 | background · data_state | 这四条阻塞为什么现在才冒出来？它们和 PRD 里已经登记的 51 条 X（X1–X56）是什么关系——是同一批问题的漏网，还是全新一类？ | PaperBuilder 报告 + `prd.md:4231-4259` | confirmed |
| OI-03 | problem · data_state | 现在仓库里「文档说的」和「代码做的」到底差多少处？任务Ⅲ 的 C7 要靠一张逐条对照表把它们对齐——这张表的范围（哪些文件、判到什么程度算对齐）还没有边界 | `prd.md:3405` C7 §1 + §2 | confirmed |
| OI-04 | problem · data_state | 四条阻塞在今天的 HEAD 上是否真的成立？现在有没有任何一张卡（C0–C9）或任务Ⅱ 认领它们？如果没有认领，谁来做？ | PaperBuilder 报告 + 本任务事实核查（§4 F-20…F-27） | confirmed |
| OI-05 | goal · success_failure_boundary | 「所有 workflowhub 的阻塞都能消失」怎么算数：① 八大类阻塞各自都有防护和 owner（口径层面的「不再反复发生」）；② 当前已知的具体阻塞逐条清零（事实层面的「现在就没阻塞」）；③ 两者都要？ | 用户 §1 原话第 2 句 + `prd.md:143`（R-006 行） | confirmed |
| OI-06 | goal · complete_user_flow | 任务Ⅲ 做完之后，你（人）能在什么地方看到「阻塞真的没了」？是一份逐条账、一组可复算命令，还是别的形态？ | 用户 §1 原话 + `prd.md:3653` C8 §1 | confirmed |
| OI-07 | solution · non_goals | **本任务的范围边界**：只做 PRD 的任务Ⅲ（C7+C8），还是把 PaperBuilder 四条阻塞一起做进来？三种走法各自的后果与风险见 Talk Round 1 的问题 1 | 用户 §1 原话第 2 句 + `prd.md:116-117` | confirmed |
| OI-08 | solution · success_failure_boundary | 四条阻塞的落点与顺序：A 在本任务里先修（它们很小、修完能让 PaperBuilder 立刻解锁）；B 等任务Ⅱ 合入后再在 C7 之前修；C 完全交给另一个任务 | PaperBuilder 报告 `## 建议优先级` + 本任务事实核查 | confirmed |
| OI-09 | solution · success_failure_boundary | 与在研任务Ⅱ 的合并顺序：任务Ⅱ 尚未合入，而 C7 明确要求「C6 先合、C7 后合」；四条阻塞的修复又会碰 runtime 同一批文件。谁先合、冲突谁负责 | `prd.md:3791-3792` + 本任务实测（§4 F-15） | confirmed |
| OI-10 | solution · data_state | **已经写坏的现场数据怎么办**：PaperBuilder 那个任务里已经落盘了一条「自己读不回来」的 stage 行，光修代码不会让它自己变好。是提供一次性最小修复、还是只修代码并如实登记、还是给出可人工执行的恢复路径？ | PaperBuilder 报告 缺陷 1 §(5) + `/Users/Hugh/Knowledge/.../paperbuilder-m1-stable-surfaces/facts.jsonl` | confirmed |
| OI-11 | solution · success_failure_boundary | 预存在的红怎么收：markdownlint（全仓 610 条 / 其中无关 specs 目录 500 条）+ `verify-structure.mjs`（CONTEXT.md 术语 2 个问题，HEAD exit 1）+ path-guard（已 0）分别怎么处置？是加窄 ignores、逐条修，还是如实登记为已知红基线？（PRD 已裁定「必须显式处置、不得放宽断言」，但没定选哪条） | `prd.md:3467` C7-AC-5 + X50 + F-19/F-22/F-23 + 方审 B3 | confirmed |
| OI-12 | acceptance · success_failure_boundary | 验收 oracle 集合：C7 的 13 条 AC + C8 的 9 条 AC 是否原样沿用？如果四条阻塞并进来，它们的验证判据（含历史坏行是否必须真的能读回来）是什么？ | `prd.md:3459-3475`、`prd.md:3691-3703` | confirmed |
| OI-13 | acceptance · success_failure_boundary | 异源复核怎么算完成：谁来做（非本任务主会话、独立上下文、不同底层模型）、复核什么、不可用时是否如实记 `unavailable` 而不是判通过 | `prd.md:3702` C8-AC-8 + 宪法 Q3 | confirmed |
| OI-14 | acceptance · success_failure_boundary | 基线口径：PRD 记的三个红基线是 216a546d 时点的值，任务Ⅰ 与本任务实测都已漂移。本任务是否一律以**本任务开工 HEAD 重测值**为准，且不等同于 PRD 数字 | `prd.md:3467` + 本任务 §4.1 实测 | confirmed |
| OI-15 | extension · success_failure_boundary | 防未来再长回来：宪法负向条款（已裁定不采纳清单）+ 阻塞分类学常驻规则 + 守卫三要件，怎么核验它们真的进了宪法与 checklist（而不是只写在 decision-log 里） | `prd.md:3445-3447` C7-FR-5/6/7 | confirmed |
| OI-16 | extension · non_goals | 与后续的交接边界：任务Ⅲ 是三个交付组的末位；它做完之后还有没有「下一个任务」要接的东西（例如仓外宿主/broker、3rd-review 仓的判死逻辑） | `prd.md:178-181` E-17/E-20 + G-4 | confirmed |
| OI-17 | complete_user_flow | 完整用户流程：从这次开工到 close，你（人）在每个节点看到什么、要做什么决定、哪些事绝对不会来烦你（不需要你确认）？ | 用户 §1 原话 + `docs/standard-workflow.md` 五阶段 + close 三义 | confirmed |
| OI-18 | page_scope | 页面范围：这次改动会碰任何页面/界面/可视化吗？PRD 判 `non_ui`（唯一「人看的输出」是命令行文本）。这个判定在本任务要不要因为新增的修复而重算 | 用户 §1 原话（页面范围）+ `prd.md:28` | not_applicable |
| OI-19 | data_state | 数据与状态：本任务会写/读哪些持久对象（四份材料、`facts.jsonl` 的 K2 行、任务 store 的 `quality/**`、审查 attempt/result、finding 处置、`operations/close/**` 计划对象）？每条数据的「谁写、谁读、失效条件」是什么 | `prd.md:59-71` K1–K9 + 四条阻塞涉及的对象 | confirmed |
| OI-20 | success_failure_boundary | 成功/失败/取消/重试/恢复：哪一步失败就停在哪一步？哪些失败可以原地重试、哪些必须重新取得用户确认？「做到一半卡住」时你怎么知道卡在哪 | 用户 §1 原话 + `docs/standard-workflow.md:159-163` make-decision 完成与失败边界 | confirmed |
| OI-21 | non_goals | 非目标：PRD 的 E-1 ~ E-20 是否原样沿用？本任务要不要新增非目标（例如「不为四条缺陷新增任何控制面」「不动历史字节」「不修宿主能力」） | `prd.md:156-183` + 用户 §1 原话 | confirmed |
| OI-22 | deferred | 延期项：你明确说过「不希望有延期任务」。那么跨仓（3rd-review 判死逻辑）、宿主能力（宿主认证/宿主自建 worktree）这类仓外项，是登记成**非目标**（影响面写清、不阻断阶段）还是**延期项**（带 owner/触发条件/消费者/关闭条件） | 用户 §1 原话 + `prd.md:174` E-13 + E-17/E-20 | confirmed |
| OI-23 | solution · complete_user_flow | 执行纪律：你原话里的「注意主会话上下文控制和子代理派发」怎么落成可核对的约束（重读量动作点派子代理、主会话只收摘要），以及它是否进入本任务的验收面 | 用户 §1 原话（R-009）+ 方审 B12 | confirmed |
| OI-24 | extension · non_goals | **hash 净减方向**：你说「以后尽量不要再出现 hash，这是过程工程化的产物」——这句话怎么落成可核对的约束？现有那些 hash（身份绑定、完整性校验、材料 digest、审查/证据哈希）里，哪些本任务就该删、哪些必须留下并写明「它不是过程化产物」？ | 用户 R4-Q1 真实原话（R-019） | confirmed |

### 2.2 六类固定类别（Round 1 收敛后）

| category | 归属 OI | 这一格回答什么 |
| --- | --- | --- |
| complete_user_flow | OI-06 / OI-17 | 人从开工到 close 的旅程，以及「阻塞消失」在什么场景下被人看见 |
| page_scope | OI-18 | 是否涉及页面/界面/可视化（三输入判定，非调用方标签） |
| data_state | OI-02 / OI-03 / OI-04 / OI-10 / OI-19 | 记录、事实与状态的读写者、失效条件，以及已写坏现场数据的处置 |
| success_failure_boundary | OI-05 / OI-08 / OI-09 / OI-11 / OI-12 / OI-13 / OI-14 / OI-20 | 成功判据、失败停点、可重试与需重新确认的边界、基线口径 |
| non_goals | OI-01 / OI-07 / OI-15 / OI-16 / OI-21 | 上游效力边界、本任务范围边界、明确不做的事 |
| deferred | OI-22 | 延期项与非目标的区分（用户要求零延期） |

> 每条 OI 的完整问题文本见 §2.1（唯一权威）；本表只表达「固定类别 → OI」的归属，与 §2.0 同源。

### 2.3 需求到决策覆盖矩阵（Round 2 收敛后）

| 维度 | 覆盖 OI | 终态 |
| --- | --- | --- |
| 业务目标 | OI-05 · OI-06 | confirmed |
| 流程与表面 | OI-17 · OI-18 | confirmed / not_applicable |
| 数据与状态 | OI-19 | confirmed |
| 成功失败与验收 | OI-12 · OI-13 · OI-14 · OI-20 | confirmed |
| 约束、非目标与延期 | OI-21 · OI-22 | confirmed |
| 方案细节边界 | OI-03 · OI-07 · OI-08 · OI-09 · OI-10 · OI-11 | confirmed |
| 上游效力与基线 | OI-01 · OI-02 · OI-04 · OI-16 confirmed；OI-15 open（Round 3） | 除 OI-15 外 confirmed |

### 2.4 OI 机器可读记录（与 §2.1 / §2.2 同源 · Round 2 收敛后）

```yaml
task_id: workflowhub-mechanism-simplification-t3-20260912
outline_version: v1
ois:
  - oi_id: OI-01
    task_id: workflowhub-mechanism-simplification-t3-20260912
    outline_version: v1
    framework_node: background
    category: non_goals
    source: "用户 §1 原话 + prd.md:116-117"
    question: "第三个任务以谁为准：PRD 任务Ⅲ（C7+C8）还是现场四条阻塞也算进来？PRD 是否唯一路线来源？"
    status: confirmed
    selected_disposition: "用户选 A（R1-Q1）：任务Ⅲ（C7+C8）+ 四条阻塞，一个任务收口；PRD 是路线基线，本任务四份材料为唯一权威"
    impact_dimensions: [scope]
    requires_user_decision: true
    visible_group_id: R1
    evidence: "用户 R1 真实答复 Q1A；§4.2 核查表；prd.md:116-117"
    acceptance: "本任务材料同时覆盖 C7 的 17 条 FR、C8 的 10 条 FR 与四条阻塞各自的修复与验证"
    counterexample: "若只做 C7+C8 而未覆盖四条阻塞（或反之）、或把四条推给其他任务，判不符合"
  - oi_id: OI-02
    task_id: workflowhub-mechanism-simplification-t3-20260912
    outline_version: v1
    framework_node: background
    category: data_state
    source: "PaperBuilder 报告 + prd.md:4231-4259"
    question: "四条阻塞与 PRD 已登记的 51 条 X 是什么关系：漏网同类还是全新一类？"
    status: confirmed
    selected_disposition: "事实（§4.2）：四条在 PRD 的 51 条 X 中零命中，属未登记的新一类（记录身份与降级语义），在本任务内登记"
    impact_dimensions: [ordinary_detail]
    requires_user_decision: false
    evidence: "§4.2 + 子代理 grep（PRD 零命中 STAGE_FACT_MATERIALS / material_scope_revision / verifyReviewChain / direction_change / hasMarkdownHeadings）"
    acceptance: "每条阻塞在材料内有具名条目（现象/根因/修复/验证），并归入现有八类阻塞分类学之一"
    counterexample: "若把四条说成 X 清单里已有条目（未实测）、或不予登记，判不符合"
  - oi_id: OI-03
    task_id: workflowhub-mechanism-simplification-t3-20260912
    outline_version: v1
    framework_node: problem
    category: data_state
    source: "prd.md:3405 C7 §1 与 §2"
    question: "治理文字与代码事实的不一致对照表，范围与判据边界是什么？"
    status: confirmed
    selected_disposition: "用户选 A（R2-Q3）：对照表只覆盖 PRD C7 点名的对象 + 本任务实际改动的文件（约 15 项），不做全仓逐条对照"
    impact_dimensions: [acceptance]
    requires_user_decision: true
    visible_group_id: R2
    evidence: "用户 R2 真实答复 Q3A；prd.md:3413-3418（C7 §2 对象清单）"
    acceptance: "对照表逐行给出「文档表述 ↔ 代码事实」且逐行可复核；本任务范围内无「仍矛盾」行"
    counterexample: "出现未消解矛盾行、或漏掉 C7 §2 点名的对象，判不符合"
  - oi_id: OI-04
    task_id: workflowhub-mechanism-simplification-t3-20260912
    outline_version: v1
    framework_node: problem
    category: data_state
    source: "PaperBuilder 报告 + 本决策记录 §4.2（HEAD 逐条锚点核查表）"
    question: "四条阻塞在 HEAD 上是否成立？C0–C9 或任务Ⅱ 是否已认领？若无人认领，谁做？"
    status: confirmed
    selected_disposition: "用户选 A（R1-Q1）：四条在 HEAD 全部成立、此前无任何卡或任务Ⅱ 认领，归属本任务"
    impact_dimensions: [scope]
    requires_user_decision: true
    visible_group_id: R1
    evidence: "§4.2 逐条锚点核查表；缺陷 1 现场复现（one=be6aea66… / four=4be44b28…）"
    acceptance: "四条各自在 build-code 有测试或命令证据（缺陷 1 的判据以 **D-005 / OI-10 的 R3-Q2=C 版本**为准：写侧改用该 stage 的 scope 指纹 + 新增窄回归测试 + 历史坏行如实登记；**不再要求现场读回**）"
    counterexample: "若某条在 HEAD 不成立（锚点不存在）、或修复后同类新行仍写错指纹，判不符合"
  - oi_id: OI-05
    task_id: workflowhub-mechanism-simplification-t3-20260912
    outline_version: v1
    framework_node: goal
    category: success_failure_boundary
    source: "用户 §1 原话第 2 句 + prd.md:143"
    question: "「所有阻塞消失」的判据：八类各有防护与 owner、具体阻塞逐条清零、还是两者都要？"
    status: confirmed
    selected_disposition: "用户选 A（R1-Q2）：两条都要 —— ① 已知阻塞逐条清零（现象→根因→修复→验证命令→证据）；② 八类阻塞逐类有防护与 owner"
    impact_dimensions: [goal]
    requires_user_decision: true
    visible_group_id: R1
    evidence: "用户 R1 真实答复 Q2A；prd.md:81-82（八类分类学）；prd.md:143（R-006）"
    acceptance: "C8 验收账本同时给出逐条处置与证据、以及八类逐类的防护与 owner 归属"
    counterexample: "只写分类学不修具体阻塞、或只修具体阻塞不写防护与 owner，均判不符合"
  - oi_id: OI-06
    task_id: workflowhub-mechanism-simplification-t3-20260912
    outline_version: v1
    framework_node: goal
    category: complete_user_flow
    source: "用户 §1 原话 + prd.md:3653"
    question: "任务Ⅲ 做完后，人能在什么地方观察到「阻塞真的没了」？"
    status: confirmed
    selected_disposition: "用户选 A（R1-Q2/Q3，**判据已被 R3-Q2=C 取代**）：形态 = 逐条阻塞账（编号/现象/根因/修复/验证命令/证据）+ 一组可复算命令；缺陷 1 的条目以**写侧修复 + 窄回归测试**为证据（现场读回已由 T-017 取消：受害任务已结束）"
    impact_dimensions: [goal]
    requires_user_decision: true
    visible_group_id: R1
    evidence: "用户 R1 真实答复 Q2A；**T-017（R3-Q2=C）取代其中的现场读回要求**；§4.2 复现命令"
    acceptance: "第三方按账中命令可复算出同一结论；「阻塞消失」不依赖口头声明"
    counterexample: "账中只有结论没有命令或证据、或未实测现场读回即宣称消失，判不符合"
  - oi_id: OI-07
    task_id: workflowhub-mechanism-simplification-t3-20260912
    outline_version: v1
    framework_node: solution
    category: non_goals
    source: "用户 §1 原话第 2 句 + prd.md:116-117"
    question: "本任务范围：只做 C7+C8，还是把四条阻塞一起做进来？"
    status: confirmed
    selected_disposition: "用户选 A（R1-Q1）：范围 = C7 + C8 + 四条阻塞，一个任务、一条合并列车"
    impact_dimensions: [scope]
    requires_user_decision: true
    visible_group_id: R1
    evidence: "用户 R1 真实答复 Q1A"
    acceptance: "材料同时含 C7/C8 的 FR/AC 与四条阻塞的 FR/AC；除既有卡片外不新增控制面"
    counterexample: "把四条阻塞排除出本任务、或把 C7/C8 拆到别的任务，判不符合"
  - oi_id: OI-08
    task_id: workflowhub-mechanism-simplification-t3-20260912
    outline_version: v1
    framework_node: solution
    category: success_failure_boundary
    source: "PaperBuilder 报告建议优先级 + 本决策记录 §4.2"
    question: "四条阻塞的落点与顺序：本任务先修、等任务Ⅱ 后修、还是交给另一个任务？"
    status: confirmed
    selected_disposition: "用户选 A（R2-Q2）：四条修复排在 C7 之前（先解现场，再做治理对齐）；C7 的对照表按修复后的代码事实产出"
    impact_dimensions: [scope]
    requires_user_decision: true
    visible_group_id: R2
    evidence: "用户 R2 真实答复 Q2A"
    acceptance: "批次顺序表里四条批次先于 C7 批次；C7 对照表的代码侧事实取自修复后的树"
    counterexample: "四条排到 C7 之后、或与 C7 混成一批无法切分，判不符合"
  - oi_id: OI-09
    task_id: workflowhub-mechanism-simplification-t3-20260912
    outline_version: v1
    framework_node: solution
    category: success_failure_boundary
    source: "prd.md:3791-3792 + 本任务实测 §4"
    question: "与在研任务Ⅱ 的合并顺序与同文件冲突责任如何定？"
    status: confirmed
    selected_disposition: "用户选 A（R2-Q1）+ 用户补充约束：**任务Ⅲ 的 build-code 必须在任务Ⅱ 完全合并之后才开始**；等待期只产出本任务四份材料（make-decision / build-spec / build-plan），不改仓库任何文件"
    impact_dimensions: [scope]
    requires_user_decision: true
    visible_group_id: R2
    evidence: "用户 R2 真实原话：'Q1A 任务3会在任务2完全合并之后再开始build-code'；F-04/F-24（任务Ⅱ 无独立提交、落后 main 两个提交）"
    acceptance: "开工 build-code 前实测任务Ⅱ 的合并提交已是 HEAD 祖先；四条修复不再与任务Ⅱ 在途改动冲突"
    counterexample: "在任务Ⅱ 完全合并前改 runtime 或治理文件（哪怕自认为不冲突），判不符合"
  - oi_id: OI-10
    task_id: workflowhub-mechanism-simplification-t3-20260912
    outline_version: v1
    framework_node: solution
    category: data_state
    source: "PaperBuilder 报告缺陷 1 §(5) + 受害任务 facts.jsonl（PaperBuilder/tasks/paperbuilder-m1-stable-surfaces）"
    question: "已写坏的现场 stage 行如何处置：一次性最小修复、只修代码并如实登记、还是给人工恢复路径？"
    status: confirmed
    selected_disposition: "用户改选 C（R3-Q2，附补充事实）：**只修写侧**；现场读回**不作**验收项 —— 原话「受害任务已经结束，无法真跑现场了」。补偿判据 = ① 写侧在无 stage outcome 的 stage end 上产出该 stage 自己的 scope 指纹；② 新增**针对性回归测试**（该路径当前零覆盖）；③ 受害任务的历史坏行**如实登记为不可恢复的历史事实**（不迁移、不改字节、不建兼容桥）"
    impact_dimensions: [scope]
    requires_user_decision: true
    visible_group_id: R3
    evidence: "用户 R3 真实原话：'R3-Q2：C，受害任务已经结束，无法真跑现场了'；F-13 现场行实测（4be44b28… vs be6aea66…）；§4.4 缺陷 1 行"
    acceptance: "写侧改动后 make-decision / build-spec 的行指纹等于该 stage 的 scope 指纹；新增的窄测试覆盖该路径；历史坏行在材料中有具名登记且未被改写"
    counterexample: "声称现场已读回（实际未跑）、为修它迁移历史字节或新增兼容桥、或把历史行改写成「已恢复」，判不符合"
  - oi_id: OI-11
    task_id: workflowhub-mechanism-simplification-t3-20260912
    outline_version: v1
    framework_node: solution
    category: success_failure_boundary
    source: "prd.md:3467 C7-AC-5 + X50 + 方审 B3"
    question: "预存在的红如何清零：markdownlint（全仓 610 / 无关 specs 目录 500）+ verify-structure（CONTEXT.md 术语 2 问题）+ path-guard（已 0）分别怎么处置？"
    status: confirmed
    selected_disposition: "用户选 A（R1-Q4）+ **R3-Q1=A 已定路线**：与本任务无关的 specs 目录加窄 ignores（写明理由与 owner，沿用既有惯例）+ 其余逐条修 + 本任务材料 0 + 新增红判失败。`verify-structure.mjs`（HEAD exit 1，CONTEXT.md 术语 2 问题）的路线 = **改 CONTEXT.md**（补第五阶段「验收（test-acceptance）」别名 + 改写触发 denylist 的 3 处路径措辞），**不动守卫脚本**（T-016）"
    impact_dimensions: [acceptance]
    requires_user_decision: true
    visible_group_id: R1
    evidence: "用户 R1 真实答复 Q4A；F-19/F-22/F-23（全仓 610、specs 500/22 文件、archive 已被忽略、path-guard 已 0、父材料 82）"
    acceptance: "全仓 markdownlint 不劣化于本任务 HEAD 基线且本任务范围内清零；新 ignores 条目有理由与 owner；path-guard 保持 0；verify-structure 清零"
    counterexample: "用放宽断言或大范围忽略目录凑绿、或使任一计数上升，判不符合"
  - oi_id: OI-12
    task_id: workflowhub-mechanism-simplification-t3-20260912
    outline_version: v1
    framework_node: acceptance
    category: success_failure_boundary
    source: "prd.md:3459-3475 与 prd.md:3691-3703"
    question: "验收 oracle 集合是否原样沿用？四条阻塞并入后如何验证（含历史坏行是否必须真能读回）？"
    status: confirmed
    selected_disposition: "用户选 A（R2-Q4）：沿用 C7 的 13 条 + C8 的 9 条 AC；四条各加一组针对性 oracle；新增红一律判失败"
    impact_dimensions: [acceptance]
    requires_user_decision: true
    visible_group_id: R2
    evidence: "用户 R2 真实答复 Q4A；prd.md:3459-3475、prd.md:3691-3703"
    acceptance: "每条 AC 有 oracle 与失败判据；四条各自的验证命令可被第三方复算出同一结论"
    counterexample: "缺任一条 AC 的失败判据、或用放宽断言凑绿、或让计数上升，判不符合"
  - oi_id: OI-13
    task_id: workflowhub-mechanism-simplification-t3-20260912
    outline_version: v1
    framework_node: acceptance
    category: success_failure_boundary
    source: "prd.md:3702 C8-AC-8 + 宪法 Q3"
    question: "异源复核谁做、复核什么、不可用时是否如实记 unavailable？"
    status: confirmed
    selected_disposition: "用户选 A（R2-Q5）：一次真实 wh-review 异源审查（broker → 外部 provider，非本会话、不同底层模型）+ 一次独立子代理复核；不可用如实记 unavailable，绝不判通过"
    impact_dimensions: [acceptance]
    requires_user_decision: true
    visible_group_id: R2
    evidence: "用户 R2 真实答复 Q5A；prd.md:3702（C8-AC-8）；PRD 第四/五轮实测（真实 provider 审查与子代理复核不可互替）"
    acceptance: "复核者身份与底层模型 ≠ 执行者；不可用时记 unavailable；复核结论带具名证据引用"
    counterexample: "自审自判、同源复核、或把 unavailable 写成通过，判不符合"
  - oi_id: OI-14
    task_id: workflowhub-mechanism-simplification-t3-20260912
    outline_version: v1
    framework_node: acceptance
    category: success_failure_boundary
    source: "prd.md:3467 + 本决策记录事实表 F-19/F-22（HEAD 3a061d4b 实测）"
    question: "基线是否一律以本任务开工 HEAD 重测值为准，且不等同于 PRD 记录值？"
    status: confirmed
    selected_disposition: "用户选 A（R2-Q4）：唯一基线 = 本任务开工 HEAD 重测值（全仓 markdownlint 610 / path-guard 0 / verify-structure 2 个问题 / 父材料 82）；PRD 旧数字只作历史"
    impact_dimensions: [acceptance]
    requires_user_decision: true
    visible_group_id: R2
    evidence: "用户 R2 真实答复 Q4A；F-19/F-22"
    acceptance: "所有「不劣化」判据以本任务重测值为基线；第三方按同一条命令可复算"
    counterexample: "沿用 PRD 旧数字导致误判、或不同批次用不同基线，判不符合"
  - oi_id: OI-15
    task_id: workflowhub-mechanism-simplification-t3-20260912
    outline_version: v1
    framework_node: extension
    category: success_failure_boundary
    source: "prd.md:3445-3447 C7-FR-5/6/7（分类按方审 R3/R4/B4 更正）"
    question: "宪法负向条款、分类学常驻规则、守卫三要件如何核验真的进了宪法与 checklist？"
    status: confirmed
    selected_disposition: "用户选 A（R3-Q4）：用**现有判据**核验（C7-AC-3 的负向条款 + 八类分类学 + checklist 条目数=22 的机器守卫 + 本任务材料自检），**不新增检查器**"
    impact_dimensions: [acceptance]
    requires_user_decision: true
    visible_group_id: R3
    evidence: "用户 R3 真实答复 Q4A；tools/cli/verify-structure.mjs:14（EXPECTED_ARTICLES=22）、:26-36（条目数与编号集合校验）、:63-64（checklist 条目数=22）"
    acceptance: "宪法负向条款与 checklist 对照项落盘，且 `node tools/cli/verify-structure.mjs` 的条目数/编号守卫保持通过（22 = 22），材料自检可复算"
    counterexample: "新增专责检查器/计数器（撞 E-11 与 F11），或负向条款只写在 decision-log 而未进宪法，判不符合"
  - oi_id: OI-16
    task_id: workflowhub-mechanism-simplification-t3-20260912
    outline_version: v1
    framework_node: extension
    category: non_goals
    source: "prd.md:178-181 E-17/E-20 + G-4"
    question: "任务Ⅲ 之后的交接边界：仓外宿主/broker 与 3rd-review 判死逻辑如何处理？"
    status: confirmed
    selected_disposition: "事实 + 用户 R2-Q6A：仓外项（3rd-review 判死逻辑、宿主/broker 能力、宿主自建 worktree）按**非目标**登记，写清影响面且不阻断任何阶段结束；本任务零延期"
    impact_dimensions: [ordinary_detail]
    requires_user_decision: false
    evidence: "用户 R2 真实答复 Q6A；prd.md:178-181（E-17/E-20）；G-4"
    acceptance: "材料中有具名非目标条目，且写明影响面与「不阻断阶段结束」结论"
    counterexample: "把仓外能力写成延期项、或声称跨仓能力已验证，判不符合"
  - oi_id: OI-17
    task_id: workflowhub-mechanism-simplification-t3-20260912
    outline_version: v1
    framework_node: complete_user_flow
    category: complete_user_flow
    source: "用户 §1 原话 + docs/standard-workflow.md + close 三义"
    question: "从开工到 close，人看到什么、要决定什么、哪些不会被要求确认？"
    status: confirmed
    selected_disposition: "用户选 A（R2-Q6）：确认完整用户流程 —— 需求 → bootstrap → make-decision（Talk/Grill/审查）→ 用户确认方向 → build-spec → build-plan →（任务Ⅱ 完全合并后）build-code → verify-code → 用户授权 close；需要人的只有三处：方向确认、规格冻结、close 授权"
    impact_dimensions: [ordinary_detail]
    requires_user_decision: true
    visible_group_id: R2
    evidence: "用户 R2 真实答复 Q6A；docs/standard-workflow.md 五阶段与 close 三义"
    acceptance: "材料中的用户流程与三处人工确认点逐条可核对；其余步骤不向用户索取确认"
    counterexample: "在非三处之外新增人工确认点、或把三处之一降级为自动通过，判不符合"
  - oi_id: OI-18
    task_id: workflowhub-mechanism-simplification-t3-20260912
    outline_version: v1
    framework_node: page_scope
    category: page_scope
    source: "用户 §1 原话 + prd.md:28"
    question: "本任务是否涉及页面/界面/可视化？non_ui 判定是否要重算？"
    status: not_applicable
    selected_disposition: "三输入合并 = non_ui（用户 R2-Q6 确认）；唯一「人看的输出」是命令行文本（status / 审查报告 / 验收账）"
    impact_dimensions: [ordinary_detail]
    requires_user_decision: false
    reason: "原始需求无页面诉求、仓库当前无涉及本任务的界面改动、计划改动面全在 runtime/ tools/ skills/ docs/ 与治理文档 ⇒ 三输入一致排除 UI"
    counterexample_boundary: "若四条修复或 C7 第 10 项意外引入需要人看的界面/交互/视觉规格，本条判定立即失效并必须重算三输入"
  - oi_id: OI-19
    task_id: workflowhub-mechanism-simplification-t3-20260912
    outline_version: v1
    framework_node: data_state
    category: data_state
    source: "prd.md:59-71 K1–K9 + 四条阻塞涉及对象"
    question: "本任务读写哪些持久对象，各自的写者、读者、失效条件是什么？"
    status: confirmed
    selected_disposition: "用户选 A（R2-Q6）：确认数据状态清单 —— 写：四份材料（本阶段只写 decision-log）+ 任务目录 facts.jsonl（stage / close_action 两型）+ quality/** + identity/executions/**；改：治理文档与 6 个 ADR、两个 architecture json、package.json、lint 配置、四条修复站点、close 计划落盘段、父材料 X1–X14；一次性最小写：受害任务那一行的身份字段；材料正常编辑不使旧事实失效"
    impact_dimensions: [ordinary_detail]
    requires_user_decision: true
    visible_group_id: R2
    evidence: "用户 R2 真实答复 Q6A；prd.md:59-71（K1–K9）；F-13/§4.2"
    acceptance: "每条持久对象在材料中有具名条目并写明写者/读者/失效条件；不新增第五份材料或新持久对象"
    counterexample: "新增持久对象、或对受害任务 store 做超出身份字段的一次性写，判不符合"
  - oi_id: OI-20
    task_id: workflowhub-mechanism-simplification-t3-20260912
    outline_version: v1
    framework_node: success_failure_boundary
    category: success_failure_boundary
    source: "用户 §1 原话 + docs/standard-workflow.md:159-163"
    question: "哪一步失败停在哪一步？哪些失败可原地重试、哪些必须重新确认？卡住时如何暴露？"
    status: confirmed
    selected_disposition: "用户选 A（R2-Q6）：成功 = 13+9 条 AC + 四条逐条验证 + 异源复核；失败 = 停在那条如实记录，不放宽、不假装、不回退已过批次；可原地重试 = 测试/命令失败、provider unavailable；必须重新确认 = 方向改变、范围变化、风险接受；卡点由 status 根因行 + 材料登记暴露"
    impact_dimensions: [acceptance]
    requires_user_decision: true
    visible_group_id: R2
    evidence: "用户 R2 真实答复 Q6A；docs/standard-workflow.md:159-163"
    acceptance: "材料中有成功判据、失败停点、可重试项与需重新确认项的具名清单；卡点可在 status 与材料中读到"
    counterexample: "失败被写成通过、或跨过停点继续、或把需重新确认项自行放行，判不符合"
  - oi_id: OI-21
    task_id: workflowhub-mechanism-simplification-t3-20260912
    outline_version: v1
    framework_node: non_goals
    category: non_goals
    source: "prd.md:156-183 + 用户 §1 原话"
    question: "E-1 ~ E-20 是否原样沿用？本任务是否新增非目标（不新增控制面、不动历史字节、不修宿主）？"
    status: confirmed
    selected_disposition: "用户选 A（R2-Q6）：E-1 ~ E-20 原样沿用；本任务新增四条非目标 —— 不为四条缺陷新增控制面（检查器/schema/门禁）、不改历史证据字节（只做身份字段最小重算或明确登记）、不修宿主/broker/3rd-review 仓内能力、不重跑真实任务采基线"
    impact_dimensions: [scope]
    requires_user_decision: true
    visible_group_id: R2
    evidence: "用户 R2 真实答复 Q6A；prd.md:156-183（E-1 ~ E-20）"
    acceptance: "非目标清单在材料中具名可核对；实现期未出现清单外的新控制面"
    counterexample: "为修四条缺陷新增检查器/schema/gate、或改写历史证据字节，判不符合"
  - oi_id: OI-22
    task_id: workflowhub-mechanism-simplification-t3-20260912
    outline_version: v1
    framework_node: deferred
    category: deferred
    source: "用户 §1 原话 + prd.md:174 E-13 + E-17/E-20"
    question: "仓外项（3rd-review 判死、宿主能力）登记为非目标还是延期项？本任务是否零延期？"
    status: confirmed
    selected_disposition: "用户选 A（R2-Q6）：**零延期项**；仓外项（3rd-review 判死逻辑、宿主/broker 能力、宿主自建 worktree）一律按**非目标**登记，写清影响面且不阻断任何阶段结束"
    impact_dimensions: [scope]
    requires_user_decision: true
    visible_group_id: R2
    evidence: "用户 R2 真实答复 Q6A；prd.md:174（E-13）；用户 §1 原话（不希望有延期任务）"
    acceptance: "材料中延期项为空集且写明「零延期」；仓外项在非目标节有具名条目"
    counterexample: "出现任何任务级延期登记、或用延期项承接仓外能力，判不符合"
  - oi_id: OI-23
    task_id: workflowhub-mechanism-simplification-t3-20260912
    outline_version: v1
    framework_node: solution
    category: complete_user_flow
    source: "用户 §1 原话（R-009）+ 方向审查 B12"
    question: "执行纪律：主会话上下文控制与子代理派发如何落成可核对约束，是否进入验收面？"
    status: confirmed
    selected_disposition: "用户选 A（R3-Q5）：写成**可核对约束**并落进执行记录 —— 重读量动作点（全仓 grep、多文件对标、跑测试）由子代理执行，主会话只收「路径 + exit_code + 清单」摘要；不新增任何对象"
    impact_dimensions: [ordinary_detail]
    requires_user_decision: true
    visible_group_id: R3
    evidence: "用户 R3 真实答复 Q5A；用户 §1 原话（R-009）；方向审查 B12"
    acceptance: "build-code/verify-code 的执行记录里能读到该纪律的落实（子代理产出与主会话摘要分离），且无新增持久对象"
    counterexample: "主会话自行执行全仓 grep / 多文件对标 / 测试并把长日志带回主上下文，判不符合"
  - oi_id: OI-24
    task_id: workflowhub-mechanism-simplification-t3-20260912
    outline_version: v1
    framework_node: extension
    category: non_goals
    source: "用户 R4-Q1 真实原话（R-019）"
    question: "hash 净减方向如何落成可核对约束？现有 hash 里哪些本任务删、哪些必须留并写明理由？"
    status: confirmed
    selected_disposition: "用户 R4-Q1 口述方向（原话）：『我希望整个workflowhub以后尽量不要再出现hash了，这是明显过程工程化的产物』⇒ 本任务交付 = ① 宪法层写「默认不新增 hash，新增须先证明必要」；② 一份**现有 hash 用法清单**（逐项分类：身份绑定 / 完整性校验 / 过程化产物）+ 逐条处置（本任务删 / 保留并写明为何不是过程化产物）；③ 不新增任何 hash 字段或校验。治理文字侧的 hash 表述本任务即删（F3/F6，见 C7-FR-1/FR-2 的 B 路线）"
    impact_dimensions: [scope]
    requires_user_decision: true
    visible_group_id: R4
    evidence: "用户 R4 真实原话：'Q1：B，我希望整个workflowhub以后尽量不要再出现hash了，这是明显过程工程化的产物！'；§4.3 A-01/A-02（代码侧仍强制 hash 的实测）"
    acceptance: "宪法负向条款里有「默认不新增 hash」的硬规则；材料里有一份可复算的 hash 用法清单（每条带处置与理由）；本任务未新增任何 hash 字段或校验"
    counterexample: "只删治理文字、不给出现有 hash 清单与处置（等于把方向落空）；或新增 hash 字段/校验；或把身份绑定类 hash 当成过程化产物一并删除导致 K2/K5 绑定失效，均判不符合"
```

---

## 3. 范围三角（step 2 triage-scope → Round 1/2 收敛后定稿）

### 3.1 范围内（最终）

1. **C7 治理同步**（PRD 已定）：宪法 F3/F6 修订 + 控制面净减法硬规则 + 负向条款（已裁定不采纳清单）+ 阻塞分类学常驻规则 + checklist/版本/修订记录同步；6 个 ADR 同步；`AGENTS.md`/`CLAUDE.md`/`move-map.json`/`control-plane-inventory.json`/`audit-contracts.md`/`package.json` 的表述对齐；父材料 X1–X14 更正；清零 verify-structure 的 2 个问题 + 父材料 82 条 markdownlint + 全仓 markdownlint 中与本任务相关的部分（path-guard 在 HEAD 已是 0，**C7-FR-15 的 10 条已由任务Ⅰ 清掉**）；`operations/close/**` 多文件计划收敛为一次性展示（本卡唯一代码侧删除）。
2. **C8 双证验收**（PRD 已定）：静态净减法（C1 具名清单逐项）+ M1–M5 对照 C0 基线 + D-015③ 链路验收 + 不可证伪项标 `unknown` + 适配代码计入净增减账 + 异源复核。
3. **四条现场阻塞**（Round 1 裁决并入；Round 2 定位置与顺序）：① stage 行 material digest 一元/四元 stale（现场已复现）；② 旧审查记录路径身份不符（触发即 exit 1）；③ spec-analyze 静默跳过内容收敛检查；④ `direction_change` 类 finding 无「已由材料修复」终态（仅 build-code 为门）。**顺序：四条排在 C7 之前**（T-011）。

### 3.2 明确的不确定性（Round 2 后仅剩一条）

- 防未来新增的核验方式（OI-15）：宪法负向条款 / 分类学常驻规则 / 守卫三要件如何被核验 —— 留 Round 3（方向审查后）定。
- ~~四条阻塞的批次顺序与合并顺序~~ → T-011 / T-012（已定）。
- ~~对照表范围~~ → T-010（已定）；~~验收与复核口径~~ → T-013 / T-014（已定）；~~六类边界~~ → T-015（已定）。
- ~~范围是否含四条~~（已定：含）；~~四条归属~~（已定：本任务）；~~坏数据是否处置~~（已定：处置并现场实测）；~~预存在红路线~~（已定：窄 ignores + 逐条修）；~~判据形态~~（已定：逐条账 + 八类防护）。

### 3.3 非目标（Round 2 定稿，见 OI-21）

- 不改 wh-review 的 per-stage 审查标准与 prompt（E-18）。
- 不新增第五份材料 / public command / 持久化对象 / 状态机（裁定 G：字段 ≠ 对象）。
- 不迁移历史任务、不做兼容桥、不建双写；不改已落盘历史 provenance 字节（E-14/E-15）。
- 不新跑真实任务采基线（E-19）。
- 宿主 / broker 仓外能力（E-17）与宿主自建 worktree 增殖（E-20）不造仓内机制。
- **本任务四条新增非目标**（R2-Q6/T-015）：① 不为四条缺陷新增任何控制面（检查器 / schema / gate）；② 不改历史证据字节（只做身份字段最小重算或明确登记）；③ 不修宿主 / broker / 3rd-review 仓内能力；④ 不重跑真实任务采基线。
- **第 ② 条的精确边界（R4-Q4 = A 定）**：「历史字节」指 **test / review / provenance / 已完成任务的证据与记录**（只读，不改）。**本任务组的上游规划材料**（`specs/workflowhub-mechanism-simplification-20260910/decision-log.md`，在本任务 worktree 内、`prd.md` 的路线来源）**不属于**该约束：允许按 `C7-FR-14`/`FR-17` 更正 X1–X14 与修 lint。边界写死，避免被读成「随意改历史」。

### 3.4 延期项（Round 2 定稿，见 OI-22）

- **零延期项**。仓外项（3rd-review 判死逻辑、宿主/broker 能力、宿主自建 worktree）一律按**非目标 + 影响面登记**处理，且**不阻断任何阶段结束**。

### 3.5 Round 1 收敛（T-001 ~ T-007）

1. **范围**（T-001）：本任务 = PRD 任务Ⅲ（C7 治理同步 + C8 双证验收）**加** PaperBuilder 四条现场阻塞；一条合并列车、一个任务收口。
2. **判据**（T-004）：两条都要 —— ① 已知阻塞逐条清零（现象 → 根因 → 修复 → 验证命令 → 证据）；② 八类阻塞逐类有防护与 owner。
3. **可见形态**（T-005）：逐条阻塞账 + 可复算命令；缺陷 1 必须含现场读回成功的实测输出。
4. **坏数据处置**（T-006）：修代码 + 一次性最小修复 + 现场实测读回（不许只修代码留坏行）。
5. **预存在红**（T-007）：无关 specs 目录加窄 ignores（写明理由与 owner）+ 其余逐条修 + 本任务材料 0 + 新增红判失败；path-guard 保持 0、verify-structure 清零。
6. **事实登记**（T-002）：四条阻塞属 PRD 51 条 X 之外的**新一类**，在本任务内按既有八类分类学登记。
7. **归属**（T-003）：四条在 HEAD 全部成立、此前无人认领，归本任务。

### 3.6 Round 2 收敛后的正式边界（T-010 ~ T-015）

1. **合并顺序**（T-012，OI-09）：**任务Ⅲ 的 build-code 必须在任务Ⅱ 完全合并之后才开始**；等待期只产出本任务四份材料（make-decision → build-spec → build-plan），**不改仓库任何文件**。开工前必须实测任务Ⅱ 的合并提交已是 HEAD 祖先。
2. **四条的位置**（T-011，OI-08）：四条修复排在 **C7 之前**；C7 的「文档 ↔ 代码」对照表以修复后的代码事实为准。
3. **对照表范围**（T-010，OI-03）：只覆盖 PRD C7 §2 点名对象 + 本任务实际改动的文件（约 15 项），不做全仓逐条对照；范围外漂移用「不劣化」兜底。
4. **验收与基线**（T-013 / T-014，OI-12 / OI-14）：沿用 C7 的 13 条 + C8 的 9 条 AC，四条各加针对性 oracle，新增红判失败；唯一基线 = 本任务开工 HEAD 重测值（全仓 markdownlint 610 / path-guard 0 / verify-structure 2 个问题 / 父材料 82）。
5. **异源复核**（T-014，OI-13）：真实 wh-review 异源审查（broker → 外部 provider，非本会话、不同底层模型）+ 一次独立子代理复核；不可用如实记 `unavailable`。
6. **六类边界**（T-015，OI-17 ~ OI-22）：按 §5.2 的确认稿定稿；页面范围 `non_ui`（`not_applicable`），零延期。

---

## 4. 现场事实（step 1 load-context 实测）

> 口径：本节的路径/行号/计数均为**本次实测**（HEAD `3a061d4b`）。凡沿用上游材料的数字，一律标明来源，不当作本任务实测值。子代理实测项标注「子代理」并给出命令。

| # | 事实 | 证据 |
| --- | --- | --- |
| F-01 | worktree / branch / baseline 已由官方 bootstrap 创建 | `node tools/cli/task-bootstrap.mjs --project=workflowhub --task=workflowhub-mechanism-simplification-t3-20260912 --target-repo=/Users/Hugh/Hugh/Project/workflowhub` → worktree `/Users/Hugh/Hugh/Project/workflowhub-workflowhub-mechanism-simplification-t3-20260912`，branch `task/workflowhub/workflowhub-mechanism-simplification-t3-20260912`，baseline `3a061d4b`（exit 0） |
| F-02 | 主仓 HEAD 与任务Ⅰ 归档 | `git log --oneline -5`：`3a061d4b`（PRD 异源审查 14 条 findings 处置 + 第二轮确认）→ `9ee6e90e` → `35a6fb6f`（archive specs/…-t1-20260911）→ `9f9d0c44`（merge 任务Ⅰ）→ `5ddf8c42` |
| F-03 | 任务Ⅰ（C0–C3）已合入并归档 | `git merge-base --is-ancestor 9f9d0c44 HEAD` 成功；四材料在 `specs/archive/workflowhub-mechanism-simplification-t1-20260911/` |
| F-04 | 任务Ⅱ 未合入 | `git merge-base --is-ancestor task/workflowhub/workflowhub-mechanism-simplification-t2-20260911 main` 成功（**该分支无独立提交**，与 main 同点起步）；其 worktree 内只有未提交的工作区改动 |
| F-05 | 任务Ⅱ 的四份材料已产出 | `…-t2-20260911/specs/workflowhub-mechanism-simplification-t2-20260911/{decision-log,spec,plan,tasks}.md`（240KB / 87KB / 61KB / 229KB） |
| F-06 | PRD 已声明 `final`，10 张卡 × 3 交付组 | `prd.md:3`（Status final，含裁定 A–J）、`prd.md:106-117` 任务地图 |
| F-07 | 任务Ⅲ = C7 → C8，末位 | `prd.md:116-117`；`prd.md:3791-3792` 单一合并列车 |
| F-08 | C7 的 17 条 FR / 13 条 AC / 18 字段；C8 的 10 条 FR / 9 条 AC | `prd.md:3437-3475`、`prd.md:3676-3703` |
| F-09 | 现场阻塞报告存在且自述只读核实 | `/Users/Hugh/Downloads/workflowhub-defects-from-paperbuilder-m1.md`（420 行，2026-09-12） |
| F-10 | 四条阻塞**未出现在 PRD 任何位置** | `grep -n "material_scope_revision\|execution_record_row_material_stale\|verifyReviewChain\|hasMarkdownHeadings\|direction_change\|needs_human" prd.md` → **0 命中**（子代理复核） |
| F-11 | task store 落点与 bootstrap stdout 打印不一致 | 实际落盘 `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/<task>`（`task.json` 实测存在，`created_at 2026-09-12T15:20:41.941Z`）；stdout 打印 `/Users/Hugh/Knowledge/Projects/workflowhub/tasks/<task>`（**该路径不存在**）。配置 `~/.config/workflowhub/config.json` 的 `task_dir` 与 `~/.workflowhub/runtime-mode` 的 `storage_root` 现均为 `/Users/Hugh/Hugh/Knowledge`；bootstrap 输出字段 `storage_root` 打印的是解析链值而非权威值。**登记为事实，待判是否属本任务范围** |
| F-12 | 任务Ⅱ 的 store 已存在（同一权威根） | `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-mechanism-simplification-t2-20260911/` |
| F-13 | 现场受害任务 store 存在且含坏行 | `/Users/Hugh/Hugh/Knowledge/Projects/PaperBuilder/tasks/paperbuilder-m1-stable-surfaces/facts.jsonl`（1,196 B）、`identity/`、`index.json`、`quality/` |
| F-14 | 四条阻塞的代码锚点在 HEAD 逐条存在 | `completion-predicates.mjs:29`（`STAGE_FACT_MATERIALS`）、`:745`（scope 比较）、`:752`（抛 `execution_record_row_material_stale`）；`stage-runner.mjs:1192` 与 `:1273`（`currentVNextMaterialRevision()` 回退）；`stage-handlers.mjs:1841-1842`（`ordinary review result/attempt path identity mismatch`）；`stage-content-contracts.mjs:5943`（`hasMarkdownHeadings(materials.decision_log)` 门槛）、`:446-447`（`direction_change` 路由）——均为本次 `grep -n` 实测 |
| F-15 | 四条阻塞涉及的 runtime 文件与任务Ⅱ 的卡存在同文件关系 | 待 OI-09 用子代理的冲突分析定稿（`stage-handlers.mjs` 属 C4 面；`completion-predicates.mjs` / `freshness.mjs` 属 C5 面；`stage-content-contracts.mjs` 属 C4/C6 面） |
| F-16 | PRD 的 C7 oracle 依赖一串仓库自查命令 | `node tools/cli/check-task-record-paths.mjs`、`node tools/cli/verify-structure.mjs`、`./node_modules/.bin/markdownlint-cli2 "**/*.md"`（`prd.md:3480-3491`） |
| F-17 | PRD 记录的上游基线（216a546d 时点，**非本任务实测**） | markdownlint **554** error / 35 files（其中 `specs/workflowhub-ui-frontend-capability-20260904/**` 420 条 / 22 文件）；path-guard **10** FAIL；verify-structure **2** FAIL；父材料 markdownlint **82**（口径锁定 0.35.0，`npx` 会得 83 且多 MD060）（`prd.md:342-352`、X50–X53） |
| F-18 | 任务Ⅰ 已实测出基线会漂移 | 任务Ⅰ OI-20：任务Ⅰ 开工时 markdownlint = **612** error / 35 files（PRD 记 554） |
| F-19 | **本任务基线已在 HEAD `3a061d4b` 重测（子代理实测，只读）** | 全仓 `./node_modules/.bin/markdownlint-cli2 "**/*.md"` = **610 error / 200 files linted**（exit 1；其中 `specs/**` **500 条 / 22 文件**）；`node tools/cli/check-task-record-paths.mjs` = **PASS，0 FAIL，exit 0**；`node tools/cli/verify-structure.mjs` = **exit 1**，报 `CONTEXT.md 缺五段术语「test-acceptance」` 与 `CONTEXT.md 含排除术语「runtime」` |
| F-22 | **PRD 记录值与本任务实测的逐项差异（漂移）** | path-guard：PRD 记 10 FAIL → **实测 0**（任务Ⅰ 已清）；verify-structure：PRD 记 2 FAIL → 实测 2 条问题；全仓 markdownlint：PRD 554（216a546d）→ 任务Ⅰ 612 → **本任务 610**；`specs/**` 子集：PRD 420/22 文件 → 实测 **500/22 文件**；父材料 `decision-log.md` markdownlint：PRD 82 → 实测 **82**（规则分解 MD032×34+MD022×30+MD036×12+MD052×2+MD024×2+MD040×1+MD001×1，逐项吻合）；`prd.md` 自身 **0**；`move-map.json` entries：PRD 362 → 实测 **372**；`control-plane-inventory.json` controls：PRD 6 → 实测 **7**（skip_dispositions 21 = 21）；`git worktree list`：PRD 14 → 实测 **12**；`stage-content-contracts.mjs`：PRD 6,806 → 实测 **7,124**；`completion-predicates.mjs` 1,259 → **1,528**；`stage-runner.mjs` 3,161 → **3,489**；`stage-handlers.mjs` 3,956 → 3,956（未变）；`freshness.mjs` 781 → **780**；`CONTEXT.md` **417** 行；`core/task-close.mjs` **3,530**、`tools/cli/task-close.mjs` **359**（PRD 记 `unknown`）⇒ **C7-FR-15 的目标（10 条 path-guard FAIL 清零）在 HEAD 已经达成**，C7 的实际剩余量因此与本 PRD 记录不同（见 OI-11 / OI-14） |
| F-23 | `specs/archive/**` 已被 lint 忽略，500 条红全在未归档 specs 目录 | `find specs/archive -type f -name "*.md" \| wc -l` = **494**；`.markdownlint-cli2.jsonc` 的 `ignores` 含字面量 `specs/archive`（现有惯例，另有 `specs/m9-verify-code`、`specs/m10-baseline-switch` 等同类窄条目）；出错文件清单里 `specs/workflowhub-ui-frontend-capability-20260904/**` 占多数 |
| F-24 | 任务Ⅱ 尚未开始代码落地，且基线落后 main | branch tip `35a6fb6f` 是 HEAD 的**祖先**（`git merge-base --is-ancestor` 通过）；其 worktree 与 HEAD 的差异仅 **6 个文件 / +120 −117**（绝大部分是 `.planning/**` 与 `skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs`）；它不含 `9ee6e90e`/`3a061d4b` 两个提交（PRD 最新版不在它的树里）⇒ OI-09 的合并顺序必须显式定 |
| F-20 | 任务Ⅰ 与任务Ⅱ 的 decision-log **没有**机器可读 OI 记录块 | `grep -c '```yaml'`：t1 = 1（是 `grill_summary`，无 `oi_id`），t2 = 1（同类）；而 HEAD 的 `analyzeDecisionOutline`（`stage-content-contracts.mjs:3034`、调用点 `:3375`）要求 OI 记录以 fenced YAML/JSON 块存在。**本记录因此同时维护 §2.1 表与 §2.4 YAML 块**，并登记该偏差为待判事实 |
| F-21 | 任务Ⅰ 与任务Ⅱ 的 decision-log **没有** `## 收敛检查` 四维表 | 同上；HEAD 的 `structuredConvergenceFacts`（`stage-content-contracts.mjs:3267`）在存在 `## UI applicability` 时要求该表，否则报错。本记录按当前契约补齐 |

### 4.1 本任务实测回填（原「待回填」，已完成）

- 三条基线重测：见 F-19 / F-22（已完成）。
- 四条阻塞的最小修复面与任务Ⅱ 同文件冲突清单：见 §4.2（已完成）。
- 现场坏行的字段形状与可恢复性：见 F-13 与 §4.2 末段（已完成，只读读回）。

### 4.2 四条现场阻塞的独立核查（HEAD `3a061d4b`；子代理核实 + 主会话复核）

> 口径：本表只登记**能复算/能读回**的事实。凡报告说法与本任务实测不一致的，直接写「修正」。

| # | 报告说法 | 本任务实测 | 卡覆盖（C0–C9） | 任务Ⅱ 覆盖（C9/C4/C5/C6） | 硬阻断？ | 最小修复面 | 与任务Ⅱ 同文件冲突 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 缺陷 1 · material digest 一元/四元 stale | 行里存四材料向量、读侧按 stage scope 一元校验 ⇒ 永不相等 | 锚点全部成立（`completion-predicates.mjs:29-35`、`:743-752`；`stage-runner.mjs:1191-1194`、`:1211-1237` 行内确无 `material_scope`；6 处调用方 `tools/cli/stage-runtime.mjs:301,346,358,390,801,815`）。**修正**：写侧 digest 取自 `:1193 handoffFacts.materialScopeRevision`，`:1272-1273` 的 `?? currentVNextMaterialRevision()` 是同源回退（经 `:1303` → `:2918`），报告指向正确但行号略偏 | **无**（PRD 零命中；C5 同文件不同站点，`C5-AC-6` 语义近似但未点名） | **无，且方向相反**：t2 明确保留 `material_digest`（t2 `decision-log.md:29`、`spec.md:17`、`tasks.md:1529`） | **否**：`completion-predicates.mjs:820-832` 硬编码 `blocking:false`，唯一消费者是 CLI 输出（`stage-runtime.mjs:865`）⇒ 属**误导性事实** | `stage-runner.mjs:1191-1194` + `:1272-1273`；可选 `completion-predicates.mjs:743-752` | **是**（t2 `plan.md:154,159,205`） |
| 缺陷 2 · 旧 review result 路径身份不符 | 校验要求结果文件名 uuid 严格等于 `attempt.json` 的 `attempt_id`，历史记录不符即抛错 | 锚点全部成立（`stage-handlers.mjs:1834/1839-1842/2311`；`freshness.mjs:69-70`；生成侧 `review-record-route.mjs:1066-1068`、`stableReviewId:993-996`） | **无**；且 PRD `prd.md:27` 与 E-15（`prd.md:176`）把「历史任务只读冻结 / 不做兼容桥 / 老任务在新命令下可能读不出」**显式列为已接受边界** | **无**，且 t2 `decision-log.md:27` 明写「不改名、不迁移、不加兼容机制、不回填历史」 | **触发时是**：throw → `identity_failed` → `stage-runtime.mjs:1189 exit 1` | `stage-handlers.mjs:1841-1842`、`freshness.mjs:70`（可复用既有 `review-record-route.mjs:1298-1345` 的 hash+互链身份模型） | **是**（t2 `plan.md:158,145,150`） |
| 缺陷 3 · spec-analyze 静默跳过内容收敛 | 门槛把「材料缺失」和「材料不是正文」折进同一静默分支，跳过状态不进 `errors`/`facts` | 锚点全部成立（`:5943` 块至 `:5968`、`:5965` push、**无 else**；`hasMarkdownHeadings:3501-3503`；返回结构 `:5988-6004` 仅 6 键；`stageAnalyzeSummary:5355` 只数两类 finding）。**另核实**：`document_review` / `convergence_checked` 在 `runtime/ tools/ core/ skills/` **零生产者**（印证报告 unknown #3） | **无**（C2 只合并四 profile 的**实现**，不动该门槛） | **无**（t2 只在该文件做 C9 档位改名） | **否**：不影响 exit code，纯误导 | `stage-content-contracts.mjs:5943` ± `:5355` / `:5995-6003` | **是**（t2 `plan.md:157`） |
| 缺陷 4 · `direction_change` 无「已由材料修复」终态 | 该分类只收 `user_decided`/`accepted_risk`，`needs_human` 非终态 ⇒ `finding_dispositions` 永久 missing | 锚点全部成立（`:445`、`:446-447`；`completion-predicates.mjs:119`；`stage-review-disposition.mjs:8/95-97/119-120`；分类 `:423`、路由 `:464/:471`）。**修正报告结论**：`completion-predicates.mjs:105-112` 的 `STAGE_ADVISORY_PREDICATES` 使 make-decision / build-spec / build-plan 的 `finding_dispositions` 只是 **advisory（不是门）**，只有 build-code 是门（`:98`）⇒ 报告场景（make-decision）在 HEAD **不阻断完成** | **无** | **无**（`runtime/review/stage-review-disposition.mjs` 在 t2 四材料中 0 次提及） | **仅 build-code 是**；make-decision 场景**否** | `stage-content-contracts.mjs:446-447`、`completion-predicates.mjs:119` | 前两处**是**（t2 `plan.md:157,154`）；`stage-review-disposition.mjs` **否**（冲突最低） |

**F-13 更正与现场复核（主会话实测，2026-09-12）**：

- 报告与一份子代理按 `~/Knowledge/Projects/PaperBuilder/tasks/...`（**旧根**）查找会得到「不存在」；真实权威根是 `/Users/Hugh/Hugh/Knowledge`（F-11）。在权威根下，该 store **确实存在**，且 `quality/evidence/{stage-reflection-availability,spec-analyze}/*` 的 4 个具名证据文件与 `quality/facts/011067d6….json` 全部存在。
- 当前 `facts.jsonl` **只有 1 行**（原地替换语义），`created_at = 2026-09-12T14:15:06.626Z`，关键字段：`material_digest.value = 4be44b28…`、`review_origin:"not_run"`、`handoff = {value:null, reason:"the current plan.md was not readable for this stage-end write"}`、`evidence = [{command:"stage-handoff:make-decision", exit_code:1, failure_signature:"unavailable"}]`、`layer_states.stage_quality = "incomplete"`。报告引用的 `cb7e096e…` 那一行已被这次重跑覆盖（同一 stage 单行替换）。
- **缺陷 1 现场复现（只读复算，本任务实测）**：

  ```bash
  # 材料目录 /Users/Hugh/Hugh/Project/PaperBuilder-paperbuilder-m1-stable-surfaces/specs/paperbuilder-m1-stable-surfaces
  # 现有文件：decision-log.md, spec.md
  node -e 'const {createHash}=require("node:crypto"),fs=require("fs");const sha=v=>createHash("sha256").update(v).digest("hex");const dl=fs.readFileSync("decision-log.md","utf8");console.log("one  =",sha(JSON.stringify([["decision-log.md",dl]])));console.log("four =",sha(JSON.stringify([["decision-log.md",dl],["spec.md",null],["plan.md",null],["tasks.md",null]])))'
  # 实测：one  = be6aea667417870ad6b9dc50cd251aaf4aad9e10ad7624282e416554dbf63138
  #        four = 4be44b28a16e557e6a5aa189221ed3d40004d71e78dc4e69345ce048da064bfb  ← 与行内 material_digest 逐位相同
  ```

  ⇒ 行里存的是**四材料整集** digest，读侧 make-decision 期望**一元 scope** digest（`be6aea66…`）⇒ 该行**当前确实读不回来**（不是历史遗留，而是今天新写的行同样中招）。「是否存在需处置的坏行」这一 unknown 由此关闭：**存在，且可复现**。

---

### 4.3 C7「文档表述 ↔ 代码事实」首轮审计原始材料（子代理只读，HEAD `3a061d4b`）

> 用途：C7 的对照表底稿（OI-03 / T-010 的范围 = C7 §2 点名对象 + 本任务实际改动文件）。分类口径：`contradiction`（现在就不一致）/ `stale-number`（数字或路径过期）/ `consistent`（一致）/ `unverifiable`（无 reader 或无法判定）。**逐条证据行号见子代理原始报告**；本表只登记结论与对本任务的影响。

| # | 对象 | 现状（实测） | 分类 | 对本任务的影响 |
| --- | --- | --- | --- | --- |
| A-01 | `CONSTITUTION.md:28`（F3 定义句） | 仍写「task/worktree/runtime 身份、**hash**、顺序与核心 publication 结构错误必须在写成功前 fail-loud」；代码 `runtime/evidence/write-boundary-preflight.mjs:86-87/:104/:116-121` **仍强制 hash** | consistent（文档 ↔ 代码同向） | ⚠️ **`C7-FR-1`（F3 去 hash）若按 PRD 字面执行，会制造新的文档-代码矛盾** —— 代码侧的 hash 校验不在本任务允许的代码改动面内（C7 唯一允许的代码改动 = `operations/close/**` 收敛）。**必须改判该 FR 的落地形态**（Round 3 议题） |
| A-02 | `CONSTITUTION.md:49`（F6 定义句）/ `:51`（正例） | 定义句**已无**「内容校验值」；「合同内容校验值」只在**正例**句；代码 `invocation-identity.mjs:56-58` 仍计算并强校验 `contracts.*.sha256` | consistent；`prd.md:3442` 把位置写成 `:49` = **stale-number**（存活文本在 `:51`） | C7-FR-2 的落点需按实测行号更正 |
| A-03 | 「控制面净减法」硬规则 | 全仓（`CONSTITUTION.md` / `constitution-checklist.md` / `AGENTS.md` / `CLAUDE.md`）**零命中**；仅存在于 `specs/` 任务材料 | 目标缺口（非矛盾） | C7-FR-3 仍待写；落 F5 或 F11 均可，F5:42/:45 与 F11:85 是候选位 |
| A-04 | 宪法版本/条目数 | `CONSTITUTION.md:3` = `Version: 1.8.0`；`:6` 声明 22 条、实测 22 条；`:190` Last Amended 2026-09-09；`verify-structure.mjs:14` 硬校验 22 | consistent | C7-FR-4 有机器守卫（`verify-structure.mjs:26-36`、`:63-64`）；**新增段落不得变成第 23 条** |
| A-05 | `constitution-checklist.md` | `:4`/`:40` 声明 22，实测 22 条 | consistent | C7-FR-4 的「非条款区对照项」方案可行 |
| A-06 | 顶层 `schemas/` 引用 | `schemas/` 与 `core/schemas/` **均不存在**；`README.md:22`、`AGENTS.md:37`、`CLAUDE.md:23` 三处仍写「顶层 `schemas/`」；`runtime/schemas/` 存在（`AGENTS.md:34` 的引用为真） | **contradiction ×3** | C7-FR-10 的对象比 PRD 记录**多一处**（README.md 也要改） |
| A-07 | `AGENTS.md:44` / `:58` | 仍把 `index.json` 与 `quality/verify.json` 列入保留清单；D-004（`decision-log.md:1055`）要求删 `index.json`、D-023（`:1503`）要求收 `quality/verify.json`；代码侧两者仍在（`task-handle.mjs:417-419`、`quality-store.mjs:258`） | **contradiction**（文档 ↔ 已确认决定；代码 ↔ 决定尚未执行） | C7-FR-9 必须**在任务Ⅱ（C5/C6）合入后**按代码实际结果改写；这正是「build-code 等任务Ⅱ」的实证理由 |
| A-08 | `verify-structure.mjs` 两处 FAIL | 脚本 `:15` 的 denylist 含 `runtime`、`:16` 要求五段旧术语 `intake/design/plan/apply/test-acceptance`；`CONTEXT.md` 缺 `test-acceptance`（当前第五阶段叫「独立代码审查（code-review）」）、并含 3 处 `runtime` | **contradiction** | ⚠️ C7-FR-16「清零 2 条」若靠往 `CONTEXT.md` 塞旧术语 = 写入与现行五阶段不符的表述；**须在 Round 3 定处置路线**（改术语表 / 改守卫口径 / 加历史别名并写明） |
| A-09 | `docs/audit-contracts.md` | `:5` 称 `core/audit-aggregator.mjs` 是唯一 verdict 签发者 —— **该文件不存在**；`:24` 点名的 `runtime/evidence/audit-summary-carrier.mjs` **不存在**；move-map `:1185-1186` 声称迁往 `runtime/evidence/audit-aggregator.mjs`，**目标也不存在**；`steps.schema.json` / `audit-summary.schema.json` / `requirement-ledger.schema.json` 三个 schema **零加载点** | **contradiction ×2 + unverifiable ×3** | X52 的实际范围比 PRD 记录更大（不止「改一处表述」） |
| A-10 | `docs/adr/` | 实测 **35 个**文件（PRD 记 30）；编号重复：`0025`×3、`0009`×2、`0002`×2、**`0027`×2**（PRD 未记 0027） | stale-number + **contradiction**（编号唯一性） | C7 §2 第 3 项的 6 个 ADR 同步 + X54 的重编号议题范围更新 |
| A-11 | `move-map.json` / `control-plane-inventory.json` | entries = **372**；controls = **7**（全部 `retain`，`replacement` 全为 `null`）；skip_dispositions = **21**（retire_with_replacement 14 / defer 7） | 计数 drift（PRD 记 362 / 6） | C7-FR-11 与 X51 的「4 条 retain 与决定冲突」需按 **7 条全 retain** 重核 |
| A-12 | `package.json` | `:12-14` `test` = `test:safe` + `test:exclusive`；`test:safe` 是无文件过滤的 `vitest run`（仅排除 2 文件）⇒ `npm test` = 258 个测试文件的无范围全量；`AGENTS.md:21` 明令禁止无范围全量；`.github/workflows/ci.yml:26` 又真的跑 `npm test` | **contradiction**（规则 ↔ 脚本 ↔ CI） | C7-FR-10 的 `package.json` 项须同时处置 CI 例外（`AGENTS.md:22` 的例外条款） |
| A-13 | `AGENTS.md:23` 的依据行号 | 引 `docs/standard-workflow.md` L310，实测 L309-310 讲的是 commit/push/merge/cleanup 授权；对口句在 `:274`、`:282-283` | stale-number | C7 顺带更正（不新增规则） |
| A-14 | `spec-analyze` 归属 | `docs/standard-workflow.md:16-21` 有完整归属声明；`AGENTS.md` **零命中** | 文档覆盖缺口 | C7 可在治理节补一行引用（不新增条款） |

**结论（三条最要紧的）**：

1. **A-01 / A-08 是两条「按 PRD 字面执行会制造新矛盾」的项** —— 必须在 Round 3 定处置形态，不能留给 build-spec 猜。
2. **A-07 证明「build-code 等任务Ⅱ 合入」是硬需求**：`AGENTS.md` 的保留清单只能按任务Ⅱ 删完后的代码事实改写。
3. C7 的对照表对象比 PRD 记录**多 2 处、数字漂移 5 处**（README.md、0027×2 的 ADR、372 / 7 / 35 / 258 等）⇒ T-010 的「约 15 项」按本表实际对象数为准。

---

### 4.4 四条阻塞的最小修复面与约束（子代理只读核查，HEAD `3a061d4b`）

> 用途：T-005「逐条阻塞账」与 T-006「现场实测读回」的底稿；也是 build-spec 的**实现事实来源**。原则：**只在不新增持久对象 / 字段 / 门禁的前提下选最小改法**（用户 Q6A 的非目标）。

| # | 关键函数与调用者（生产） | 最小改法（候选） | 会失去什么 / 代价 | 现有测试覆盖 |
| --- | --- | --- | --- | --- |
| 缺陷 1 | 写侧 `stage-runner.mjs` `withStageRow:1171-1245`（`materialScopeRevision:1191-1193`、`materialDigest:1194-1195`、行 `:1211-1237`、写 `:1238`）与 `withHandoff:1246-1304`（同款回退 `:1272-1273`）；读侧 `completion-predicates.mjs:743-752`（唯一读数点），消费者 `deriveExecutionOutcomes:796-937` → `stage-runtime.mjs:809`（status 输出）与 `deriveStageOutcomeStatuses:950-1046` → `stage-runtime.mjs:340/384/795`、`core/task-close.mjs:2689`；行校验 `task-store.mjs:320-367` | ① 写侧把两处 `?? ctx.kernel.currentVNextMaterialRevision()` 换成**该 stage 自己的 scope revision**（`currentMaterialBinding:345` / `currentVNextMaterialScopeRevision` 已存在）；② 或读侧接受「scope 或整集」两种 revision | ① 只在「无 stage outcome 的 stage end」路径上失去整集 digest —— 该值**没有任何读者**；② 失去「拒绝整集 digest」这一本来就为假的保证 | **零测试覆盖** make-decision / build-spec 的行 digest（现有断言只覆盖 build-code / verify-code，而它们的 scope 恰等于整集，所以测不出差别） |
| 缺陷 1 · 冻结约束 | 行字段表 `STAGE_ROW_KEYS`（16 键）| `exactKeys:249-252`：**往行里加 `material_scope` 会直接抛**「stage row key set must equal the frozen field table」 | ⇒ 修法**不得**新增行字段；也解释了为什么「补一个 scope 字段」不是可选路线 | — |
| 缺陷 2 | 校验 `stage-handlers.mjs:1834-1879`（严格规则 `:1840-1842`），唯一调用者 `reviewFacts:2311` → `safeReviewFacts:2383-2395`、`codeReviewFacts:3859`；`freshness.mjs:58-115`（`:69-70` 同族规则；注意 `reviewReference` 缺省时会**恒抛**）；生成侧 `review-record-route.mjs:1066-1069` | 采用**已存在**的内容绑定模型：`importCanonicalReviewResult:1293-1351`（`:1298-1345` 逐项校验 ref 正则、`attempt_sha256/result_sha256/report_sha256`、canonical 集合成员、schema、`attempt_id`/`attempt_ref`/`report_ref` 互链、12 个身份字段、provenance、闭包与 policy hash、provider 输出、报告校验、投影相等）；即把 `:1841-1842` 的「文件名必须等于 `<stage>-simple-<attempt_id>`」与 `freshness.mjs:70` 的同类子句改为内容绑定 | 失去「文件名即身份」的强命名；但该规则**与生产写入方冲突**：`recordTaskBoundE2eReviewResult:1473` 写的是 `verify-code-e2e-<uuid>.json`，一旦跑验收 freshness 就会撞上 | **零测试**断言现行严格文件名规则（两条错误串在 tests/ 全无命中）；`tests/review/review-record-route.test.mjs:1298` 的 `-simple-` 命中是 report_ref，不相关 |
| 缺陷 3 | `validateStageSpecAnalyzeProfile:5779-6005`（静默门槛 `:5943`、缺料报错 `:5800-5804`、收敛循环 `:5957-5967`、状态 `:5985-5987`、返回 `:5988-6004`）；`stageAnalyzeSummary:5333-5362`（`:5355`）；生产消费者 `stage-runner.mjs:512-567`（**逐字段严格相等** `:560-562`）与 `stage-agent-outcome-adapter.mjs:539` | 在门槛不成立时**显式落一条可读的 skip 事实**（进 `errors` 或 `facts`），使「没跑」与「跑过且通过」可区分 | 会改变 `five-stage-spec-analyze-wiring.test.mjs:175-183` 的现期望（该用例目前断言 heading-less decision_log 下仍 `ok:true/consistent`） | 现有唯一覆盖 = 上述用例，且它**固化的是当前的静默跳过行为** |
| 缺陷 4 | `classifyFinding:413-434`（`:423`）、`validateFindingRouting:437-458`（`:445` needs_human、**`:446-448` direction_change 只收 `user_decided`/`accepted_risk`**）、`FALLBACK_ROUTE_RULES:471`；终态集 `completion-predicates.mjs:119`；处置校验 `stage-review-disposition.mjs:8/77-146`；**冻结行词汇** `task-store.mjs:244` | 让「已由材料修复」走**既有终态 `fixed`**：只需改 `stage-content-contracts.mjs:446-448` 一处 —— `fixed` 已在终态集（`:119`）、已在处置白名单（`stage-review-disposition.mjs:8`）、已在冻结行词汇（`task-store.mjs:244`） | 无 schema 变更、无新字面量；但要同步改一条现有断言 | `tests/contract/freeze-classification-budget-usage-protocol.test.mjs:231-241` **断言 direction_change + fixed → ok:false**（即现行禁止行为），修法必须同步更新该用例；另有 `:405-446` 的路由表断言 |

**三条对 build-spec 的硬约束（写死，不得由实现自行放宽）**：

1. **不新增行字段 / schema / 字面量**：缺陷 1 受 `STAGE_ROW_KEYS` 冻结约束；缺陷 4 优先复用既有 `fixed` 终态（新增状态字面量会同时动三处，撞用户 Q6A 的非目标）。
2. **测试改动必须显式登记**：缺陷 3 与缺陷 4 的修法都会改变现有断言的期望值（前者固化静默跳过、后者固化禁止 `fixed`）——它们必须作为「已知会改的测试」写进 build-plan，并且**不得**用放宽断言的方式凑绿。
3. **缺陷 1 的验收以「写侧 + 窄回归测试 + 历史行如实登记」为准（T-017 / R3-Q2=C 取代了早先的现场读回要求）**：本地测试覆盖为零 ⇒ 必须**新增一条窄回归测试**覆盖 make-decision / build-spec 的行指纹路径；受害任务的历史坏行按 §11.2 如实登记，**不迁移、不改写、不建兼容桥**。

---

### 4.5 四条修复对五条负向约束的逐条筛查（方审 B10 要求，已补）

> 筛查对象 = §4.4 的候选最小改法。约束来源 = 用户 R2-Q6A 确认的四条新增非目标 + PRD E-11/F11。结论：**四条都不需要新增持久对象 / 字段 / 状态机 / 门禁 / 文件**。

| 缺陷 | 新增持久对象？ | 新增字段？ | 新增状态机/状态字面量？ | 新增门禁？ | 新增文件？ | 结论 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 否 | **否**（受 `STAGE_ROW_KEYS` 冻结 16 键约束，加字段会抛错 ⇒ 只能改写侧或读侧逻辑） | 否 | 否（该判定本就 `blocking:false`） | 否 | 可行 |
| 2 | 否 | 否 | 否 | 否（只删一条文件名相等判定，改用既有内容绑定） | 否 | 可行 |
| 3 | 否 | 否（skip 标记落在既有 `errors`/`facts` 结构内） | 否 | 否 | 否 | 可行 |
| 4 | 否 | 否 | **否** —— 复用既有终态字面量 `fixed`（已在 `completion-predicates.mjs:119`、`stage-review-disposition.mjs:8`、冻结行词汇 `task-store.mjs:244` 中） | 否 | 否 | 可行 |

**边界声明（方审 B10 的「一旦唯一修复路径违宪，目标不可达」如何回应）**：若 build-code 阶段实测发现某条**只能**靠新增状态字面量或新增字段才能修，则该条**停在那条**、如实记录 `incomplete` 并交用户裁定 —— **不得**默认扩权；这条写法与 §3.3 的非目标一致，且已写进 §3.6 的失败边界。

---

## 5. Talk（真实问答）

> 本节由 Talk Round 1 起逐轮追加：每轮记录问题卡（选项/后果/风险）、`ask`、`wait`、用户真实 `reply`、`resume` 与重排。未回复前不得代答、不得推定。

### 5.1 Talk Round 1（step 3，进行中）

- **状态**：`ask`（2026-09-12，主会话向用户发出问题卡 R1-Q1 ~ R1-Q5）。
- **本轮口径**：全部为**互不依赖**的方向题（范围 / 判据 / 历史数据 / 预存在红 / 身份确认）；与任务Ⅱ 的合并顺序（OI-09）依赖子代理的冲突分析，**推到下一批**，不在本轮。
- **问题卡（选项 / 大白话含义 / 后果 / 风险）**：

| 题号 | 决策轴 | 选项 | 选它的后果 | 主要风险 |
| --- | --- | --- | --- | --- |
| R1-Q1 | 本任务范围：四条现场阻塞算不算第三个任务的活 | A 算（C7+C8+四条，一个任务收口） / B 不算（C7+C8；四条另开小任务先做） / C 塞进在研任务Ⅱ | A：一个任务交付「阻塞消失」；但任务更大、要排在任务Ⅱ 之后或与其排队 / B：PaperBuilder 更快解锁；但多一个任务与一次 close，「第三个任务做完阻塞消失」名义不成立 / C：四条与 C4/C5/C6 同文件；但任务Ⅱ 四材料已定稿，需重走确认 | A：同文件冲突与周期变长 / B：任务数增加、账要跨任务 / C：任务Ⅱ 返工与边界膨胀 |
| R1-Q2 | 「所有阻塞消失」的判据 | A 逐条清零 + 八类防护 owner（两条都要） / B 只逐条清零 / C 只写分类学与防护 | A：现在没阻塞 + 以后不再反复都有主 / B：防复发无主 / C：只剩规矩，事实未变 | B/C：复现用户抱怨的「总是出现类似阻塞」 |
| R1-Q3 | 已写坏的现场数据行是否救回 | A 修代码 + 一次性最小修复 + 现场实测读回 / B 只修代码，历史坏行登记不迁移 / C 完全交给受害任务 | A：「阻塞消失」可被现场验证 / B：受害任务仍卡着，需自行重跑或人工处理 / C：本任务只保证以后不再产生 | A：要碰另一个任务的 store（只读 or 最小写）需明确边界 / B：账面上阻塞消失、实际未消失 |
| R1-Q4 | 预存在红的收法（实测：path-guard 0、verify-structure 2 问题、全仓 markdownlint 610 条其中 500 条在无关 specs 目录 22 文件） | A 无关目录加窄 ignores + 其余逐条修 + 本任务材料 0 / B 全部逐条修（含 500 条） / C 全部登记为已知红基线不动 | A：与仓库既有惯例一致（已有 `specs/m9-verify-code` 等先例），工作量可控 / B：要改另一任务历史材料字节，工作量最大 / C：CI 保持红，但如实 | A：加 ignores 必须写明理由与 owner，否则等于掩盖（撞 F9） / B：越界改历史 / C：红基线长期存在 |
| R1-Q5 | 任务身份确认 | A 就用 `workflowhub-mechanism-simplification-t3-20260912`（worktree/branch/store 已按此建好） / B 改名 | A：无需重建 / B：需重建 worktree 与 task store | B：重建成本与身份漂移 |

- **`reply`（用户真实原话，逐字）**：`Q1A Q2A Q3A Q4A Q5A`（2026-09-12，本会话）。
- **`resume` 与重排**：五题全部选 A，与主会话建议一致；本轮**无依赖题、无新增冲突**，故不产生 Talk Round 1b。收到的处置：
  - T-001（OI-01 / OI-07）：本任务 = 任务Ⅲ（C7+C8）+ 四条现场阻塞，一个任务收口。
  - T-002（OI-02）：四条属 PRD 51 条 X 之外的新一类，在本任务内按既有八类分类学登记。
  - T-003（OI-04）：四条在 HEAD 全部成立、此前无人认领，归本任务。
  - T-004（OI-05）：判据 = 逐条清零 + 八类防护与 owner，两条都要。
  - T-005（OI-06）：可见形态 = 逐条阻塞账 + 可复算命令；缺陷 1 必须含现场读回实测。
  - T-006（OI-10）：坏行必须救回，并现场实测读回；不许只修代码留坏行。
  - T-007（OI-11）：无关 specs 目录加窄 ignores + 其余逐条修 + 本任务材料 0 + 新增红判失败。
  - 身份（§0）确认沿用 `workflowhub-mechanism-simplification-t3-20260912`，worktree / branch / store 不变。
- **状态**：`resumed`（Round 1 完成）。**遗留到 Round 2/3 的 OI**：OI-03 / OI-08 / OI-09 / OI-12 / OI-13 / OI-14 / OI-15 / OI-16 / OI-17 / OI-18 / OI-19 / OI-20 / OI-21 / OI-22。

### 5.2 Talk Round 2（step 5，进行中）

- **状态**：`ask`（2026-09-12，主会话向用户发出问题卡 R2-Q1 ~ R2-Q6）。
- **本轮口径**：依赖 Round 1 结果的题（合并顺序、批次位置、对照表范围、验收与复核口径）＋ 用户明确要求共同梳理的**六类边界确认稿**（完整用户流程 / 页面范围 / 数据状态 / 成功失败边界 / 非目标 / 延期）。全部为互不依赖的独立决策轴。

| 题号 | 决策轴 | 选项 | 选它的后果 | 主要风险 |
| --- | --- | --- | --- | --- |
| R2-Q1 | 与在研任务Ⅱ 的合并顺序（OI-09） | A 等任务Ⅱ 合入后再动 runtime，等待期先做不冲突的治理侧；B 四条修复先在独立分支做完并先合，任务Ⅱ 之后 rebase；C 严格按 PRD 顺序，四条排到最后 | A：无同文件冲突、合并列车单一；PaperBuilder 等更久 / B：PaperBuilder 更快解锁；任务Ⅱ 要返工 / C：顺序最干净；PaperBuilder 等最久 | A：等待期 PaperBuilder 持续卡着 / B：两条合并列车并行、返工与冲突成本转给任务Ⅱ / C：用户当下最痛的点被推到最后 |
| R2-Q2 | 四条修复在本任务内的位置（OI-08） | A 排在 C7 之前（先解现场，再对齐治理）；B 排在 C7 之后、C8 之前；C 与 C7 同批穿插 | A：现场优先、证据可喂给 C8 / B：治理先定型 / C：批次混合、边界难切 | A：C7 的「文档-代码对照」要按修复后的代码写（返工风险小） / B：PaperBuilder 继续等 / C：边界膨胀、审查难 |
| R2-Q3 | 文档-代码对照表范围（OI-03） | A 只覆盖 PRD C7 点名的对象 + 本任务实际改动的文件（约 15 项）；B 全仓全部文档逐条对照；C 只改 PRD 点名的矛盾，不做对照表 | A：范围可控、可逐条复核 / B：工作量爆炸且无 consumer / C：最省事但无法证明「文档与代码一致」 | A：可能漏掉未点名的漂移；用「本任务范围内清零 + 不劣化」兜底 / B：改不动的量 / C：C7 的结果主张不可验 |
| R2-Q4 | 验收 oracle 与基线口径（OI-12 / OI-14） | A 沿用 C7 的 13 条 + C8 的 9 条，四条各加一组针对性 oracle；基线 = 本任务 HEAD 重测（610 / 0 / 2 问题 / 父材料 82）；B 另立更严标准（如要求 `npm run check` 全绿）；C 只验四条 + C8 双证 | A：与 PRD 可对齐、可复算 / B：PRD 已实测不可达（X50），会造假绿 / C：C7 无验收 | A：需逐条维护两套账 / B：不可达即假绿 / C：治理侧无证据 |
| R2-Q5 | 异源复核口径（OI-13） | A 真实 wh-review 异源审查（broker → 外部 provider，非本会话、不同底层模型）＋ 一次独立子代理复核；不可用如实记 `unavailable`；B 只用独立子代理；C 只用真实 provider | A：两种互补（PRD 第四轮已证不可互替）/ B：便宜但已知抓不到卡内所有权冲突 / C：可能整体 unavailable | A：provider 可能失败（需如实登记，不判通过） / B：复核强度不足 / C：无复核事实 |
| R2-Q6 | 六类边界确认稿 + 非目标/延期（OI-17 ~ OI-22） | A 全部确认；B 有修改（逐条指出） | A：六类边界定稿，进入方向审查 / B：按指出处修订后重发 | A：若有遗漏，后续只能走「方向改变需重新确认」 / B：多一轮往返 |

- **六类边界确认稿（R2-Q6 的 A 选项内容）**：
  1. **完整用户流程**（OI-17）：你提需求（已完成）→ 官方 bootstrap 建 worktree/store（已完成）→ make-decision（Talk R1/R2/R3 + Grill + 方向/细节审查，你只回答方向题）→ 你确认方向 → build-spec 出规格（不再回头问方向）→ build-plan 排批次 → build-code 改代码/文档 + 针对性测试 + 每 phase 审查 → verify-code 一次异源代码审查 → **你说 close 才做物理交付**（commit / archive / merge / push / cleanup）。需要你的点只有三处：方向确认、规格冻结、close 授权；其余不打扰。
  2. **页面范围**（OI-18）：`non_ui`。三输入 = 原始需求无页面诉求、仓库当前无涉及本任务的界面改动、计划改动面全在 `runtime/` `tools/` `skills/` `docs/` 与治理文档；唯一「人看的输出」是命令行文本（`status`、审查报告、验收账）。**不新增页面、仪表盘或可视化**；若四条修复意外引入人看的界面，必须重算该判定。
  3. **数据状态**（OI-19）：写 = 四份材料（本阶段只写 `decision-log.md`）＋ 任务 store 的 `facts.jsonl`（K2 行，两型：`stage` / `close_action`）、`quality/**`（facts / evidence / reviews / confirmations / tests / verify.json）、`identity/executions/**`；改 = 仓库治理文档与 6 个 ADR、`docs/architecture/*.json`、`package.json`、`.markdownlint-cli2.jsonc`、四条修复的 runtime 站点、C7 第 10 项点名的 close 计划落盘段、父材料 `decision-log.md`（X1–X14 更正）；一次性最小写 = 受害任务的 `facts.jsonl` 身份字段。失效条件：本任务的 K2 行绑定当前材料修订；材料正常编辑**不**让旧事实失效（C5 之后）。
  4. **成功/失败边界**（OI-20）：成功 = C7 13 条 AC ＋ C8 9 条 AC ＋ 四条阻塞逐条验证 ＋ 异源复核完成；失败 = 任一条不成立就**停在那条**如实记录，不放宽判据、不假装后面完成、不回退已过批次；可原地重试 = 测试/命令失败、provider `unavailable`（换 provider 或换时间重派）；必须重新确认 = 方向性改变、范围变化、风险接受。
  5. **非目标**（OI-21）：E-1 ~ E-20 原样沿用；本任务新增：不为四条缺陷新增控制面（不加检查器 / schema / gate）、不改历史证据字节（只做身份字段最小重算或明确登记）、不修宿主/broker/3rd-review 仓内能力、不重跑真实任务采基线。
  6. **延期项**（OI-22）：**零延期**。跨仓（3rd-review 判死逻辑）与宿主能力按**非目标**登记，写清影响面且**不阻断任何阶段结束**。

- **`reply`（用户真实原话，逐字）**：`Q1A 任务3会在任务2完全合并之后再开始build-code` / `Q2A Q3A Q4A Q5A Q6A`（2026-09-12，本会话）。
- **`resume` 与重排**：六题全部选 A；Q1 附带一条**用户补充约束**（不是我的推定）：任务Ⅲ 的 build-code 在任务Ⅱ 完全合并之后才开始 —— 已作为 OI-09 的判据与反例写死（见 §2.4 与 §3.6 第 1 项）。本轮无依赖题、无新增冲突，不产生 Round 2b。
- 收到的处置：
  - T-010（OI-03）：对照表范围 = C7 §2 点名对象 + 本任务实际改动文件（约 15 项），不做全仓对照。
  - T-011（OI-08）：四条修复排在 C7 之前。
  - T-012（OI-09）：build-code 等任务Ⅱ 完全合并后再开始；等待期只出材料、不改仓库文件。
  - T-013（OI-12 / OI-14）：沿用 13+9 条 AC，四条各加 oracle，新增红判失败；基线 = 本任务重测值（610 / 0 / 2 问题 / 82）。
  - T-014（OI-13）：真实异源审查 + 独立子代理复核双轨；不可用如实记 `unavailable`。
  - T-015（OI-17 ~ OI-22）：六类边界确认稿全部确认（用户流程三处人工确认点、`non_ui`、数据状态清单、成功/失败边界、四条新增非目标、零延期）。
- **状态**：`resumed`（Round 2 完成）。**Round 3 前仍有 2 条 OI `open`**：OI-15（防未来新增的核验方式）与 OI-23（执行纪律，方审 B12 新增）。

### 5.3 Talk Round 3（step 7，进行中）

- **状态**：`ask`（2026-09-12，主会话向用户发出问题卡 R3-Q1 ~ R3-Q5）。
- **输入（技能法定要求）**：方向审查的红蓝争议清单 **D1–D3**（见 §7.3）+ findings 中确需用户裁定的 4 项（R5/B6、B3/B9、B8、B12）。D1 与 D2 已由用户在 Q1A/Q3A 中裁定，本轮只呈报并确认机制，不再重开方向。

| 题号 | 决策轴 | 选项 | 选它的后果 | 主要风险 |
| --- | --- | --- | --- | --- |
| R3-Q1 | `verify-structure.mjs` 的 2 条 FAIL（OI-11 / B3 / B9） | A 改 CONTEXT.md（补第五阶段「验收（test-acceptance）」别名 + 改写 3 处触发 denylist 的路径措辞），不动守卫；B 改守卫脚本口径（denylist 去掉已成项目术语的 `runtime` + 五段术语按现行阶段名）；C 如实登记为已知红、本任务不动 | A：守卫原样、两条真清零 / B：规则与事实对齐、文档可正常写路径 / C：最保守、不改任何东西 | A：为绕开机器检查而写别扭措辞（可读性下降）/ B：撞 RK-C7-4「放宽守卫凑绿」的嫌疑，必须写明为何是「订正陈旧规则」而非削弱边界 / C：`npm run check` 保持红，`C7-AC-7` 的「清零」判据要改成「不劣化 + 登记」 |
| R3-Q2 | 坏行的「恢复路径」机制确认（OI-10 / D2 / B8） | A 修写侧 + 受害任务**重跑一次 stage end**（同 stage 行原地替换，既有行为）+ 现场实测读回；B 在 A 之上再要求读侧同时接受「scope 或整集」两种指纹；C 只修写侧，读回不作验收项 | A：不迁移历史字节、不做兼容桥、不新增字段，且可现场验证 / B：双保险、判定更宽 / C：最省事 | A：需要动受害任务的 stage end（属其自身正常流程）/ B：放宽「材料变了也算有效」的范围，可能与 C5 的方向叠加过头 / C：与用户 Q3A 和 B8 冲突 |
| R3-Q3 | 「已知阻塞」的权威边界（OI-05 / R5 / B6） | A 三条来源合成权威清单：PRD 已登记 51 条 X（逐条处置）+ 现场四条 + 按八类分类学逐类扫描，并写明纳入判据与排除项；B 只认现场四条 + PRD 已登记，不做扫描；C 不设边界、遇到再登记 | A：能回答「是否穷尽」，且与 Q2A 的「八类各有防护」自洽 / B：省一次扫描 / C：最省事 | A：扫描可能带出新项（当前不可知）/ B：无法回答穷尽性（正是 R5/B6 的指控）/ C：审查指出的缺口原样保留 |
| R3-Q4 | OI-15 终态：防未来新增怎么核验 | A 用现有判据（C7-AC-3 的负向条款 + 八类分类学 + checklist 条目数=22 的机器守卫）+ 本任务材料自检，**不新增检查器**；B 新增一个专责检查器；C 只靠人工复核不落判据 | A：零新增控制面，且判据可执行 / B：机器可查但撞 E-11/F11「不得另造计数器」 / C：无判据 | A：依赖现有守卫的覆盖面（已知它会检查条目数与编号集合）/ B：直接违反已确认非目标 / C：等于没有验收 |
| R3-Q5 | OI-23 终态：执行纪律怎么落 | A 写成可核对约束并落进材料执行记录（重读量动作点由子代理执行、主会话只收「路径 + exit_code + 清单」摘要；不新增对象）；B 只作口头约定、不登记 | A：R-009 有承载、可复核 / B：最轻 | A：需在 build-code 执行记录里逐次体现（属既有记录面）/ B：审查 B12 的缺口保留 |

- **`reply`（用户真实原话，逐字）**：`R3-Q1：A` / `R3-Q2：C，受害任务已经结束，无法真跑现场了` / `R3-Q3：A` / `R3-Q4：A` / `R3-Q5：A`，并附用户当场指出的缺口：**「你一直在针对4个新的阻塞进行调研分析提问，原本任务3的所有规划你全都遗漏了」**。
- **`resume` 与重排**：
  - T-016（OI-11 / B3）：R3-Q1 = A —— 改 `CONTEXT.md`（补第五阶段「验收（test-acceptance）」别名 + 改写 3 处触发 denylist 的路径措辞），**不动守卫脚本**。
  - T-017（OI-10 / D2 / B8）：R3-Q2 **改选 C** —— 只修写侧，**现场读回不作验收项**（用户补充事实：受害任务已结束，无法真跑现场）。补偿判据 = 写侧修复 + 针对性回归测试 + 历史坏行如实登记。
  - T-018（OI-05 / R5 / B6）：R3-Q3 = A —— 阻塞清单权威边界 = PRD 51 条 X + 现场四条 + 八类分类学逐类扫描，并写明纳入判据与排除项。
  - T-019（OI-15 / R3-R4-B4）：R3-Q4 = A —— 用现有判据核验，不新增检查器。
  - T-020（OI-23 / B12）：R3-Q5 = A —— 执行纪律写成可核对约束并落进执行记录。
  - **缺口纠正（用户当场指出）**：Round 1–3 的问题几乎全部围绕四条新阻塞，**任务Ⅲ 原本的 C7/C8 规划没有被逐条摆到桌面上**。已补 **§8「任务Ⅲ 原始规划（C7 / C8）的逐条落地审查」**，并据此发出 **Round 4**（§5.4）。
- **状态**：`resumed`（Round 3 完成）；随后进入 Round 4（任务Ⅲ 原始规划）。

### 5.4 Talk Round 4（step 7 续，进行中）：任务Ⅲ 原始规划 C7 / C8

- **状态**：`ask`（2026-09-12）。**本轮目的**：把 PRD 里任务Ⅲ 的 C7（17 FR）与 C8（10 FR / 9 AC）在 HEAD 实测事实下逐条落地，并请用户对 6 个无法由事实或既有裁定回答的点拍板。逐条落地状态见 **§8**。
- **本轮口径**：全部为互不依赖的独立决策轴；每题的推荐项都在 §8 有实测依据。

| 题号 | 决策轴 | 选项 | 选它的后果 | 主要风险 |
| --- | --- | --- | --- | --- |
| R4-Q1 | `C7-FR-1` / `FR-2`：F3 的 `hash` 与 F6 的「内容校验值」怎么写 | A 按代码事实写宪法（F3 **保留** hash 作为写边界 fail-loud 条件之一，只把身份/校验值各管什么写清；F6 只更正行号到 `:51`）并登记「上游 FR 与代码事实冲突，按事实改判」；B 按 PRD 字面删掉，并如实登记由此产生的**新**文档-代码不一致；C 按字面删，同时删掉代码里的 hash 强制 | A：治理文字与代码一致，任务目标达成 / B：交付一个已知不一致（与本任务目标相反）/ C：范围外扩且削弱写边界安全校验 | A：等于修正上游已确认 FR 的落地形态（必须显式登记，不得静默改）/ B：`C7-AC-1` 无法闭合 / C：撞 C7 的代码改动边界（只允许 close 收敛） |
| R4-Q2 | `C7-FR-3`：「控制面净减法」落 F5 还是 F11 | A 落 F11（语义最贴：控制面受限 + consumer/oracle/退出条件）/ B 落 F5（偏 gate 类）/ C 两处都写 | A：语义与位置匹配 / B：偏「关卡」语义，覆盖不到对象类控制面 / C：同一概念两处定义 | C：撞「同一概念只有一处定义」；A/B 均需同步 checklist 与修订记录 |
| R4-Q3 | `C7-FR-10`：`package.json` 的 `npm test`（258 文件全量）与仓库禁令、CI 实际跑 `npm test` 三者冲突 | A 改脚本语义（`test` 不再是无范围全量、CI 走具名分组）+ 文档写清例外；B 只改文档、把 `npm test` 标为「仅 CI 的例外」；C 不动，如实登记为已知例外 | A：规则、脚本、CI 三者一致 / B：最小改动 / C：最保守 | A：要动 CI 与脚本（影响面最大，需写清不劣化）/ B：脚本与禁令仍字面冲突 / C：矛盾保留 |
| R4-Q4 | `C7-FR-14` / `FR-17`：父材料 `specs/workflowhub-mechanism-simplification-20260910/decision-log.md` 能不能改 | A 视为**本任务组的上游活材料**（在 worktree 内）：允许更正 X1–X14 与修 82 条 lint；「不改历史字节」只约束 test/review/provenance 证据；B 父材料也按历史只读（则 FR-14/FR-17 只能登记为不执行）；C 只修 lint、不改内容 | A：上游材料矛盾被清掉、lint 归零 / B：最保守但 FR-14/17 落空 / C：矛盾留在上游 | A：要显式写出边界，避免被读成「随意改历史」/ B：`C7-FR-14/17` 判不通过 / C：X1–X14 的矛盾保留 |
| R4-Q5 | `C8-AC-3`：M4「git 净行数必须为负」的口径 | A M4 = **整条整改线**（任务Ⅰ+Ⅱ+Ⅲ 三个合并提交 numstat 合计）为负，单看任务Ⅲ 允许为正并写明「治理文字属 PRD 承认的唯一合法净增」；B 只算本任务且必须为负（则 C7 必须削减治理文字或额外删代码抵消）；C 只登记本任务实测值、不设正负判据 | A：与 C7 §18 自陈一致，账仍可复核 / B：判据严格但可能逼出「为凑负数而删东西」/ C：放弃 AC-3 | A：需要把三个任务的口径写清（跨任务账）/ B：与「净减法以删为主体」张力大 / C：C8 少一条验收 |
| R4-Q6 | `C8-FR-5`（D-015③ 链路验收）与 `C8-FR-10`（不新跑真实任务）的张力 | A 用**本任务自己的材料与 store** 做链路验收（材料写完 → `status` 立即可读 → 重放不产生重复行）；B 真跑一个真实任务（需放宽 FR-10）；C 不做链路验收，登记 `unknown`/`not_run` 并说明 | A：既做链路验收又不新开任务 / B：最接近原始意图但违反 FR-10 / C：如实但不验收 | A：链路范围限于本任务（覆盖面较小，需写明限制）/ B：与已确认 FR 冲突 / C：C8-AC-5 判不通过 |

- **`reply`（用户真实原话，逐字）**：`Q1：B，我希望整个workflowhub以后尽量不要再出现hash了，这是明显过程工程化的产物！` / `Q2：A` / `Q3：A` / `Q4：A` / `Q5：A` / `Q6：A`。
- **`resume` 与重排**：
  - T-021（C7-FR-1 / FR-2）：**B** —— 按字面把 F3 的 `hash`、F6 正例的「合同内容校验值」表述删掉；宪法不再**要求** hash（代码做得多不构成矛盾）；代码侧 hash 用法登记进 §8.3 清单。**并升级为 R-019 方向**：见 T-022。
  - T-022（**R-019 / OI-24，本会话新增需求**）：hash 净减方向 —— ① 宪法层写「默认不新增 hash，新增须先证明必要」；② 本任务产出**现有 hash 用法清单**（身份绑定 / 完整性校验 / 过程化产物三类 + 逐条处置与理由）；③ 不新增任何 hash 字段或校验。
  - T-023（C7-FR-3）：**A** —— 「控制面净减法」写进 **F11**，并在同段并入 R-019 的默认不新增 hash。
  - T-024（C7-FR-10）：**A** —— 改 `package.json` 的 `test` 语义 + CI 走具名分组 + 文档写清例外；**范围显式扩到 `.github/workflows/ci.yml`**（配置/CI 层，按不劣化判）。
  - T-025（C7-FR-14 / FR-17）：**A** —— 父材料视为**上游活材料**，允许更正 X1–X14 与修 82 条 lint；「不改历史字节」只约束 test/review/provenance 证据（边界写进 §3.3）。
  - T-026（C8-AC-3 / M4）：**A** —— M4 = **整条整改线**（任务Ⅰ+Ⅱ+Ⅲ 合计）为负；单看任务Ⅲ 允许为正并写明理由。
  - T-027（C8-FR-5 / FR-10）：**A** —— 用**本任务自己的材料与 store** 做链路验收（材料写完 → `status` 立即可读 → 重放不重复），不新开真实任务；覆盖面限制写进验收账。
- **状态**：`resumed`（Round 4 完成）。**全部 24 条 OI 已有终态**；下一步 step 8（Grill）→ step 9（决策草稿）→ step 10（细节审查）→ 用户方向确认。

---

## 8. 任务Ⅲ 原始规划（C7 / C8）的逐条落地审查

> 本节补上本阶段此前的缺口：**PRD 里任务Ⅲ 的原始规划（C7 治理同步 + C8 双证验收）逐条对照 HEAD 实测事实**。只列「PRD 要求 → 实测现状 → 本任务落地形态 → 是否需要用户拍板」。原始 18 字段卡见 `prd.md:3401-3901`；此处只做落地判定，不重抄卡片。

### 8.1 C7 的 17 条 FR

| FR | PRD 要求（摘要） | HEAD 实测现状 | 本任务落地形态 | 需用户定？ |
| --- | --- | --- | --- | --- |
| `C7-FR-1` | 修订 F3：`hash` → 「任务与工作区身份」，F3 定义句不再要求 hash | `CONSTITUTION.md:28` **仍写 hash 是「写成功前 fail-loud」条件**；`write-boundary-preflight.mjs:86-87/:104/:116-121` **仍强制 hash** | **已定 R4-Q1 = B**：按字面把 F3 的 `hash` 表述删掉（宪法不再**要求** hash；代码做得多不等于矛盾），并把代码侧 hash 用法登记进 §8.4 的 hash 清单 | 已定 |
| `C7-FR-2` | 修订 F6：去掉「内容校验值」要求（PRD 引 `CONSTITUTION.md:49`） | 定义句 `:49` **已无**该词；「合同内容校验值」在**正例 `:51`**；代码仍算/校验 `contracts.*.sha256` | **已定 R4-Q1 = B**：删正例里的「合同内容校验值」表述；改前/改后原文与行号按实测（`:51`）写进对照表 | 已定 |
| `C7-FR-3` | 「控制面净减法」写成 F5 或 F11 的一句硬规则 | 全仓（宪法/checklist/AGENTS/CLAUDE）**零命中**，只在 `specs/` 任务材料里 | **已定 R4-Q2 = A**：写进 **F11**；同一段落里并入 R-019 的「默认不新增 hash」 | 已定 |
| `C7-FR-4` | 同步 checklist、版本号、修订记录、旧→新映射；条目数保持 22 | 机器守卫在：`verify-structure.mjs:14/:26-36/:63-64`；当前 22 = 22 | 机械执行（漏一件即治理缺陷） | 否 |
| `C7-FR-5` | 守卫三要件写入宪法负向条款旁 | 待写入 | 机械执行 | 否 |
| `C7-FR-6` | 「已裁定不采纳」清单进负向条款 + checklist 一条对照项（非条款区，不加第 23 条） | 待写入；PRD 已写死形态 | 机械执行 | 否 |
| `C7-FR-7` | 八类阻塞分类学常驻规则进宪法 | 待写入（PRD `prd.md:81-82` 有草案） | 机械执行 | 否 |
| `C7-FR-8` | `check-extensibility.mjs` 的宪法/文档表述与删哈希后一致 | 实现替代归任务Ⅱ（C5） | 表述同步须在任务Ⅱ 合入后写（T-012 保证） | 否 |
| `C7-FR-9` | `AGENTS.md:44/:58` 与 D-004/D-023 的冲突修正 | 实测仍是旧保留清单（`index.json`、`quality/verify.json`）；代码侧两者仍在用（`task-handle.mjs:417-419`、`quality-store.mjs:258`） | **必须等任务Ⅱ（C5/C6）合入后**按实际结果改写 | 否（已由 T-012 保证） |
| `C7-FR-10` | 三处治理矛盾：顶层 `schemas/`、`audit-contracts.md` 死对象、`package.json` 的 `npm test` | 实测**四处**（多 `README.md:22`）；`audit-contracts.md` 点名的 `core/audit-aggregator.mjs` 与 `runtime/evidence/audit-summary-carrier.mjs` **都不存在**；`package.json:12-14` 的 `npm test` = 258 文件全量，而 `.github/workflows/ci.yml:26` 真在跑它 | **已定 R4-Q3 = A**：改脚本语义（`test` 不再是无范围全量、改显式分组）+ CI 走具名分组 + 文档写清例外。**范围因此显式扩到 `.github/workflows/ci.yml`**（属配置/CI，非 runtime 行为），按「不劣化」判 | 已定 |
| `C7-FR-11` | `move-map.json` / `control-plane-inventory.json` 登记义务同步 | 实测 entries = **372**、controls = **7（全部 retain）**、skip_dispositions = **21** | 机械重核；X51「4 条 retain 与决定冲突」按 **7 条**重判（等任务Ⅱ 结果） | 否 |
| `C7-FR-12` | `operations/close/**` 多文件计划收敛 + 五动作结果写 K2 的 `close_action` 行（本卡唯一代码删除面） | PRD 已点名 `core/task-close.mjs` 6 处落盘点 + `tools/cli/task-close.mjs` 读取面；保留确认凭证与 plan hash 校验 | 机械执行（build-plan 排批次） | 否 |
| `C7-FR-13` | 更正 D-025③：`prd.md` **不是第五份材料** | `CURRENT_MATERIAL_FILES` 仍为 4 项（`material-workspace.mjs:7`） | 机械执行 | 否 |
| `C7-FR-14` | 父材料 X1–X14 逐项更正 | 父材料 = `specs/workflowhub-mechanism-simplification-20260910/decision-log.md`（**在本任务 worktree 内**、1,979 行、82 条 lint） | **已定 R4-Q4 = A**：视为**本任务组的上游活材料**，允许更正 X1–X14 与修 lint；「不改历史字节」只约束 test/review/provenance 证据（边界见 §3.3 的精确化） | 已定 |
| `C7-FR-15` | 清零 HEAD 上 10 条 `check-task-record-paths.mjs` FAIL | **实测已是 0 FAIL（PASS）** —— 任务Ⅰ 已清掉 | **改判**：本卡无需执行，改为「保持 0，不得回升」 | 否（事实改判） |
| `C7-FR-16` | 清零 2 条 `verify-structure.mjs` FAIL | 实测 exit 1、2 个问题（CONTEXT.md 缺 `test-acceptance` 别名 + 3 处 `runtime` 触发 denylist） | **R3-Q1 = A**：改 CONTEXT.md，不动守卫 | 已定 |
| `C7-FR-17` | 清零父材料 `decision-log.md` 的 82 条 markdownlint | 实测 **82**（规则分解逐项吻合） | 逐条修；**不得**把该文件加进 ignores | 否 |

### 8.2 C8 的 10 条 FR / 9 条 AC

| 项 | PRD 要求 | 落地前置与状态 | 需用户定？ |
| --- | --- | --- | --- |
| 静态净减法（`C8-FR-1` / `AC-1`） | C1 的**最终具名删除清单**逐项 `test ! -e`，每项附「无真实 consumer」证据 | C1 清单随任务Ⅰ **已归档**（`specs/archive/…-t1-20260911/`，另有 C0 的 M1–M5 口径表在 `spec.md:154-170`）⇒ C8 从归档材料取清单，不自行编造 | 否 |
| M1–M5 对照 C0 基线（`C8-FR-2` / `AC-2`） | 逐项判「净减 / 不劣化 / 劣化 / `unknown`」 | 复用任务Ⅰ C0 冻结口径；本任务**不新增仪器** | 否 |
| M4 git 净行数为负（`C8-FR-3` / `AC-3`） | Σadded − Σremoved（首父 merge diff）**必须为负** | **已定 R4-Q5 = A**：M4 = **整条整改线**（任务Ⅰ+Ⅱ+Ⅲ 三个合并提交 numstat 合计）为负；单看任务Ⅲ 允许为正，但账里必须写明「本任务的净增是治理文字，属 PRD §18 承认的唯一合法净增」 | 已定 |
| M1/M2 复测（`C8-FR-4` / `AC-4`） | 复测或如实 `unknown` + 说明缺什么 | 任务Ⅰ 已证 M1/M2 在历史数据上不可复现 ⇒ 预期为 `unknown` + 出处说明 | 否 |
| D-015③ 链路功能验收（`C8-FR-5` / `AC-5`） | 写完 → `status` 立即可读 → 重放不产生重复 | **已定 R4-Q6 = A**：用**本任务自己的材料与 store** 做链路验收（不开新真实任务，符合 `C8-FR-10`）；覆盖面限制写进验收账 | 已定 |
| 不可证伪项标 `unknown`（`C8-FR-6` / `AC-6`） | 至少含 token 维度、M1/M2 历史出处、D-013 自指 | 机械登记 | 否 |
| 适配代码计入净增减账（`C8-FR-7` / `AC-7`） | CI 授权表与测试矩阵的新增代码必须计入 | 机械执行 | 否 |
| 异源复核（`C8-FR-8` / `AC-8`） | 非本任务主会话、独立上下文、与执行者不同底层模型 | 已定 T-014（真实审查 + 独立子代理双轨） | 已定 |
| 历史任务不可直接平均（`C8-FR-9`） | 只能逐项对照 | 机械执行 | 否 |
| 不新跑真实任务（`C8-FR-10`） | 本卡不新跑真实任务 | 与 `C8-FR-5` 一并拍板（Q6） | **是** |

### 8.3 hash 用法清单（R-019 / OI-24 的交付物要求）

> 用户 R4-Q1 的方向原话：「我希望整个workflowhub以后尽量不要再出现hash了，这是明显过程工程化的产物」。本任务据此承担三件事（见 OI-24），其中第 ② 件是**清单**，其形态在此定死，实际清单在 build-code 产出：

- **扫描范围与命令**（可复算）：对 `runtime/`、`tools/`、`core/`、`skills/`、`docs/`、`CONSTITUTION.md` 等治理文件，用 `grep -rn "sha256\|SHA256\|hash\b\|digest" --include=*.mjs --include=*.json --include=*.md` 取全集，再逐条归入以下三类：
  1. **身份绑定**（例：K2 行的 `material_digest`、`snapshot_tree`、task/worktree/runtime 身份）——不是过程化产物，**保留**，并写明它绑定的是什么；
  2. **完整性校验**（例：invocation record 的 hash、contracts 的 sha256、证据字节哈希）——保留或替换由后续任务按净减法判定，本任务**只登记**；
  3. **过程化产物**（例：材料 revision 引发的失效链、被 PRD 判为无 consumer 的校验值）——**本任务删除**。
- **判据**：清单每条必须有 `路径:行号 | 类别 | 处置 | 理由 | 若保留，它绑定什么`；缺任一项即判清单不合格。
- **边界**：本任务**不新增任何 hash 字段或校验**；把身份/完整性类 hash 当过程化产物删掉（导致 K2/K5 绑定失效）同样判不符合。
- **落点**：清单进本任务材料（spec/plan 的对应节），**不新增第五份材料、不新增文件**。

### 8.4 上游需求覆盖（PRD `R-001` ~ `R-015` → 本任务）

| 上游需求 | 本任务承载 | 状态 |
| --- | --- | --- |
| R-001 不接受 followup 方案 / R-002 机制极大问题 | 全体（方案形态即回应）；C7+C8 的落地 | 由本任务的范围与验收承载 |
| R-003 >50% 花在机制上 | C8 的 M1–M5 对照（token 维度标 `unknown`） | 已定 OI-14 / T-013 |
| R-004 改动会再加东西 | C7 的宪法负向条款 + 守卫三要件 + 净减法硬规则 | OI-15（R3-Q4 已定核验方式） |
| R-005 更优雅方案 | C8 的 M4 + 净减账（**口径待 Q5**） | 待定 |
| R-006 未来不再阻塞 | C7 分类学常驻规则 + C4/C9（任务Ⅱ）+ 本任务四条修复 | OI-05（判据两条都要） |
| R-007 记录该记录的 + 少门禁 | C3（任务Ⅰ 已合入）K2 唯一记录 + 本任务不新增门禁 | 已定（非目标） |
| R-008 点名对象族 16 个 | C1/C2/C3（任务Ⅰ）+ C5/C6（任务Ⅱ）+ 四条修复 | 跨任务承接 |
| R-009 流程纪律 + 上下文控制 | 五阶段不跳 + **OI-23**（R3-Q5 已定） | 已定 |
| R-010 本任务不实现（旧范围） | 已被「任务Ⅲ 真的改代码」取代 | 历史 |
| R-011 交互纪律 | 执行事实 | 已定 |
| R-012 调研输入 7 份 | 只读来源 | 已消费 |
| R-013 不靠 timeout 关闭审查 | C4（任务Ⅱ） | 跨任务承接 |
| R-014 窄修复包 | C4（任务Ⅱ） | 跨任务承接 |
| R-015 Phase 循环瘦身与 RED/GREEN 卫生 | C3/C4/C7 分摊；本任务承担 C7 侧（宿主 worktree 非目标登记） | 部分待 C7 落地 |

---

## 9. Grill（step 8 · grill-with-docs）

### 9.1 问题卡与真实答复

| 题号 | 决策轴 | 选项 | 用户真实答复 |
| --- | --- | --- | --- |
| G1 | 任务Ⅱ 长期不合入时的处理（T-012 已定 build-code 等它完全合并） | A 每次会话如实核对并记「仍在等」的事实，不擅自先改文件；B 设期限到期重新裁定；C 现在就把四条修复拆成独立小任务（需推翻 T-012） | **A** |
| G2 | 宪法升版方式 | A 按 `CONSTITUTION.md:187` 机械升版（1.8.0 → 1.9.0，条目数仍 22），改前/改后原文在 build-spec 起草时先给用户看；B 全部定稿时一次性看；C 不升版（违反 187） | **A** |
| G3 | R-019 hash 清单里本任务动手删哪一类 | A 删治理文字侧表述 + 判为「过程化产物」的项（与任务Ⅱ 删失效链重叠的以任务Ⅱ 结果为准，不重复删），身份/完整性类只登记；B 连无 consumer 的完整性校验也删；C 代码侧全部只登记不删 | **A** |

- 原始答复逐字：`G1：A` / `G2：A` / `G3：A`（2026-09-12）。
- 处置编号：T-028（G1）、T-029（G2）、T-030（G3）。

### 9.2 Grill 四项客观退出检查

| # | 检查项 | 结果 | 事实依据 |
| --- | --- | --- | --- |
| 1 | 外部依赖接口是否已核实真实定义（非文档假设） | pass | §6：官方运行通道（`run --action=draft/execute/reflect`、`review --action=record`、`confirm --action=decision`）由独立子代理核实；本阶段已实际用官方通道跑过一次方向审查 |
| 2 | 涉及字段/路径命名是否已有唯一权威定义 | pass | §8.3 定死 hash 清单的扫描命令与三类判据；§4.4 定死「不新增行字段 / 不新增状态字面量」；§3.6 定死批次顺序 |
| 3 | 失败路径/异常语义是否明确 | pass | §3.6 第 6 条 + §4.5 边界声明：任一条只能靠扩权才能修 ⇒ 停在那条、如实记 `incomplete`、交用户裁定，不默认扩权 |
| 4 | 范围边界「做什么/不做什么」是否写死 | pass | §3.3 非目标（含 R4-Q4 精确化的「历史字节」边界）+ §3.1 范围内 + §8.1/§8.2 逐条落地 |

### 9.3 结束记录（grill_summary）

```yaml
grill_summary:
  status: completed
  direction_changing_challenges_resolved: true
  context:
    status: no-change
    reason: "本任务未引入新的领域概念；hash 净减是治理方向，属控制面纪律而非新术语，CONTEXT.md 按技能边界只收领域概念"
    file_references: []
  adr:
    status: not-needed
    reason: "本任务的删除边界已由任务Ⅰ 的 docs/adr/0030-mechanism-simplification-deletion-boundary.md 记录；本任务无新的难反转取舍需要单独 ADR（治理同步 + 验收）"
    file_references: ["docs/adr/0030-mechanism-simplification-deletion-boundary.md"]
  conflicts:
    status: resolved
    disposition: "「C7 只允许 operations/close 的代码改动」与 R4-Q3=A（改 package.json 与 CI 配置）之间有张力：已显式登记为**配置/CI 层扩权**，非 runtime 行为改动，按「不劣化」判；未静默扩权"
  requirement_coverage:
    status: complete
    message_classes: [goal, flow_or_surface, data_or_state, success_failure_acceptance, constraint_non_goal_defer]
    uncovered: []
  exit_checks:
    external_interfaces: pass
    canonical_names: pass
    failure_semantics: pass
    scope_boundaries: pass
  decision_updates:
    - G1：任务Ⅱ 未合入期间只记事实、不擅自先改文件（T-028）
    - G2：宪法按 187 机械升版至 1.9.0，措辞在 build-spec 起草时先给用户看（T-029）
    - G3：本任务只删治理文字侧 hash 表述 + 过程化产物类，身份/完整性类只登记（T-030）
```

---

## 核心需求

用户要的不是「再修一个 bug」，而是 **WorkflowHub 不要再反复出现同类阻塞**。原话三条要点（R-001 ~ R-009）：

- 按标准五阶段做完第三个任务（任务Ⅲ），不跳阶段、不依赖 build-spec 补需求。
- 做完之后**所有已知阻塞消失**，而不是「又一次把问题记下来」。
- 现场证据是 PaperBuilder 报告的四条缺陷；反复出现这类阻塞本身就是痛点。

## 核心目标

把任务Ⅲ 做成「阻塞消失」这件事的**可验证交付**：① C7 让治理文字与代码事实逐条一致，并把「控制面净减法 / 默认不新增 hash / 八类阻塞分类学」写进宪法（F11 与负向条款）；② 四条现场阻塞修好（含唯一会 exit 1 的那条），并有针对性测试；③ C8 用可复算命令给出双证验收（静态净减 + M1–M5 对照）与**逐条阻塞账**；④ 全程零新增控制面、零延期项，并**达成**「以后同类阻塞不再反复」所需的防护与 owner。

## 验收标准

- **成功**：C7 的 13 条 AC + C8 的 9 条 AC 全部满足；四条阻塞逐条有修复与验证命令；八类阻塞逐类有防护与 owner；逐条阻塞账可被第三方用同一条命令复算出同一结论。
- **失败**：任一 AC 不成立即**停在那条**如实记录，不放宽判据、不假装完成、不回退已过批次；任何计数上升（新增红）一律判失败。
- **边界**：基线 = 本任务开工 HEAD 重测值（全仓 markdownlint **610** / path-guard **0** / verify-structure **2 个问题** / 父材料 **82**）；「不劣化」是下限，「本任务范围内清零」是上限。

## 决定

> 每条含：问题与最终选项 / 是否推荐 / 大白话含义 / 决定 / 来源 / 事实与约束 / Logic / 选择理由 / 影响 / 后果与风险 / 被拒方案 / 未决项 / Supersedes / 批准绑定。来源一律指向本会话真实答复（T 号）或实测事实（F 号、§号）。

### D-001 任务范围（模块：范围）

- **问题与最终选项**：第三个任务只做 PRD 的任务Ⅲ，还是把现场四条阻塞也算进来？→ **A：一起做**。
- **推荐**：是（主会话推荐 A）。**大白话**：这一个任务做完，你手上的阻塞就真的没了。
- **决定**：本任务 = C7 治理同步 + C8 双证验收 + PaperBuilder 四条现场阻塞，一条合并列车、一个任务收口。
- **来源**：用户 R1-Q1（T-001）。**事实与约束**：四条在 PRD 的 51 条 X 中零命中，任务Ⅱ 四材料同样零命中（F-10）⇒ 无人认领。
- **Logic**：四条无人认领且现场已复现 → 若排除则仍会漏 → 并入本任务 → 「阻塞消失」由本任务交付。
- **影响**：范围、批次、合并顺序。**后果与风险**：任务变大；与任务Ⅱ 同文件冲突（由 D-007 关闭）。
- **被拒方案**：B 另开小任务（多一次 close，且「第三个任务做完阻塞消失」名义不成立）；C 塞进在研任务Ⅱ（其四材料已定稿，需重走确认并推迟交付）。
- **未决项**：无。**Supersedes**：none。**批准绑定**：R1 真实答复 `Q1A`（会话内）。

### D-002 「阻塞消失」的判据（模块：验收）

- **问题与最终选项**：口径层面的「八类各有防护与 owner」、事实层面的「具体阻塞逐条清零」，还是都要？→ **A：都要**。
- **推荐**：是。**大白话**：既把眼前清干净，也让以后同类问题有人负责。
- **决定**：判据 = ① 已知阻塞逐条清零（现象→根因→修复→验证命令→证据）；② 八类阻塞逐类有防护与 owner。
- **来源**：用户 R1-Q2（T-004）；`prd.md:81-82`、`prd.md:143`。**事实与约束**：八类分类学是 PRD 既有口径，本任务只需落实，不新造。
- **Logic**：只做 ①→复发无主；只做 ②→事实未变 ⇒ 两条同时成立才对齐用户原话。
- **影响**：验收面。**后果与风险**：需要一份逐条账 + 一份分类学防护表（都进现有材料，不新增文件）。
- **被拒方案**：B 只逐条清零；C 只写分类学。**未决项**：无。**Supersedes**：none。**批准绑定**：R1 真实答复 `Q2A`。

### D-003 阻塞清单的权威边界（模块：验收）

- **问题与最终选项**：什么算「已知阻塞」、怎么证明不遗漏？→ **A：三条来源合成**。
- **推荐**：是。**大白话**：清单得有出处，不能凭我感觉。
- **决定**：权威清单 = PRD 已登记的 51 条 X（逐条处置）+ 现场四条 + 按八类分类学逐类扫描本任务范围；清单写明纳入判据与排除项（跨仓、宿主按非目标登记）。
- **来源**：用户 R3-Q3（T-018）；方审 R5/B6。**事实与约束**：审查两次指控「无人证明四条穷尽」。
- **Logic**：无权威边界 → 无法回答穷尽性 → 合成三来源 + 写明排除 → 可回答。
- **影响**：验收账、扫描工作量。**后果与风险**：扫描可能带出新项（当前不可知，如实登记）。
- **被拒方案**：B 只认现场四条与已登记项；C 不设边界。**未决项**：无。**Supersedes**：none。**批准绑定**：R3 真实答复 `R3-Q3：A`。

### D-004 四条阻塞的落点与顺序（模块：批次）

- **问题与最终选项**：四条放本任务哪个位置？→ **A：排在 C7 之前**。
- **推荐**：是。**大白话**：先把现场堵住，再对齐文档。
- **决定**：四条修复批次先于 C7；C7 的「文档 ↔ 代码」对照表以修复后的代码事实为准。
- **来源**：用户 R2-Q2（T-011）。**事实与约束**：四条涉及 5 个 runtime 文件，与任务Ⅱ 改动面重叠（§4.2）。
- **Logic**：先修现场 → 对照表针对最终代码 → 避免写完文档又改代码。
- **影响**：批次顺序、对照表内容。**后果与风险**：修复引入的测试期望变化必须显式登记（§4.4 硬约束 2）。
- **被拒方案**：B 排在 C7 之后（PaperBuilder 继续等）；C 与 C7 穿插（边界难切）。**未决项**：无。**Supersedes**：none。**批准绑定**：R2 真实答复 `Q2A`。

### D-005 已写坏的现场 stage 行（模块：数据）

- **问题与最终选项**：救回、只修代码、还是给人工路径？→ **R1 选 A（现场读回）→ R3 改选 C（只修写侧，读回不作验收项）**。
- **推荐**：R3 的 C 是用户基于新事实（受害任务已结束）的判断。**大白话**：那个任务已经收尾了，现场跑不了，就把「以后不再写坏」修死，历史那行如实记着。
- **决定**：只修写侧（无 stage outcome 的 stage end 用该 stage 自己的 scope 算指纹）；补偿判据 = 针对性回归测试（该路径零覆盖）+ 历史坏行如实登记；**不迁移字节、不建兼容桥、不加字段**。
- **来源**：用户 R1-Q3（T-006）→ R3-Q2（T-017，附原话「受害任务已经结束，无法真跑现场了」）。**事实与约束**：现场行 `material_digest=4be44b28…`（四材料整集）vs 读侧期望 `be6aea66…`（一元 scope）——本次已复现（F-13/§4.2）；行字段表冻结 16 键（§4.4）。
- **Logic**：写侧回退是坏行来源 → 改回退 → 新行不再坏；历史行不可逆 → 如实登记。
- **影响**：runtime 写侧、测试面。**后果与风险**：历史坏行永久不可读（用户已接受）。
- **被拒方案**：A 现场读回（已不可行）；B 读侧同时接受两种指纹（放宽判定）。
- **未决项**：无。**Supersedes**：D-005 的 R1 版本（T-006）已被 R3 版本（T-017）取代，两条都保留在 §5 记录中。**批准绑定**：R3 真实答复 `R3-Q2：C`。

### D-006 预存在的红怎么收（模块：验收）

- **问题与最终选项**：markdownlint / verify-structure / path-guard 分别怎么办？→ **A：窄 ignores + 逐条修 + 不动守卫**。
- **推荐**：是。**大白话**：跟本任务无关的那个目录加一条窄豁免，其余自己修干净，守卫别动。
- **决定**：① 与本任务无关的 specs 目录加**窄 ignores**（写明理由与 owner）；② 其余 markdownlint 逐条修；③ `verify-structure.mjs` 的 2 个问题靠**改 CONTEXT.md**（补第五阶段「验收（test-acceptance）」别名 + 改写 3 处触发 denylist 的路径措辞）清零，**不动守卫脚本**；④ path-guard 在 HEAD 已是 0，保持不回升。
- **来源**：用户 R1-Q4（T-007）+ R3-Q1（T-016）；F-19/F-22/F-23；方审 B3/B9。
- **事实与约束**：全仓 markdownlint 610（specs 占 500/22 文件，其中绝大多数属另一任务）；`verify-structure.mjs:15` 的 denylist 含 `runtime`、`:16` 要求旧五段术语；`specs/archive` 已被 ignores 覆盖（494 文件）。
- **Logic**：无关目录的红逐条修会改另一个任务的历史材料 → 用既有惯例的窄豁免；守卫口径不动 → 不撞「放宽守卫凑绿」（RK-C7-4）。
- **影响**：`.markdownlint-cli2.jsonc`、CONTEXT.md、若干文档。**后果与风险**：为了绕开机器检查而调整措辞，可读性略降（已如实登记）。
- **被拒方案**：B 改守卫口径（撞放宽守卫嫌疑）；C 全部登记为已知红（`npm run check` 持续红）。
- **未决项**：无。**Supersedes**：none。**批准绑定**：R1 `Q4A` + R3 `R3-Q1：A`。

### D-007 与任务Ⅱ 的集成顺序（模块：批次）

- **问题与最终选项**：谁先合、等待期做什么？→ **A + 用户补充约束**。
- **推荐**：是。**大白话**：任务Ⅱ 没合完，这个任务一行代码都不动。
- **决定**：**任务Ⅲ 的 build-code 必须在任务Ⅱ 完全合并之后才开始**；等待期只产出本任务四份材料（make-decision → build-spec → build-plan）；开工前实测任务Ⅱ 的合并提交已是 HEAD 祖先。
- **来源**：用户 R2-Q1（T-012，原话「任务3会在任务2完全合并之后再开始build-code」）+ G1（T-028：未合入期间只记事实、不擅自先改文件）。
- **事实与约束**：任务Ⅱ 分支无独立提交且落后 main 两个提交（F-04/F-24）；5 个 runtime 文件重叠（§4.2）。
- **Logic**：同文件并行改动 → 冲突与返工；串行 → 无冲突，代价是等待。
- **影响**：整个 build-code 的开工时点。**后果与风险**：任务Ⅱ 若长期不合入，本任务停在此处（G1 已定：只记事实、不擅自行动；到期重新裁定）。
- **被拒方案**：B 四条先合入 main（任务Ⅱ 返工）；C 严格按 PRD 顺序把四条排最后（PaperBuilder 等最久）。
- **未决项**：无。**Supersedes**：none。**批准绑定**：R2 真实答复（含补充约束原文）。

### D-008 文档-代码对照表的范围（模块：范围）

- **问题与最终选项**：对照表覆盖多少？→ **A：C7 §2 点名对象 + 本任务实际改动文件**。
- **推荐**：是。**大白话**：只对齐这次真正会动的那些文件。
- **决定**：约 15 项（宪法、checklist、AGENTS/CLAUDE/README、两个 architecture json、audit-contracts、package.json、6 个 ADR、CONTEXT.md、`.markdownlint-cli2.jsonc`、`.github/workflows/ci.yml`）；范围外漂移用「不劣化」兜底。
- **来源**：用户 R2-Q3（T-010）；§4.3 首轮审计。
- **事实与约束**：实测比 PRD 记录**多两处**（`README.md:22`、ADR `0027×2`），数字漂移 5 处（372 / 7 / 35 / 258 等）。
- **Logic**：全仓逐条对照无 consumer 且工作量爆炸 → 限定 C7 点名对象 + 实际改动面。
- **影响**：对照表体量。**后果与风险**：未点名对象的漂移不覆盖（用不劣化兜底，已登记）。
- **被拒方案**：B 全仓对照；C 不做对照表（则「一致」不可验）。**未决项**：无。**Supersedes**：none。**批准绑定**：R2 真实答复 `Q3A`。

### D-009 F3/F6 的 hash 与内容校验值 + hash 净减方向（模块：治理）

- **问题与最终选项**：宪法继续要求 hash，还是按 PRD 字面删掉？→ **B：按字面删**；并升级为**方向性需求 R-019**。
- **推荐**：主会话原推荐 A（按代码事实保留 hash），**用户选 B 并给出方向理由**；已按用户答复执行，并如实登记差异。
- **大白话**：你说的「hash 是过程工程化的产物」，落到宪法上就是——宪法不再要求 hash；代码里还剩的 hash 逐个过一遍，能删的删、必须留的写明为什么。
- **决定**：① F3 删去 `hash` 表述、F6 删去正例里的「合同内容校验值」（改前/改后原文与实测行号进对照表）；② 宪法层写「**默认不新增 hash**，新增必须先证明必要」；③ 产出现有 hash 用法清单（身份绑定 / 完整性校验 / 过程化产物 + 逐条处置与理由）；④ 本任务只删「治理文字侧表述 + 过程化产物类」，身份与完整性类只登记（与任务Ⅱ 删失效链重叠的以任务Ⅱ 结果为准）。
- **来源**：用户 R4-Q1（T-021/T-022，原话「我希望整个workflowhub以后尽量不要再出现hash了，这是明显过程工程化的产物！」）+ R4-Q2（T-023：净减法入 F11）+ G3（T-030）。
- **事实与约束**：`CONSTITUTION.md:28` 仍写 hash 为 fail-loud 条件、`:51` 正例仍写「合同内容校验值」；代码仍强制 hash（`write-boundary-preflight.mjs:86-87/:104/:116-121`）；宪法删的是「要求」，代码做得多不构成矛盾（§4.3 A-01）。
- **Logic**：用户方向 = 净减 hash → 宪法先松绑 → 清单给出逐条处置 → 只删过程化产物，避免误删身份绑定导致 K2/K5 失效。
- **影响**：宪法、checklist、对照表、后续所有改动。**后果与风险**：清单工作量大（需逐条分类）；误删身份类 hash 会破坏绑定（已写进反例）。
- **被拒方案**：A 按代码事实保留 hash（用户明确不同意）；C 连代码 hash 一起删（超出 C7 允许的代码改动面，且削弱写边界）。
- **未决项**：无（清单本任务交付）。**Supersedes**：`C7-FR-1`/`FR-2` 的原始落地形态（PRD 版）被本决定取代并显式登记。**批准绑定**：R4 真实答复 `Q1：B`（含方向原话）。

### D-010 `package.json` / CI 的全量测试冲突（模块：治理）

- **问题与最终选项**：改脚本语义、只改文档、还是不动？→ **A：改脚本语义 + CI 走具名分组**。
- **推荐**：是。**大白话**：仓库自己规定「不许无范围跑全量」，可脚本和 CI 一直在跑全量——把三者对齐。
- **决定**：`test` 不再是无范围全量（改显式分组）；CI 走具名分组；文档写清例外条款。**范围显式扩到 `.github/workflows/ci.yml`**（配置/CI 层，非 runtime 行为）。
- **来源**：用户 R4-Q3（T-024）；§4.3 A-12。**事实与约束**：`package.json:12-14` 的 `test` = 258 文件全量；`AGENTS.md:21` 明令禁止；`.github/workflows/ci.yml:26` 真在跑 `npm test`；`AGENTS.md:22` 有 CI 例外条款。
- **Logic**：规则/脚本/CI 三者不一致 → 改脚本与 CI → 一致且不劣化。
- **影响**：CI 行为、本地测试入口。**后果与风险**：动 CI 影响面最大 ⇒ 判据为「不劣化」，并保留 `test:exclusive` 语义。
- **被拒方案**：B 只改文档；C 不动。**未决项**：无。**Supersedes**：none。**批准绑定**：R4 真实答复 `Q3：A`。

### D-011 父材料的编辑边界（模块：治理）

- **问题与最终选项**：父材料能不能改？→ **A：视为本任务组的上游活材料**。
- **推荐**：是。**大白话**：那份决定记录是这个任务的需求来源，还在用，不是历史档案。
- **决定**：允许按 `C7-FR-14` 更正 X1–X14、按 `FR-17` 修 82 条 lint；「不改历史字节」精确限定为 **test / review / provenance / 已完成任务的证据与记录**。
- **来源**：用户 R4-Q4（T-025）。**事实与约束**：父材料在本任务 worktree 内（`specs/workflowhub-mechanism-simplification-20260910/decision-log.md`，1,979 行、82 条 lint 实测吻合）。
- **Logic**：上游材料仍有 consumer（本任务就是）⇒ 属活材料 ⇒ 可更正；证据类不可改。
- **影响**：父材料字节。**后果与风险**：更正后其整文件哈希变化（原确认哈希本就不可复现，见 X4）。
- **被拒方案**：B 父材料只读（FR-14/17 落空）；C 只修 lint 不改内容（矛盾保留）。**未决项**：无。**Supersedes**：none。**批准绑定**：R4 真实答复 `Q4：A`。

### D-012 C8 的 M4 与链路验收口径（模块：验收）

- **问题与最终选项**：M4 算整条线还是本任务？链路验收怎么做？→ **A / A**。
- **推荐**：是。**大白话**：净减看整条整改线；链路验收用这个任务自己的材料跑，不新开任务。
- **决定**：① M4 = 任务Ⅰ+Ⅱ+Ⅲ 三个合并提交 numstat 合计为负；单看任务Ⅲ 允许为正但必须写明「治理文字属 PRD 承认的唯一合法净增」；② 链路验收用**本任务自己的材料与 store**（材料写完 → `status` 立即可读 → 重放不产生重复），不新开真实任务，覆盖面限制写进验收账。
- **来源**：用户 R4-Q5/Q6（T-026/T-027）；`prd.md:3697`（AC-3）、`prd.md:3699`（AC-5）、`prd.md:3689`（FR-10）。
- **事实与约束**：C7 §18 自陈「唯一合法净增」是治理文字；C8-FR-10 禁新跑真实任务。
- **Logic**：两条 PRD 内部张力各自给出口径 → 可判且不自相矛盾。
- **影响**：验收账、净减账。**后果与风险**：链路覆盖面限于本任务（已写明限制）。
- **被拒方案**：M4 只算本任务（可能逼出为凑负数而删东西）；真跑真实任务（违反 FR-10）；不做链路验收（AC-5 不通过）。
- **未决项**：无。**Supersedes**：none。**批准绑定**：R4 真实答复 `Q5：A`、`Q6：A`。

### D-013 验收与复核口径（模块：验收）

- **问题与最终选项**：AC 是否沿用？基线取哪个？复核怎么做？→ **A / A / A**。
- **推荐**：是。**大白话**：验收标准照 PRD 走、基线用今天重测的数、复核找真外部模型加一个独立子代理。
- **决定**：① 沿用 C7 13 条 + C8 9 条 AC，四条各加针对性 oracle，新增红判失败；② 唯一基线 = 本任务开工 HEAD 重测值（610 / 0 / 2 个问题 / 82）；③ 异源复核 = 真实 wh-review 异源审查（非本会话、不同底层模型）+ 一次独立子代理复核，不可用如实记 `unavailable`。
- **来源**：用户 R2-Q4/Q5（T-013/T-014）。**事实与约束**：PRD 旧基线已漂移（F-22）；PRD 第四/五轮证明两种复核不可互替。
- **Logic**：口径统一 + 基线重测 + 双轨复核 ⇒ 结论可复算且不自审自判。
- **影响**：全部验收判据。**后果与风险**：provider 可能失败（如实登记，不判通过）。
- **被拒方案**：另立更严标准（X50 证明不可达）；只用子代理复核；只用真实 provider。**未决项**：无。**Supersedes**：none。**批准绑定**：R2 真实答复 `Q4A`/`Q5A`。

### D-014 六类边界与非目标、零延期（模块：范围）

- **问题与最终选项**：六类边界确认稿 + 是否沿用 E-1~E-20？→ **A：全部确认 + 沿用 + 四条新增非目标 + 零延期**。
- **推荐**：是。**大白话**：该做的、不做的、什么时候需要你点头，都写死。
- **决定**：用户流程三处人工确认点（方向确认 / 规格冻结 / close 授权）；页面范围 `non_ui`；数据状态清单；成功失败边界；非目标 = E-1~E-20 + 四条新增（不新增控制面、不改历史证据字节、不修宿主、不重跑真实任务）；**零延期项**，仓外项按非目标登记。
- **来源**：用户 R2-Q6（T-015）。**事实与约束**：PRD E-1~E-20；`prd.md:174` E-13。
- **Logic**：边界写死 ⇒ 下游不必猜；零延期 ⇒ 不给未来留口子。
- **影响**：全部下游阶段。**后果与风险**：仓外能力不可用（已写影响面，不阻断阶段）。
- **被拒方案**：把仓外项登记为延期项。**未决项**：无。**Supersedes**：none。**批准绑定**：R2 真实答复 `Q6A`。

### D-015 执行纪律（模块：执行）

- **问题与最终选项**：用户原话里的「主会话上下文控制和子代理派发」怎么落？→ **A：可核对约束 + 落执行记录**。
- **推荐**：是。**大白话**：重活交给子代理干，主会话只收结论，别把长日志拖回来。
- **决定**：重读量动作点（全仓 grep、多文件对标、跑测试/采证据）由子代理执行、主会话只收「路径 + exit_code + 清单」摘要；落进 build-code/verify-code 的执行记录；不新增对象。
- **来源**：用户 §1 原话（R-009）+ R3-Q5（T-020）+ 方审 B12。**事实与约束**：原 22 条 OI 无一承载该要求（审查指出后已补 OI-23）。
- **Logic**：纪律无承载 ⇒ 无法核对 ⇒ 补 OI + 落执行记录。
- **影响**：执行方式。**后果与风险**：无（不新增对象）。**被拒方案**：只作口头约定。**未决项**：无。**Supersedes**：none。**批准绑定**：R3 真实答复 `R3-Q5：A`。

### D-016 宪法升版方式（模块：治理）

- **问题与最终选项**：怎么升版、谁批准措辞？→ **A：按 `CONSTITUTION.md:187` 机械升版，措辞先给用户看**。
- **推荐**：是。**大白话**：宪法改内容就得按它自己的规矩升版本号，新的措辞先给你过目。
- **决定**：1.8.0 → 1.9.0，条目数仍 22，同步修订记录与旧→新映射；**改前/改后原文在 build-spec 起草时先给用户看**。
- **来源**：用户 G2（T-029）。**事实与约束**：`CONSTITUTION.md:187` 四件同步规则 + `verify-structure.mjs:14/:26-36/:63-64` 机器守卫。
- **Logic**：改条目必同步四件 → 机械执行；措辞属用户可见承诺 → 先看后写。
- **影响**：宪法、checklist、版本记录。**后果与风险**：漏同步任一件即治理缺陷。
- **被拒方案**：不升版（违反 187）。**未决项**：无。**Supersedes**：none。**批准绑定**：Grill 真实答复 `G2：A`。

## 风险

| # | 风险 | 影响 | 处置 |
| --- | --- | --- | --- |
| RK-T3-1 | 任务Ⅱ 长期不合入 ⇒ 本任务 build-code 无法开工 | 交付时点 | G1/T-028：只记事实、不擅自先改文件；到期由用户重新裁定 |
| RK-T3-2 | 四条修复与任务Ⅱ 在途改动冲突 | 返工 | T-012：build-code 等任务Ⅱ 完全合并 + 祖先校验（判据与反例已写死） |
| RK-T3-3 | hash 清单误删身份绑定类 ⇒ K2/K5 绑定失效 | 记录不可读 | OI-24 反例写死；G3/T-030：本任务只删治理文字与过程化产物类 |
| RK-T3-4 | `npm test`/CI 改动引入回归 | CI 变红 | 判据 = 不劣化于本任务重测基线；`test:exclusive` 语义保留 |
| RK-T3-5 | 窄 ignores 被读成掩盖问题 | 假绿 | 必须写明理由与 owner（撞 F9 即判不符合） |
| RK-T3-6 | 父材料更正改变其整文件哈希 | 与历史确认值不一致 | 原文不可复现本就是已登记事实（X4）；只更正内容，不伪造历史 |
| RK-T3-7 | 四条修复改变现有测试期望 | 测试红 | §4.4 硬约束 2：变更必须显式登记，不得放宽断言凑绿 |
| RK-T3-8 | provider 限流/不可用（本轮 red 角色 kimi `RATE_LIMITED`） | 复核事实不完整 | 如实记 `partial`/`unavailable`，不判通过；缺失不阻断同任务修复 |

- **延期项**：**零**（用户 R2-Q6/T-015；E-13）。
- **仓外项（非目标登记）**：3rd-review 判死逻辑、宿主/broker 能力、宿主自建 worktree —— 写清影响面，**不阻断任何阶段结束**。

## 收敛检查

| 维度 | 用户答案 | 事实/材料 | 可执行验收 |
| --- | --- | --- | --- |
| 目标 | 用户确认：做完第三个任务后所有已知阻塞消失；判据 = 逐条清零 + 八类各有防护与 owner；取舍: 先把范围做大（并入四条）换一次做完；被拒方案: 只做 C7+C8 另开任务；无未决项 | `decision-log.md` OI-05 / OI-06 / D-002；`prd.md:143`（R-006） | 场景: 任务收口核对阻塞账；数据来源: 本材料 §7.3 与 §8；通过: 每条阻塞有「现象→根因→修复→命令→证据」且八类各有 owner；失败: 任一条无证据或某类无 owner |
| 范围 | 用户确认：范围 = 任务Ⅲ（C7+C8）+ 四条现场阻塞，一个任务收口；build-code 等任务Ⅱ 完全合并后开始；取舍: 串行等待换零冲突；被拒方案: 四条先合入 main（任务Ⅱ 返工）；无未决项 | `decision-log.md` §3.6（T-011/T-012）、D-001/D-007；`prd.md:116-117` | 场景: 开工前与收口各核一次；数据来源: `git merge-base --is-ancestor` + §8.1/§8.2 落地表；通过: 任务Ⅱ 合并提交已是 HEAD 祖先且 C7/C8 每条 FR 有落地行；失败: 未合并即改仓库文件，或有 FR 无落地行 |
| 方案 | 用户确认：四条修复排在 C7 之前、父材料视为上游活材料、`npm test`/CI 走显式分组、宪法升到 1.9.0；取舍: 治理文字净增换文档与事实一致；被拒方案: 按字面删 F3 的 hash 并连代码 hash 一起删（超范围且削弱写边界）；无未决项 | `decision-log.md` §8.1/§8.2/§8.3、D-004/D-009/D-010/D-011/D-016；`prd.md:3441-3452` | 场景: build-spec 起草时逐条落规格；数据来源: §8 的逐条落地表与 §4.3 审计；通过: 每条 FR 有落地形态与可执行判据；失败: 出现未登记的落地形态或静默改上游 FR |
| 验收 | 用户确认：沿用 C7 13 条 + C8 9 条 AC、四条各加 oracle、M4 按整条整改线、链路验收用本任务材料、复核双轨；取舍: 真实异源审查加独立子代理（成本换可信度）；被拒方案: 只用子代理复核；无未决项 | `decision-log.md` §7.3、§8.2、D-012/D-013；`prd.md:3459-3475`、`prd.md:3691-3703` | 场景: verify-code 与 C8 验收时；数据来源: 任务Ⅰ 归档的 C0/C1 产物 + 本任务重测基线；通过: 逐条 AC 有 oracle 与退出码、净减账可复算、无自审自判；失败: 任一计数上升或用放宽断言凑绿 |

## UI applicability

```json
{
  "result": "non_ui",
  "sources": {
    "raw_requirement": { "result": "non_ui", "fact": "用户 §1 原话：按标准 WorkflowHub 完成第三个任务、让阻塞消失；无页面/交互/视觉诉求" },
    "project_inventory": { "result": "non_ui", "fact": "仓库当前无涉及本任务的前端路由/组件改动；本任务改动面为 runtime/ tools/ skills/ docs/ 治理文档、package.json 与 CI 配置" },
    "planned_or_changed_frontend_fact": { "result": "non_ui", "fact": "计划改动 = C7 治理同步 + C8 验收 + 四条 runtime 修复 + 配置/CI；唯一「人看的输出」是命令行文本（status / 审查报告 / 验收账）" }
  }
}
```

- **重算条件**（写死）：若四条修复或 C7 第 10 项意外引入需要人看的界面 / 交互 / 视觉规格，本条判定立即失效，必须用三输入重算（见 OI-18 的反例边界）。

---

## 10. 验收面：逐条 AC 与决定对齐（detail 审查后定稿）

### 10.1 C7 的 13 条 AC（逐条，回应 detail F-059d / F-3696 / F-1f64 / F-a3a7）

| AC | 通过判据 | oracle / 命令 | 失败判据 |
| --- | --- | --- | --- |
| C7-AC-1 | F3 定义句不再含 `hash` 作为写边界必要条件；F6 不再含「内容校验值」要求；两处改前/改后原文与**实测行号**进对照表 | `git diff CONSTITUTION.md` + 对照表行 | 任一处仍要求 hash/校验值，或未同步版本号/修订记录/映射 |
| C7-AC-2 | 「控制面净减法」+「默认不新增 hash」以硬规则出现在 **F11** 正文；守卫三要件齐备且未新增对象 | `grep -n "净减\|默认不新增 hash" CONSTITUTION.md` | 做成计数器/schema/gate/检查器；或三要件缺一 |
| C7-AC-3 | 宪法负向条款含母材料 `## 拒绝方案` **全部 15 条**（逐条可追溯）与八类分类学+防护+owner；checklist 条目数 = 宪法条目数 = **22** | `node tools/cli/verify-structure.mjs`（`:14/:26-36/:63-64`） | 清单缺失、只写在 decision-log、漏任一行、条目数 ≠ 22 |
| C7-AC-4 | 对照表逐行「文档表述 ↔ 代码事实」一致，无「仍矛盾」行 | 对照表（对象 = §10.2 的固定清单） | 存在未消解矛盾或缺行 |
| C7-AC-5 | `npm run check` 第一步与后四步**不劣化于本任务基线且本任务范围内清零** | 见 §10.2 的 D-006 行（四条命令） | 任一步计数上升；或本任务范围内未清零 |
| C7-AC-6 | `check-task-record-paths.mjs` 保持 **0 FAIL** | `node tools/cli/check-task-record-paths.mjs` | FAIL > 0；或放宽守卫表凑绿 |
| C7-AC-7 | `verify-structure.mjs` 退出 0（CONTEXT.md 术语 2 问题清零，**不动守卫**） | `node tools/cli/verify-structure.mjs` | 仍有 FAIL；或改守卫口径 |
| C7-AC-8 | 父材料 `decision-log.md` 用仓库锁定工具链报告 **0 issues** | `./node_modules/.bin/markdownlint-cli2 "<父材料绝对路径>"` | issues > 0；或用 `npx` 口径；或把它加进 ignores 且不写理由 |
| C7-AC-9 | X1–X14 复核表 **14/14** 无「仍矛盾」；全文批次计数只有「10 个具名批次」一个口径 | 复核表 + `grep -c "9 个批次"` = 0 | 任一项仍矛盾 |
| C7-AC-10 | `decision_hash` 两个口径写清（确认时绑定值 / 当前文件值）；聚合文件名以**实际落盘**为准 | 父材料对应段落 + `ls quality/evidence/interactions/` | 两口径混用 |
| C7-AC-11 | D-025③ 措辞改为「`prd.md` 不是第五份材料」；`CURRENT_MATERIAL_FILES` 仍 **4 项**、close 不要求 `prd.md` | `grep -n "CURRENT_MATERIAL_FILES" runtime/task/material-workspace.mjs` | 措辞仍为「永不产出」；或改成 5 项 |
| C7-AC-12 | 控制面净增减申报：每个点名文件 `wc -l` 改前/改后实测 + 净值 | `wc -l <文件清单>` ×2 | 只写「预计」；或净值 > 0 未登记理由 |
| C7-AC-13（**已修正**） | 代码侧改动 = `operations/close` 收敛面（`core/task-close.mjs` 6 处落盘点 + `tools/cli/task-close.mjs` 读取面）**+** 四条修复的 5 个 runtime 文件 **+** `package.json` **+** `.github/workflows/ci.yml`；且保留 `operations/close/confirmations/**` 与 plan hash 校验；五动作结果有 K2 `close_action` 落点 | 改动文件清单 vs §10.3 | 出现清单外的生产行为改动；或删掉人确认凭证/plan hash 校验 |

### 10.1b C8 的 9 条 AC（逐条）

| AC | 通过判据 | oracle / 命令 | 失败判据 |
| --- | --- | --- | --- |
| C8-AC-1 | ① C1 的具名删除清单**已产出**（任务Ⅰ 归档交付物，C8 不自造）；② 清单逐项 `test ! -e` 通过、每项附「无真实 consumer」证据；③ 清单未越界（`stage-outcome-proofs` / `workflow-evolution.mjs` / protocol-error 白名单**不在**删除面） | 归档清单 + 逐项 `test ! -e` 脚本 | 清单缺失、任一项仍存在、证据只有「没人 import」、或把裁定 H/J-4 的对象列入删除面 |
| C8-AC-2 | M1–M5 逐项有判定；劣化项有具名归因 | §8.2 的 M1–M5 对照（消费任务Ⅰ 归档的 C0 口径表 `…t1-20260911/spec.md:154-170`） | 任一项无判定；或劣化被写成「不劣化」 |
| C8-AC-3 | M4 = 三个合并提交（任务Ⅰ `9f9d0c44`、任务Ⅱ 实测 SHA、任务Ⅲ 实测 SHA）各自 `git diff --numstat <merge>^1 <merge>` 的 Σadded − Σremoved **合计为负**；单任务为正须写明理由 | 三条 numstat 命令（SHA 实测，不用占位符） | 合计 ≥ 0；或未写明测量口径 |
| C8-AC-4 | M1/M2 有复测值或如实 `unknown` + 说明缺什么 | 材料逐项登记 | 声称复测但无命令/出处；或引用父材料 20.0% 当实测 |
| C8-AC-5 | 链路验收三步全过（写完 → `status` 立即可读 → 重放不产生重复行），**在本任务材料与 store 上执行** | `status --action=begin` 读回 + 二次写入计数不变 | 任一步失败；或只跑测试没做链路；或改口称跑了真任务 |
| C8-AC-6 | `unknown` 清单显式登记（至少含 token 维度、M1/M2 历史出处、D-013 自指） | 材料 unknown 节 | 任一项被写成通过；或清单为空 |
| C8-AC-7 | 净增减账包含 CI 授权表与测试矩阵的新增代码 | 账本行 | 只算生产代码 |
| C8-AC-8 | 异源复核由**非本任务主会话**、独立上下文、与执行者**不同底层模型**产出 | 复核记录中的 provider/身份字段 | 自审自判；或同源 |
| C8-AC-9 | 结论逐项可被第三方用**同一条命令**复算出同一个数 | 逐项命令列举 | 结论无法复算；或依赖未写死的口径 |

### 10.2 决定 × 验收对齐（D-001 ~ D-016，oracle 具名化）

| 决定 | 验收条目 | oracle / 命令 | 失败判据 |
| --- | --- | --- | --- |
| D-001 范围 | C7/C8 与四条阻塞的 FR/AC 均在材料内有落地行；无第五份材料 | §8.1/§8.2 逐条落地表（**不用裸 grep 计数**，按小节逐行核对） | 缺任一条落地行，或新增控制面 |
| D-002 判据 | 逐条阻塞账（**51 条 X 逐条 + 四条逐条**）+ 八类逐类一行（防护 + owner） | 账本行数 ≥ 51 + 4 + 8；每行含 ID/现象/根因/修复/命令/证据 | 某类无 owner，或某条无证据 |
| D-003 清单权威边界 | 清单三来源**逐项枚举**：X1–X19/X20–X25/X26–X29/X30–X36/X40–X47/X50–X56（共 51，编号分段不连续是既有事实）+ 四条 + 八类扫描结论；写明纳入判据与排除项 | 清单 + 按分段前缀计数（每段 `grep -c` 后相加） | 只列一部分；或未写排除项；或把「51」写成连续编号 |
| D-004 四条先于 C7 | 批次表里四条批次编号 < C7 批次 | build-plan 批次表 | 顺序颠倒或混批 |
| D-005 坏行只修写侧 | 写侧两处回退改用该 stage 的 scope 指纹；**新增窄回归测试**；历史坏行具名登记为不可恢复历史 | `grep -n "currentVNextMaterialScopeRevision" runtime/stage/stage-runner.mjs`；新测试文件存在；§11.2 登记 | 迁移历史字节、加兼容桥、加行字段；或声称现场已读回 |
| D-006 预存在红 | ① 全仓 markdownlint **不劣化于 610**；② 本任务范围内（宪法/checklist/AGENTS/CLAUDE/README/CONTEXT/ADR/父材料/本任务材料）**清零**；③ 无关 specs 目录的窄 ignores 附**理由与 owner**；④ verify-structure 退出 0；⑤ path-guard 保持 0 | `./node_modules/.bin/markdownlint-cli2 "**/*.md"`、`node tools/cli/verify-structure.mjs`、`node tools/cli/check-task-record-paths.mjs`、`.markdownlint-cli2.jsonc` diff | 任一计数上升；或新 ignores 无理由/owner；或改了守卫口径 |
| D-007 集成顺序 | 开工前 `git merge-base --is-ancestor <任务Ⅱ 合并 SHA> HEAD` 成立（**SHA 在开工时写实测值，不留占位符**）；等待期内 `git diff --stat <开工 HEAD>..HEAD` 只允许 `specs/<本任务>/` 变化 | 该命令 + `git diff --stat <baseline>..HEAD -- . ':(exclude)specs/<task-id>'` 为空 | 未合并即改文件；或等待期有仓库文件改动 |
| D-008 对照表范围 | 固定路径清单（宪法/checklist/AGENTS/CLAUDE/README/CONTEXT/audit-contracts/package.json/2 个 architecture json/6 个 ADR/.markdownlint-cli2.jsonc/.github/workflows/ci.yml + 本任务改动文件）**逐项存在性检查** | 清单 + `test -e` 逐项 | 漏项；或存在未消解矛盾 |
| D-009 F3/F6 + hash 净减 | 宪法改前改后原文 + 行号；负向条款含「默认不新增 hash」；hash 清单：**tracked 全集**（`git ls-files` 的 `*.mjs/*.js/*.cjs/*.json/*.jsonc/*.yaml/*.yml/*.md`，含 `.github/**`）逐条 `路径:行号 ／ 类别 ／ 处置 ／ 理由 ／ 绑定对象` | `git ls-files` 口径的扫描脚本 + 清单 | 清单缺项；误删身份/完整性 hash；新增 hash 字段 |
| D-010 npm/CI | 写出**分组映射**（新脚本名 → 覆盖的原 vitest 范围），证明并集覆盖原 `test` 的全部 258 文件；CI 逐组调用；`test:exclusive` 语义保留 | `node -e` 读 scripts + `.github/workflows/ci.yml` diff + 逐组 `--collect` 计数 | 未证明覆盖；或 CI 变红；或仍可无范围全量 |
| D-011 父材料边界 | 更正 X1–X14 + 修 82 条 lint；**受保护清单**（`quality/**`、`specs/archive/**`、历史 task store）以基线 hash 冻结，改动前后比对 | `git status` 范围 + 受保护路径的 hash 比对 | 动到受保护路径；或 X1–X14 有未消解项 |
| D-012 M4 / 链路验收 | M4 = 三个合并提交各自 `git diff --numstat <merge>^1 <merge>` 的 Σadded−Σremoved **合计为负**（SHA 开工/收口时写实测值）；单任务豁免写明；链路验收三步在本任务材料上跑通且**重复执行不新增行** | 三条 numstat 命令 + `status` 读回 + 二次执行计数不变 | 合计 ≥ 0；或声称做了真任务链路验收；或重放产生重复行 |
| D-013 验收与复核 | §10.1 的 13+9 条 AC 逐条有 oracle；四条各加 oracle（§10.3）；双复核**分开记录**（真实异源 + 独立子代理），各自含 provider/身份/结论；不可用按 §10.4 | 逐条 AC 表 + 两份复核记录 | 缺任一条；或把两种复核合并；或把 unavailable 写成通过 |
| D-014 六类边界/非目标/零延期 | 六类边界逐条落盘；四条新增非目标在册；延期项为空集 | §3.3/§3.4 + §5.2 | 出现延期项；或六类缺项 |
| D-015 执行纪律 | 执行记录含 **actor**（主会话/子代理）、**command**、**exit_code**、**结论摘要**，且重读量动作的 actor = 子代理 | build-code/verify-code 执行记录 | 记录可事后手工补写、无 actor/命令/退出码；或主会话自行跑重活 |
| D-016 宪法升版 | `Version: 1.9.0`；条目数 **22**；修订记录新增一条；旧→新映射更新；措辞改前改后经用户确认 | `grep -n "Version:" CONSTITUTION.md` + 修订记录/映射 diff + 用户确认记录 | 漏同步四件之一；或未确认即写 |

### 10.3 四条阻塞的具名 oracle（回应 F-0fbf / F-5527 / F-4072）

| 缺陷 | 具名测试与命令 | 期望输出 |
| --- | --- | --- |
| ① 行指纹 stale | 新增 `tests/integration/stage-row-scope-digest.test.mjs`（fixture：无 stage outcome 的 stage end；stage = make-decision 与 build-spec）；并跑既有 `tests/integration/stage-outcome-record-row-redirect.test.mjs`、`tests/integration/stage-row-publication.test.mjs`、`tests/contract/execution-outcome.test.mjs` | 新测试证明两 stage 的行指纹 = `stageMaterialScopeRevision(stage, materials)`；既有用例全绿 |
| ② 旧审查记录路径身份 | 新增用例覆盖 `resultRef` 非 `<stage>-simple-<attempt_id>` 形态（如 `verify-code-e2e-<uuid>.json`）仍被接受；并跑 `tests/review/review-record-route.test.mjs`、`tests/contract/review-public-entrypoints.test.mjs`、`tests/contract/acceptance-execution-tier.test.mjs` | 内容绑定成立即接受；不再抛 `ordinary review result/attempt path identity mismatch` |
| ③ analyzer 静默跳过 | 改断言 + 跑 `tests/contract/five-stage-spec-analyze-wiring.test.mjs`（含 heading-less `decision_log` 用例） | 门槛不成立时返回结构里有显式 skip 事实；用例期望同步更新 |
| ④ `direction_change` 无终态 | 改断言 + 跑 `tests/contract/freeze-classification-budget-usage-protocol.test.mjs`、`tests/stage-risk-acceptance.test.mjs` | `direction_change` + `fixed` 判通过与材料修订绑定；用例期望同步更新 |

### 10.4 复核不可用与终态规则（回应 F-e280 / F-38f47b54e914）

- 任一复核 `unavailable` / `partial` / provider 限流：**如实登记**（含 provider、错误码、耗时），判据保持 `incomplete`，**不折算通过、不阻断同任务修复**；不影响 verify-code 与 close 的推进权（是否继续由用户按 `unknown`/`incomplete` 事实决定）。
- 复核只有在**材料修复后**才允许重新调用（本轮已按此执行：第一轮报文错 → 第二轮被拦 → 第三轮补正）。

### 10.5 OI-19 的生命周期契约（回应 F-63de）

每条持久对象必须写明 `writer | reader | 失效条件 | 终态 | 幂等键`：材料（各 stage 主会话写，下游读，不因编辑失效）；`facts.jsonl` 的 stage 行（stage 主会话写，status/close 读，按 stage 原地替换 = 幂等键）；`close_action` 行（task-kernel 写，人复核读，按动作名唯一）；`quality/**` 事实（运行时不覆写，只追加）；复核 attempt/result（审查写，人复核读，内容寻址 = 幂等键）。

> **口径**：§10.1/§10.2/§10.3 是「决定与上游 AC → 验收」的唯一对齐表；`C7-AC-13` 的修正**显式登记**为「上游 AC 与本任务已批准范围冲突，按已确认决定修正」，不静默改判。**已取代的旧判据**（现场读回）在本文件内一律带「已被 T-017 取代」标注。

---

## 11. 细节审查（step 10 detail-advice）

### 11.1 第一轮运行事实与报文缺陷（如实登记）

| 项 | 实测值 |
| --- | --- |
| pair_id / 汇总 | `79807e68-341f-4faf-8cdc-bd0d85b34e93`；`report_ref = quality/reviews/reports/make-decision-simple-d140537c-8254-5052-a5a8-21e42ec1a21e.md` |
| red 角色 | `attempt a2365aa9-612b-5415-ac6d-92e6427de1b7`；4/4 provider 完成；`semantic_status available`、`coverage satisfied` |
| blue 角色 | `attempt 56da7304-34df-545d-a447-2949480bf65e`；3/4 完成，**`kimi/coding` 因 `RATE_LIMITED` 失败**（10.6 s）⇒ 该角色 `partial` |
| findings | red **21** 条（blocking 1 / major 18 / minor 2）；blue **14** 条（blocking 1 / major 11 / minor 2）；**无红蓝直接冲突** |
| **报文缺陷（我的问题，必须登记）** | 我按「摘要投影」送审，**违反 detail 合同**：合同 `skills/wh-review/contracts/make-decision.md` 的 detail 必需材料是「已批准方向，**包括可读 decision log 与 grill 文档判断**」，且 `runtime/review/stage-materials.json` 的 `make-decision/detail.semantic_fields` 含 `oi_terminal_records` / `confirmation_groups` / `ui_applicability` / `ui_contract`——**这四样我第一轮都没送**。因此两角色「方向是摘要、无 OI 终态、逐条对账不可执行」的指控**对报文成立** |

### 11.2 第一轮 findings 逐条处置（35 条，按主题归并；每条 finding id 都在此列出）

| 主题 | 覆盖的 finding ids | 处置 | 依据 / 动作 |
| --- | --- | --- | --- |
| **报文不完整导致「无 OI 终态 / 只有摘要 / 无法逐条对账」** | red `F-3c2ef85b2f9c`、`F-1b734e287269`、`F-f23bfe43b954`；blue `F-91cab098830a` | `fixed` | 已按合同补齐报文（可读决定链 + Grill 记录 + `oi_terminal_records`（24 条）+ `confirmation_groups` + `ui_applicability` + `ui_contract`），并**重跑 detail 审查**；第一轮 attempt 作为不可变历史保留 |
| **两条 blocking：C7 的「代码侧改动恰为 `operations/close` 面」与已批准范围冲突** | red `F-2f937a597976`；blue `F-c7f31215f8bf` | `fixed` | 真实且最重要的一条：已在 **§10** 显式修正 `C7-AC-13` 的代码侧改动面 = `operations/close` 收敛面 **+** 四条修复的 5 个 runtime 文件 **+** `package.json` **+** `.github/workflows/ci.yml`，并登记为「上游 AC 与已批准范围冲突，按已确认决定修正」 |
| **执行顺序 / 状态门槛缺失** | red `F-1c8f9c806f4c`、`F-e8d1a54e2590`；blue `F-e2c6d5ac3d3c`、`F-e89906a38f78` | `fixed` | §10 新增 D-004 / D-007 行：批次顺序判据 + 开工前 HEAD 祖先校验 + 等待期 `git status --porcelain` 为空 + 已批准禁改项的负向验收 |
| **「每条决定无对应 AC」一批** | red `F-3d48b613aaca`、`F-a2e1747c1b73`、`F-05804d3fee28`、`F-45f65860c2e9`、`F-a8d3f63ec43b`、`F-92ce555dd6b4`、`F-28d2326449bc`、`F-290e06b9304e`、`F-4bdeff3a029c`、`F-0dfcfbc1c5bb`、`F-ace096d7876a`；blue `F-787c90b05952`、`F-80557ca8e293`、`F-85e9f7eb4883`、`F-837d0b253964`、`F-9a5c1ae53c76`、`F-1368d33088eb`、`F-d9fab6e05ff6` | `fixed` | 新增 **§10 验收面：与 16 条决定的逐条对齐**（决定 × 验收条目 × oracle 命令 × 失败判据），覆盖八类 owner、51 条 X 清单、hash 清单、npm/CI、M4 口径、双复核分开记录、宪法升版、守卫不可改、忽略清单须有理由与 owner 等 |
| **`D-015③` 引用不存在** | red `F-bcb9e6b8bc3a`、`F-2117e334b754`、`F-1620b1b17f0a`；blue `F-4c42192445d3` | `fixed` | 我第一轮验收草案把「链路功能验收」写成 `D-015③`（D-015 是执行纪律，无子项）——已在 §10 改为引 **D-012**，并写成可判三步 |
| **M1–M5 只定义了 M4，C8 不可独立复现** | blue `F-4c42192445d3`（与上条同 id，含此指控） | `fixed` | **§8.2** 的 M1–M5 行 + **§10.1b 的 C8-AC-2 行**写明：C8 消费任务Ⅰ 归档的 C0 口径表（`specs/archive/workflowhub-mechanism-simplification-t1-20260911/spec.md:154-170`），逐项含分子/分母/命令；本任务不新增仪器 |
| **D-016 措辞推迟到 build-spec 违反「不得依赖 build-spec 补需求」** | blue `F-16ba910951e9` | `rejected_invalid` | **决定**（F3/F6 去 hash、净减法与默认不新增 hash 入 F11、1.8.0→1.9.0、条目数 22）已在 D-009/D-016 冻结；推迟的只是**条文措辞的起草与用户过目**（G2-A），不构成方向或需求缺口 |
| **ADR 35 个 / 4 组编号重复无处置** | red `F-aebe1289dc1d` | `fixed` | §10 末行新增处置条目（逐组给处置 + 理由 + owner；改编号需用户点头） |
| **异源复核 `unavailable` 无判定分支** | blue `F-38f47b54e914` | `fixed` | §10 新增「审查不可用分支」行：记 `unavailable`/`partial`、判据保持 `incomplete`、不折算通过、不阻断同任务修复 |

### 11.3 第三轮 findings 逐条处置（pair `be5fa6a7-d66c-51f3-a28b-854703e47171`；报告计数 red 21 / blue 12 = 33 条，摘要逐条列出 red 20 / blue 12，差异如实登记）

| 主题 | 覆盖的 finding ids | 处置 | 动作（已落到 §10 或指定节） |
| --- | --- | --- | --- |
| **现场读回残留（最严重：R3-Q2=C 未全域传播）** | 红 `F-c106`(blocking)、`F-a1b1`、`F-52ea`；蓝 `F-db3f`(blocking)、`F-efe1`(blocking)、`F-cacd` | `fixed` | OI-04 / OI-06 的验收与反例、§4.4 硬约束 3 已全部回写为「写侧 scope 指纹 + 窄回归测试 + 历史坏行如实登记」；§10.4 补「复核不可用与终态规则」；**受害任务的历史行钉死为「不可恢复的历史事实」**（不迁移、不改写） |
| 逐条 AC 表缺失（C7 13 / C8 9） | 红 `F-059d`、`F-3696`；蓝 `F-1f64`、`F-a3a7` | `fixed` | 新增 **§10.1**（C7-AC-1 ~ 13 与 C8-AC-1 ~ 9 逐条：通过判据 / oracle 命令 / 失败判据） |
| 四条阻塞 oracle 悬空（引不存在的「§4.4 F 段」） | 红 `F-0fbf`、`F-5527`；蓝 `F-4072` | `fixed` | 新增 **§10.3**：每条给出具名测试文件、要跑的既有用例与期望输出 |
| `<merge>` / `<任务Ⅱ合并提交>` 占位符未解析 | 红 `F-3240` | `fixed` | §10.2 的 D-007 / D-012 行改为「开工/收口时写**实测 SHA**，不留占位符」，并要求重放幂等断言 |
| 计数口径不严（51 条 X / 逐条 schema / owner 枚举） | 红 `F-ff0b`、`F-9d9c`；蓝 `F-1795` | `fixed` | §10.2 的 D-002 / D-003 行：逐项枚举 51 条（**编号分段不连续是既有事实，不得写成连续 51**）+ 四条 + 八类，每条含 ID/现象/根因/修复/命令/证据与 owner |
| R-019 hash 清单扫描集过窄 | 红 `F-34f9`；蓝 `F-3737` | `fixed` | §10.2 的 D-009 行：扫描集改为 `git ls-files` 的 **tracked 全集**（`*.mjs/*.js/*.cjs/*.json/*.jsonc/*.yaml/*.yml/*.md`，含 `.github/**`），每条含 `路径:行号 ／ 类别 ／ 处置 ／ 理由 ／ 绑定对象` |
| npm/CI 无分组映射与覆盖证明 | 红 `F-efba`；蓝 `F-050f` | `fixed` | §10.2 的 D-010 行：要求「新分组 → 覆盖的原 vitest 范围」映射 + 并集覆盖原 258 文件的计数证明 + CI 逐组调用 |
| D-011 无受保护清单/基线 | 红 `F-f1bd` | `fixed` | §10.2 的 D-011 行：受保护路径（`quality/**`、`specs/archive/**`、历史 task store）以基线 hash 冻结并前后比对 |
| D-015 无 actor/命令/退出码 schema | 红 `F-a3aa` | `fixed` | §10.2 的 D-015 行：执行记录必须含 actor（主会话/子代理）、command、exit_code、结论摘要 |
| D-016 oracle 太弱 | 红 `F-8488` | `fixed` | §10.2 的 D-016 行：断言 1.9.0 + 条目数 22 + 修订记录 + 旧→新映射 + 用户确认记录 |
| D-007 判据互斥 / 对已提交改动失明 | 红 `F-1faa`；蓝 `F-0d2b` | `fixed` | §10.2 的 D-007 行：排除 `specs/<task-id>/` 的 range 比较（而非 porcelain 为空） |
| D-006 判据不完整 | 红 `F-ccd5`、`F-bbf8` | `fixed` | §10.2 的 D-006 行：五条判据（610 基线不劣化 / 本任务范围内清零 / ignores 附理由与 owner / verify-structure 退出 0 / path-guard 保持 0，且**不得改守卫口径**） |
| C7 对照表范围写「约 15 项」不可核 | 红 `F-73dd` | `fixed` | §10.2 的 D-008 行：固定路径清单 + 逐项 `test -e` 存在性检查 |
| provider 不可用无终态与 close 规则 | 蓝 `F-e280` | `fixed` | 新增 **§10.4**：`unavailable`/`partial` 如实登记、判据保持 `incomplete`、不折算通过、不阻断同任务修复；是否继续由用户按事实决定 |
| OI-19 缺生命周期与幂等契约 | 蓝 `F-63de` | `fixed` | 新增 **§10.5**：每类对象写明 writer / reader / 失效条件 / 终态 / 幂等键 |
| §11.2 关于 §10 的表述与正文不符 | 红 `F-3834` | `fixed` | §11.2 的 D-012 行改为指向 **§8.2**（C0 口径表在任务Ⅰ 归档的 `spec.md:154-170`）+ §10.2 的 D-012 行；两者一致 |

- **红蓝争议**：本轮**无直接对立结论**；同一残留缺陷的严重度标注不同（red antigravity 记 blocking / red pi 记 major；blue codex+antigravity 记 blocking / blue kimi 记 major）——**已按最严处理**（blocking 口径修复）。
- **核实结果（已更正）**：第三轮 pair 报告**存在**（`quality/reviews/reports/make-decision-simple-be5fa6a7-….md`，1,180 B，只含配对记录 JSON，**不含 findings 正文**）；完整 findings 在 `results/make-decision-simple-c120414b-….json`（red 21）与 `results/…-7954be18-….json`（blue 12）。本轮 `partial: true` 无归因字段，唯一未完成项 = 红 `kimi/coding` `RATE_LIMITED` + 蓝 `pi/v4flash` `PUBLIC_RESULT_INVALID`。
- **未决项**：无（33 条全部处置）。

### 11.4 报文形态记录（第二轮被拦 → 第三轮正确形态）

**第二轮（`pair_id 0ba44d99-7c91-4142-9f86-7c10000a3617`）= `unavailable`，如实登记，不折算通过**：

- 两角色均 `terminal_status: unavailable`、`dispatch_state: blocked_before_dispatch`、`coverage: incomplete`、`result_ref: null`；错误码 **`MATERIAL_FORBIDDEN: material oi_terminal_records is not allowed for this review`**。
- **我的判断错误（登记在案）**：我把 `runtime/review/stage-materials.json` 的 `surfaces["make-decision/detail"].semantic_fields` 当成了「允许送入的 material key」。真正的规则在 `stages["make-decision"].tracks.detail`：**allowed = required[`raw_requirement`, `approved_direction`, `draft_spec_or_acceptance`, `review_instructions`] ∪ optional[`context_map`, `evidence_map`] ∪ generated**，其余 key 一律判 `unknown` ⇒ 拒绝。attempt 保留为不可变历史（`232d5bf3…` / `157bfab6…`），**不删除、不改写**。
- 该失败**没有** findings，也**不能**被写成「没有问题」；它只是「这一次调用被前置拦截」。

**第三轮（正确形态）**：把 OI 终态记录、Grill 记录、UI 判定与六类边界**并入 `approved_direction` 的正文**（合同原文要求「已批准方向，包括可读 decision log 与 grill 文档判断」），只送 3 个允许的 key；payload ≈ 190 KB。状态：`in progress`（2026-09-12）。第二轮与第三轮的 findings/结论将在回填后逐条处置。

---

## 12. 最终确认（step 11 approve-decision · 待用户真实答复）

> 本卡是 make-decision 唯一需要用户点头的地方，也是三处人工确认点的第一处。回复「确认」即绑定**本文件的当前字节**（`decision_hash` 由运行时按当前文件计算）；回复修改则先改材料再重新确认。

### 12.1 一句话

**把任务Ⅲ 做成「阻塞消失」的可验证交付**：治理文字与代码事实逐条对齐、四条现场阻塞修好、双证验收给出可复算结论 —— 零新增控制面、零延期。

### 12.2 方向与范围（已确认的 16 条决定）

- **范围**：C7（治理同步）+ C8（双证验收）+ PaperBuilder 四条现场阻塞，一个任务、一条合并列车。
- **顺序**：四条修复排在 C7 之前；**build-code 等任务Ⅱ 完全合并之后才开始**（开工前实测祖先关系）。
- **C7 做什么**：F3/F6 去掉 hash 与「内容校验值」表述；「控制面净减法」+「默认不新增 hash」写进 F11；负向条款（15 条拒绝方案）与八类阻塞分类学写入宪法；checklist/版本/映射同步升到 **1.9.0**（条目数仍 22）；约 15 项「文档 ↔ 代码」对照表；`operations/close` 多文件计划收敛；父材料 X1–X14 更正 + 82 条 lint 清零；`npm test`/CI 改成显式分组。
- **C8 做什么**：静态净减法逐项 + M1–M5 对照任务Ⅰ 的 C0 口径 + 链路验收（用本任务材料）+ 四条逐条验证 + 异源复核。
- **hash 方向**：产出「hash 用法清单」（身份绑定 / 完整性校验 / 过程化产物），本任务删治理文字表述与过程化产物类，身份与完整性类只登记。

### 12.3 非目标与延期

- 沿用 E-1 ~ E-20；新增四条：不为四条缺陷新增控制面、不改历史证据字节、不修宿主/broker/3rd-review、不重跑真实任务采基线。
- **零延期项**；仓外项按非目标登记并写明影响面、不阻断阶段。

### 12.4 成功标准

- C7 的 13 条 + C8 的 9 条 AC 全过；四条阻塞逐条有修复与验证命令；八类阻塞逐类有防护与 owner；逐条阻塞账可被第三方同命令复算。
- 基线 = 本任务开工 HEAD 重测值（全仓 markdownlint **610** / path-guard **0** / verify-structure **2 个问题** / 父材料 **82**）；**不劣化 + 本任务范围内清零**。

### 12.5 质量事实（advice，不是许可证）

- **方向审查**：`pair 80d97f71…`；red 角色 `partial`（`kimi/coding` 限流），blue 完成；**18 条 findings 全部处置**（11 fixed / 2 rejected_invalid / 5 转用户裁定后 fixed）。
- **细节审查**：三轮。第一轮 `pair 79807e68…`（red 21 条 + blue 14 条，含 **2 条 blocking**，已修）；第二轮 `pair 0ba44d99…` **两角色 `unavailable`**（`MATERIAL_FORBIDDEN`，我方报文形态错误，如实留档、无 findings、不折算通过）；第三轮 `pair be5fa6a7…`（两角色 `available`）结果见 §11.4。
- **不可用事实**：`partial`/`unavailable`/限流均保留原样，**未**改写成「通过」或「空 findings」。

### 12.6 剩余风险（8 条）

任务Ⅱ 长期不合入（记事实、不擅自动手）；同文件冲突（已由顺序约束关闭）；hash 清单误删身份绑定（反例写死）；CI 改动引入回归（判不劣化）；窄 ignores 被读成掩盖（须写明理由与 owner）；父材料哈希变化（原文不可复现本就是已登记事实）；四条修复改变既有测试期望（显式登记，不得放宽凑绿）；provider 限流（如实登记）。

### 12.7 未决项与延期项

- **未决项**：无 —— 24 条 OI 全部终态；`outline_closed` / `interaction_proof` 由本次确认生成的交互聚合绑定。
- **延期项**：零。

### 12.8 用户答复（已回填）

- 状态：`accepted`（2026-09-12）。
- **用户真实原话（逐字）**：`确认，收口make-decision吧`。
- 绑定说明：本次确认绑定的是**本文件写入本行之后**的最终字节；`confirm --action=decision` 由运行时记录 `material_revision` 与 `snapshot_tree`，交互聚合按同一版本绑定。
- 确认后的动作（按序）：`confirm` → 组装交互聚合（24 条 OI 的终态与分组绑定）→ `run --action=execute`（stage-end 语义检查）→ `run --action=reflect`（阶段末复盘）。

---

## 13. 阶段末披露与真实状态（step 12–14 实测）

### 13.1 官方收口执行记录（命令 + 真实输出摘要）

| 步骤 | 命令 | 结果 |
| --- | --- | --- |
| 确认 | `node tools/cli/stage-runtime.mjs confirm --action=decision --stage=make-decision --project=workflowhub --task=<本任务> --decision=accepted --reply-text='确认，收口make-decision吧' --step-slug=approve-decision` | exit 0；`confirmation_ref = quality/confirmations/4e83514c….json`；`material_revision = revision-7834ec46…`；`snapshot_tree = a4ffaf62…` |
| 交互聚合 | 会话直接组装（SKILL 规定），写入任务目录 | `quality/evidence/interactions/88b28ee6….json`（内容寻址校验通过）；**4 轮 Talk 生命周期 + Grill 1 轮 + 24 条 OI 终态（21 条带分组绑定）** |
| 阶段执行 | `node tools/cli/stage-runtime.mjs run --action=execute --stage=make-decision --input=/tmp/t3-run-input.json`（receipts = direction_review / detail_review / interaction / confirmation / stage_outcomes；finding_dispositions = 25 条） | exit 0；`status: in_progress`；`quality_status: incomplete`；`work_status: ready`；`continuation_allowed: true` |
| 阶段 outcome | `node tools/host/workflowhub-stage-agent-bridge.mjs`（**显式 `unavailable` 分支**） | `outcome_ref = quality/evidence/stage-outcomes/make-decision/9a2ba54e….json`；`outcome_status: unavailable`；producer = `stage-agent/dsh` |
| 阶段复盘 | `run --action=reflect` | **失败并如实保留**：`executed stage reflection requires executor source, attempt, timing, and output hash` ⇒ 复盘 = `unavailable(executor_absent)`，availability 事实落在 `quality/evidence/stage-reflection-availability/f1d7212a….json` |

### 13.2 12 个完成谓词的逐条真实状态

| 谓词 | 状态 | 依据 |
| --- | --- | --- |
| `human_confirmation` | **satisfied** | 官方 confirmation 凭证（`4e83514c…`） |
| `outline_closed` | **satisfied** | 交互聚合的 `oi_dispositions` 与 OI 终态逐条绑定 |
| `requirement_coverage` | **satisfied** | 需求覆盖矩阵（R-001~R-019 → 决定） |
| `goal_achievement` / `acceptance_clarity` / `solution_convergence` / `plain_language_card` | **satisfied** | 收敛检查四维表 + 核心需求/核心目标/决定/验收标准 |
| `ui_applicability` | **satisfied** | 三输入合并 = `non_ui` |
| `scope` / `non_goals` / `risks` | **missing** | 这三项由 stage outcome 内的 `spec_analyze` 结果承载；本次 outcome 是**显式 unavailable**，没有可认证的 analyzer 结果 |
| `stage_end_spec_analyze` | **missing**（`material_incomplete`） | 同上 |

### 13.3 为什么 stage outcome 只能是 `unavailable`（诚实原因，非绕过）

- 发布**会话绑定**的 stage outcome 需要宿主提供的 session 描述符（`session.source` 等）与 coordination 事件日志；本会话（DSH）**没有宿主记录的 session transcript**，也没有带真实时间戳的事件日志。
- 我**没有伪造**这些事件、时间戳或 transcript；因此按 bridge 支持的窄通道提交**显式 `unavailable`**，理由已写进 outcome：`this session has no host-recorded session transcript or coordination event log ...`。
- 因此 `run --action=reflect` 的报错（缺 executor source/attempt/timing/output hash）是**同一根因的第二次表现**，不是材料缺陷。

### 13.4 本阶段真实的完成边界（不得被读成「全部通过」）

- **已完成且可复核**：四份材料中的 decision-log（含 24 条 OI 终态、16 条决定、收敛检查、UI 判定、逐条 AC 与决定对齐）；用户真实确认并绑定；交互聚合；方向审查与三轮细节审查的 canonical 记录与逐条处置；25 条 finding 的 runtime 处置（23 fixed / 2 rejected_invalid）。
- **不可用（如实登记）**：会话绑定的 stage outcome、stage-end spec-analyze 结果、阶段末复盘。三者同根因（本会话无宿主 session 描述符），全部保留 `unavailable`/`missing`，**没有一处被改写成通过**。
- **对下游的效力**：`work_status: ready`、`continuation_allowed: true` —— 已确认的方向与四份材料可被 build-spec 直接消费；上述三个不可用项**不阻断**下游，但它们也**不能**被当作质量事实的替代。
- **下一步**：进入 build-spec（只细化本材料，不重开方向）；build-code 仍须等任务Ⅱ 完全合并（T-012）。

### 13.5 ⚠️ 本任务现场**确定性复现**缺陷 1（同一族的两个 trace code）

- **复现（两次实测，同一任务）**：
  1. 第一次 run 后（材料尚未再编辑）：`execution_outcome = unavailable(execution_record_row_snapshot_stale)` —— 因为我在 run 之后写了 §13 记账，快照树变了。
  2. 重建聚合、把材料与快照重新绑好后再 run：诊断变成 `unavailable(execution_record_row_material_stale)` —— 「the make-decision stage row is not bound to **the current stage material revision**」。
- **确定性根因（本次实测确认，不再是推断）**：stage outcome 为 `unavailable` 时，写侧在 `stage-runner.mjs:1192/:1273` 回退到**整材料 revision**；而读侧对 make-decision 期望的是**一元 scope revision**（`completion-predicates.mjs:29-35/:743-752`）。两者数学上不可能相等 ⇒ **只要 outcome 不可用，make-decision 的行就永久 stale，改材料也修不好**。这与 PaperBuilder 撞到的现象**逐字同源**。
- **修正我在 §13.5 前文的判断**：这不是「因为我在 run 之后编辑了材料」才发生的偶发问题；**它在下一次 run 完成的那一刻就成立**，编辑材料只是把它从 `row_material_stale` 变成先报 `row_snapshot_stale`。
- **处置（如实保留，不绕过）**：本任务的 stage 行**现在就是 stale 的**，并且**不做**任何手工改行、迁移或绕过（那正是本任务要禁止的做法）。它作为**现场标本**移交 build-code：修复 D-005 后，本任务的这一行同样必须能被读回（这是比 PaperBuilder 更可控的验收样本——受害者就是我们自己）。
- **对下游的硬要求（更新）**：① build-code 收口时最后一次材料记账必须在最后一次 `run` 之前；② 更根本的是，**必须先把写侧回退改掉**，否则任何 outcome 不可用的 make-decision/build-spec 行都会重犯。两条都写进 §3.6 的失败边界。

---

## 6. 调研（step 4 research-inputs）

- **结论**：`completed`（以**独立子代理核查**形态完成；未启动 `deep-research` R0–R5 全文研究）。
- **理由（为什么不需要 deep-research）**：本阶段可能改变方向的未知量，全部是**仓库内可实测的事实**，不需要外部检索或长文研究；这些事实已由三次彼此独立的只读核查给出结论并落盘到 §4：
  1. **官方运行通道核查**（子代理）→ `run --action=draft/execute/reflect`、`review --action=record`、`confirm --action=decision` 的精确用法、`--input` 形状、写入落点、以及「阶段 outcome 须由 host bridge 先发布」这一前提（§6 附：该结论用于本任务收尾，不改方向）。
  2. **PRD C8 剩余内容 + X50–X56 + 实测记录摘要**（子代理）→ 确认 C7/C8 的 FR/AC 与预存在红的真实口径（§4 F-17/F-22/F-23）。
  3. **四条阻塞逐条核实 + 基线重测**（两个子代理）→ §4.2 全表与 F-19/F-22/F-24。
- **研究未覆盖项（如实登记）**：`unknown` —— 缺陷 2 的**历史实例**（PaperBuilder 那批旧审查记录）在本次核查中未被逐对复算（子代理首次按旧根查找未命中，已由主会话更正路径结论）；它影响的是修复后的**回归样本**，不影响方向。该 unknown 在 build-spec/build-code 需要回归样本时再补实测。
- **消费者**：Talk Round 1/2 的问题卡（已消费）、§4 事实表、后续 build-spec 的规格事实来源。

---

## 7. 方向审查（step 6 direction-advice）

### 7.1 运行事实（官方通道，如实登记，不做美化）

| 项 | 实测值 |
| --- | --- |
| 入口 | `node tools/cli/stage-runtime.mjs review --action=record --stage=make-decision --project=workflowhub --task=workflowhub-mechanism-simplification-t3-20260912 --input=<request>`（**官方 canonical 记录路径**，非诊断用的 `wh-review-cli run`） |
| 送审材料 | `raw_requirement`（用户原话）+ `objective_facts`（§4 事实简报，**不含任何用户答复/结论**）+ `convergence_outline`（**questions-only 投影**：§2 的 22 条 OI，`status` 统一为 `open`；已自检 0 泄漏：`selected_disposition`/`acceptance`/`counterexample` 均未出现） |
| `host_provider` | `dsh`（与任务Ⅰ 归档记录一致） |
| 返回 | `status: recorded`、`semantic_status: available`、**`partial: true`**（并非所有 provider 完成）、`pair_id = 80d97f71-574f-4e7f-b794-82b034de1e65` |
| red 角色 | `attempt_ref = quality/reviews/attempts/0d3eed49-7ff1-5451-a52f-01b800b196e2/attempt.json`；`result_ref = quality/reviews/results/make-decision-simple-0d3eed49-….json`；`report_ref = quality/reviews/reports/make-decision-simple-0d3eed49-….md`；`coverage = satisfied` |
| blue 角色 | `attempt_ref = quality/reviews/attempts/5c93d180-2a76-5bf1-aaff-78f52d8d53e7/attempt.json`；`result_ref = quality/reviews/results/make-decision-simple-5c93d180-….json`；`report_ref = quality/reviews/reports/make-decision-simple-5c93d180-….md`；`coverage = satisfied` |
| 汇总 | `report_ref = quality/reviews/reports/make-decision-simple-22a8aa24-6336-5833-a394-6df625e4647d.md`（1,180 B，只含配对记录，不含 findings 正文） |
| 审查预算 | `ok: true`、`route: initial_review`、`attempt_created: false`、四类计数全 0 |

> **口径**：这是**建议**，不是 pass/fail 门（`docs/standard-workflow.md:76-83` 与技能契约）。`partial: true` 与 provider 失败**如实保留**，不改写成「通过」或「空 findings」。

### 7.2 审查事实补充（provider / transport / 结果形态）

- 两角色 provider 集合相同：`kimi/coding`、`antigravity/flash`、`codex/luna`（`single_round`，`minimum_heterologous=1`）。
- **red 角色**：`kimi/coding` **失败**（`RATE_LIMITED` / `provider process exited with 1`，12,834 ms）⇒ 该角色 outcome = `partial`；`antigravity/flash` 完成（152,865 ms）、`codex/luna` 完成（476,554 ms）。
- **blue 角色**：三个 provider **全部完成**（344,503 / 118,400 / 205,302 ms）⇒ outcome = `completed`。
- 整体 `partial: true` **只有这一个成因**；记录里**没有** `partial_reason` 字段（如实登记为事实，不作为本任务要造的新字段）。
- red 合并 findings 4 条，但其 adjudication 有 6 个 cluster：其中 **2 条 codex 发现因 `evidence_kind=inferred` + `disposition=needs_corroboration` 未进公开 findings**（原文仍在 adjudication 与 provider_results 中）——本表把它们一并处置（R5 / R6）。
- 送审材料身份：material `8369f7cd…b739` / `revision-5feea024…76ef`、snapshot_tree `3e75c49c…115f`。

### 7.3 findings 逐条处置（18 条：12 公开 + 6 cluster）

| # | finding_id | 严重度 | 主张（一句） | 处置 | 依据 / 下一步 |
| --- | --- | --- | --- | --- | --- |
| R1 | `F-ccee3bcea66c` | major | 四条阻塞全量并入任务Ⅲ，忽视与在研任务Ⅱ 的 5 文件冲突；应把主线锁 C7+C8，阻塞交给任务Ⅱ 之后或独立任务 | `rejected_invalid` | 前提已被用户真实答复关闭：Q1A 决定并入，且 T-012 明确「build-code 等任务Ⅱ 完全合并之后才开始」，并附可执行判据（祖先校验）+ 反例。该 finding 的输入快照早于该答复 |
| R2 | `F-68888a975c30` | major | 把「历史坏行必须真能读回」设为验收项与只读/禁兼容桥冲突，且摘要数学不可反解；应排除出验收判据 | `rejected_invalid` | 前提不成立：修复机制**不需要**反解哈希、**不迁移**历史字节、**不建**兼容桥 —— 实际路径 = 改写侧 + 受害任务重跑一次 stage end（同 stage 行**原地替换**语义，`writeStageRow` 既有行为）。用户 Q3A 已选定「现场实测读回」 |
| R3 | `F-a97a56d7d626` | major | OI-15 被当作 non_goals 会把在范围内的治理验收问题路由成排除项 | `fixed` | 已改：OI-15 类别 → `success_failure_boundary`（§2.0 / §2.1 / §2.4 同步） |
| R4 | `F-7c53ca5fd2eb` | major | 同 R3（分类把在范围内问题表达成排除项） | `fixed` | 同 R3 |
| R5 | `F-a4799f04aa8e` | major（未进公开 findings） | 缺权威有界阻塞清单；四条是否**穷尽**从未确立，且四条性质各异 | `fixed` | 用户 R3-Q3 = A：清单权威边界 = PRD 51 条 X + 现场四条 + 八类分类学逐类扫描（含纳入判据与排除项），见 §3.6 与 OI-05 |
| R6 | `F-fd3d076d9beb` | major（未进公开 findings） | OI-10 的处置未绑定「只读 / 禁兼容桥 / 禁新持久化与状态机」硬约束 | `fixed` | 已补 §4.5 负向约束逐条筛查表 + §4.4 三条硬约束 + 边界声明（只能扩权时停在该条、不默认扩权） |
| B1 | `F-14899d800d5c` | major | 同 R1（仅缺陷 2 为硬阻塞），建议解耦或明确延期至任务Ⅱ 合入后 | `rejected_invalid` | 同 R1；「缺陷 2 是唯一硬 exit 1」已如实登记于 §4.2 |
| B2 | `F-1749da741c47` | major | 坏行只读保留、不作验收判据 | `rejected_invalid` | 同 R2；用户 Q3A 明确要求读回实测 |
| B3 | `F-6ad5abfde29b` | major | OI-11 只谈 specs markdownlint，遗漏 HEAD 已 exit 1 的 `verify-structure.mjs`，C8 双证将不可用 | `fixed` | 已纳入：OI-11 问题与处置均扩到 `verify-structure.mjs`（§2.1 / §2.4）；**具体路线转 Round 3（R3-Q1）** |
| B4 | `F-3887a39bee69` | minor | 同 R3 | `fixed` | 同 R3 |
| B5 | `F-1b45e69bec37` | major | 把「硬门禁」与「运行阻塞」混同（缺陷 1 `blocking:false`、缺陷 3 静默跳过、缺陷 4 无终态、仅缺陷 2 exit 1）；应分离门禁 / 可观察结果 / 可审计性并逐项设 oracle | `fixed` | 已按此项重写 §4.2 的「硬阻断？」列（逐条区分 blocking / exit 1 / 纯误导），并把「逐项 oracle」写进 T-005 的阻塞账要求 |
| B6 | `F-d74248a1ee2c` | major | 用户目标宽于 C7→C8 有界路线；四条零命中且无人认领；无有限清单证明穷尽 | `fixed` | 同 R5（用户 R3-Q3 = A） |
| B7 | `F-685f6760c400` | major | 先定集成顺序与 per-file 归属，或显式排除重叠修复 | `fixed` | 集成顺序已由 T-012 定死（含判据与反例）；per-file 归属写进 §3.6 与后续 build-spec 要求 |
| B8 | `F-9b930a0cf112` | major | 坏行在现约束下无可行处置；应定许可恢复路径与读回 oracle，否则显式延期 | `fixed` | 用户 R3-Q2 **改选 C**：恢复路径 = 只修写侧（+ 针对性回归测试）；**读回 oracle 被用户改判为不作验收项**（受害任务已结束）；历史坏行如实登记、不迁移、不改字节 |
| B9 | `F-23e4d9b464a3` | minor | 基线已红且相对 PRD 漂移，未定是否在本任务范围、如何区分存量债与回归 | `fixed` | markdownlint 部分由 R1-Q4 定（窄 ignores + 逐条修 + 不劣化）；**verify-structure 部分由 R3-Q1 = A 定**（改 CONTEXT.md，不动守卫） |
| B10 | `F-dc0e4ff7b560` | major | 22 条 OI 无一将四项修复逐条对照负向约束做可行性筛查；缺陷 4 恐触「不新增状态机」，目标或不可达 | `fixed` | 已补 §4.5 筛查表（四条均不需要新对象/字段/字面量/门禁/文件）+ 边界声明 |
| B11 | `F-508c5c79214c` | minor | OI-04/08/10/14 的 source 写「本任务核查 §4/§4.1」，在送审材料里不可解析，终态核验只能靠猜 | `fixed` | 已全部改为可解析锚点（`本决策记录 §4.2` / 事实表编号 / 受害任务路径） |
| B12 | `F-7746793c87e9` | minor | 用户显式要求的「主会话上下文控制和子代理派发」无任何 OI 承载，投影时整类遗漏 | `fixed` | 已新增 **OI-23** 承载 R-009，并由用户 R3-Q5 = A 定终态（可核对约束 + 落执行记录） |

**红/蓝争议清单（Talk Round 3 的法定输入，逐条呈用户）**：

| 争议 | 红方 | 蓝方 | 本任务现状 |
| --- | --- | --- | --- |
| D1 四条阻塞是否入本任务 | R1：不应全量抢修，交任务Ⅱ 后或独立任务 | B10（kimi）：零命中、无人认领，必然落入本任务；B1（antigravity）居中 | **已由用户 Q1A + T-012 裁定**：并入本任务，且 build-code 等任务Ⅱ 完全合并后开始 |
| D2 坏行读回是否作验收判据 | R2：排除出验收判据（与只读/禁桥冲突、哈希不可反解） | B8（codex）：定许可恢复路径 + 读回 oracle | **已由用户 Q3A 裁定**：必须现场实测读回；机制确认列入 R3-Q2 |
| D3 同一 OI-15 误分类的严重度 | major | minor | 处置相同（`fixed`），仅严重度记录不同；如实保留双方 |

**对 22 条 OI 的覆盖判断（审查者原话要点，已全部转为处置）**：① 过程性诉求（上下文纪律）无 OI 承载 → 新增 OI-23（B12）；② 无「约束筛查」维度 → 补 §4.5（B10）；③ 无「范围穷尽性」证明 → 转 Round 3（R5/B6）；④ OI-15 框定错误 → 已改类别（R3/R4/B4）；⑤ source 锚点不可解析 → 已改（B11）。

**未决项（如实登记，不掩盖）**：四条阻塞是否穷尽（`unknown`，待 R3-Q3）；verify-structure 的处置路线（待 R3-Q1）；坏行恢复机制的用户确认（待 R3-Q2）；OI-23 的终态（待 R3-Q4）；`kimi/coding` 的 `RATE_LIMITED` 属 provider 侧限流（如实登记，不重派、不判通过）。

### 7.4 当前 verify-code 复核与 C5 语义对账（2026-09-15）

当前 verify-code 审查结果 `quality/reviews/results/verify-code-simple-918dfb33-1d3a-53b1-a90f-33fadfcb2d0b.json` 的两条「major」主张已由独立只读核查分别对账到任务Ⅱ 的已批准设计：

| finding | 当前处置 | 对账依据与动作 |
| --- | --- | --- |
| `F-77edd4852429`：stage row 写入 material/snapshot 指纹但读侧不强制，建议恢复 stale 拒绝 | `rejected_invalid`（by design） | t2 `spec.md:175,601,636-641` 与父 PRD `:1996,2012` 明确删除 B 类 freshness/currentness 的比较、拒绝和自动重跑；D-009①（父 decision-log:1172-1179）批准「改材料后旧事实仍可读」。当前 `selectCurrentStageRow` 只按 `record_kind/stage/task_id` 选行；写口和认证口仍保留必要绑定。恢复 read-side stale gate 会直接使 C5 具名测试失败。 |
| `F-5e7ddc68487a`：读侧 stage row 没有 material/snapshot freshness 守卫 | `rejected_invalid`（by design） | 同上；当前 `deriveExecutionOutcomes` 只作 `provenance.status=stale` 披露，状态不变。`tests/contract/freshness-removal-preservation.test.mjs` 4 tests 通过，`tests/integration/stage-outcome-record-row-redirect.test.mjs` 12 tests 通过；不恢复已删除的 `execution_record_row_snapshot_stale` / `execution_record_row_material_stale` 拒绝路径。 |

本次对账同时修正当前 t3 材料中沿用 C5 之前语义的三处表述：

1. `plan.md` Code Anchors 不再称读侧存在「行 digest 比较逻辑」；明确写成「C5 已删除读侧 freshness/currentness 比较和拒绝，保留字段只作历史 provenance，`deriveExecutionOutcomes` 可做非门禁披露」。
2. `spec.md` SCN-003、错误态清单和 `AC-FIX-001` 改为区分「写侧 scope 指纹正确性」与「读侧 stale 不得拒绝既有行」；历史坏行的不可恢复是登记事实，不是 status 取值。
3. 这两条 finding 的原始 provider 结果不删除、不覆盖；当前材料以 `rejected_invalid` 记录设计对账，避免下一次独立审查把已批准的 C5 删除面误报为 t3 defect。

这次材料修正不是为了规避 review budget，也没有修改四份材料以外的代码语义；它使当前任务材料与已合入 t2 的 C5 行为一致。

### 7.5 verify-code 复核 F-c57aff1d9c2c：handoff 失败执行事实修复（2026-09-15）

新一轮 verify-code 复核（result `quality/reviews/results/verify-code-simple-428c2a89-9466-5b5e-a33f-8e0a303891cf.json`，当前材料修正后的快照）发现一条真实 major：`stage-handoff` 发布失败时，执行行的 `implementation_completion` 仍可能被写成 `completed`。这会造成执行域事实不一致：`evidence.value[].exit_code=1`、`execution_outcome.status=incomplete`，但 K2 行的实现完成层仍为 completed。

处置与边界：

- **已修复**：`runtime/stage/stage-runner.mjs` 的 `runStageEndReflection` 现在只有在 handoff `status=published` 且 `current=true` 时才写 `implementation_completion=completed`；handoff unavailable/stale/error 写 `incomplete`。
- **未改变质量语义**：`completion.status`/`quality_status` 仍只由质量谓词计算；执行失败通过 `execution_outcome=incomplete` 和 `execution_record_row_records_failed_command` 诊断披露，不重新成为质量 gate。这遵守 `docs/standard-workflow.md` 四层独立和 `skills/workflowhub-host-protocol/SKILL.md:68-70`。
- **回归测试**：`tests/integration/stage-row-publication.test.mjs` 新增「records a failed handoff as incomplete execution without changing the independent quality layer」；先在旧代码上 RED（执行投影缺少 `execution_record_row_records_failed_command`），修复后 GREEN（该用例通过）。已有 `tests/integration/stage-outcome-record-row-redirect.test.mjs` 的非零 handoff 命令投影用例继续通过。
- **独立复核结果**：该 finding 已实际修复；下一次 verify-code 复核需在当前快照上重新验证，预算耗尽时保持 `ask_user`，不伪造 clean。

本条不把失败交接改成正常跳过，也不把执行事实改写为质量通过；它修的是「写入层错误地标绿」这一真实 bug。

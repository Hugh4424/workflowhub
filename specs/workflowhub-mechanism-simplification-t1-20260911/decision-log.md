# 决策记录 · workflowhub-mechanism-simplification-t1-20260911

## 0. 任务身份

| 项 | 值 |
| --- | --- |
| project | workflowhub |
| task_id | workflowhub-mechanism-simplification-t1-20260911 |
| stage | make-decision |
| worktree | `/Users/Hugh/Hugh/Project/workflowhub-workflowhub-mechanism-simplification-t1-20260911` |
| branch | `task/workflowhub/workflowhub-mechanism-simplification-t1-20260911` |
| baseline_commit | `89773aaabf0aad97b64739d32182530f10c32aef` |
| task_path | `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-mechanism-simplification-t1-20260911` |
| created_at | 2026-09-11 |
| 需求来源（只读参考） | 任务组 PRD `specs/workflowhub-mechanism-simplification-20260910/prd.md`（当前文件 `sha256:e035948143d1cb01bb7067761b81f8a6b19ef4b851d56e60f53deb23b2750ba7`，4,346 行）与其母决定 `specs/workflowhub-mechanism-simplification-20260910/decision-log.md` |

## 1. 原始需求（用户原话，未改写）

> 请检查“/Users/Hugh/Hugh/Project/workflowhub/specs/workflowhub-mechanism-simplification-20260910/prd.md”，我准备开始其中第一个任务了。
> 请按标准 WorkflowHub 开始这个任务吧，先创建worktree，然后从 make-decision 开始，不要跳阶段，也不要依赖 build-spec 补需求。先基于原始需求，在make-decision的过程中和我一起仔细梳理完整用户流程、页面范围、数据状态、成功/失败边界、非目标和延期项。注意主会话上下文控制和子代理派发。Talk 和grill请用大白话说明选项、后果和风险；
>
> 本会话追加的结构化答复（真实回复，非本记录代答）：任务 ID = `workflowhub-mechanism-simplification-t1-20260911`；范围 =「对，任务Ⅰ 一次做完 C0–C3」。

### 1.1 可再生原始需求索引

本表只把 §1 原话与任务组 PRD 的既有条目建立导航，不新增产品决定、不改写 PRD、不替代原文。

| Source ID | 原始来源 | 当前含义 |
| --- | --- | --- |
| R-001 | §1 原话第 2 句 | 按标准 WorkflowHub 五阶段执行本任务；不跳阶段；不把需求缺口推给 build-spec |
| R-002 | §1 原话第 3 句 | make-decision 内与用户共同梳理六类边界：完整用户流程、页面范围、数据状态、成功/失败边界、非目标、延期项 |
| R-003 | §1 原话第 4 句 | 主会话只收摘要，重读量动作派子代理 |
| R-004 | §1 原话第 5 句 | Talk 与 Grill 用大白话说明选项、后果与风险 |
| R-005 | 本会话结构化答复第 2 项 | 任务Ⅰ = C0→C1→C2→C3 四个批次，一个 worktree 一条合并列车 |
| R-006 | PRD `## 任务地图` 任务Ⅰ 行（L108–L111） | 任务Ⅰ 的结果与 consumer：C0 基线口径 → C1 无真实 consumer 叶子 → C2 概念单一定义 → C3 唯一执行记录文件 |
| R-007 | PRD `#### C0` 卡（L372–L410） | C0：写死 M1–M5 分子/分母、HEAD 实测基线、不可证伪标 `unknown`、零新增文件 |
| R-008 | PRD `#### C1` 卡（L414–L554） | C1：删除经 consumer 扫描确认无真实 consumer 的叶子；`stage-outcome-proofs` / `workflow-evolution.mjs` / protocol-error 白名单**不删** |
| R-009 | PRD `#### C2` 卡（L556–L663） | C2：合并 4 类重复实现；CI 授权表改按职责；`monitoring-fact.v1` 分支只收窄不整删 |
| R-010 | PRD `#### C3` 卡（L665–L763） | C3：删 `index.json`、改 `facts.jsonl` 字段表承载 K2 行、给 `readTaskFacts` 真实生产 reader、`stage-outcomes/<stage>/*.json` 先迁移再删、删 `task-index.mjs` |
| R-011 | PRD `### 共享定义`（L33–L99） | K1–K9 保留侧清单、删除侧对象族、阻塞分类学、卡级 18 字段；K 优先于删除清单 |
| R-012 | PRD `### 需求覆盖（R-001 ~ R-015）`（L134–L154） | 本任务组承接的 15 条原始需求；任务Ⅰ 直接负责 R-002 / R-005 / R-007 / R-008 的对应卡 |
| R-013 | PRD `### 明确排除`（L156–L183） | E-1 ~ E-20：已裁定排除项，含 15 条母材料拒绝方案 + 5 条本 PRD 自身排除项 |
| R-014 | PRD `### ⚠️ 裁定 F`（L336–L360） | `npm run check` 的 oracle 口径 = 不劣化于 HEAD 基线 + 本卡范围内清零；新增 red 一律判失败 |
| R-015 | 母决定 `decision-log.md`（1,979 行 / 30 条 D） | 本任务组的上游来源；只读 |
| R-016 | 本会话 Talk Round 1 与 Round 2 的真实答复 | 见 §5 的 T-002 ~ T-017；本任务的**需求权威**（T-002：PRD 只当参考，一切以本任务四份材料为准） |

## 1.5 需求框架预设（先于研究/Talk 选定）

- **framework**：`functional`（背景 → 问题 → 目标 → 方案 → 验收 → 扩展）。
- **选择理由**：任务Ⅰ 是「把既有机制收敛为可逐批执行的整改批次」，主体是行为/结构改动而非证据研究；上游 PRD 的母决定已把事实研究做完，本阶段只需在既有节点下回填。
- **回填规则**：Talk、调研、审查、Grill 只更新本份 `decision-log.md` 的 OI 表，不新建第二张表、不新建需求账本。混合内容以 `functional` 为外层，在受影响节点下挂 `research` 子树。

六个功能骨架节点：`background` / `problem` / `goal` / `solution` / `acceptance` / `extension`。
六类固定类别：`complete_user_flow` / `page_scope` / `data_state` / `success_failure_boundary` / `non_goals` / `deferred`。

## 2. OI 大纲（唯一当前版本 · 版本 v1 · Round 2 收敛后终态）

> 身份绑定：本表全部 OI 绑定 `task_id = workflowhub-mechanism-simplification-t1-20260911`、`outline_version = v1`。
> 状态取值只用四个合法值：`open` / `confirmed` / `deferred` / `not_applicable`。Round 2 收敛后**无 `open` 残留**。
> 本表是本阶段唯一权威 OI 清单；Talk 各轮只更新本表，不新建第二张表。
> `requires_user_decision` 语义：该 OI 是否**必须**由用户裁决。由仓库事实或既有硬约束直接回答的记 `false`（OI-15 / OI-20 两条）。

### 2.0 OI 骨架覆盖表（机器可读契约）

> 每行按框架节点／固定类别登记其覆盖的 OI；全部 21 个 OI 至少被引用一次。

| framework_node | oi_ids | empty | reason |
| --- | --- | --- | --- |
| background | OI-01 OI-02 OI-20 | false | — |
| problem | OI-02 OI-03 OI-20 | false | — |
| goal | OI-03 OI-04 OI-21 | false | — |
| solution | OI-05 OI-06 OI-07 OI-08 OI-09 OI-10 | false | — |
| acceptance | OI-11 OI-12 OI-13 | false | — |
| extension | OI-14 OI-18 OI-19 | false | — |

| category | oi_ids | empty | reason |
| --- | --- | --- | --- |
| complete_user_flow | OI-14 | false | — |
| page_scope | OI-15 | false | — |
| data_state | OI-09 OI-10 OI-17 | false | — |
| success_failure_boundary | OI-11 OI-12 | false | — |
| non_goals | OI-16 | false | — |
| deferred | OI-17 | false | — |

### 2.1 需求框架节点

| OI | 节点/类别 | 问题 / 未知（大白话） | 来源 | 状态 | task_id | outline_version | selected_disposition | requires_user_decision | impact_dimensions |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| OI-01 | background | 这份 PRD 到底算不算「已确认的最终版」？它头部写 `final`，正文却还留着「19 组修正待你重新确认」的待办；而且它自己记账的行数（4,022 / 3,926）与实际文件（4,346 行）对不上。以当前文件为准，还是先回头补确认？ | 用户 §1 原话 + PRD L3 / L277 / L322 + 现场实测 | confirmed | workflowhub-mechanism-simplification-t1-20260911 | v1 | 用户选 C（T-002）：PRD 只当参考，本任务在 make-decision 内重决策需求边界，一切以本任务四份材料为准；PRD 的版本不自洽如实登记为事实，不据此改写上游 | true | goal |
| OI-02 | background | 任务Ⅰ 是做 PRD 里的一整条交付组（C0+C1+C2+C3，一个 worktree、一条合并列车），还是拆成多个小任务？ | 用户本会话真实答复 | confirmed | workflowhub-mechanism-simplification-t1-20260911 | v1 | 用户选「任务Ⅰ 一次做完 C0–C3」（T-001） | true | scope |
| OI-03 | problem | 这次要消掉的痛点是哪一个：① 仓库里躺着一批没人用的东西；② 同一个概念有好几份定义；③ 一个任务目录里有两套执行记录；④ 基线口径没写死导致后续没法验收？四者是不是都要在同一任务里解决？ | 用户 §1 原话 + PRD 任务地图 | confirmed | workflowhub-mechanism-simplification-t1-20260911 | v1 | 用户选 A（T-003）：主线 = 净减优先（仓库真的少东西 + 以后不再长回来）；四件事都做，做扎实的判据落在「净减」 | true | goal |
| OI-04 | goal | 任务Ⅰ 做成什么样才算「成了」：是仓库真的少了一批东西（可复算的净减数字），还是四个批次的验收 oracle 全过，还是下游任务Ⅱ/Ⅲ 能顺畅接着跑？ | 用户 §1 原话 + PRD `### 术语 · 净减法` | confirmed | workflowhub-mechanism-simplification-t1-20260911 | v1 | 用户选 A（T-004）：三条都要能自行复算 —— ① 具名删除清单 + 行数真变少；② 三个已知红一个不增；③ 历史任务仍能 `status` | true | goal |
| OI-05 | solution | C0 的 M1–M5 口径表写到哪里？PRD 字面要求写回 `specs/workflowhub-mechanism-simplification-20260910/prd.md`（上一个规划任务已 close 的交付物），但本任务的当前材料只有 `specs/<本任务>/` 四份。 | PRD `#### C0 · 结果与 consumer` + 治理边界 | confirmed | workflowhub-mechanism-simplification-t1-20260911 | v1 | 用户选 C（T-007）：**本任务材料为唯一权威**（口径表落在本任务 decision-log §3.5 与后续 spec）；上游 PRD **只加一行指针**，不复制表内容；双写风险如实登记（见 §12 RISK-003） | true | scope |
| OI-06 | solution | C1 的删除尺度停在哪一档？本任务 HEAD 实测：真正「生产和测试都没人用」的叶子只有 **2 个**；「只有测试引用」的约 **10 个**；「只有归档 / 文档 / 发布清单引用」的是 **10 个 schema + 1 个工具**。 | 子代理实测（§4.5）+ PRD C1 实测结论 | confirmed | workflowhub-mechanism-simplification-t1-20260911 | v1 | 用户选 B（T-006）：删 **Tier A（2 个）+ Tier B（约 10 个）**，同批改/删对应测试；**Tier C 不删**（会动归档引用与 Runner 发布清单）；仓外调用者风险记为 accepted_risk（RISK-001） | true | scope |
| OI-07 | solution | 「死导出」这一批（`runtime/evidence/**` 41 个、全仓 129 个）本轮做不做？PRD 自己写明该统计方法会高估、不得照单删，但没派给任何一张卡。 | PRD C1 实测结论 (e) | confirmed | workflowhub-mechanism-simplification-t1-20260911 | v1 | 用户选 B（T-012）：做**一次保守清理** —— 只删同时满足「零引用 + 不是 re-export + 不是动态访问」的导出，逐条复核并留证据；不照单删 | true | scope |
| OI-08 | solution | C2 里散落的 `/^[a-f0-9]{64}$/`（本任务实测 **110** 处）要收敛到什么程度才算达标？ | PRD C2 §oracle + §18 | confirmed | workflowhub-mechanism-simplification-t1-20260911 | v1 | 用户选 A（T-013）：**只合并同语义的**；语义不同的保留，并逐处写明「为何不能共用」；判据 = 实测数下降且每一处保留都有具名理由；不承诺收敛到 1 | true | acceptance |
| OI-09 | solution | `identity/path-cards/**` 的删除口径登记在 C3、执行却归 C5（任务Ⅱ）。本任务只登记不执行，还是顺手做完？ | PRD C3-FR-10（裁定 J-3） | confirmed | workflowhub-mechanism-simplification-t1-20260911 | v1 | 用户选 A（T-011 的口径）：本任务**只登记口径与字段归属**，执行归 C5；登记为交接项 HANDOFF-001 | true | scope |
| OI-10 | data_state | `facts.jsonl` 的目标字段形状由谁定稿：本任务就写死键集，还是只写死「四组字段 + `record_kind` 两行型」的语义、键名留给实现？ | PRD C3-FR-2（裁定 J-1/J-2）+ K2 行字段表 | confirmed | workflowhub-mechanism-simplification-t1-20260911 | v1 | 用户选 A（T-009）：本任务只写死 ① 四组字段的**语义**与两类行型；② 每类必填子集；③ **历史兼容判据**（历史 10 键 task-fact 行、`monitoring-fact.v1` 行、全部 `facts.jsonl` 必须仍可读）；键名留 build-spec。**语义不可改，spec 只能细化键名** | true | acceptance |
| OI-11 | success_failure_boundary | 四个批次是逐批做还是最后一次性做？失败时是回退整批还是只回退失败的那一步？ | PRD 任务地图「合并依赖」列 + 各卡 §10 | confirmed | workflowhub-mechanism-simplification-t1-20260911 | v1 | 用户选 A（T-010）：逐批做（C0→C1→C2→C3，串行依赖不可跳）；任一批不达标就**停在那批如实记录**，不放宽判据、不假装后面批次完成、不回退已过批次 | true | acceptance |
| OI-12 | success_failure_boundary | 验收口径怎么定死：`npm run check` 用「不劣化于 HEAD 基线」时，基线数字要不要在本任务开工 HEAD 上重测？本任务自己的材料要不要 markdownlint 清零？ | PRD 裁定 F（L336–L360）+ §4.8 实测 | confirmed | workflowhub-mechanism-simplification-t1-20260911 | v1 | 事实 + 用户 T-004 共同定死：基线在本任务 HEAD 重测（markdownlint **612** / path-guard **10** FAIL / verify-structure **2** FAIL，见 §4.8），**不沿用 PRD 的 554**；本任务四份材料 markdownlint 必须 **0 error**；新增 red 一律判失败 | true | acceptance |
| OI-13 | acceptance | 「净减」怎么算数：哪些文件必须给实测行数，哪些可以写 `unknown`？只写 `unknown` 能不能算通过？ | PRD 各卡 §18 + D-013 零新产物守卫 | confirmed | workflowhub-mechanism-simplification-t1-20260911 | v1 | 用户选 A（T-014）：允许 `unknown`，但每个 `unknown` 必须写明「为何算不出 + 下次可算的触发条件」；且必须至少有一个确定性净减项（`runtime/task/task-index.mjs` −30 行） | true | acceptance |
| OI-14 | complete_user_flow | 任务Ⅰ 做完之后，「给人看的东西」是什么形态？谁在哪一步看到什么、怎么自己复算？ | 用户 §1 原话 + PRD 任务地图 | confirmed | workflowhub-mechanism-simplification-t1-20260911 | v1 | 用户选 A（T-015）：**材料内的三样东西** —— ① 基础口径表（含可复算命令）；② 具名删除清单 + 每条 consumer 扫描证据；③ 改前/改后计数对照（含三个已知红）。**不新增页面、不新增仪表盘、不新增复算脚本** | true | goal |
| OI-15 | page_scope | 这次改动涉及页面/界面/可视化吗？PRD 判 `non_ui`，理由是唯一「人看的输出」是 C6 的 `status` 文本行。这个判定要不要因为 C3 会改 `status` 的读数形状而重算？ | PRD `### 产品总览 · 规划对象设计适用性` | not_applicable | workflowhub-mechanism-simplification-t1-20260911 | v1 | 三输入合并 = `non_ui`（见 `## UI applicability`）；C3 改的是命令行文本读数，不是页面/交互/视觉规格 | false | ordinary_detail |
| OI-16 | non_goals | 明确不做的事：PRD 的 15 条母材料拒绝方案 + 5 条自身排除项（E-1 ~ E-20）是否原样沿用？其中哪几条最容易在实现时被无意打破？ | PRD `### 明确排除` | confirmed | workflowhub-mechanism-simplification-t1-20260911 | v1 | 用户选 A（T-011）：E-1 ~ E-20 **原样沿用**；实现期最容易踩的三条 =「字段 ≠ 对象（不把 K2 行字段当新增持久对象）」「不改历史字节」「不迁移历史任务 / 不做兼容桥 / 不双写」 | true | scope |
| OI-17 | deferred | 到底有没有延期项？PRD 声称「零延期」，但实际存在跨卡/跨任务的后置项。 | PRD `### 明确排除` E-13/E-17/E-20 + 各卡 §14 | confirmed | workflowhub-mechanism-simplification-t1-20260911 | v1 | 用户选 A（T-011）：三处后置登记为**交接项**（各带 owner / 触发条件 / 消费者 / 关闭条件），任务Ⅰ 自己**零延期**；具名见 §12 | true | scope |
| OI-18 | extension | 与后续任务的交接边界：C3 必须先于 C5 合入、C4 依赖「OPN-5 / outline_closed 形式收口」，这些前置要不要落成可核对的交接物？ | PRD `### 依赖图`（L129–L131） | confirmed | workflowhub-mechanism-simplification-t1-20260911 | v1 | 用户选 A（T-016）：材料里写具名交接项，并在 C3 完成时**留一行可被 C5 读到的具名事实**（复用现有 `facts.jsonl` 行，不造新对象、不造新机制） | true | scope |
| OI-19 | extension | 治理文档同步面：任务Ⅰ 只动 `tools/cli/check-task-record-paths.mjs` 的授权表，还是也要同步改 `AGENTS.md` / `CONTEXT.md` / `CONSTITUTION.md` / `docs/standard-workflow.md`？（PRD 把这些归 C7 = 任务Ⅲ） | PRD 任务地图 + E-11 | confirmed | workflowhub-mechanism-simplification-t1-20260911 | v1 | 用户选 A（T-017）：本任务只改 ① `check-task-record-paths.mjs` 授权表；② 因删除而**必须**同步的 `docs/architecture/move-map.json` / `deletion-plan.json` 登记。治理文档正文归任务Ⅲ C7 | true | scope |
| OI-20 | problem | 三个已知红（markdownlint / `check-task-record-paths.mjs` / `verify-structure.mjs`）在本任务开工 HEAD 上还是不是 PRD 记的那些数？ | PRD 裁定 F 表 + §4.8 实测 | confirmed | workflowhub-mechanism-simplification-t1-20260911 | v1 | 事实（§4.8）：markdownlint **612 error / 35 files**（PRD 记 554，已漂移）；path-guard **10 FAIL**（一致）；verify-structure **2 FAIL**（一致）。本任务一律用重测值作基线 | false | acceptance |
| OI-21 | goal | C1 实测只剩 2 个文件能安全删，PRD 期待的「一批叶子」在 HEAD 上并不存在。净减目标改由 C2 与 C3 兑现，可以接受吗？ | 子代理实测（§4.5）+ PRD 各卡 §18 | confirmed | workflowhub-mechanism-simplification-t1-20260911 | v1 | 用户选 A（T-008）：接受。净减由 C2（4 类重复实现合并）+ C3（删 `index.json`、删 `task-index.mjs`）兑现；C1 只算「把确实没人用的东西清干净」 | true | goal |

### 2.2 六类固定类别

| OI | 节点/类别 | 问题 / 未知（大白话） | 来源 | 状态 | task_id | outline_version | selected_disposition | requires_user_decision | impact_dimensions |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| OI-14 | complete_user_flow | 见 §2.1 同号 OI 原文（给人看的东西 = 材料内三样） | 用户 §1 原话 | confirmed | workflowhub-mechanism-simplification-t1-20260911 | v1 | 用户选 A（T-015） | true | goal |
| OI-15 | page_scope | 见 §2.1 同号 OI 原文（页面范围） | 仓库事实 | not_applicable | workflowhub-mechanism-simplification-t1-20260911 | v1 | 三输入合并 = `non_ui` | false | ordinary_detail |
| OI-09 | data_state | 见 §2.1 同号 OI 原文（`identity/path-cards` 跨任务归属） | PRD 裁定 J-3 | confirmed | workflowhub-mechanism-simplification-t1-20260911 | v1 | 只登记不执行（T-011）；交接项 HANDOFF-001 | true | scope |
| OI-10 | data_state | 见 §2.1 同号 OI 原文（`facts.jsonl` 字段定稿层） | PRD 裁定 J-1/J-2 | confirmed | workflowhub-mechanism-simplification-t1-20260911 | v1 | 只定语义 + 行型 + 必填子集 + 历史兼容判据（T-009） | true | acceptance |
| OI-17 | data_state | 见 §2.1 同号 OI 原文（延期与交接的区分） | PRD E-13/E-17/E-20 | confirmed | workflowhub-mechanism-simplification-t1-20260911 | v1 | 三处登记为交接项，任务Ⅰ 零延期（T-011） | true | scope |
| OI-11 | success_failure_boundary | 见 §2.1 同号 OI 原文（失败边界） | PRD 任务地图 | confirmed | workflowhub-mechanism-simplification-t1-20260911 | v1 | 停在那批，如实记录（T-010） | true | acceptance |
| OI-12 | success_failure_boundary | 见 §2.1 同号 OI 原文（验收口径与基线重测） | PRD 裁定 F + §4.8 | confirmed | workflowhub-mechanism-simplification-t1-20260911 | v1 | 基线用本任务重测值；本任务材料 lint 清零（T-004 + 裁定 F） | true | acceptance |
| OI-16 | non_goals | 见 §2.1 同号 OI 原文（非目标 E-1 ~ E-20） | PRD `### 明确排除` | confirmed | workflowhub-mechanism-simplification-t1-20260911 | v1 | E-1 ~ E-20 原样沿用（T-011） | true | scope |
| OI-17 | deferred | 见 §2.1 同号 OI 原文（延期项） | PRD E-13/E-17/E-20 | confirmed | workflowhub-mechanism-simplification-t1-20260911 | v1 | 零延期 + 三条交接项（T-011） | true | scope |

### 2.3 需求到决策覆盖矩阵（六行 = 原始需求五维 + 方案细节边界）

| 维度 | 覆盖 OI | 终态 |
| --- | --- | --- |
| 业务目标 | OI-01 / OI-03 / OI-04 / OI-21 | confirmed |
| 流程与表面 | OI-14 / OI-15 | confirmed |
| 数据与状态 | OI-09 / OI-10 / OI-17 | confirmed |
| 成功失败与验收 | OI-11 / OI-12 / OI-13 | confirmed |
| 约束、非目标与延期 | OI-16 / OI-17 | confirmed |
| 方案细节边界 | OI-05 / OI-06 / OI-07 / OI-08 | confirmed |
| 上游效力与基线 | OI-01 / OI-02 / OI-18 / OI-19 / OI-20 | confirmed |

## 3. 范围三角（step 2 triage-scope）与收敛后的正式边界

### 3.1 范围内（草案 → 已被 §3.5 正式范围取代）

- C0：写死 M1–M5 分子/分母口径，在本任务 HEAD 实测基线，不可证伪项标 `unknown`，零新增文件。
- C1：对「与 `task-store.mjs` 无关」的叶子做 consumer 扫描并删除经确认无真实 consumer 的部分；同批同步守卫表失效登记。
- C2：合并 4 类重复实现；CI 授权表改按职责；`monitoring-fact.v1` 分支只收窄不整删。
- C3：删 `index.json`；改 `facts.jsonl` 字段表承载 K2 行；给 `readTaskFacts` 一个真实生产 reader；`stage-outcomes/<stage>/*.json` 先迁移再删；删 `runtime/task/task-index.mjs`。
- 与上述直接相关的最小测试、证据与文档改动。

### 3.2 明确的不确定性（草案 → 已全部由 Talk Round 1/2 收敛）

- ~~C0 口径表的落点~~ → T-007：本任务材料为准 + 上游 PRD 一行指针。
- ~~C1 的删除尺度~~ → T-006：Tier A + Tier B，Tier C 不删。
- ~~死导出批次是否属本任务~~ → T-012：做一次保守清理。
- ~~110 处 sha 正则的收敛门槛~~ → T-013：只合并同语义的。
- ~~`identity/path-cards` 归属与「零延期」口径~~ → T-011：交接项，零延期。
- ~~失败回退粒度~~ → T-010：停在那批，如实记录。
- ~~验收基线是否重测 / 材料是否 lint 清零~~ → 事实（§4.8）+ T-004：重测，且清零。
- ~~`facts.jsonl` 新字段的定稿层~~ → T-009：只定语义与兼容判据。

### 3.3 非目标（草案 → 正式版见 §3.5）

- 不改 wh-review 的 per-stage 审查标准与 prompt；不新增第五份材料 / public command / 持久化对象 / 状态机。
- 不迁移历史任务、不做兼容桥、不建双写；不改历史 store 字节与已落盘 provenance 字节。
- 不在本任务内重写五个 stage 的 SKILL；不重跑真实任务采基线。
- 不改五阶段拓扑、不加第六个 stage、不改普通任务的提问粒度。
- 不产出任务级延期项。

### 3.4 延期项（草案 → 正式版见 §3.5）

- `identity/path-cards/**` 的实际删除（登记在 C3、执行归 C5）。
- 跨仓审查通道缺陷 T-11 与 `ATTACHMENT_DELIVERY_UNSUPPORTED`（归 C4 / 3rd-review 仓）。
- 宿主每会话自建 worktree 的增殖（E-20，属宿主行为，本仓不造机制）。

### 3.5 收敛后的正式范围、非目标、延期与交接（Round 2 终态）

#### 正式范围（四个批次都必须做，串行不可跳）

1. **C0 基线口径**：写死 M1–M5 的分子/分母（每项带可执行命令）；用 §4.8 的本任务实测值作基线；不可证伪项标 `unknown` 并写明缺什么；口径表落在**本任务材料**（本节 + 后续 spec），在上游 PRD 的共享定义节**只加一行指针**；零新增文件、零真实任务重跑。
2. **C1 清理**：删 **Tier A（2 个）** `runtime/evidence/receipt-schema.mjs`、`runtime/evidence/journal-schema.mjs` + **Tier B（约 10 个，只有测试引用）**；同批改/删对应测试；同步清 `tools/cli/check-task-record-paths.mjs` 的 2 条失效登记与 2 条重复项；同步改 `docs/architecture/move-map.json` 与 `deletion-plan.json` 登记；**Tier C 不删**（会动归档引用与 Runner 发布清单）；死导出做一次**保守清理**（逐条复核：零引用 + 非 re-export + 非动态访问）。
3. **C2 合并重复**：`STAGE_REFLECTION_REF` 5→1、`CLOSE_PLAN_REF` 2→1、stage-outcome 形状校验 6→1、**同语义**的 sha 正则合并到唯一定义；语义不同的保留并逐处写明理由；CI 授权表按职责重组；`monitoring-fact.v1` 分支只收窄不整删。
4. **C3 唯一执行记录文件**：删 `index.json`（写点 0 / 读点 0）；`facts.jsonl` 承载 K2 两类行型（本任务只定语义、必填子集与历史兼容判据，键名留 build-spec）；给 `readTaskFacts` 落一个真实生产 reader；`stage-outcomes/<stage>/*.json` 先迁移再删；删 `runtime/task/task-index.mjs`；`identity/path-cards/**` 只登记（执行归 C5）。

#### 正式验收口径

- 基线 = 本任务 HEAD 重测值：markdownlint **612** error / 35 files、`check-task-record-paths.mjs` **10** FAIL、`verify-structure.mjs` **2** FAIL（§4.8）。合入后任一计数上升即判不通过。
- 本任务四份材料 markdownlint **0 error**（当前本文件已 0 error，受此约束持续保持）。
- 针对性测试按各批次清单执行；**禁止**全量 `vitest` / `npm test` / `test:safe`。
- 历史 store（**51** 个 `facts.jsonl`）在改字段表与删 `index.json` 后仍可 `status`，0 抛错。 此处保留原验收表述作来源；当前历史验收集合已由§18真实用户澄清替代为50个其他任务，原51测量值不变。
- 净减账：允许 `unknown`，但必须写「为何算不出 + 下次可算的触发条件」；至少一个确定性净减项（`task-index.mjs` −30 行）。

#### 非目标（E-1 ~ E-20 原样沿用，逐条见 PRD L160–L183）

- 不新增第五份材料 / public command / 持久化对象 / 状态机 / schema 文件 / 检查器。
- 不改 wh-review 的 per-stage 审查标准与 prompt；不重写五阶段 SKILL。
- 不改历史 store 与已落盘 provenance 字节；不迁移历史任务、不做兼容桥、不建双写。
- 不在本任务内改治理文档正文（归任务Ⅲ C7）。
- 不为 T-11 新增 request 版本字段（会撞 `PROTOCOL_INCOMPATIBLE`）。
- 不新增延期项。

#### 延期与交接（任务Ⅰ 零延期；三条交接项各带 owner / 触发 / 消费者 / 关闭条件）

| ID | 内容 | owner | 触发条件 | 消费者 | 关闭条件 |
| --- | --- | --- | --- | --- | --- |
| HANDOFF-001 | `identity/path-cards/**` 整类删除（本任务只登记口径与字段归属） | 任务Ⅱ（C5） | C3 合入后 | C5 的实现者 | `identity/path-cards/**` 不再产生写入 |
| HANDOFF-002 | 跨仓审查通道缺陷 T-11（`request_id` 不含协议版本）与 `ATTACHMENT_DELIVERY_UNSUPPORTED` | 任务Ⅱ（C4）+ 3rd-review 仓 | C4 开工 | C4、审查调用方 | 同材料改协议后可重跑，不再撞 `REQUEST_ID_CONFLICT` |
| HANDOFF-003 | 宿主每会话 / 每 phase 自建 worktree 的增殖（E-20） | 宿主（本仓外） | 宿主行为变化 | build-code 使用者 | 宿主不再按 phase 建 worktree |

**页面范围**：`non_ui`（见 `## UI applicability`）。任务Ⅰ 唯一「人看的输出」是三样材料内产物，不含页面、仪表盘或复算脚本。

### 3.6 M1–M5 口径定义与本任务基线事实（C0 的方向输入）

> 分工：**本阶段定口径与记录事实**；**冻结的那张表是 C0（build-code 批次⓪）的交付物**，落点按 T-007 在**本任务材料**（build-spec 的 `spec.md` 承接本节），上游 PRD 只加一行指针。
> 口径来源：母决定 D-015（`specs/workflowhub-mechanism-simplification-20260910/decision-log.md:1299-1322`）。本阶段**不改**口径语义，只在**本任务 HEAD `89773aa`** 上重测并写死数值（OI-20）。

| 指标 | 分子（含命令） | 分母（含命令） | 单位 | 本任务可得性 | 基线值与来源 | 不可证伪标记 |
| --- | --- | --- | --- | --- | --- | --- |
| **M1 机制记录墙钟占比** | 正式测试累计秒 + broker review 墙钟秒 | 会话跨度秒 | % | **不能算** | 母材料记录 20.0%（12,182.1 s + 6,054.384 s）/ 91,234 s —— 那是**当时三个实测记录值**，不是可重跑命令 | `unknown`；缺什么 = 历史 store 只有 duration facts（2,868 条），**没有**「正式测试累计秒」与「broker review 墙钟」这两个分量的分离字段 |
| **M2 每任务机制阻塞次数** | 该任务登记的机制阻塞条数（按 8 类分类学） | `1`（每任务一次） | 次数/任务 | **不能算** | 无可复算基线（历史 store 无阻塞分类字段；8 类分类学由本任务组 PRD 新引入） | `unknown`；缺什么 = 历史 facts 无阻塞分类字段，本任务尚无阻塞登记 |
| **M3 每任务记录文件数 / 无 reader 比例** | 记录文件数 = `find <store>/<task> -type f \| wc -l`；关键计数 = `-name facts.jsonl` / `-name index.json` / `-name task.json` / `-type d -name stage-outcomes` | `1`（每任务一次） | 文件数/任务 | **能算**（无 reader 比例**部分能算**：需逐对象 consumer 扫描，方法见 §4.5） | 本任务实测：`facts.jsonl` **51**、`index.json` **51**、`task.json` **118**、`stage-outcomes` 目录 **30**（任意深度）、`stage-outcome-proofs` 文件 **20,806**（活目录，会漂移，不得当固定验收数） | 无 |
| **M4 git 净行增减** | `git diff --shortstat <task_baseline_commit>..<task_delivery_commit>` 的 insertions−deletions | `1`（每任务一次） | 行/任务 | **能算**（需给出两个 commit） | 历史对照（**母材料记录值，本任务未复算**）：close-readiness-governance **+11,174**、execution-simplification **+8,039**。本任务目标是**净减（负值）** | 无 |
| **M5 控制面体量面（五项，逐项净减）** | 见下方 M5 分表 | — | 个 / 行 | **能算** | 见下方 M5 分表 | 无 |
| **token 维度** | — | — | — | **不可得** | 无基线 | `unknown`；R-003 的「>50%」**永久标推算**，禁止当实测引用 |

**M5 五项分表（本任务 HEAD `89773aa` 实测；母材料/PRD 旧值一并列出以便对照，**不得**当本任务基线）**

| # | 指标 | 可复算命令 | PRD / 母材料旧值 | 本任务实测 |
| --- | --- | --- | --- | --- |
| 1 | 单文件最大行数 | `wc -l runtime/stage/stage-content-contracts.mjs` | 6,485 | **7,014** |
| 2 | schema 文件数 | `ls runtime/schemas/*.json \| wc -l` | 47 | **35** |
| 3 | `throw new` 站点数 | `grep -rho 'throw new' runtime/ \| wc -l` | 1,412 / 1,476 | **1,525** |
| 4 | `validate`/`assert`/`check` 函数声明数 | `grep -rhoE '(^\|[[:space:]])(export[[:space:]]+)?(async[[:space:]]+)?function[[:space:]]+(validate\|assert\|check)[A-Za-z0-9_]*' --include='*.mjs' runtime/ \| wc -l` | 288 / 229 | **231** |
| 5 | 协议错误分类数 | `grep -oE 'class_id: "[a-z0-9_]+"' runtime/stage/protocol-error-whitelist.mjs \| sort -u \| wc -l` | 97 / 16 | **16** |

**M5 可证伪反例（必须与表同批给）**：把第 4/5 项换任一其它口径（例如箭头函数常量的第二口径 = 231 + 36），期望值必须随之改变；**换了口径数字不变即说明该 oracle 恒真**，判不通过。

**M1–M5 的净减方向（本任务验收要看的）**：M3 记录文件数净降（C3 删 `index.json` 后每任务至少 −1）、M4 净行数为负、M5 五项逐项净减或持平；M1/M2 与 token 维度如实保留 `unknown`，**不编数字**。

### 3.7 PRD 任务Ⅰ 卡与本任务决策的逐条对账（OPEN-002）

> 依据 T-002（PRD 只当参考）：不做这张对账，「参考」会在实现期变成事实权威。

| PRD 条目 | PRD 要求 | 本任务决策 | 关系 |
| --- | --- | --- | --- |
| C0 结果落点 | 写进 `specs/workflowhub-mechanism-simplification-20260910/prd.md` 共享定义节 | T-007：本任务材料为权威，上游 PRD 只加一行指针 | **偏离**（已登记 RISK-003） |
| C0 基线数字 | 在 HEAD 实测写死 | §3.6 在本任务 HEAD `89773aa` 重测 | 一致（PRD 自己要求「在 HEAD 重测」，故数值更新是合规的） |
| C0 §17 与 §18 互斥 | 零新增文件优先，测试载体用 `node -e` 断言 | 沿用；口径表本身不新增文件 | 一致 |
| C1 删除清单 | D-018① 具名清单 | §4.5 实测：Tier A（2）+ Tier B（约 10）；Tier C 不删 | **子集**（原清单三项实测有活消费者，PRD 裁定 H 已改判，本任务据此收窄） |
| C1 死导出 | PRD 无卡认领（只登记实测数字） | T-012：做一次保守清理 | **超集**（本任务新增范围，用户明确选择） |
| C2 sha 正则收敛 | 「目标值 = C0 口径表写死的那个数」 | T-013：只合并同语义的，逐处写明不能共用的理由 | **细化**（PRD 无具体门槛；本任务给出可判据） |
| C2 `monitoring-fact.v1` | 只收窄不整删 | 沿用 | 一致 |
| C3 `facts.jsonl` 字段 | 改字段表承载 K2 行 | T-009：只定语义 + 行型 + 必填子集 + 历史兼容判据，键名留 build-spec | **细化**（不改方向） |
| C3 `index.json` 删除 + `task-index.mjs` 删除 + 给 reader | 是 | 沿用 | 一致 |
| C3 `identity/path-cards` | 登记归 C3、执行归 C5 | T-011 沿用，登记为 HANDOFF-001 | 一致 |
| 非目标 E-1 ~ E-20 | 原样沿用 | 沿用 | 一致 |
| 验收 oracle 口径 | 不劣化于 HEAD 基线 + 本卡范围内清零 | 同口径，基线值换成本任务重测值（612 / 10 / 2） | 一致（口径同一，数值更新） |
| 明确排除 E-16「本任务不实现任何删除」 | 约束的是**写 PRD 的那个任务**（D-019：PRD 只做路线设计） | 任务Ⅰ 是**执行任务**，删除正是它的工作 | **范围说明**（防下游误读 E-16） |

> 本节每条事实都可在任务 worktree 内用行内命令复算；重读量核查由独立子代理在只读上下文执行，主会话只接收结论摘要。

### 3.8 完整用户流程、数据状态与失败语义（T-020 定稿）

> 本节回应方向审查 FND-D-04 / FND-D-05：把"谁做、看什么、下一步、失败停在哪"和状态语义写死。

#### 逐批用户流程（每批一个可见结果 + 一个停止条件；不新增人工确认点）

| 批次 | 谁做 | 入口 | 用户可见结果 | 下一步 | 失败停在哪 |
| --- | --- | --- | --- | --- | --- |
| C0 基线口径 | 本任务主会话（只读测量） | `specs/<本任务>/` 材料 + PRD 参考 | **M1–M5 口径表**（每行含分子/分母命令、单位、基线值、可得性、不可证伪标记），落在本任务材料 | 进入 C1 | 任一行缺分子或分母、或出现未经命令实测的数字 → 停在 C0 |
| C1 清理 | 本任务主会话 | `runtime/evidence/**`、`tools/cli/**`、守卫表、move-map | **具名删除清单** + 每条 consumer 扫描证据（命令 + 计数 + 命中文件） | 进入 C2 | 任一被删对象命中 K1–K9；或 `check-task-record-paths.mjs` FAIL 数 > 10 → 停在 C1 |
| C2 合并重复 | 本任务主会话 | `runtime/**`、`tools/cli/**` | **"同一概念只剩一处定义"对照表**（每类：旧声明数 → 新声明数 + 逐处保留理由） | 进入 C3 | 任一类的接受集超出生产者真实输出形态（正则放宽）→ 停在 C2 |
| C3 唯一记录文件 | 本任务主会话 | `runtime/task/task-store.mjs`、`quality-store.mjs`、`completion-predicates.mjs`、`task-index.mjs` | **任务目录只剩一个执行记录文件** + 历史任务仍能 `status` 的实测输出 | 四批完成，交 build-code 末次 aggregate | `index.json` 写点或读点未归零；或任一历史任务 `status` 抛错 → 停在 C3 |

**每批的验证时机（FND-D-03）**：**每批做完立刻跑该批自己的判据并留证据**，不把验证推迟到四批全做完之后 —— 否则后面的改动会掩盖前面的回归。

**范围守卫（FND-D-07）**：任何批次若要超出 §3.5 写死的范围（例如 C2 分类时发现新的重复定义、C1 发现新的可删对象），**必须回到用户确认**，不得自行扩大；同语义的等价发现视为范围内，新语义的发现视为范围外。

#### 数据状态与失败语义（FND-D-05）

| 状态 | 含义 | 是否等于完成 |
| --- | --- | --- |
| `completed` | 本批判据全部实测通过 | 是 |
| `unavailable` | 环境/通道不可得（例如无宿主 bridge 时的正式 stage outcome） | **否**，且不阻断同 task 修复 |
| `incomplete` | 判据未跑齐或存在未处置缺口 | **否** |
| `partial` | 只完成一部分（例如只删了 Tier A） | **否**，且不得按已完成上报 |

**恢复规则**：同一 task 内允许继续修复与重跑受影响判据；**不得**把 `unavailable` / `incomplete` / `partial` 改写成通过，**不得**新建 successor / continuation / 替代记录。数据状态写入沿用现有 `facts.jsonl`（K2）落点，不新增状态对象。

> 本节每条事实都可在任务 worktree 内用行内命令复算；重读量核查由独立子代理在只读上下文执行，主会话只接收结论摘要。

## 4. 事实与证据（step 1 load-context / step 3-5 现场核查）

> 本节每条事实都可在任务 worktree 内用行内命令复算；重读量核查由独立子代理在只读上下文执行，主会话只接收结论摘要。

### 4.1 需求来源的效力事实

| 事实 | 实测值 | 复算方式 |
| --- | --- | --- |
| PRD 头部状态 | `Status: final`，声明「全部修正已由用户确认，含裁定 A–J；J-10 已答复『接受 A』」 | `specs/workflowhub-mechanism-simplification-20260910/prd.md:3` |
| PRD 正文残留待办 | 「待办：请用户对 M-1 ~ M-11（第一轮）与 A–H（第二轮）合计 19 组修正一次性重新确认」 | 同文件 L277 |
| PRD 状态自述冲突 | 同文件另有一处写「当前状态：`draft`」 | 同文件 L29 / L277 / L322 三处并存 |
| PRD 自身记账 vs 实际文件 | 记账最后值 = 4,022 行 / 456,130 B；实际文件 = 4,346 行；`sha256:e0359481…` 与它记录过的任一 revision 都不同 | `wc -l` / `shasum -a 256` |
| 上游规划任务的收口事实 | `workflowhub-build-prd` 任务内有 2026-09-10T08:25:41Z 的完整 close 人工确认（原文「完整close：提交、合并、归档、推送、清理」） | `ls ~/Knowledge/Projects/workflowhub/tasks/workflowhub-build-prd/quality/confirmations/` |

结论（T-002）：PRD 的**交付事实**已成立（已 close、已合并 main），但**自我记账**不自洽。本任务以当前文件字节作参考文本，同时把不自洽登记为事实，不据此改写上游。

### 4.2 基线漂移事实（详见 §4.8 的重测）

| 事实 | PRD 记录值（HEAD `216a546d`） | 本任务实测（HEAD `89773aaa`） |
| --- | --- | --- |
| 历史 store `facts.jsonl` / `index.json` / `task.json` | 49 / 49 / 116 | **51 / 51 / 118** |
| 仓库 HEAD | `216a546d4ec33ca3804a188a14a9536a2968f77c` | `89773aaabf0aad97b64739d32182530f10c32aef` |

### 4.3 并发事实（如实登记，不阻断）

本任务开工时，另一条任务分支 `workflowhub-build-prd-workflow-hardening-20260911` 的 worktree 仍在活动；主仓 `main` 在本任务开工时为 clean。含义：本任务 `baseline_commit` 是开工快照，close 前必须重新核对主线是否前进。

### 4.4 现场核查工具与范围

- 全部核查为**只读**：`git`、`read`、`grep`、`find`、`wc`、`node`；未修改、未创建任何被核查文件。
- 核查由独立子代理在其自身上下文执行，主会话只收结论（`AGENTS.md`「重读量动作点默认派子代理」）。
- 本任务 worktree 的 `node_modules` 是指向主仓 `node_modules` 的符号链接（与同仓在跑的另一任务做法一致），它是被 `.gitignore` 忽略的本地依赖，不是产物。

### 4.5 C1 可删面实测（子代理只读复核，HEAD `89773aa`）

> 结论：PRD 期待的「一批无 reader 叶子」在当前 HEAD 上**基本不存在**。按「生产和测试都没人用」的严格档，只有 **2 个文件**。

| 档 | 判据 | 数量 | 具名 |
| --- | --- | --- | --- |
| Tier A | 生产与测试都零引用 | **2** | `runtime/evidence/receipt-schema.mjs`、`runtime/evidence/journal-schema.mjs` |
| Tier B | 零生产引用、有测试引用 | **约 10** | `runtime/evidence/{audit-summary-carrier,boundary-confirm,capability-doctor,requirement-ledger,text-utils}.mjs`；`tools/cli/{check-skill-updates,generate-iteration-brief,record-evolution-result,repo-skills-manifest,validate-current-plan-tasks}.mjs` |
| Tier C（**本任务不删**） | 零代码引用，仅归档 / 文档引用 | **10 schema + 1 工具** | `runtime/schemas/{audit-summary.schema,human-confirmation.v1.schema,quality-verify.v1,requirement-ledger.schema,requirements-coverage.schema,risk-acceptance.v1,source-manifest.schema,steps.schema,task-fact.v1,task-index.v1}.json`；`tools/cli/source-manifest.mjs` |

**必须排除（实测有生产消费者，不得删）**：`runtime/schemas/skill-catalog.schema.json`、`runtime/schemas/review-bundle.schema.json`（`runtime/evidence/check-skill-closure.mjs:55` 按名字加载，`:486`/`:489` 调用）；`tools/cli/noop.mjs`（`config/workflowhub.yaml:9`）；`tools/cli/validate-field-mapping.mjs`（`.github/workflows/ci.yml:21`）；`tools/cli/task-close.mjs`（`runtime/distribution/runner-release.mjs:69` 的 `RUNNER_ENTRYPOINTS` + `CONSTITUTION.md:178`）；`check-contract.mjs`、`check-metrics-schema.mjs`、`check-task-record-paths.mjs`（`tools/cli/run-checks.mjs` 按名字 spawn）。

**Tier A / B 的连带面**：`docs/architecture/move-map.json` 与 `docs/architecture/deletion-plan.json` 的登记必须同批改（`tests/contract/repository-governance.test.mjs` 解析 move-map）；Tier B 必须同批改/删对应测试文件。

**守卫表自身的问题（与删除清单零重叠）**：`tools/cli/check-task-record-paths.mjs`（324 行）有 2 条失效登记（`scripts/ci` L30、`tests/fixtures/task-path-legacy-input.json` L36）与 2 条重复项（`core/__tests__/runtime-mode.test.mjs` L38+L49；`skills/wh-review/scripts/__tests__/review-runner.test.mjs` L61+L63）。

**UNKNOWN（如实登记）**：Tier B 里 5 个 CLI 工具是否存在**仓库外**按路径调用的消费者 —— 仓内扫描无法证明；已按 T-006 记为 accepted_risk（RISK-001）。

### 4.6 官方执行通道事实（外部接口核实检查）

| 项 | 实测结论 |
| --- | --- |
| 公开入口 | `node tools/cli/stage-runtime.mjs <behavior> --action=<action> [...]`；make-decision 可用 = `run:execute\|draft\|reflect`、`review:record\|risk`、`confirm:decision`、`status:begin`、`doctor:workspace` |
| 材料写入 | `decision-log.md` 由 `run --action=draft --stage=make-decision --name=decision-log.md --input=<内容文件>` 官方写入（本记录全程用该通道写入，返回 `artifact_ref`） |
| **不可用** | `run --action=preflight` **拒绝** make-decision（仅 build-code / verify-code） |
| 阶段 outcome | `run --action=execute` 需要宿主 bridge 发布认证 outcome；无宿主时只能得到真实的 `unavailable` 执行事实 |
| 复盘 | 显式 `run --action=reflect`；`identity` 与 outcome 必须逐项相等；`incomplete` 的 stage outcome 产不出真实复盘判断 |
| 本任务当前状态 | 无外部宿主 bridge ⇒ 正式 stage outcome 预计为 `unavailable`；`outline_closed` 类形式收口可能不成立。这是执行事实，不是质量结论 |

### 4.7 发布面事实

`runtime/distribution/runner-release.mjs:89` 按目录扫描把 `runtime/schemas/*.json` **全部**打进 Runner 发布清单，`tests/integration/runner-clean-install.test.mjs` 与 `tests/contract/runner-contract.test.mjs` 会校验该清单。含义：Tier C 的任何删除都会改变发布清单 —— 这是 T-006 不删 Tier C 的事实依据之一。

### 4.8 本任务基线实测（子代理只读重测，HEAD `89773aa`；`markdownlint-cli2` v0.14.0 / markdownlint 0.35.0）

| 指标 | PRD 记录 | 本任务实测 | 差异 |
| --- | --- | --- | --- |
| markdownlint error | 554 | **612** | 漂移（+58） |
| markdownlint 出错文件数 | 35 | **35** | 一致 |
| 其中 `specs/workflowhub-ui-frontend-capability-20260904/**` | 420 | **420** | 一致 |
| 其中 `specs/workflowhub-mechanism-simplification-20260910/decision-log.md` | 82（未记） | **82** | 上游材料旧账（归 C7） |
| 其余 | 110（推算） | **110** | — |
| `check-task-record-paths.mjs` FAIL | 10 | **10** | 一致（exit 1） |
| `verify-structure.mjs` FAIL | 2 | **2** | 一致（`CONTEXT.md` 缺 `test-acceptance`、含排除术语 `runtime`） |
| `runtime/task/task-store.mjs` | 334 | **334** | 一致 |
| `runtime/task/task-index.mjs` | 30 | **30** | 一致 |
| `runtime/evidence/quality-store.mjs` | 293 | **293** | 一致 |
| `runtime/task/task-kernel-implementation.mjs` | 1,177 | **1,177** | 一致 |
| `runtime/stage/completion-predicates.mjs` | 1,259 | **1,333** | 漂移 |
| `runtime/evidence/freshness.mjs` | 781 | **781** | 一致 |
| `runtime/stage/stage-content-contracts.mjs` | 6,806 | **7,014** | 漂移 |
| `tools/cli/check-task-record-paths.mjs` | 324 | **324** | 一致 |
| `index.json` 字符串命中 | 12 | **17**（其中字面 `index.json` 仅 **7**，其余为 `diff-index.json` 等复合名） | 口径差异，须在 C3 写清 |
| `STAGE_REFLECTION_REF =` 声明 | 5 | **5** | 一致 |
| `CLOSE_PLAN_REF =` 声明 | 2 | **2** | 一致 |
| `workflowhub-stage-outcomes.v1` 命中 | 9 / 6 | **9** | 一致（两口径见 PRD） |
| `^[a-f0-9]{64}$` 命中 | 107 | **110** | 漂移 |
| `runtime/schemas/*.json` | 35 | **35** | 一致 |
| 历史 store `facts.jsonl` / `index.json` / `task.json` | 49 / 49 / 116 | **51 / 51 / 118** | 漂移（活目录） |
| 历史 store `stage-outcomes` 目录 | 29 | **30**（任意深度；`maxdepth 3` 为 0） | 深度口径差异 |

**结论**：C0 的「在 HEAD 重测写死唯一值」是必要的 —— PRD 里至少 6 个数字已漂移。本任务一律用右列实测值，**不得沿用** PRD 记录值（OI-20）。

### 4.9 方向审查事实（step 6 direction-advice）

| 项 | 实测值 |
| --- | --- |
| 入口 | `node skills/wh-review/scripts/wh-review-cli.mjs run`，stdin 送入 `{"stage":"make-decision","review_track":"direction","host_provider":"dsh","materials":{raw_requirement, objective_facts, convergence_outline}}` |
| 结果 | `status=available`、`outcome=completed`、`pair_status=complete`、`material_consistency=consistent`、`authoritative=false`、`reused=false` |
| `material_id` | `7671c0721e6086dbeeefe995e6adf2d61d6ff42d70330207c5d0e68670865eb5`（红蓝同 ID） |
| `pair_id` | `6fff4fff-0270-47aa-becc-9796196cef25` |
| provider | `antigravity/flash` ×2（red 104,991 ms / blue 93,755 ms）、`codex/luna` ×2（red 290,108 ms / blue 185,769 ms）；**4/4 completed，0 失败，retry=0，`evidence_anchor_valid` 全 true** |
| 产出 | **16 条 findings，severity = blocking 1 / major 15** |
| 原始结果落点 | `/tmp/t1-direction-review-result.json`（43,021 B）；sink `/Users/Hugh/.workflowhub/review-sink/fbde144a…json`（CLI 写在仓外） |

**送审包的已知缺陷（blocking finding #1，如实登记为我的装配缺陷，不辩解）**：`materials.objective_facts` 里带进了 T-002 / T-006 / RISK-001 等**处置与决定 ID**；`convergence_outline` 的 OI-21 / OI-09 / OI-19 问题文本里也带了候选处置（finding #7）。这会让方向审查被"预锚定"。
**处置**：按 wh-review 单轮契约，**不为修材料再派第二次 provider 请求**；缺陷本身如实登记在本行，16 条 findings 仍按其自身事实成立与否逐条处置（见 §8）。**方法学后果一并登记**：本次方向审查是在被污染的送审包上完成的，因此它"未发现某类问题"**不能**当作该类问题不存在。

## 5. Talk（真实问答）

> 生命周期：每个 Round 各自 `ask`（问题卡在会话中可见）→ `wait` → 用户真实回复 → `resume` → 重排。用户可只回编号。

### Round 1（step 3 · 已完成 · 用户真实回复）

> 用途：核实痛点真实性、成功标准、是否需要调研，以及上游需求来源的效力。

| talk_id | 问题/选项（大白话） | 后果/风险 | 用户选择/原文 | 队列变化 | source/evidence |
| --- | --- | --- | --- | --- | --- |
| T-001 | 任务 ID 与交付组范围 | 影响 worktree 名、分支名与整条合并列车 | 「workflowhub-mechanism-simplification-t1-20260911」+「对，任务Ⅰ 一次做完 C0–C3」 | 关闭 OI-02；无新增 | 用户本会话结构化答复 |
| T-002 | R1-Q3：怎么对待自相矛盾的 PRD（A 以当前文件为准 / B 先补确认 / **C 只当参考、本任务重决策**） | 决定需求基线与「谁是权威」 | 选 **C** | OI-01 → confirmed；派生 OPEN-002（需与 PRD 任务Ⅰ 卡逐条对账） | 用户本会话结构化答复 |
| T-003 | R1-Q1：这次真正的主线（**A 净减优先** / B 结构清爽优先 / C 安全优先） | 决定「做扎实」的判据落在哪 | 选 **A** | OI-03 → confirmed；OI-21 影响档升高 | 用户本会话结构化答复 |
| T-004 | R1-Q2：拿什么判断它成了（**A 三条可复算** / B PRD 各卡 oracle / C 下游跑得顺） | 决定验收尺子 | 选 **A** | OI-04 → confirmed；OI-12 / OI-20 影响档升高 | 用户本会话结构化答复 |
| T-005 | R1-Q4：要不要外部调研（**A 不做** / B 做一次窄调研） | 决定 step 4 是否执行 | 选 **A** | step 4 记 `skipped` 并写明理由 | 用户本会话结构化答复 |

**Round 1 收敛结论**：4 问全部收敛，队列无剩余 `high`/`medium` 待答项。
关键结论 = ① 需求权威在本任务四份材料，PRD 只作参考；② 主线是净减；③ 验收三条都必须可自行复算；④ 不做外部调研。
保留风险 = PRD 与本任务材料之间需要逐条对账，否则「参考」会在实现期变成事实权威（OPEN-002）。

### Round 2（step 5 · 已完成 · 研究后 · 用户真实回复）

> 第一批 6 问（范围、取舍、数据状态、失败边界、非目标、延期），答后重排再问第二批 6 问（PRD/子代理实测把两个新问题推到队首）。

| talk_id | 问题/选项（大白话） | 后果/风险 | 用户选择/原文 | 队列变化 | source/evidence |
| --- | --- | --- | --- | --- | --- |
| T-006 | R2-Q1：C1 删到哪一档（A 只删 Tier A 2 个 / **B A + Tier B 约 10 个** / C 再加 Tier C） | 决定删除面与仓外风险 | 选 **B** | OI-06 → confirmed；新增 RISK-001（accepted_risk） | 用户本会话结构化答复 |
| T-007 | R2-Q2：C0 口径表写到哪里（A 本任务材料 / B 写回 PRD / **C 两边都写**） | 决定需求权威落点 | 选 **C**（落成「本任务材料为准 + PRD 一行指针」） | OI-05 → confirmed；新增 RISK-003（双写） | 用户本会话结构化答复 |
| T-008 | R2-Q3：净减靠什么兑现（**A 落在 C2/C3** / B 改口径 / C 扩删） | 决定目标可达性 | 选 **A** | OI-21 → confirmed | 用户本会话结构化答复 |
| T-009 | R2-Q4：`facts.jsonl` 新字段定到哪一层（**A 只定语义与兼容判据** / B 现在写死键名 / C 全留给 build-spec） | 决定方向层与规格层的分界 | 选 **A** | OI-10 / OI-09 → confirmed | 用户本会话结构化答复 |
| T-010 | R2-Q5：某批做不下去怎么办（**A 停在那批如实记录** / B 跳过继续 / C 降级为登记项） | 决定失败边界 | 选 **A** | OI-11 → confirmed | 用户本会话结构化答复 |
| T-011 | R2-Q6：非目标与延期怎么算（**A 交接项 + 零延期** / B 登记为延期 / C 留在本任务做完） | 决定延期口径与职责边界 | 选 **A** | OI-16 / OI-17 / OI-09 → confirmed；产出 HANDOFF-001~003 | 用户本会话结构化答复 |
| T-012 | R2b-Q1：死导出本轮做不做（A 不做只登记 / **B 一次保守清理** / C 照单全删） | 扩大范围到死导出 | 选 **B** | OI-07 → confirmed | 用户本会话结构化答复 |
| T-013 | R2b-Q2：110 处 sha 正则收敛到什么程度（**A 只合并同语义的** / B 全部收敛 / C 只做前 3 类） | 决定净减主战场与行为风险 | 选 **A** | OI-08 → confirmed | 用户本会话结构化答复 |
| T-014 | R2b-Q3：净减账允许 `unknown` 吗（**A 允许但必须写理由** / B 不允许 / C 允许且不要求理由） | 决定记账纪律 | 选 **A** | OI-13 → confirmed | 用户本会话结构化答复 |
| T-015 | R2b-Q4：给人看的东西是什么形态（**A 材料内三样** / B A + 单页总结 / C A + 复算脚本） | 决定用户可见结果 | 选 **A** | OI-14 → confirmed | 用户本会话结构化答复 |
| T-016 | R2b-Q5：跨任务交接留什么（**A 材料具名项 + 一行可读事实** / B 只写材料 / C 不留） | 决定交接可核性 | 选 **A** | OI-18 → confirmed | 用户本会话结构化答复 |
| T-017 | R2b-Q6：治理文档本轮改哪些（**A 只改必须同步的登记** / B 相关句子一并改 / C 完全不动） | 决定与任务Ⅲ 的边界 | 选 **A** | OI-19 → confirmed | 用户本会话结构化答复 |

**Round 2 收敛结论**：两批共 12 问全部收敛；重排后队列无剩余 `high`/`medium` 待答项，本轮结束。
关键结论 = ① C1 删 Tier A+B、Tier C 不删；② 死导出做保守清理；③ 净减落在 C2/C3；④ 只定语义与兼容判据，键名留 build-spec；⑤ 失败停在那批；⑥ 零延期 + 三条交接项；⑦ 治理面只改必须同步的登记。
保留风险 = RISK-001（仓外调用者不可证明）、RISK-003（PRD 指针行属双写形态）、OPEN-002（PRD 对账未做）。

### Round 3（step 7 · 已完成 · 方向审查后 · 用户真实回复）

> 输入 = §4.9 的红/蓝方向审查 finding 争议清单（16 条，逐条列出，未压缩成泛化摘要）+ §13 未决项。

| talk_id | 问题/选项（大白话） | 后果/风险 | 用户选择/原文 | 队列变化 | source/evidence |
| --- | --- | --- | --- | --- | --- |
| T-018 | R3-Q1：在「仓外调用者未知」这个新事实下，C1 删到哪一档（A Tier B 拆开只删 evidence 模块 / **B 维持 T-006 全删 Tier B** / C 只删 Tier A 2 个） | 决定删除面与仓外断链风险 | 选 **B**（维持原选择） | OI-06 disposition 不变；RISK-001 升格为"经方向审查两次点名后由用户明确接受的风险" | 用户本会话结构化答复；审查原始意见见 §4.9 FND-D-06 / FND-D-11 / FND-D-13 |
| T-019 | R3-Q2：C0 口径表要不要写回上游 PRD（A PRD 不动 / **B 维持 T-007 加一行指针** / C 记待办交 C7） | 决定跨分支冲突面与需求权威落点 | 选 **B**（维持原选择） | OI-05 disposition 不变；RISK-003 补"仅一行、不复制内容"硬约束 | 用户本会话结构化答复；审查原始意见见 §4.9 FND-D-09 |
| T-020 | R3-Q3：完整用户流程按哪种定稿（**A 逐批可见结果 + 停止条件** / B 加逐批人工确认点 / C 只在最后看一次） | 决定可见结果与失败定位能力 | 选 **A** | OI-14 disposition 细化为逐批形态；§3.8 据此写死 | 用户本会话结构化答复；审查原始意见见 §4.9 FND-D-04 / FND-D-05 |

**Round 3 收敛结论**：3 问全部收敛；审查争议中 **2 条由用户明确维持原选择**（T-018 / T-019），**1 条采纳审查建议的形态**（T-020）。
关键结论 = ① 删除尺度不变（Tier A + Tier B）；② 上游 PRD 只加一行指针；③ 用户流程按"逐批可见结果 + 停止条件"定稿，不加人工确认点。
保留风险 = RISK-001（仓外未知消费者，两次被点名）、RISK-003（上游写回）、以及 §4.9 登记的"送审包被污染 ⇒ 本轮审查的阴性结论不可当证据"。

## 6. 调研

| research_id/source | 调研重点 | 关键事实 | 处理状态 | 关联 D |
| --- | --- | --- | --- | --- |
| R-SKIP-1 | 无外部调研需求 | 跳过理由：本任务全部待答问题都能由仓内事实现场回答（`git`/`grep`/`wc`/`find`/`node` 可复算），外部知识无法改变方向；用户 T-005 选 A。支撑事实 = §4.1–§4.8 的全部实测，以及三次独立子代理只读复核（§4.5 C1 可删面、§4.6 官方执行通道、§4.8 基线重测） | `skipped`（有真实理由） | OI-01 / OI-06 / OI-20 / OI-21 的收敛均不依赖外部资料 |

**外部接口核实检查（talk-with-zhipeng §4.5 前置检查）**：本次涉及的外部接口 = WorkflowHub 官方执行通道。已由独立子代理核实真实调用方式并落到 §4.6（不是凭文档或记忆假设）。**通过**。

**命名唯一定义检查**：本任务后面会被多处复用的命名 = ① 四份材料的唯一落点 `specs/<task-id>/`；② `facts.jsonl` 的 `record_kind` 两类行型取值（`stage` / `close_action`）；③ `review_origin` 五态取值。三者的唯一定义源是**本任务材料 §3.9**（PRD 至多保留指针）；**取值本阶段定，build-spec 只能细化键名、不得改取值**。**通过**。

## 7. grill

> Grill = 交互式思考，**不调用 wh-review、不产生 review finding**。生命周期同为 `ask → wait → 真实回复 → resume → 重排`。
> 提问前已先核实：能从代码、文档或已确认事实得到的答案不重复问用户。

| grill_id | CONTEXT/冲突 | 结论 | ADR/四项退出 | source/evidence |
| --- | --- | --- | --- | --- |
| G-001 | 范围守卫遇到「不扩就达不到本批判据」的同类漏项：算范围内还是范围外？ | 允许**最小必要扩展**，且必须在证据里逐条登记（新增了什么、为什么必需） | 落进 §3.8 范围守卫；无需 ADR（可逆、非取舍型） | 用户本会话真实回复 |
| G-002 | C3 的历史兼容如果撞上 E-15「不做兼容桥 / 不建双写」 | 停在那批，如实记 `incomplete`；不放宽判据、不造兼容桥 | 落进 §3.8 失败语义 | 用户本会话真实回复 |
| G-003 | 是否为本次删除边界建 ADR（三条判据均成立，但与「治理面归 C7」有张力） | **建一条** ADR，只记录本任务删除边界，不碰其他治理文档 | `docs/adr/0030-mechanism-simplification-deletion-boundary.md` | 用户本会话真实回复 |

### 全需求覆盖矩阵（Grill 先建矩阵，再挑战）

| 消息类 | 覆盖轴 | 承载 OI/结论 | 覆盖状态 |
| --- | --- | --- | --- |
| `goal` | 主线是净减、净减落在 C2/C3 | OI-03 / OI-04 / OI-21 | complete |
| `flow_or_surface` | 逐批可见结果 + 停止条件 + `non_ui` | OI-14 / OI-15 / §3.8 | complete |
| `data_or_state` | `facts.jsonl` 语义与行型、历史兼容判据、状态转移 | OI-09 / OI-10 / §3.6 / §3.8 | complete |
| `success_failure_acceptance` | 三条可复算判据、基线重测、失败停在哪批 | OI-11 / OI-12 / OI-13 / §3.5 | complete |
| `constraint_non_goal_defer` | E-1 ~ E-20、零延期 + 三条交接项、范围守卫 | OI-16 / OI-17 / §3.5 / §3.8 | complete |

### Grill 四项客观退出检查

| # | 检查项 | 结果 | 事实依据 |
| --- | --- | --- | --- |
| 1 | 外部依赖接口是否已核实真实定义（非文档假设） | pass | §4.6 官方执行通道由独立子代理核实（入口、可用 action、不可用 action、outcome 前提、reflect 前提） |
| 2 | 涉及字段/路径命名是否已有唯一权威定义 | pass | §3.9 在本任务材料内定稿三个命名（材料路径、`record_kind` 两值、`review_origin` 五值） |
| 3 | 失败路径/异常语义是否明确 | pass | §3.8 状态表 + 每批停止条件 + G-002 的兜底规则 |
| 4 | 范围边界"做什么/不做什么"是否写死 | pass | §3.5 正式范围 + E-1~E-20 + §3.8 范围守卫（G-001 的最小必要扩展规则） |

### 结束记录（grill_summary）

```yaml
grill_summary:
  status: completed
  direction_changing_challenges_resolved: true
  context: { status: no-change, reason: "本任务未引入新的领域概念；record_kind / review_origin 属实现字段，CONTEXT.md 按技能边界只收领域概念、不收实现细节", file_references: [] }
  adr: { status: created, reason: "删除边界三条判据全部成立（难反转 / 无背景会意外 / 真实取舍），且已有被否决的可行替代", file_references: ["docs/adr/0030-mechanism-simplification-deletion-boundary.md"] }
  conflicts: { status: resolved, disposition: "ADR 与「治理文档正文归任务Ⅲ C7」的张力：ADR 只记录本任务删除边界，不改 CONSTITUTION.md、不替代 C7 的同步" }
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
    - 范围守卫允许「为达成本批判据所必需」的同类最小扩展，逐条登记
    - C3 历史兼容撞墙时停在那批记 incomplete，不放宽、不造兼容桥
    - 新建 ADR-0030 记录删除边界
```

### 3.9 命名唯一定义（本任务材料内的权威源）

> 依据 T-002（本任务材料为权威）与 T-009（语义本阶段定、键名留 build-spec）：下面是**取值集合与路径**的唯一定义；build-spec 只能细化键名，**不得改这些取值**。

| 命名 | 唯一权威定义 | 取值/形态 | 不得出现的形态 |
| --- | --- | --- | --- |
| 四份材料路径 | `specs/<task-id>/{decision-log,spec,plan,tasks}.md`（认证 worktree 内） | 每个正式 stage 的当前材料只在这里 | 外置追踪目录不放材料；不新增第五份材料 |
| `record_kind` | `facts.jsonl` 行型判别字段 | 恰好两值：`stage`（每个 stage 一行，含 `non_stage` 工作流一行）、`close_action`（close 五个物理动作各一行） | 第三种行型；两型混成同一行；同一 stage 两行 |
| `review_origin` | K2 行的审查来源字段 | 恰好五值：`conducted`、`unavailable`、`not_run`、`same_source_degraded`、`dispatched_uncollected` | 新增第六值；用状态机承接（E-3 已排除） |

## 8. 审查处置

### 8.1 方向审查（step 6）16 条逐条处置

> 原始事实保留在 §4.9；本节只记处置。`status` 取值 = `fixed` / `rejected_invalid` / `accepted_risk` / `needs_human`。

| finding_id | 原始事实/来源 | 后果 | status | next_action/evidence_ref | owner/consumer/retain_or_delete |
| --- | --- | --- | --- | --- | --- |
| FND-D-01 | 送审包泄漏处置与决定 ID（blocking） | 方向审查被预锚定，结论可信度下降 | fixed | 缺陷登记在 §4.9；按单轮契约不重派 provider；方法学后果一并登记 | owner=本任务主会话；consumer=本记录读者；retain |
| FND-D-02 | 无宿主 bridge ⇒ `outline_closed` 不成立，而 OI-18 让 C4 硬依赖它 | C4 的交接前置不可达 | fixed | 采纳：交接物必须**不依赖** `outline_closed` 也可读；见 §3.5 交接表与 OI-18 | owner=本任务；consumer=任务Ⅱ C4；retain |
| FND-D-03 | 基线漂移 + 四批挤在一棵 worktree，后面的改动会掩盖前面的回归 | 回归被掩盖，失败无法定位 | fixed | 采纳：**每批做完立刻跑该批判据并留证据**，不把验证推迟到四批之后；见 §3.5 正式验收口径 | owner=本任务 build-code；consumer=本任务验收；retain |
| FND-D-04 | 大纲缺端到端用户流程与入口范围 | 用户流程无法逐步对应到材料与验收 | fixed | 采纳：补每批"可见结果 + 停止条件"；由 T-020 定稿（§5 Round 3 + §3.8） | owner=本任务；consumer=用户；retain |
| FND-D-05 | 缺数据状态与失败语义 ⇒ `unavailable`/`partial` 可能被当成完成 | 完成事实可能被伪造 | fixed | 采纳：写死状态与失败语义（§3.8）—— `unavailable` 不等于完成，但不阻断同 task 修复 | owner=本任务；consumer=全部下游 stage；retain |
| FND-D-06 | C1 删除只靠仓内引用计数，仓外消费者未知，应先定政策 | 删掉仓外仍在用的工具 | accepted_risk | 用户 T-018 维持 T-006（全删 Tier B）；审查者两次点名的反对意见完整保留在 RISK-001 | owner=用户（已裁决）；consumer=任务Ⅰ C1；retain |
| FND-D-07 | 投影缺"最小有用范围"守卫，且泄漏候选处置 | 范围可被静默扩大 | fixed | 采纳：加范围守卫（同语义新发现须回到用户确认）；投影缺陷登记在 §4.9 | owner=本任务；consumer=全部批次；retain |
| FND-D-08 | 同 FND-D-02（OI-18 绑定不可达前置） | 同 FND-D-02 | fixed | 与 FND-D-02 合并处置 | owner=本任务；consumer=任务Ⅱ C4；retain |
| FND-D-09 | C0 基线写回已 close 的上游 PRD，违反不可变且与在跑分支冲突 | 跨分支合并冲突面 + 上游材料记账再失配 | accepted_risk | 用户 T-019 维持 T-007（加一行指针）；审查者反对意见完整保留在 RISK-003，并新增"仅加一行、不复制内容"的硬约束 | owner=用户（已裁决）；consumer=任务Ⅰ C0；retain |
| FND-D-10 | `identity/path-cards` 登记在 C3、执行在 C5；C3 提前删白名单会让 path check exit 1 | 守卫直接变红 | fixed | 采纳：C3 **只登记**；白名单登记与删除必须在 C5 **同一步原子完成**；见 HANDOFF-001 | owner=任务Ⅰ C3 / 任务Ⅱ C5；consumer=C5；retain |
| FND-D-11 | 只剩 2 个真无人引用叶子；Tier C schema 被目录扫描进发布清单 | 扩大删除会破坏发布与测试 | fixed | 采纳"Tier C 不删"（已由 T-006 定）；对 Tier A/B 的删除限制见 RISK-001 | owner=本任务 C1；consumer=发布契约测试；retain |
| FND-D-12 | 需求效力自相矛盾（final vs draft vs 19 组待确认；4,346 vs 4,022 行） | 需求基线不明 | fixed | 已由用户 T-002 解决；材料 §4.1 + §3.7 已登记 | owner=本任务；consumer=下游 stage；retain |
| FND-D-13 | 同 FND-D-06（5 个 Tier B CLI 工具的仓外兼容风险） | 同 FND-D-06 | accepted_risk | 与 FND-D-06 合并处置；RISK-001 | owner=用户（已裁决）；consumer=任务Ⅰ C1；retain |
| FND-D-14 | C2 的 110 处 hex 正则未按语义分类，全替换会打到合法哈希/fixture | 合并改变既有行为 | fixed | 采纳：**先按语义与消费者分类，再合并**；分类表与判据随 C2 交付；见 §3.5 C2 条 | owner=任务Ⅰ C2；consumer=验收；retain |
| FND-D-15 | `facts.jsonl` 持久契约未定 ⇒ 记录不兼容、校验不确定 | 历史记录不可读 | fixed | 采纳：本阶段定语义；**build-spec 必须冻结精确键集 + 老 reader 兼容测试**，写成硬前置（OI-10 的边界不变，T-009 仍成立） | owner=build-spec；consumer=任务Ⅰ C3；retain |
| FND-D-16 | 同 FND-D-10（C3/C5 跨任务边界 + C4 的 outline 依赖） | 同 FND-D-10 | fixed | 与 FND-D-10 / FND-D-02 合并处置 | owner=本任务；consumer=任务Ⅱ；retain |

**处置小结**：`fixed` 13 条、`accepted_risk` 3 条（FND-D-06/09/13）、`rejected_invalid` 0 条，**没有一条被放宽或删掉**。两条 `accepted_risk` 的争议点（T-006 删除尺度、T-007 上游写回）由用户在 Talk Round 3 明确维持原选择，原始审查意见保留在 §4.9 与 RISK-001 / RISK-003。

### 8.2 细节审查（step 10）

**35 条 findings（红 18 / 蓝 17，含 2 条 blocking）**的逐条处置与本阶段当场修复见 **§16**（§16.1 运行事实、§16.2 15 条当场修复、§16.3 处置判定）。
`fixed` 20 条、`accepted_risk` 6 条、`rejected_invalid` 0 条、`needs_human` 0 条。

### 8.3 方向审查（step 6 · canonical 记录）16 条处置

> 第二次方向审查经官方 `review --action=record` 路径执行并落 canonical 记录：`pair_id=09e3802c-6da0-41a2-a8a2-6cd7954bd0e4`，`semantic_status=available`，`partial=false`；red `3efe0325…`（8 条）、blue `cc6ebeb8…`（8 条）。**第一次直连 CLI 的 16 条建议（§4.9）作为独立证据保留**，两条记录不互相替代。

| finding（canonical） | 原始事实 | 处置 | status | 依据 |
| --- | --- | --- | --- | --- |
| red #4 / blue #2（**blocking**） | 无宿主 bridge ⇒ `outline_closed` 不成立，下游 C4 硬依赖它会永久阻塞 | 已在 §3.5 / OI-18 / FND-D-02 修复：交接物必须**不依赖** `outline_closed` 也可读 | fixed | §3.5 交接表 + OI-18 disposition |
| red #1 / red #3 / blue #1 / blue #4 | C1 应严格收敛到 Tier A 的 2 个文件；Tier B 有活跃测试与未知外部调用 | **用户已在 T-006 与 T-018 两次明确维持 Tier A+B**；审查反对意见完整保留在 RISK-001 | accepted_risk | T-018 + RISK-001 |
| red #6 / blue #6 | 写回已 close 的上游 PRD 违反不可变、与在跑分支冲突 | **用户已在 T-007 与 T-019 两次明确维持「加一行指针」**；反对意见保留在 RISK-003；硬约束 = 只指向、不复制 | accepted_risk | T-019 + RISK-003 |
| red #5 | `objective_facts` 掺杂决策编号与处置结论，违反盲审合同 | 已登记为装配缺陷（§4.9 FND-D-01）；canonical 第二次执行复用同一 `objective_facts`，故该缺陷对两次都成立 | fixed（登记） | §4.9 + RISK-007 |
| red #2 / blue #8 | 非目标（E-1~E-20）未随材料提交，方向无法核对排除项 | §3.5 已给出冻结点（逐条正文在 PRD L160–L183，PRD 为参考）；下游以 §3.5 为准 | fixed | §3.5 非目标条 |
| red #7 / blue #3 / blue #5 | 数据契约与行为保持应在方向阶段给出可测口径 | 已由 §16.2 的 R-4（四组字段语义 + 必填子集）、R-13（同一行恢复规则）、R-3（§3.9 为权威）修复 | fixed | §16.2 |
| red #6（跨分支 store 竞态） | C3 与 C0–C2 同分支执行，历史 store 可能被并发分支改动 | 已明确 C3 **不触碰历史 store 字节**（R-5），并由 RISK-006 要求 close 前重新核对主线 | fixed | §16.2 R-5 + RISK-006 |
| red #8 | PRD 的权威版本未绑定到唯一字节快照 | 已由 T-002 + §4.1 + §3.7 解决（本任务材料为权威；PRD 只作参考并逐条对账） | fixed | D-001 + §3.7 |
| blue #7（minor） | `identity/path-cards` 的规则登记与物理删除跨任务分离 | 已确认口径：C3 只登记并对既有 path-cards 保持只读兼容；登记与删除统一在 C5 原子完成 | fixed | HANDOFF-001 + FND-D-10 |

**小结**：`fixed` 9 条、`accepted_risk` 7 条（其中 6 条属用户已两次裁决的两组争议）、`rejected_invalid` 0 条。**没有一条被放宽或删掉**。

## 9. 决定

> 决定区按模块分组，组内按 `需求 → 事实 → 选项 → 决定 → 特征/消费者 → 验收` 链序排列。
> `approval_binding` 统一为「本任务 make-decision 最终整体确认」（step 11 的交互聚合）；各条的**来源**是 Talk 的真实答复或审查事实。

### M-需求权威与验收尺子

#### D-001

- question/final_option: 本任务以谁为需求权威？→ **以本任务四份材料为权威，任务组 PRD 只作参考**。
- recommendation/plain_language: 推荐。PRD 头部写 `final`、正文却留着「19 组修正待重新确认」的待办，还另有一处写 `draft`；它自己记的 4,022 行与实际的 4,346 行也对不上。在这种情况下把 PRD 当权威，等于把一份自相矛盾的文件当成判据。
- decision: 本任务在 make-decision 内重新决策需求边界；PRD 的版本不自洽如实登记（§4.1），不据此改写上游。
- source_type/reference/exact_excerpt: 用户真实答复 T-002 选 C；事实见 §4.1（PRD L3 / L277 / L322 三处并存）。
- approval_binding: 见 step 11 交互聚合。
- facts_and_constraints: PRD 交付事实已成立（`workflowhub-build-prd` 有 2026-09-10T08:25:41Z 的完整 close 确认）；治理边界要求「当前任务真相只在认证 worktree 的 `specs/<task-id>/` 四份材料」。
- Logic: PRD 自我记账不自洽 → 不能作权威 → 以本任务材料为权威 + 与 PRD 逐条对账（§3.7）→ 下游不会读到两套口径。
- choice_reason/impact: 影响需求基线、下游 stage 消费对象、C8 对照的读取位置。
- consequences_and_risks: 需要维护 §3.7 对账表；PRD 里出现的旧数字仍是漂移风险（§4.8）。
- rejected_alternatives: 以当前 PRD 文件为权威（会把矛盾带进实现）；先回头补确认 19 组修正（PRD 已改 5 轮以上，继续迭代正是它要治的浪费）。
- unresolved_items/owner: OPEN-002（逐条对账的执行）—— 已由 §3.7 在 make-decision 内完成初版，build-spec 冻结前复核；owner=本任务主会话。
- Supersedes: none
- module: 需求权威
- requirement_ids: [R-015, R-016]
- derived_from: []
- artifacts: [decision-log.md#3.7, decision-log.md#4.1]

#### D-002

- question/final_option: 任务Ⅰ 的主线与成功判据是什么？→ **主线 = 净减优先；成功 = 三条都能自行复算**。
- recommendation/plain_language: 推荐。你最初的诉求是「跑得顺畅、别再堆东西」，所以判据必须落在可复算的事实上，而不是"文档写完了"。
- decision: ① 具名删除清单 + 行数真变少；② 三个已知红（以本任务重测值为基线）一个都不增加；③ 历史任务仍能 `status`。
- source_type/reference/exact_excerpt: 用户真实答复 T-003 选 A、T-004 选 A。
- approval_binding: 见 step 11 交互聚合。
- facts_and_constraints: 本任务 HEAD 基线 = markdownlint 612 / path-guard 10 FAIL / verify-structure 2 FAIL（§4.8）。
- Logic: 机制臃肿 → 要可证伪的净减 → 三条判据都可当场复算 → 「只是搬家」无法蒙混过关。
- choice_reason/impact: 影响全部四批的验收与 build-code 的取证方式。
- consequences_and_risks: 任一条不达标即不能算完成；净减大头落在风险最高的 C3（见 D-005）。
- rejected_alternatives: 只以 PRD 各卡 oracle 为准（部分 oracle 是"不劣化"式软判据，容易自证通过）；以下游任务跑得顺为准（本任务无法当场验收）。
- unresolved_items/owner: 无。
- Supersedes: none
- module: 目标与验收
- requirement_ids: [R-001, R-016]
- derived_from: [D-001]
- artifacts: [decision-log.md#3.5, decision-log.md#4.8]

#### D-010

- question/final_option: 验收基线用哪一版数字？→ **一律用本任务 HEAD `89773aa` 的重测值**。
- recommendation/plain_language: 推荐。PRD 记的 markdownlint 554 已经漂到 612；沿用旧值会让"不劣化"判据失真。
- decision: 基线 = markdownlint **612** error / 35 files、path-guard **10** FAIL、verify-structure **2** FAIL；本任务四份材料 markdownlint 必须 **0 error**；新增 red 一律判失败。
- source_type/reference/exact_excerpt: PRD 裁定 F（L336–L360）+ 子代理只读重测（§4.8）。
- approval_binding: 见 step 11 交互聚合。
- facts_and_constraints: 三个计数里两个与 PRD 一致、markdownlint 漂移 +58；上游 `specs/...-20260910/decision-log.md` 自身有 82 条 error（属 C7，不在本任务范围）。
- Logic: 基线漂移 → 必须重测 → 用重测值做不劣化判据 → 本任务的改动无法躲在旧基线后面。
- choice_reason/impact: 影响每批判据与末次对照。
- consequences_and_risks: 上游材料的 82 条 error 不会因本任务消失，必须显式说明"不属本任务范围"，否则会被当成新引入的红。
- rejected_alternatives: 沿用 PRD 的 554（失真）；用 `npx markdownlint-cli2`（会拉 0.41.1，规则集不同）。
- unresolved_items/owner: 无。
- Supersedes: none
- module: 验收
- requirement_ids: [R-014]
- derived_from: [D-002]
- artifacts: [decision-log.md#4.8]

#### D-011

- question/final_option: 「净减」账怎么记？→ **允许 `unknown`，但必须写清为何算不出与下次可算的触发条件**。
- recommendation/plain_language: 推荐。算不出的就如实说算不出，但不许拿 `unknown` 当挡箭牌糊过去。
- decision: 每个 `unknown` 必须附「为何算不出 + 下次可算的触发条件」；且必须至少有一个确定性净减项（`runtime/task/task-index.mjs` −30 行）。
- source_type/reference/exact_excerpt: 用户真实答复 T-014 选 A；PRD D-013 零新产物守卫。
- approval_binding: 见 step 11 交互聚合。
- facts_and_constraints: 各卡 §18 的"预计净值"多为 `unknown`；唯一确定项 = `task-index.mjs` 整文件删除（30 行）。
- Logic: 逐段核对才能算出的文件很多 → 强行给数就会编数 → 允许 `unknown` 但强制写理由 + 至少一个确定项 → 账既诚实又非空。
- choice_reason/impact: 影响 C8 的双证对照与"净减优先"的可信度。
- consequences_and_risks: `unknown` 过多会被评"没有真净减"；缓解 = 至少一个确定项 + C2/C3 的必然下降。
- rejected_alternatives: 不允许 `unknown`（成本高且可能在 build-code 才发现算不出，反而卡住）；允许且不要求理由（正是要治的形态）。
- unresolved_items/owner: 无。
- Supersedes: none
- module: 验收
- requirement_ids: [R-005]
- derived_from: [D-002]
- artifacts: [decision-log.md#3.5]

### M-删除边界

#### D-003

- question/final_option: C1 的物理删除停在哪一档？→ **删 Tier A（2 个）+ Tier B（约 10 个）；Tier C 不删**。
- recommendation/plain_language: 这是你的选择（我原本只推荐删 Tier A）；方向审查两次反对删 Tier B。选它意味着接受"仓外可能有人在调用这些 CLI 工具、而仓内证明不了"的风险。
- decision: 删 `runtime/evidence/receipt-schema.mjs`、`journal-schema.mjs` + 5 个仅测试引用的 evidence 模块 + 5 个仅测试引用的 CLI 工具，同批改/删对应测试；Tier C（10 schema + `source-manifest.mjs`）不删；每个删除附 consumer 扫描证据。
- source_type/reference/exact_excerpt: 用户真实答复 T-006 选 B、T-018 再选 B（维持）；审查反对意见原文见 §4.9 FND-D-06 / D-11 / D-13。
- approval_binding: 见 step 11 交互聚合。
- facts_and_constraints: Tier A/B/C 的具名清单与判据见 §4.5；Tier C 经目录扫描进 Runner 发布清单（`runner-release.mjs:89`）。
- Logic: 净减优先 → 能证明无人用的尽量删 → 但发布清单与归档引用是硬边界 → 删 A+B、留 C → 净减主要靠 C2/C3（D-005）。
- choice_reason/impact: 影响仓库内容、测试文件、以及 C8 的对照基线。
- consequences_and_risks: **RISK-001**（仓外未知消费者，两次被审查点名，用户明确接受）；删除只能从 Git 历史恢复。
- rejected_alternatives: 只删 Tier A（审查者建议；净减太少）；删到 Tier C（动发布清单与归档引用）。
- unresolved_items/owner: 无（风险已 accepted_risk）。
- Supersedes: none
- module: 删除边界
- requirement_ids: [R-008]
- derived_from: [D-002]
- artifacts: [docs/adr/0030-mechanism-simplification-deletion-boundary.md]

#### D-006

- question/final_option: 死导出这一批本轮做不做？→ **做一次保守清理**。
- recommendation/plain_language: 推荐。统计方法会高估（不识别 re-export 与动态访问），所以只删"三条件同时满足"的导出。
- decision: 仅删同时满足「零引用 + 不是 re-export + 不是动态访问」的导出，逐条复核并留证据。
- source_type/reference/exact_excerpt: 用户真实答复 T-012 选 B；PRD 实测结论 (e) 明写「不得直接照单删」。
- approval_binding: 见 step 11 交互聚合。
- facts_and_constraints: `runtime/evidence/**` 实测 41 个、全仓 129 个、`stage-content-contracts.mjs` 20 个。
- Logic: 死导出占地方但统计会高估 → 三条硬条件 + 逐条复核 → 保守净减且不误删。
- choice_reason/impact: 扩大 C1 的范围（PRD 未派卡）。
- consequences_and_risks: 逐条复核有工作量；仍有误判可能（缓解 = 每条附复核证据）。
- rejected_alternatives: 本轮不做只登记（用户选 B 否掉）；照单全删（会删活代码）。
- unresolved_items/owner: 无。
- Supersedes: none
- module: 删除边界
- requirement_ids: [R-008]
- derived_from: [D-003]
- artifacts: []

### M-合并与收敛

#### D-005

- question/final_option: C1 剩不下多少可删的，净减靠什么兑现？→ **落在 C2 与 C3**。
- recommendation/plain_language: 推荐。现实就是"没那么多垃圾可清"，硬凑数字只会去删不该删的。
- decision: 净减由 C2（`STAGE_REFLECTION_REF` 5→1、`CLOSE_PLAN_REF` 2→1、stage-outcome 校验 6→1、同语义 sha 正则合并）+ C3（删 `index.json`、删 `task-index.mjs`）兑现；C1 只算"把确实没人用的清干净"。
- source_type/reference/exact_excerpt: 用户真实答复 T-008 选 A；实测见 §4.5。
- approval_binding: 见 step 11 交互聚合。
- facts_and_constraints: C1 严格档只有 2 个文件；C3 的确定性净减下限 = −30 行（`task-index.mjs`）+ `task-store.mjs` −19~−34 行。
- Logic: 可删面比预期小 → 数字目标不能靠扩删达成 → 转向合并重复定义 → 净减仍成立且不动发布面。
- choice_reason/impact: 影响 C2/C3 的优先级与验收重心。
- consequences_and_risks: 大头落在历史风险最高的 C3（RISK-002）；若 C3 撞墙，按 G-002 停在那批记 `incomplete`，净减数字会难看但如实。
- rejected_alternatives: 改口径不承诺净行数（会与"净减优先"主线冲突）；扩删到 Tier C（同 D-003 的否决理由）。
- unresolved_items/owner: 无。
- Supersedes: none
- module: 净减路径
- requirement_ids: [R-005, R-007]
- derived_from: [D-002, D-003]
- artifacts: []

#### D-007

- question/final_option: 散落的 sha 正则收敛到什么程度？→ **先按语义分类，只合并同语义的**。
- recommendation/plain_language: 推荐。110 处里很多是不同用途（文件哈希/内容哈希/ref 段），强行合并会改行为。
- decision: 先出分类表（每处：语义、消费者、能否共用），再合并同语义的；语义不同的保留并逐处写明理由；不承诺收敛到 1。
- source_type/reference/exact_excerpt: 用户真实答复 T-013 选 A；审查建议见 §4.9 FND-D-14。
- approval_binding: 见 step 11 交互聚合。
- facts_and_constraints: 实测 110 处（PRD 记 107）；`STAGE_REFLECTION_REF` 3 种不同正则的漂移已实证。
- Logic: 合并的前提是语义相同 → 先分类后合并 → 净减成立且不接受集外扩。
- choice_reason/impact: 影响 C2 的工作量与验收判据。
- consequences_and_risks: 降幅小于 PRD 想象；分类表本身是新增产出（属证据，不是新控制面）。
- rejected_alternatives: 110 处全部收敛到 1（会改行为）；只做前 3 类（放弃主要净减来源）。
- unresolved_items/owner: 无。
- Supersedes: none
- module: 去重
- requirement_ids: [R-007]
- derived_from: [D-005]
- artifacts: []

### M-数据状态与兼容

#### D-008

- question/final_option: `facts.jsonl` 的新字段定到哪一层？→ **本阶段只定语义、行型、必填子集与历史兼容判据；键名留 build-spec**。
- recommendation/plain_language: 推荐。make-decision 定"这字段是什么意思"，build-spec 定"它叫什么名字"。
- decision: 本阶段写死 ① 四组字段的语义与两类行型（`stage` / `close_action`）；② 每类必填子集；③ 历史兼容判据（历史 10 键 task-fact 行、`monitoring-fact.v1` 行、全部 `facts.jsonl` 必须仍可读）。**语义不可改，build-spec 只能细化键名**（FND-D-15）。
- source_type/reference/exact_excerpt: 用户真实答复 T-009 选 A；审查要求见 §4.9 FND-D-15。
- approval_binding: 见 step 11 交互聚合。
- facts_and_constraints: 本任务实测历史 store 有 51 个 `facts.jsonl`；`validateFact` 用精确键集相等判定，改键集即破坏历史可读性（RISK-002）。
- Logic: 历史行必须仍可读 → 键集变更必须配兼容判据 → 判据属语义（本阶段定）→ 键名属实现（build-spec 定）→ 方向层不越界也不留空白。
- choice_reason/impact: 影响 build-spec 的冻结内容与 C3 的实现边界。
- consequences_and_risks: 若 build-spec 改语义需回头重确认；RISK-002 仍是 C3 最高优先风险。
- rejected_alternatives: 现在写死键名（越界做 spec 的活）；连语义也留给 build-spec（违反用户"不要依赖 build-spec 补需求"）。
- unresolved_items/owner: build-spec 冻结精确键集 + 老 reader 兼容测试（硬前置）。
- Supersedes: none
- module: 数据状态
- requirement_ids: [R-007]
- derived_from: [D-001]
- artifacts: [decision-log.md#3.9]

#### D-015

- question/final_option: 批内发现"不扩就达不到判据"的同类漏项，以及 C3 兼容撞墙时怎么办？→ **允许最小必要扩展；兼容撞墙就停在原地如实记录**。
- recommendation/plain_language: 推荐。该扩的同类漏项允许扩但要逐条登记；不该造的兼容桥坚决不造。
- decision: ① 范围守卫允许"为达成本批判据所必需"的同类最小扩展，逐条登记（新增了什么、为什么必需）；新语义的发现视为范围外，必须回到用户确认。② C3 若发现唯一可行修法是写入型兼容路径，则停在那批、如实记 `incomplete`，不放宽判据、不造兼容桥。
- source_type/reference/exact_excerpt: 用户真实答复 G-001 选 A、G-002 选 A；审查建议见 §4.9 FND-D-07 / D-05。
- approval_binding: 见 step 11 交互聚合。
- facts_and_constraints: E-15 明令不做兼容桥、不建双写；`monitoring-fact.v1` 的只读分流是既有先例（C2 沿用其手法）。
- Logic: 范围可被静默扩大 + 失败可被伪装成通过 → 两条规则同时写死 → 既不卡死也不放水。
- choice_reason/impact: 影响全部批次的执行纪律与 C3 的收尾方式。
- consequences_and_risks: "必需"靠人判断，有滥用空间（缓解 = 逐条登记 + 批末复核）。
- rejected_alternatives: 一律停下来问用户（反复打断）；严格禁止扩展（一个同类漏项就让整批失败）；允许只读分流或回退扩键（都与用户选择冲突）。
- unresolved_items/owner: 无。
- Supersedes: none
- module: 数据状态与失败边界
- requirement_ids: [R-006, R-007]
- derived_from: [D-008]
- artifacts: [decision-log.md#3.8]

### M-流程、失败与非目标

#### D-009

- question/final_option: 四批怎么走、失败停在哪、你什么时候能看到东西？→ **逐批做、每批立刻验证、停在那批如实记录；每批一个可见结果**。
- recommendation/plain_language: 推荐。四批是串行依赖，跳过任何一批都会让后面的批次变成不可验证。
- decision: 顺序 C0→C1→C2→C3 不可跳；**每批做完立刻跑该批自己的判据并留证据**（不在四批后统一跑）；任一批不达标即停在那批、不放宽、不假装后面完成、不回退已过批次；每批的可见结果与停止条件见 §3.8。
- source_type/reference/exact_excerpt: 用户真实答复 T-010 选 A、T-020 选 A；审查建议见 §4.9 FND-D-03 / D-04。
- approval_binding: 见 step 11 交互聚合。
- facts_and_constraints: 四批有严格串行依赖（C2/C3 同文件必须串行）。
- Logic: 串行依赖 + 基线漂移 → 延后统一验证会掩盖回归 → 每批立刻验证 + 停在那批 → 失败可定位、完成事实不伪造。
- choice_reason/impact: 影响 build-code 的执行节奏与证据形态。
- consequences_and_risks: 任务可能停在中间批次，"四批全做"的交付组定义届时需要你决定接受还是拆任务。
- rejected_alternatives: 跳过卡住的批次（后面也不可验证）；卡住的批次降级为登记项（跨任务交接无强制机制）；加逐批人工确认点（与少门禁冲突）；只在最后看一次（掩盖回归）。
- unresolved_items/owner: 无。
- Supersedes: none
- module: 流程与失败
- requirement_ids: [R-001, R-009]
- derived_from: [D-002]
- artifacts: [decision-log.md#3.8]

#### D-012

- question/final_option: 非目标与延期怎么算？→ **E-1~E-20 原样沿用；三处后置登记为交接项，任务Ⅰ 零延期**。
- recommendation/plain_language: 推荐。后置的东西有人认领、有触发条件就算交接，不算延期；不欠账也不假装。
- decision: 非目标原样沿用；HANDOFF-001/002/003 三条交接项各带 owner、触发条件、消费者、关闭条件；**本任务不产出任何延期项**。
- source_type/reference/exact_excerpt: 用户真实答复 T-011 选 A；PRD E-13「不得出现任务级延期」。
- approval_binding: 见 step 11 交互聚合。
- facts_and_constraints: 三处后置 = `identity/path-cards`（归 C5）、T-11 跨仓缺陷（归 C4/3rd-review）、宿主 worktree 增殖（E-20，宿主行为）。
- Logic: 有真实后置 → 但"延期"与"交接"不同 → 登记为带条件的交接项 → 零延期且不丢账。
- choice_reason/impact: 影响任务Ⅱ/Ⅲ 的输入与 C8 的完整性判断。
- consequences_and_risks: 界线靠材料纪律维持，没有机器拦。
- rejected_alternatives: 登记为延期项（与 E-13 冲突）；留在本任务做完（越过 C5 职责边界）。
- unresolved_items/owner: 三条交接项的关闭条件由任务Ⅱ/Ⅲ 各自触发。
- Supersedes: none
- module: 边界与交接
- requirement_ids: [R-013]
- derived_from: [D-001]
- artifacts: [decision-log.md#3.5]

#### D-016

- question/final_option: 是否为删除边界建 ADR？→ **建一条**。
- recommendation/plain_language: 推荐。理由值得留档：为什么只删 2+10 个、为什么 10 个 schema 明明没人用却不删。
- decision: 新建 `docs/adr/0030-mechanism-simplification-deletion-boundary.md`，只记录本任务删除边界；不改 `CONSTITUTION.md`、不替代任务Ⅲ C7 的治理同步。
- source_type/reference/exact_excerpt: 用户真实答复 G-003 选 A。
- approval_binding: 见 step 11 交互聚合。
- facts_and_constraints: ADR 三条判据全部成立（难反转 / 无背景会意外 / 真实取舍）。
- Logic: 判据成立 → 建 ADR → 理由有永久落点；同时用"只记录本任务"限定边界。
- choice_reason/impact: 新增 1 个文档文件（属交付物，非控制面）。
- consequences_and_risks: 与"治理面只改必须同步的登记"有轻微张力，已在 ADR 内写明限定。
- rejected_alternatives: 只写在本任务材料里（归档后可发现性下降）；交任务Ⅲ C7 补（跨任务传递易丢）。
- unresolved_items/owner: 无。
- Supersedes: none
- module: 交付与留档
- requirement_ids: [R-004]
- derived_from: [D-003]
- artifacts: [docs/adr/0030-mechanism-simplification-deletion-boundary.md]

### M-跨任务与治理边界

#### D-004

- question/final_option: C0 的口径表写到哪里？→ **本任务材料为权威；上游 PRD 只加一行指针**。
- recommendation/plain_language: 这是你的选择（我原本推荐"PRD 一字不动"）；方向审查也明确反对写回上游。选它意味着接受一个跨分支冲突面，所以我把形态压到最小：**只加一行、不复制内容**。
- decision: 口径表落在本任务材料（§3.6 + 后续 spec）；上游 `specs/workflowhub-mechanism-simplification-20260910/prd.md` 的共享定义节只加**一行指针**指向本任务材料；指针行不含任何表内容。
- source_type/reference/exact_excerpt: 用户真实答复 T-007 选 C、T-019 再选 B（维持）；审查反对意见原文见 §4.9 FND-D-09。
- approval_binding: 见 step 11 交互聚合。
- facts_and_constraints: 上游 PRD 已 close 并合并 main；另一任务分支 `workflowhub-build-prd-workflow-hardening-20260911` 同时活跃（§4.3）。
- Logic: 需求权威在本任务材料 → 表必须落在这里 → 但读者可能只翻 PRD → 留一行指针 → 可发现性与权威性兼顾，代价是最小化后的双写。
- choice_reason/impact: 影响 C0 的落点、main 上的上游文件、以及未来读者的可发现性。
- consequences_and_risks: **RISK-003**（双写形态 + 跨分支冲突面，用户明确接受）；指针行必须保持"只指向"。
- rejected_alternatives: PRD 一字不动（审查者建议；用户选 B 否掉）；把表复制进 PRD（重复权威）。
- unresolved_items/owner: 无（风险已 accepted_risk）。
- Supersedes: none
- module: 需求权威落点
- requirement_ids: [R-007, R-015]
- derived_from: [D-001]
- artifacts: [decision-log.md#3.6]

#### D-013

- question/final_option: 治理文档本轮改哪些？→ **只改必须同步的登记**。
- recommendation/plain_language: 推荐。本任务碰治理文档正文，会提前做掉任务Ⅲ C7 的活，还可能两边改同一句。
- decision: 只改 ① `tools/cli/check-task-record-paths.mjs` 授权表；② 因删除而**必须**同步的 `docs/architecture/move-map.json` / `deletion-plan.json` 登记（不改会让 `repository-governance` 测试变红）。`AGENTS.md` / `CONTEXT.md` / `CONSTITUTION.md` / `docs/standard-workflow.md` 正文归任务Ⅲ C7。
- source_type/reference/exact_excerpt: 用户真实答复 T-017 选 A；PRD 任务地图（C7 = 治理同步）。
- approval_binding: 见 step 11 交互聚合。
- facts_and_constraints: `tools/cli/check-task-record-paths.mjs` 有 2 条失效登记与 2 条重复项需清理（§4.5）。
- Logic: 治理同步有独立 owner → 本任务只做"不改就红"的最小同步 → 职责清楚。
- choice_reason/impact: 影响本任务的 diff 面与任务Ⅲ 的输入。
- consequences_and_risks: 本任务结束后短暂存在"文档与代码不一致"窗口，需在交接里写明。
- rejected_alternatives: 相关句子一并改（提前做 C7 的活）；治理面完全不动（会让测试变红，违反不劣化判据）。
- unresolved_items/owner: 文档一致性窗口的关闭由任务Ⅲ C7 负责。
- Supersedes: none
- module: 治理边界
- requirement_ids: [R-004]
- derived_from: [D-001]
- artifacts: []

#### D-014

- question/final_option: 与任务Ⅱ/Ⅲ 的跨任务交接留什么？→ **材料里的具名交接项 + 一行可被下游读到的事实**。
- recommendation/plain_language: 推荐。交接要能核，但不能为此造新机制。
- decision: 三条交接项写进 §3.5（各带 owner / 触发 / 消费者 / 关闭条件）；C3 完成时在**现有** `facts.jsonl` 行里留一行可被 C5 读到的具名事实；**不新增对象、不新增机制**。交接物**不得依赖** `outline_closed`（本任务无宿主 bridge，见 §4.6）。
- source_type/reference/exact_excerpt: 用户真实答复 T-016 选 A；审查建议见 §4.9 FND-D-02 / D-10 / D-16。
- approval_binding: 见 step 11 交互聚合。
- facts_and_constraints: 无宿主 bridge ⇒ 正式 stage outcome 预计 `unavailable`；`identity/path-cards` 的白名单登记与删除必须原子完成（否则 path check exit 1）。
- Logic: 交接不能靠人记得 → 留可读事实 → 但不能造新机制 → 复用现有 K2 行 → 交接可核且零新增控制面。
- choice_reason/impact: 影响任务Ⅱ C4/C5 的开工前置。
- consequences_and_risks: 复用 K2 行的写法必须严格（写成新对象就违反 E-10 / E-15）。
- rejected_alternatives: 只写在材料里（下游不一定读）；不留交接物（靠人记得）。
- unresolved_items/owner: 无。
- Supersedes: none
- module: 跨任务交接
- requirement_ids: [R-006]
- derived_from: [D-012]
- artifacts: [decision-log.md#3.5]

## 10. 最终确认

- 状态：**accepted**
- 用户原文：**「接受，继续吧」**（前置动作：用户要求「对比一下原始 prd 相关的决策，告诉我有什么差别？为什么有差别？哪一个的决策更合适？」；主会话给出 12 个决策点的逐条对比与 4 类根因，其中如实指出 ③ C1 删除尺度与 ② C0 写回两处**是用户的选择而非审查建议**、⑨ 死导出清理是**本任务新增范围**、以及**预期净减会低于 PRD 设想**；用户在看过之后确认接受）
- host-visible 绑定：`quality/confirmations/` 下的 `human-confirmation.v3`（`decision=accepted`、`step_slug=approve-decision`、`confirmed_at=2026-09-11T12:12:05.683Z`）；`material_revision=revision-5c6c4b1a…`；`snapshot_tree=ba20dc3523d83b4ef492b1a3adcb8f20b7e13abc`
- 质量事实：`quality/facts/0ea8bcb7…json`
- 交互聚合：落在 task store 的 `quality/evidence/interactions/`，schema `workflowhub-interaction-aggregate.v1`，`round_count=3`。**其 `decision_ref` 指向本文件、`decision_hash` 绑定本文件的最终字节**；文件名即该聚合字节的 sha256。
- 确认绑定的材料：`specs/workflowhub-mechanism-simplification-t1-20260911/decision-log.md`
- **自指说明（如实登记，与同仓先例一致）**：本文件既是聚合绑定的对象，又是记录该绑定的载体。把聚合的 `ref` 或本文件的 `sha256` **内联进本文件**会立刻改变本文件字节，使刚写入的绑定失效（实测：先在 §10 写了聚合 ref 与材料哈希，随后写 §16/§17 即让聚合绑定失效，`run --action=execute` 报 `interaction aggregate does not bind the current task and decision`）。因此本节**只记落点与绑定关系，不内联任何哈希**；真实哈希由确认凭证的 `material_revision` 与聚合文件的 `decision_hash` 各自记录。
- **确认后的材料变化（如实登记）**：用户确认的是含 §16 的那一版（`material_revision=revision-5c6c4b1a…`）；其后只追加了两节**管理性内容** —— §10（本次确认自身的记录）与 §17（stage-end `spec-analyze` 的六段摘要）。**两节都不含任何 OI 终态、决定或验收口径的改动**；交互聚合随后按最终字节重建并绑定。
- 未确认内容：无（21 条 OI 全部收敛并包含在本次确认内）

## 11. 拒绝方案

| 选项 | 拒绝理由 | 关联 D |
| --- | --- | --- |
| 照 PRD 字面把 C0 口径表**复制**进上游 PRD（T-007 选项 B 的完整形态） | 与 D-001「PRD 只当参考」冲突，且会再次打乱上游材料的自我记账 | D-004 |
| 删 Tier C（10 schema + `source-manifest.mjs`）（T-006 选项 C） | 会动归档 specs 引用与 Runner 发布清单，超出「删叶子」范围 | D-003 |
| 只删 Tier A 那 2 个文件（异源方向审查的建议） | 会让 Tier B 那批零生产引用的对象继续占位，与「净减优先」主线冲突 | D-003 |
| 照单全删死导出（T-012 选项 C） | PRD 自己实测写明该方法会高估、不得照单删 | D-006 |
| 把 110 处 sha 正则全部收敛到 1（T-013 选项 B） | 不同模块的 sha 校验语义不同，强合并会改变行为 | D-007 |
| 跳过卡住的批次继续后面（T-010 选项 B） | 四批是串行依赖，跳过会让后面的批次也不可验证 | D-009 |
| 卡住的批次降级为「只登记不执行」（T-010 选项 C） | 跨任务交接没有强制机制，容易变成没人做 | D-009 |
| 现在就把 `facts.jsonl` 键名写死（T-009 选项 B） | 越界做了 spec 的活，回头改要重新确认 | D-008 |
| C3 兼容撞墙时允许写入型兼容路径（G-002 选项 B/C） | 与 E-15「不做兼容桥、不建双写」正面冲突 | D-015 |
| 允许只读分流以外的回退扩键方案（G-002 选项 C） | 与 K2 行设计偏离，需要重新与 PRD 对账 | D-015 |
| 把三条后置登记为**延期项**（T-011 选项 B） | 与 PRD E-13「不得出现任务级延期」冲突 | D-012 |
| 本任务顺手做完 `identity/path-cards` 删除（T-011 选项 C） | 越过任务Ⅱ C5 的职责边界 | D-012 |
| 提前做任务Ⅲ C7 的治理文档正文同步（T-017 选项 B） | 会让本任务与任务Ⅲ 改到同一句而冲突 | D-013 |

## 12. 风险与延期交接

| risk/deferred_id | 风险或延期内容 | 触发/后果 | 处理阶段/owner |
| --- | --- | --- | --- |
| RISK-001 | Tier B 的 5 个 CLI 工具可能存在**仓库外**按路径调用的消费者（仓内扫描无法证明）。**异源方向审查两次点名此风险（FND-D-06 / FND-D-13），用户在 Talk Round 3 明确维持原选择** | 若存在，删除会断掉仓外调用；status = **accepted_risk（用户明确接受）**；恢复只能靠 Git 历史 | 任务Ⅰ C1；证据 §4.5 UNKNOWN + §4.9 |
| RISK-002 | C3 改 `facts.jsonl` 字段表会让已落盘历史行不可读（历史恰 10 键、`validateFact` 用精确键集相等判定） | 历史 provenance 抛 `unsupported fields`；**唯一可行修法若是写入型兼容路径，按 D-015 停在那批记 `incomplete`** | 任务Ⅰ C3（最高优先风险） |
| RISK-003 | 上游 PRD 的一行指针属**双写**形态。**异源方向审查明确反对（FND-D-09），用户在 Talk Round 3 维持原选择** | 跨分支合并冲突面 + 上游材料记账再失配；status = **accepted_risk（用户明确接受）**；硬约束 = 指针行只指向、不复制内容 | 任务Ⅰ C0；关闭条件 = 指针行不含表内容 |
| RISK-004 | C2 合并 `STAGE_REFLECTION_REF` 等常量时必须取「与生产者真实输出相符的最小接受集」 | 取 5 个旧版的交集 = 空集，会让所有 ref 非法 | 任务Ⅰ C2；目标正则已由 PRD 裁定 J-8 定稿 |
| RISK-005 | 无外部宿主 bridge ⇒ 正式 stage outcome 预计 `unavailable` | 阶段完成事实只能如实记 `unavailable`，不得伪造成通过；交接物不得依赖 `outline_closed` | 本任务全阶段 + 任务Ⅱ C4 消费 |
| RISK-006 | 主仓主线在本任务进行中可能前进（另一任务在跑，§4.3） | close 前必须重新核对基线，否则合并判据失真 | 任务Ⅰ close 前 |
| RISK-007 | **送审包污染**：方向审查的 `objective_facts` 带进了处置与决定 ID（blocking FND-D-01） | 本轮方向审查被预锚定 ⇒ **它的"未发现某类问题"不能当作该类问题不存在**；按单轮契约不重派 provider | 本任务主会话；证据 §4.9 |

### 质量边界

- 质量事实：方向审查 1 次已完成（`available`，16 条 findings，4/4 provider 完成）；细节审查待 step 10
- 推进资格：不适用（质量事实不是推进许可）
- 完成判据：Talk 三轮收敛 + 两个审查事实 + 用户真实确认 + 交互聚合
- 不可逆授权边界：本阶段不做任何不可逆动作（无 commit、无 merge、无删除）

## 13. 未决项

| item_id | 未决内容 | 原因 | 谁在何时解决 |
| --- | --- | --- | --- |
| OPEN-001 | ~~Round 3 与 Grill 的剩余争议~~ **已关闭** | T-018 / T-019 / T-020 与 G-001 / G-002 / G-003 全部收到真实回复 | 已解决 |
| OPEN-002 | PRD 任务Ⅰ 卡与本任务决策的逐条对账 | 用户 T-002 选「PRD 只当参考」，若不显式对账，「参考」会在实现期变成事实权威 | **初版已在 §3.7 完成**；build-spec 冻结前复核 |
| OPEN-003 | 无外部宿主 bridge 时的正式 stage outcome | 本会话无宿主 bridge（§4.6） | 阶段末如实登记；不伪造通过 |
| OPEN-004 | build-spec 必须冻结 `facts.jsonl` 的精确键集 + 老 reader 兼容测试 | D-008 只定语义，键名留给 build-spec；审查要求"实现前冻结"（FND-D-15） | build-spec 阶段；未冻结则 C3 不得开工 |

## 14. Supersedes

无（本任务首版 decision-log）。

## 15. 文档结果

- CONTEXT.md：**no-change**。理由 = 本任务未引入新的领域概念；`record_kind` / `review_origin` 属实现字段，而 `CONTEXT.md` 按其技能边界只收领域专家会用的概念、不收实现细节。文件引用：无（未改动）。
- ADR：**created**。理由 = 删除边界的三条判据全部成立（难反转 / 无背景会意外 / 真实取舍），且已有被否决的可行替代。文件引用：`docs/adr/0030-mechanism-simplification-deletion-boundary.md`。
- ADR criteria：hard to reverse = **真**（文件删除后只能从 Git 历史恢复）；surprising without context = **真**（PRD 说删一批，实际只删 2+10，且 10 个 schema 明明零代码引用却不删）；genuine trade-off = **真**（删多 vs 发布面与仓外风险，替代方案被具体理由否决）。
- 术语/ADR 冲突及处理：**有冲突且已处理** —— ADR 落在 `docs/adr/`，与用户 T-017「治理文档正文归任务Ⅲ C7」存在张力；处理 = ADR 内写明「只记录本任务删除边界，不改 `CONSTITUTION.md`、不替代 C7 的同步」。
- 不复制 spec 的边界：本文件只记方向、事实索引、决定链与边界；页面、接口、任务与测试细节留给 spec/plan/tasks。

### Exit checks

- 上下文一致：**pass**。§1 原始需求的每一句都能追到 T-00x / D-0xx（§1.1 索引 + §5 三轮 Talk + §9 决定链）；六类固定类别与六个框架节点均有 OI 覆盖（§2.0）。
- owner/接口一致：**pass**。三条交接项各带 owner / 触发 / 消费者 / 关闭条件（§3.5）；`facts.jsonl` 与 `index.json` 的 owner/consumer 已在 §3.5 C3 条写清。
- 失败语义明确：**pass**。§3.8 给出四种状态的语义与"是否等于完成"，并写死恢复规则（不放宽、不伪造、不建替代记录）。
- 范围与延期明确：**pass**。§3.5 正式范围四项 + E-1~E-20 非目标 + 零延期与三条交接项；§3.8 范围守卫给出扩展判据。

## UI applicability

三输入按证据合并（不是按 caller 标签）：

```json
{
  "result": "non_ui",
  "sources": {
    "raw_requirement": { "result": "non_ui", "description": "用户原话只要求按标准五阶段做任务Ⅰ，并共同梳理用户流程与边界；未提出任何页面、交互或视觉诉求" },
    "project_inventory": { "result": "non_ui", "description": "本仓是命令行与运行时项目：runtime／tools／core／skills／workflows 由 Markdown、JSON、YAML 与 .mjs 组成；无界面框架、无路由表、无可视化部件" },
    "planned_or_changed_frontend_fact": { "result": "non_ui", "description": "任务Ⅰ 计划改动面为 runtime/**、tools/cli/**、tests/**、docs/adr/** 与 specs/**（Markdown 材料）；C3 会改 status 的读数形状，但那是命令行文本行，不是页面或视觉规格" }
  },
  "recompute_trigger": "任一批次引入需要人看的界面改动（交互稿、页面、视觉规格）时必须重算本事实"
}
```

## 16. 细节审查（step 10）事实与逐条处置

### 16.1 运行事实

| 项 | 实测值 |
| --- | --- |
| 入口 | `node tools/cli/stage-runtime.mjs review --action=record --stage=make-decision --input=<request>`（**正确路径**：由运行时执行并落 canonical 记录） |
| 材料键 | direction = `raw_requirement` + `objective_facts` + `convergence_outline`（结构化投影）；detail = `raw_requirement` + `approved_direction` + `draft_spec_or_acceptance` |
| 失败事实（如实登记，不改写成通过） | 前 3 次调用被契约拒绝并留下 canonical attempt：`MATERIAL_FORBIDDEN: material decision is not allowed`（2 条）、`MATERIAL_FORBIDDEN: material approved_direction is not allowed`（2 条）；另 1 次因与 detail 审查并发抢存储锁失败（`withRecordLock`，EXIT=1）。**这些 attempt 原件只读保留** |
| detail（成功） | `semantic_status=available`、`partial=false`、`pair_id=adc64b28-31c5-4fc4-bf04-4d99a396f3ed`；red `748e286b…`（18 条 findings）、blue `2751878e…`（17 条 findings）；provider = `antigravity/flash` / `codex/luna` / `pi/v4flash` |
| **产出** | **35 条 findings（红 18 + 蓝 17）**，其中 **blocking 2** |

### 16.2 本阶段当场修复（本节文字即修正后的权威口径）

| # | 缺陷 | 当场修复 |
| --- | --- | --- |
| R-1 | **`## UI applicability` 小节缺失**（红/蓝各 1 条点名） | 已在本文件补出该小节（三输入 + 合并判据 + 重算触发）；§3.5「页面范围」与 OI-15 的指针现在可解析 |
| R-2 | **§8.1 处置小结计数与表不符**（红/蓝各 1 条） | 实为 **`fixed` 13 条、`accepted_risk` 3 条**（原写 12 条，已更正）；合计 16 条 |
| R-3 | **§6 命名口径与 §3.9 / D-001 冲突**（红 #8、蓝 #11） | §6 该句改为：三个命名的唯一定义源是**本任务材料 §3.9**（PRD 至多保留指针）；**取值本阶段定，build-spec 只能细化键名** |
| R-4 | **D-008 承诺写死四组字段语义与必填子集，正文却没有**（红 #3/#15、蓝 #16/#17） | 补进 §3.9：**四组字段语义 = ① 身份组**（任务/阶段/行型判定）；**② 材料组**（当前材料与快照的身份）；**③ 质量事实组**（审查五态 + 审查结果 ref + 可执行 finding 处置）；**④ 证据组**（真实跑过的命令 + 退出码 + 失败签名 + 四层状态 + 严重问题处置）。`record_kind:"stage"` 必填 ①③④；`record_kind:"close_action"` 必填 ① + 动作名 + 结果 + 具名 ref + 命令与退出码（不适用写 `null` + 理由）。**键名由 build-spec 映射，语义不得改** |
| R-5 | **C3 的 `stage-outcomes` 迁移与非目标 E-15 冲突**（红 #9 blocking、蓝 #3 blocking、红 #18、蓝 #4） | 明确边界：**迁移只作用于运行时写入路径** —— C3 之后不再产生新的 `stage-outcomes/<stage>/*.json`，status/acceptance 所需输入改写进 K2 行；**历史 store 里的 30 个 `stage-outcomes` 目录及其字节一律不动、不迁、不删**（E-15 优先）。「先迁移再删」的「迁移」= 消费者读取改道，不是移动历史文件；失败按 §3.8 停批记 `incomplete` |
| R-6 | **C2 的「CI 授权表按职责重组」与 D-013 冲突**（红 #10、蓝 #2） | 移出本任务范围：C2 只做 4 类**同语义重复定义**的合并 + sha 正则的语义分类；`check-task-record-paths.mjs` 只做 C1 已定的 2 条失效登记 + 2 条重复项清理。**按职责重组整张表归 C7** |
| R-7 | **`task-store.mjs −19~−34` 被写成"确定性净减下限"**（蓝 #13） | 对齐 D-011：**唯一确定性净减项 = `runtime/task/task-index.mjs` 整文件删除（−30 行）**；`task-store.mjs` 的区间属**估算**，按 T-014 计入 `unknown`，须在 C3 实测后回填 |
| R-8 | **M3 分子分母不完整、基线口径混用**（红 #2、蓝 #12） | 拆成两个指标：**M3a 每任务记录文件数** = `find <store>/<task> -maxdepth 1 -type f \| wc -l`（分母 `1`）；**M3b 无 reader 对象比例** = 具名 consumer 扫描判为"零生产 reader"的对象数 ÷ 同批扫描对象总数。基线分两个口径写且**不得混用**：① 当前任务；② 历史 store 全体（`facts.jsonl` 51 / `index.json` 51 / `task.json` 118 / `stage-outcomes` 目录 30） |
| R-9 | **M5 的两条命令数的是"命中行"而非"出现次数"**（蓝 #5） | §3.6 M5 分表加口径注：第 3/4 项是**每行至多计一次**的近似口径；若需精确站点数，改用 `grep -o` 计数并在 C0 写死其一，**两个口径不得混用** |
| R-10 | **C0 的 `unknown` 项缺"下次可算的触发条件/owner/命令"**（蓝 #15） | 补齐：**M1** 触发 = 历史 store 出现「正式测试累计秒」或「broker review 墙钟」字段（owner=任务Ⅲ 度量处置）；**M2** 触发 = 8 类阻塞分类学出现首条真实登记（owner=本任务 build-code，命令 = 阻塞登记行 `grep -c`）；**token** 触发 = 历史数据出现 token 分层字段（owner=用户决定是否引入仪器，本任务不引入） |
| R-11 | **C1 验收只卡 `FAIL > 10`，可能跳过 4 条具名登记清理**（红 #13、蓝 #7） | 补断言：C1 完成必须附**四条具名登记各自消失**的直接证据（`scripts/ci` L30、`tests/fixtures/task-path-legacy-input.json` L36、`core/__tests__/runtime-mode.test.mjs` 重复项、`skills/wh-review/scripts/__tests__/review-runner.test.mjs` 重复项）与交付后条目数实测值；仅"FAIL 不增加"**不构成** C1 完成 |
| R-12 | **各批缺可执行的针对性测试命令**（红 #1/#11、蓝 #7） | 补进 §3.8：C0 = `node -e` 断言（零新增文件，不跑 vitest）；C1 = `npx vitest run tests/task-record-paths-check.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`；C2 = `npx vitest run tests/stage-plan-task-contract.test.mjs tests/contract/stage-reflection-paths.test.mjs tests/contract/derive-consumption-edges.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`；C3 = 按 PRD C3 §17 的 16 个文件清单执行。**禁止全量 `vitest` / `npm test` / `test:safe`** |
| R-13 | **`facts.jsonl` 恢复/重试与跨任务交接模型无法闭合**（红 #14、蓝 #17） | 写死规则：**同一 stage 只允许一行**；`unavailable`/`incomplete`/`partial` 之后的同 task 修复是**更新该 stage 已有的那一行**（同一写者、同一 `record_kind:"stage"`），**不追加第二行**；给 C5 的交接事实**写在同一行**的 `handoff` 语义字段，**不新增行、不新增对象**。读者规则：`status` / close / 下一 stage 只读当前行的最新值 |
| R-14 | **D-015 的「只读分流」口径自相矛盾**（蓝 #6） | 统一：**C3 撞上 RISK-002 时，允许且仅允许"只读形状分流"**（读取侧按行形状判定，**不新增任何写入路径**）；**禁止**任何写入型兼容路径或双写（写入型兼容 = 立即停批记 `incomplete`）。§11 被拒选项仅指"写入型兼容路径"与"回退扩键方案"，**不含只读分流**；C2 沿用 `monitoring-fact.v1` 的只读分流是同一原则的既有先例 |
| R-15 | **C3 验收的"一个记录文件"与历史目录豁免未写清**（红 #16） | 写死：**"任务目录只剩一个执行记录文件"适用于本任务之后新建的任务目录**；51 个历史任务目录保持原样（`index.json` 不删、不改），历史兼容判据只要求"仍可 `status`"。命令口径：`grep -rn 'index\.json' --include=*.mjs core runtime tools skills workflows \| grep -v node_modules` 期望 **0 生产命中**（字面 `index.json`；`diff-index.json` 等复合名不计入）  当前验收集合由§18替代为50个其他任务；本行51保留为当时表述。 |

### 16.3 处置判定（35 条）

| 处置 | 条数 | 说明 |
| --- | --- | --- |
| `fixed` | 20 | 红 #1/#2/#3/#5/#7/#8/#9/#10/#11/#13/#14/#15/#16 与蓝 #2/#3/#4/#5/#6/#7/#8/#11/#12/#13/#15/#16/#17 中的对应项，全部按 §16.2 修复 |
| `accepted_risk` | 6 | 红 #4、蓝 #1、蓝 #9（`approved_direction` 送审形态 + "最终确认尚未发生"）：detail 合同要求 `approved_direction` 与 decision-log 逐字匹配，而最终确认在 step 11 才产生 —— 本次经官方 route 提交且 route 已接受；**下一 stage（build-spec）必须提交与当时 decision-log 逐字匹配的完整字节**。蓝 #10（方向审查被预锚定）：登记在 §4.9 + RISK-007，其阴性结论不作证据 |
| `needs_human` | 0 | — |
| `rejected_invalid` | 0 | — |
| 与上表同源或被同一条修复覆盖 | 9 | 例如红 #12 的 C2 接受集断言并入 R-12 与 C2 的负例集 |

**处置小结**：**没有一条被放宽或删掉**；2 条 blocking 全部在 §16.2 用明确口径修复（R-5 的 C3 迁移边界、R-14 的只读分流边界）。

## 17. stage-end spec-analyze（step 12）

> profile = `make-decision`（原始需求 + `decision-log.md` + 认证需求投影 + 完整 Grill/审查事实 + 交互聚合 + 最终确认 + 本阶段全部证据）。
> 结果：**`consistent`**（无 finding 需修复）。以下是六段大白话摘要，逐段由当前事实生成。

1. **当前阶段做了什么**（`stage_work`）：建了 worktree 与任务身份；建唯一 OI 大纲（21 条，v1）并全部收敛；跑了三轮真实 Talk（T-001~T-020，共 20 条真实答复）；跳过外部调研并写明理由；过了 Grill（3 问 + 覆盖矩阵 + 四项退出检查全 pass + `grill_summary`）；跑了 **2 个审查 track**（direction / detail，均为 `available` 非 partial，合计 51 条 findings 逐条处置）；写了决定链 16 条（D-001~D-016）；建了 ADR-0030；拿到用户真实确认并落成交互聚合。
2. **原始需求覆盖到什么程度**（`requirement_coverage`）：§1 的每一句都能追到 OI → 答复 → 决定（§1.1 索引 + §5 + §9）；六个框架节点与六类固定类别均有 OI 覆盖（§2.0）；`Total Requirements = 16`（R-001~R-016），`Coverage = 100%`；`Ambiguity Count = 0`（Round 2/3 与 Grill 全部收敛，无 `open` 残留）。
3. **与上游产物、实际语义和证据是否一致**（`upstream_alignment`）：与上游 PRD 的 13 条逐条对账在 §3.7（一致 6 / 细化 3 / 偏离 1 / 子集 1 / 超集 1 / 范围说明 1），每处偏离与超集都写明原因与风险；所有实测数字都标注了口径与复算命令（§4.8 / §3.6）；没有把任何 `unknown` 写成通过。
4. **当前阶段当场修复了什么**（`current_stage_repairs`）：方向审查 16 条 → `fixed` 9 / `accepted_risk` 7（其中 6 条是用户已两次裁决的两组争议）；细节审查 35 条 → `fixed` 20 / `accepted_risk` 6；**2 条 blocking 全部修复**；另修 3 处材料自缺陷（缺失的 `## UI applicability`、§8.1 计数、§6 与 §3.9 的口径冲突）。
5. **剩余风险、未决和延期**（`remaining_risks`）：RISK-001（Tier B 仓外未知消费者，用户接受）、RISK-002（C3 历史兼容，最高优先）、RISK-003（上游指针属双写，用户接受）、RISK-004~007；OPEN-002/003/004；**延期项 = 零**（三处后置为交接项 HANDOFF-001~003，各带 owner/触发/消费者/关闭条件）。
6. **下游可以直接消费什么、不能自行猜什么**（`next_stage_boundary`）：可直接消费 = 本文件的 OI 终态、§3.5 范围与验收口径、§3.6 口径定义、§3.8 流程与失败语义、§3.9 命名、§9 决定链、§16.2 的 15 条当场修复；**不能自行猜** = `facts.jsonl` 的精确键名（OPEN-004：build-spec 必须冻结键集 + 老 reader 兼容测试）、E-1~E-20 的逐条正文（在 PRD L160–L183，本任务只给冻结点）、以及任何被审查点名但用户已接受的争议项（RISK-001/003，不得改写成"审查通过"）。

## 18. build-plan 期间的历史验收集合澄清

当前用户真实答复：“采用，继续吧”。答复对应的问题是：是否采用“50 个其他任务验证历史只读兼容，本任务单独验证新写入与状态读取”的口径。

据此，后续 C0/C3 的历史只读验收集合固定为本次现场枚举中排除当前任务后的 50 个目录；当前任务不加入历史字节不变集合，按新 writer 到真实 reader/status 的既定路径单独验证。当前四材料据此细化，§3.6、§16.2 中的历史测量值（facts.jsonl 51、index.json 51 等）作为原测量事实保留，不改写成 50。旧审查与旧阶段 outcome 原件不改写。

原枚举与真实答复证据：`quality/evidence/build-plan/historical-selection-research-001.json`、`quality/evidence/build-plan/historical-selection-clarification-001.json`。本节只澄清只读验收集合；实现测试及本次最终计划验收仍需真实执行和答复。

### 18.1 唯一归档目录的既有身份错误例外

继续核查50个目录后，用户对“50个目录都保留字节保护、49个有效任务status零抛错、1个归档目录保留明确身份错误并验证只读解析”的问题真实回复：“采用既有错误例外（推荐）”。

该例外只适用于 `_discarded-m16-experience-loop-repair`：其manifest task_id为 `m16-experience-loop-repair`，原身份派生目录不存在，现有TaskHandle拒绝目录名与任务ID不一致。50个目录仍全部进入清单/hash与只读解析；49个有效任务必须真实status且零抛错；该唯一归档目录保留真实身份拒绝原件，状态标为 `known_identity_error`，不得称status通过。其他身份错误、解析失败、状态入口错误、历史字节变化或缺原件均失败。

源证据：`quality/evidence/build-plan/historical-archive-exception-clarification-002.json`，以及其中绑定的唯一目录/manifest身份/manifest hash。现有身份认证保持原规则，不新增历史运行分支，不更名、不改写历史。当前任务仍按§18及C3新写入读取路径另验。§18及更早条文的“全部status零抛错”在历史集合上以本节49正常+1明确错误的精确口径为准。

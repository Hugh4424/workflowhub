# 决策记录 · workflowhub-build-prd-workflow-hardening-20260911

## 任务身份

| 项 | 值 |
| --- | --- |
| 任务类型 | 普通任务 |
| project | workflowhub |
| task_id | workflowhub-build-prd-workflow-hardening-20260911 |
| stage | make-decision |
| worktree | `/Users/Hugh/Hugh/Project/workflowhub-workflowhub-build-prd-workflow-hardening-20260911` |
| branch | `task/workflowhub/workflowhub-build-prd-workflow-hardening-20260911` |
| baseline_commit | `45283fd36b72cafd425592fb0c418b28abc2d066` |
| task_path | `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-build-prd-workflow-hardening-20260911` |
| created_at | 2026-09-11 |

## 1. 原始需求（用户原话，未改写）

> 我之前做了一个 "/Users/Hugh/Hugh/Project/workflowhub/specs/archive/workflowhub-build-prd" 任务，然后基于这个新流程做了一个新的 prd：/Users/Hugh/Hugh/Project/workflowhub/specs/workflowhub-mechanism-simplification-20260910，但是我觉得这个流程有问题：
>
> 1：make-decision 阶段问了太多需求细节，我在设计 prd 的规划任务中，不应该问这么多的细节，都没做到具体任务，我考虑的也不清楚啊。
> 2：decision-log 和 prd 太详细太臃肿了，完全不像是一个可以接下来逐任务执行的 prd，反而是把所有细节都考虑清楚的完整方案文档，不太合适，这些细节应该放在具体任务的 workflowhub 流程中再设计。导致这个 prd 太大了，后续开始子任务的时候，又要重新读一遍这个超复杂的文档，还得重新开始 make-decision 和方案设计；
> 3：build-prd 完整结束后，应该和 verify-code 完全结束后一样，进行复盘和 close 才对，并且这个 close 应该不包含归档，因为这里面的任务都没完成。只有在完成这里面最后一个任务的 verify-code 时，才应该把这个规划任务一起归档。
>
> 请按标准 WorkflowHub 开始这个优化任务吧，先创建 worktree，然后从 make-decision 开始，不要跳阶段，也不要依赖 build-spec 补需求。先基于原始需求，在 make-decision 的过程中和我一起仔细梳理完整用户流程、页面范围、数据状态、成功/失败边界、非目标和延期项。注意主会话上下文控制和子代理派发。Talk 和 grill 请用大白话说明选项、后果和风险；

### 1.1 可再生原始需求索引

本表仅将 §1 原话与后续已确认决定建立导航，不新增产品决定、不替代原文，也不将历史执行事实补成完成。`R-001…R-008` 为 `raw-requirement-index.v1` 的派生 ID；与 §14 的历史风险 `R-01…R-10` 不同。

| Source ID | 原始来源与当前决定 | 当前含义 |
| --- | --- | --- |
| R-001 | §1 原话第1点；§14 D-001–D-004；D-008/D-009/D-026 | 规划任务只问方向层问题，普通任务不收紧；显式类型来源与变更后重新处置 |
| R-002 | §1 原话第2点；§14 D-005–D-007 | decision-log与PRD保持既有结构，只到方向层，保留完整旅程及可逐任务执行的清单 |
| R-003 | §1 原话第2点；§14 D-014/D-015/D-021；D-027 | 子任务最小读取后自行跑五阶段设计，仅在自身材料记录边界偏离，不写母/兄弟材料，不建机器任务链 |
| R-004 | §1 原话第3点；§14 D-010/D-011/D-016；D-031/D-032 | build-prd结束生成非stage复盘并复用close做不归档四动作；主仓同相对路径保留后正常cleanup，旧显式planning不改 |
| R-005 | §1 原话第3点；§14 D-012/D-013/D-021；D-027/D-033 | 归档由用户声明清单完成后再明确下令；正常cleanup后允许现有close从主仓发起归档、归档提交与独立授权的推送；放弃项允许声明，未声明或撤回不归档 |
| R-006 | §1 末段；§14 D-004/D-019/D-020/D-022；D-028/D-029 | 标准流程与大白话选项，步骤如实披露；不真跑规划任务，不追加用户拒绝补齐的定性AC及执行纪律验收 |
| R-007 | §14 D-023–D-025；D-030 | 阶段末按声明逐项分开报告产物存在和完成证据；链checker识别真实决定且零条目显式告警，旧缺字段不伪造 |
| R-008 | §14 非目标、风险与延期；D-016–D-018 | 保持五阶段、既有16字段和元数据同步；不加公共命令/schema/控制面，不重写旧材料，延期及质量缺口保留 |

## 1.5 需求框架预设（先于研究/Talk 选定）

六个功能骨架节点：`background` / `problem` / `goal` / `solution` / `acceptance` / `extension`。
六类固定类别：`complete_user_flow` / `page_scope` / `data_state` / `success_failure_boundary` / `non_goals` / `deferred`。

## 2. OI 大纲（唯一当前版本 · 版本 v1）

> 身份绑定（方向审查 finding #4 / #10 的当场修复）：本表全部 OI 绑定
> `task_id = workflowhub-build-prd-workflow-hardening-20260911`、`outline_version = v1`、
> `oi_id = OI-01..OI-20`。三者共同构成 OI 的不可变身份；缺少任一项的投影不得被接受为当前 OI。
> 状态取值：`open`（待收敛）/ `answered`（已由用户回复）/ `fact`（已由仓库事实现场回答，无需提问）/ `empty`（本任务不适用，附理由）。
> 本表是本阶段唯一权威 OI 清单；Talk 各轮只更新本表版本，不新建第二张表。
> 本表在 Round 3 **及其后的补充轮**（产出 D-021）之后已全部收敛；下表「状态」列记的是终态。
> 终态字段绑定（stage-end 一致性检查修复：OI 终态字段绑定）：§2.1 与 §2.2 两张表逐行提供 `task_id`、`outline_version`、`selected_disposition`、`requires_user_decision`、`impact_dimensions`；缺任一字段的行不得作为当前 OI 权威做终态对账。
> `requires_user_decision` 语义：该 OI 是否**必须**由用户裁决。**2026-09-11 更正（D-028）**：以 §2.2b 机器可读块为准，**19 条记 `true`、仅 OI-16 记 `false`**（`page_scope`，由仓库事实与 UI applicability=`non_ui` 直接排除，无用户裁决）。本节此前所记「由仓库事实或宪法硬约束直接回答的记 `false`（OI-01/02/03/04/13/14/16 共 7 条）」经逐条核对 `selected_disposition` 后确认**错误**：OI-01/02/03/04/13/14 的处置分别指向 D-001、D-005/D-006/D-007、D-010/D-011/D-012、D-016/D-017 等**用户参与做出的决定**，属真实用户裁决；§2.1 人读表已按本块同步更正。**连带后果（如实登记）**：原句「本任务**不存在**上一任务『30/30 全部要求用户裁决』的同形问题」**不再成立**——本任务 20 个 OI 中 **19 个**需要用户裁决，该同形问题确实存在。详见文末 D-028。

### 2.0 OI 骨架覆盖表（机器可读契约）

> 每行按框架节点／固定类别登记其覆盖的 OI；全部 20 个 OI 至少被引用一次。

| framework_node | oi_ids | empty | reason |
| --- | --- | --- | --- |
| background | OI-01 OI-02 | false | — |
| problem | OI-02 OI-03 OI-04 | false | — |
| goal | OI-05 OI-15 | false | — |
| solution | OI-06 OI-07 OI-08 OI-09 OI-10 | false | — |
| acceptance | OI-11 OI-12 OI-18 | false | — |
| extension | OI-13 OI-14 OI-19 OI-20 | false | — |

| category | oi_ids | empty | reason |
| --- | --- | --- | --- |
| complete_user_flow | OI-15 | false | — |
| page_scope | OI-16 | false | — |
| data_state | OI-17 | false | — |
| success_failure_boundary | OI-18 | false | — |
| non_goals | OI-19 | false | — |
| deferred | OI-20 | false | — |

### 2.1 需求框架节点

| OI | 节点/类别 | 问题 / 未知 | 来源 | 状态 | task_id | outline_version | selected_disposition | requires_user_decision | impact_dimensions |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| OI-01 | background | 旧 `build-prd` 流程（`workflows/build-prd/`）当初交付了什么，本次要改的是它的哪一层（workflow 步骤 / skill 契约 / runtime / close 机制）？ | 用户原话 + 仓库事实 | answered | workflowhub-build-prd-workflow-hardening-20260911 | v1 | 事实核查确认改动面；见 D-001 | true | 方向级 |
| OI-02 | problem | 痛点 1「规划任务问了太多实现细节」的真实成因是什么：skill 没区分任务类型，还是 make-decision 通用流程本身缺「提问粒度」规则？ | 用户原话 + 事实核查 | answered | workflowhub-build-prd-workflow-hardening-20260911 | v1 | D-001/D-002/D-003 | true | 方向级 |
| OI-03 | problem | 痛点 2「decision-log / prd 臃肿」的真实成因是什么：缺少篇幅/内容纪律，还是缺少「规划任务只到方向层」的明文边界？ | 用户原话 + 事实核查 | answered | workflowhub-build-prd-workflow-hardening-20260911 | v1 | D-005/D-006/D-007 | true | 方向级 |
| OI-04 | problem | 痛点 3「build-prd 结束后没有复盘和 close」在现流程中的确切缺口是什么（有没有 step、有没有 close 入口、归档是不是可分离动作）？ | 用户原话 + 事实核查 | answered | workflowhub-build-prd-workflow-hardening-20260911 | v1 | D-010/D-011/D-012 | true | 方向级 |
| OI-05 | goal | 本次优化成功后，用户可观察到的结果是什么（下次跑规划任务时看到的提问、文档规模、结束动作分别变成什么样）？ | 用户原话 | answered | workflowhub-build-prd-workflow-hardening-20260911 | v1 | D-019（验收口径） | true | 方向级 |
| OI-06 | solution | 修复落点选在哪一层：只改 `build-prd` 局部，还是改 make-decision 通用契约并加「规划任务」判别？会不会影响普通实现任务？ | 用户原话 + 宪法边界 | answered | workflowhub-build-prd-workflow-hardening-20260911 | v1 | D-002/D-003 | true | 方向级 |
| OI-07 | solution | 「规划任务的 decision-log 应该只记什么、明确不记什么」的边界怎么定？ | 用户原话 | answered | workflowhub-build-prd-workflow-hardening-20260911 | v1 | D-004 | true | 方向级 |
| OI-08 | solution | 「prd 应该只写到什么粒度」的边界怎么定，任务卡最小字段是什么？ | 用户原话 | answered | workflowhub-build-prd-workflow-hardening-20260911 | v1 | D-005/D-006 | true | 方向级 |
| OI-09 | solution | 「build-prd 结束的 close」与现有 `task-close` 的关系：是同一入口带参数，还是规划任务专用路径？归档如何从 close 中分离？ | 用户原话 + 事实核查 | answered | workflowhub-build-prd-workflow-hardening-20260911 | v1 | D-011 | true | 方向级 |
| OI-10 | solution | 「最后一个子任务的 verify-code 完成时一起归档规划任务」怎么判定和触发：需不需要显式登记子任务集合？谁负责触发？ | 用户原话 | answered | workflowhub-build-prd-workflow-hardening-20260911 | v1 | D-012/D-013/D-021 | true | 方向级 |
| OI-11 | acceptance | 用什么可复现的场景证明三条痛点都真的修好了（旧材料作为反例、新产物作为正例）？ | 用户原话 + 事实核查 | answered | workflowhub-build-prd-workflow-hardening-20260911 | v1 | D-019 | true | 方向级 |
| OI-12 | acceptance | 旧的两份材料（239KB decision-log / 553KB prd）怎么处置：保留为只读反例，还是需要重写/精简？ | 用户原话 | answered | workflowhub-build-prd-workflow-hardening-20260911 | v1 | D-018 | true | 方向级 |
| OI-13 | extension | 本次改动要不要同步改 `skills/spec-prd/SKILL.md` 与 `workflows/build-prd/SKILL.md` 之外的东西（catalog、manifest、docs/standard-workflow.md、CONSTITUTION）？ | 仓库事实 | answered | workflowhub-build-prd-workflow-hardening-20260911 | v1 | D-016/D-017 | true | 方向级 |
| OI-14 | extension | 是否需要新增公共命令、新 schema 或新控制面？宪法要求「无当前消费者不新增控制面」。 | 仓库事实 + 宪法 | answered | workflowhub-build-prd-workflow-hardening-20260911 | v1 | D-016 | true | 方向级 |

### 2.2 六类固定类别

| OI | 节点/类别 | 问题 / 未知 | 来源 | 状态 | task_id | outline_version | selected_disposition | requires_user_decision | impact_dimensions |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| OI-15 | complete_user_flow | 下次真实使用时的完整用户流程是什么：从发起规划任务 → 提问 → 产出 prd → 结束（复盘 + 不归档 close）→ 逐个子任务跑五阶段 → 最后一个子任务 verify-code 触发规划任务归档。每步谁执行、在哪看结果？ | 用户原话 | answered | workflowhub-build-prd-workflow-hardening-20260911 | v1 | D-021 + 用户流程表 | true | 方向级 |
| OI-16 | page_scope | 本次改动涉及哪些页面 / 入口 / CLI 面？是否存在 UI？ | 仓库事实 | answered | workflowhub-build-prd-workflow-hardening-20260911 | v1 | §4.10 UI applicability = non_ui | false | 方向级 |
| OI-17 | data_state | 规划任务自身的数据落在哪（四份材料？prd？task store？），子任务与规划任务之间的数据关系是什么，归档时哪些数据被移动？ | 用户原话 + 事实核查 | answered | workflowhub-build-prd-workflow-hardening-20260911 | v1 | D-011/D-021 | true | 方向级 |
| OI-18 | success_failure_boundary | 成功/失败/取消/重试/恢复边界：子任务失败怎么办？规划任务提前废弃怎么办？最后一个子任务判断错（还有任务没做完）怎么办？归档与 close 各自失败如何处置？ | 用户原话 | answered | workflowhub-build-prd-workflow-hardening-20260911 | v1 | D-009/D-012/D-013 | true | 方向级 |
| OI-19 | non_goals | 明确不做的事：例如不重做已归档的旧材料、不改五阶段拓扑、不建第六个 stage、不改质量门、不动子任务内部设计粒度等。 | 用户原话 | answered | workflowhub-build-prd-workflow-hardening-20260911 | v1 | §14 非目标 | true | 方向级 |
| OI-20 | deferred | 本次明确延期的事：文档历史迁移、旧 PRD 全量重写、跨项目复用、自动触发归档的无人值守能力等。 | 用户原话 | answered | workflowhub-build-prd-workflow-hardening-20260911 | v1 | §14 延期项 | true | 方向级 |

### 2.2b OI 结构化终态记录（机器可读契约）

> 本块是 §2.1／§2.2 两张人读表的机器可读投影，字段口径由运行时 `validateDecisionOutline` 决定；
> 两者内容必须一致，不一致时以本块为准并回改人读表。

> **未解决的契约循环（如实保留，不伪造）**：运行时要求每个核心 OI 记录携带 `interaction_ref`
> 与 `interaction_hash`，指向 interaction aggregate；而该 aggregate 的 `snapshot_tree` 是对
> 工作树的哈希，工作树又包含本文件——本文件写入该 ref/hash 就会改变 snapshot_tree，
> 从而使刚写入的 ref/hash 立即失效。实测迭代 10 轮不收敛（每轮 snap 与 dhash 都在变）。
> 因此 `outline_closed` 谓词在本任务上无法同时满足，阶段完成事实保持 `incomplete`；
> 本块不写入自指的 ref/hash，以免留下立刻失效的假绑定。

```yaml
- {"oi_id": "OI-01", "task_id": "workflowhub-build-prd-workflow-hardening-20260911", "outline_version": "v1", "category": "complete_user_flow", "status": "confirmed", "source": "用户原话 + 仓库事实核查（见 §4 与 §5）", "question": "见 §2.1/§2.2 的同号 OI 问题原文", "impact_dimensions": ["scope"], "requires_user_decision": true, "visible_group_id": "R1-Q1", "selected_disposition": "按事实核查确认改动面，见 D-001", "basis": "§4.1 事实核查：该目录只有 decision-log.md 与 prd.md，spec/plan/tasks 从未存在", "acceptance": "改动面界定可复算：若本次改动跑到 prd 生成之后的阶段，即越界", "counterexample": "若把 build-prd 局部当作痛点 1 的修复点，则判定失败", "evidence": "§4.1 事实核查：该目录只有 decision-log.md 与 prd.md，spec/plan/tasks 从未存在"}
- {"oi_id": "OI-02", "task_id": "workflowhub-build-prd-workflow-hardening-20260911", "outline_version": "v1", "category": "success_failure_boundary", "status": "confirmed", "source": "用户原话 + 仓库事实核查（见 §4 与 §5）", "question": "见 §2.1/§2.2 的同号 OI 问题原文", "impact_dimensions": ["goal"], "requires_user_decision": true, "visible_group_id": "R1-Q2", "selected_disposition": "见 D-001/D-002/D-003", "basis": "§4.2：make-decision 的 SKILL.md 与 steps.json 里 planning/prd/规划 0 命中", "acceptance": "规划任务 Talk 中属于 D-004 清单的问题数为 0（AC-01）", "counterexample": "出现任一属于 D-004 清单的问题即失败", "evidence": "§4.2：make-decision 的 SKILL.md 与 steps.json 里 planning/prd/规划 0 命中"}
- {"oi_id": "OI-03", "task_id": "workflowhub-build-prd-workflow-hardening-20260911", "outline_version": "v1", "category": "data_state", "status": "confirmed", "source": "用户原话 + 仓库事实核查（见 §4 与 §5）", "question": "见 §2.1/§2.2 的同号 OI 问题原文", "impact_dimensions": ["goal"], "requires_user_decision": true, "visible_group_id": "R1-Q3", "selected_disposition": "见 D-005/D-006/D-007", "basis": "§4.3：prd 中模板外章节占 77.7%；decision-log 无 Goal 字段", "acceptance": "规划产物不含 D-004 十类实现细节，且含可执行任务清单（AC-04/AC-05）", "counterexample": "仍出现实现细节或新增模板外章节即失败", "evidence": "§4.3：prd 中模板外章节占 77.7%；decision-log 无 Goal 字段"}
- {"oi_id": "OI-04", "task_id": "workflowhub-build-prd-workflow-hardening-20260911", "outline_version": "v1", "category": "success_failure_boundary", "status": "confirmed", "source": "用户原话 + 仓库事实核查（见 §4 与 §5）", "question": "见 §2.1/§2.2 的同号 OI 问题原文", "impact_dimensions": ["goal"], "requires_user_decision": true, "visible_group_id": "R1-Q4", "selected_disposition": "见 D-010/D-011/D-012", "basis": "§4.5：build-prd 无 on_stage_end；归档在 close 五步中写死", "acceptance": "build-prd 阶段末有非空复盘事实；收口跳过归档且物理动作读回（AC-07/AC-08）", "counterexample": "归档被执行或复盘为空即失败", "evidence": "§4.5：build-prd 无 on_stage_end；归档在 close 五步中写死"}
- {"oi_id": "OI-05", "task_id": "workflowhub-build-prd-workflow-hardening-20260911", "outline_version": "v1", "category": "complete_user_flow", "status": "confirmed", "source": "用户原话 + 仓库事实核查（见 §4 与 §5）", "question": "见 §2.1/§2.2 的同号 OI 问题原文", "impact_dimensions": ["goal"], "requires_user_decision": true, "visible_group_id": "R1-Q1", "selected_disposition": "见 D-019", "basis": "用户 R2-Q4 选 A；§14 D-019", "acceptance": "结构校验与单元测试通过，未实测结论保持未实测（AC-13）", "counterexample": "声称做了实测验证、或把未实测项当通过即失败", "evidence": "用户 R2-Q4 选 A；§14 D-019"}
- {"oi_id": "OI-06", "task_id": "workflowhub-build-prd-workflow-hardening-20260911", "outline_version": "v1", "category": "success_failure_boundary", "status": "confirmed", "source": "用户原话 + 仓库事实核查（见 §4 与 §5）", "question": "见 §2.1/§2.2 的同号 OI 问题原文", "impact_dimensions": ["scope"], "requires_user_decision": true, "visible_group_id": "R1-Q2", "selected_disposition": "见 D-002/D-003", "basis": "§4.2 根因：提问规则无任务类型概念；§4.7.1 finding #2", "acceptance": "改动落在 make-decision 的提问决策点", "counterexample": "落在 build-prd（时序在后）即失败", "evidence": "§4.2 根因：提问规则无任务类型概念；§4.7.1 finding #2"}
- {"oi_id": "OI-07", "task_id": "workflowhub-build-prd-workflow-hardening-20260911", "outline_version": "v1", "category": "data_state", "status": "confirmed", "source": "用户原话 + 仓库事实核查（见 §4 与 §5）", "question": "见 §2.1/§2.2 的同号 OI 问题原文", "impact_dimensions": ["scope"], "requires_user_decision": true, "visible_group_id": "R2-Q3", "selected_disposition": "见 D-004", "basis": "用户 R3-Q3 原话澄清边界按任务类型分", "acceptance": "规划任务不问 D-004 十类；实现任务不受影响（AC-01/AC-02）", "counterexample": "普通任务被一并收紧即失败", "evidence": "用户 R3-Q3 原话澄清边界按任务类型分"}
- {"oi_id": "OI-08", "task_id": "workflowhub-build-prd-workflow-hardening-20260911", "outline_version": "v1", "category": "data_state", "status": "confirmed", "source": "用户原话 + 仓库事实核查（见 §4 与 §5）", "question": "见 §2.1/§2.2 的同号 OI 问题原文", "impact_dimensions": ["scope"], "requires_user_decision": true, "visible_group_id": "R1-Q3", "selected_disposition": "见 D-005/D-006", "basis": "用户 G3：decision-log 仍和现在一样，只是不要那么多实现细节", "acceptance": "材料结构不变，内容边界可枚举判定（AC-04）", "counterexample": "材料集合被改变（如去掉 prd）即失败", "evidence": "用户 G3：decision-log 仍和现在一样，只是不要那么多实现细节"}
- {"oi_id": "OI-09", "task_id": "workflowhub-build-prd-workflow-hardening-20260911", "outline_version": "v1", "category": "data_state", "status": "confirmed", "source": "用户原话 + 仓库事实核查（见 §4 与 §5）", "question": "见 §2.1/§2.2 的同号 OI 问题原文", "impact_dimensions": ["scope"], "requires_user_decision": true, "visible_group_id": "R2-Q1", "selected_disposition": "见 D-011", "basis": "用户 R2-Q1 选 B；宪法 CONSTITUTION.md:179 阶段收口 close 语义", "acceptance": "commit/merge/push/cleanup 完成、archive 未执行、无 close 完成记录（AC-08）", "counterexample": "执行归档或写入 close 完成记录即失败", "evidence": "用户 R2-Q1 选 B；宪法 CONSTITUTION.md:179 阶段收口 close 语义"}
- {"oi_id": "OI-10", "task_id": "workflowhub-build-prd-workflow-hardening-20260911", "outline_version": "v1", "category": "success_failure_boundary", "status": "confirmed", "source": "用户原话 + 仓库事实核查（见 §4 与 §5）", "question": "见 §2.1/§2.2 的同号 OI 问题原文", "impact_dimensions": ["acceptance"], "requires_user_decision": true, "visible_group_id": "R3-Q1", "selected_disposition": "见 D-012/D-013/D-021", "basis": "用户 R3-Q1 选 B、G6 选 A、补充轮选 B", "acceptance": "子任务写出清单完成差额或可归档结论；归档仍须用户下令（AC-09/AC-10）", "counterexample": "自动执行归档或提前判可归档即失败", "evidence": "用户 R3-Q1 选 B、G6 选 A、补充轮选 B"}
- {"oi_id": "OI-11", "task_id": "workflowhub-build-prd-workflow-hardening-20260911", "outline_version": "v1", "category": "success_failure_boundary", "status": "confirmed", "source": "用户原话 + 仓库事实核查（见 §4 与 §5）", "question": "见 §2.1/§2.2 的同号 OI 问题原文", "impact_dimensions": ["acceptance"], "requires_user_decision": true, "visible_group_id": "R2-Q4", "selected_disposition": "见 D-019", "basis": "用户 R2-Q4 选 A", "acceptance": "结构校验与单元测试通过，且未实测项如实记为未实测（AC-13）", "counterexample": "把未实测项当通过即失败", "evidence": "用户 R2-Q4 选 A"}
- {"oi_id": "OI-12", "task_id": "workflowhub-build-prd-workflow-hardening-20260911", "outline_version": "v1", "category": "data_state", "status": "confirmed", "source": "用户原话 + 仓库事实核查（见 §4 与 §5）", "question": "见 §2.1/§2.2 的同号 OI 问题原文", "impact_dimensions": ["scope"], "requires_user_decision": true, "visible_group_id": "R1-Q3", "selected_disposition": "见 D-018", "basis": "用户 R1-Q3 选 A；§14 非目标", "acceptance": "旧两份材料保持只读、不被重写", "counterexample": "旧材料被改写即失败", "evidence": "用户 R1-Q3 选 A；§14 非目标"}
- {"oi_id": "OI-13", "task_id": "workflowhub-build-prd-workflow-hardening-20260911", "outline_version": "v1", "category": "data_state", "status": "confirmed", "source": "用户原话 + 仓库事实核查（见 §4 与 §5）", "question": "见 §2.1/§2.2 的同号 OI 问题原文", "impact_dimensions": ["scope"], "requires_user_decision": true, "visible_group_id": "R1-Q2", "selected_disposition": "见 D-016/D-017", "basis": "§4.8 补充事实：模板 16 字段名被契约测试断言", "acceptance": "既有契约测试通过且 bundle/catalog hash 同步（AC-13）", "counterexample": "删改 16 字段名或 hash 不一致即失败", "evidence": "§4.8 补充事实：模板 16 字段名被契约测试断言"}
- {"oi_id": "OI-14", "task_id": "workflowhub-build-prd-workflow-hardening-20260911", "outline_version": "v1", "category": "data_state", "status": "confirmed", "source": "用户原话 + 仓库事实核查（见 §4 与 §5）", "question": "见 §2.1/§2.2 的同号 OI 问题原文", "impact_dimensions": ["scope"], "requires_user_decision": true, "visible_group_id": "R1-Q2", "selected_disposition": "见 D-016", "basis": "宪法：无当前消费者的重复控制面不新增；§4.5 复用线索", "acceptance": "不新增公共命令、schema 或控制面（AC-12）", "counterexample": "新增任一未登记控制面即失败", "evidence": "宪法：无当前消费者的重复控制面不新增；§4.5 复用线索"}
- {"oi_id": "OI-15", "task_id": "workflowhub-build-prd-workflow-hardening-20260911", "outline_version": "v1", "category": "complete_user_flow", "status": "confirmed", "source": "用户原话 + 仓库事实核查（见 §4 与 §5）", "question": "见 §2.1/§2.2 的同号 OI 问题原文", "impact_dimensions": ["goal"], "requires_user_decision": true, "visible_group_id": "R1-Q4", "selected_disposition": "见 D-021 与 §14 用户流程表", "basis": "用户 R1-Q4/R2-Q1/R3-Q1/R3-Q2 与 G6 的连续选择", "acceptance": "十二步用户流程可逐步对应到材料与验收", "counterexample": "任一步无对应决定或验收即失败", "evidence": "用户 R1-Q4/R2-Q1/R3-Q1/R3-Q2 与 G6 的连续选择"}
- {"oi_id": "OI-16", "task_id": "workflowhub-build-prd-workflow-hardening-20260911", "outline_version": "v1", "category": "page_scope", "status": "not_applicable", "source": "用户原话 + 仓库事实核查（见 §4 与 §5）", "question": "见 §2.1/§2.2 的同号 OI 问题原文", "impact_dimensions": ["ordinary_detail"], "requires_user_decision": false, "reason": "本任务无页面、无界面、无可视化部件（见 UI applicability = non_ui）", "counterexample_boundary": "若本次改动触及任何界面文件，则 not_applicable 判定失败"}
- {"oi_id": "OI-17", "task_id": "workflowhub-build-prd-workflow-hardening-20260911", "outline_version": "v1", "category": "data_state", "status": "confirmed", "source": "用户原话 + 仓库事实核查（见 §4 与 §5）", "question": "见 §2.1/§2.2 的同号 OI 问题原文", "impact_dimensions": ["scope"], "requires_user_decision": true, "visible_group_id": "R2-Q1", "selected_disposition": "见 D-011/D-021", "basis": "§4.5 close 五步与归档 executor 事实", "acceptance": "规划任务材料留在 specs/ 不归档；判定读链只用既有事实", "counterexample": "依赖新增的父子任务字段即失败", "evidence": "§4.5 close 五步与归档 executor 事实"}
- {"oi_id": "OI-18", "task_id": "workflowhub-build-prd-workflow-hardening-20260911", "outline_version": "v1", "category": "success_failure_boundary", "status": "confirmed", "source": "用户原话 + 仓库事实核查（见 §4 与 §5）", "question": "见 §2.1/§2.2 的同号 OI 问题原文", "impact_dimensions": ["acceptance"], "requires_user_decision": true, "visible_group_id": "R3-Q2", "selected_disposition": "见 D-009/D-012/D-013", "basis": "用户 G1 选 B、R3-Q1 选 B；§4.5 无父子任务字段事实", "acceptance": "类型变更后旧类型产物须重处置；归档须人工下令（AC-15/AC-10）", "counterexample": "旧类型产物被继续消费或自动归档即失败", "evidence": "用户 G1 选 B、R3-Q1 选 B；§4.5 无父子任务字段事实"}
- {"oi_id": "OI-19", "task_id": "workflowhub-build-prd-workflow-hardening-20260911", "outline_version": "v1", "category": "non_goals", "status": "confirmed", "source": "用户原话 + 仓库事实核查（见 §4 与 §5）", "question": "见 §2.1/§2.2 的同号 OI 问题原文", "impact_dimensions": ["scope"], "requires_user_decision": true, "visible_group_id": "R1-Q2", "selected_disposition": "见 §14 非目标", "basis": "用户 R1-Q2 选 A；宪法与仓规", "acceptance": "不改五阶段拓扑、不加第六阶段、不改普通任务粒度（AC-16）", "counterexample": "普通任务被一并要求或改变即失败", "evidence": "用户 R1-Q2 选 A；宪法与仓规"}
- {"oi_id": "OI-20", "task_id": "workflowhub-build-prd-workflow-hardening-20260911", "outline_version": "v1", "category": "deferred", "status": "deferred", "source": "用户原话 + 仓库事实核查（见 §4 与 §5）", "question": "见 §2.1/§2.2 的同号 OI 问题原文", "impact_dimensions": ["scope"], "requires_user_decision": true, "visible_group_id": "R1-Q4", "owner": "用户", "trigger": "用户显式要求取消人工归档确认", "scope": "无人值守自动归档", "impact": "继续保留人工归档确认，无自动执行", "follow_up_acceptance": "该能力被实现并经审查后，DEFER-01 关闭", "selected_disposition": "已延期；四条延期项各有 owner、触发、消费者与关闭条件（见 §14 延期项）"}
```

### 2.3 需求到决策覆盖矩阵（六行 = 原始需求五维 + 方案细节边界）

| 维度 | 覆盖 OI | 终态 |
| --- | --- | --- |
| 业务目标 | OI-01 / 02 / 03 / 04 / 05 | answered |
| 流程与表面 | OI-15 / OI-16 / OI-06 | answered |
| 数据与状态 | OI-17 / OI-09 / OI-10 | answered |
| 成功失败与验收 | OI-11 / OI-12 / OI-18 | answered |
| 约束、非目标与延期 | OI-13 / OI-14 / OI-19 / OI-20 | answered |
| 方案细节边界 | OI-07 / OI-08 | answered |


> 终态说明（stage-end 一致性检查修复：覆盖矩阵终态）：本矩阵全部行已收敛为 `answered`；OI-01/OI-05 已列入「业务目标」行，与 §2.1 的覆盖声明一致。

## 3. 范围三角（step 2 triage-scope）

### 3.1 范围内（**草案，已被 §14 正式范围取代**；此处只保留 triage 当时的原始记录）

- `workflows/build-prd/` 与 `skills/spec-prd/` 的职责与步骤契约。
- make-decision 在「规划任务」这一任务类型下的提问粒度与内容边界。
- 规划任务 decision-log 与 PRD 的内容/篇幅边界。
- build-prd 结束时的复盘（reflection）与不归档 close。
- 最后一个子任务 verify-code 完成时归档规划任务的判定与触发。
- 与上述改动直接相关的最小实现、测试与文档。

### 3.2 明确的不确定性（**已被 §14 取代**；此处只保留 triage 当时的原始记录）

- 落点边界：局部改 `build-prd` vs 通用改 make-decision。
- close 的实现形态：复用 `task-close` 参数化 vs 规划任务专用路径。
- 子任务集合的登记方式与「最后一个」的判定口径。
- 验收证据形态：旧材料作为反例是否足够，要不要真跑一次端到端。

### 3.3 非目标（**草案，已被 §14 正式非目标取代**；此处只保留 triage 当时的原始记录）

- 不改五阶段拓扑，不新增第六个 stage。
- 不重写或重做已归档的历史材料。
- 不改变子任务内部的方案设计粒度。
- 不新增质量门或推进许可。

### 3.4 延期项（**草案，已被 §14 正式延期项取代**；此处只保留 triage 当时的原始记录）

- 规划任务的自动/无人值守归档触发。
- 跨项目、跨仓的规划任务组复用。
- 旧 PRD 材料的全量重写。

## UI applicability

三输入按证据合并（不是按 caller 标签）：

```json
{
  "result": "non_ui",
  "sources": {
    "raw_requirement": { "result": "non_ui", "description": "原始需求通篇只谈流程、提问、材料与 close／归档机制，没有提出任何界面、交互或可视化诉求" },
    "project_inventory": { "result": "non_ui", "description": "本仓是命令行与运行时项目：runtime／tools／core／skills／workflows 由 Markdown、JSON、YAML 与 .mjs 组成；没有界面框架、没有路由表、没有可视化部件" },
    "planned_or_changed_frontend_fact": { "result": "non_ui", "description": "本次改动面为 skills/spec-prd/SKILL.md 与其模板、workflows/build-prd、workflows/make-decision、runtime/review、core/task-close.mjs 以及测试；不含任何界面文件" }
  },
  "recompute_rule": "当计划或界面事实变化时重新合并三输入，不复用本次结论"
}
```

**结论与理由**：三个来源都可信地排除界面工作，故为 `non_ui`，与派生值一致。不存在来源冲突，无需向用户追加界面问题。本任务不涉及页面范围；「page_scope」类别的对应 OI-16 因此收敛为「无页面，只有命令行、文件与事实面」。


## 4. 事实与证据（step 1 load-context 现场核查）

> 本节结论均由只读子代理在独立上下文中核实，附路径与行号。完整原始报告不进入本材料，只保留结论条目与证据引用。

### 4.1 上一个规划任务的真实运行形态

- `specs/workflowhub-mechanism-simplification-20260910/` 全程只有 2 个文件：`decision-log.md`（239,459 B / 1,979 行）与 `prd.md`（553,212 B / 4,346 行）。`spec.md` / `plan.md` / `tasks.md` 在任何分支、任何提交中**从未存在**（`git log --all --diff-filter=A` 仅 2 条）。
- 该目录唯一提交为 `64c8146e`。`decision-log.md` 自述 `stage: make-decision（进行中）`。
- 该任务的 `quality/verify.json` 是 bootstrap 占位（`status: unknown`、`material_digest` 全 0、`created_at` 与 task.json 相差 <1 秒）；`facts.jsonl` **0 字节**；`quality/reviews`、`quality/tests` 均为空目录。
- 结论：规划任务的运行形态与标准五阶段不同——它跑 `make-decision` 产出 decision-log，再跑 `build-prd` 产出 prd，**不产生 spec/plan/tasks**。

### 4.2 痛点 1 的量化证据（规划任务问了太多实现细节）

- 该 decision-log 记录了 **Talk 4 轮共 28 题 + Grill 5 题 = 33 个用户问题**，另有 **30 张 OI 问题卡，30/30 全部标 `requires_user_decision: true`**（其中 7 张自带 `impact_dimensions: [ordinary_detail]` 标签仍要求人裁决）。
- 轮次性质：round 1（6 题）方向级；round 2（6 题）混合；**round 3（6 题）+ round 4（10 题）共 16 题为实现细节级**。
- 实现细节级提问实例（原文，含行号）：
  - L432：`quality/verify.json（HEAD 上已有 kernel publisher 且是完成谓词）与 product-release 投影是收掉还是保留？`
  - L448：`写坏怎么办：facts.jsonl 写失败/写一半/写后读回的行为定义；写口核对是否写死不再扩张？`
  - L536：`任务期间 main 前进怎么办：冻结 base OID + 一次受控 rebase，还是只要求报 stale？`
  - L708：`一张任务卡最多改几个生产文件：只作建议、硬拦截、还是不设数字？`
  - L722：`build-code 的任务粒度是否改成「一条 producer→consumer seam = 一个 task，write set 不相交才可同 wave，第一反馈有秒/分钟预算」？`
  - L928（T-10 裁决 2）：去重键改为 `(stage, phase_id, track, review_kind, origin)` 元组。
- **根因（事实）：make-decision 的提问规则里没有「规划任务」这个概念。** `workflows/make-decision/SKILL.md` 与 `steps.json` 里 grep `prd` / `planning` / `规划` **0 命中**；全仓与规划态相关的命中只有 4 处（`skills/spec-prd/SKILL.md:3`、`workflows/build-prd/SKILL.md:3`、`docs/adr/0025-...:15`、`docs/architecture/move-map.json:3160-3171`），均不涉及提问粒度。
- 现有唯一相关规则是 `workflows/make-decision/SKILL.md` L196「Ask only questions whose answers could change direction」。本次「direction」被理解成机制实现方向，于是产出 16 个实现细节级提问——**这是规则缺口，不是规则违反**。

### 4.3 痛点 2 的量化证据（产物臃肿、不可逐任务执行）

- `prd.md` 结构占比：规划层约 **4%**；任务卡正文 **55.3%**（305,993 B，10 张卡，单卡 2–5.4 万字节）；`## 实测记录` **19.4%**（107,344 B）；`### 需要裁定的新增矛盾` **9.8%**（54,245 B）；流程元数据（展示稿确认 5 轮修正 + 变更说明）约 **5%**。
- 实现细节密度：代码围栏 **102,711 B = 全文 18.6%**（87 段，含 bash oracle 全文、`grep -rn` 整行、`sed -n` 源码转储）；`文件.mjs:行号` 引用 **659 处**；回指 decision-log 的 `L####` **602 处**（219 个不同行区间）。
- 逐卡样板重复：`17. 受影响测试清单与命令` ×10、`18. 控制面净增减申报` ×10、`16. 五阶段开工说明` ×6；字段格式不统一（字段 1–6 用 `##### N.`，7–18 用 `**N.**`）。
- `decision-log.md` 结构占比：真正的方向段（原始需求/调研/talk、目标/成败边界/范围/非目标、grill/处置/风险/未决、收敛大纲）约 **22%**；`## 决定` Module A–H + I 约 **36%**（86,849 B，含实现细节）；OI 记录 12.9%；审查与复核 16.8%；流程元数据约 13%。
- **可执行性事实：该材料没有「任务卡」清单，只有路线图。** 全文件 grep `Goal` **0 命中**；30 条 acceptance 绑在 30 张 OI 卡上而非任务上；10 个批次里只有 ⑧⑨ 两批写了验收；L1400 原文 `unresolved_items/owner: 每个任务的具体体量与验收细节由 build-prd 定义。`
- `prd.md` 侧确有任务表（L106–117，10 行，2.2 KB），并定义「交付组 = 一个后续标准开发任务」⇒ 真正可执行任务是 **3 个**，10 张卡是组内批次。
- 两文件同源复制：K1–K9 保留清单、删除侧、阻塞八类、批次划分、审查五态、非目标、修正处置均出现两次。
- **下游重读量事实**：`prd.md` 每卡「最小读取集」直接指定 decision-log 行区间，全文 29 处 `decision-log.md L…` 引用 ⇒ 每个下游子任务的 make-decision 仍须重读母 decision-log 的实现细节，正是用户描述的「又要重新读一遍超复杂文档，还得重新开始 make-decision 和方案设计」。

### 4.4 体量对照表

| 文件 | 字节 | 行数 | 相对本任务参照 |
| --- | --- | --- | --- |
| `specs/workflowhub-mechanism-simplification-20260910/decision-log.md` | 239,459 | 1,979 | 1.00× |
| `specs/archive/workflowhub-make-decision-hardening/decision-log.md` | 87,936 | 962 | 0.37× |
| `specs/workflowhub-ui-frontend-capability-20260904/decision-log.md` | 40,981 | 295 | 0.17× |
| 规划任务材料合计（decision-log + prd） | 792,671 | 6,325 | — |

### 4.5 痛点 3 的机制事实（复盘与 close 的真实边界）

- **verify-code 结束的真实顺序**：`workflows/verify-code/steps.json` step 11 `publish-verification-result`（`observable_result` 结尾原文「close 仍需独立授权」）→ step 12 `stage-reflection`（`on_stage_end: true`、`blocking: false`，产物 `quality/stage-reflection/verify-code/<semantic-key>.json`）→ **close 不在 steps.json 内**，由人在 stage 之外经 `tools/cli/task-close.mjs` 独立发起。
- 五个正式 stage 全部有 `on_stage_end` 步；`workflows/build-prd/steps.json` **只有 6 步，无任何 `on_stage_end`、无复盘步、无收口步**。其 step 6 的 `observable_result`（:87）写着要汇报 `reflection`，**但没有任何 step 生产它**。
- `workflows/build-prd/skill-deps.yaml` 只声明 `spec-prd` 与 `node`，**无 stage-reflection 依赖**。
- **close 的物理动作**：`core/task-close.mjs` 的 `DELIVERY_STEPS` 固定五步 `commit-delivery → merge-task-branch → archive-spec → push-target-branch → cleanup`，各自独立授权（`DELIVERY_AUTHORIZATIONS`）；:2274-2276 强制计划必须恰好是这五步。
- **归档当前不可跳过**，三处硬耦合：`createDeliveryCloseExecutorRegistry`（:2274-2276）拒绝非五步计划；`inspectDeliveryCloseState`（:2140-2149）把 `archive` 写死进 `missing`；`PHYSICAL_DELIVERY_FACTS`（:28-36）含 `"archive"`。
- **`--mode=planning` 已存在且强制归档**（`core/task-close.mjs:48` `CLOSE_MODES` = ordinary | mini-task | planning | manual-risk-close）；planning 模式额外要求 `PLANNING_MATERIAL_FILES = ["decision-log.md","prd.md"]`（:47），并强制 `development_status === "not_executed"`、`quality_status === "not_run"`（:1704-1705）。**上一个 build-prd 任务实际用的是 `normal` 模式且归档成功**（`operations/close/completed.json` 全 true，`close_mode: "normal"`，archive_commit `35136234`）。
- **宪法已有「阶段收口 close」概念**：`CONSTITUTION.md:174-182` 区分三种 close——①交付动作集 close ②阶段收口 close ③质量记录归档 close；:179 原文：阶段收口 close「可能触发也可能不触发交付动作集」。**用户要的「不含归档的 close」在宪法里已有名字。**
- **ADR 0025 已写明方向但未生效**：`docs/adr/0025-...md:14` 要求「末尾真实复盘不得因『纯规划』省略」，且「规划完成不代表开发、产品发布或物理交付完成」；:15 明确禁止「**不新增第二 close 入口**」；ADR `status: proposed`，:7 声明不赋予尚不存在的能力。
- **复盘机制与 stage 身份硬耦合（6 处）**：`runtime/stage/stage-reflect.mjs` 的 `STAGE_REFLECTION_STAGES`（:29-35，恰为五阶段）、`stageReflectionRef`（:108-110）、`contextParts`（:113-140）、`tools/cli/stage-runtime.mjs:637`、`runtime/stage/step-manifest.mjs` 的 `CANONICAL_STAGE_SLUGS`（:4-10）、`tools/cli/validate-stage-reflection.mjs:264`。判定要求 `judgments[].evidence_refs` 恰好含一个匹配 `^quality/evidence/stage-outcomes/<stage>/[a-f0-9]{64}\.json$` 的引用（`stage-reflect.mjs:817-822`）。
- **复用线索（既有消费者，不是新控制面）**：`runtime/review/stage-materials.json:59` 的 `non_stage.build_prd.optional` **已声明 `"reflection_facts"`**——数据模型已预期 build-prd 复盘事实，但**无人生产、无人消费**。但 `runtime/evidence/check-skill-closure.mjs:88-96` 的 `portable_workflow_outcome` 白名单**不含 `stage_outcome`**，因此 build-prd 目前无法产生复盘所需的 outcome 引用。
- **父子任务关系完全不存在**：全仓 grep `parent_task_id|parentTaskId|parent_task|planning_task|task_group|child_task` **零命中**。没有任何 schema 字段把一个 task 链到另一个 task。

### 4.6 现有可复用先例

- `mini-task` close mode 已示范「按 mode 放宽 close 事实」的既有做法（`core/task-close.mjs:1232-1237`）。
- 已有的按动作粒度授权入口：`stage-runtime.mjs authorize --op=commit|push|merge|archive|cleanup`。
- `non_stage.build_prd` 审查通道已存在：`runtime/review/stage-materials.json:52,59`、`runtime/review/review-policy.mjs:4,17-37,67-74`、`runtime/review/review-record-route.mjs:142`（report-only）。

### 4.7 方向审查事实（step 6 direction-advice）

- 审查通道：`skills/wh-review`，`stage=make-decision`、`review_track=direction`、`host_provider=dsh`。
- 前两次请求为真实失败，原样保留：
  1. `MATERIAL_FORBIDDEN`：提交了不在白名单的材料键 `current_direction_scope_non_goals`（白名单要求 `raw_requirement` / `objective_facts` / `convergence_outline` / `review_instructions`）。
  2. `REQUEST_INVALID`：`host_provider` 传了 `claude`，broker 要求受支持的宿主适配器名（当前宿主为 `dsh`）。
- 第三次实际返回：`status: available`、`outcome: completed`、`pair_status: complete`，两个异源 provider（`antigravity/flash`、`codex/luna`）均 `completed`，共 **13 条 findings**。原件：task store `quality/reviews/results/` 与 `quality/reviews/attempts/`（canonical）；材料 hash `2d9e7bdc73ae088645da63ea505545b0d6d97661626ba45870864aad025f07bf`。
- 审查是建议事实，不是通过门。逐条处置见下节 Round 3。

### 4.7.1 审查 finding 逐条处置（主会话裁定）

| # | 严重度 | 摘要 | 处置 |
| --- | --- | --- | --- |
| 1 | blocking | 把「最后一个子任务 verify-code 触发母任务归档」当主干流程，但仓里没有父子任务关联，且 OI-20 已把「自动触发归档」列为延期 | **升级为 Round 3 用户决策**（用户 R2-Q2 的选择与延期项自相矛盾，须由用户裁定） |
| 2 | major | OI-06 把「只改 build-prd 局部」当备选，但 build-prd 在 make-decision 之后才跑，拦不住提问膨胀 | **当场修复**：删除该备选，痛点 1 的落点只能是 make-decision |
| 3 | major | build-prd 复盘不能照搬 verify-code 的 stage-reflection（6 处 stage 身份硬耦合，且 portable 白名单禁止 stage_outcome） | **当场修复**：明确走非 stage 的 `reflection_facts` 通道（`runtime/review/stage-materials.json:59` 已声明该消费者） |
| 4 | blocking | OI 投影没有 task_id 绑定，无法证明属于当前任务 | **当场修复**：OI 记录绑定 `task_id` + `outline_version` + `oi_id` |
| 5 | major | 大纲丢了原始需求的硬约束（先建 worktree、从 make-decision 开始、不跳阶段、不依赖 build-spec 补需求） | **当场修复**：补入当前用户流程并写明违反时的可观察失败条件 |
| 6 | major | 把痛点 2 建模成「文档太大」，而不是「下游子任务无法在有限上下文里接手」 | **当场修复**：新增子任务接手消费方 OI 与验收场景（最小读取集、不得重做 make-decision/方案设计） |
| 7 | major | 子任务集合的成员资格被当成可选设计，但归档语义依赖它 | **升级为 Round 3**：与 #1 同源，一并对用户提出 |
| 8 | minor | 非目标/延期问题里嵌入了未经确认的排除项，会锚定用户 | **当场修复**：非目标与延期只保留原始需求或事实已确立的条目，候选排除项推迟到用户确认 |
| 9 | major | 与 #1 同源（重复根因） | 与 #1 合并处置 |
| 10 | major | 与 #4 同源（重复根因） | 与 #4 合并处置 |
| 11 | major | **OI-06 / OI-09 / OI-13 / OI-14 本身就在问实现机制，正在重演用户的痛点 1** | **当场修复 + 升级为 Round 3**：把入口形态、文件面、schema、命令类问题从 make-decision 移出，只留用户可见行为、任务类型范围、不变量、约束、非目标与延期；并在 Round 3 向用户披露这次重演 |
| 12 | major | 与 #1 同源（触发者与成员资格未定） | 与 #1 合并处置 |
| 13 | major | OI-14 把「新增公共命令 / schema / 控制面」当成开放选项，但宪法禁止无当前消费者新增控制面 | **当场修复**：改为硬约束与非目标，只允许问「哪个既有消费者或扩展点能满足」 |

**处置小结**：13 条中 2 条被合并去重后，**8 条当场修复**（#2 #3 #4 #5 #6 #8 #11 #13，#10 并入 #4、#9/#12 并入 #1），**2 组升级为 Round 3 用户决策**（#1+#7+#9+#12 归档触发与成员资格；#11 的 make-decision 边界需要用户确认）。


### 4.8 细节审查事实（step 10 detail-advice）

- 通道：`skills/wh-review`，`stage=make-decision`、`review_track=detail`、`host_provider=dsh`。
- 返回：`status: available-with-failures`、`pair_status: partial`、**24 条 findings**。provider 实况：`pi/v4flash` completed、`codex/luna` completed、`antigravity/flash` **failed**（原样保留，不追成 pass）。材料 hash `b94584eb411085e1960d4e2971c300ff78033d90c2c9c4e502b2be71be271043`。

#### 4.8.0 本阶段当场修复的机械缺陷（阻断审查，非本任务交付物）

细节审查首次执行真实失败：`TypeError: review recovery result status is invalid`。根因经现场定位为既有缺陷——
`skills/wh-review/scripts/wh-review-cli.mjs` 的 `normalizeBareRecoveryResult` 只接受
`available` / `unavailable`，而同一仓的 `skills/wh-review/scripts/simple-review-runner.mjs:1249`
与本仓 `runtime/review/review-record-route.mjs:1002,1134` 都把 `available-with-failures`
当作合法终态。bare sink 中已有的 `available-with-failures` 记录因此无法被认证，审查被卡死。
修复：该状态集合补入 `available-with-failures`（单行，`wh-review-cli.mjs:225`）。修复后同一请求真实返回 24 条 findings。
- 该缺陷与本任务三条痛点无关，属同 stage 修复的机械阻断；保留原始错误与修复事实，不据此扩大本任务范围。

#### 4.8.1 detail finding 逐条处置（主会话裁定）

| # | 严重度 | 摘要 | 处置 |
| --- | --- | --- | --- |
| 1 | major | AC-01/AC-06 与 D-019（不真跑规划任务）冲突：AC-01 被写成「真实规划运行中观察到 0 个实现机制问题」 | **当场修复**：AC-01 改为**产物可判定**口径（规划任务 Talk 记录中实现机制类问题数为 0，按材料可判定），并新增 AC-14 覆盖方向层六类必答；与 D-019 一致 |
| 2 | major | OI 终态表只有状态与依据，缺 task_id / outline_version / 终态载荷 | **当场修复**：OI 表补 `task_id`、`outline_version`、`selected_disposition`、`requires_user_decision`、`impact_dimensions` 绑定 |
| 3 | major | AC-03 要求「唯一事实读出类型」，但未指认承载处 | **当场修复**：承载处属实现细节，移交 build-spec 指认；AC-03 只保留可观察口径（规划/普通两类可区分且唯一），并登记该前提（见 R-07） |
| 4 | minor | 核心目标承诺「告知用户可归档」但流程无对应步骤 | **升级为 D-021**（与 #5/#11/#12/#21 同源） |
| 5 | major | 母任务可归档计算链不完整（清单版本、结论格式、重算触发） | **升级为 D-021** |
| 6 | major | 类型可中途改，但缺失效与重做边界 | **当场修复**：补 AC-15（类型改变后旧类型提问与产物必须按新类型重新处置，否则不得消费） |
| 7 | major | 只做负向检查，没有验收「规划任务确实问了方向层六类」 | **当场修复**：新增 AC-14 |
| 8 | major | 只说禁若干实现产物，没有穷尽口径 | **当场修复**：AC-04 的禁止项直接引用 D-004 唯一权威清单（10 类），不再另立措辞 |
| 9 | major | `reflection_facts` 通道缺触发、载荷、读回、用户可见结果 | **当场修复**：AC-07 补「复盘事实须绑定当前 task 与阶段且内容非空；生产失败须如实记 unavailable」；触发与载荷细节移交 build-spec |
| 10 | major | 同 #2（重复根因） | 并入 #2 |
| 11 | major | 「告知用户」无步骤、无执行者、无验收 | **升级为 D-021** |
| 12 | major | 「延后归档」缺执行路径与前提 | **升级为 D-021** |
| 13 | major | 同 #2（重复根因） | 并入 #2 |
| 14 | major | D-006 补 D35 的「完整旅程/需求覆盖」未经用户确认，可能扩到普通任务 | **当场修复 + 登记**：用户 G3 已确认「prd 需要精简」；现明确该项**只作用于规划任务的 prd**，不触碰普通任务模板（更新 D-006 措辞），并新增 AC-16 验证不波及普通任务 |
| 15 | minor | D-014／D-009 约束无验收 | **当场修复**：补 AC-15（类型变更）与 AC-17（子任务只读检查不搬文件、不改母任务材料、不触发母任务 close） |
| 16 | major | 同 #3（重复根因） | 并入 #3 |
| 17 | major | 材料本身没有实际任务清单 | **当场修复**：规划产物的任务清单由**被规划的规划任务**产出，不是本任务材料；本任务以 AC-05 验收该属性（prd 含任务清单且每任务有目标/边界/验收/依赖） |
| 18 | major | AC-06 与 D-004 表面冲突（子任务要不要重做 make-decision） | **当场修复**：AC-06 改为「**不重做母任务方向决策**；子任务仍按标准流程做自己的实现设计」 |
| 19 | major | 精简规则不可执行（未限制保留章节的填写深度，允许模板外新增章节） | **当场修复**：AC-04 增加「规划 prd 不得新增模板未定义的章节」；D-006 明确保留章节的填写深度以方向层为限 |
| 20 | major | 同 #6（重复根因） | 并入 #6 |
| 21 | major | 同 #5（重复根因） | 并入 D-021 |
| 22 | major | 复盘通道被声明为 optional，可能允许空记录通过 | **当场修复**：并入 #9 的处置（AC-07 要求非空且绑定） |
| 23 | major | 同 #2（重复根因） | 并入 #2 |
| 24 | minor | AC-01 禁止项比 D-004 窄；未验收 Talk/Grill 用大白话 | **当场修复**：并入 #8；并新增 AC-18（Talk 与 Grill 的选项必须含大白话选项、后果与风险） |

**处置小结**：24 条按根因去重后为 **13 组**；其中 **10 组当场修复**（补 AC-14 至 AC-18 并收紧 AC-01/AC-04/AC-06/AC-07/D-006），**1 组升级为 D-021 用户决策**（母任务可归档的计算与告知链路，含 #4/#5/#11/#12/#21），**1 组登记为前置风险**（#3/#16 类型承载处，R-07），**1 组为已确认项的表述澄清**（#14，不扩范围）。


### 4.9 D-021 与新增验收（细节审查升级项的用户裁定）

**用户选择（R3 之后补充轮 · 真实回复）**：**B** —— 子任务完成时**当场**告诉用户「还差几个」。

**由此确立**：D-021 的正式条目见 §14「决定」的 **D-021**（唯一权威定义），此处不重复。本处只保留两项前置登记：

- **R-07（前置风险登记）**：任务类型的承载处、以及母任务清单的登记位／读取位尚未指认。宪法禁止新增 schema 与控制面（D-016），因此必须在既有结构中选定。该前提由 build-spec 指认；若届时不成立，须回报 make-decision 而不是默默破非目标。
- **D-006 措辞收紧**：「完整旅程 / 需求覆盖」的来源是既有母决策 **D35**（不是本次新增范围），且只作用于规划任务的 prd，不触碰普通任务模板；用户若不接受可直接移除该条。

## 收敛检查

| 目标 | 实际用户回答 / 无新需求 | 事实或材料引用 |
| --- | --- | --- |
| target | R1-Q1 选 A：本次是**实现任务**，走标准五阶段，最终真的改代码。核心目标是修掉三个痛点 | 本文 §5 Round 1；§14 核心目标 |
| scope | R1-Q2 选 A＋R1-Q3 选 A＋R2-Q3 选 A：按任务类型区分提问强度与产物粒度；规划产物只到方向层、不设数字阈值。G5 限定本次只实现「规划 vs 普通」两类 | 本文 §5 Round 1/2 与 Grill 批次 2；§14 范围与非目标 |
| solution | G2 用户修正＋R3-Q3 用户原话＋R2-Q1 选 B＋R3-Q1 选 B＋R3-Q2 选 B＋G4 选 A＋G6 选 A：类型是每任务属性且可中途改；收口＝四个既有独立授权、跳过归档、不写 close 记录；判定＝自动算、人工归档；只读检查落在 verify-code；子任务可偏离但须留痕；按 prd 清单判全完成。取舍：拒绝新增第二 close 入口、拒绝改 `planning` 模式、拒绝全局收紧 make-decision；保留的代价是没有单独的收口记录文件 | 本文 §14 D-002 至 D-016 与 **D-021**（母任务可归档的判定与告知链路）；§4.7.1 与 §4.8.1 finding 处置 |
| goal_achievement | 三条痛点各自对应可判定的验收：痛点1→AC-01/AC-14/AC-15/AC-18；痛点2→AC-04/AC-05/AC-06/AC-16；痛点3→AC-07/AC-09/AC-10/AC-11/AC-17。每条验收都有通过条件与失败条件，无「文档存在即完成」的口径 | 本文 §14 验收标准；§4 事实与证据 |
| plain_language_card | 已向用户交付大白话决策卡（含三痛点病根、用户确认项清单、验收标准、残余风险三条、不做与延期、未决项=无），用户回复「确认」 | 本文 §5 Round 1–3 与 Grill；quality/confirmations/f381c6ab…json |
| acceptance | R2-Q4 选 A：只做结构校验与单元测试，**不真跑规划任务**；由此「新流程真的会少问、真的会变短」保持 `unknown`，不得声称已验证。验收以 AC-01 至 AC-18 表述（AC-19 已并入 AC-09，避免重复），其中 AC-01（规划任务 Talk 中实现机制问题数为 0）与 AC-04/AC-05（产物无实现细节、含可执行任务清单）直接对症三个痛点 | 本文 §14 验收标准、D-019、R-01 |



> **节号说明**（本 stage 收尾时自查发现）：本材料沿用既有 decision-log 模板编号，
> §6 至 §13 在本任务不适用（那些编号在历史模板中承载 build-spec 之后的材料，本 stage 不产出），
> 因此 §5 Talk 之后直接是 §14 决策草稿。这不是缺节。

## 5. Talk（真实问答）

### Round 1（step 3 · 已完成 · 用户真实回复）

| 题号 | 决策轴 | 用户选择 | 结果 |
| --- | --- | --- | --- |
| R1-Q1 | 本次任务性质 | **A** 开发任务：走标准五阶段，最后真的改代码 | 本次交付物 = `workflows/build-prd`、`skills/spec-prd`、make-decision 提问契约、close 机制的真实改动 + 测试证据 |
| R1-Q2 | 改动落点 | **A** 给任务加「规划 / 开发」类型，两种类型用不同提问强度和产物粒度 | 规划任务只问方向；普通开发任务行为不变 |
| R1-Q3 | 产物粒度 | **A** 只到方向层：任务清单 + 每任务目标/边界/验收 + 共享约束；明确禁止实现细节 | 禁止文件路径、函数名、字段名、算法、测试命令、实测记录、代码片段 |
| R1-Q4 | close 与归档 | **A** 规划任务结束时提交+合并+推送+清理但跳过归档；最后一个子任务 verify-code 完成时再归档 | 需要「不归档的收口」与「延后归档」两种能力 |

用户明确未在 Round 1 决定的问题（推入 Round 2）：R1-Q4 的实现形态与 ADR 0025「不新增第二 close 入口」的约束冲突（现场核查后才发现）、「最后一个子任务」的判定口径。

### Round 2（step 5 · 研究后 · 已完成 · 用户真实回复）

| 题号 | 决策轴 | 用户选择 | 结果与代价（已披露） |
| --- | --- | --- | --- |
| R2-Q1 | 「不归档的收口」实现形态 | **B** 用已有的 commit / merge / push / cleanup 四个授权做到位，不写 close 完成记录 | 不动 close 机制、不新增控制面、不碰 ADR 0025 禁令、不影响已有测试。代价：任务记录里没有一份单独的「已收口未归档」文件，只能从授权与 Git 事实读回 |
| R2-Q2 | 「最后一个子任务」判定 | **B** 规划任务登记子任务清单，最后一个子任务完成时自动判定 | 判定有真实依据、不用手工维护。代价：任务顺序变化或某任务永不完成时会判错，判定必须允许人工推翻 |
| R2-Q3 | 篇幅边界 | **A** 只定义内容边界（只写什么 / 不写什么），不设数字 | 与既有 D35「非硬四章上限」一致。已披露风险：边界不可判定时仍可能膨胀；用户明确拒绝数字阈值 |
| R2-Q4 | 验收证据口径 | **A** 只做结构校验与单元测试，不真跑规划任务 | 成本低。已披露风险：「新流程真的会少问、真的会变短」不被实测，按仓规保持 `unknown`，不得声称已验证 |

**Round 2 用户未选推荐项的记录**：Q3、Q4 用户选择非推荐项。已在提问时逐条披露后果与风险，用户知情选择；本材料把由此产生的残余风险登记进「风险与延期」，不把它改写成通过。

### Round 2 现场核查补充事实（研究阶段产出）

- **`skills/spec-prd/SKILL.md`（166 行）与 `templates/prd-template.md`（102 行）完全没有任何篇幅 / 深度 / 粒度纪律**：`篇幅|上限|字数|最大|精简|brevity|length|budget|禁止|granularity|压缩` 全部 0 命中；唯一 `do not` 全部关于不伪造事实。相反，SKILL.md L59 要求 `complete detail cards`，模板 L56 要求「每张卡**必须完整填写**」——**skill 主动要求深挖，没有任何上限**。
- **模板只定义 8 个 `##` 章节，不含「实测记录」章节，且没有章节白名单**。实测 553,212 B 的 PRD 中，模板外的「实测记录 / 命令原文」章节占 **429,977 B = 77.7%**（63 个子节）。→ **膨胀的主因是模板外章节被自由新增**，不是模板本身太长。
- 模板卡字段实为 **16 项**（`prd-template.md` L58-73）；上一份 PRD 的 18 项中第 17、18 项是 writer 自加（其 L88 自承「不是模板新发明」）。
- **既有决定 D35（`specs/archive/workflowhub-build-prd/decision-log.md:404`，prd-core-compact-template）原文**：「默认文首导航+四正文……**非硬四章上限，复杂情形可合理增加小节。**拒绝B两章隐藏结构。」→ **D35 本身就已拒绝设上限**，与用户 R2-Q3 的选择一致，本任务不推翻 D35。
- 16 字段的母决定来源是 `specs/archive/workflowhub-build-prd/decision-log.md:67`（同见其 `spec.md:289` FR-PRD-002、`:295` FR-PRD-003）。
- **D35 有一处未实现的缺口**：D35 要求「产品总览（目标/范围/**完整旅程/需求覆盖**）」，而现行模板 L19-23 只有母决定 / 目标与范围 / 非目标 / 设计适用性 / 当前状态——**缺「完整旅程」与「需求覆盖」**。
- **改动风险硬事实**：`tests/contract/spec-prd-skill-contract.test.mjs` L222-247 对模板断言 20 个 token 必须存在，**删改 16 字段名中任何一个都会破测**；L266-284 逐文件校验 `skill-bundle.json` 的 sha256，**任何对 SKILL.md / 模板的编辑必须同步重算 `skill-bundle.json` 与 `skills/catalog.yaml` 的 `local_bundle_hash`**。`tests/integration/build-prd-delivery.test.mjs` 对 PRD 内容不敏感（fixture 只有 5 行桩）。
- **`spec-prd` 无 runtime 消费者**：`runtime/`、`core/`、`tools/`、`config/`、`scripts/` 全部 0 命中；消费者只有 `skills/catalog.yaml:250-264`、`repo-skills.manifest.json:119-126`、`workflows/build-prd/skill-deps.yaml:3`、两个 contract 测试。
- `workflows/build-prd/steps.json` 的 step 2 与 step 4 `observable_result` **都不约束深度**（step 4 只说「one PRD draft」）。

### Round 3（step 7 · 方向审查后 · 已完成 · 用户真实回复）

本轮的输入是 4.7.1 的审查争议清单与事实，不压缩成通用摘要。

| 题号 | 决策轴 | 用户选择 | 结果 |
| --- | --- | --- | --- |
| R3-Q1 | 归档触发与「自动」的含义 | **B** 只做自动判定，**不自动执行**；归档仍由用户明确下令 | 修正 R2-Q2 的措辞歧义：R2-Q2 说的是「自动**判定**该归档了」，不是「自动归档」。延期项「无人值守自动归档」继续成立，与 R2-Q2 **不再矛盾** |
| R3-Q2 | 「该不该归档」判定装在哪边 | **B** 子任务 verify-code 多做一次**只读**检查，结论写进它自己的代码审查记录 | 子任务不搬任何文件、不碰母任务材料，只产生一条结论事实；母任务据此算出「可归档」。verify-code 的「只验证、不触发 close」隔离保持 |
| R3-Q3 | make-decision 提问底线 | **A + 用户修正**：当前任务本身是**实现任务**，所以本次问实现细节没问题；**规划任务**才不问这些 | **关键澄清**：提问边界是**按任务类型**分的，不是全局一刀切的 |

**R3-Q3 用户原话（未改写）**：
> A。当前任务就是一个实现任务，所以问这种细节问题没问题。但是规划任务就不要问这些了。

**由此确立的口径**：
- 提问边界属于**任务类型维度**：实现任务照旧（可以问数据状态、页面范围、失败边界、文件面、入口形态等）；规划任务只问方向层（用户可见行为、任务类型范围、不变量、约束、非目标、延期）。
- 审查 finding #11 的处置因此修正：**不把 OI-06 / OI-09 / OI-13 / OI-14 从本任务移除**——本任务是实现任务，问这些是正确的。真正要修的是**规划任务缺这个边界**。
- 审查 finding #2 仍然成立并已修复：「只改 build-prd 局部」作为痛点 1 的备选是无效的，因为 build-prd 在 make-decision 之后才运行。

### Round 3 后修正的 OI 状态

| OI | 修正后状态 | 依据 |
| --- | --- | --- |
| OI-01 / OI-02 / OI-03 / OI-04 | answered | 现场核查（4.1–4.5）+ R1 |
| OI-05 / OI-06 / OI-07 / OI-08 | answered | R1-Q2/Q3、R2-Q3、R3-Q3 |
| OI-09 | answered | R2-Q1、R3-Q1 |
| OI-10 | answered | R3-Q1、R3-Q2（改为「自动判定、人工归档」＋「只读检查落在 verify-code」） |
| OI-11 / OI-12 | answered | R2-Q4 |
| OI-13 / OI-14 | answered | R3-Q3（本任务为实现任务，可问；宪法硬约束由 findings #13 固化为非目标） |
| OI-15 / OI-16 / OI-17 / OI-18 | answered | R1–R3 |
| OI-19 / OI-20 | answered | R1、R2-Q3、R3-Q1，并按 finding #8 去掉未经确认的锚定项 |

### Grill（step 8 · 交互式思考，不产生 review）

Grill 只做交互式思考，不调用 `wh-review`、不产生 review fact。本轮 4 个问题互相独立，一批发出；依赖项按真实回答后再拆批。


#### Grill 批次 1（4 个互相独立问题 · 用户真实回复）

| 题号 | 问题 | 用户选择 | 影响 |
| --- | --- | --- | --- |
| G1 | 任务类型会不会中途变 | **B** 可以中途改 | 类型不能在 make-decision 关心太晚才确定；见 D-009 |
| G2 | 规划任务里的子任务是否一律开发任务 | **用户修正**：不一定全是开发任务，还可能是调研、可行性测试、设计 | 推翻「规划 vs 开发」二分；类型是每个任务自己的属性 |
| G3 | 规划任务的产物算几份 | **用户修正 + A**：decision-log 仍和现在一样（只是不要那么多实现细节），prd 需要精简 | 保留两份材料；只压缩内容，不改材料集合 |
| G4 | 子任务能不能用与母任务边界不同的做法 | **A** 允许不同做法，但子任务必须记下「与母任务边界的差异」 | 子任务保留实现自由；差异须留痕 |

#### Grill 批次 2（依赖批次 1 的澄清 · 用户真实回复）

| 题号 | 问题 | 用户选择 | 影响 |
| --- | --- | --- | --- |
| G5 | 本次管到哪几种任务类型 | **A** 本次只实现「规划 vs 普通」两类，其他类型（调研/可行性测试/设计）只留位置、行为不变 | 限定本次实现范围；避免把「修三个痛点」扩成「重建任务分类体系」 |
| G6 | 「最后一个子任务」按什么算 | **A** 清单里列出的子任务全部完成 | 判定依据＝prd 任务清单；须允许用户手工标记「这个不做了」 |

#### Grill 四项退出检查

1. **方向是否被挑战过**：是。Grill 推翻了「规划 vs 开发」二分（G2），并暴露「类型可中途变」（G1）与「判定依据是清单而非最后一个」（G6）。
2. **是否产生新的未决方向**：否。G1 的残余风险已作为 D-009 的可观察失败条件登记，不再需要用户额外决策。
3. **是否产生 review fact**：否。Grill 全程未调用 `wh-review`，不产生 review。
4. **是否有依赖后续回答的问题**：否。批次 2 的两个问题已在本轮真实回复中收敛。

**Grill 结束记录（CONTEXT / ADR 影响）**：本任务需要更新 `CONTEXT.md` 的任务类型术语，并新增/更新一条 ADR 记录「规划任务与实现任务的提问边界」；是否需要新增 ADR 由 build-spec 阶段按现行 ADR 判据判断，本阶段只登记影响，不预先创建。

## 14. 决策草稿（step 9 产出 · step 10 细节审查后修订）

### 核心需求

用户上一个规划任务（`workflowhub-mechanism-simplification-20260910`）走的流程有三个真实缺陷：规划任务的 make-decision 问了 16 个实现细节级问题；规划产物臃肿到 792,671 B 且不可逐任务执行；build-prd 跑完既没有复盘也没有收口。本任务交付对这三处的真实修复。

### 核心目标

下次发起一个**规划任务**时：它只被问方向层问题；它的 decision-log 不再堆实现细节、prd 明显精简；build-prd 跑完会复盘并做一次「不归档的收口」；子任务接手时不需要重读母任务材料重做方案设计；最后一个子任务完成时系统算出「母任务可以归档了」并告知用户。

### 目标、用户流程与边界

#### 改造后的完整用户流程

| 步 | 执行者 | 动作 | 可观察结果 |
| --- | --- | --- | --- |
| 0 | 用户 | 明确下达「按标准 WorkflowHub 做这个优化任务」并给出原始需求 | — |
| 1 | 主会话 | `task-bootstrap` 创建任务与认证 worktree | worktree 路径、branch、baseline 三者返回（原始需求硬约束：先建 worktree） |
| 2 | 主会话 | 进入 `make-decision`，**先确定任务类型**（规划 / 普通） | 任务类型有唯一来源，且被写入可读事实 |
| 3 | 主会话 | 按任务类型决定提问强度：普通任务照旧；规划任务只问方向层 | 规划任务的 Talk 里不出现实现机制问题 |
| 4 | 主会话 | 完成 Talk / Grill / 方向审查 / 细节审查 / 用户确认（原始需求硬约束：不跳阶段） | 阶段事实与用户确认齐备 |
| 5 | 主会话 | 写 decision-log（材料结构不变，去掉实现细节） | decision-log 仍是四份材料之一 |
| 6 | 主会话 | 跑 `build-prd` 产出精简 prd；**不依赖 build-spec 补需求** | prd 只到方向层 |
| 7 | 主会话 | build-prd 阶段末**复盘**（走非 stage 的 `reflection_facts` 通道） | 复盘事实真实写入 |
| 8 | 主会话 | 做一次**不归档的收口**：commit / merge / push / cleanup 按既有独立授权完成，跳过 archive-spec | 物理动作读回成功；无 close 完成记录 |
| 9 | 用户 | 逐个发起 prd 里的子任务，每个子任务走自己的标准五阶段 | 每个子任务有自己的四份材料 |
| 10 | 子任务 | 若实现做法与母任务边界不同，记下差异 | 差异可追溯 |
| 11 | 子任务 | verify-code 收尾时多做一次**只读**检查，结论写进自己的代码审查记录 | 母任务可据此算出「还差几个」 |
| 12 | 用户 | 明确下令归档母任务 | 归档是唯一不可逆动作，仍由人确认 |

#### 违反硬约束时的可观察失败条件

- 未先建 worktree 就开始 stage：`task-bootstrap` 拒绝，任务身份不成立。
- 跳过中间阶段：下游 stage 缺当前材料，正式完成事实保持 `incomplete`。
- 用 build-spec 补产品方向：build-spec 只处理规格歧义，方向缺口须回 make-decision。
- 规划任务被问到实现机制问题：**这是本任务要消除的失败**，验收以「规划任务 Talk 中实现机制问题的数量为 0」判定。

### 范围

- 任务类型（规划 / 普通）的识别与唯一来源；其他类型（调研 / 可行性测试 / 设计）只留位置，行为不变。
- `make-decision` 在规划任务下的提问边界与产物纪律。
- 规划任务 decision-log 与 prd 的内容边界（只写什么 / 不写什么，不设数字阈值）。
- `workflows/build-prd` 的阶段末复盘与步骤契约。
- 规划任务的「不归档收口」与「可归档判定」。
- 子任务 verify-code 的只读归档判定检查，以及子任务「与母任务边界差异」的记录要求。
- 上述改动所需的 skill、模板、bundle hash、catalog hash、测试与最小文档同步。

### 非目标

- 不改五阶段拓扑，不新增第六个 stage。
- **不新增公共命令、新 schema 或新控制面**（宪法：没有当前消费者的重复控制面不新增）。本任务只允许使用既有消费者与扩展点；审查 finding #13 已把此条从「开放选项」固化为硬约束。
- 不重写或重做已归档的历史材料（含 `specs/archive/workflowhub-build-prd`）。
- 不改变普通（实现）任务的提问强度与产物粒度。
- 不把 `planning` close 模式改成「不归档」（该模式已被测试覆盖，本任务不动它）。
- 不实现无人值守自动归档。

### 延迟项

- 无人值守自动归档（用户 R3-Q1 明确延期）。
- 调研 / 可行性测试 / 设计三种任务类型的提问与产物规则（G5）。
- 旧的两份臃肿材料（239,459 B decision-log + 553,212 B prd）的重写或精简。
- 一份「已收口未归档」的独立 close 记录文件（用户 R2-Q1 接受该代价）。

### 验收标准

| AC | 场景 | 通过条件 | 失败条件 |
| --- | --- | --- | --- |
| AC-01 | 规划任务的 make-decision 提问 | **产物结构口径**（不依赖真跑规划任务，与 D-019 一致）：规划任务的提问材料中，属于 **D-004 唯一权威清单**（10 类）的问题数量为 0 | 出现任一属于 D-004 清单的问题 |
| AC-02 | 普通任务的 make-decision 提问 | 普通任务行为与本任务改动前一致（可问实现细节） | 普通任务被一并收紧 |
| AC-03 | 任务类型的唯一来源 | **（2026-09-11 经 D-026 更正口径）** 类型可在**既有材料** `specs/<task-id>/decision-log.md` 中唯一读出（显式声明；缺声明时**不得推断**，按 `unknown` 回报），规划 / 普通两类可区分，且**不新增 schema 或字段** | 类型无处可读、存在两个互相冲突的来源、缺声明时被推断、或靠新增 schema 才成立 |
| AC-04 | 规划产物的内容边界 | 按 **D-004 唯一权威清单**（10 类）逐类检查，10 类在 decision-log 与 prd 中均不出现；材料结构不变；规划 prd 不新增模板未定义的章节（章节要求见 D-006）。残余膨胀风险见 R-02（已知，不因此判通过） | 10 类中任一类出现，或新增模板外章节 |
| AC-05 | 规划产物的可执行性 | prd 里有任务清单，且每个任务有目标 / 边界 / 验收 / 依赖 | 无任务清单，或任务缺目标或验收 |
| AC-06 | 子任务接手 | 子任务能在有限上下文内从 prd 接手，不需要重读母任务 decision-log 的实现细节、也**不需要重做母任务的方向决策**；子任务仍按标准流程做自己的实现设计 | 必须重读母材料才能开工，或子任务被要求跳过自己的设计阶段 |
| AC-07 | build-prd 阶段末复盘 | 复盘事实真实产出、内容非空、绑定当前 task 与阶段；生产失败时如实记 `unavailable` | 无复盘、空记录被当作通过、或不可用却记为完成 |
| AC-08 | 不归档收口 | commit / merge / push / cleanup 按既有独立授权完成并物理读回；archive-spec 未执行 | 归档被执行，或物理动作未读回 |
| AC-09 | 可归档判定与告知 | **（2026-09-11 经 D-027 更正口径）** 母任务清单的完成情况以**用户人工声明**为准（「已全部完成，可归档」或「还有 N 项未做」，声明被如实记录且可回查）；未全部完成时不得宣告可归档；用户可标记某项「不做了」，被标记项不计入未完成。**不要求机器读清单或计算差额** | 提前宣告可归档；或用户未声明即被当作可归档 |
| AC-10 | 归档仍由人确认 | 判定通过后，归档动作仍需用户明确下令才执行 | 自动执行归档 |
| AC-11 | 子任务差异留痕 | 子任务实现做法与母任务边界不同时，差异被记录且可追溯 | 差异无处可查 |
| AC-12 | 不新增控制面 | 改动不新增公共命令、schema 或控制面 | 新增了任一未登记控制面 |
| AC-13 | 既有契约不破 | `spec-prd-skill-contract` 等既有测试通过；模板 16 字段名保留；`skill-bundle.json` 与 `catalog.yaml` hash 同步一致 | 既有契约测试失败或 hash 不一致 |
| AC-14 | 规划任务确实问了方向层 | **产物结构口径**（不依赖真跑规划任务，与 D-019 一致）：规划任务的提问材料中，方向层六类（完整用户流程、页面范围、数据状态、成功/失败边界、非目标、延期）各有槽位，且每类有真实用户回答或 `empty` 加具体理由 | 任一类无槽位、缺失、只写 none、或改名替代 |
| AC-15 | 任务类型中途改变 | 类型改变后，按旧类型产生的提问与产物被重新按新类型处置；未重新处置的不得被消费 | 旧类型产物被当作合规结果继续消费 |
| AC-16 | 不波及普通任务 | 规划任务的任何新增要求（含「完整旅程 / 需求覆盖」，若按 D-006 保留）只作用于规划任务；**普通任务的模板与产物粒度与本任务改动前一致** | 普通任务被一并要求或改变 |
| AC-17 | 子任务只读检查的边界 | 子任务检查不写母任务材料、不写兄弟任务记录、不触发 close、不搬文件 | 发生任一写入或搬运 |
| AC-18 | Talk 与 Grill 的表述方式 | 每题的选项含大白话选项、直接后果与主要风险 | 只给编号或术语、无后果与风险 |

### 决定

#### D-001 三个痛点各有独立根因，不合并处理

- 痛点 1 根因：`make-decision` 的提问规则里没有「规划任务」概念（其 SKILL.md / steps.json 里 `prd|planning|规划` 0 命中）。
- 痛点 2 根因：双层缺失——`spec-prd` 模板无章节白名单（放行占 77.7% 的模板外「实测记录」），skill 无篇幅纪律反而要求 `complete detail cards`。
- 痛点 3 根因：`build-prd` 无复盘步（steps.json 无 `on_stage_end`），且归档在 close 五步里被写死不可跳过。
- 三者互不依赖，可独立修复与独立验收；不合并成一个大改。

#### D-002 核心杠杆是「任务类型」，不是全局收紧提问规则

规划任务与实现任务的提问边界不同（用户 R3-Q3 原话确认）。全局收紧会破坏普通任务的上游信息完整性，而普通任务在上游把数据状态、页面范围、失败边界问清楚是正确行为。因此改动落在**任务类型维度**上。

#### D-003 痛点 1 的修复落点只能是 make-decision

`build-prd` 在 make-decision 之后才运行，改它拦不住提问膨胀（方向审查 finding #2，已当场修复备选列表）。修复必须发生在 make-decision 的提问决策点。

#### D-004 规划任务的提问边界（只问什么 / 不问什么）

- 只问：用户可见行为与结果、任务类型范围、工作流程（谁在什么时候看到什么、下一步谁做）、完成与失败条件、不变量、约束、非目标、延期。
- **不问（唯一权威清单，共 10 类，其他条目一律引用本清单）**：
  1. 文件路径与文件面；2. 函数名；3. 字段名；4. 算法；5. schema 形状；6. 命令形态；
  7. 入口参数形态；8. 行号；9. 代码片段；10. 测试记录与实测记录。
- 本清单是 `make-decision` 在规划任务下的**唯一**提问禁项口径；任何其他条目（D-005、D-006、AC-01、AC-04）都只引用本清单，不得另立第二份措辞。
- 这些不问项**必须**在子任务自己的 make-decision / build-spec / build-plan 里定。

#### D-005 规划任务 decision-log 的内容边界

材料结构不变（仍是 decision-log）。保留：原始需求、方向决定与理由、用户流程、任务清单与依赖、共享约束、成功失败边界、非目标、延期、风险。移除：实现细节段。不设数字阈值（用户 R2-Q3；与既有 D35「非硬四章上限」一致）。

#### D-006 规划任务 prd 的内容边界

保留：导航、产品总览（含**完整旅程与需求覆盖**）、共享定义、任务地图（任务清单＋依赖）、任务卡、风险与交付说明、变更说明。

**「完整旅程与需求覆盖」的来源（stage-end 一致性检查修复：内容边界的来源澄清）**：该要求来自既有母决策 **D35**（`specs/archive/workflowhub-build-prd/decision-log.md:404` 要求产品总览含完整旅程与需求覆盖，现行模板 L19-23 缺此项），**不是本任务新增的范围**；它只作用于规划任务的 prd，不触碰普通任务模板（AC-16）。若用户不接受，可直接移除该条而不影响本任务其余决定。移除：模板外新增的「实测记录 / 命令原文」类章节。任务卡字段名保留（既有契约测试断言 16 个字段名），但**每卡的填写深度以方向层为限**。

#### D-007 prd 必须有可执行的任务清单

每条任务至少含：目标（结果）、边界、验收（怎么算完成）、依赖。这是痛点 2 的直接对症项——旧材料的 decision-log 里 grep `Goal` 为 0 命中，30 条 acceptance 绑在 OI 问题上而非任务上。

#### D-008 任务类型是每个任务自己的属性，不是「规划 vs 开发」二分

用户 G2 修正：子任务可能是调研、可行性测试、设计，不一定全是开发任务。本次只实现「规划 vs 普通」两类（G5），其他类型只留位置、行为不变。

#### D-009 任务类型可以中途改，但 make-decision 必须在提问前确定它

用户 G1 选择可中途改。为兼顾该选择与痛点 1 的修复目标，规定：make-decision 在开始提问前必须确定当前类型并按它提问；若类型在阶段中途改变，**已按旧类型产生的提问与产物必须重新按新类型处置**，不得沿用。
- 可观察失败条件：规划任务里出现实现机制类提问（AC-01 不通过）。
- 未解决残余风险：类型判断本身出错时，仍可能先按错误类型问一轮。该风险登记在案，不声称已被消除。

#### D-010 build-prd 阶段末必须有复盘

复用非 stage 通道：`runtime/review/stage-materials.json:59` 的 `non_stage.build_prd.optional` 已声明 `reflection_facts`（当前无生产者、无消费者），本任务补齐生产者与消费者。
- 不接五阶段专属的 `stage-reflection` / `stage_outcome` 强闭环（那会撞上 6 处 stage 身份硬耦合，且 portable 白名单禁止 `stage_outcome`）。
- 不新增 stage、不新增 store。

#### D-011 收口形态：物理动作按既有独立授权做到位，不写 close 完成记录

用户 R2-Q1 选择。锚点是宪法 `CONSTITUTION.md:179` 已有的「阶段收口 close」语义（「可能触发也可能不触发交付动作集」）。
- 执行 commit / merge / push / cleanup 四个既有独立授权动作；**跳过 archive-spec**；**不写 `operations/close/completed.json`**。
- 不新增闭包模式，不改 `DELIVERY_STEPS`、`PHYSICAL_DELIVERY_FACTS`、archive executor、`--mode=planning`。
- 接受代价：没有一份单独的「已收口未归档」记录，只能从授权与 Git 事实读回。

#### D-012 可归档判定：自动判定，人工归档

用户 R3-Q1 选择。判定算出「清单内子任务是否全部完成」，但**归档动作仍须用户明确下令**，不自动执行。延期项「无人值守自动归档」继续成立。

#### D-013 判定依据是 prd 任务清单，不是「最后启动的那个」

用户 G6 选择 A。清单内子任务全部完成＝可归档。
- 必须允许用户手工标记「某任务不做了」，否则该任务永不完成会让母任务永远归档不了。
- 未全部完成时不得算出可归档（AC-09 的失败条件）。

#### D-014 只读判定检查落在子任务 verify-code

用户 R3-Q2 选择 B。子任务 verify-code 多做一次**只读**检查，结论写进它自己的代码审查记录：
- 不搬文件、不改母任务材料、不触发母任务的 close。
- 因此不破坏「verify-code 只验证、不触发 close」的阶段隔离。

#### D-015 子任务与母任务边界差异必须留痕

用户 G4 选择 A。子任务允许选与母任务边界不同的实现做法，但必须记录「母任务当时定的边界是什么、现在为什么不同」。

#### D-016 不新增公共命令、schema 或控制面

宪法硬约束（审查 finding #13）。只允许使用既有消费者与扩展点（例如 `non_stage.build_prd.optional.reflection_facts`、既有 `authorize` 动作粒度、既有 `task_runtime` 事实写入路径）。

#### D-017 改动必须同步既有契约的 hash

`tests/contract/spec-prd-skill-contract.test.mjs` L266-284 逐文件校验 `skill-bundle.json` 的 sha256；`skills/catalog.yaml:253` 有 `local_bundle_hash`。任何对 `SKILL.md` / 模板的编辑必须同步重算，否则破测。
- 模板 L58-73 的 16 个字段名不得删改（L222-247 会失败）。
- `workflows/build-prd/skill-deps.yaml` 与 `repo-skills.manifest.json` 如声明变化须同步。

#### D-018 旧材料保持只读，不重写

上一份臃肿材料保留为反例与来源事实。本任务不重写、不精简、不迁移它（非目标）。

#### D-019 验收口径：结构校验与单元测试，不真跑规划任务

用户 R2-Q4 选择 A。据此：
- 本任务**不**用一条端到端的新规划任务证明「新流程真的会少问、真的会变短」。
- 该结论按仓规保持 `unknown`，不得在任何材料里声称已验证。
- 残余风险已在提问时逐条披露，登记在风险与延期，不改写成通过。

#### D-020 本任务自己是实现任务

按用户 R3-Q3 原话，本任务走标准五阶段、问实现细节是正确的；本任务不改自己的提问强度。规划任务的边界是给**规划任务**用的。

#### D-021 母任务可归档的判定与告知链路

- **判定**：清单内子任务全部完成 ⇒ 可归档（依据 G6／D-013）。
- **告知**：子任务在 verify-code 的那次**只读**检查里，除自身完成结论外，还读**母任务登记的清单**与**清单内兄弟任务的完成事实**，算出差额，在**自己的代码审查记录**里写一行结论：「母任务 XXX 的清单共 N 项，已完成 M 项，剩 N−M 项」或「清单已全部完成，母任务可归档」。
- **边界**：该检查只读——不写母任务材料、不写兄弟任务记录、不触发任何 close、不搬文件。
- **执行**：归档仍须用户明确下令（D-012 不变），不自动执行。
- **口径**：用户可手工把某任务标记为「不做了」，被标记项不计入未完成（D-013 不变）。
- **对 R3-Q2 的精确化**：R3-Q2 的「不碰母任务材料」指不写、不改、不搬；本轮按用户选择允许**只读**母任务清单与兄弟任务完成事实。这是同一语义的精确化，不是推翻。
- **前置风险**：清单的登记位与读取位必须在**既有**结构中选定（R-07）。若 build-spec 无法在既有结构中指认承载处，须回报 make-decision，并暂停 AC-03／AC-09 的验收，不得默默新增 schema 或命令。

#### D-022 原始需求中的执行纪律条款不进入验收

原始需求含一条操作约束「注意主会话上下文控制和子代理派发」。它的可观察口径是：**重读量动作（全仓扫描、多文件对标、跑测试取证）由子代理在独立上下文执行，主会话只收结论摘要**。
- 处置：登记为**执行纪律**，**不作为验收条款**（stage-end 一致性检查：执行纪律不作为验收项）。理由：它约束的是执行方式，不是交付物属性；把它写成 AC 会产出不可判定的验收项，与本任务「验收必须可判定」的口径冲突。
- 事实归属：该纪律的真实执行事实落在 §4 各条「由只读子代理在独立上下文核实」的来源标注上，可回查。

#### D-024 自指循环的精确根因与修复形状（含一次失败尝试的更正）

**用户裁定**：纳入本任务交付范围，先解自指循环（2026-09-11）。

##### 三层约束（实测确定，缺一不可）

`runtime/stage/stage-handlers.mjs:608-613` 的 `interactionAggregateFacts` 要求**同时**成立：

1. `value.snapshot_tree === expected.snapshot_tree`（当前**工作树**快照，含 `decision-log.md`）
2. `decision.ref === expected.decision_ref`（当前决策记录的 ref）
3. `decision.hash === expected.decision_hash`（当前决策记录**字节**的 sha256）

我最初只盯着约束 1，以为「去掉快照比较、改由 `decision.hash` 承担绑定」即可。

##### 实测更正（该判断是错的）

写一个无关字节进 `decision-log.md` 后实测：

| 量 | 改动前 | 改一字节后 | 还原后 |
| --- | --- | --- | --- |
| `snapshot_tree` | `76fe6c8808b5…` | `59e9052ba23e…` | `76fe6c8808b5…` |
| `decision_hash` | `82d46234b934…` | `89938b754140…` | `82d46234b934…` |

**两者都随日志字节变化。** 因此约束 1 与约束 3 **不是冗余关系**——它们各自都以「日志尚未写入证明」为前提。把约束 1 去掉后，约束 3 立刻以同样方式失效（已实测：改后 run 仍报 `does not bind`）。

**我据此把那次改动完整回退，`runtime/` 无残留改动**（`git diff runtime/` 为空）。

##### 精确根因

核心 OI 记录**必须写在 `decision-log.md` 内**，且必须携带 `interaction_ref` + `interaction_hash`；
而这两个值指向的 aggregate 又必须绑定**该日志写完之后的**快照与哈希。
「证明的内容取决于写入证明之后的文件状态」——**这是内容自指，不是顺序问题，无法用调整写入次序解决。**

##### 该契约从未被满足过（旁证）

- 本仓 20+ 个已发布 aggregate 的 `oi_dispositions` **全部为 0**。
- 唯一覆盖该路径的测试 `tests/contract/decision-convergence-depth.test.mjs` 使用**符号夹具**
  （`ref: "interaction-1"`、`sha256: OUTLINE_HASH`，且**没有真实工作树**），因此从未 exercise 约束 1 与 3。

##### 修复形状（待定，需要用户裁定）

自指只能用**三者之一**打破，且各有明确代价：

| 方案 | 做法 | 代价 |
| --- | --- | --- |
| A | 核心 OI 不再内嵌 `interaction_ref`/`interaction_hash`，改由 aggregate 的 `oi_dispositions` **单向**绑定 | 违反现行 skill 明文要求；需改 `analyzeDecisionOutline` 与 skill；但**彻底消除自指**，且 aggregate 已是内容寻址，防伪性不下降 |
| B | 证明移到日志之外（如独立记录文件），日志只引用该文件的 ref | 需新增一个非材料记录面，可能触及「不新增控制面」边界 |
| C | 绑定改比「内容族」而非精确字节（例如按 OI 记录集合 + 决策区块计算指纹，排除该块自身） | 需定义新的稳定指纹算法，实现与测试面最大，且要防伪造 |

**本任务范围登记为 D-024（解自指循环），但方案未定**：A/B/C 属于方案层选择，按 R3-Q3 确立的口径，应由后续阶段或用户裁定，不在 make-decision 敲定实现细节。

#### D-024 实施结果（方案 A，已完成）

**用户裁定方案**：A —— 核心 OI 不再内嵌 `interaction_ref`/`interaction_hash`，改由 aggregate 的
`oi_dispositions` **单向**绑定。

**实际改动（3 处生产代码/契约 + 1 处文档 + 1 处测试）**：

| 文件 | 改动 |
| --- | --- |
| `runtime/stage/stage-content-contracts.mjs` | `analyzeDecisionOutline` 的 core 分支：不再要求 `record.interaction_ref`/`interaction_hash`，改以 aggregate 的 `oi_dispositions` 绑定为准（task/version/oi/group/disposition 五项全等）。旧记录仍可读，只是不再是凭证来源 |
| `skills/decision-log/SKILL.md` | 明文改为单向绑定，并写明为什么不能内嵌（自指无不动点） |
| `skills/decision-log/templates/decision-log-template.md` | 移除 `interaction_ref`/`interaction_hash` 两行，改为说明单向绑定 |
| `skills/decision-log/skill-bundle.json` | 重算两个文件 sha256 与 bundleHash（`319ccc53…`） |
| `skills/catalog.yaml` | `local_bundle_hash` 同步为 `319ccc53…` |
| `tests/contract/decision-convergence-depth.test.mjs` | 夹具去掉内嵌 ref；新增 2 条回归：①记录内**不得**出现 ref/hash 且仍能闭合；②旧记录带 ref/hash 仍可读 |

**实测结果（同一 task、同一 run 命令）**：

| 阶段 | `outline_closed` 阻塞项 | 说明 |
| --- | --- | --- |
| 改动前 | 19 条 | 全部是 `core interaction proof is missing or invalid` / `does not bind` |
| 改动后 | **1 条** | 只剩 `direction review is missing current convergence_outline questions-only snapshot` |

其余四个 component 现为 `structure: passed`、`no_open_items: passed`、`terminal_fields: passed`、`interaction_proof` 仅剩上述 1 条影响。

**测试**：`tests/contract/decision-convergence-depth.test.mjs` 10/10 通过；`tests/decision-log-content-contract.test.mjs` 3/3 通过。

**顺带确认的两个既有缺陷（不属本任务，仅登记）**：

1. `skills/wh-review/skill-bundle.json` 的 `scripts/review-materials.mjs` sha256 与磁盘不一致，**主仓 `main` 同样不一致**，导致 `tests/contract/spec-stage-artifact-closure.test.mjs` 在改动前就已失败。
2. `direction review` 缺少 `convergence_outline` questions-only 投影：该投影在**运行时没有任何生产者**（grep 全仓 `runtime/` 只命中消费侧 `normalizeOutlineReview`）。因此 `outline_closed` 的 `direction_snapshot` 分量在当前代码下**无法满足**，这是独立于自指的第二个缺口。

**新增登记**：

| 编号 | 内容 | 类型 |
| --- | --- | --- |
| D-025 | `direction review` 必须携带当前 `convergence_outline` questions-only 投影（含 `task_id`、`outline_version`、逐 OI 的 `oi_id`/`category`/`source`/`question`，展示状态统一 `open`），使 `outline_closed` 的 `direction_snapshot` 可满足 | 决定（待实施，范围待用户确认） |

#### D-025 实施结果：为 `convergence_outline` 提供确定性生产者（已完成）

**用户裁定**：一并纳入本任务（2026-09-11）。

**缺口事实**：`convergence_outline` 在**运行时没有任何生产者**——
`runtime/review/stage-materials.json` 把它声明为 `make-decision/direction` 的 semantic field，
但裸 sink 路径与 record 路由**都不计算 semantic projection**，已记录的 review result 里
`semantic_projection` 与 `semantic_fields` 均为空，`normalizeOutlineReview` 的五个候选位置全部落空。
因此 `outline_closed` 的 `direction_snapshot` 分量在当前代码下无法满足。

**实施**：在 `analyzeDecisionOutline` 内新增 `deriveQuestionsOnlyOutline`，当 review fact 未携带投影时，
从**同一份** OI 权威确定性派生 questions-only 投影。

- 只暴露契约允许的五个字段（`oi_id`/`category`/`source`/`question`/`status`），展示状态统一 `open`；
- 不新增持久对象、不新增第二份投影、不改 review 记录 schema；
- 是既有 OI 权威的**读侧派生视图**，不是新状态。

**判定**：这也修掉了一个**契约落差**——`analyzeDecisionConvergence` 的文档要求 direction review 消费该投影，
但没有任何生产者把它接上；本次把消费侧与生产侧接通。

**实测结果（同一 task、同一 run 命令）**：

| 分量 | 改动前 | 改动后 |
| --- | --- | --- |
| `structure` | passed | passed |
| `direction_snapshot` | **missing** | **passed** |
| `no_open_items` | passed | passed |
| `terminal_fields` | passed | passed |
| `interaction_proof` | **missing**（19 条） | **passed** |

`analyzeDecisionOutline` 现返回 `ok: true`、`errors: []`。官方 run 的 `missing_items` 从 20 条降到 **19 条，且全部是 finding disposition**，不再有任何 `outline_closed` 阻塞项。（该 19 条随后经补齐 finding disposition 一并清零，最终 `missing_items: 0`；最终状态见文末 `## 阶段收口状态`。）

**测试**：`tests/contract/decision-convergence-depth.test.mjs` 10/10 通过（其 6 个"缺一分量即不闭合"的负向用例全部仍然成立）。

### 风险与延期

| 项 | 内容 | 状态 |
| --- | --- | --- |
| R-01 | 新流程的「少问、变短」无实测证据（D-019） | 已知残余风险，保持 `unknown` |
| R-02 | 内容边界无数字阈值，可能仍膨胀（用户 R2-Q3） | 已知残余风险；靠「只写什么/不写什么」清单缓解，靠结构校验兜底 |
| R-03 | 任务类型判断出错时可能先按错误类型问一轮（D-009） | 已知残余风险，不以机制消除 |
| R-04 | 清单内某任务永不完成会让母任务永远归档不了 | 由 D-013 的「手工标记不做了」缓解 |
| R-05 | 不写 close 完成记录导致收口状态不易回查 | 用户 R2-Q1 已知接受 |
| R-06 | 改 SKILL.md / 模板会连带破 bundle hash 契约 | 已由 D-017 固化为必做项 |
| R-07 | 任务类型的承载处、以及母任务清单的登记位／读取位尚未指认（宪法禁止新增 schema / 控制面，D-016；§4.5 已证全仓无任何 task↔task 链字段） | **已处置（2026-09-11）**：build-spec 首个可写步骤实测确认两项在既有结构中**均无法指认**（AC-03 判 `no`），已按协议回报 make-decision；用户裁定 **D-026**（类型改由既有材料 `decision-log.md` 承载，不新增 schema、不新增字段）与 **D-027**（归档判定降级为人工声明，不建机器清单、不建 task↔task 链）。**AC-03／AC-09 的验收暂停就此解除**（两条口径已同步更正）。完整依据见文末「增量决策」节 |
| R-08 | 阶段末未按 manifest 逐条核对，导致 step 13/14 可被静默跳过 | 风险（已实际发生）；由 D-023 处置 |
| R-09 | 解自指循环会改动 runtime 的绑定语义，影响所有走 v2 aggregate 契约的任务 | 由 D-024 处置；已有能复现自指的回归测试，且未放宽到「任意快照差异都可接受」 |
| R-10 | `direction_snapshot` 分量无生产者：`convergence_outline` 从不进入 direction review fact，`outline_closed` 因此无法闭合 | 风险（已实测）；由 D-025 处置 |
| DEFER-01 | 无人值守自动归档 | owner=用户；触发=用户显式要求取消人工归档确认；消费者=规划任务的归档动作；关闭条件=该能力被实现并经审查，否则永久保留人工确认 |
| DEFER-02 | 调研 / 可行性测试 / 设计三类任务的规则 | owner=用户；触发=出现第一个此类真实任务；消费者=该类任务的 make-decision；关闭条件=三类规则各自成文并实现 |
| DEFER-03 | 旧两份臃肿材料的重写 | owner=用户；触发=用户要求重做，或该材料进入实际实施；消费者=后续子任务；关闭条件=材料被重写，或明确永久只读 |
| DEFER-04 | 独立的「已收口未归档」记录文件 | owner=用户；触发=「收口状态不可回查」成为真实痛点；消费者=close 读回；关闭条件=新增该记录，或明确永久不新增 |

### 未决项

无。所有 OI 均已收敛为 `answered` 或由用户明确延期。

---

## 阶段收口状态（如实记录，不伪造通过）

**用户裁定（2026-09-11 · 最新 · 取代此前「不推进、等人工介入」）**：

> **接受本阶段带 `incomplete` 收口；复盘与交接如实记为真实 `unavailable`；进入 build-spec。**

用户明确选择**不补做、不等待、不伪造**。此前一节记录的「不推进、等人工介入」是修复自指循环之前的旧裁定，已被本裁定取代，不作为当前收口依据。

**运行时实际收口状态（`run --action=execute` 现场输出）**：

| 字段 | 值 |
| --- | --- |
| `status` | `in_progress` |
| `work_status` | `ready` |
| `continuation_allowed` | `true` |
| `quality_status` | `incomplete` |
| `missing_items` | **0**（不再有任何结构阻塞项） |
| `stage_outcome_status` | `unavailable` |
| `stage_outcome_diagnostic` | `{status: unavailable, reason: stage_outcome_missing}` |
| `stage_reflection.status` | `unavailable`（`reason_code: executor_absent`，availability 记录已落盘） |
| `stage_handoff.status` | `unavailable`（`current: false`） |
| 谓词 | 12 条中 **4 条 `satisfied`**、8 条 `missing`／`unavailable` |

即：本阶段**没有硬阻塞**（`continuation_allowed: true`），但**质量事实不完整**，按用户裁定以 `incomplete` 收口，不声称完成。

### 已真实完成

| 项 | 事实 | 证据 |
| --- | --- | --- |
| 原始需求与事实核查 | 三痛点各有独立根因，附路径与行号 | 本文 §4.1–§4.6 |
| Talk | 4 轮，用户真实回复 | 本文 §5 Round 1–3 与补充轮 |
| Grill | 2 批共 6 问，用户真实回复，未产生 review fact | 本文 §5 Grill 批次 1–2 |
| 方向审查 | `available` / `complete`，13 条 findings，逐条处置 | §4.7、§4.7.1 |
| 细节审查 | `available-with-failures` / `partial`，24 条 findings，逐条处置 | §4.8、§4.8.1 |
| 审查事实入库 | 两轨各 red/blue 的 attempt/result/report 已 canonical 记录 | task store `quality/reviews/` |
| 用户确认 | `quality/confirmations/f381c6ab…json`，`decision=accepted`，用户原话「确认」 | task store `quality/confirmations/` |
| interaction aggregate | 已按运行时契约发布（4 轮 Talk + 2 批 Grill，含 6 问 frontier） | task store `quality/evidence/interactions/` |
| 官方 `run --action=execute` | 能跑通并返回结构化结果，`missing_items: 0` | 本文 `## 阶段收口状态` 的「运行时实际收口状态」表 |
| UI applicability | `recorded` / `non_ui`，三输入齐 | 本文 `## UI applicability` |
| 决策内容 | D-001–D-025、AC-01–AC-18、R-01–R-10、DEFER-01–04，未决项 0 | §14 |

### 已在本阶段内修复、不再是缺口（保留记录，便于回查）

| 原缺口 | 现状 | 处置 | 证据 |
| --- | --- | --- | --- |
| `outline_closed` → `interaction_proof`：契约自指循环，本任务内无法同时满足 | **已修复** | D-024：证明改为 aggregate `oi_dispositions` → OI 记录**单向**绑定；OI 记录不再写入自指的 `interaction_ref`／`interaction_hash`（旧记录仍可读，但不再是证明来源） | `runtime/stage/stage-content-contracts.mjs`；`tests/contract/decision-convergence-depth.test.mjs` |
| `outline_closed` → `terminal_fields` 与 `direction_snapshot` 仍为 `missing` | **已通过** | D-025：`convergence_outline` 原本全仓无生产者，改为从 OI 权威**确定性派生**（`deriveQuestionsOnlyOutline`，不新增持久对象、不改 schema） | 同上 |
| 18 条 finding 处置路由未写（`invalid_finding requires rejected_invalid route`） | **已落** | 子代理产出 37 条，运行时只接受其中 actionable-serious 子集 18 条；补齐 `kind`（`rejected_invalid` → `invalid_finding`，`fixed` → `implementation_defect`）与 `evidence_ref` | §4.7.1、§4.8.1；`quality/evidence/acceptance/make-decision/finding_dispositions-*.json` |

修复后 `analyzeDecisionOutline` 五个分量全部 `passed`、`ok: true`、`errors: []`，官方 run 的 `missing_items` 由 20 条降至 **0**。

### 仍未完成（本阶段接受其保持未完成，用户已裁定不补做）

1. **阶段末复盘未发布**：`stage_reflection.status = unavailable`，`reason_code = executor_absent`，availability 记录已如实落盘（`quality/evidence/stage-reflection-availability/<sha256>.json`）。judgment JSON 已产出并通过 `validateStageReflectionSibling` 校验，落点为 `quality/evidence/stage-reflection-pending/make-decision-judgment-20260911.json`，**但无法作为正式输入提交**：发布要求 `judgments[].evidence_refs` 恰含**一个可认证的** stage outcome 引用。
2. **`stage_outcome` 仍为 `unavailable`**：`reason = stage_outcome_missing`。本任务 13 个已落盘 outcome 全部 `status: failed` 且无一携带 `spec_analyze`；本环境无外部 Stage Agent，按宿主协议如实记为 unavailable，**不伪造执行证明**。
3. **8 条谓词保持 `missing`／`unavailable`**：`scope`、`non_goals`、`risks`、`requirement_coverage`、`goal_achievement`、`acceptance_clarity`、`solution_convergence`、`stage_end_spec_analyze`。其唯一生产入口是 `stage_outcome.spec_analyze`（`runtime/stage/stage-agent-outcome-adapter.mjs`），随第 2 条一并不可得。
4. **阶段交接发布为 `unavailable`**：`quality/evidence/handoff/make-decision.md` 存在（604 行续接记录），但其 frontmatter 自述 `authority: non_authoritative`、`formal_publication_status: "unavailable"`；运行时亦因 `specs/<task-id>/spec.md` 尚不存在而无法认定其为 current。**该文件不得被当作 stage completion、质量通过或归档授权**，且其正文写于 D-024／D-025 修复之前，已 stale。

> **不得声称 make-decision 已完成。** 本阶段以 `incomplete` 收口是用户裁定的结果，不是质量通过。

### 本阶段当场修复的机械缺陷（与本任务三条痛点无关，单独保留）

- `skills/wh-review/scripts/wh-review-cli.mjs:225`：`normalizeBareRecoveryResult` 只接受 `available`/`unavailable`，而同仓 `simple-review-runner.mjs:1249` 与 `runtime/review/review-record-route.mjs:1002,1134` 都把 `available-with-failures` 当合法终态，导致已存在的审查记录无法被认证、细节审查被卡死。修复为该状态集合补入 `available-with-failures`（单行）。修复后同一请求真实返回 24 条 findings。
- 该缺陷不属本任务交付物范围，不据此扩大范围。
- **材料目录污染（2026-09-11 清理）**：`specs/<task-id>/` 下曾遗留 9 个本阶段作业用临时文件（`direction-review-input/result/stderr.*`、`detail-review-input/result/stderr.*`、`direction-record-input.json`、`detail-record-input.json`、`make-decision-run-input.json`），合计约 272 KB。这些文件是审查请求/返回的作业副本，其 canonical 原件在 task store 的 `quality/reviews/attempts/`、`results/`、`reports/`，材料目录按治理规则只应存四份材料。已全部移出材料目录（移至会话临时区，未删除）；§4.7 中原本指向其中一份副本的引用已改指 canonical 路径。清理后 `specs/<task-id>/` 只含 `decision-log.md`。

### 交接边界

- **本阶段以 `incomplete` 收口是用户 2026-09-11 裁定的结果，不是质量通过**，也不构成 release、Git 交付、physical close 或归档授权。
- build-spec 只可细化 §14 已确认方向，**不得新增 schema、命令或控制面**（D-016）。
- R-07 **已处置（2026-09-11，见文末「增量决策」D-026／D-027）**：build-spec 实测确认两项承载处在既有结构中均无法指认；用户裁定类型改由既有材料 `decision-log.md` 承载、归档判定降级为人工声明。**AC-03／AC-09 验收暂停解除**，两条口径已更正。R-07 不再是 build-spec 的前置缺口。
- **build-spec 不得假定本阶段 8 条未满足谓词的分析结论可用**（`scope`、`non_goals`、`risks`、`requirement_coverage`、`goal_achievement`、`acceptance_clarity`、`solution_convergence`、`stage_end_spec_analyze`）：其承载者 `stage_outcome.spec_analyze` 不存在。方向内容以 §14 正文为准，**不以谓词通过为准**。
- **build-spec 不得消费复盘或交接内容**：两者均为 `unavailable`；`quality/evidence/handoff/make-decision.md` 是写于修复之前的非权威 stale 草稿。
- 上述未完成项在补齐前，**不得声称 make-decision 已完成**。

### 漏执行审计（用户 2026-09-11 指出后补做）

用户指出阶段结束时漏做**复盘**与**交接**。经现场核查并实测，两项**确实漏执行**，且原因不同。

#### 事实核查

| 检查项 | 结果 | 证据 |
| --- | --- | --- |
| step 13 `publish-decision` 的交接产物 | **不存在** | `quality/evidence/handoff/` 目录不存在 |
| step 14 `stage-reflection` 产物 | **不存在** | `quality/stage-reflection/` 目录不存在 |
| `run --action=reflect` 是否被调用过 | **从未调用** | 我从未构造 judgment JSON 或发出该命令 |
| manifest 定义 | step 13 `publish-decision`（depends_on 12）；step 14 `stage-reflection`（`on_stage_end: true`、`blocking: false`） | `workflows/make-decision/steps.json` |
| 运行时记录的复盘状态 | `unavailable`，`reason_code: executor_absent` | `quality/evidence/stage-reflection-availability/` |

#### 实测出的真实依赖链（这决定了为什么会连带失败）

1. **交接依赖复盘**：`stage-runner.mjs:1099` 的 `withHandoff` 把复盘结果作为交接输入，交接在复盘之后发布。
2. **复盘依赖 `stage_outcome`**：`stage-reflect.mjs:817-828` 要求 `judgments[].evidence_refs` 恰含**一个可认证的** stage outcome 引用，并逐项比对 `attempt_id`、`snapshot_tree`、`material_revision`、worktree、branch。
3. **本次 `stage_outcome.status = failed`**：失败摘要 `interaction aggregate does not bind the current task and decision`。
4. **补做复盘时实测到的堵塞**：judgment 已通过 `validateStageReflectionSibling` 校验，但提交后返回
   `MATERIAL_INCOMPLETE: stage outcome snapshot_tree is stale`——因为我在修复材料的过程中不断改动本文件，
   工作树已从 outcome 记录的 `8bf57d1b` 推进到 `956d23df`。

**结论**：交接与复盘不是两个独立遗漏，而是同一条链的末端两个节点，链条源头是 `outline_closed` 的契约自指循环（§2.2b）。

#### 我为什么会漏（根本原因，分三层）

1. **把复盘归错了类（主因）**：我把复盘和交接当成「质量谓词」——看到 `quality_status: incomplete` 就认为它们随谓词一起失败、等人工介入即可。但它们是 `steps.json` 里**已声明的 manifest 步骤**，各自有自己的交付物契约：复盘要产 judgment JSON，交接要产 handoff 文件。谓词 incomplete 与「步骤是否执行」是两件事，我把前者当成了后者的结论。
2. **没有按 manifest 逐条核对（直接原因）**：阶段末我只核对了 step 1–12，把用户说的「stage 结束了」直接当作流程结束，跳过了 step 13、14。manifest 有 14 步，我没有一份逐条「完成／跳过／未完成／不可用」的核对记录，所以这两步不会自己冒出来。
3. **误信了通用兜底 reason_code（掩盖原因）**：运行时把复盘状态记为 `executor_absent`，读起来像「没有执行者，正常降级」。真实原因是「从未调用」＋「outcome failed」＋「outcome 快照过期」。通用 reason_code 掩盖了具体缺口。

#### 补做结果

- **judgment JSON 已产出并通过运行时校验**：`validateStageReflectionSibling` 返回通过；六区块、`status_matrix`、`identity`、`source_completeness`、executor 五要素齐备。
- **落点**：`quality/evidence/stage-reflection-pending/make-decision-judgment-20260911.json`（本环境无法作为正式输入提交，故按证据保留）。
- **正式发布仍为 `unavailable`**，真实原因：`MATERIAL_INCOMPLETE: stage outcome snapshot_tree is stale`。不伪造发布。
- **交接仍为 `unavailable`**：被同一链条阻塞（复盘未发布 + outcome failed）。

#### 是否应纳入本任务修复（裁定）

**应纳入，且应作为独立交付项，不混进三条痛点。**

- 理由：本条属于「阶段末执行纪律」缺陷，与三条痛点（提问粒度、产物粒度、收口语义）根因不同、消费者不同、验收方式不同，合并会污染原验收。
- 最小修复面（待后续阶段设计，本节只登记）：在阶段末增加**按 manifest 逐条核对**的动作，并让复盘/交接的**交付物存在性**与**谓词完整性**分开报告；不得把 `executor_absent` 一律当作正常降级。
- 该修复的消费者＝每个正式 stage 的阶段末；owner＝各 stage 主会话；删除条件＝阶段末核对机制被经过审查的替代机制取代。

#### 新增登记项

| 编号 | 内容 | 类型 |
| --- | --- | --- |
| D-023 | 阶段末必须按 manifest 逐条核对完成／跳过／未完成／不可用，并把「交付物是否存在」与「谓词是否完整」分开报告；`executor_absent` 不得一律视为正常降级 | 决定（纳入本任务交付范围） |

---

## 增量决策（build-spec 阶段回报 make-decision · 2026-09-11）

> **来源**：build-spec 的首个可写步骤触发了 **R-07**（owner=build-spec 主会话）。按统一回退协议，方向级问题回报 make-decision 做增量决策。用户于 2026-09-11 对四项逐条裁定，本节为其正式登记。
> **边界**：本节只细化与更正既有方向，**不新增公共命令、schema 或控制面**（D-016、§14 非目标）；不改变 §14 已确认的核心方向与三条痛点的修复方向。

#### D-026 · 任务类型改由既有材料承载，不新增任何 schema 或字段

**实测结论（R-07 第 ① 项）**：任务类型的承载处在既有结构中**不存在**——

- `task.json` 的唯一生产者 `tools/cli/task-bootstrap.mjs:63-75` 只写固定 10 键，**无类型字段，也无 CLI 参数可传**；且 `task.json` **创建后不可变**（`runtime/task/task-handle.mjs:414-416`「record is kernel-owned」、`:913` 已存在即抛错）。
- `facts.jsonl` 的 task 行是 10 键**逐字相等**（`runtime/task/task-store.mjs:9`、`:290`，多一键即抛）；monitoring 行型**零生产者**；`readTaskFacts` 的**生产消费者为 0**。
- `quality/*` 各记录 schema 封闭且无类型位；`index.json` 封闭并**显式禁止** `parent`／`successor` 等谱系字段（`task-store.mjs:18`、`:231`）。
- 全仓 runtime **无任何类型概念**（`task_type|taskType|task_kind|task_mode` 命中 0）；公共 run 输入是封闭白名单（`tools/cli/stage-runtime.mjs:929-938`）。

因此 AC-03 的**原口径判为 `no`**：既无处可读，任何可行做法又都需新增 schema/字段，而 D-016 与 §14 非目标明文禁止。

**用户裁定**：**不新增 schema、不新增字段**；任务类型改由**既有材料**承载——在 `specs/<task-id>/decision-log.md` 的任务身份段写入**一条显式、可唯一读出的类型声明**。

- 承载处＝既有材料文件（四材料之一），不是新 schema，也不是新控制面；
- **满足 D-009 时序**：make-decision 一开始就创建该材料，类型可在提问前确定；
- **满足 AC-15 中途可改**：材料本就是修订目标（`runtime/task/material-workspace.mjs` 的原子替换），改类型＝改材料正文，不需新机制；
- 读取方按显式格式约定解析；**缺声明时不得推断**，按 `unknown` 处理并回报。

**AC-03 已按此更正口径**（见上表）。**R-07 第 ① 项就此解除。**

#### D-027 · 归档判定降级为人工声明，不建机器清单、不建任务链

**实测结论（R-07 第 ② 项）**：D-021 的 6 步链路中**只有第 6 步**（人下令归档，`tools/cli/stage-runtime.mjs:639`）落在既有结构上——

- **(1) 母任务清单无权威登记位**：`specs/<mother-task-id>/prd.md` 的任务地图**不含任何 task_id**（实测 `workflowhub-mechanism-simplification-20260910/prd.md:106-117` 10 行地图仅有执行序/卡/批次等列），且**无解析器**（唯一 prd 读取器 `core/task-close.mjs:930-946` 只解析「必要附件与版本」单行 JSON）。
- **(2) 无母→子指认**：全仓无任何 task↔task 链字段（§4.5 断言今天仍成立；`related_task_id` 所有写者都写自身、**无跨任务读者**）。
- **(3)(4) 差额不可算**：清单条目无 task_id ⇒ 无法定位兄弟任务 store ⇒ N/M/N−M 无来源。
- **(5) 无合法写入字段**：review result schema 顶层 `additionalProperties:false`，`semantic_fields` 的字段集由 surface registry 决定，其中**无此结论位**。

**用户裁定**：本次仍**交付该行为的用户可见部分**，但**不做机器判定**——母任务清单的完成情况由**用户人工声明**，归档仍须用户明确下令。

- **用户可见行为不变**：规划任务不会在子任务未完成时被提前归档；
- **不做**：不建清单、不建 task↔task 链、不新增 schema、不给 review result 塞非本会话撰写的字段；
- **AC-09 已按此更正口径**（见上表）；
- **D-012 后半（归档仍须人下令）不变**；其前半「自动判定」**降级为人工声明**；
- **D-013 / D-014 / D-021 的机器可读部分不再要求实现**：D-013「判定依据是清单全完成」的语义在人工声明下保留（用户据清单判断），但不要求机器读清单；D-014 的「只读检查落在子任务 verify-code」与 D-021 的「子任务算差额写自身审查记录」**降级为不实现**，其原始动机（不越权写母材料、不自动归档）由 **AC-17 / AC-10** 继续保证。

**R-07 第 ② 项就此解除**——以「不要求机器可读」的方式解除，而非以新增结构的方式。

#### D-028 · 更正 `requires_user_decision` 口径：以机器块为准

本节此前（§2.0 说明行与 §2.1 人读表）记「由仓库事实或宪法硬约束直接回答的记 `false`（OI-01/02/03/04/13/14/16 共 7 条）」。逐条核对 `selected_disposition` 后确认**该清单错误**：

| OI | 实际处置依据 | 是否用户裁决 |
| --- | --- | --- |
| OI-01 | 事实核查确认改动面；见 D-001 | **是**（D-001 系用户决定） |
| OI-02 | D-001/D-002/D-003 | **是** |
| OI-03 | D-005/D-006/D-007 | **是** |
| OI-04 | D-010/D-011/D-012 | **是** |
| OI-13 | D-016/D-017 | **是** |
| OI-14 | D-016 | **是** |
| OI-16 | §4.10 UI applicability = `non_ui` | 否（纯仓库事实） |

按本材料自订规则（§2.0 说明行：「不一致时以 §2.2b 机器块为准并回改人读表」），**以 19 条 `true`、仅 OI-16 `false` 为准**；§2.0 说明行与 §2.1 人读表**已同步更正**。

**连带后果（如实登记，不掩饰）**：原句「本任务**不存在**上一任务『30/30 全部要求用户裁决』的同形问题」**不再成立**——本任务 20 个 OI 中 **19 个**需要用户裁决。**该同形问题确实存在。** 这不改变任何产品方向，但它是本任务自身的一份负面事实，登记于此供后续阶段与验收参考。

#### D-029 · 验收缺口不补，如实登记

| 缺口 | 内容 |
| --- | --- |
| 缺口 1 | 原始需求维度「按标准流程开始／先建 worktree／不跳阶段／不依赖 build-spec 补需求」（§1）**没有任何 AC**，只以用户流程表与失败条件承载 |
| 缺口 2 | AC-06、AC-11、AC-18 **只有定性口径、无可判真的 oracle**；AC-02 亦未给自动化比较手段 |

**用户裁定**：**不补**。理由与既有先例一致——D-022 已确立「执行纪律不作为验收条款」。两项缺口须在 `spec.md` 中**如实披露**；不据此扩张验收标准集，也不据此扩张范围。

### 本节对既有条目的影响汇总

| 既有条目 | 影响 |
| --- | --- |
| AC-03 | 口径更正为「既有材料 `decision-log.md` 可唯一读出」，失败条件增加「缺声明时被推断」（D-026） |
| AC-09 | 由「写 N/M/N−M 差额」更正为「用户人工声明 + 可回查记录」（D-027） |
| D-012 | 「自动判定」降级为人工声明；「归档须人下令」不变（D-027） |
| D-013 / D-014 / D-021 | 机器可读部分不再要求实现；原始动机由 AC-10 / AC-17 继续保证（D-027） |
| D-008 / D-009 / AC-15 | 方向不变；承载处改为既有材料（D-026） |
| §2.0 说明行 / §2.1 人读表 | 按机器块更正为 **19 `true` / 1 `false`**（D-028） |
| R-07 | **两项均已处置**（①→D-026、②→D-027）；**不再阻塞**，AC-03／AC-09 的验收暂停解除 |
| AC-06 / AC-11 / AC-18 / AC-02 / 原始需求维度 ④ | 保持现状，登记为已知验收缺口（D-029） |

**未新增**：公共命令 0、schema 0、控制面 0、持久对象 0。本节全部为既有材料内的方向细化与口径更正。

### D-031 · 规划收口允许裁剪既有物理交付动作集（用户裁定选项 B）

**背景**：build-spec 阶段回报了一处方向级缺口——原始需求要求规划任务收口不归档，而实测确认在既有实现中不存在「完成提交、合并、推送、清理四个交付动作而不执行归档」的路径：交付授权的唯一消费者是固定五步的收口，四个动作的执行者全部位于该动作集内，唯一不含归档的另一条既有路径只覆盖提交与合并且没有生产入口。而 D-011 同时禁止改动物理交付动作集，构成自相矛盾。

**用户裁定（2026-09-11，选项 B）**：**授权为规划任务的收口裁剪既有物理交付动作集**——把归档从规划收口执行的动作集中去掉，使规划任务在收口后保持未归档。据此放宽 D-011 中「不改 `DELIVERY_STEPS`」的自我限制；D-011 的其余部分不变（仍执行提交、合并、推送、清理四个动作；仍不写收口完成记录；仍不改 `--mode=planning` 模式本身）。

**边界**：
- 只影响**规划任务的收口**；普通任务与既有 `planning` 模式的行为不变。
- 不新增公共命令、不改归档执行器本身、不新增控制面。
- 归档动作仍然存在，仍须用户明确下令才执行（D-012、AC-10 不变）。
- 用户同时裁定：本项改动**不需要重新走一遍独立审查**。

**连带处置**：build-spec 的 `spec-clarify` 由 `trigger=true` 回到 `trigger=false`——原先的方向级未决项已由本裁定关闭，其唯一未处置的 blocking finding 随本裁定一并处置。

### 校验器缺口（本节执行时发现，如实登记，未擅自修复）

执行 `tools/cli/check-decision-log-chain.mjs` 时发现一个**校验空洞**：该检查器用 `^###\s+(D-\d+)` 提取决定小节（`tools/cli/check-decision-log-chain.mjs:42`），而**本材料的决定全部使用 `#### D-0xx` 四级标题**（D-001–D-029 无一例外）。

后果（实测）：

- 检查器实际提取到的决定小节数为 **0**，因此**从未校验过 D-001–D-025 的任何链字段**；
- 本材料此前报告的「0 warnings」是**空洞通过**，不构成「链字段完整」的证据；
- 链字段 `module` / `requirement_ids` / `derived_from` / `artifacts`（`CHAIN_FIELDS`，`:15`）在**全材料中一次都没有出现**。若仅把标题匹配修好，预计产生 **约 100 条** `missing_chain_field` 警告（29 条决定 × 4 字段）。

**未修复前本节不擅自补造链字段的理由**：把 29 条决定改标题级别、或为既有决定补链字段取值，都属于 make-decision 材料的**结构性变更**；且 `module` / `requirement_ids` / `artifacts` 的取值无法从既有材料唯一推出，补造即为**编造**。

#### D-030 · 修复链检查器的标题匹配空洞（用户裁定选项 a，已执行）

**裁定（2026-09-11）**：修检查器标题匹配，把空洞**暴露为真实警告**；**不为既有决定补造链字段**。

**已执行**：`tools/cli/check-decision-log-chain.mjs:42` 的 `/^###\s+(D-\d+)\b/` 改为 `/^#{3,4}\s+(D-\d+)\b/`。

**执行后实测**：

| 项 | 改动前 | 改动后 |
| --- | --- | --- |
| 本材料被提取的决定小节数 | 0（空洞） | **29** |
| 本材料警告数 | 0（空洞通过） | **116**（29 × 4 个缺失链字段） |
| 检查器退出码 | 0 | **0**（advisory、非阻断语义未变） |
| 脚本内既有断言（`decision-log-chain-warnings.test.mjs`） | 1 failed / 4 passed | **1 failed / 4 passed**（未变） |

**116 条警告是真实状态，予以保留而非消除**：`module` / `requirement_ids` / `derived_from` / `artifacts` 四个链字段在**全材料中一次都没出现过**，取值无法从既有材料唯一推出。该 116 条如实反映「本任务材料从未建立过链字段」，是**既有事实**，不是本次修复引入的缺陷。本节新增的 D-026–D-029 同样沿用材料既有 `####` 约定、**不补造**链字段。

**顺带确认的既有缺陷（经 `git stash` 对照实测，改动前后完全一致，与本次修复无关）**：

| 测试 | 结果 | 说明 |
| --- | --- | --- |
| `tests/contract/decision-log-chain-warnings.test.mjs` | **1 failed / 4 passed** | 失败点 `:61` 断言 `run-checks` 退出码为 0，实际非 0；该用例强制令本 checker 失败以验证「advisory 不阻断」，但 `run-checks` 因**其他** checker 失败而整体非 0 |
| `tests/contract/repository-inventory.test.mjs` | **2 failed / 7 passed** | 既有失败，与本改动无关 |

**inventory 有意未更新**：`docs/architecture/repository-inventory.tsv` 按设计**不可变**——`tests/contract/repository-inventory.test.mjs:31` 断言该文件等于 `HEAD` 的字节，当前树由 `renderInventory()` **在内存中**校验（`:30-32`）。因此该 inventory 中记录的 `check-decision-log-chain.mjs` 历史 sha256（`9e1f229f…`）在本次改动后**必然过期**，这是设计使然，不是需要修正的缺陷；该文件当前 sha256 为 `77a3ce4c…`。检查器**不在** `skills/decision-log/skill-bundle.json` 内（`skills/decision-log/SKILL.md:98` 明示），故**无需重算任何 bundle/catalog hash**。

**未新增**：公共命令 0、schema 0、控制面 0、持久对象 0。

> **范围登记**：本次改动落在 `tools/cli/check-decision-log-chain.mjs`，**不在 §14 范围内 7 条之内**，系用户 2026-09-11 明确指示的修复项。是否正式纳入本任务交付范围，待 build-spec／后续阶段登记。

### D-032 · 不归档保留仓库相对路径，正常清理任务 worktree

- question/final_option：规划收口后如何保留材料位置？用户选择「保留主仓同相对路径，正常 cleanup（推荐）」。
- recommendation/plain_language：推荐保留主仓同相对路径；材料经 merge 进入主仓的 specs/<task-id>/，不进入 archive，随后删除任务工作区和任务分支，不要求旧绝对路径继续存在。
- decision：沿用 D-031 的 commit / merge / push / cleanup 四动作；“材料留在原位置”指主仓 specs/<task-id>/ 的仓库相对路径保持，不是保留专属 worktree 绝对路径。cleanup 前须能从已合并、已推送的主仓目标分支读回材料；失败时不删除唯一材料副本，不写收口完成记录。
- source_type/reference/exact_excerpt：真实用户回复；host-visible questionItemId=["request_user_input_async","call_xAZrsdcMgHSlS4vwtNz6uvF9",0]；原文「保留主仓同相对路径，正常 cleanup（推荐）」。
- approval_binding：用户回复已收到；未提供宿主认证的 reply_hash / human-confirmation.v3 ref，认证凭证保持 unavailable；本条不伪造阶段确认或不可逆操作授权。
- facts_and_constraints：core/task-close.mjs:2390 的 cleanup 会删除专属 worktree，:2109 的完成判据要求目录与登记均消失；spec §8 的“原位置”若按绝对路径理解则与 D-031 四动作冲突。已有 workspace_mode=existing 的保留例外不适用于专属任务 worktree，不能借它绕过。
- Logic：cleanup 删除专属工作区 → 保留未归档材料的要求仍有效 → 以主仓相同相对路径承载材料 → 允许正常 cleanup，且归档仍只由用户另行下令。
- choice_reason/impact：兼容已决定的四动作与不归档目标；仅澄清 FR-CLOSE-001、AC-CLOSE-001、SCN-003 和材料生命周期，不新增模式、公共命令或迁移通道。
- consequences_and_risks：旧 worktree 的绝对路径将失效；后续接手读取主仓 specs/<task-id>/。必须在 cleanup 前确认主仓材料可读且远端已包含对应内容，否则 cleanup 未完成，不能伪报成功。
- rejected_alternatives：「保留原 worktree，cleanup 延后到归档」未被选择，因为用户已选择正常 cleanup；这不否定用户以后改变方向的权利。
- unresolved_items/owner：本位置歧义已解决；已有 OPEN-02…OPEN-05 与 RISK-05 不受影响，保留各自 owner。
- Supersedes：仅澄清 spec 对 D-011/D-031 的“原位置”转译；不推翻四动作、独立授权、普通任务及 --mode=planning 不变、不写 completed.json 等边界。
module: planning-close
requirement_ids: [AC-08]
derived_from: [D-011, D-031]
artifacts: [spec.md#fr-close-001, spec.md#ac-close-001]

本条是 build-plan 发现规格歧义后经真实 ask → reply 的增量回报。十维复核：用户旅程、数据生命周期、成功/失败边界、权限/外部副作用及验收位置按上文澄清；页面范围仍 non_ui；非目标、延期项与其 owner 不变；不存在由本条新增而未处置的方向问题。没有重跑 make-decision/build-spec，也没有宣称其缺失执行事实已补齐。

### D-033 · 正常清理后允许窄扩展现有 close 支持后续人工归档

- question/final_option：是否把正常清理 worktree 后的后续归档纳入当前设计？用户同意纳入此前展示的窄扩展方案。
- recommendation/plain_language：推荐复用现有 close 的准备、确认、逐动作授权和执行链；材料已在主仓时仍能后续归档，不要求保留或重建已清理的任务 worktree。
- decision：保留 D-031/D-032 的初次 commit / merge / push / cleanup 四动作及主仓同相对路径；后续明确归档时允许窄扩展现有 close，从主仓当前材料准备并执行归档及归档提交，推送独立授权。用户声明、归档指令与各不可逆动作授权分开；不增加公共命令、模式、schema、store、任务关系链或独立收口完成记录。普通任务和显式 legacy --mode=planning 原行为不变。
- source_type/reference/exact_excerpt：本主会话真实用户回复，2026-09-11，原文「纳入，授权，继续吧」；直接回应上一条同时列明归档扩展与阶段收尾修复的范围卡。宿主未提供独立 reply_ref/hash，明确保留 unavailable，不合成回复凭证。
- approval_binding：方向范围已由上述真实回复同意；不是最终 build-plan 确认，也不是本任务 commit/push/merge/archive/cleanup 的操作授权。
- facts_and_constraints：独立 review F-61a3c088952f；现有 prepare 依赖 openCurrentTaskWorkspace，而 D-032 要求正常清理；authorize archive 只写授权，直接调用 executor 会绕过确认、授权检查与执行事实。不能把旧 close plan 的失败重试说成清理后发起新归档。
- Logic：清理后的新归档缺入口 -> 保留正常清理和人工授权 -> 在现有 close 内窄扩展 -> 后续归档可执行且保留失败及逐动作来源。
- choice_reason/impact：解除 FR-CLOSE-002/003 与 SCN-004 的接口缺口；计划在 T009/T010 明确接口、写入与读回、授权、失败重试和主仓路径负例，产品实现仍由 build-code 执行。
- consequences_and_risks：增加现有 close 的受限分支，必须拒绝错任务、材料漂移、缺归档/提交/推送授权和旧声明复用；部分失败保留原始事实。用户声明仍保存原话，不新增机器完成枚举或撤回链。
- rejected_alternatives：不保留或重建旧 worktree，不直调归档 executor，不新增 archive-only 公共模式，不借旧 planning 模式偷偷改变普通行为。
- unresolved_items/owner：该范围决定已确定；确切私有接口与测试由 build-plan 完成，独立审查原件保留；D-029 的验收缺口及其他已披露事实不被本决定消除。
- Supersedes：仅放宽 D-031 对后续归档编排扩展的限制；其不归档初次收口、普通/legacy 行为、独立授权及不写 completed.json 边界不变。
module: planning-close
requirement_ids: [AC-09, AC-10]
derived_from: [D-012, D-027, D-031, D-032]
artifacts: [spec.md#fr-close-003, plan.md, tasks.md#T009, tasks.md#T010]

### D-034 · 单独授权修复阶段 outcome 与 handoff 的收尾循环

- question/final_option：是否授权修复 outcome 要求 handoff 已完成、但 handoff 又依赖 outcome 先发布的循环？用户同意修复。
- recommendation/plain_language：推荐按真实执行顺序区分阶段正文与后置收尾；先发布真实正文事实，再执行并检查复盘和交接，不伪造提前完成。
- decision：本次允许修改现有 stage runtime 的收尾依赖与直接相关测试，修复上述已证实的循环；是 build-plan 期间单独授权的工具修复，不代表进入或完成本计划 12 张产品任务卡。保留旧不可变 outcome、失败事实与后置 hook 的真实完成要求；不新增阶段、公共命令、schema、store 或历史替换链。
- source_type/reference/exact_excerpt：与 D-033 相同的当前真实回复「纳入，授权，继续吧」，对应范围卡第二项“阶段收尾循环”；未提供独立宿主回复凭证。
- approval_binding：代码修复和必要针对性验证已授权；Git 提交、合并、推送、归档、清理及最终计划确认均未由本条授权。
- facts_and_constraints：createWorkflowHubSessionRecorder.finish 把后置 stage-handoff 的未运行行计入 incomplete；runStageEndReflection/publishStageHandoff 只能在 outcome 之后调用，成功写出 handoff 不会修补原不可变 outcome。
- Logic：后置动作依赖正文 outcome -> 不能反作正文完成前置 -> 修复既有依赖划分并保留最终 hook 检查 -> 消除循环而不降低完成质量。
- choice_reason/impact：窄改现有 runtime 与直接回归测试；唯一 consumer 为当前 stage runner/正式完成聚合，owner 为既有 stage runtime；替代错误的前置计数，不新增控制面；删除条件为既有后置 hook 生命周期被经审查的实现替代。
- consequences_and_risks：若只豁免 handoff 而不验证真实后置结果，会出现假完成；若把 dirty runtime 当成 HEAD，会伪造来源。测试和正式调用必须分别说明实际代码、身份和结果。
- rejected_alternatives：不把未运行 handoff 写 completed，不覆盖旧 outcome，不使用同 attempt 冲突重写，不为修复新建任务或复制 runner。
- unresolved_items/owner：runtime 修复与独立复核由当前会话完成；正式启用若需独立 Git 操作授权，届时提交已验证的具体范围，不虚构已启用。
- Supersedes：仅解除当前 plan 对相关 stage runtime 文件的 DO NOT TOUCH；其他产品和持久化边界不变。
module: stage-end-lifecycle
requirement_ids: [用户本次阶段收尾修复授权]
derived_from: []
artifacts: [plan.md, runtime/stage/stage-agent-outcome-adapter.mjs]

本次增量明确沿用一个当前 OI 大纲和四材料，没有重放 Talk/Grill、没有新增问题队列。spec-clarify trigger=false：两项边界已有真实用户答复；十维中用户旅程、数据状态、成功失败、权限外部作用与可观测证据由 D-033/D-034 落定，页面仍 non_ui，其他非目标/延期不变。研究不另发起：待定项是已核查本地接口的缺口，当前用户已选窄扩展，无新的外部事实会改变该范围。最终计划验收仍待当前修订稿展示后的真实回复。

### M6 当前决定摘要（历史原文保留，非第二 OI 大纲）

本节仅汇总前述同一份当前决定，供当前消费者读取；不把历史段落的疑问、旧失败、示例中的 open 或“未决项已关闭”误当成本次新问题。OI 仍以 §2 唯一大纲及对应 D 条目处置为来源，不另设清单或状态。

- 当前方向：D-001—D-029 的既定产品选择继续有效；D-030 暴露真实链警告，不补造字段；D-031/D-032 选择规划四动作与主仓同相对路径保全后正常cleanup；D-033 支持清理后的人工归档窄扩展；D-034 单独授权修复stage收尾循环。
- 目标与用户流程：规划只问方向，PRD保留完整旅程及可逐项接手地图，子任务在自身材料设计；规划结束有真实复盘，不自动归档，后续由用户有效声明和独立操作授权归档。
- 数据状态与成功/失败边界：类型来自当前唯一声明；旧内容变更后重新处置，复盘保存后读回；初次四动作保全主仓材料再cleanup，后续归档保留同树内容及逐动作事实。缺声明/授权、材料漂移或部分失败不得伪报完成，重试不重复已完成物理动作。
- 范围与非目标：普通/legacy planning行为不变；不改五阶段、既有PRD字段、task schema/store、母子任务关系；不改写旧材料。D033仅扩现有close参数及私有分支，D034仅修已证实的后置hook依赖。
- 方案与权衡：复用现有材料、kernel、close记录和执行者；不保留旧WT，不新增归档mode、机器完成枚举、撤回链或历史替换机制。声明不等于plan操作确认，产品设计决定不授予本任务Git交付。
- 验收与证据：按D019的隔离fixture/结构与针对性测试；D029明确不补的定性oracle和执行纪律验收仍保留缺口。当前build-plan只设计12卡，D034工具补丁单独验证；没有声称产品、质量、发布或物理交付已完成。
- 当前方向未决：无新增待选方向；D033/D034已经真实回复确定。技术接口与实现证据由各owner补齐，不能改写成产品决定。
- 确认事实边界：本段写入时，新增两项范围已经用户同意；整份当前方向材料的正式scope确认与最终build-plan确认尚未生成，保持unavailable。本段不自标accepted；后续真实确认写入既有canonical记录，由consumer显式读回，不为回填本段造成材料自引用。
- 延期与风险：沿用本材料既有DEFER与spec OPEN/RISK的owner、触发条件、消费者和关闭条件；不删除116条历史警告事实，不把缺证据变成通过。

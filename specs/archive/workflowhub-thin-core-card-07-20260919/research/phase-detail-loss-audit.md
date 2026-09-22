# Phase 工程细节丢失核对（2026-09-22）

范围：只读比对 CARD-02 归档的 `plan.md`/`tasks.md` 与当前 CARD-07 `spec.md`、`phases/P1.md`～`P3.md`、`phases/index.md`，以及两版作者模板。CARD-02 和 CARD-07 是不同实现任务，因此不能把 CARD-02 的具体代码/命令原样搬到 CARD-07；可比较的是「下游 build-code 是否获得同等可执行细度」。本报告不把文件行数当质量分数。

## 结论

当前 CARD-07 确有严重细节断层。独立 Phase 文件的**物理形态**已出现，但三个 Phase 各 33 行，P1 把约 70 个路径放在一个 Write set、一行 `T001 RED / T002 GREEN / T003 FINAL` 中，没有逐任务的动作、精确文件/符号归属、输入输出、失败定位、恢复与证据。P2/P3 也是一行概括每个 task。相较之下，CARD-02 有 537 行全局 plan、731 行 tasks、11 张逐项卡；其质量并非由篇幅本身保证，而是因为每张卡能独立指导一次 RED/GREEN 和失败回退。[CARD-07 P1:4,19-29](../phases/P1.md) [CARD-07 P2:19-29](../phases/P2.md) [CARD-07 P3:19-29](../phases/P3.md) [CARD-02 T001:32-69](../../archive/workflowhub-thin-core-card-02-20260919/tasks.md) [CARD-02 T003:174-211](../../archive/workflowhub-thin-core-card-02-20260919/tasks.md)

新 `spec-plan` 技能宣称全局设计在 spec、Phase 保存可执行增量；但新 Phase 模板要求 `Tasks` 仅为“stable task IDs and one-line results”，且没有每任务独立的 `action/paths/symbols/precondition/RED failure/paired GREEN/recovery` 槽位。CARD-07 产物恰按这个最低形态生成。旧 plan 模板明确要求 `Code Anchors`、Solution Design、接口/状态、File Boundary、Technical Decisions、Test Strategy、Risk、依赖图；旧 task 实例有逐卡动作、文件、边界、输入输出和 STOP。新 spec 仅在 `## 架构边界` 下用两段概括全局方案，再把“精确写集、命令和回滚”推给 Phase；Phase 又没有逐任务展开，于是形成**两边都不承载细节**的空隙。[新 spec-plan:10-26](../../../skills/spec-plan/SKILL.md) [新 Phase 模板:12-29](../../../skills/spec-plan/templates/phase-template.md) [旧 plan 模板:26-74,102-170](../../../skills/spec-plan/templates/plan-template.md) [CARD-07 spec:303-325](../spec.md)

## 哪些指导实际丢了

| 维度 | CARD-02 可供执行的具体例子 | CARD-07 当前状态 / 缺口 |
| --- | --- | --- |
| 代码入口与符号 | plan 逐条列 `stage-content-contracts.mjs` 的 `validateSpecContentProfile`/`buildDecisionCoverageAudit`、`stage-handlers.mjs`、TaskKernel、review seam 等，还分 read-now/must-read。[CARD-02 plan:50-65](../../archive/workflowhub-thin-core-card-02-20260919/plan.md) | P1 顶部只有长路径清单，`spec.md` 只说 seam 名称；没有每个变更行为对应的入口 symbol、当前签名或先读哪里。[P1:4,14-19](../phases/P1.md) [spec:311-320](../spec.md) |
| 接口、数据、失败路径 | plan 写 current packet 输入、历史 schema、确认原子写、coverage incomplete 与 review unavailable 的语义。[CARD-02 plan:167-173](../../archive/workflowhub-thin-core-card-02-20260919/plan.md) | P1 只写“cohort-aware material set、身份摘要”和 fail loud 类目；缺 `index` 行解析/Phase 文件映射/摘要字段/CLI 输入/质量事实 writer 的逐接口契约。[P1:14-15](../phases/P1.md) [spec:317-321](../spec.md) |
| 精确所有权与变更顺序 | plan 有 NEW/MODIFY/DO NOT TOUCH、全局复用决策、producer→consumer 顺序；tasks 为每对 RED/GREEN 标明可写文件与 boundary。[CARD-02 plan:67-78,179-260,362-374](../../archive/workflowhub-thin-core-card-02-20260919/plan.md) [CARD-02 T001/T002:45-47,96-100](../../archive/workflowhub-thin-core-card-02-20260919/tasks.md) | P1 单 Phase 写集过大，`MODIFY` 指回整个头部，T001/T002/T003 无独立 ownership。P1 与 P2/P3 的先后有写，但 P1 内 authoring→identity→official handler→review→downstream 的排序没有可执行切片。[P1:4-6,16-19,29](../phases/P1.md) [index:7-11](../phases/index.md) |
| RED/GREEN 可证伪性 | CARD-02 T003 列真实 CLI/topology/readback、307200B/362477B 边界、准确拒绝条件、同命令、期望失败和 observation；T009 明确 setup failure 不算 RED。[CARD-02 tasks:174-211,514-550](../../archive/workflowhub-thin-core-card-02-20260919/tasks.md) | 每 Phase 只有一条覆盖大量目标的 gate_cmd 和总 oracle；没有按行为/任务列 expected target failure、对应断言、具体 fixture、GREEN 的负例读回。P3 将 AC-33～49 全塞一条 `ORACLE-CARD07-FINAL-001`，单命令绿无法逐 AC 说明证据来源。[P1:19-26](../phases/P1.md) [P3:14,19-28](../phases/P3.md) |
| 来源→需求→任务→证据 | CARD-02 plan 有 8 行 source/decision→FR→AC→Phase/Task→精确文件→oracle；单 task 也记 source_refs/decision_refs、FR、AC。[CARD-02 plan:376-387](../../archive/workflowhub-thin-core-card-02-20260919/plan.md) [CARD-02 tasks:38-46](../../archive/workflowhub-thin-core-card-02-20260919/tasks.md) | 当前 Phase 仅 FR/AC 合并列；P1 同时列 CARD-02 和 CARD-07 ID，但无逐 source/AC 的 task+oracle+证据映射。spec 仅规定“从 SCN 定位 FR，再定位 AC”，不是完整两向矩阵。恰是原 CARD-02 漏需求无法被检查发现的再现风险。[P1:14](../phases/P1.md) [spec:303-305,413-429](../spec.md) |
| 风险、STOP、恢复 | CARD-02 `PLAN-RISK-001..004` 每项列 trigger/consequence/handling stage/verification，T003/T004 各有 STOP/recovery；T011 有 owner-return 规则。[CARD-02 plan:322-360](../../archive/workflowhub-thin-core-card-02-20260919/plan.md) [CARD-02 tasks:200-211,676-688](../../archive/workflowhub-thin-core-card-02-20260919/tasks.md) | 当前 Phase 各有一行 STOP 和 Risk/rollback，但 P1 未把缺件、质量事实错绑、review transport、旧 pre/history 被破坏等分别指定修复 owner/回退最小 diff；P3 的“需越过 P1/P2 写集则停”没有返修卡分派。[P1:27-29](../phases/P1.md) [P3:27-29](../phases/P3.md) |
| 证据与完成记录 | CARD-02 tasks 逐卡有 `verification_role`、`paired_task`、evidence_path、executed_commands、实际状态；T011 最终逐 AC matrix 18 achieved/2 deferred/2 unavailable，不把命令绿当业务绿。[CARD-02 tasks:50-80,650-662](../../archive/workflowhub-thin-core-card-02-20260919/tasks.md) | 新 Phase 不应继续把执行状态写回计划正文（执行事实应在 task facts/quality）；但必须在规划态预先指定逐 task/逐 AC 的证据契约。目前三份 Phase 只有每 Phase 一个/两个路径和泛化 Done，缺逐 AC 的 evidence type（如 AC-38 的 manual）与缺证据状态预案。[P2:22-29](../phases/P2.md) [P3:22-29](../phases/P3.md) [spec:359-363](../spec.md) |

## 易混淆但关键的区别

CARD-02 的 `tasks.md` 中 731 行包含**执行后回填**（例如 T001 的 `completed_at`/证据和 T011 matrix）；不应把这些已执行事实再复制进新的 Phase 设计文档，亦不应复活 `plan.md`/`tasks.md` 双写。必须迁移的是**执行前可操作的字段与行为切片**，而非任务状态字段或 CARD-02 专属代码路径。[CARD-02 tasks:71-81,653-662](../../archive/workflowhub-thin-core-card-02-20260919/tasks.md) [新 index 模板:1-20](../../../skills/spec-tasks/templates/index-template.md)

CARD-07 旧 `plan.md`/`tasks.md` 完整正文**未能从已检查来源恢复**：当前 `specs/workflowhub-thin-core-card-07-20260919/` 没有这两文件，`git log --all --` 针对两路径没有提交，task store 的 review attempt 目录也没有保存 `materials/04-draft_plan.md` 或 `05-draft_tasks.md` 原件。`quality/reviews/attempts/d71c3c96-05d9-55a7-a2dd-996e21843925/attempt.json` 记录旧 material revision，但 provider output 仅引用 draft plan 的行号与片段，不足以还原全稿。因此本报告**不宣称**已逐行比较 CARD-07 新旧正文；CARD-02 归档是可核实的执行细度基线。若另有外部 snapshot/备份，应单独定位、校验身份后再比。

CARD-02 自己的计划还出现矛盾：一方面宣称每 Phase 权威和纯指针 index，另一方面 `NEW=N/A`、只修改旧 `plan-template.md`/`tasks-template.md`，没有明确 `phases/P<n>.md` 物理产出路径、生成/发现/缺件失败；其 P1/T001-T002 的 oracle 只测“单 phase 权威”和“无双写”，足以让 plan 内章节误过。CARD-07 已补上**文件存在性**，却在赶补物理形态时把旧工程细节压缩成 header+一行 task，属于新一轮设计退化。[CARD-02 plan:99,136-137,181-198,256-260,427-458](../../archive/workflowhub-thin-core-card-02-20260919/plan.md) [CARD-07 P1:12-29](../phases/P1.md)

## 应当怎样修复（供 owning agent 决策，不在本报告改写 Phase）

1. 保留 `spec.md + 独立 P<n>.md + 纯指针 index` 形态，但把旧 plan 的**全局工程设计**完整落到 spec：verified code anchors/symbol、具体接口/状态/错误语义、reuse/extend/new 决策、全局 file boundary、风险与恢复、producer→consumer 依赖、source→FR→AC→Phase/task→oracle/evidence 双向矩阵。不能只声明“在 spec 中”，必须对当前 CARD-07 填实，并逐条跟当前代码核对。
2. 把 Phase 模板的 `Tasks: one-line results` 改为**每个 task 一张可执行子卡**，至少 action、exact paths/symbols、input/output、dependency、write boundary、paired RED/GREEN、target failure、same gate command、positive/negative oracle、evidence type/path、coverage limit、STOP/recovery/owner。Phase 头只保留本 Phase 共用差异；每张卡只写其专有增量，防止回到计划/任务双写。
3. 拆 P1 的巨大共用写集为实际行为切片/任务 ownership；可在同一 Phase 中串行多个 task，跨 Phase 不强迫数量增加。`index.md` 仍只列 Phase 级路径、写集、依赖、consumer，绝不复制任务正文。
4. 以**故意删一条原始需求、删一个 Phase、错绑一个 AC、仅有关键词但无行为证据**四种负例检验规划一致性和 verify-code 回溯。每条 AC 要带 evidence type（test/manual/review/readback）、task、oracle 和缺失时状态；测试进程 exit 0 不能自动代表 AC achieved。
5. 下一步 build-code 前由人/独立 review 对当前 Phase 工程卡作可执行性抽样：仅凭 `spec + 对应 Phase + index` 能否定位首个文件/符号、写出目标 RED、跑同一 GREEN、处理失败与回滚。如果还需猜测，应当在 build-plan 内补文档，不把缺口留给 build-code。

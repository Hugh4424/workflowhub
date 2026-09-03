---
version: 1
task: workflowhub-stage-reflection-usability-20260901
stage: make-decision
---

# Decision Log

> 本文档为 make-decision 阶段工作稿：原始需求回放、关键事实、Talk 轮次、决策条目逐步落盘。
> 状态标注：`OPEN`=待用户拍板；`DRAFT`=初稿待确认；`DECIDED`=已定并带 approval_binding。

## 原始需求

| source_id | 原始需求/约束 | 来源引用/原文摘录 | 关联 D/处理状态 |
| --- | --- | --- | --- |
| R-001 | 按标准 WorkflowHub 流程执行本任务：从 make-decision 开始，不跳阶段，不依赖 build-spec 补需求 | 用户原文（2026-09-01）："请按标准 WorkflowHub 开始这个任务吧，从 make-decision 开始，不要跳阶段，也不要依赖 build-spec 补需求。" | OPEN（流程约束，贯穿全程） |
| R-002 | make-decision 中与用户逐一梳理：完整用户流程、页面范围、数据状态、成功/失败边界、非目标、延期项 | 用户原文："先基于原始需求，在make-decision的过程中和我一起仔细梳理完整用户流程、页面范围、数据状态、成功/失败边界、非目标和延期项。" | OPEN（本阶段核心动作） |
| R-003 | Talk 用大白话说明选项、后果和风险；decision-log 记录原始需求、关键事实、选择、理由和延期交接 | 用户原文："Talk 请用大白话说明选项、后果和风险；decision-log 记录原始需求、关键事实、选择、理由和延期交接。" | OPEN（沟通与记录约束） |
| R-004 | 涉及页面排版的事项必须在 Talk 环节确定，且要问得详细 | 用户原文："需要我排版的事情，请在talk环节确定，问的详细一些。" | OPEN（页面轴，Talk 详细问） |
| R-005 | 最终目标：复盘器正确使用（当前无法正确执行），能收集到非常好的改进信息，方便后续 M16 使用 | 用户原文："我需要最终目标：这个复盘器正确使用，能收集到非常好的改进信息，方便后续M16使用" | OPEN（目标轴） |
| R-006 | 以已完成的评审/历史回填分析为依据进行改造（20 个 Codex 历史任务经验教训 + 技能改造建议 md） | 上一会话（2026-09-01）产物：`/Users/Hugh/Downloads/workflowhub-stage-reflection-historical-backfill-20260901/`（含 20 任务回填包 + stage-reflection-history-and-redesign.md）；评审：`/Users/Hugh/Downloads/workflowhub-stage-reflection-skill-review-20260901.md` | OPEN（输入材料） |
| R-007 | 参考 M16 设计确定本任务边界（M16 是复盘数据的消费者） | 用户原文："方便后续M16使用（可以查看一下M16的设计：/Users/Hugh/Hugh/Project/workflowhub-workflowhub-m16-evolution-20260831/specs/workflowhub-m16-evolution-20260831）" | OPEN（上游对齐） |
| R-008 | 历史收集的 20 个任务经验教训需要"按照技能标准收集到对应的位置"，其归属与导入方式需要在本任务确定 | 上一会话用户原文："收集了20个任务的经验和教训。按照技能标准把经验和教训收集到对应的位置。" | OPEN（与 M16 R-013"不回填"冲突，见 F-006） |
| R-009 | 复盘器收集的信息质量是核心关注：信息是否太少、对 workflowhub 任务和问题的分析是否太单薄、应该如何优化 | 上一会话用户原文："也检查了一下这个'stage-reflection'技能应该如何优化，收集的信息是否太少？对workflowhub任务和问题的分析是否太单薄？应该如何优化这个技能？"；更早用户动机（WH-离线复盘器 R-011 原文）："我需要知道的是。它每一个step，每一个skill，它对整个任务流程有没有帮助？有没有需要提升的地方？任务执行过程中有没有阻塞，人工为什么要回复那一句话？是不是之前哪一步没有考虑清楚？" | OPEN（信息质量轴） |

## 目标

- 让 `stage-reflection` 复盘器在真实 WorkflowHub 任务上**真正被执行并产出可用记录**（当前生产路径 executor 缺失，复盘恒为 failed——见 F-001）。
- 提升复盘收集的信息质量：不只记 step/skill 主观判断，还要能回答"每个 step/skill 对流程有没有帮助、有没有阻塞、人工为什么介入、是不是上游哪一步没想清楚、哪里可以简化"，并把**机器事实与判断分开**（符合 ADR 0021 judgment≠fact）。
- 让产出能被 M16 候选池/迭代简报/质量税正常消费（M16 只消费合规 stage-reflection 产物，PFACT-001/003；见 F-005）。
- 决定 20 条历史任务教训的正式归属（与 M16 R-013"历史任务不回填"的关系需用户拍板）。

## 成功/失败边界（初判）

- 成功边界：
  - 下一个真实 WorkflowHub 任务端到端跑通：每个 stage 产生 stage-reflection 记录（ok/degraded/unavailable 等如实状态），用户抽查判断质量后认可。
  - 复盘器不再"恒 failed"：无 executor 时有诚实语义（不是假失败），有 executor 时有真实判断。
  - 收集到的信息包含用户关心的五类问题（帮助/提升/阻塞/介入原因/简化），且判断带证据/置信度/触发条件。
  - 产出能被 M16 数据面消费（候选池聚合、质量税统计不因数据形态缺失而失效）。
- 失败边界：
  - 造出"复盘成功"的假象（伪造判断、伪造 executor、把 unavailable 写成 ok）。
  - 判断层写进机器事实通道（违反 D30/ADR 0021）。
  - 破坏 M16 已有消费契约（D-008：保持 stage-reflection 现有 invocation 兼容）。
  - 新增遥测/transcript 全量读取/高成本机制（M15 教训，R-013 精神）。
  - 把"复盘器能跑"误当"复盘质量已被证明"（AC-001 需要真实任务+用户认可）。

## 范围初判（triage）

- 本任务=复盘器 **可用性 + 信息质量** 改造：执行通道（executor）、记录语义（status）、判断收集维度（schema/prompt）、lessons 生命周期与导入、与 M16 的消费对齐。
- 不确定点（需 Talk）：
  1. executor 的实现方式（人工协议/框架通道/两者）；
  2. 无 executor 时的记录语义（unavailable/not_scheduled vs 保持 failed）；
  3. 20 条历史教训的正式归属（replay-only vs 导入，与 M16 R-013 冲突）；
  4. 信息质量提升的承载（schema v2 事实投影 / prompt 重写 / 两者）；
  5. 页面范围（不动 / 复盘状态列 / 更多展示）——用户要求详细问排版；
  6. 验收口径（真实任务端到端 + 用户抽查；是否需独立审查）。
- 明确非目标（初判，待用户确认）：
  - 不重建 M15 遥测（token/耗时/provider 采集）；
  - 不自动修改 skill/step（人拍板）；
  - 不改 M16 已有组件（候选池/趋势区/简报/台账）；
  - 不改五阶段主骨架；
  - 不做 execute 前的全量 transcript 分析（除非用户明确要，成本高）。

## UI applicability

```json
{
  "result": "ui",
  "raw_requirement": "用户原文：\"需要我排版的事情，请在talk环节确定，问的详细一些。\"——用户预期本任务可能涉及监控页面/复盘展示的排版改动",
  "project_inventory": "现有 monitor 静态页面（tools/cli/build-reflection-page.mjs + build-reflection-page-template.html：任务视图 + overall pending + lessons + 消费边诊断）；M16 已在该页面加入只读趋势区（候选池/质量税）",
  "planned_or_changed_frontend_fact": "待 Talk 确定：页面范围选项包括\"不动\"\"任务视图加复盘状态列\"\"增加复盘信息展示\"；若选不动则为 non_ui 的排除证据，若选任何改动则为 ui 证据",
  "source_reasons": ["raw_requirement 明确提到排版事项需确定", "project_inventory 显示既有页面与 M16 扩展", "planned frontend fact 未冻结，随 Talk 更新并重算"]
}
```

> 结论：`ui`（当前有可信 UI 信号）；等待 Talk 确定页面范围后按三输入规则重算，若用户拍板"不动页面"则更新为 `non_ui` 并记录排除证据。

## 关键事实（初稿）

| fact_id | 事实 | 来源 |
| --- | --- | --- |
| F-001 | 生产路径无任何 `stageReflectionExecutor` 提供方：`stageReflectionPublication` 在 services 缺失时返回 `{}`，`runStageEndReflection` 因无 execute 而落 `status:failed ("stage reflection executor was not provided")`；全仓唯一注入者是测试（wiring + e2e real-task） | tools/cli/stage-runtime.mjs:569-577；runtime/stage/stage-runner.mjs:877-985；tests/e2e/stage-reflection-real-task.test.mjs:242 |
| F-002 | M16 T008 执行事实实证：\"stage-reflection executor unavailable 事实已保留\"；M16 aggregate repository_test=130 通过但 executor 仍不可用 | specs/workflowhub-m16-evolution-20260831/tasks.md:590 |
| F-003 | 触发覆盖缺口：`scheduleReflection` 仅在 handler 成功（completed）与 handler/发布抛错（failed）两路径调用；preflight/身份/启动失败与阶段未启动不触发任何 reflection 记录 | runtime/stage/stage-runner.mjs:1655-1713 |
| F-004 | schema v1 状态枚举窄：`stage_status` 仅 completed/failed；`status` 仅 ok/degraded/failed；中断/未启动/无执行器无法与失败区分 | runtime/schemas/stage-reflection.v1.json |
| F-005 | M16 是复盘产物唯一上游消费者：候选池（FR-POOL-001..008，两档 tier、observation_id.v1、snapshot 模型）、质量税（FR-TAX-001..007）、页面只读趋势区；M16 spec PFACT-003 指出\"上游真实任务质量验证尚未完成\"——即本任务正是其缺口 | M16 spec.md §5.1/5.2/§4、decision-log F-003；ADR 0022 |
| F-006 | 约束冲突：M16（及 stage-reflection 本体）均已确认\"历史任务不回填\"（M16 decision-log R-013；stage-reflection D-011）；而本任务 R-008 要求决定 20 条历史教训归属 | M16 decision-log.md:28,62；本任务 R-008 |
| F-007 | 历史回填包 lessons 与正式运行时契约不相容：正式 lessons 行用 `entry_kind` + `source_refs` 对象数组 `{task_id,raw_entry_id}`；回填包用 `record_kind` + 字符串 source_refs + task_id=\"unknown-...\"，直接导入会使 `readLessonRows` 整链路 fail | tools/cli/append-lesson-observation.mjs:113-144；回填包 lessons/*.jsonl |
| F-008 | 历史回填包 quality/stage-reflection/historical-records.jsonl（20 行）通过 stage-reflection.v1 schema 校验（20/20 valid）；severity 分布失真：20 条 merged lesson 中 18 high / 2 medium / 0 low | 本会话 AJV 实测；回填包统计 |
| F-009 | SKILL.md 与实际机器链漂移：SKILL.md 要求技能第 1 步调用 derive-consumption-edges.mjs，实际消费边由 validate-stage-reflection.mjs 自动派生（:8,234）；runner 传给 executor 的输入（step/skill outcomes、spec_analyze、code_review、diagnostic）比\"窄投影\"宽 | skills/stage-reflection/SKILL.md:44-46；tools/cli/validate-stage-reflection.mjs:234；runtime/stage/stage-runner.mjs:2110-2123 |
| F-010 | 历史 focused 事实显示框架侧 schema/验证器/页面与 7 个 contract 测试 + real-task E2E 曾全部就绪，且 M16 曾有对应验证；两补丁（confirmation v3、消费边派生）与 raw-before-merge 生命周期符合 ADR 0021。该事实不等于当前 mixed-input 适配完成，也不改变 M16 T010/AC-GOV-002 的 `incomplete/inconclusive` | 本会话历史核验；M16 F-002；当前质量状态见 T601/RISK-002 |
| F-011 | M15 遥控已退役；M16 与 stage-reflection 均不得重建 token/耗时/per-provider 采集 | m15-retirement 结论；M16 R-013 |
| F-012 | 本任务 bootstrap：baseline=eeb9dfa12，worktree=/Users/Hugh/Hugh/Project/workflowhub-workflowhub-stage-reflection-usability-20260901，session_binding=conflict（DSH 无 codex session，如实保留） | task-bootstrap 输出（2026-09-01） |
| F-013 | 历史回填包 20 条 judgment 的 `evidence_refs` 均指向 `quality/evidence/transcript-index.jsonl#<entry>`——该文件只存在于 Downloads 离线包，不在任何正式任务目录；引用悬空 | 回填包 historical-records.jsonl 实测（2026-09-01） |
| F-014 | 历史回填包 20 条全部 `confidence: high` 且 `interventions: [0 条]`：人工介入（用户纠偏/范围修改/停止请求）完全未提取；M16 的"重复介入强信号/质量税"依赖 intervention，历史数据无法提供；20 条全部未过 validator（悬空引用将被降级） | 回填包统计：judgments 20 条、interventions 0 条、confidence high 100%；SKILL.md 验证器规则 |
| F-015 | 导入预演（本会话实测）：把历史记录转正式格式后跑官方 `validateReflectionValue`，`evidence_refs` 的 `#fragment` 形式被 `qualityRefExists` 按完整路径判定不存在 → 结果 `status=degraded`、confidence 由 high 强制降为 medium；即历史 20 条导入后**必然以 degraded/medium 呈现**，除非为每条建立独立证据文件或改写引用 | validator qualityRefExists（validate-stage-reflection.mjs:90-95）；本会话临时 storage 实测（2026-09-01） |

## 需求→决策覆盖矩阵（五维）〔更新至 2026-09-01 Talk 三轮+Grill 后〕

| 维度 | 需求 | 当前处置 |
| --- | --- | --- |
| business goal | R-005/R-009（复盘器可用+信息质量高+服务 M16） | DECIDED：D-001/D-004/D-007（执行闭环+三件套+最小真机验证；真实业务质量 DE-001） |
| flow/surface | R-002/R-004/R-007（用户流程、页面范围、M16 对齐） | DECIDED：D-006/D-005（页面最小生效面；M16 消费改进纳范围） |
| data/state | R-006/R-008（评审材料、20 条教训归属、schema 状态语义） | DECIDED：D-002/D-003/D-005（诚实状态+一次性正式导入+版本策略） |
| success/failure/acceptance | R-001/R-003（流程合规、验收口径） | DECIDED：D-007（测试+审查+最小真机验证；真实任务 DE-001） |
| constraints/non-goals/deferrals | 初判非目标清单 | DECIDED：D-008（六条非目标+延期交接；runner 限 G-001；M16 仅必要才动） |

## 收敛检查

| 目标 | 范围 | 方案 | 验收 |
| --- | --- | --- | --- |
| 复盘器正确使用、收集高质量改进信息、服务 M16（R-005/R-009） | 复盘器可用性+信息质量：执行闭环/诚实状态/历史一次性导入/三件套/页面最小生效面/M16 消费改进 | 用户拍板：CLI 内部命令 reflect+run 不占位；unavailable/not_scheduled；20 条正式导入（分项目+转换适配器+证据落库+介入补录）；prompt 重写+schema v2 三件套；枚举 v1 原地扩+v2 文件；页面 3 文件 | 确定性契约测试绿（含新旧记录兼容 fixture+M16 契约）+独立审查+最小真机验证（reflect 全链/失败路径/页面/M16 消费）；真实业务任务端到端+用户抽查=DE-001 延期（用户原话 T-014） |

> 已拒绝方案摘要：宿主注入 executor（违宪无先例）｜纯文档人工协议（分叉）｜保持 failed 语义（误导）｜replay-only（数据稀少）｜严格行级证据文件（+20 治理文件）｜并入单项目（跨项目污染）｜只重写 prompt（机器吃不到）｜全部原地扩 v1（版本语义糊）｜完全不动页面（新状态误导）｜任务视图加状态列（回归面大）｜只测试+审查（LLM 合规盲区）

## UI applicability（重算于 Talk+Grill 后）

```json
{
  "result": "ui",
  "raw_requirement": "用户原文：\"需要我排版的事情，请在talk环节确定，问的详细一些。\"——Talk 第 2 轮 q5-page 已定页面处理",
  "project_inventory": "现有 monitor 静态页面（任务视图含 stage 卡 reflection status 徽章 + overall pending + lessons + 消费边诊断）；M16 只读 Evolution 趋势区已合入 main（建议行动/仅供参考/质量税三区块）",
  "planned_or_changed_frontend_fact": "已冻结：仅最小生效面——schema v1 枚举扩 unavailable/not_scheduled + 模板 stateNames/stateLabel 补 not_scheduled（unavailable 已存在，R-101 核实）+ tests/contract/build-reflection-page.test.mjs 同步；mjs 透传不改；M16 Evolution 趋势区与任务视图其他字段不动",
  "source_reasons": ["raw_requirement 明确排版事项需确定", "project_inventory 既有页面+M16 扩展", "planned frontend fact 已冻结（Talk 第 2 轮 T-006 用户拍板）"]
}
```

> 结论：`ui`（三个输入源一致指向 UI 相关且计划改动已冻结）。

## 调研

### research-inputs（Talk round 1 后，2026-09-01，两个并行调研代理）

**R-101（M16 页面改动核验，调研代理 c925f5a9 返回）**：

1. M16 方案与实现均已涉及 monitor 页面：spec.md FR-PAGE-001~005（只读 Evolution 趋势区，含建议行动/仅供参考/前期质量税三区块，20 条分页+证据链接+响应式）；实现已合入 main（406ae41c8/340beb5ab 等；main HEAD=eeb9dfa12 与 M16 worktree 一致，两文件 diff 为空）。
2. M16 **未动**任务视图（tasks.md:243 T006 DO NOT TOUCH："现有 task view 字段、runtime data fetch/control plane"），也未新增"每 stage 复盘状态显示"语义。
3. **新状态落地阻塞**：schema v1 `status` 枚举仅 ok/degraded/failed（stage-reflection.v1.json:27）——若复盘记录出现 unavailable/not_scheduled 而 schema 未扩，模板 `validateSchema` 失败 → 整条 reflection 被判 unavailable、数据丢失；模板 `stateNames/stateLabel`（template.html:174,179）有 unavailable 但无 not_scheduled。
4. 页面最小改动面：`runtime/schemas/stage-reflection.v1.json:25,27` 枚举扩 unavailable/not_scheduled（必改，否则校验丢数据）+ `build-reflection-page-template.html:174,179` 词表加 not_scheduled + `tests/contract/build-reflection-page.test.mjs` 状态断言同步；mjs 透传（:152-156, :235）无需改。
5. **结论（q5-page 依据）**：M16 已涉及页面（Evolution 趋势区）→ 按用户指示其边界（Evolution 三区块+任务视图整体）不动；但"让监控页面真的生效"的最小面 = schema 枚举扩展 + 模板词表 + 测试（属于 q2 诚实状态决策的落地，不重复建页面）。

> 本轮执行事实：两个调研代理并行（子代理上下文）；R-101 完成；R-102（step/skill 执行模式与宪法最佳实践）进行中。

**R-102（step/skill 执行模式与宪法最佳实践，调研代理 51eac6fe 返回）**：

1. **step 执行主体=当前主会话**：steps.json 只是拓扑声明（steps.json:1-19）；运行时无 step 执行器（stage-handlers.mjs:2671 只校验 receipts/facts）；执行结果经 会话→session-event CLI→tmp handoff→bridge→adapter 记录 step_outcomes（stage-agent-outcome-adapter.mjs:574,656,808）；运行时只认证（stage-runner.mjs:137-156,587）。
2. **skill 执行模式**：全体 `execution: inline`，宿主会话在当前 agent 上下文执行（make-decision/SKILL.md:88-91）；运行时只做消费者绑定（stage-skill-runtime.mjs:10-25,101-115）。**无生产侧 host 注入先例**：`stageReflectionExecutor` 与 `runControlledUiQa` 均只有测试注入；stage-reflection 唯一不一致点=consumer 要求注入 **LLM 判断函数**（stage-runner.mjs:910），函数无法经 CLI 子进程注入。
3. **主流注入机制**：CLI 子进程+文件/环境约定（session-event/bridge/validator 同构）；DSH 无 CODEX_SESSION_ID → lifecycle 事件记录不可用，但纯 CLI（bridge/run/validator）双宿主可用（session-event.mjs:181-187）。
4. **宪法方向**：无条文禁止框架注入，但 F1/F2/F10/F11/S8 方向明确指向"主会话 inline 执行 + 窄 CLI 边界"；设计层已裁决（archive worktree stage-reflection decision-log.md:72-74,255；move-map:2236-2243 consumer="current-session host reflection executor"）。**断裂点**：5 份 workflow SKILL.md 与 docs/standard-workflow.md 对 stage-reflection 零提及；而 runOfficialStage 恒调度（stage-runner.mjs:1655-1673,2120-2126）→ 真实任务恒发布失败记录。
5. **推荐方案 B（CLI 内部命令）**：新增私有命令如 `reflect --input=<judgment.json>`，机器完成 append-lesson-observation prelude + validateReflectionValue + lessons 合并 + 固定路径发布（复用 runStageEndReflection 现有逻辑）；run 仅在注入 executor 时自动调度；会话在 stage 末调 reflect。一致性=仓库唯一主流机制；改动面=stage-runtime.mjs+move-map+测试+工作流 SKILL.md 一句；宪法=最合；DSH/Codex 均可用。风险=与 run 自动发布的固定路径 EEXIST 冲突（task-kernel-implementation.mjs:357-363，不同字节即失败）→ 须明确"run 无 executor 时只记 step_outcomes（unavailable 事实）不自动发布失败记录"。
6. 备选：A 纯文档化人工协议（会话侧分叉重复 validator/publish 实现，维护性差）；C host adapter 注入 executor（违 F10/F8/S8、LLM 执行器必须回连会话，不推荐）。

## 三轮 talk

### Talk round 1（2026-09-01，真实 ask→reply，GUI ask_user_question）

| talk_id | 问题/选项 | 后果/风险 | 用户选择/原文 | 队列变化 | source/evidence |
| --- | --- | --- | --- | --- | --- |
| T-001（q1-executor 复盘器执行方式） | 主会话人工协议 / 框架自动注入 / 两步走 | 人工协议当天可用但靠自觉；框架通道自动但 DSH 无适配器、周期长；两步走范围大 | **未直接选**：用户要求先调研——"我不想违反workflowhub宪法，帮我看看每个stage中其他的step是如何执行的，最佳实践应该是怎样比较合适？" | q1 转入 research-inputs（调研其他 step/skill 执行模式与宪法最佳实践） | Talk round 1 用户回复原文 |
| T-002（q2-status 无复盘时记录语义） | 新增诚实状态 / 保持 failed / 不记录 | 诚实状态区分真假失败；failed 误导；不记录丢数据 | **新增诚实状态（推荐）**：加 unavailable/not_scheduled，页面原样显示，与"复盘失败"分开 | schema 状态枚举扩展入范围 | 同轮 q2-status |
| T-003（q3-history 20 条教训归属） | 正式导入（含规则修订）/ replay-only / 正式导入+保留离线版 | 正式导入需修订 M16"不回填"约束+转换器+复核；replay-only 数据仍稀少 | **正式导入（含规则修订）** | 修订 M16 R-013 约束成为本任务决策点；20 条教训导入入范围 | 同轮 q3-history |
| T-004（q4-quality 信息质量提升） | prompt 重写+事实投影 / 只重写 prompt / 只加字段 | 两条腿=机器可验证+LLM 收集全；只 prompt 机器吃不到；只字段会空 | **prompt 重写+事实投影（推荐）** | SKILL.md 重写 + schema 事实投影（status_matrix/identity/source_completeness）入范围 | 同轮 q4-quality |
| T-005（q5-page 页面范围） | 不动页面 / 微调加复盘状态 / 增加复盘信息展示 | 不动最小但状态不可见；微调要改共享投影器；展示最多但维护面大 | **未直接选**：用户要求检查 M16 分支是否已涉及页面改动——"请检查现在的M16分支在任务设计和方案实现中有没有涉及到这个页面的改动，如果有的话，你就别动了。如果完全没有的话，就需要你来进行页面的改动，让这个监控页面真的生效。" | q5 转入 research-inputs（M16 页面改动全貌核验） | 同轮 q5-page |

> 第 1 轮未决：q1（执行模式=调研后再定）与 q5（页面=M16 是否已动，调研后定）；q2/q3/q4 已定方向。

### Talk round 2 批次 1（2026-09-01，真实 ask→reply，GUI ask_user_question）

| talk_id | 问题/选项 | 后果/风险 | 用户选择/原文 | 队列变化 | source/evidence |
| --- | --- | --- | --- | --- | --- |
| T-006（q5-page 页面处理） | 仅最小生效面 / 完全不动 / 任务视图加状态列 | 最小生效面=3 文件小改保测试绿；完全不动则新状态在页面误导；状态列最直观但动任务视图 | **仅最小生效面（推荐）**：schema 枚举扩 unavailable/not_scheduled + 模板词表补 not_scheduled + 测试同步；M16 Evolution 趋势区与任务视图其他字段不动 | 页面范围定稿：最小生效面 3 文件 | Talk round 2 q5-page（基于 R-101） |
| T-007（q6-schema-v2 事实投影字段） | 核心三件套 / 只要 status_matrix / 四件套 | 三件套对治 close≠验收+身份漂移+压缩丢因果；只要 matrix 最小但漏两大模式；四件套全但消费压力大 | **核心三件套（推荐）**：status_matrix + identity 快照 + source_completeness | schema v2 方向定稿（operational_tail 延期） | 同轮 q6-schema-v2 |
| T-008（q7-history-evidence 证据落法） | 索引文件落库+文件级引用 / 严格行级独立文件 / 接受降级 | 文件级引用校验可过、置信度保留；行级最严谨但 +20 文件治理；降级最诚实但信息质量下降 | **索引文件落库+文件级引用（推荐）**：transcript 索引作为正式证据文件，20 条引用指向它 | 历史导入方式定稿（行级细节保留在索引文件内） | 同轮 q7-history-evidence（基于 F-015 预演） |
| T-009（q8-intervention 人工介入补录） | 补一轮提取 / 不补 / 只补 workflowhub 10 个 | 补=M16 强信号/质量税立刻有样本；不补短期仍空；只补 WH 折中 | **补一轮提取（推荐）**：从 20 个会话提取人工介入事件补进导入包 | 历史导入包扩展：含 intervention 提取 | 同轮 q8-intervention（基于 F-014） |
| T-010（q9-acceptance 验收） | 交付验收+下一真实任务验证 / 本任务内真实验证 / 只做测试+审查 | 交付+真实验证最稳但等真实任务；本任务内验证周期长；只做测试+审查最快但与"复盘器真实使用"目标需延期验证 | **只做测试+审查**（未选推荐项）：与 M16 D-005 一致——不等待真实任务数据完成，后续有问题重开任务 | 验收=测试+审查；真实任务端到端验证转延期交接（DE） | 同轮 q9-acceptance |
| T-011（q10-nongoals 边界） | 全部接受 / runner 也不动 / M16 组件也可调 | 全部接受最稳；runner 不动则中断记录缺失；M16 可调范围扩大 | **M16 组件也可调**（未选推荐项）：M16 已建组件如有问题可顺手改 | 边界放开：M16 组件可调（需与 M16 worktree 未完成改动协调，详见 T-012 细化） | 同轮 q10-nongoals |

### Talk round 2 批次 2（2026-09-01，真实 ask→reply，基于 R-102 定稿）

| talk_id | 问题/选项 | 后果/风险 | 用户选择/原文 | 队列变化 | source/evidence |
| --- | --- | --- | --- | --- | --- |
| T-012（q1-executor-final 执行方式定稿） | CLI 内部命令 / 纯文档人工协议 / 宿主注入 executor | CLI 命令符合宪法且双宿主可用；纯文档会分叉重复实现；宿主注入违宪且 DSH 不可用 | **CLI 内部命令（推荐）**：新增私有 reflect 命令（会话产出判断 JSON→机器完成 prelude+校验+合并+发布）；run 无 executor 时不再自动发布"失败"记录 | 执行方式定稿：CLI 内部命令 + run 调度条件修改 | Talk round 2 q1-executor-final（基于 R-102） |
| T-013（q12-m16-boundary M16 边界细化） | 仅必要才动 / 主动检视修复 / 改回完全不动 | 必要才动=冲突风险最小；主动检视=范围扩大（M16 开发中）；完全不动=新状态可能延迟 | **仅必要才动（推荐）**：共享 schema/投影器必要时可改，保持 M16 契约测试绿；不主动检视 M16 问题 | M16 边界定稿：必要改动须保持 M16 契约绿，不主动扩大 | 同轮 q12-m16-boundary |

> 第 2 轮完成：方向全部收敛（执行方式=CLI 内部命令；状态=诚实枚举；历史=正式导入+证据落库+介入补录；信息质量=三件套+prompt 重写；页面=最小生效面；验收=测试+审查+真实任务验证延期；M16=仅必要才动）。

### Talk round 3（2026-09-01，真实 ask→reply，处置方向审查 findings）

| talk_id | 问题/选项 | 后果/风险 | 用户选择/原文 | 队列变化 | source/evidence |
| --- | --- | --- | --- | --- | --- |
| T-014（q13-acceptance-verify 验收加真机验证） | 加最小真机验证 / 只测试+审查记录风险 / 真机验证用真实任务 | 最小真机验证修复 F-002 前科（绿灯但不可用）；只测试+审查风险显式记录；真实任务周期最长 | **加最小真机验证**（用户未选选项、自定义补充）："可以加最小真机验证，但是注意不要违反workflowhub宪法" | 验收=测试+审查+最小真机验证（脚本化场景：reflect 全链+页面+失败路径；宪法约束：F9 可证伪/F10 自动化按收益/复用既有 E2E 模式不新增 gate） | Talk round 3 q13 |
| T-015（q16-schema-version schema 版本策略） | 枚举 v1 原地扩+新 v2 文件 / 全部原地扩 v1 / 全新 v2 冻结 v1 | 选1语义清晰但 M16 消费侧需认两版；原地扩改动最小但版本语义糊；全 v2 改动面最大 | **选1**，并附范围说明："需要在当前任务中对M16的消费方式进行改进，原本的M16任务已经在开发了，我不会去那边增加需求，只会在那边开发完成后merge进当前分支，在当前分支修改" | schema 策略=枚举 v1 原地扩 + 新 stage-reflection.v2.json；**M16 消费方式改进纳入本任务范围**（M16 已通过 `cdafb4446` 合入，当前分支/main 已同指 `fff255c78`；本任务仅在 T601 核验后改消费侧，不动 M16 归档材料；T010/AC-GOV-002 仍 incomplete/inconclusive） | Talk round 3 q16 |

> 以上 T-015 表格为历史用户决策原文；其当前 merge provenance（`cdafb4446`）与基线（`fff255c78`）及消费面状态见下方 Post-build-plan factual addendum，未改写历史选择。

**findings 处置更新**：FND-D02→fixed（T-014：加最小真机验证）；FND-D05→fixed（T-015：选1+M16 消费改进纳范围）；其余 FND-D01/D03/D06/D08/D09/D11/D12 按上表 fixed 处置；FND-D04（M16 已合入 main 的事实修正）与 FND-D07（unavailable 词表已存在）已核实修正。

## grill

| grill_id | CONTEXT/冲突 | 结论 | ADR/四项退出 | source/evidence |
| --- | --- | --- | --- | --- |
| G-001 | "诚实状态"生效需要 runner 两处最小改动（无 executor 不发布失败记录；preflight/启动/中断失败落 not_scheduled 事实）——Talk 第 2 轮 q10 未明确 runner 权限 | 用户拍板：**允许 runner 最小改动**（限两处，不动阶段序列/状态机等主骨架语义） | 纳入 D-002/D-008 | grill round（g1-runner-change，用户选"允许 runner 最小改动（推荐）"） |
| G-002 | 20 条历史教训横跨 WorkflowHub 与 PaperBuilder 两项目；M16 候选池按项目聚合，混入会污染 | 用户拍板：**分项目存储**（WorkflowHub→workflowhub lessons；PaperBuilder→paperbuilder 项目，若无项目目录则保留在离线索引+标注） | 纳入 D-003 | grill round（g2-history-project，用户选"分项目存储（推荐）"） |

- **Grill 覆盖矩阵**：goal=R-005/R-009 ✓；flow_or_surface=R-002/R-004/R-007 ✓；data_or_state=R-006/R-008 ✓（含 FND-D01 转换适配器、FND-D06 状态转移表、g2 分项目）；success_failure_acceptance=R-001/R-003 ✓（T-010/T-014）；constraint_non_goal_defer=初判非目标+T-011/T-013/T-015+g1 ✓——五类全覆盖，无未决消息类。
- **四项退出检查**：①外部依赖接口已核实真实定义（R-101/R-102 实测：executor 注入点、模板词表、validator 派生、createImmutable EEXIST、M16 已合入 main）pass；②字段/路径命名唯一权威来源（schema v1/v2 文件、状态枚举、reflect 命令名——本任务决策定义，build-spec 冻结，move-map 登记）pass；③失败路径语义明确（状态转移表 FND-D06+失败不阻断+validator 降级+导入转换失败回滚）pass；④范围边界写死（非目标五条+g1 限两处+g2 分项目+M16 仅必要才动）pass。
- **grill 后文档**：CONTEXT.md＝changed（新增术语：复盘执行闭环 reflect 命令、unavailable/not_scheduled 复盘状态、status_matrix 事实投影、历史回放导入；docs 引 ADR 0023）；ADR＝created 0023（三项判据均真：难反转=执行模式/记录语义/修订既定约束；无背景意外=“复盘失败”语义改变+M16 消费；真实取舍=CLI 命令 vs 宿主注入、导入 vs 冷启动）；术语与 ADR 0021/0022 冲突＝无（0023 继承判断层身份标注与两档分层）。
- 决策更新：G-001→runner 两处最小改动；G-002→历史导入分项目。

## 审查处置（detail-advice，2026-09-01）

- 独立细节建议（wh-review make-decision/detail）：**available（partial）**，5 家 provider 中 4 家有效返回（kimi/coding、grok/grok、antigravity/flash、opencode/pax3.8）；codex/luna 失败（PUBLIC_RESULT_INVALID：provider output 含私有绝对路径被过滤，如实保留）；material_id=395855000c5df6d8fbe69b6b47e1c89352c8e1fd2c086f74667f0b982dc7ed53；runtime_id=2ebf98c6-1215-47a5-99d9-ce205cd2cfc3；findings 6 条。
- 执行事实：host_provider=dsh；provider 真实返回（kimi 151s / grok 25s / antigravity 53s / opencode 189s / codex 180s 失败）；grok 与 antigravity 无 findings（有效空结果）；codex/luna 失败原因如实保留不再重试。

| finding_id | 原始事实/来源 | 后果 | status | owner/consumer/retain_or_delete |
| --- | --- | --- | --- | --- |
| FND-DD01（kimi major） | approved_direction 只提交摘要，完整 decision-log 在 bundle 外 | 审查者无法核对完整选项/后果/风险 | **fixed（材料说明）**：完整 decision-log.md 在认证 worktree specs/<task-id>/（唯一事实源）；本任务后续阶段（build-spec/plan/code）以完整文档为准；最终确认卡向用户呈现完整方向 | agent/保留 |
| FND-DD02（kimi major） | 验收引用宪法 F9/F10 但条款不在 bundle | 条款级可追溯性无法核验 | **fixed**：宪法条款原文（F9 可证伪不假绿、F10 自动化按真实收益）已在本任务工作区 CONSTITUTION.md 中，验收引用将写条款全名+编号（可追溯） | agent/保留 |
| FND-DD03（kimi major） | 用户流程依赖 SKILL.md 五类问题，但 SKILL.md 未在 bundle | 判断 JSON 格式与验收一致性无法核验 | **fixed（并入 FND-DD04）**：重写后 SKILL.md（仓库文件）+五类问题结构化输出由 build-spec 定义并在真机验证场景断言 | agent/保留 |
| FND-DD04（opencode major） | 真机验证链从 raw prelude 开始，省略"主会话按 SKILL.md 产出判断 JSON"；D-004 SKILL.md 重写无行为级验收 | 验收全绿但会话产出 JSON 可能被 reflect 拒绝 | **fixed（D-007 修订）**：验收③增加场景——以会话真实视角构造判断 JSON（先会话后机器、不可伪造）→ 必须通过 reflect 校验与发布；该步不被 DE-001 延期覆盖 | agent/保留 |
| FND-DD05（opencode major） | 完成判据无"20 条正式导入完成"断言；分项目/severity/介入补录未在验收复述 | 交付可能"20 条未实际落库"却验收通过 | **fixed（D-007/D-003 修订）**：验收增加"历史导入完成"断言——20/20 条正式 lessons 落库（分项目）+证据文件落库+severity 校准核验 | agent/保留 |
| FND-DD06（opencode minor） | runner 改动范围限制（G-001 两处）未在 spec 边界复述 | 验收无法核查最小性 | **fixed（D-008 修订）**：边界写明 runner 改动=两处（①run 无 executor 不发布失败记录；②未触发路径落 not_scheduled 事实）+位置 | agent/保留 |
| FND-DD07（opencode minor） | v2 文件（路径+三字段）未在迁移/范围点名 | 实现者只看 v1 面可能漏 v2 交付 | **fixed（D-005 修订）**：范围写明新建 `runtime/schemas/stage-reflection.v2.json`（status_matrix/identity/source_completeness），M16 投影测试显式覆盖 v2 | agent/保留 |
| FND-DD08（opencode minor） | 状态转移表"条件→状态"无断言 | 新状态 fixture 无可断言预期 | **fixed（D-002 修订）**：spec 边界复述状态转移表（条件→状态→writer），fixture 按表断言 | agent/保留 |

> 处置后修订：D-007（真机验证含会话产出判断 JSON 环节+历史导入完成断言）；D-003（导入完成=20/20 落库断言）；D-008（runner 两处改动明确位置）；D-005（v2 文件显式）；D-002（状态转移表进 spec）。

## 决定

### D-001（执行方式：CLI 内部命令 + run 调度条件）

- question/final_option: 复盘器怎么被执行？→ 会话产出判断 JSON，私有 reflect 命令完成机器闭环；run 无 executor 时不自动发布失败记录
- recommendation/plain_language: 推荐；与仓库所有既有机制同构、双宿主可用、合宪
- decision: 新增私有命令（暂名 `reflect`，唯一命名由 build-spec 冻结+move-map 登记）：会话在 stage 末产出 judgment JSON → 命令完成 raw prelude 校验（append-lesson-observation 已由 runner 前置）、validateReflectionValue、lessons 合并、固定路径 immutable 发布，复用 runStageEndReflection 现有批处理逻辑；`stage-runtime run` 仅在注入 executor 时自动调度，无 executor 时不发布"失败"记录（只留真实未执行事实）；5 份 workflow SKILL.md 与 docs/standard-workflow.md 增补一句阶段末执行指令（R-102 确认零提及）
- source_type/reference/exact_excerpt: R-102 推荐方案 B；Talk round 2 T-012（q1-executor-final）；SKILL.md 37-53 与 D-002（复盘器任务）设计意图
- approval_binding: 待最终确认（2026-09-01 Talk+Grill 后）
- facts_and_constraints: F-001（executor 缺失）；F-015/EEXIST（固定路径内容寻址，任务 kernel createImmutable）；F-005（M16 唯一消费者）
- Logic: 现有机制一律"会话执行+CLI 记录"→ 复盘器照搬 → 机器闭环由命令承担 → run 不占路径、会话可后补
- choice_reason/impact: 一致性与宪法最优；影响 stage-runtime.mjs、move-map、5 份 SKILL.md、契约测试
- consequences_and_risks: 复盘依赖会话合规（自愿执行）→ 由"未复盘"状态与页面可见性兜底；LLM 合规风险由 T-014 最小真机验证缓解
- rejected_alternatives: 纯文档人工协议（分叉 validator/publish）；宿主注入 executor（无先例、违 F1/F2/S8、DSH 不可用）
- unresolved_items/owner: reflect 命令精确参数/输入 schema/与 run 的先后约定 → build-spec 定义
- Supersedes: none

### D-002（记录语义：诚实状态枚举 + 状态转移表）

- question/final_option: 没执行/没触发时怎么写？→ 新增 unavailable/not_scheduled 诚实状态，与 failed 分开
- recommendation/plain_language: 推荐；页面能区分"复盘器坏了/没人执行/没触发"
- decision: schema 状态枚举扩 `unavailable`（无人执行/执行器缺失）与 `not_scheduled`（未触发：preflight/启动/身份失败、中断、未启动、会话未执行复盘）；状态转移表（FND-D06/FND-DD08 定案：条件→状态→writer，spec 复述并作为 fixture 断言依据）——completed/failed 路径由 run 触发；无 executor → unavailable（不占固定路径，会话后补真记录）；未触发/中断/未启动 → not_scheduled；页面原样显示，与 failed 分开；runner 允许 G-001 两处最小改动（位置见 D-008）
- source_type/reference/exact_excerpt: Talk round 1 T-002；FND-D06；G-001
- approval_binding: 待最终确认
- facts_and_constraints: F-003（触发覆盖缺口）；F-004（schema 枚举窄）；F-015（validator 悬空降级规则复用）
- Logic: 三类不同事实不能压成一个 failed → 枚举扩展 + 状态转移 → 每路径有 status 有 writer
- choice_reason/impact: 消除假象、数据诚实；影响 schema/runner/页面/测试
- consequences_and_risks: 页面与 M16 需认新状态（小改）；旧记录不受影响（枚举是扩展）
- rejected_alternatives: 保持 failed（误导）；不记录（静默丢数据）
- unresolved_items/owner: 状态转移表逐路径 writer 与时间戳语义 → build-spec 定义
- Supersedes: none

### D-003（20 条历史教训正式导入：一次性转换适配器 + 分项目 + 证据落库 + 介入补录）

- question/final_option: 20 条历史教训怎么落户？→ 正式导入（修订"不回填"约束），分项目、字段级转换、证据落库、补一轮介入提取、severity 校准
- recommendation/plain_language: 推荐；M16 候选池立刻有基础样本，介入信号补上
- decision: ①正式导入（修订 M16 field 的"历史任务不回填"约束为"经用户批准的**一次性**历史回顾导入"，非每任务回填机制）；②分项目存储（WorkflowHub→workflowhub lessons；PaperBuilder→paperbuilder 或离线标注）；③一次性转换适配器：entry_kind 字段映射、source_refs 对象化 `{task_id,raw_entry_id}`、unknown-<thread> task_id 保留并标注"历史回放"、20 条全量预演跑 validator+幂等/失败回滚；④证据=transcript 索引文件落正式存储（quality/evidence/ 下文件级引用，行级细节保留在文件内）；⑤补一轮人工介入提取（20 个会话的用户真实回复+step 锚点）；⑥severity 校准（occurrence_count≥2 或用户确认→high；单次→medium；体验→low）；⑦导入完成断言（FND-DD05）：20/20 条正式 lessons 落库（分项目）+证据文件落库+severity 校准核验
- source_type/reference/exact_excerpt: Talk round 1 T-003、round 2 T-008/T-009；FND-D01（blocking 转换方案）；G-002（分项目）；F-013/F-014/F-015
- approval_binding: 待最终确认
- facts_and_constraints: F-006（约束冲突：M16 R-013）；F-007（契约不兼容）；F-008（severity 失真）；F-013/F-014/F-015
- Logic: 用户明确要这些教训 → 与"不回填"冲突 → 经批准的例外（一次性、非机制）→ 字段级转换保证链路不断 → 证据与介入补齐让 M16 真能用
- choice_reason/impact: 数据稀缺问题直接缓解；影响 lessons 目录、导入工具/脚本、M16 早期候选池
- consequences_and_risks: 导入记录带"历史回放"身份、非当前任务事实；介入提取为 LLM 分析（低置信度标注）；转换工具为一次性（不做成常规回填机制）
- rejected_alternatives: replay-only（数据仍稀少）；严格行级独立文件（+20 治理文件）；接受降级（信息质量下降）；全部并入 workflowhub（M16 跨项目污染）
- unresolved_items/owner: 转换器精确字段映射表与导入校验器 → build-spec 定义
- Supersedes: 修订 M16 R-013 的"历史任务不回填"（仅限本任务一次性导入）

### D-004（信息质量：prompt 重写 + 事实投影三件套）

- question/final_option: 信息质量怎么提升？→ SKILL.md 重写（五类问题引导 + F-009 漂移修正）+ schema v2 事实投影核心三件套
- recommendation/plain_language: 推荐；主观判断背后有机器事实，M16 才能聚合验证
- decision: ①SKILL.md 重写：按用户五类问题（帮助/提升/阻塞/介入原因/简化/可简化）引导收集，输出区块结构化（FND-D11）+ 机器链描述与实际一致（FND-D08：消费边由 validator 自动派生、技能不重复调用）；②schema v2 事实投影：`status_matrix`（code/verify/physical_close/acceptance/release 五栏状态，每栏绑证据引用，禁止推导质量结论）、`identity`（task/worktree/branch/attempt/snapshot/material revision 快照）、`source_completeness`（compaction/截断/可见范围/unknown 原因）；operational_tail 延期（DE）；③judgment≠fact 保持（ADR 0021）
- source_type/reference/exact_excerpt: Talk round 1 T-004、round 2 T-007；FND-D08/D09/D11/D12；R-009（用户动机原文）
- approval_binding: 待最终确认
- facts_and_constraints: F-008/F-009；M16 消费（候选池两档/质量税需机器字段）；无遥测（F-011）
- Logic: 单靠 prompt 机器无法验证 → 结构化字段+validator → M16 可聚合；三件套对治 20 任务三大模式
- choice_reason/impact: 判断质量可校验；影响 SKILL.md、schema v2、validator、M16 消费侧
- consequences_and_risks: 信息量上升→复盘产出更大（轻量维持）；事实投影需引用真实证据，缺失标 unknown
- rejected_alternatives: 只重写 prompt（机器吃不到）；只加字段（LLM 不知填什么）
- unresolved_items/owner: 字段精确 schema、五类问题收集最小集、validator 完整性规则 → build-spec 定义
- Supersedes: none

### D-005（schema 版本策略：枚举 v1 原地扩 + 新 v2 文件 + M16 消费改进）

- question/final_option: schema 怎么落？→ 状态枚举 v1 原地扩展（兼容）；三件套新建 stage-reflection.v2.json；M16 消费方式在本任务改进
- recommendation/plain_language: 推荐（用户选 1）；版本语义清晰
- decision: `stage-reflection.v1.json` 原地扩枚举（unavailable/not_scheduled，向后兼容）；新建 `runtime/schemas/stage-reflection.v2.json`（status_matrix/identity/source_completeness 三字段显式，FND-DD07）；v1 保留只读兼容旧记录；**M16 消费方式改进纳入本任务**：M16 完成开发后 merge 进当前分支，本任务在合并后修改 M16 消费侧（候选池/质量税/页面趋势区）以认 v1+v2 并存（用户原话："原本的M16任务已经在开发了，我不会去那边增加需求，只会在那边开发完成后merge进当前分支，在当前分支修改"）
- source_type/reference/exact_excerpt: Talk round 3 T-015（q16-schema-version）；FND-D03/D05/D12
- approval_binding: 待最终确认（历史决策快照；当前材料已由 2026-09-01 最终确认记录接受，且不授权 build-code）
- facts_and_constraints: R-101（M16 已合入 main 且页面共用）；M16 契约测试（保绿要求）；F-005
- Logic: 枚举=兼容扩展进 v1；三件套=语义演进进 v2 → M16 消费需认两版 → 本任务在合并后改消费侧，不动 M16 任务
- choice_reason/impact: 版本清晰、向后兼容；影响 schema/验证器/页面/M16 消费
- consequences_and_risks: （历史记录）当时的 M16 后续改动合并时机不确定（merge 顺序依赖）；兼容性验收入 AC（FND-D12）
- rejected_alternatives: 全部原地扩 v1（版本语义糊）；全新 v2 冻结 v1（M16 改动面最大）
- unresolved_items/owner: v2 字段 schema、M16 消费改动的具体面 → build-spec 定义（决策时未决；当前交接见 T601/T602/T603）

#### Post-build-plan factual addendum（D-005 current-fact；2026-09-01；append-only）

- 历史 D-005 的用户原文与当时的 merge 顺序约束保持不变；`cdafb4446` 仅作 M16 merge provenance，当前任务分支与 main 的当前基线均为 `fff255c78`。
- T601 已完成且仅完成 merge provenance/direct consumer-surface 事实核验；截至本历史 addendum 写入时 T602/T603 仍为 `pending`。当前执行状态以文末 2026-09-03 更正为准。M16 T010/AC-GOV-002 仍为 `incomplete/inconclusive`；此 addendum 不改变历史决定、不授权 build-code。

- Supersedes: none

### D-006（页面：仅最小生效面）

- question/final_option: 页面怎么处理？→ 仅最小生效面（schema 枚举+模板词表+测试同步）
- recommendation/plain_language: 推荐；M16 已做趋势区，我们只让状态如实显示
- decision: 页面改动限 3 处：`runtime/schemas/stage-reflection.v1.json`（枚举扩，v2 另文）、`tools/cli/build-reflection-page-template.html`（stateNames/stateLabel 补 not_scheduled；**unavailable 已存在**（R-101/FND-D07 核实））、`tests/contract/build-reflection-page.test.mjs`（状态断言同步+旧记录兼容）；mjs 透传不改（核实无需）；M16 Evolution 趋势区与任务视图其他字段一律不动
- source_type/reference/exact_excerpt: Talk round 2 T-006（q5-page）；R-101；FND-D07
- approval_binding: 待最终确认
- facts_and_constraints: R-101（M16 趋势区已合入 main）；页面 fail-closed/safeRef 约束
- Logic: 用户要求"M16 已涉及就别动"→ 趋势区不动；诚实状态要显示 → 最小面 3 文件
- choice_reason/impact: 尊重边界、改动最小；影响 3 文件+测试
- consequences_and_risks: 任务视图不显示逐 stage 复盘状态列（用户只看徽章/状态）——最小面决策接受
- rejected_alternatives: 完全不动（新状态误导）；任务视图加状态列（动任务视图、回归面大）
- unresolved_items/owner: 无（状态徽章样式细节 spec）
- Supersedes: none

### D-007（验收：确定性测试 + 独立审查 + 最小真机验证）

- question/final_option: 本任务怎么算成功？→ 测试绿+独立审查完成+最小真机验证（reflect 全链/失败路径/页面/M16 消费）；真实业务任务端到端转 DE
- recommendation/plain_language: 推荐（用户拍板加验证但守宪法）
- decision: 完成判据=确定性契约测试绿（含旧记录兼容 fixture/新状态 fixture/M16 投影+质量税契约）+ 独立审查完成 + **最小真机验证**（构造场景经正式入口跑通 reflect 全链：raw prelude→**会话产出判断 JSON（按重写后 SKILL.md 五类问题结构，该环节必须真实执行且被 reflect 接受）**→validate→merge→publish→页面显示→M16 候选池消费；含成功/失败/未调度/验证失败路径）+ **历史导入完成断言**（20/20 条正式 lessons 落库、分项目、证据文件落库、severity 校准核验）；真实 WorkflowHub 任务的端到端+用户抽查复盘质量 → DE-001 延期（用户拍板 T-014："可以加最小真机验证，但是注意不要违反workflowhub宪法"——F9 可证伪/F10 自动化按收益/复用既有 E2E 模式/验证失败真报失败）
- source_type/reference/exact_excerpt: Talk round 2 T-010、round 3 T-014；FND-D02/D12
- approval_binding: 待最终确认
- facts_and_constraints: F-002（前科：130 测试绿不可用）；LLM 合规依赖（FND-D02）；宪法 F9/F10
- Logic: 链路依赖会话合规 → 机器测试不够 → 构造式真机验证弥补 → 不把"绿色"当"可用"
- choice_reason/impact: 修复前科风险；影响验证脚本/场景构造
- consequences_and_risks: 最小真机验证为脚本化场景，仍不能证明真实业务任务质量（DE 承载）
- rejected_alternatives: 只测试+审查（LLM 合规盲区）；真实任务验证（周期长）
- unresolved_items/owner: 真机验证场景清单/命令 → tasks 定义
- Supersedes: 部分覆盖 T-010 的"只做测试+审查"（增加最小真机验证）

### D-008（非目标、延期交接与 M16 边界）

- question/final_option: 非目标/边界确认？→ 六条接受；M16 仅必要才动；runner 限 G-001 两处
- recommendation/plain_language: 推荐；边界写死
- decision: 非目标＝不重建 M15 遥测/不自动修改 skill/step/不改五阶段主骨架语义（runner 仅两处最小改动且位置明确：①`runStageEndReflection` 无 executor 时不发布"失败"记录（只留未执行事实）；②preflight/启动/身份失败与中断路径落 `not_scheduled` 事实——G-001 用户拍板）/20 条导入为一次性动作（非每任务回填机制）/不做自动删改；M16 边界＝已建组件仅本任务必要才动（共享 schema/投影器/M16 消费改进——T-015），保持 M16 契约测试绿，不主动检视 M16 问题（T-013）；延期＝真实业务任务端到端验证+用户抽查（DE-001）、operational_tail 字段（DE-002）、严格行级历史证据文件（DE-003，如用户后续要求）、历史介入提取的深度校正（DE-004，如样本不足）
- source_type/reference/exact_excerpt: Talk round 2 T-010/T-011、T-013；Talk round 3 T-015；G-001/G-002
- approval_binding: 待最终确认
- facts_and_constraints: F-005/F-011；R-101（M16 已合入 main）
- Logic: 防范围吞并 → 一次性/最小/边界显式 → 延期有主有人
- choice_reason/impact: 范围稳定、冲突风险最小（M16 契约绿）
- consequences_and_risks: 真实验证延期→"复盘质量"仍需下一个真实任务背书（DE-001）
- rejected_alternatives: 主动检视 M16 组件（范围扩大）；replay-only（数据稀少）
- Supersedes: none

## 风险与延期交接

| risk/deferred_id | 风险或延期内容 | 触发/后果 | 处理阶段/owner |
| --- | --- | --- | --- |
| RISK-001 | 复盘依赖主会话合规（自愿执行） | 静默不复盘（无 failed 假象，但有 not_scheduled 可见） | 状态可见性+最小真机验证兜底；用户抽查 |
| RISK-002 | M16 已合入当前基线；其任务 T010/AC-GOV-002 独立质量收口仍 incomplete/inconclusive | 本任务不得把 merge 或既有 focused tests 当作 mixed-input/M16 全质量通过 | T601 已登记 provenance 与 direct consumer surface；T602/T603 在当前分支仅做必要适配；语义/第二事实源扩张即 STOP |
| RISK-003 | 历史导入记录带"历史回放"身份 | M16 可能误读为当前任务事实 | 导入时标注+两档分层（仅供参考档）；用户知情 |
| RISK-004 | 与 M16 共享 schema/投影器 | 改动破坏既有视图 | 契约测试保持绿+兼容性 fixture（FND-D12） |
| DE-001 | 真实 WorkflowHub 任务端到端 + 用户抽查复盘质量 | 复盘器业务质量未验证 | 延期；下一真实任务（用户拍板 T-014） |
| DE-002 | operational_tail 字段（fsck/残留进程/清理） | 物理收尾类经验无法记录 | 延期；后续任务或 schema v2 增补 |
| DE-003 | 严格行级历史证据文件 | 历史证据引用为文件级 | 延期；如需行级引用再补 |
| DE-004 | 历史介入提取深度校正 | 介入提取为 LLM 分析，可能漏 | 延期；M16 数据验证时校正 |

## 质量边界

- 质量事实：direction-advice available（4 provider，17 findings 全部处置）；detail-advice available/partial（4/5 provider，6 findings 全部处置；codex/luna PUBLIC_RESULT_INVALID 如实保留）；Grill 2 轴全部收敛；测试/审查事实由 build-code/verify 阶段产生（本任务基建）。
- 推进资格（仅材料推进语义）：Talk 三轮（T-001~T-015）/Grill（G-001/G-002）/两轮独立建议全部完成并处置；用户最终确认已收到。该事实仅表示 decision/build-plan 材料已获接受，不授权进入 build-code。
- 完成判据：确定性契约测试绿+独立审查完成+最小真机验证（含会话产出判断 JSON 环节+历史导入完成断言）；真实业务任务端到端=DE-001 延期（用户拍板）。
- 不可逆授权边界：本阶段无不可逆动作；后续 close 五动作按既有确认流程。

## 最终确认

- 状态：**accepted**（2026-09-01；仅接受 decision/build-plan 材料，不授权进入 build-code）
- 用户原文与 host-visible 绑定：用户原文＝「确认」（approve-decision 确认卡回复）——经 GUI ask_user_question 真实回复；官方 confirmation 记录已写入 `quality/confirmations/b321a275c1efd0b03743d54f4ca1d66a6c97bc498f82c8bc5815ae26a6abcf31.json`（human-confirmation.v3，material_revision=revision-01fdbc…，snapshot_tree=b3acade1…，reply_text=确认）；host attestation 在 DSH 不可用，如实保留。
- interaction aggregate：见任务追踪目录 `quality/evidence/interactions/`（内容寻址文件，sha256 与文件名自校验；绑定当前 decision-log ref/hash/revision、确认记录和 3 轮 Talk 最小生命周期事实）。
- 未确认内容：无方向性未决；细节（reflect 命令参数/状态转移表/转换器字段映射/五类问题结构化输出/v2 字段 schema/M16 消费改动面）由 build-spec 在 spec.md 定义，决策已定。此处“推进资格”仅指材料阶段的接受，不代表 build-code 授权；当前 build-code 明确暂停。

## 阶段收口校验（spec-analyze，2026-09-01）

- make-decision 语义覆盖自检（verifier=main agent 手动执行 spec-analyze 口径的 7 项检查；runtime 认证的 spec-analyze outcome 因未走 stage-runner 认证链保持 unavailable，如实保留）：
  1. 原始需求 R-001..R-009 → D-001..D-008 映射：全表无遗漏（见五维覆盖矩阵，全部 DECIDED）✓
  2. 原始需求/用户流程/页面范围/数据状态/成功失败边界/非目标/延期一致表示：原始需求表+目标+成功/失败边界+范围+非目标+D 条目+风险延期交接+收敛检查存在且互指 ✓
  3. 无矛盾/漂移/范围吞并：direction/detail 两轮审查全部 findings 处置（含 blocking：历史导入转换方案已补）；假设③（M16 合并状态）已按事实修正 ✓
  4. 任务与 AC：本阶段为决策阶段，无 Phase；FR/AC 由 build-spec 承接（决策卡已指明验收=测试+审查+最小真机验证）✓
  5. DEFER/OPEN 交接：DE-001~004 均有 owner/触发/关闭条件；未决细节指向 build-spec ✓
  6. packet 证据 vs 推断：两轮审查均真实 provider 输出（direction 4 家/17 findings；detail 4 家有效 6 findings+1 家失败如实保留），findings 逐条处置 ✓
  7. 发现项（若有）在本地修复后再声明完成：无遗留语义 finding（未决细节属 build-spec 定义，方向不变）✓
- 结论：make-decision 语义覆盖通过（手动口径）；认证口径 unavailable，如实保留。

> 本轮执行事实：session-event 记录命令在 DSH 不可用（no codex session id），如实保留；confirm 命令正常写入确认记录（v3）；aggregate 已按内容寻址写入并校验。

## 审查处置（direction-advice，2026-09-01）

- 独立方向建议（wh-review make-decision/direction）：**available**，4 家异源 provider 全部返回（kimi/coding、antigravity/flash、opencode/pax3.8、codex/luna）；material_id=0822191505f98257a3c6cc8a778c222a8ae1e99971eeee7c301c7ab1a430d26d；runtime_id=e1cf8de1-147d-47ed-820e-3d275affa973；findings 共 17 条（含 codex/luna 1 条 blocking）。
- 执行事实：host_provider=dsh；provider 真实返回（kimi 156s / antigravity 92s / opencode 243s / codex 110s）；usage 仅 opencode 有（15434 token，如实保留）。

| finding_id | 原始事实/来源 | 后果 | status | next_action/evidence_ref | owner/consumer/retain_or_delete |
| --- | --- | --- | --- | --- | --- |
| FND-D01（kimi major + opencode minor + codex/luna **blocking**） | 历史导入只谈证据/介入/severity，未定义 F-007 字段级契约不兼容的转换方案 | 按现状字节导入会让整条链路 fail | **fixed（方向补充）** | 导入方案加一次性转换适配器：entry_kind 字段映射、source_refs 对象化、unknown task_id 标注"历史回放"、转换后全量预演（20 条跑 validator）+ 幂等/失败回滚；mapping 规则进 spec | agent/保留 |
| FND-D02（kimi + opencode + codex/luna major） | 验收=测试+审查不覆盖新执行路径的 LLM 合规依赖（主会话自愿读 SKILL.md→产出 JSON→调 reflect）；F-002 前科=130 测试绿仍生产不可用 | 交付后可能"绿灯但复盘器仍没跑起来" | **needs_human** | Talk round 3（q13） | 用户 |
| FND-D03（kimi minor） | schema 三件套只声明向后兼容，未评估 M16 消费侧影响 | 与 M16 契约测试冲突风险 | **fixed（方向补充）** | 兼容性验收=旧记录 fixture/新状态 fixture/M16 投影+质量税契约测试（并入 FND-D12）；v2 落地方式见 q16 | agent/保留 |
| FND-D04（antigravity major） | 关键假设③称"M16 未合并"与事实冲突（R-101/F-002：M16 已合入 main，main HEAD=M16 HEAD） | 交付隔离与冲突防护策略失真 | **fixed（假设修正）** | 假设③改为：M16 已合入 main（merge-base 验证），本任务防护重点=已合入代码+契约测试回归；M16 任务未收尾（T008 incomplete），后续可能继续改动 | agent（Talk round 3 告知用户） |
| FND-D05（opencode major） | 三件套落 v2 新文件还是 v1 原地扩展未定；"3 文件/mjs 透传不改/M16 契约绿"依赖此 | 页面最小面与 schema 版本描述矛盾 | **needs_human** | Talk round 3（q16） | 用户 |
| FND-D06（opencode major） | 状态枚举定了但状态转移表缺失：每个 stage-end 路径（成功/handler 失败/preflight 失败/中断/未启动/会话调 reflect/会话未调）→ 什么状态→谁写 | 实现时无法保证"未复盘"由正确 writer 落盘 | **fixed（方向补充）** | 状态转移表入方向：completed/failed 走 run 路径；无 executor→unavailable（不占固定路径）；未触发/中断/未启动→not_scheduled（raw prelude+投影兜底派生）；会话未调 reflect→not_scheduled；表进 spec 细化 | agent/保留 |
| FND-D07（opencode major） | "模板只补 not_scheduled"与"unavailable 无 label" | 新状态在页面显示不一致 | **fixed（证据修正）**：核实 template.html:174,179 的 stateNames/stateLabel **已有 unavailable**；修正为：补 not_scheduled + 两状态契约测试同步 + 旧记录兼容验证 | — | agent/保留 |
| FND-D08（opencode minor） | SKILL.md 重写未包含 F-009 漂移修正 | 旧漂移可能残留 | **fixed** | 重写范围含：机器链描述与实际行为一致（消费边由 validator 自动派生，技能不重复调用） | agent/保留 |
| FND-D09（opencode minor） | severity"按规则校准"未具名规则 | 校准不可验证 | **fixed** | 规则明确：occurrence_count≥2 或用户明确确认→high；单次观察→medium；纯提示/体验→low；导入时逐条复核 | agent/保留 |
| FND-D10（opencode minor） | 假设①"5 份 SKILL.md 零提及"归因 R-102，但提交材料无此声明 | 证据归因错误 | **invalid（证据材料压缩丢失）**：R-102 原文确认零提及（grep 无命中已复核），objective_facts 压缩丢句；归因保留 R-102 原文 | — | agent/保留 |
| FND-D11（codex/luna major） | 用户要求梳理的六类内容（帮助/提升/阻塞/介入原因/简化/可简化）应写成结构化输出+validator 规则 | prompt 重写无法保证内容完整进入 M16 | **fixed（方向补充）** | 信息质量=prompt 六区块 + validator 完整性规则（缺失/未知/不适用显式记录，标 source_completeness） | agent/保留 |
| FND-D12（codex/luna major） | 向后兼容从假设升为验收条件 | 共享 schema 变化可能使既有消费链路失效 | **fixed** | 兼容性验收入 AC：旧记录 fixture/新状态 fixture/M16 投影+质量税契约测试（与 FND-D03 合并） | agent/保留 |

> direction-advice 是可成文事实，非 pass gate：available 表示至少一家返回有效 findings；findings 处置随 Talk round 3 用户答复收敛（FND-D02/FND-D05 待用户拍板）。

## Current-material hash audit (2026-09-01；外部 manifest 绑定；append-only)

- `decision-log.md` 的当前 SHA-256 不内嵌于自身，避免自引用不可收敛；四份材料的当前 hash 由外部 manifest `quality/evidence/material-hashes-20260901.json` 记录并自校验。若继续修改任一材料，必须重新生成 manifest。
- `spec/plan/tasks` 的早期 Input hash 仅保留为历史 provenance；当前材料绑定使用外部 manifest `quality/evidence/material-hashes-20260901.json` 中对应的 SHA-256 值，不把 hash 刷新误作实现或验收通过。
- 本次 hash 审计（2026-09-01）不授权进入 build-code；当时仍保持 T602/T603 pending。该句是历史快照，当前状态以本节更正为准；M16 T010/AC-GOV-002 仍为 `incomplete/inconclusive`，测试依赖缺失事实不变。`OPEN-01` 的关闭事实以 spec.md 中 T601 条目为准，decision-log 不另设该标识。

## 当前执行状态更正（2026-09-03）

- 当前分支已完成 T602/T603：mixed-input 五行契约与 M16 focused 回归 130/130 通过，且未修改 M16 archive。
- 当前实现后的局部异源审查已真实完成：`pi/coding` 返回 2 条 minor finding，均已修复并由 4 个聚焦测试文件的 33 个测试复核通过；其他 provider identity 失败和同源排除均按原事实保留。该轮 packet 是修复前快照，未把它冒充为修复后 provider pass，也未重复调用 provider。
- 当前仍未完成官方 canonical `dsh-code-review` stage outcome/session event；当前 Codex session 仍绑定另一个 Baseline task，官方路由拒绝切换，不能手工补写。verify-code、build-code 的 release/close 状态因此仍为 `in_progress`/`not_released`，不可 close。

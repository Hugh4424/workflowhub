---
name: grill-with-docs
description: Grilling session that challenges your plan against the existing domain model, sharpens terminology, and updates documentation (CONTEXT.md, ADRs) inline as decisions crystallise. Use when user wants to stress-test a plan against their project's language and documented decisions.
---

<what-to-do>

先核实，再提问。沿设计依赖逐项检查计划，但不要把能从代码、文档或已确认事实得到的
答案重新问用户。只有仍会改变方向的关键问题才进入对话。

Grill follows the upstream round/frontier contract: batch all independent questions, use one axis per question, defer dependent questions to later rounds, and wait for real replies before moving to the next round.

Ask one batch only when the remaining frontier questions are independent. Each
question in that batch must be answerable without the answer to another question;
dependent questions stay out of the batch and are re-ranked after the reply.

同一张卡可以包含多个互相独立的问题；不要把独立问题退化成逐个单题发送。每题仍只问一个
决策轴，有依赖的问题必须等真实回答后再拆到下一批。

每题使用和 Talk、Clarify 相同的大白话问题卡：`question_id`、一个 `axis`、
`independent: true`、2～3 个带 `meaning`、`consequence`、`risk` 的选项、
`recommended_option` 和 `recommendation_reason`。用户可以只回答其中一部分，未回答项
必须保留并重新排序，直接回答选项编号；Grill 仍然只记录方向挑战，不产生 review 结论。

If a question can be answered by exploring the codebase, explore the codebase instead.

发现会改变目标、方向、范围、方案、风险或长期规则的决策轴时，必须执行
`ask → wait/pause → real reply → resume → re-rank`：发布一个独立 frontier 问题批次后
当前调用立即暂停，只有宿主返回与该批次绑定的真实回复才可恢复并重排剩余问题。
Agent 生成、默认、旧回复或文档自报都不能替代 reply。用户只回答部分问题时保留已答
部分，并把未答 frontier 重新排序。纯事实核实或机械文档修正可以零问题，但必须记录
“不提问”的事实理由。

需要用户决定时使用大白话 frontier 批次卡：每个问题仍只问一个决策轴，但同一张卡只
允许放互相独立的问题；写清当前状态（`grill-with-docs`、问题序号和当前总数）、问题、
影响范围、2～3 个互斥选项、推荐项与理由，以及每项的直接后果和主要风险。不得添加
“刚完成”“下一步”“需要你处理吗”等重复段落，不得展示内部
ID、hash、receipt、attempt、runner 等执行黑话，不得要求开放式填空。多个决策轴按
依赖拆开，每次真实回答后重新核对剩余问题。

Grill 的临时交互事实必须能回放为 `ask`、`wait`、`reply`、`resume` 四个事件：`ask`
绑定正整数 `round`；`reply` 必须来自用户并绑定同一张卡和同一 `round`，允许是部分答案；
`resume` 必须使用同一张卡、同一 `round` 和同一回复后才可重排。Grill 只是交互式思考，绝不调用 wh-review、生成 review finding 或写 review fact。

**Failure contract**: skill 读取、代码核实或文档写入失败时，先自行诊断并做安全重试。
只有仍缺少会改变方向的事实、且 Agent 无法自行核实时，才用大白话决策卡请用户决定。
普通工具错误只说明当前状态和完成条件，不让用户处理技术细节。完整 grill 未完成时保持阻塞，
不得用“跳过”冒充完成。

**全需求覆盖优先**：Grill 先建立一张覆盖矩阵，再做专项挑战。矩阵至少包含以下五类原始消息：

1. 目标和成功意图（`goal`）；
2. 用户旅程和页面/入口范围（`flow_or_surface`）；
3. 数据、状态和状态变化（`data_or_state`）；
4. 成功、失败、取消和验收边界（`success_failure_acceptance`）；
5. 约束、非目标、延期和风险（`constraint_non_goal_defer`）。

每条已认证原始消息都必须落到一个决策轴；高/中影响轴必须有用户选择，或明确记录“不提问”的事实理由，并绑定 decision、FR、AC。缺少整个消息类、缺少整条轴、只有 spec-analyze/review 细节而没有全需求覆盖时，Grill 不能返回 completed。覆盖矩阵是当前调用内的临时验证视图，不是第五份材料，也不持久化原文。

**退出条件（客观 checklist，不是主观判断）**：不再用“用户能否复述四件事”这类主观标准判断是否可以退出。先逐类完成全需求覆盖，再逐项记录下面四项：

外部接口必须按真实定义核实；字段和路径命名必须有唯一权威来源。

1. 外部依赖接口是否已核实真实定义（非文档假设）
2. 涉及字段/路径命名是否已有唯一权威定义
3. 失败路径/异常语义是否明确
4. 范围边界"做什么/不做什么"是否写死、无隐性口头扩大

仍会改变方向的缺失项必须在本阶段自行核实或向用户提问，不能下放。不会改变方向的已知
缺口可记录负责人和完成条件后继续。任何缺失项都要进入 decision-log“开放问题”节，
不得静默放过，也不得变成额外机器硬门。

**结束记录**：四项退出检查完成后，必须把以下事实返回调用方，供完成卡和
decision-log 使用：

1. `CONTEXT.md`：`changed` 或 `no change`、理由、实际文件引用；
2. ADR：`created` 或 `not needed`、理由、实际文件引用；
3. ADR 三项判据分别为真或假：难以反转、无背景会意外、存在真实取舍；
4. 与现有术语或 ADR 的冲突，以及处理结果；
5. 四项退出检查逐项的 `pass` 或未解决结果及事实依据。

结束时只向父 Stage Agent 返回最小 `grill_summary`：

```yaml
grill_summary:
  status: completed
  direction_changing_challenges_resolved: true | false
  context: { status: changed | no-change, reason: "...", file_references: [] }
  adr: { status: created | not-needed, reason: "...", file_references: [] }
  conflicts: { status: resolved | none, disposition: "..." }
  requirement_coverage:
    status: complete | incomplete
    message_classes: [goal, flow_or_surface, data_or_state, success_failure_acceptance, constraint_non_goal_defer]
    uncovered: []
  exit_checks:
    external_interfaces: pass | unresolved
    canonical_names: pass | unresolved
    failure_semantics: pass | unresolved
    scope_boundaries: pass | unresolved
  decision_updates:
    - 只保留应写进 decision-log.md 的结论、风险、冲突处置或开放问题
```

候选队列、问题卡、ask/reply/resume/re-rank、完整问答和 Grill 历史只在当前会话内使用，不形成
run、revision、latest、ledger 或独立持久记录。本技能不填写 task、stage、snapshot、
decision ref/hash、文件路径或内容 hash，也不调用受控 writer。父 Stage Agent 只把
`decision_updates` 和必要的 CONTEXT/ADR 结果写进 `decision-log.md`；当前
`workflowhub-interaction-aggregate.v1` 不保存 Grill 历史，Grill 事实也不向下游重复传递。
不得返回或持久化完整问题卡原文或 secret、token、password、credential、cookie 等秘密。

`CONTEXT.md` 只在领域术语、含义或边界确有变化时最小更新。ADR 只有三项判据全部为
真时才创建。即使没有文件变化，也必须记录 `no change` / `not needed` 及理由；不能只写
“已检查”。

完成后必须向调用方返回一份可直接面向用户呈现的简短总结：检查了什么、最重要的
结论、仍存风险、`CONTEXT.md` 是否变化、ADR 是否需要及理由、下一步。完整技术事实
继续留在正式记录，不把内部引用或日志塞进总结。

**Plain language mandatory**：面向非工程背景的人提问和汇报时用大白话，不堆专业术语；给选项时逐条说明含义、可选理由、后果和风险，不能只列名词让人自己猜。

</what-to-do>

<supporting-info>

## Domain awareness

During codebase exploration, also look for existing documentation:

### File structure

Most repos have a single context:

```text
/
├── CONTEXT.md
├── docs/
│   └── adr/
│       ├── 0001-event-sourced-orders.md
│       └── 0002-postgres-for-write-model.md
└── src/
```

If a `CONTEXT-MAP.md` exists at the root, the repo has multiple contexts. The map points to where each one lives:

```text
/
├── CONTEXT-MAP.md
├── docs/
│   └── adr/                          ← system-wide decisions
├── src/
│   ├── ordering/
│   │   ├── CONTEXT.md
│   │   └── docs/adr/                 ← context-specific decisions
│   └── billing/
│       ├── CONTEXT.md
│       └── docs/adr/
```

Create files lazily — only when you have something to write. If no `CONTEXT.md` exists, create one when the first term is resolved. If no `docs/adr/` exists, create it when the first ADR is needed.

## During the session

### Challenge against the glossary

When the user uses a term that conflicts with the existing language in `CONTEXT.md`, call it out immediately. "Your glossary defines 'cancellation' as X, but you seem to mean Y — which is it?"

### Sharpen fuzzy language

When the user uses vague or overloaded terms, propose a precise canonical term. "You're saying 'account' — do you mean the Customer or the User? Those are different things."

区分领域语言与实现语言：`CONTEXT.md` 只收录领域专家会使用的概念、含义、边界和避免同义词；不收录 class/module/API 等实现细节，不把它当 spec 或 scratchpad。

### Discuss concrete scenarios

When domain relationships are being discussed, stress-test them with specific scenarios. Invent scenarios that probe edge cases and force the user to be precise about the boundaries between concepts.

### Cross-reference with code

When the user states how something works, check whether the code agrees. If you find a contradiction, surface it: "Your code cancels entire Orders, but you just said partial cancellation is possible — which is right?"

### Update CONTEXT.md inline

When a term is resolved, update `CONTEXT.md` right there. Don't batch these up — capture them as they happen. Use the format in [CONTEXT-FORMAT.md](./CONTEXT-FORMAT.md).

Don't couple `CONTEXT.md` to implementation details. Only include terms that are meaningful to domain experts.

### Offer ADRs sparingly

Create an ADR directly when all three are true and it only records an already
resolved direction; include it in the single final make-decision confirmation.
Ask the user only when drafting the ADR exposes a new direction-changing choice:

1. **Hard to reverse** — the cost of changing your mind later is meaningful
2. **Surprising without context** — a future reader will wonder "why did they do it this way?"
3. **The result of a real trade-off** — there were genuine alternatives and you picked one for specific reasons

If any of the three is missing, skip the ADR. Use the format in [ADR-FORMAT.md](./ADR-FORMAT.md).

</supporting-info>

## Sources

- Matt Pocock `grilling`: <https://github.com/mattpocock/skills/blob/66898f60e8c744e269f8ce06c2b2b99ce7660d5f/skills/productivity/grilling/SKILL.md>
- Matt Pocock `grill-with-docs`: <https://github.com/mattpocock/skills/blob/66898f60e8c744e269f8ce06c2b2b99ce7660d5f/skills/engineering/grill-with-docs/SKILL.md>
- Matt Pocock `domain-modeling`: <https://github.com/mattpocock/skills/blob/66898f60e8c744e269f8ce06c2b2b99ce7660d5f/skills/engineering/domain-modeling/SKILL.md>

All three upstream files are MIT licensed. Domain-modeling ideas are absorbed here; this skill does not invoke or require a separate domain-modeling skill.

- 更新检查：2026-07-26。上游 repository HEAD 已前进到
  `ed37663cc5fbef691ddfecd080dff42f7e7e350d`，但上述三个文件与固定 commit
  `66898f60e8c744e269f8ce06c2b2b99ce7660d5f` 的 bytes 分别完全一致，因此不升级
  pinned source。
- 替代候选：AgentHub `grill-with-docs-lite`（检查时 repository HEAD
  `fabc82100b3dde2678a5fb81484bab3149c1e72d`）。拒绝替换：lite 版本缺少当前完整
  Skill 的 CONTEXT/ADR 判据、术语冲突处理、四项客观退出检查和真实方向问答边界；
  采用它会重新产生“读完文档就自报完成”的缺口。

---
name: grill-with-docs
description: Grilling session that challenges your plan against the existing domain model, sharpens terminology, and updates documentation (CONTEXT.md, ADRs) inline as decisions crystallise. Use when user wants to stress-test a plan against their project's language and documented decisions.
---

<what-to-do>

先核实，再提问。沿设计依赖逐项检查计划，但不要把能从代码、文档或已确认事实得到的
答案重新问用户。只有仍会改变方向的关键问题才进入对话。

Ask the questions one at a time, waiting for feedback on each question before continuing.

If a question can be answered by exploring the codebase, explore the codebase instead.

需要用户决定时使用大白话单轴决策卡：只问一个决策轴，给 2～3 个互斥选项；每项
说明含义、为什么可选、直接后果和主要风险，并给出推荐项及推荐理由。不得展示内部
ID、hash、receipt、attempt、runner 等执行黑话，不得要求开放式填空。多个决策轴按
依赖逐个处理，每次真实回答后重新核对剩余问题。

**Failure contract**: skill 读取、代码核实或文档写入失败时，先自行诊断并做安全重试。
只有仍缺少会改变方向的事实、且 Agent 无法自行核实时，才用大白话决策卡请用户决定。
普通工具错误只说明当前状态和完成条件，不让用户处理技术细节。完整 grill 未完成时保持阻塞，
不得用“跳过”冒充完成。

**退出条件（客观 checklist，不是主观判断）**：不再用"用户能否复述四件事"这类主观标准判断是否可以退出。退出前必须逐项记录下面四项：

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

`CONTEXT.md` 只在领域术语、含义或边界确有变化时最小更新。ADR 只有三项判据全部为
真时才创建。即使没有文件变化，也必须记录 `no change` / `not needed` 及理由；不能只写
“已检查”。

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

---
name: grill-with-docs
description: 挑战方案方向或领域用词时，核对现有代码、术语与决定，合问独立问题并等待真实回答；术语解决后按唯一格式就地更新 GLOSSARY，满足三项判据才记录 ADR。
---

<what-to-do>

先核实，再提问。沿设计依赖逐项检查计划，但不要把能从代码、文档或已确认事实得到的
答案重新问用户。只有仍会改变方向的关键问题才进入对话。

**Frontier**：把当前所有互相独立的问题放进同一批，每题一个决策轴；每题无需其它题的答案即可回答。有依赖的问题留到真实回答后的下一批，先重排再问。

### 问答工具 IO 契约

结构化问答工具的每题输入固定为 `question_id`、`axis`、`options`（最多 3 个，逐项写明
含义、直接后果和主要风险）与 `recommended`。输出固定包含 `answers`（`option_id` 或
`free_text`）及用户真实答复的会话来源。宿主没有该工具时，使用同内容的
大白话文本卡，并如实登记工具降级事实；不得伪造工具调用或回复凭证。

每题使用和 Talk、Clarify 相同的大白话问题卡：`question_id`、一个 `axis`、
`independent: true`、2～3 个带 `meaning`、`consequence`、`risk` 的选项、
`recommended` 和 `recommendation_reason`。每个选项用 `option_id` 唯一标识；用户可以只回答
其中一部分，未回答项必须保留并重新排序，直接回答选项 ID；Grill 仍然只记录方向挑战，
不产生 review 结论。

发现会改变目标、方向、范围、方案、风险或长期规则的决策轴时，必须执行
`ask → wait/pause → real reply → resume → re-rank`：发布一个独立 frontier 问题批次后
当前调用立即暂停并把控制权交还用户，只有宿主返回与该批次绑定的真实回复才可恢复并重排剩余问题。取消或中断时返回已答部分、未答项和暂停原因，保留未完成；恢复只消费本批次真实回复，不从默认选项续答。
Agent 生成、默认、旧回复或文档自报都不能替代 reply。用户只回答部分问题时保留已答
部分，并把未答 frontier 重新排序。纯事实核实或机械文档修正可以零问题，但必须记录
“不提问”的事实理由。

需要用户决定时使用大白话 frontier 批次卡：每个问题仍只问一个决策轴，但同一张卡只
允许放互相独立的问题；用日常语言说明本轮用途、问题序号和当前真实总数、问题、
影响范围、2～3 个互斥选项、推荐项与理由，以及每项的直接后果和主要风险。不得添加
“刚完成”“下一步”“需要你处理吗”等重复段落，不得展示内部
ID、hash、receipt、attempt、runner 等执行黑话，不得要求开放式填空。多个决策轴按
依赖拆开，每次真实回答后重新核对剩余问题。

主会话保留真实提问、等待和用户答复的会话来源。临时交互事实用 `ask`、`wait`、`reply`、`resume` 四个事件说明：`ask` 用正整数 `round` 区分当前批次；`wait` 暂停依赖该卡答案的步骤；`reply` 来自真实用户，绑定同一张卡与同一 `round`，允许部分答案；`resume` 使用同一张卡、同一 `round` 和同一回复后再重排。这里只描述当前会话 IO，不新增持久事件或机器校验；不用 round 事件或凭证认证替代实际对话。Grill 只是交互式思考，不调用 wh-review 或写 review verdict。

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

每条可定位的真实原始消息都必须落到一个决策轴；高/中影响轴必须有用户选择，或明确记录“不提问”的事实理由，并绑定 decision、FR、AC。缺少整个消息类、缺少整条轴、只有 spec-analyze/review 细节而没有全需求覆盖时，Grill 不能返回 completed。覆盖矩阵是当前调用内的临时验证视图，不是第五份材料，也不持久化原文。

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

1. `GLOSSARY.md`：`changed` 或 `no change`、理由、实际文件引用；
2. ADR：`created` 或 `not needed`、理由、实际文件引用；
3. ADR 三项判据分别为真或假：难以反转、无背景会意外、存在真实取舍；
4. 与现有术语或 ADR 的冲突，以及处理结果；
5. 四项退出检查逐项的 `pass` 或未解决结果及事实依据。

结束时只向当前主会话 返回最小 `grill_summary`：

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
机器身份认证，也不代写任务状态。当前主会话 只把
`decision_updates` 和必要的 GLOSSARY/ADR 结果写进 `decision-log.md`；当前
普通决策记录不复制 Grill 历史，Grill 事实也不向下游重复传递。
不得返回或持久化完整问题卡原文或 secret、token、password、credential、cookie 等秘密。

`GLOSSARY.md` 只在领域术语、含义或边界确有变化时最小更新。ADR 只有三项判据全部为
真时才创建。即使没有文件变化，也必须记录 `no change` / `not needed` 及理由；不能只写
“已检查”。

完成后必须向调用方返回一份可直接面向用户呈现的简短总结：检查了什么、最重要的
结论、仍存风险、`GLOSSARY.md` 是否变化、ADR 是否需要及理由、下一步。完整技术事实
继续留在正式记录，不把内部引用或日志塞进总结。

**Plain language mandatory**：面向非工程背景的人提问和汇报时用大白话，不堆专业术语；给选项时逐条说明含义、可选理由、后果和风险，不能只列名词让人自己猜。

</what-to-do>

<supporting-info>

## Domain awareness

During codebase exploration, also look for existing documentation:

### File structure

本约定适用于 WorkflowHub 自身与所有目标项目，由本技能及 [GLOSSARY-FORMAT.md](./GLOSSARY-FORMAT.md) 承接唯一领域格式，不另建领域建模技能或第二份术语真相。多数项目只有一个领域上下文：

```text
/
├── GLOSSARY.md
├── docs/
│   └── adr/
│       ├── 0001-event-sourced-orders.md
│       └── 0002-postgres-for-write-model.md
└── src/
```

先读已有 `GLOSSARY-MAP.md` 核实真实上下文及其术语表位置。仅当项目确有多个领域上下文时，才用这个可选 map 说明各自位置、关系和主要负责上下文；目录数或一个术语有多个实例不证明多个上下文：

```text
/
├── GLOSSARY-MAP.md
├── docs/
│   └── adr/                          ← system-wide decisions
├── src/
│   ├── ordering/
│   │   ├── GLOSSARY.md
│   │   └── docs/adr/                 ← context-specific decisions
│   └── billing/
│       ├── GLOSSARY.md
│       └── docs/adr/
```

**Lazy**：只有第一个真实领域术语已解决、确有内容时才创建 `GLOSSARY.md`；没有术语变化就返回 no change 及理由，不建空文件。已有单上下文术语表就最小更新；真实多上下文先读已有 map 找本题所属的唯一术语 owner；没有 map 时，先核实上下文、位置与关系，有真实内容才懒建唯一 map。归属不清先问，不把同一含义写成双真相。首次确需 ADR 才创建 `docs/adr/`。

## During the session

### Challenge against the glossary

When the user uses a term that conflicts with the existing language in `GLOSSARY.md`, call it out immediately. "Your glossary defines 'cancellation' as X, but you seem to mean Y — which is it?"

### Sharpen fuzzy language

When the user uses vague or overloaded terms, propose a precise canonical term. "You're saying 'account' — do you mean the Customer or the User? Those are different things."

区分领域语言与实现语言：`GLOSSARY.md` 只收录领域专家会使用的概念、含义、边界和避免同义词；不收录 class/module/API 等实现细节，不把它当 spec 或 scratchpad。

### Discuss concrete scenarios

When domain relationships are being discussed, stress-test them with specific scenarios. Invent scenarios that probe edge cases and force the user to be precise about the boundaries between concepts.

### Cross-reference with code

When the user states how something works, check whether the code agrees. If you find a contradiction, surface it: "Your code cancels entire Orders, but you just said partial cancellation is possible — which is right?"

### Update GLOSSARY.md inline

When a term is resolved, update `GLOSSARY.md` right there. Don't batch these up — capture them as they happen. Use the format in [GLOSSARY-FORMAT.md](./GLOSSARY-FORMAT.md).

Don't couple `GLOSSARY.md` to implementation details. Only include terms that are meaningful to domain experts.

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

参考 [mattpocock/skills](https://github.com/mattpocock/skills)，固定 commit `b0618bc436ad893b3c5e84e55fba86586d34a404`：

- `skills/productivity/grilling/SKILL.md`：独立 frontier 批次与真实回答。
- `skills/engineering/domain-modeling/SKILL.md` 及同目录 `GLOSSARY-FORMAT.md`、`ADR-FORMAT.md`：领域用词、懒创建、单/多上下文和 ADR 三项判据。
- `skills/engineering/grill-with-docs/SKILL.md`：新固定版仅为组合入口，不当本地融合正文或格式附件的来源 owner。

上述来源为 MIT。本地融合这些方法，不调用或要求独立 domain-modeling 技能；保留全需求覆盖、四项客观退出检查、大白话卡、失败自行诊断与真实问答边界。格式以本地 Relationships / Example dialogue / Flagged ambiguities 为主，吸收新固定版 Rules / Single vs multi-context repos；ADR 原三项全部成立才创建，不把格式迁名当新决定。

历史 2026-07-26 对旧固定源的 bytes 相同／不升级结论只适用于当时版本，不能说明本次新源无差异。新固定版术语为 GLOSSARY，格式附件属于 domain-modeling；本地承接于本技能，拒绝用缺完整领域/ADR、退出与问答合同的 lite 版本替换。迭代时核上述子文件的真实更新与更优候选，记录源差与本地偏离后决定采用，不自动追 HEAD。创建或改写 agent 方法时，读取 `skills/spec-specify/SKILL.md` 的「技能写作规范（WR001）」，不复制规范。

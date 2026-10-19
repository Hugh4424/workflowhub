---
name: grill-with-docs
description: 挑战方案方向或领域用词时，核对现有代码、术语与决定，合问独立问题并等待真实回答；术语解决后按唯一格式就地更新 GLOSSARY，满足三项判据才记录 ADR。
---

<what-to-do>

先核实，再提问。沿设计依赖逐项检查计划，但不要把能从代码、文档或已确认事实得到的
答案重新问用户。只有仍会改变方向的关键问题才进入对话。

**Frontier**：把当前所有互相独立的问题放进同一批，每题一个决策轴；每题无需其它题的答案即可回答。有依赖的问题留到真实回答后的下一批，先重排再问。

### 问答工具 IO 契约

本节最小内联卡：说明本轮用途、真实题号与总数，每题只问一个决策轴，给2～3个互斥选项、推荐理由及各项直接后果/风险；同批只合问独立轴，依赖题等真实回答后再问，部分未答与取消保留未决。结构化输入用 `question_id`、`axis`、`options`、`recommended`，输出 `answers` 只能来自真实回复（`option_id` 或 `free_text`）；无工具发同内容文本卡并记降级，禁止伪造工具/回复。按本文件 ask/wait/reply/resume 保来源与真实等待，部分答后重排剩余问题及真实题号/总数；零问题须记录事实理由。每轮末说“我在问你什么、你为什么要在意”及“我替你定了这些”，仅代理可定的可逆细节列后者；会改变方向的取舍仍问用户。内部词出现时紧跟大白话解释；不得要求开放式填空，也不得给问卡添加“刚完成”“下一步”“需要你处理吗”等重复段落。Grill 只记录方向挑战，不产生 review 结论。

完整问卡示例及题号公式可选查阅 [Talk 的单轴决策卡](../talk-with-zhipeng/SKILL.md#21-大白话单轴决策卡)与[每答重排](../talk-with-zhipeng/SKILL.md#3-每答重排)；单独搬运时本节与本文件临时IO、模糊处理已足以执行，缺Talk参考不省略上述行为。

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

1. `GLOSSARY.md`：`changed` 或 `no-change`、理由、实际文件引用；
2. ADR：`created` 或 `not-needed`、理由、实际文件引用；
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

领域结果按 [Rules](./GLOSSARY-FORMAT.md#rules) 返回。ADR 只有三项判据全部为
真时才创建；未创建也必须记录 `not-needed` 及理由，不能只写“已检查”。

完成后必须向调用方返回一份可直接面向用户呈现的简短总结：检查了什么、最重要的
结论、仍存风险、`GLOSSARY.md` 是否变化、ADR 是否需要及理由、下一步。完整技术事实
继续留在正式记录，不把内部引用或日志塞进总结。

**Plain language mandatory**：提问和汇报用大白话，内部词紧跟实际含义；需要例子时可选看 [Talk 的用户可见说话方式](../talk-with-zhipeng/SKILL.md#用户可见的说话方式)。

</what-to-do>

<supporting-info>

## Domain awareness

During codebase exploration, also look for existing documentation:

### File structure

本约定适用于 WorkflowHub 自身与所有目标项目。定位或创建术语表前，读取并执行 [Single vs multi-context repos](./GLOSSARY-FORMAT.md#single-vs-multi-context-repos)，核真实上下文、唯一 owner、位置与懒创建条件；本附件承接唯一领域格式，不另建领域建模技能或第二份术语真相。

首次确需 ADR 才创建 `docs/adr/`；系统级决定放根目录的 `docs/adr/`，特定上下文的决定放该上下文的 `docs/adr/`。

## During the session

### Challenge against the glossary

When the user uses a term that conflicts with the existing language in `GLOSSARY.md`, call it out immediately. "Your glossary defines 'cancellation' as X, but you seem to mean Y — which is it?"

### Sharpen fuzzy language

When the user uses vague or overloaded terms, propose a precise canonical term. "You're saying 'account' — do you mean the Customer or the User? Those are different things."

把模糊语言说清：出现下列四类信号，先指出具体未决内容，不把话术当目标：① 只说“要可扩展／干净架构”等最佳实践却无具体结果；② “大多数应用都这样／按行业惯例”的惯例服从；③ “我应该／应该这样才对／好工程实践说”的自我要求；④ 把“现代化／稳健”等流行词当目标。
遇到任一信号，当场追问“如果不用向任何人交代，你真正想要什么”，并用已知结果与约束给可回答的单轴选择；缺信息明确说还差什么，不用自己的猜测补成答案。

下列四类回复不算对具体未决项的确认：

- “你看着办”：这是委托，待决取舍仍未回答；列具体选项与后果重问。
- “听着不错”：含糊赞同，指出仍需定的内容，问是否需要修正。
- “行开始吧”：可能只是礼貌退出，回到待决取舍核实。
- 沉默后说“开始吧”：不据此当作已收敛，先问是否漏掉根本问题。

答非所问同样保持未决，说明缺哪条回答；取消返回已答部分、未答项与暂停原因。受控演练或 Agent 的反应预测都不是用户确认。修正后用用户原意重述，只记录真实回答实际解决的事项。

地板规则：多轮后仍预测不出用户对当前取舍的反应，说明问的东西本身可能有问题；停下当前追问，告诉用户哪里仍没理解，建议退一步重新表述目标。它是行为提示，不设轮数、置信度分数或退出门；零问题表示没有会改变方向的未决项，两者不冲突。理解自检仅用于发现误解，不取代本文件既有四项客观退出检查。

判断词语是否属于领域时，执行 [Rules](./GLOSSARY-FORMAT.md#rules) 的领域语言与项目特有概念规则。

### Discuss concrete scenarios

When domain relationships are being discussed, stress-test them with specific scenarios. Invent scenarios that probe edge cases and force the user to be precise about the boundaries between concepts.

### Cross-reference with code

When the user states how something works, check whether the code agrees. If you find a contradiction, surface it: "Your code cancels entire Orders, but you just said partial cancellation is possible — which is right?"

### Update GLOSSARY.md inline

When a term is resolved, read and execute [Rules](./GLOSSARY-FORMAT.md#rules) for inline updates, readback and per-item results; use [Structure](./GLOSSARY-FORMAT.md#structure) for its format. 调用方在 Talk、研究、写稿和确认中也从这里进入。

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

来源权威：[catalog](../catalog.yaml#skills.grill-with-docs)；本便携小卡非权威；单技能副本缺catalog时向来源维护者取登记。
采用frontier问答与领域/ADR方法的来源章节见catalog；本地融合这些方法，不调用或要求独立 domain-modeling 技能；保留全需求覆盖、四项客观退出检查、大白话卡、失败自行诊断与真实问答边界。格式以本地 Relationships / Example dialogue / Flagged ambiguities 为主，吸收新固定版 Rules / Single vs multi-context repos；ADR 原三项全部成立才创建，不把格式迁名当新决定。

历史 2026-07-26 对旧固定源的 bytes 相同／不升级结论只适用于当时版本，不能说明本次新源无差异。新固定版术语为 GLOSSARY，格式附件属于 domain-modeling；本地承接于本技能，拒绝用缺完整领域/ADR、退出与问答合同的 lite 版本替换。迭代时核上述子文件的真实更新与更优候选，记录源差与本地偏离后决定采用，不自动追 HEAD。创建或改写 agent 方法时，读取 `skills/spec-specify/SKILL.md` 的「技能写作规范（WR001）」，不复制规范。

## 同仓方法依赖

写作条件见本文件 [Sources](#sources) 的 WR001 指针；搬运时由调用者提供可读原件。

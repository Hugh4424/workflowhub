---
name: spec-clarify
description: Resolve material ambiguity in supplied specification content.
---

# Spec Clarify

Receive the current `spec.md`, accepted upstream decision material, and
controlled named-artifact callbacks from build-plan. Never derive or accept
task, root, repository, or product paths.

### 问答工具 IO 契约

结构化问答工具的每题输入固定为 `question_id`、`axis`、`options`（最多 3 个，逐项写明
含义、直接后果和主要风险）与 `recommended`。输出固定包含 `answers`（`option_id` 或
`free_text`）及用户真实答复的会话来源。宿主没有该工具时，使用同内容的
大白话文本卡，并如实登记工具降级事实；不得伪造工具调用或回复凭证。

Before asking anything, classify every relevant statement as:

1. **Locked upstream decision**: already decided; inherit its wording, option
   meaning, ordering, recommendation, and semantics without renaming or asking
   again.
2. **Upstream unresolved item**: explicitly left for specification.
3. **New ambiguity**: first discovered in the current draft.

Compare the current draft and every candidate option with the locked decisions.
Discard candidates that conflict with a locked decision. If all candidates
conflict, do not show a fake choice: report the upstream/spec contradiction and
the exact completion condition back to build-plan for repair. Do not ask the
user to invent a fourth option.

已回答项先读真实答复和适用范围，作为已定事实继承；环境事实由 agent 在允许材料内核实，不把可查事实重新问用户。事实不可得时记 unknown、影响、owner 与下一动作，只等待依赖该事实的轴；其余已具前提的独立问题仍可进入当前 frontier。

Identify only unresolved ambiguities that materially change scope, acceptance,
interfaces, data, security, or operations. Put independent axes into one batch;
dependent axes stay out of that batch and are re-ranked after the real answer.
Each question still contains only one decision axis. Never combine output shape,
input transformation, field membership, or another independent concern into one
“complete contract” question.

一张卡可以包含多个互相独立的问题；每题只处理一个决策轴。不要把这些独立问题退化成
逐个单题提问，也不要把有依赖的问题提前塞进同一批。

Use the independent-variation test before publishing a card: if two behaviors
could be chosen separately, they are two decision axes even when they concern
the same field or feature. Options that pair two independently variable
behaviors are forbidden. Split them into separate cards, obtain one real answer,
then reclassify and ask the next axis only if it is still material.

Publishing a batch card ends the current invocation. Return control to the
invoking host immediately and do not publish another batch, revise `spec.md`,
start review, or infer an answer in the same invocation. A later invocation may
continue only after it receives the new real user reply bound to that batch.
Dependent unresolved axes require later visible ask → wait → resume cycles;
posting a dependent card before the first reply is forbidden.

For material decisions, present one plain-language batch card containing only
current status (`spec-clarify`, batch number, current ambiguity count), a group
of independent questions, affected scope, and 2～3 mutually exclusive valid
options per question. State each option's direct consequence and main risk, plus
one recommended option and its reason for each question. 用户直接回答选项编号。
Do not add completed-work, next-step, or generic user-action sections. No
open-ended fill-in questions are allowed. Do not show internal IDs, hashes,
receipts, attempts, or runner details. Keep formal evidence references out of
the question. If upstream already supplied choices or a
recommendation, preserve them exactly instead of creating replacements.

When there is no material ambiguity, record an explicit `trigger=false` outcome
with a reason and zero open direction-changing questions. Never silently skip
Clarify; the absence of ambiguity must be as explicit and reviewable as a real
ask → wait → reply → resume cycle.

For `trigger=true`, keep the actual question and user response attributable in the current conversation. A missing, cancelled or partial answer remains unresolved; an agent must never fabricate answers or an approval. After a real partial reply, retain the answered axes with their exact scope, leave unanswered axes open, and recompute the frontier only from settled prerequisites; do not repeat answered questions or silently settle dependent axes. Changed material requires rechecking affected choices; ordinary unchanged clarification does not prompt for authorization again. This skill has no transcript/hash/snapshot receipt prerequisite.

## 十个维度（Ten-dimension）completeness check

Before the owning spec-authoring step continues, the main agent checks these
ten dimensions against the original requirement and current facts: user
journey, page/surface scope, data and state transitions, success boundary,
failure boundary, permissions/actors, integrations and external effects,
non-goals, deferred handoff, and acceptance/observable evidence. This is an
index of unresolved decisions, not a second specification. A missing dimension
is recorded as `unknown`, `deferred`, or a real user question; it is never
silently invented by the authoring step or a sub-agent. Unknown or deferred facts name the affected scope, owner and next action; they are not disguised as another user decision.

Talk, Grill, and Clarify are communication work owned by the main agent. A
sub-agent may supply facts or an independent critique, but may not ask the user,
answer for the user, or turn an inferred answer into a confirmed decision.

## 写作与固定来源

创建或改写 agent 方法时，读取 `skills/spec-specify/SKILL.md` 的「技能写作规范（WR001）」唯一规范；保原步骤、条件、权限、失败强度和受保护字面，缺源如实 unavailable，不复制规范。

问答来源为 github/spec-kit 固定 commit `b7e67f55bf7a937aaa57dbe0a8198774e285de3a` 的 `templates/commands/clarify.md`；frontier/事实与决定分工吸收 mattpocock/skills 固定 commit `b0618bc436ad893b3c5e84e55fba86586d34a404` 的 `skills/productivity/grilling/SKILL.md`。本地保独立轴批问、最多3选项、主会话真实问答、发卡即归还控制及十维核对，不采用上游单题循环、路径发现脚本、即时写 spec 或扩展 hooks。按固定源与本地偏离评更新，不自动追 HEAD。

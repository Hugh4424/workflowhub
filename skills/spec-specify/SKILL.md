---
name: spec-specify
description: Draft the post-cohort product specification and global implementation-design scaffold in spec.md from confirmed decisions.
---

# Spec Specify

读者：build-plan 的产品规格作者。
读完要能：定位本文件的责任、写作动作、来源与失败边界。

## Post-cohort specification contract

本节回答：What the current spec owns and how build-plan authors it.

For post-cohort authoring, `build-plan` invokes this skill. The output has a
readable narrative spine and one `Appendix A` contract appendix. Appendix A is
the exclusive authority for AC condition, behavior, measurable pass criterion,
failure condition, and expected evidence. The narrative follows the single-authority writing rules below. The four discoverable translations are
requirement explanation, acceptance flow, test standard, and architecture
boundary. This changes no pre-cohort material reader. For post-cohort work,
`spec.md` is also the single global implementation design authority. The
`spec-specify` step records the accepted requirement translation and design
constraints; the later `spec-plan` step adds verified code anchors, chosen
solution, global dependencies, file boundaries, and verification strategy to
that same file before writing the independent Phase deltas. Neither step
replaces the PRD or `decision-log.md` as the product-goal authority.

Input is the current decision/scope and named source material supplied by build-plan. The caller supplies material contents and the authorized write target, not an implicit task identity or workspace discovery contract. Report an unknown `content_profile` explicitly as unsupported input; this is a content error, not a new schema or runtime gate. Use only the authorized spec.md write target; historical pre-cohort records remain read-only. Missing input or an unsafe target is a real error.

Read the caller-supplied current decision and necessary source material. Supplied packets are convenient reading subsets, not snapshot/hash authorization. Missing load-bearing source is unavailable with the specific gap; retain only source-supported direction. New spec.md includes a regenerable non-authoritative 材料导航 with section/summary/read timing pointers.

Use `templates/spec-template.md`. Produce a testable, readable specification
covering user outcomes, urgency, scope, scenarios, edge states, requirements,
assumptions, risks, acceptance, business impact, regression paths, explicit
exclusions, and the global implementation-design section. Keep the quick-read
section short; put narrative before trace fields. Translate source requirements
into four discoverable surfaces: requirement explanation, acceptance flow,
test standard, and architecture boundary. Link each to source/decision IDs;
Reference the PRD goal and decision rationale in their original owners. Before choosing or retaining a solution shape, self-check with `simplicity-guard`'s core questions (has this layer earned its place; can an existing capability carry it instead) and write the conclusion into the existing solution trade-off and 非目标 text, not into a new artifact.

The template is the same content contract consumed by stage-end
`spec-analyze`. Generate canonical `PFACT-{NNN}` and `AC-{DOMAIN}-{NNN}`
records with explicit status, source/decision mapping, scenario, verification
method, oracle, and failure condition. A generated spec must explain its sources, criteria and failures without a downstream reader guessing them. The owning author repairs omissions; legacy material remains read-only background.

For every new AC, use four plain, unindented labels in this exact order:
`验证：`, `通过：`, `失败：`, `证据：`. Each label's body must be non-empty;
do not use bullet/bold legacy labels such as `- **验证方法**`. A line whose
entire content is `TBD`, `TODO`, or `待填写` is invalid. `证据：` declares the
expected evidence type or artifact only; verify-code supplies execution facts.

## 叙事写作与读回

从已确认来源合成，不重新访谈或替用户选择方向。先说明真实角色面临的问题、目标与结果，再连起场景、机制、取舍、失败和显式非目标；追踪字段跟在叙事后，不以 ID 清单代替行为解释。User Stories 的详细格式由产品需求 owner 承接，本步骤保现 PRD/decision 的目标权威。

写作完成时，按原来源→场景/状态→FR/PFACT→唯一 Appendix A 读回：每个适用用户结果与失败都有落点，四个翻译表面可发现，全局实现设计 scaffold 为后续 spec-plan 留在同一 spec；缺口带 owner、影响与下一动作，不把草稿或可读文件说成已验通过。所有正文整理使用下节唯一规范；条件、顺序、权限和失败强度先保全，再修表达。

## Artifact responsibility

本节回答：Which file owns each product, design and execution fact.

For post-cohort work, `spec.md` owns product behavior **and global
implementation design**: problem, scope, scenarios, PFACT, FR, AC,
architecture solution, verified code anchors, interfaces, global write
boundary, dependency graph, verification strategy, impact, risks, and open
questions. The PRD/decision remain stable pointers for product goals and
accepted choices. `phases/P<n>.md` owns each Phase's implementation delta;
`phases/index.md` is pure pointers. Pre-cohort `plan.md`/`tasks.md` remain
historical read-only material, not post-cohort output.

Give every scenario, PFACT, FR, AC, risk, and open question a stable ID. New
requirements use `FR-{DOMAIN}-{NNN}`; DOMAIN is one uppercase segment `[A-Z][A-Z0-9]*` and NNN is exactly three digits (the same rule applies to new AC IDs); accept `FR-{NNN}` only when reading legacy
material. Every FR links to at least one PFACT, scenario, and AC. Every AC names
its FR, verification method, pass condition, failure condition, and evidence
type. Consider default, empty, error, loading, cancellation, boundary,
permission, and race states; link each applicable state to a scenario or record
`N/A — reason`.

Use scenario cards, source mappings, FR/AC failure conditions and OPEN items with affected IDs, owner, impact and handling condition. These are the readable specification contract, not a typed publication or schema license. Historical formats remain read-only; the owning author repairs the actual content instead of expecting downstream readers to invent missing semantics.

PFACT uses exactly one status: `verified`, `inferred`, `unknown`, or
`not_applicable`. A verified PFACT names formal evidence. An inferred PFACT
names its source and limitations and is the only authoritative location for an
assumption. An unknown PFACT names its owner and impact. A not-applicable PFACT
names its reason. Every PFACT names affected FR and AC IDs.
In the new content profile, the selected status field is exclusive: a PFACT
must not retain evidence, inference, unknown, or not-applicable fields belonging
to another status. Every unknown PFACT is bound to a RISK or OPEN card.

Keep product behavior, global engineering decisions, and their source bindings
in distinct sections of `spec.md`. The global design section records verified
code paths/symbols, alternatives and chosen architecture, interfaces, state
and failure behavior, global dependencies, exact NEW/MODIFY/DO NOT TOUCH
boundary, and source → FR → AC → Phase/task → oracle trace. Apply the single-authority writing rules below. Phase files own exact gate commands and local STOP.

## Decision-log mapping and scope revision

本节回答：How each changed requirement stays bound to its confirmed source.

For every new or changed FR/AC, preserve a compact source binding to the
current `decision-log.md`: only R-, U-, PRD-, or CARD- source IDs as the
original source, and the load-bearing `ADR-` decision that explains the choice. New bindings use the current decision-log producer IDs; `D-` IDs in pre/history records remain read-only provenance and are not rewritten into new ADR decisions.
The binding records `source_status` (`current`, `deferred`, `non-goal`, or
`unknown`) and affected user journey/state/acceptance IDs. Use compact source pointers as described in the single-authority writing rules below; an FR without a source binding is a new
requirement that must return to `make-decision`.

When make-decision authorizes a scope revision that changes product behavior,
the owning spec-authoring stage re-reads the current cohort materials and updates
only affected FR/AC/source bindings plus the revision note. Preserve old facts
as history; do not silently turn a task finding into an upstream decision or use
`build-spec` to invent the missing choice. Build-code and verify-code report a
material gap to this owner; they do not rewrite `spec.md` themselves.

Include module, entity, data-lifecycle, and compatibility contracts at the
product boundary, then add verified implementation interfaces separately.
For each conditional subsection, write either the applicable
contract or one `N/A — reason` line. Risks name affected IDs, trigger,
consequence, mitigation or STOP, handling stage, and verification. Open
questions name affected IDs, owner, impact, handling stage, and close condition
or STOP. Ambiguity is marked; it is not guessed.

Before writing, remove authoring comments, placeholders, empty headings, empty tables, and filler. Use at most five columns in a table and keep prose out of table cells. Apply the single-authority rules and 「技能写作规范（WR001）」 below.

Write only the named artifact `spec.md`. Return requirement count, ambiguity
count, and a short checklist as structured output. Do not run Git commands or
discover files. Missing input/callback fails loud.

## Single-authority writing rules

本节回答：How to write a readable spec without losing source meaning. 这是写作指引，不是质量门。

1. Write the conclusion before evidence and exceptions; keep one topic per paragraph and name actions directly.
2. Keep AC criteria only in Appendix A; point to them from the narrative and the decision-log handoff index.
3. Reference decision-log reasoning by source ID and anchor; do not repeat it as specification prose.
4. Keep each scenario, assumption, and exclusion in its own authority: scenario cards, PFACT, and the exclusions section; FRs reference them.
5. Keep Phase procedures, exact commands, test evidence and execution status in their existing Phase/task owners; global design records interfaces and global choices.
6. Use original evidence paths instead of full output. Keep terminology consistent; preserve quantifiers, failure strength, order, and conditions.
7. Preserve locked wording, machine-read headings/labels and literal source declarations as allowed exceptions; compact writing never replaces actual content quality.

## 技能写作规范（WR001）

本节是 agent 文档写作的唯一规范层；本技能的 single-authority 规则是 spec 的具体落点，其它技能按「创建或改写 agent 方法」分支指向这里，不复制本节或新建第四规范对象。规范指引写法，不产生质量 gate。检核以下 Q01–Q12，逐条给出真实范围、依据与未观测；原步骤与条件的保全表和实际方法消费分别记录，字面禁区按真实 source 正负断言/guard 原样保留。

1. **Q01 — Load**：逐行区分 context load（description/常驻指针）与 cognitive load（人记材料/触发条件），说明该行为何值得；人作选择所需认知成本不是一概消除的目标。description 是常驻 context pointer：引领词前置，每真实分支一个触发，去身份复述；model-invoked 保可发现 description，只有确实仅人触发才用 user-invoked，router 只能提示其它 user-invoked，不能代调用。
2. **Q02 — Disclosure**：每分支都要的步骤内联，仅部分分支所需参考置于条件指针后。指针同时说明材料和到达条件；必需材料触发弱时先锐化指针再考虑内联。档内步骤、档内参考、外链参考按需分层，不把 live 步骤藏到无人会读的链接。
3. **Q03 — Co-location**：同概念的定义、规则和例外放同一标题下；每段一个主题。散落与重复分开处理，不因把片段搬近就声称去重。
4. **Q04 — Done**：每步骤给既清晰可判又穷尽的完成判据，强度落在所有受影响项而非只产一份列表。先锐化边界；只有本质模糊且已观察到抢跑才按序列拆到真实 handoff/子代理上下文，内联调用不声称清空后续步骤。
5. **Q05 — Leading word**：同一组三连条件反复出现时，以已定义、预训练中有行为含义的引领词承接；重复词，不重复整段意思。新词须定义，弱到不改变默认的词按 Q10 处理，不凭短词数量宣称效果。
6. **Q06 — Positive**：每条否定在字面禁区外检核能否改成正面行为目标，能改就改；保原条件、量词、次序、权限和失败强度。禁区原否定逐字保，不能为转正删冻结约束。
7. **Q07 — Guardrail**：确实无法正面表达的硬护栏保留，并邻接正面目标。区分实际安全边界与普通解释；护栏不会因正文缩短而消失，也不被解释扩成新许可链。
8. **Q08 — Single authority**：每个意思只在其 owner 处权威表述，其它位置用条件指针；spec 的 AC 在 Appendix A，场景/PFACT/非目标/Phase 程序仍各归原处。引领词的重复不成为第二权威。
9. **Q09 — Environment**：可从一个真实文件或命令发现的脚本/配置/目录事实留给环境；只缓存无法直接发现的约定、理由或坑。被锁字面、机器标题/标签及受保护依赖的实读声明是例外，保其真实来源，不把路径存在当完成。
10. **Q10 — No-op**：逐句问删除后相对当前模型默认行为会否变化。真正 no-op 删除整句而非修词，记录删除理由与含义保全落点；模型默认有争议就保留待相关真实 case 有/无句消费验证，不凭全文相似、行数或主观风格裁定。弱引领词先换更强且有行为锚的词。
11. **Q11 — Sediment**：核每句与当前行为相关性，清已过时、被替代或从未相关的层；来源、决定与失败原件留历史原ref，不覆写过去或把未知写已解决。
12. **Q12 — Sprawl**：即使每行活且唯一仍过长时，按真实分支/序列渐进披露，保执行链与到达条件。没有行数配额，也没有靠长度证明质量的自动 eval；手跑文档并用 duplication/sediment/no-op/sprawl/premature completion 词表定位失败。字符/句长预算只有具源依据才采用，无依据保 unknown；表达整理逐核心保全与有限无回归，新行为用对应目标 case，不强求赢家。未测行为/真人量如实未观测，不采集或估算输出用量。

## 固定来源与本地偏离

参考 [mattpocock/skills](https://github.com/mattpocock/skills) 固定 commit `b0618bc436ad893b3c5e84e55fba86586d34a404` 的 `skills/productivity/writing-for-agents/SKILL.md`、`SKILL-MECHANICS.md` 与 docs，提炼为 WR001 Q01–Q12；叙事参考 `skills/engineering/to-spec/SKILL.md`。本地保留当前完整 spec 模板、Appendix A 独占验收、canonical IDs、PFACT 四状态互斥、FR 来源映射、十维状态与全局设计/Phase 职责。来源是判据，不是已经改善的证据。

本地不采用外部 tracker、ready-for-agent 标签、setup/宿主 Skill 依赖或另根材料；上游「不写具体路径」不覆盖本地经实读的工程锚/精确写集，User Stories 细节仍由产品需求 owner 负责。方法接收调用者材料与允许写目标，缺源/不安全目标/未知 profile 明确报错，不绑定任务路径或账号。迭代时核这些固定子文件的更新与更优候选，写源差与本地偏离后决定采用，不自动追 HEAD。

## 补充材料

本节回答：Where to locate source reasoning and examples. Use the supplied current decision-log, source anchors and existing template; preserve historical material read-only.

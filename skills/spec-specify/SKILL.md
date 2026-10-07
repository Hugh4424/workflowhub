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

Input is the current decision/scope and named source material supplied by build-plan. This skill does not receive task identity or workspace paths; unknown `content_profile` must not be silently accepted. Report the unsupported input explicitly; do not add a schema or runtime gate. Use only the authorized spec.md write target; historical pre-cohort records remain read-only. Missing input or an unsafe target is a real error.

Read the caller-supplied current decision and necessary source material. Supplied packets are convenient reading subsets, not snapshot/hash authorization. Missing load-bearing source is unavailable with the specific gap; do not invent direction. New spec.md includes a regenerable non-authoritative 材料导航 with section/summary/read timing pointers.

Use `templates/spec-template.md`. Produce a testable, readable specification
covering user outcomes, urgency, scope, scenarios, edge states, requirements,
assumptions, risks, acceptance, business impact, regression paths, explicit
exclusions, and the global implementation-design section. Keep the quick-read
section short; put narrative before trace fields. Translate source requirements
into four discoverable surfaces: requirement explanation, acceptance flow,
test standard, and architecture boundary. Link each to source/decision IDs;
do not rewrite the PRD goal or decision rationale. Before choosing or retaining a solution shape, self-check with `simplicity-guard`'s core questions (has this layer earned its place; can an existing capability carry it instead) and write the conclusion into the existing solution trade-off and 非目标 text, not into a new artifact.

The template is the same content contract consumed by stage-end
`spec-analyze`. Generate canonical `PFACT-{NNN}` and `AC-{DOMAIN}-{NNN}`
records with explicit status, source/decision mapping, scenario, verification
method, oracle, and failure condition. A generated spec must explain its sources, criteria and failures without a downstream reader guessing them. The owning author repairs omissions; legacy material remains read-only background.

For every new AC, use four plain, unindented labels in this exact order:
`验证：`, `通过：`, `失败：`, `证据：`. Each label's body must be non-empty;
do not use bullet/bold legacy labels such as `- **验证方法**`. A line whose
entire content is `TBD`, `TODO`, or `待填写` is invalid. `证据：` declares the
expected evidence type or artifact only; verify-code supplies execution facts.

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

Before writing, remove authoring comments, placeholders, empty headings, empty tables, and filler. Use at most five columns in a table and keep prose out of table cells. Apply the single-authority rules below.

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

## 补充材料

本节回答：Where to locate source reasoning and examples. Use the supplied current decision-log, source anchors and existing template; preserve historical material read-only.

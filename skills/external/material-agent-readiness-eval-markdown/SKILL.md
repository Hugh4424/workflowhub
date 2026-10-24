---
name: material-agent-readiness-eval-markdown
description: Plan, audit, score, and safely improve Agent-readable design-system Markdown against L0–L7, using separate assessments for visual composition and complete interactive component implementation after confirming the intended use. Produce scored A–F HTML readiness reports and evidence-backed improvements. Do not use for general Markdown editing, product requirements, page specifications, or generating a new design system from raw decisions.
---

# Material Agent-readiness Eval Skill · Markdown

Help users build the right source materials, judge whether an existing design-system contract is trustworthy and executable, and improve it without inventing design decisions.

## Designer-facing communication contract

Treat the user as a designer unless they explicitly state another role. Apply this perspective to progress updates, clarification questions, Markdown responses, and HTML reports—not only the final answer.

- Lead with the design-production outcome, not scoring mechanics, scripts, schemas, or code structure.
- In clarification questions, ask only for the user's intended outcome, scope, or missing design decision. Do not expose internal workflow logic, assessment routing, profile identifiers, scoring mechanics, or instruction provenance; do not cite a skill, internal rule, file path, or line number to justify asking. Avoid preambles or follow-ups such as “the skill requires confirmation” or “this must be answered before scoring.” If context is needed, explain the practical difference between the user's options in plain language.
- Organize results in this order: **what is missing → what design-production failure it can cause → how the designer can complete it → how completion will be recognized**.
- Translate L0–L7, maturity, evidence gates, and implementation terms into design responsibilities before showing their technical labels. Keep scores and evidence, but use them to support the explanation rather than replace it.
- Tell the designer which artifact or decision to add, where it belongs, what minimum content it needs, and who must confirm it. If engineering, product, accessibility, or brand input is required, frame it as a concrete decision or evidence request the designer can take to that owner.
- Express every gap with five explicit answers: **缺什么、会影响什么、设计师去哪里补、具体补什么、做到什么算完成**. Never hide location, action, and completion inside one abstract recommendation paragraph.
- Keep internal audit taxonomy—such as readiness states, evidence-state models, projections, manifests, `not-run`, or observed-failure classifications—out of designer-facing conclusions. Translate it into the design artifact, decision, or evidence the designer can act on. If no design change is needed, say so directly and state only what source the designer may provide or what scope they may confirm.
- Avoid leading with file paths, commands, JSON fields, identifiers, or code-level logic. Put those in a compact verification or evidence note when useful, and expand them only when requested.
- Do not repeatedly call the user “designer” in every sentence. Make the role explicit once, then sustain it through vocabulary, priorities, and recommended actions.

For an assessment response in Markdown, use a concise designer decision brief:

1. **给设计师的结论** — safe delegation boundary, score, grade, and verdict in plain language.
2. **目前缺什么** — the highest-impact gaps, not an exhaustive technical inventory.
3. **会导致什么** — concrete effects on generated layouts, component/state choices, visual consistency, accessibility, or validation.
4. **设计师如何补全** — ordered actions with the target artifact, required decision, owner when needed, and observable completion criteria.
5. **报告与依据** — link the HTML report first; keep technical validation and evidence references brief.

## Independence contract

This skill is self-contained. It requires this `SKILL.md`, its bundled `references/`, `assets/`, and `scripts/`. Python's standard library powers the optional static scanner; Node.js 18 or later builds and validates scored HTML reports. It does not require another skill, repository, schema package, Figma connection, codebase, or canonical system specification to run `GUIDE`, audit the supplied evidence, or make evidence-supported Markdown improvements.

Treat canonical specs, Figma files, and code as optional audit evidence only when the user supplies or explicitly includes them. Their absence limits external-parity conclusions but does not prevent an internal Markdown audit.

## Reference routing

- Read [layer-model.md](references/layer-model.md) completely before explaining, mapping, or judging L0–L7.
- After the intended use is confirmed, read [assessment-profiles.md](references/assessment-profiles.md) before selecting requirements, scoring, or proposing improvements.
- For `AUDIT` or `OPTIMIZE`, also read [audit-method.md](references/audit-method.md) completely before inspecting the supplied materials.
- Before creating any audit or optimization result, read [report-format.md](references/report-format.md) completely. Use its fixed HTML template, report-data schema, scoring model, builder, and validator.
- Use `scripts/scan_markdown.py` when the materials are available as local files or folders. Treat its output as static evidence, never as the semantic verdict.

## Select one mode

Choose the workflow from the user's intent. Workflow selection does not replace the intended-use confirmation below.

- `GUIDE` — the user does not know what Markdown materials to prepare. Explain the L0–L7 model, recommend a minimum viable package for their scope, and give a preparation checklist.
- `AUDIT` — the user supplies existing materials and asks for assessment. Inspect them read-only and report quality, reasonableness, coverage, contradictions, risks, gaps, and prioritized improvements.
- `OPTIMIZE` — the user explicitly asks to revise or repair supplied materials. Audit first, then make only authorized changes and validate the result.

If a request combines education and audit, briefly orient the user to the layer model and then audit. If the user asks for a new design system to be generated from raw decisions, explain that generation is outside this review skill's scope and offer the `GUIDE` preparation output that this skill can complete independently. Do not turn this review skill into a generator or require another skill to finish its supported modes.

## Confirm intended use before assessment

Before every `AUDIT` or the baseline audit in `OPTIMIZE`, establish the user's explicit answer to this question in their language:

> 这套契约只用于视觉设计组合，还是也需要支持 Coding Agent 独立实现完整交互组件？

Use this as a standalone clarification, following the communication contract above. If the user needs help distinguishing the options, describe visual composition as appearance, layout, and visual states, and interactive implementation as also covering usable behavior, keyboard operation, focus, and accessibility.

- **仅视觉设计组合** → `VISUAL_COMPOSITION`: assess whether an Agent can select and compose components, represent required visual states, and validate the design output.
- **完整交互组件实现** → `INTERACTIVE_IMPLEMENTATION`: assess whether a Coding Agent can independently implement the scoped components, including their visual design, public API, state transitions, interaction, accessibility behavior, and acceptance checks.

Ask once and wait for an explicit answer before judging gaps, assigning maturity, scoring, or generating an assessment report. While waiting, only resolve paths and inventory the supplied files. If the user has already explicitly answered in the conversation, reuse that answer and state the selected scope in the user's language; do not ask again. Do not infer it from “Agent-ready,” the Agent's name, the presence of API headings, a document's self-description, or availability of code/Figma. No answer is not a default selection.

If the user requires both, use `INTERACTIVE_IMPLEMENTATION`, which includes visual requirements. Produce two separate assessments only when the user wants the two delegation boundaries compared; never blend scores. For `GUIDE`, explain both options if undecided and confirm the use before prescribing a tailored preparation package.

Record the selected profile and the user's answer in `assessment.profile` and `assessment.confirmation`. Apply that profile throughout layer maturity, quality, findings, blockers, recommendations, and the final delegation boundary. Keep it unchanged between baseline and optimized reports. A requested change of purpose requires a new baseline, not a claimed score improvement.

## Shared contract model

Treat L0–L7 as contract domains, not a rigid reading order:

```text
                         L0 Entry and governance
                                  │
                 ┌────────────────┼────────────────┐
                 │                │                │
             Intent           System          Components
              L1–L3             L4                L5
                 └────────────────┼────────────────┘
                                  │
                      L6 Implementation and validation
                                  │
                           L7 Lifecycle
```

Map content by meaning, not by filename or current folder layout. A nonstandard package can be sound; a canonical-looking package can still be empty or contradictory.

Every domain needs an explicit disposition: substantive, partial, `TBD`, or `N/A`. Do not call intentionally out-of-scope content “missing” when the package records a justified `N/A`. Do not accept silent absence where an Agent would otherwise have to guess.

## GUIDE workflow

1. Confirm the intended use above, then establish consumers, platforms, themes, component breadth, and whether Figma or code parity matters. Agent identity alone does not determine the assessment profile.
2. Explain each layer in the user's language using [layer-model.md](references/layer-model.md): the question it answers, its job, expected content, how to prepare it, and its necessity.
3. Recommend one of these starting packages:
   - **Learning outline** — a planning matrix for L0–L7, with owners and evidence sources. It is not yet an executable contract.
   - **Minimum viable contract** — L0, L4, L5, and L6 are substantive; L1–L3 and L7 are concise but explicitly resolved.
   - **Maintained contract** — all L0–L7 domains are substantive, traceable, and governed over time.
4. Tailor the preparation order to dependencies: identify authority and scope first, then product and language intent, then Foundations and components, then validation and lifecycle.
5. End with a concrete checklist of source material to collect. Separate “needed now” from “can remain TBD” and “not applicable.”

Do not overwhelm a beginner with Token syntax, schema details, or component-state matrices before explaining why those artifacts matter.

## AUDIT workflow

1. Confirm intended use before assessment, then resolve the exact evidence set. Record included files, exclusions, unavailable evidence, and any claimed canonical source.
2. If local files are available, run:

   ```bash
   python3 <this-skill>/scripts/scan_markdown.py <file-or-directory>
   ```

   Use the scan to inventory Markdown, local links, headings, placeholders, normative language, and candidate layer coverage. Verify important findings by reading the source.
3. Build an evidence map from the supplied content to L0–L7 against the selected profile in [assessment-profiles.md](references/assessment-profiles.md). Credit content wherever it actually lives; report misplaced or duplicated ownership separately. Omit implementation-only requirements from visual-composition gaps and scoring, while retaining visual state and visual accessibility requirements.
4. Apply [audit-method.md](references/audit-method.md). Judge both:
   - **internal contract quality** — clarity, consistency, executability, traceability, verification, progressive loading, and maintainability;
   - **external agreement** — parity with a canonical spec, Figma, or code only when direct evidence is in scope.
   Treat an external authority check such as `API authority verification: not-run` as a neutral evidence status when the corresponding code repository was not supplied. Do not lower layer maturity, score, grade, verdict, or readiness, and do not create a finding or improvement-plan item solely for that status. Record the unavailable repository under evidence limitations, then explicitly remind the user in the accompanying conversation that code parity could not be verified. Only report a defect when supplied authority evidence reveals a mismatch, or when the Markdown falsely claims verified parity without direct evidence.
5. Score the observed contract using the selected profile's production-capability weights and requirements plus the shared evidence gates in [audit-method.md](references/audit-method.md). Do not manually choose the final score, grade, verdict, or finding counts; the bundled readiness model calculates them.
6. Create the report-data JSON defined in [report-format.md](references/report-format.md). Write every summary and finding for a designer: identify the missing design contract, its concrete impact on Agent design production, how the designer can complete it, confidence, and an observable completion criterion.
7. Resolve this Skill's installed root from `SKILL.md`, then build and validate the standalone HTML report:

   ```bash
   node <skill-root>/scripts/build-report.mjs <report-data.json> <report.html>
   node <skill-root>/scripts/validate-report.mjs <report.html> --data <report-data.json>
   ```

   Require both commands to exit `0`. Preserve the report-data JSON as evidence and make the HTML report the primary deliverable.

Never infer product intent, Token values, component defaults, provenance, or lifecycle policy merely because they seem conventional. Mark unresolved facts as `TBD` or an evidence limitation.

## OPTIMIZE workflow

Optimization requires an explicit user request to change the materials. An audit request alone is read-only.

1. Complete the audit under the confirmed profile and identify the governing source before editing. Do not add implementation contracts to a visual-only package merely to increase its score.
2. Classify proposed changes:
   - `EDITORIAL` — wording, navigation, broken links, duplicated prose, or formatting without semantic change;
   - `STRUCTURAL` — moving content to its owning domain, splitting component files, adding indexes, or progressive-loading routes without changing decisions;
   - `SEMANTIC` — changing scope, precedence, Token values, component APIs/defaults/states, normative force, mappings, or lifecycle policy.
3. Apply editorial and structural changes only when they preserve meaning. Apply semantic changes only when supported by an authoritative source or an explicit user decision. Otherwise add `TBD` plus an owned open issue.
4. Preserve stable IDs, Token names, component inventory and order, defaults, mappings, provenance, and source digests unless the authoritative source requires a change.
5. Write to a sibling optimized package by default so the source remains recoverable. Edit in place only when the user requests it or the target is clearly a version-controlled working copy within scope.
6. Re-run the static scan, recheck all affected L0–L7 mappings, links, normative rules, and acceptance criteria, and generate a new validated HTML report using the same template. Preserve the baseline and state the before/after score, grade, verdict, and blocker count.

Do not touch Figma or code during Markdown optimization unless the user separately includes them. Read-only external evidence can verify or expose drift, but must not silently become the new authority.

## Quality boundaries

- Distinguish a document defect from missing audit evidence. “Not observed” is not the same as “incorrect.”
- Treat `MUST` and `FORBIDDEN` without observable verification as non-executable.
- Assess state completeness by profile: visual composition requires visual, content, geometry, visibility, and visual accessibility differences; interactive implementation additionally requires triggers, transitions, events, keyboard/focus, and assistive behavior where applicable. A state-name list is insufficient in either profile.
- Prefer stable logical identities. Figma node IDs, current paths, array positions, and screenshots may be locators or evidence, not the only semantic identity.
- Keep global rules in L0–L4 and component-specific deltas in L5. Do not reward duplication as completeness.
- Do not require a separate layer for assets, patterns/templates, user flows, page inventories, or page-state machines. Reference those artifacts when they exist and bring in only constraints that directly govern the design system.
- Match the user's language and technical level. Preserve established product terminology, but default to designer-facing language rather than code-oriented explanation.

## Completion

For `GUIDE`, finish with the recommended package level, an L0–L7 preparation matrix translated into design responsibilities, and the next materials the designer should collect or decide.

State the confirmed intended use beside every overall score and verdict. A visual-composition result must say that readiness covers visual output only; it does not establish readiness for independent interactive component implementation. Never compare scores from different profiles as before/after improvement.

For `AUDIT`, use the designer decision brief above. Lead with a clickable link to the validated HTML report, then state the safe delegation boundary, overall score, A–F grade, readiness verdict, blockers, and the highest-value design action. The report must visibly explain what contract is missing, how that gap affects Agent design production, and how the designer can complete it. Put evidence coverage and technical validation after the design implications. Do not claim external parity without direct evidence.

When code, Figma, or another optional external authority was not supplied, add a concise conversation reminder after the audit conclusion: name the unavailable source, state exactly which parity claim remains unverified, and make clear that this is not a failed item and did not reduce the result. Do not present connecting that source as required remediation unless the user explicitly included external parity in the requested scope.

For `OPTIMIZE`, additionally link both baseline and post-edit HTML reports and explain what the designer can now safely delegate, what still needs a design decision, and the next completion step. Keep report paths, files changed, preserved semantics, unresolved `TBD` items, and validation results in a compact “报告与依据” section.

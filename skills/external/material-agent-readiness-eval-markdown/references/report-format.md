# HTML Audit and Optimization Report

Use the bundled HTML template for every `AUDIT` and `OPTIMIZE` assessment. The HTML file is the primary human-facing deliverable; JSON scan output and Markdown notes are supporting evidence only.

## Primary audience and narrative

The primary audience is a designer deciding what work can safely be delegated to an Agent and what design knowledge still needs to be made explicit. Make that role visible in the report hero and sustain it throughout the report.

Use this fixed reading order in the HTML report:

1. confirmed intended use, its delegation boundary, overall score, grade, verdict, and what the designer can safely delegate now;
2. the grade scale that explains how to interpret the score;
3. which design-production capabilities the contract currently supports;
4. L0–L7 contract coverage, translated into design responsibilities;
5. what design contract is missing, what failure it can cause, and how the designer can complete it;
6. supporting quality, evidence, and technical validation.

The accompanying Markdown response remains a concise decision brief: lead with the report and overall conclusion, then summarize the highest-impact missing contract, its design-production effect, and the next designer action.

Do not lead with implementation mechanics, code logic, JSON structure, file paths, or audit terminology. Keep those available as evidence, but translate them into design consequences first. Prefer “loading and error states do not define layout, content, or accessibility behavior” over “L5 maturity is 2,” and then show the L5 score as supporting detail.

## Report outcome

Every completed assessment must show:

- an overall score for the confirmed visual-composition or interactive-implementation purpose from 0–100 when evidence is sufficient;
- an A, B, C, D, or F grade derived by the bundled scoring model;
- a gated verdict: `READY`, `CONDITIONALLY READY`, `NOT READY`, or `INSUFFICIENT EVIDENCE`;
- evidence coverage and the exact evaluated scope;
- six production-capability scores;
- L0–L7 maturity, evidence, key gap, and impact if missing;
- the aspects that are not Agent-ready, ordered by severity;
- for every finding, the missing contract, direct impact on Agent design production, and a designer-actionable completion path;
- a prioritized, evidence-backed improvement plan;
- included, excluded, and unavailable evidence, limitations, and material open questions.

Do not let a high average hide a blocker. Do not force a score when the evidence gate in [audit-method.md](audit-method.md) fails.

## Fixed template and tools

Resolve the directory containing `SKILL.md` as `<skill-root>`. Always render from:

- `assets/material-agent-readiness-eval-markdown-report-template.html` — fixed responsive and printable layout;
- `assets/report-locales.json` — complete `zh-CN` and `en` interface labels;
- `scripts/readiness-model.mjs` — scoring, grade, verdict, evidence, and schema authority;
- `scripts/build-report.mjs` — safe deterministic renderer;
- `scripts/validate-report.mjs` — standalone report validator.

Do not hand-edit a generated report or copy the Figma Skill's template at runtime. The Markdown template is intentionally independent while using the same certificate-style visual language.

## Report-data contract

Create one UTF-8 JSON file with `schemaVersion: "1.2.0"`. The builder accepts only `locale: "zh-CN"` or `"en"`.

### Confirmed assessment profile

Required for every report:

```json
{
  "assessment": {
    "profile": "VISUAL_COMPOSITION",
    "confirmation": "用户确认：这套契约只用于视觉设计组合。"
  }
}
```

`profile` must be `VISUAL_COMPOSITION` or `INTERACTIVE_IMPLEMENTATION`. `confirmation` records the user's explicit answer, not an auditor assumption. If unanswered, ask and wait; do not fabricate this field. Requirements, maturity, findings, and weights must all follow [assessment-profiles.md](assessment-profiles.md).

The report hero displays the selected use and a fixed scope boundary. Capability names/descriptions and weights follow the same profile. A visual report must never present its score as proof of full interactive implementation. The evidence section retains the confirmation text.

The builder rejects older schema versions and missing/unknown profiles rather than silently assigning a purpose. Existing HTML baselines remain historical artifacts. To rebuild old data, first confirm its intended use, reassess maturity and findings under that profile, then create new versioned data; a schema number change alone is insufficient.

### Top-level metadata

Required scalar fields:

- `title`, `generatedAt`, `scope`, `summary`, `safeUse`, `nextAction`;
- `source.name`, `source.root`; `source.version` is optional;
- `includedEvidence`, `excludedEvidence`, `unavailableEvidence`, `limitations`, and `openQuestions` as string arrays.

Use the user's language for assessment content and write as a design advisor speaking to a designer. `summary` must state the safe delegation boundary and the biggest design risk. `safeUse` must describe what the designer can already hand to an Agent. `nextAction` must name the first artifact or design decision to complete. Evidence paths should be relative to the evaluated root when possible and include a heading or tight line locator.

Put absent optional authority sources—such as an unconnected code repository that leaves `API authority verification` at `not-run`—in `unavailableEvidence` or `limitations`. Do not duplicate that status in `findings` or the improvement plan, and do not describe it as missing contract work, a failed verification, or required remediation. The accompanying conversation must remind the user that the source was not connected and parity remains unverified, while explicitly stating that this did not count against readiness. If direct authority evidence instead proves a mismatch, report the mismatch as a finding.

### Layers

Provide exactly one object for each `L0` through `L7`:

```json
{
  "id": "L5",
  "disposition": "PARTIAL",
  "maturity": 2,
  "summary": "Component purposes and APIs exist, but state behavior is incomplete.",
  "gap": "Error and loading states lack behavioral and accessibility deltas.",
  "impact": "The Agent may invent incompatible states or omit required semantics.",
  "confidence": "HIGH",
  "evidence": ["05-components/input.md#states"]
}
```

Allowed dispositions are `SUBSTANTIVE`, `PARTIAL`, `TBD`, `N/A`, `MISSING`, and `UNOBSERVED`. Use integer maturity `0`–`4` for every observed applicable layer. Use `null` only for `N/A` and `UNOBSERVED`.

L0, L4, and L6 cannot be `N/A` in either profile. L5 may be `N/A` only for an explicitly component-free scope such as Tokens-only; explain that boundary in `scope`, the layer summary, and `safeUse`. The layer example above illustrates interactive implementation; a visual assessment instead describes state appearance, content, and layout gaps.

### Cross-layer quality

Provide exactly these eight IDs, each with integer `maturity`, `summary`, and `evidence`:

`NAVIGATION`, `PRECISION`, `OWNERSHIP`, `CONSISTENCY`, `TRACEABILITY`, `IMPLEMENTABILITY`, `VERIFIABILITY`, and `MAINTAINABILITY`.

These scores explain the result but do not enter the weighted total a second time.

### Findings

Every finding requires:

- stable `id`, such as `ARM-BLOCKER-001`;
- `severity`: `BLOCKER`, `HIGH`, `MEDIUM`, or `LOW`;
- `appliesTo`: a non-empty array containing `VISUAL_COMPOSITION`, `INTERACTIVE_IMPLEMENTATION`, or both, according to the violated requirement; the selected report profile must be present;
- one audit `type` from [audit-method.md](audit-method.md);
- `defectKind`: `DOCUMENT_DEFECT` or `EVIDENCE_LIMITATION`;
- one affected production `capability`: `LOCATE_TRUST`, `INTERPRET_INTENT`, `APPLY_FOUNDATIONS`, `COMPOSE_COMPONENTS`, `VALIDATE_OUTPUT`, or `MAINTAIN_CHANGE`;
- affected `layers`, exact `evidence`, and `evidenceRefs`;
- `title`, `missingContract`, `agentImpact`, `designerLocation`, `designerAction`, `completionCriteria`, and `confidence`.

Use the fields as five separate designer-facing answers:

- `missingContract` — what design rule, state, value, ownership, or acceptance decision is absent;
- `agentImpact` — what will go wrong in the generated design or in the designer's ability to review it;
- `designerLocation` — the human-readable artifact and section where the designer should work, such as “Input 组件契约 → 错误态” rather than only a file path;
- `designerAction` — the exact content to add or the concrete decision/evidence request to coordinate, including another owner only when necessary;
- `completionCriteria` — what the designer can observe to know the gap is resolved.

Keep audit-internal phrases out of these five fields. Terms such as “document readiness,” “unavailable downstream evidence,” “observed validation failure,” “neutral/unavailable evidence,” “projection,” “manifest blocker,” and `not-run` belong only in technical evidence when indispensable. Do not simply translate them into equally abstract Chinese.

For example, do not write: “缺少区分 document readiness、unavailable downstream evidence 与 observed validation failure 的中性状态模型。” Write instead:

- **缺什么：** 评估说明没有区分“某份外部材料没有提供”和“材料已经检查但确认不符合要求”。
- **会影响什么：** 没有提供代码或 Figma 证据时，报告可能把“暂时无法核对”误写成设计契约失败，导致评分和优先级失真。
- **设计师去哪里补：** 报告的“评估范围与依据”部分；设计系统正文无需因此修改。
- **具体补什么：** 标明哪些材料已检查、哪些本次未提供、哪些明确不在范围；只有实际发现不一致时才记录问题。
- **做到什么算完成：** 未提供的材料只出现在“待补充依据”中，阻塞项只保留真正会让 Agent 无法完成设计的缺口。

Avoid generic wording such as “may reduce quality,” code-only remediation, or instructions aimed at a contract-tool maintainer instead of the designer.

Do not copy implementation-only findings into a visual report or simply relabel them as applicable. Omitted props, runtime transitions, keyboard handling, or interaction tests cannot reduce a visual score. Shared visual-state gaps remain findings in either profile.

An evidence limitation cannot be a document `BLOCKER`. Absence of an optional external authority source is recorded as unavailable evidence rather than a finding. If the agreed Markdown set was inspected and a required responsibility is absent, classify it as a document defect instead.

### Improvement plan

Each plan item requires `id`, `priority`, `changeClass`, `findingIds`, `target`, `action`, `authorityNeeded`, and `validation`. Write `target` as the design artifact or decision location, `action` as something the designer can do or coordinate, `authorityNeeded` as the person or source that must confirm the choice, and `validation` as an observable design completion criterion. Allowed change classes are `EDITORIAL`, `STRUCTURAL`, and `SEMANTIC`.

Every `findingIds` entry must reference a finding in this report. Do not add an implementation-only remediation through an orphan plan item in a visual report.

## Build and validate

Write report data and the HTML report into a versioned audit directory. Preserve prior baselines.

```bash
node <skill-root>/scripts/build-report.mjs <report-data.json> <report.html>
node <skill-root>/scripts/validate-report.mjs <report.html> --data <report-data.json>
```

Both commands must exit `0`. The validator checks the confirmed profile, its visible label/boundary, the embedded calculated model, headline score/grade/verdict, finding counts, all L0–L7 and quality rows, required sections, unresolved placeholders, responsive metadata, print support, and external dependencies.

The report must remain a standalone file with inline CSS, no network dependency, accessible structure, narrow-screen behavior, and print styles. When a browser is available, open the local HTML once and confirm the hero, capability cards, key findings, layer table, and print layout are readable. If browser rendering is unavailable, disclose that limitation; never skip deterministic validation.

## Optimization reports

Preserve the pre-edit HTML report. After authorized edits, create a new report-data file and HTML report using the same template, selected profile, and scoring model. A purpose change requires a new baseline; scores from different profiles are not before/after improvement. In `summary`, state before/after score, grade, verdict, and blocker count plus completed actions; use the plan table for remaining findings. Never overwrite the baseline or imply that the pre-edit report represents the optimized package.

## Markdown completion response

Write the accompanying response as a short designer decision brief:

- **给设计师的结论 / Designer conclusion:** link the validated HTML report first, then state the safe delegation boundary, score, grade, and verdict in plain language.
- **目前缺什么 / What is missing:** summarize up to three highest-impact gaps.
- **会导致什么 / What it affects:** connect each gap to a concrete generated-design outcome.
- **设计师如何补全 / How the designer completes it:** give ordered artifact- and decision-level actions with completion criteria.
- **报告与依据 / Report and evidence:** give evidence coverage, blockers, validation status, and paths without narrating code logic.

Keep the brief concise when the HTML report contains the detail. Do not finish an assessment with only prose or Markdown when the artifact location is writable.

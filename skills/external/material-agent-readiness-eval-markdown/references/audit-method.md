# Evidence-based Audit Method

## Audit unit and evidence boundary

Confirm intended use using `SKILL.md` before assessing. Read [assessment-profiles.md](assessment-profiles.md) and apply the selected requirements throughout maturity, quality, findings, blockers, and recommendations. Audit the exact user-supplied evidence set. Record:

- the selected assessment profile and the user answer confirming it;

- included Markdown files and supporting specs, schemas, manifests, or source artifacts;
- explicit exclusions and inaccessible materials;
- claimed canonical source, version, and authority;
- whether Figma or code evidence is direct, declared, inferred, or unavailable;
- scan date and any static-tool limitations.

Do not reduce quality because an external projection is outside scope. Report internal contract quality separately from external parity.

### Optional external authority checks

Code repositories, Figma files, and other external projections are optional evidence unless the user explicitly supplies or includes them. Apply these rules to statuses such as `API authority verification: not-run`, `code mapping: not verified`, or their equivalents:

- If the authority source was not supplied, treat the status as neutral unavailable evidence. Record it in `unavailableEvidence` or `limitations`; do not turn it into a finding, failed check, blocker, improvement-plan item, or reason to lower maturity, evidence coverage, score, grade, or verdict.
- In the accompanying conversation, remind the user which source was not connected and which external-parity conclusion therefore remains unverified. Explicitly say that the limitation did not count as a failure.
- If the source was supplied and verification is feasible, perform the check. An observed mismatch is a document/parity defect; a match is positive external-agreement evidence.
- If the Markdown claims `verified` external parity without direct evidence, report the unsupported claim as a document defect even when the external source is unavailable.
- If the user explicitly asks for an external-parity audit but withholds the source, report that requested conclusion as unavailable; do not reinterpret the missing source as a defect in the Markdown contract.

In the interactive implementation profile, score the internal API contract from what the Markdown actually specifies—such as property names, types, defaults, states, behavior, and acceptance criteria. Do not require a repository to credit a complete internal contract, and do not award external-parity credit without direct comparison evidence.

## Coverage mapping

Map each meaningful section to its owning L0–L7 domain by semantics. One file may support several domains, and one domain may span files.

For each layer record:

- disposition: `SUBSTANTIVE`, `PARTIAL`, `TBD`, `N/A`, `MISSING`, or `UNOBSERVED`;
- evidence locations: file plus heading or tight line reference;
- covered responsibilities;
- missing responsibilities;
- contradictions or duplicate ownership;
- confidence: `HIGH`, `MEDIUM`, or `LOW`.

Use `UNOBSERVED` when the audit evidence cannot establish whether content exists. Use `MISSING` only after the agreed source set has been inspected.

## Maturity rubric

Score each applicable layer and each cross-layer dimension from 0–4 against the confirmed profile, using its L5/L6 maturity anchors and blocking criteria. Do not cap visual maturity for missing runtime contracts; do not award executable interactive maturity for visual-only specifications. The ordinal score must be supported by observed evidence; never assign fractional maturity merely to tune the final percentage.

| Score | Meaning | Observable standard |
|---|---|---|
| 0 | Absent or unsafe | Required decisions are missing, contradictory, or force material guessing. |
| 1 | Descriptive | Intent is mentioned, but rules, ownership, or actionable detail are weak. |
| 2 | Partly actionable | Important decisions exist, but gaps, ambiguity, or unverifiable claims remain. |
| 3 | Executable | An Agent can act with bounded judgment; sources, exceptions, and acceptance are clear. |
| 4 | Governed and verifiable | Content is executable, traceable, evidence-backed, progressively loadable, and maintained. |

Convert observed layer maturity to a display score using `maturity × 25`. Do not score `N/A` or `UNOBSERVED`.

## Agent production score

The overall score measures readiness for the confirmed output: visual composition or complete interactive component implementation. It is not a generic writing-quality score. Use the six capability weights defined in [assessment-profiles.md](assessment-profiles.md); never choose weights manually or combine profile scores.

The bundled `scripts/readiness-model.mjs` is the calculation authority. It selects the confirmed profile's six capability weights and converts them into equivalent L0–L7 weights, excludes justified `N/A` domains, renormalizes applicable weights, and calculates one decimal place. Do not manually override its score, grade, verdict, evidence coverage, or finding counts.

Evidence coverage is the percentage of applicable weight that is directly observed. `MISSING` and `TBD` are observed states and score according to their evidence-backed maturity; `UNOBSERVED` is an evidence limitation and lowers coverage. Do not issue an overall score or grade when:

- any applicable core layer L0, L4, L5, or L6 is `UNOBSERVED`; or
- observed evidence covers less than 75% of applicable weight.

In that case show `INSUFFICIENT EVIDENCE`, retain observed layer and capability results, and list the exact evidence needed.

### Grade bands

| Grade | Score | Interpretation |
|---|---:|---|
| A | 90–100 | Highly Agent-ready for autonomous design production in the stated scope. |
| B | 80–89.9 | Largely Agent-ready with minor bounded gaps. |
| C | 70–79.9 | Partly usable; material steps still need human review. |
| D | 50–69.9 | Below the production baseline; systematic repair is required. |
| F | 0–49.9 | The contract is insufficient and forces extensive Agent guessing. |

The grade reflects the weighted score. It never cancels a blocker; always show the readiness verdict beside it.

## Cross-layer quality dimensions

Assess these independently from layer coverage:

1. **Navigation and progressive loading** — L0 routes tasks directly to the minimum owning files.
2. **Decision precision** — normative statements, defaults, exceptions, and forbidden behavior are unambiguous.
3. **Semantic ownership** — intent, direction, values, component deltas, validation, and lifecycle live in appropriate domains without harmful duplication.
4. **Consistency and reasonableness** — terms, IDs, values, defaults, states, and precedence do not contradict one another; rules are proportional to scope and do not over-constrain without rationale.
5. **Traceability and provenance** — material facts identify an authoritative source or are labeled derived/default/TBD.
6. **Implementability** — Agents can compose visual output or implement complete interactive components, according to the selected profile, without material guessing.
7. **Verifiability and evidence** — `MUST`/`FORBIDDEN` rules and acceptance criteria have observable checks; mapping claims match available evidence.
8. **Maintainability and lifecycle** — stable identities, versions, owners, migration, open issues, and drift handling are present.

## Readiness verdict

Apply these gates after calculating the score:

- **READY** — score at least 85; no blockers; every applicable core layer L0, L4, L5, and L6 scores at least 75.
- **CONDITIONALLY READY** — score at least 70; no blockers; every applicable core layer scores at least 50.
- **NOT READY** — all other sufficiently evidenced results, including any document blocker.
- **INSUFFICIENT EVIDENCE** — the score eligibility gate above fails.

State the selected intended use and exact scope beside the verdict: for example, “ready for visual composition of the listed components” or “ready for independent Button implementation in React.” A visual READY result does not establish interactive implementation readiness.

A `BLOCKER` must describe a document defect supported by inspected evidence. An unavailable external source is neutral unavailable evidence, not a failed item or document blocker; follow **Optional external authority checks** above. If the agreed Markdown package was fully inspected and a required contract is absent, that absence is a document defect and may score zero.

## Finding taxonomy

Use one primary type:

- `COVERAGE` — a required responsibility is absent or unresolved;
- `CONTRADICTION` — equal or unclear authorities disagree;
- `AMBIGUITY` — language permits materially different interpretations;
- `MISPLACEMENT` — content sits outside its owning domain and creates navigation or precedence risk;
- `DUPLICATION` — repeated rules can drift or disagree;
- `TRACEABILITY` — source, version, status, or provenance is unsupported;
- `IMPLEMENTABILITY` — API, anatomy, layout, state, Token binding, or behavior requires guessing;
- `VERIFICATION` — acceptance or normative rules cannot be observed;
- `ACCESSIBILITY` — semantics, focus, keyboard, contrast, motion, or assistive behavior is missing or unsafe;
- `LIFECYCLE` — ownership, compatibility, deprecation, migration, or open issues are unmanaged;
- `EVIDENCE_LIMIT` — the auditor lacks evidence; this is not a document defect.

## Severity and confidence

### Severity

- `BLOCKER` — prevents safe execution or makes the claimed contract authority unreliable.
- `HIGH` — likely causes divergent implementation, inaccessible behavior, or material design drift.
- `MEDIUM` — creates recurring ambiguity, maintenance cost, or weak validation.
- `LOW` — editorial or local usability issue with limited semantic risk.

### Confidence

- `HIGH` — directly supported by complete source evidence.
- `MEDIUM` — supported by partial evidence or a strong cross-file inference.
- `LOW` — plausible but needs another source; phrase it as a question or evidence request, not a fact.

## Blocking conditions

Apply the profile-specific blockers in [assessment-profiles.md](assessment-profiles.md), plus these shared conditions when applicable to the stated scope:

- no usable entrypoint, authority, scope, or precedence;
- a canonical source claim with missing/mismatched identity or digest when digest governance is declared;
- contradictory Token values, component defaults, state behavior, or normative rules without conflict resolution;
- a scoped Foundation or component absent with no `TBD`/`N/A` disposition;
- a component missing the purpose, defaults, states, accessibility, mapping disposition, or acceptance criteria required by the selected profile; public runtime API and interaction requirements apply only to interactive implementation;
- `MUST` or `FORBIDDEN` rules without an observable verification method;
- broken task-routing or component-index links that prevent progressive loading;
- external parity claimed as verified without direct evidence;
- unsupported assertions presented as user decisions;
- volatile Figma node IDs, display positions, or file paths used as the only semantic identity.

## Reasonableness checks

Quality is not just completeness. Ask:

- Does the amount of prescription match the system's maturity and risk?
- Does every normative rule change a decision, prevent a known error, or define acceptance?
- Are global defaults written once and component files limited to local deltas?
- Are exceptions narrower and more explicit than the rules they modify?
- Are examples labeled as illustrative rather than silently normative?
- Are visual accessibility requirements explicit, and, for interactive implementation, are interaction accessibility and recovery behaviors explicit?
- Are `TBD` items honest uncertainties with owners, rather than hidden omissions?
- Can a change be made in one owning location without hunting down duplicate copies?

## Static scan interpretation

`scan_markdown.py` can establish file inventory, candidate layer signals, headings, local-link health, placeholder counts, and normative-language counts. It cannot determine:

- whether a design decision is correct;
- whether content is in the correct semantic layer;
- whether a `TBD` is acceptable;
- whether two differently worded rules conflict;
- whether Figma/code parity is real;
- whether a component contract is sufficient to implement.

Read source passages before reporting any semantic finding.

## Optimization planning

For every proposed fix assign:

- a stable plan ID;
- finding IDs addressed;
- change class: `EDITORIAL`, `STRUCTURAL`, or `SEMANTIC`;
- target files and owning layer;
- intended before/after behavior;
- authority or evidence supporting the change;
- risk and rollback path;
- validation criterion.

Never resolve a semantic gap by importing a conventional value. When authority is absent, add a bounded `TBD`, owner, and decision needed.

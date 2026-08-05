---
name: spec-specify
description: Draft a specification from frozen decision material using controlled artifact callbacks.
---

# Spec Specify

Input is decision/scope content plus controlled `readArtifact(name)` and
`writeArtifact(name, content)` callbacks supplied by build-spec. This component
does not receive task identity, storage configuration, workspace paths, or an
ambient shell location.

Use `templates/spec-template.md`. Produce a testable, readable specification
covering user outcomes, urgency, scope, scenarios, edge states, requirements,
assumptions, risks, acceptance, business impact, regression paths, and explicit
exclusions. Keep the quick-read section short; put narrative before trace fields.

## Artifact responsibility

`spec.md` is the single source of product and behavior truth: problem, scope,
scenarios, PFACT, FR, AC, product-boundary contracts, impact, risks, and open
questions. It names what users must observe, not how code will be changed.
`plan.md` owns verified engineering facts and design decisions; `tasks.md` owns
compact execution cards. Do not copy either artifact's authority into `spec.md`.

Give every scenario, PFACT, FR, AC, risk, and open question a stable ID. New
requirements use `FR-{DOMAIN}-{NNN}`; accept `FR-{NNN}` only when reading legacy
material. Every FR links to at least one PFACT, scenario, and AC. Every AC names
its FR, verification method, pass condition, failure condition, and evidence
type. Consider default, empty, error, loading, cancellation, boundary,
permission, and race states; link each applicable state to a scenario or record
`N/A — reason`.

New typed publication uses `content_profile: "spec-content.v3"`. It carries
scenario cards, FR `scenario_refs`, AC `failure_condition`, and OPEN cards with
affected IDs, owner, impact, handling Stage, and close condition or STOP. The
profile is fail-closed: an unknown profile is invalid. Legacy
`ambiguity-ledger.v2` payloads remain readable without being rewritten; only new
content must satisfy the canonical `FR-{DOMAIN}-{NNN}` grammar and added fields.

PFACT uses exactly one status: `verified`, `inferred`, `unknown`, or
`not_applicable`. A verified PFACT names formal evidence. An inferred PFACT
names its source and limitations and is the only authoritative location for an
assumption. An unknown PFACT names its owner and impact. A not-applicable PFACT
names its reason. Every PFACT names affected FR and AC IDs.
In the new content profile, the selected status field is exclusive: a PFACT
must not retain evidence, inference, unknown, or not-applicable fields belonging
to another status. Every unknown PFACT is bound to a RISK or OPEN card.

Keep product facts in `spec.md` only. Do not add code paths, symbols, code
anchors, engineering alternatives, implementation state machines, exact gate
commands, or plan/task decisions. Keep explicit exclusions in one authoritative
section and inherit each accepted upstream exclusion exactly once. Express
default product constraints as FR/AC-linked obligations; leave engineering
gates and exact test commands to plan/tasks.

## Decision-log mapping and scope revision

For every new or changed FR/AC, preserve a compact source binding to the
current `decision-log.md`: `R*`, report requirement ID, or `INC-*` as the
original source, and the load-bearing `D*` decision that explains the choice.
The binding records `source_status` (`current`, `deferred`, `non-goal`, or
`unknown`) and affected user journey/state/acceptance IDs. It does not copy the
decision-log prose into `spec.md`, and an FR without a source binding is a new
requirement that must return to `make-decision`.

When a build-code or verify-code scope revision changes product behavior,
re-read the four current materials and update only affected FR/AC/source
bindings plus the revision note. Preserve old facts as history; do not silently
turn a task finding into an upstream decision or use `build-spec` to invent the
missing choice.

Include module, entity, data-lifecycle, and compatibility contracts only at the
product boundary. For each conditional subsection, write either the applicable
contract or one `N/A — reason` line. Risks name affected IDs, trigger,
consequence, mitigation or STOP, handling stage, and verification. Open
questions name affected IDs, owner, impact, handling stage, and close condition
or STOP. Ambiguity is marked; it is not guessed.

Before writing, remove authoring comments, placeholders, empty headings, empty
tables, and filler. Use at most five columns in a table and keep prose out of
table cells. Do not duplicate scenario prose in FRs, assumptions outside PFACT,
or exclusions in multiple sections.

Write only the named artifact `spec.md`. Return requirement count, ambiguity
count, and a short checklist as structured output. Do not run Git commands or
discover files. Missing input/callback fails loud.

---
name: intake-decision-review
description: Blind review lens for the problem, framing, scope, and feasibility of an intake direction.
---

# Intake Decision Review

This skill is a pure review lens used only by the `wh-review` make-decision
direction track. `wh-review` owns material freezing, provider selection,
provider invocation, transport validation, retries, and result publication.
This lens never invokes a provider, asks the user a question, waits for
confirmation, or writes task or product files.

## Input contract

Read only `review-packet.v1` and its frozen direction bundle. Allowed material:

- the raw user requirement;
- objective facts with traceable sources;
- hard constraints;
- explicit non-goals;
- the make-decision direction review instructions.

The bundle must not contain a proposed or recommended solution, candidate
decision, option ranking, decision log, approved direction, specification,
plan, code, diff, test result, or detail-review conclusion. Report forbidden or
missing material as unavailable; do not infer it, request another file, or ask
the user to supply it.

## Review method

Independently inspect all four angles:

- `direction`: whether the stated work addresses the real user problem;
- `framing`: whether the requirement mistakes a tool or implementation for the
  goal, or embeds an unsupported premise;
- `scope`: whether the boundary is too broad, too narrow, or missing a
  load-bearing non-goal;
- `feasibility`: whether objective facts already disprove an external
  interface, dependency, timing, or operational assumption.

Each finding must use exactly one angle. Put the angle in the finding prose;
do not add an `angle` field. Findings are `0-N`; do not invent one merely to
fill an angle and do not cap real findings. Distinguish supplied facts from
reviewer inference. Every finding must use only the provider protocol fields:
`severity`, `path`, optional `line`, `issue`, `root_cause`, `recommendation`,
`evidence_kind`, and `evidence`.

This is direction review, not solution review. Do not compare implementation
approaches, refine the candidate design, or use knowledge of downstream stage
artifacts. Return exactly one JSON object: `{ "findings": [...] }`. Do not
return `verdict`, `summary`, checklist fields, angle/axis fields, or a second
object.

## Failure contract

Missing required material, forbidden material, or an unreadable frozen packet
is `unavailable`, never `pass`. A material disagreement is a finding, not a
prompt for interactive clarification. The parent make-decision flow decides
whether a finding becomes a round-3 question or remains a visible fact.

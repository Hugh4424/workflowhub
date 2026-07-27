---
name: spec-specify
description: Draft a specification from frozen decision material using controlled artifact callbacks.
---

# Spec Specify

Input is decision/scope content plus controlled `readArtifact(name)` and
`writeArtifact(name, content)` callbacks supplied by build-spec. This component
does not receive task identity, storage configuration, workspace paths, or an
ambient shell location.

Produce a testable specification covering user outcomes, scope, requirements,
acceptance scenarios, edge cases, assumptions, risks, and explicit exclusions.
Every PFACT, FR, and AC gets a stable ID. PFACT uses exactly one fact status:
`verified`, `inferred`, `unknown`, or `not_applicable`. A verified PFACT names
formal evidence; inferred, unknown, and not-applicable facts name their limit,
owner, or reason. Every FR links to PFACT and AC; every AC names its FR,
verification method, pass condition, and evidence type.

Keep product facts in `spec.md` only. Do not add code paths, symbols, code
anchors, engineering alternatives, implementation state machines, or plan/task
decisions. Risks must name affected IDs, trigger, consequence, mitigation or
STOP, handling stage, and verification. Ambiguity is marked; it is not guessed.

Write only the named artifact `spec.md`. Return requirement count, ambiguity
count, and a short checklist as structured output. Do not run Git commands or
discover files. Missing input/callback fails loud.

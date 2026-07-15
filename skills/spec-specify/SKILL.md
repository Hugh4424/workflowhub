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
Every requirement gets a stable ID. Ambiguity is marked; it is not guessed.

Write only the named artifact `spec.md`. Return requirement count, ambiguity
count, and a short checklist as structured output. Do not run Git commands or
discover files. Missing input/callback fails loud.

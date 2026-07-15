---
name: spec-plan
description: Generate an implementation plan from supplied spec and research content.
---

# Spec Plan

Receive frozen `spec.md` and optional `research.md` content plus a controlled
writer from build-plan. File discovery, task identity, repository inference, and
Git operations are outside this component.

Create a plan containing summary, technical context, constraints, interfaces,
data contracts, implementation sequence, test strategy, rollback notes,
requirement mapping, and the constitutional checklist. Prefer the smallest
design that satisfies the specification. Write only named artifact `plan.md`.

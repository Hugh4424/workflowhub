---
name: build-prd
description: Orchestrate a portable task-group PRD workflow without owning formal stage execution or PRD prose.
version: 1.0.0
---

# Build PRD

## Responsibility and authority

`build-prd` is a portable workflow, not a sixth formal development stage. It
binds an authenticated parent decision and the required sources, presents the
planning outline and task map, coordinates real clarification or conditional
UI-design work, and reports the facts returned by those existing capabilities.

The `spec-prd` skill is the only owner of formal PRD prose and the single
`prd.md` write target. This workflow must not write the PRD body, invent product
direction, create `spec.md`, `plan.md`, or `tasks.md`, or authorize Git or
physical delivery actions. A planning PRD is an input for later tasks; it is
not a fifth current material.

## Portable invocation

A host may discover this workflow through the `build-prd` portable registry
entry and carry the three files in this directory plus their declared skill
closure. The package is host-neutral: it does not assume a particular CLI,
provider, browser, external host, or platform identity. A host must supply an
explicit confirmed parent decision and readable required sources. If a source
or capability is unavailable, report the concrete gap and preserve the
incomplete or unavailable fact; do not infer confirmation or successful
execution.

## Ordered orchestration

1. Load the parent decision and required source references, retaining their
   revisions and hashes where provided.
2. Ask the existing `spec-prd` capability for the outline and result-oriented
   task map. Keep this as a draft until the user reviews the displayed version.
3. If the map contains UI work, route it through the existing readiness/render
   path and bind every returned design fact to the displayed map revision. For
   non-UI planning, record that design is not applicable.
4. After a real map/design response, ask `spec-prd` to expand the same revision
   into the complete PRD. `spec-prd` remains the sole formal content writer.
5. Display that detailed draft and perform the non-content
   `confirm-final-displayed-draft` step. Bind `decision_revision`,
   `source_revision`, `map_revision`, `prd_revision`, `displayed_draft_hash`,
   `display_before_reply=true`, and `human_approved=true`. A refusal,
   unanswered response, wrong revision, false flag, or hash mismatch preserves
   `draft` and reports the concrete gap; this is not a third content call.
6. Report source, confirmation, review, missing, partial, unavailable, and
   delivery facts separately. Never claim external host invocation, provider
   success, user confirmation, publication, or physical delivery unless the
   caller supplies that fact.

## Boundaries

- Do not add `build-prd` to the canonical five stages or their stage manifests.
- Do not add `prd.md` to `CURRENT_MATERIAL_FILES`.
- Do not dispatch this Markdown file through `core/dispatch-component.mjs`;
  discovery and packaging are static portable-workflow concerns.
- Do not add a second dispatcher, review system, content writer, store, gate,
  or public command.

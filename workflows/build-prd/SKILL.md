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

For a planning request, the direction map must cover the **完整用户旅程** and
show **需求覆盖** for every requirement through a responsible card or an
explicit exclusion with a **明确排除理由**. A later **子任务** receives only its
**最小读取集** and its own material. The **母任务** and **兄弟** material remain
**只读**:
the child does not write them, **不触发母任务close**, **不移动**, or **不删除**;
any **边界偏离** is recorded with the original boundary, **实际偏离**, and
**原因**. These are handoff facts, not a new stage or a new store.

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

### `report-facts-and-handoff` save/read contract

The sixth step is the existing portable **report-facts-and-handoff** seam. It
does not run a third content call, is **not a formal stage**, and does not
produce close approval or an operation confirmation. The non-stage reflection
is not a `stage-reflection` result and is not a formal stage identity.

The step uses one small JSON payload with only these fields: **仅
`task_id`、`workflow`、`material_refs`、`reply_text`、`step_results`、
`reflection_facts`**. `material_refs` contains explicit current decision/PRD/
attachment references and their **raw-byte SHA** hashes; `step_results` contains the actual
portable workflow steps; `reflection_facts` contains the non-empty conclusion
and the steps it cites. The caller does not add an accepted/rejected status,
close plan, authorization, or a new completion enum.

In one-line form the allowed payload is: **仅 task_id、workflow、material_refs、reply_text、step_results、reflection_facts**.

The producer runs the same existing save/read seam in the current task kernel:

```js
const reportFactsAndHandoff = (payload, { task, kernel }) => {
  if (payload.task_id !== task.identity.taskId || payload.workflow !== "build-prd"
      || payload.reply_text.trim() === "" || !Array.isArray(payload.material_refs)
      || !Array.isArray(payload.step_results) || !Array.isArray(payload.reflection_facts)) {
    return { status: "unavailable", reason: "invalid or empty handoff payload" };
  }
  const raw = `${JSON.stringify(payload, null, 2)}\\n`;
  const ref = `quality/evidence/portable-workflow-outcomes/build-prd/${sha256(raw)}.json`;
  try { kernel.publishCanonicalRecord(ref, raw); }
  catch (error) { return { status: "unavailable", reason: `write failed: ${error.message}` }; }
  return readReflectionForReport({ task, ref, expectedRaw: raw });
};

const readReflectionForReport = ({ task, ref, expectedRaw }) => {
  try {
    const readback = task.readRecord(ref);
    if (readback !== expectedRaw || sha256(readback) !== ref.split("/").at(-1).slice(0, -5)) {
      return { status: "unavailable", reason: "readback hash mismatch" };
    }
    return { status: "recorded", ref, sha256: sha256(readback), payload: JSON.parse(readback) };
  } catch (error) {
    return { status: "unavailable", reason: `read failed: ${error.message}` };
  }
};
```

The report and handoff use the validated readback value, not the pre-save
object. Empty text, wrong task/workflow, missing material or step references,
write failure, read failure, or hash mismatch stays `unavailable` with the
concrete reason. A valid save/read fact is not a formal stage reflection,
close-plan confirmation, or delivery fact; those existing owners remain
separate.

## Boundaries

- Do not add `build-prd` to the canonical five stages or their stage manifests.
- Do not add `prd.md` to `CURRENT_MATERIAL_FILES`.
- Do not dispatch this Markdown file through `core/dispatch-component.mjs`;
  discovery and packaging are static portable-workflow concerns.
- Do not add a second dispatcher, review system, content writer, store, gate,
  or public command.

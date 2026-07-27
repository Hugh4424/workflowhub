const ARTIFACT_KINDS = new Set(["spec", "plan", "tasks", "evidence", "code"]);
const HASH = /^[a-f0-9]{64}$/;
const SNAPSHOT = /^[a-f0-9]{40,64}$/;

function text(value) {
  return typeof value === "string" && value.trim() !== "" ? value : null;
}

function reference(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const artifact_kind = text(value.artifact_kind);
  const ref = text(value.ref);
  const hash = text(value.hash);
  const id = text(value.id);
  const hashIsValid = artifact_kind === "code" ? SNAPSHOT.test(hash ?? "") : HASH.test(hash ?? "");
  if (!artifact_kind || !ARTIFACT_KINDS.has(artifact_kind) || !ref || ref.startsWith("/")
      || ref.split("/").includes("..") || !hashIsValid || !id) return null;
  return { artifact_kind, ref, hash, id };
}

function referenceKey(value) {
  const binding = reference(value);
  return binding ? JSON.stringify(binding) : null;
}

function refs(value) {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (typeof entry === "string" && entry !== "") return [entry];
    if (entry && typeof entry === "object" && typeof entry.ref === "string" && entry.ref !== "") return [entry.ref];
    return [];
  });
}

function gap(affectedId, reason, evidenceRefs, recovery) {
  return {
    affected_id: affectedId,
    reason,
    evidence_refs: refs(evidenceRefs),
    recovery,
  };
}

function unique(items) {
  return [...new Set(items)];
}

/**
 * Resolve a task-local projection from explicitly supplied, accepted bindings.
 * It deliberately has no filesystem, Git, TaskKernel, or provider dependency.
 */
export function createTaskProjection({ task, selectedRefs, acceptedRefs } = {}) {
  const taskId = text(task?.id) ?? "unknown-task";
  const declared = Array.isArray(task?.versioned_refs) ? task.versioned_refs : [];
  const selected = Array.isArray(selectedRefs) ? selectedRefs : [];
  const accepted = Array.isArray(acceptedRefs) ? acceptedRefs : [];
  const gaps = [];
  const declaredKeys = new Set();
  const acceptedKeys = new Set();
  const selectedKeys = new Set();

  for (const item of declared) {
    const key = referenceKey(item);
    const affectedId = text(item?.id) ?? taskId;
    if (!key) {
      gaps.push(gap(affectedId, "invalid_reference", [], "supply artifact_kind, ref, hash, and id from the accepted task card"));
      continue;
    }
    if (declaredKeys.has(key)) {
      gaps.push(gap(affectedId, "duplicate_task_reference", [], "keep one exact binding for each task-local design item"));
      continue;
    }
    declaredKeys.add(key);
  }

  if (declared.length === 0) {
    gaps.push(gap(taskId, "missing_task_reference", [], "declare the task's required versioned_refs before implementation"));
  }

  for (const item of accepted) {
    const key = referenceKey(item);
    if (key) acceptedKeys.add(key);
  }

  for (const item of selected) {
    const key = referenceKey(item);
    const affectedId = text(item?.id) ?? taskId;
    if (!key) {
      gaps.push(gap(affectedId, "invalid_reference", [], "supply a complete accepted ReferenceBinding"));
      continue;
    }
    if (selectedKeys.has(key)) {
      gaps.push(gap(affectedId, "duplicate_selected_reference", [], "select each task-local binding once"));
      continue;
    }
    selectedKeys.add(key);
    if (!declaredKeys.has(key)) {
      gaps.push(gap(affectedId, "overwide_projection", [], "remove the binding or add it to this task's accepted versioned_refs"));
    }
    if (!acceptedKeys.has(key)) {
      gaps.push(gap(affectedId, "unaccepted_reference", [], "refresh the binding from the accepted artifact identity"));
    }
  }

  for (const key of declaredKeys) {
    if (!selectedKeys.has(key)) {
      const binding = JSON.parse(key);
      gaps.push(gap(binding.id, "missing_selected_reference", [], "select every required task binding before execution"));
    }
  }

  return {
    status: gaps.length ? "stop" : "ready",
    task_id: taskId,
    selected_refs: gaps.length ? [] : selected.map(reference),
    gaps,
    recovery_conditions: unique(gaps.map(({ recovery }) => recovery)),
  };
}

function currentEvidenceGap(alignmentId, label, value, tree) {
  const evidenceRefs = refs([value?.ref]);
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return gap(alignmentId, `missing_current_${label}_evidence`, evidenceRefs, `publish current ${label} evidence for the verification snapshot`);
  }
  if (value.snapshot_tree !== tree) {
    return gap(alignmentId, `stale_current_${label}_evidence`, evidenceRefs, `replace ${label} evidence with the current verification snapshot`);
  }
  return null;
}

function contextObservation(value) {
  const fields = ["packet_bytes", "reference_count", "implementation_tokens", "rework_reason", "final_defects", "acceptance_failures"];
  if (!value || value.source !== "formal" || fields.some((field) => value[field] === undefined)) {
    return { status: "unknown", reason: "formal context observation is unavailable" };
  }
  return Object.fromEntries([
    ["status", "observed"],
    ...fields.map((field) => [field, value[field]]),
  ]);
}

/**
 * Compare explicit accepted design IDs with explicit current evidence.
 * A gap is advisory data for the verify handoff; this function never reruns or
 * judges a code review and never reads the repository to fill missing facts.
 */
export function alignCurrentEvidence({ acceptedDesign, currentEvidence } = {}) {
  const accepted = acceptedDesign && typeof acceptedDesign === "object" ? acceptedDesign : {};
  const current = currentEvidence && typeof currentEvidence === "object" ? currentEvidence : {};
  const alignmentId = text(accepted.alignment_id) ?? "FR-15";
  const acceptanceIds = Array.isArray(accepted.acceptance_criteria)
    ? accepted.acceptance_criteria.filter((id) => text(id))
    : [];
  const designIds = new Set(Array.isArray(accepted.design_ids) ? accepted.design_ids.filter((id) => text(id)) : []);
  const tree = text(current.snapshot_tree);
  const gaps = [];

  if (!tree || !SNAPSHOT.test(tree)) {
    gaps.push(gap(alignmentId, "missing_current_snapshot", [], "capture the current verification snapshot before alignment"));
  }

  const coverage = current.acceptance_coverage;
  const coverageItems = Array.isArray(coverage?.items) ? coverage.items : [];
  const coverageById = new Map();
  if (!coverage || coverage.snapshot_tree !== tree) {
    gaps.push(gap(alignmentId, "stale_acceptance_coverage", refs([coverage?.ref]), "publish acceptance coverage bound to the current verification snapshot"));
  }
  for (const item of coverageItems) {
    const id = text(item?.acceptance_criterion_id) ?? alignmentId;
    if (coverageById.has(id)) {
      gaps.push(gap(id, "duplicate_acceptance_coverage", refs(item?.evidence_refs), "keep exactly one current coverage row for this accepted AC"));
      continue;
    }
    coverageById.set(id, item);
  }
  for (const id of acceptanceIds) {
    const item = coverageById.get(id);
    if (!item) {
      gaps.push(gap(id, "missing_acceptance_coverage", [], "publish one current covered, missing, or unknown row for this AC"));
      continue;
    }
    if (item.status === "unknown") {
      gaps.push(gap(id, "unknown_current_evidence", refs(item.evidence_refs), "replace unknown evidence with a current AC result or return the affected build task"));
    } else if (item.status !== "covered" || refs(item.evidence_refs).length === 0) {
      gaps.push(gap(id, "missing_acceptance_coverage", refs(item.evidence_refs), "publish current evidence for this accepted AC"));
    }
  }
  for (const id of coverageById.keys()) {
    if (!acceptanceIds.includes(id)) {
      gaps.push(gap(id, "unexpected_acceptance_coverage", refs(coverageById.get(id)?.evidence_refs), "remove the unrelated AC row from this alignment input"));
    }
  }

  for (const [label, value] of [
    ["phase", current.phase_evidence],
    ["test", current.test_evidence],
    ["review", current.review_evidence],
  ]) {
    const evidenceGap = currentEvidenceGap(alignmentId, label, value, tree);
    if (evidenceGap) gaps.push(evidenceGap);
  }

  for (const deviation of Array.isArray(current.deviations) ? current.deviations : []) {
    const designId = text(deviation?.design_id) ?? alignmentId;
    const evidenceRefs = refs(deviation?.evidence_refs);
    if (!designIds.has(designId)) {
      gaps.push(gap(designId, "unknown_design_id", evidenceRefs, "bind the deviation to an accepted design ID before verify reporting"));
    } else if (deviation.authorized !== true) {
      gaps.push(gap(designId, "unauthorized_design_deviation", evidenceRefs, "repair the implementation or record an authorized deviation through the existing human boundary"));
    }
  }

  return {
    status: gaps.length ? "gaps" : "aligned",
    affected_ids: unique(gaps.map(({ affected_id }) => affected_id)),
    gaps,
    recovery_conditions: unique(gaps.map(({ recovery }) => recovery)),
    observation: contextObservation(current.context_observation),
  };
}

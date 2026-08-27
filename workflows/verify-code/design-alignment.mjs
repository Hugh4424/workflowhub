const ARTIFACT_KINDS = new Set(["spec", "plan", "tasks", "evidence", "code"]);
const HASH = /^[a-f0-9]{64}$/;
const SNAPSHOT = /^[a-f0-9]{40,64}$/;
import { buildConsumerCensus, validateProjectStandardSources } from "../../runtime/stage/stage-content-contracts.mjs";

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

const UI_DESIGN_STATUSES = new Set(["ready", "approved", "not_ready", "unknown", "unavailable"]);
const UI_COMPONENT_ACTIONS = new Set([
  "reuse",
  "modify",
  "extend-state-or-variant",
  "add-local",
  "extract-shared",
  "remove-after-no-consumers",
]);

function uiConsumers(entry) {
  if (Array.isArray(entry?.real_consumers)) return entry.real_consumers;
  if (entry?.real_consumer !== undefined) return [entry.real_consumer];
  return [];
}

function uiFact(value) {
  if (text(value)) return !/^(?:unknown|unavailable|n\/a|na)$/i.test(value.trim());
  return Boolean(value && typeof value === "object" && !Array.isArray(value)
    && (text(value.value) || text(value.ref) || text(value.path) || text(value.reason)));
}

function resolvedConsumer(value) {
  return text(value) && !/^(?:unknown|unavailable|n\/a|na)$/i.test(value.trim());
}

function unresolvedConsumer(value) {
  return Boolean((value && typeof value === "object" && !Array.isArray(value)
    && /^(?:unknown|unavailable|not_applicable|n\/a|na)$/i.test(String(value.status ?? ""))
    && text(value.reason)));
}

function comparableSourceIdentity(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return Object.fromEntries(["document_kind", "path", "content_sha256", "revision", "anchor_id"].map((key) => [key, value[key]]));
}

function sameSourceIdentity(left, right) {
  const a = comparableSourceIdentity(left);
  const b = comparableSourceIdentity(right);
  return Boolean(a && b && Object.keys(a).every((key) => a[key] === b[key]));
}

function alignProjectSourcesAndCensus({
  projectStandardSources,
  project_standard_sources,
  consumerCensus,
  consumer_census,
  requireCurrent = false,
  expectedSnapshotTree = null,
  expectedDesignIdentity = null,
  expectedExperienceIdentity = null,
} = {}, gaps) {
  const sources = projectStandardSources ?? project_standard_sources;
  if (sources === undefined) {
    if (requireCurrent) gaps.push(gap("UI-SOURCES", "project_standard_sources_missing", [], "bind the current Design.md and Experience.md identities before claiming UI alignment"));
  } else {
    const checked = validateProjectStandardSources({ ...sources, require_current_binding: requireCurrent });
    if (!checked.ok) {
      for (const error of checked.errors) {
        gaps.push(gap("UI-SOURCES", "project_standard_source_invalid", [], `repair Design.md/Experience.md identity contract: ${error}`));
      }
    } else if (["stale", "missing", "unknown", "not_ready"].includes(checked.status)) {
      gaps.push(gap("UI-SOURCES", `project_standard_source_${checked.status}`, [], "refresh the bound Design.md and Experience.md identities before claiming alignment"));
    } else {
      if (expectedDesignIdentity && !sameSourceIdentity(checked.identities?.design, expectedDesignIdentity)) {
        gaps.push(gap("UI-SOURCES", "design_identity_mismatch", [], "bind Design.md to the current path, content hash, revision, and explicit anchor"));
      }
      if (expectedExperienceIdentity && !sameSourceIdentity(checked.identities?.experience, expectedExperienceIdentity)) {
        gaps.push(gap("UI-SOURCES", "experience_identity_mismatch", [], "bind Experience.md to the current path, content hash, revision, and explicit anchor"));
      }
    }
  }
  const censusInput = consumerCensus ?? consumer_census;
  if (censusInput === undefined) {
    if (requireCurrent) gaps.push(gap("UI-CONSUMER-CENSUS", "consumer_census_missing", [], "publish a current deterministic consumer census before claiming UI alignment"));
  } else {
    const checked = buildConsumerCensus(censusInput);
    if (!checked.ok) {
      for (const error of checked.errors) {
        gaps.push(gap("UI-CONSUMER-CENSUS", "consumer_census_invalid", [], `repair consumer-census.v1: ${error}`));
      }
    } else if (checked.unknown_count > 0) {
      gaps.push(gap("UI-CONSUMER-CENSUS", "consumer_census_unknown", [], "resolve or preserve each unsupported/unknown consumer reason before claiming complete alignment"));
    } else if (expectedSnapshotTree && checked.source_snapshot?.tree !== expectedSnapshotTree) {
      gaps.push(gap("UI-CONSUMER-CENSUS", "consumer_census_stale_snapshot", [], "re-run the consumer census against the current implementation snapshot"));
    }
  }
}

/**
 * Align the UI Contract and Component Quality Map with observed consumers.
 * Design gaps and missing quality facts are reportable unknowns/gaps; this
 * projection never creates a UI gate or a sixth stage.
 */
export function alignUiDesignEvidence({
  uiContract,
  ui_contract,
  componentQualityMap,
  component_quality_map,
  consumerFacts,
  consumer_facts,
  projectStandardSources,
  project_standard_sources,
  consumerCensus,
  consumer_census,
  currentSnapshotTree,
  current_snapshot_tree,
} = {}) {
  const contract = uiContract ?? ui_contract;
  const map = componentQualityMap ?? component_quality_map;
  const observedConsumers = consumerFacts ?? consumer_facts;
  const gaps = [];
  const designStatus = text(contract?.design_status) ?? "unknown";

  if (!contract || typeof contract !== "object" || Array.isArray(contract)) {
    gaps.push(gap("UI-CONTRACT", "design_gap_unknown", [], "publish the current UI Contract or record N/A for a non-UI task"));
  } else {
    if (!UI_DESIGN_STATUSES.has(designStatus)) {
      gaps.push(gap("UI-CONTRACT", "design_status_unknown", refs([contract.current_material_ref]), "record a recognized design_status and keep the missing reason"));
    }
    const missingItems = Array.isArray(contract.missing_items) ? contract.missing_items : [];
    if (["not_ready", "unknown", "unavailable"].includes(designStatus) || missingItems.length > 0) {
      gaps.push(gap("UI-CONTRACT", "design_gap_unknown", refs([contract.current_material_ref, ...missingItems.flatMap((item) => item?.evidence_refs ?? [])]), "keep the design gap, handoff, and rework risk visible while continuing the same task"));
    }
  }

  const entries = Array.isArray(map) ? map : map?.entries;
  if (entries !== undefined && !Array.isArray(entries)) {
    gaps.push(gap("UI-COMPONENT-QUALITY", "component_quality_map_unknown", [], "publish a Component Quality Map or record N/A for a non-UI task"));
  }
  const facts = Array.isArray(observedConsumers) ? observedConsumers : [];
  const explicitlyNonUi = contract?.ui_applicability === "not_applicable"
    || contract?.applicability === "not_applicable"
    || contract?.impact === "non_ui";
  const requiresCurrentUiFacts = !explicitlyNonUi && (
    contract?.ui_applicability === "ui"
    || contract?.impact === "ui"
    || contract?.impact === "fullstack"
    || contract?.ui_required === true
    || contract?.design_status !== undefined
    || entries !== undefined
    || projectStandardSources !== undefined
    || project_standard_sources !== undefined
    || consumerCensus !== undefined
    || consumer_census !== undefined
  );
  const expectedSnapshotTree = text(currentSnapshotTree)
    ?? text(current_snapshot_tree)
    ?? text(contract?.current_snapshot_tree)
    ?? text(contract?.snapshot_tree)
    ?? null;
  alignProjectSourcesAndCensus({
    projectStandardSources,
    project_standard_sources,
    consumerCensus,
    consumer_census,
    requireCurrent: requiresCurrentUiFacts,
    expectedSnapshotTree,
    expectedDesignIdentity: contract?.design_identity ?? contract?.ui_contract?.design_identity,
    expectedExperienceIdentity: contract?.experience_identity ?? contract?.ui_contract?.experience_identity,
  }, gaps);
  for (const [index, entry] of (Array.isArray(entries) ? entries : []).entries()) {
    const id = text(entry?.id) ?? `UI-COMPONENT-${index + 1}`;
    const consumers = uiConsumers(entry);
    const resolvedConsumers = consumers.filter(resolvedConsumer);
    const unknownConsumers = consumers.filter(unresolvedConsumer);
    const malformedConsumers = consumers.filter((value) => !resolvedConsumer(value) && !unresolvedConsumer(value));
    if (malformedConsumers.length > 0) {
      gaps.push(gap(id, "component_quality_consumer_invalid", refs(entry?.evidence_refs), "remove malformed consumer entries and retain a resolved or reasoned unknown fact"));
    }
    if (!UI_COMPONENT_ACTIONS.has(entry?.action)) {
      gaps.push(gap(id, "component_quality_action_unknown", refs(entry?.evidence_refs), "record one supported Component Quality Map action"));
    }
    if (entry?.action === "extract-shared" && resolvedConsumers.length < 2 && unknownConsumers.length === 0) {
      gaps.push(gap(id, "component_quality_consumer_missing", refs(entry?.evidence_refs), "bind extract-shared to at least two real consumers"));
    }
    if (entry?.action === "extract-shared" && resolvedConsumers.length < 2 && unknownConsumers.length > 0) {
      gaps.push(gap(id, "component_quality_consumer_unknown", refs(entry?.evidence_refs), "resolve the unknown consumer fact before claiming two extract-shared consumers"));
    }
    if (entry?.action !== "remove-after-no-consumers" && resolvedConsumers.length === 0 && unknownConsumers.length === 0) {
      gaps.push(gap(id, "component_quality_consumer_missing", refs(entry?.evidence_refs), "bind the component action to a real consumer or narrow the action"));
    }
    if (entry?.action !== "remove-after-no-consumers" && resolvedConsumers.length === 0 && unknownConsumers.length > 0) {
      gaps.push(gap(id, "component_quality_consumer_unknown", refs(entry?.evidence_refs), "resolve the unknown consumer fact while keeping the same-task risk visible"));
    }
    if (entry?.action === "remove-after-no-consumers" && resolvedConsumers.length > 0) {
      gaps.push(gap(id, "component_quality_consumer_present", refs(entry?.evidence_refs), "retain the component while a current consumer remains"));
    }
    if (entry?.action === "remove-after-no-consumers" && unknownConsumers.length > 0) {
      gaps.push(gap(id, "component_quality_consumer_unknown", refs(entry?.evidence_refs), "resolve unknown consumers before claiming removal; keep no-consumer evidence visible"));
    }
    if (["state_owner", "typed_view_model", "css_token_owner"].some((field) => !uiFact(entry?.[field]))) {
      gaps.push(gap(id, "component_quality_owner_missing", refs(entry?.evidence_refs), "record state_owner, typed_view_model, and css_token_owner or an explicit unknown/N/A reason"));
    }
    if (["modify", "extend-state-or-variant", "add-local", "extract-shared"].includes(entry?.action)
      && !uiFact(entry?.story_or_test_update)) {
      gaps.push(gap(id, "component_quality_story_test_missing", refs(entry?.evidence_refs), "record the Story/test update or an explicit unknown/N/A reason"));
    }
    for (const consumer of resolvedConsumers) {
      const fact = facts.find((candidate) => text(candidate?.component) === text(entry?.component));
      const known = fact && (Array.isArray(fact.consumers) ? fact.consumers : [fact.consumer]).includes(consumer);
      if (!known) gaps.push(gap(id, "component_quality_consumer_unobserved", refs(entry?.evidence_refs), "bind each planned consumer to a current consumer fact"));
    }
  }

  const designUnknown = gaps.some((entry) => entry.reason === "design_gap_unknown"
    || entry.reason === "design_status_unknown"
    || entry.reason.startsWith("project_standard_source_")
    || entry.reason === "consumer_census_unknown");
  return {
    status: designUnknown ? "unknown" : gaps.length ? "gaps" : "aligned",
    design_status: designStatus,
    gate: false,
    continuation_allowed: true,
    affected_ids: unique(gaps.map(({ affected_id }) => affected_id)),
    gaps,
    recovery_conditions: unique(gaps.map(({ recovery }) => recovery)),
  };
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

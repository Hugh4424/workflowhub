import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { ArtifactDir, assertArtifactDir } from "../../core/artifact-dir.mjs";

const OID = /^[a-f0-9]{40,64}$/;
const HASH = /^[a-f0-9]{64}$/;
const MATERIAL_NAMES = Object.freeze(["decision-log.md", "spec.md", "plan.md", "tasks.md"]);

function incomplete(message) {
  const error = new Error(`MATERIAL_INCOMPLETE: ${message}`);
  error.code = "MATERIAL_INCOMPLETE";
  throw error;
}
const sha256 = (raw) => createHash("sha256").update(raw).digest("hex");

function historicalLegacyDisposition(sourceRoot) {
  const ref = "evidence/phase-9/final-user-confirmation.json";
  const path = `${sourceRoot}/${ref}`;
  if (!existsSync(path)) return undefined;
  const raw = readFileSync(path);
  const value = parseJson(raw, "legacy disposition");
  if (value?.task_id !== "workflowhub-complexity-governance-v2" || value.confirmed !== true
      || value.deletion_scope?.legacy_disposition_status !== "106-items-user-confirmed-before-scaffolding-removal") {
    incomplete("legacy disposition is not an authenticated user-confirmed record");
  }
  return Object.freeze({
    status: "verified_user_disposition",
    ref,
    sha256: sha256(raw),
    scope: "legacy_task_disposition_and_scaffolding_removal",
    note: "The user-confirmed disposition is retained as immutable evidence; it does not claim the deleted one-time fixture execution can be replayed.",
  });
}

function parseJson(raw, label) {
  try { return JSON.parse(raw); } catch { incomplete(`${label} is not JSON`); }
}
function parseJsonOrText(raw) {
  try { return JSON.parse(raw); } catch { return raw; }
}
function requiredTask(task) {
  if (!task || typeof task !== "object" || typeof task.readRecord !== "function" || typeof task.identity?.taskId !== "string" || task.identity.taskId === "") {
    throw new TypeError("task with identity.taskId and readRecord is required");
  }
  return task;
}
function git(root, args, label) {
  try { return execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim(); }
  catch { incomplete(`${label} is unavailable from Git`); }
}

/** Current material revision is the only design authority. */
function currentMaterials(_task, artifacts) {
  const safeArtifacts = assertArtifactDir(artifacts);
  const texts = {};
  for (const name of MATERIAL_NAMES) {
    let raw;
    try { raw = safeArtifacts.read(name, "utf8"); } catch { incomplete(`current material is missing: ${name}`); }
    texts[name] = raw;
  }
  const materialDigest = sha256(JSON.stringify(MATERIAL_NAMES.map((name) => [name, texts[name]])));
  return Object.freeze({
    ref: "current-four-materials",
    sha256: materialDigest,
    material_digest: materialDigest,
    texts: Object.freeze(texts),
    spec_ref: safeArtifacts.reference("spec.md"),
    tasks_ref: safeArtifacts.reference("tasks.md"),
  });
}

function binding(task, item, label) {
  if (!item || typeof item.ref !== "string" || !HASH.test(item.sha256 ?? "")) incomplete(`${label} binding is invalid`);
  let raw;
  try { raw = task.readRecord(item.ref); } catch { incomplete(`${label} is missing: ${item.ref}`); }
  if (sha256(raw) !== item.sha256) incomplete(`${label} hash mismatch: ${item.ref}`);
  return Object.freeze({ ref: item.ref, sha256: item.sha256, value: parseJsonOrText(raw) });
}

function ids(text) { return [...new Set((text.match(/\bAC-\d+\b/g) ?? []))]; }
function lineFor(text, token) {
  const line = text.split("\n").findIndex((value) => value.includes(token));
  return line < 0 ? 1 : line + 1;
}
function acceptanceLineFor(text, acceptanceId) {
  const escaped = acceptanceId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const matcher = new RegExp(`^\\s*-\\s*\\[[ xX]\\]\\s*\\*\\*${escaped}\\*\\*\\b`, "m");
  const match = matcher.exec(text);
  if (match) return text.slice(0, match.index).split("\n").length;
  return lineFor(text, acceptanceId);
}
function completedTasks(task, taskText) {
  const output = [];
  const matcher = /^####\s+(T\d+)\b[^\n]*\n([\s\S]*?)(?=^####\s+T\d+\b|(?![\s\S]))/gm;
  const jsonField = (body, name) => {
    const raw = new RegExp("\\*\\*" + name + "\\*\\*[：:]\\s*`([^`]+)`").exec(body)?.[1];
    if (raw === undefined) return undefined;
    try { return JSON.parse(raw); } catch { incomplete(`${name} is not valid JSON`); }
  };
  for (const found of taskText.matchAll(matcher)) {
    const [whole, taskId, body] = found;
    if (!/\[x\]\s+\*\*任务完成\*\*/.test(body) || !/\*\*status\*\*：`(?:completed|passed)`/.test(body)) continue;
    const acLine = /\*\*covered_ac\*\*：([^\n]+)/.exec(body)?.[1] ?? "";
    const acceptanceIds = ids(acLine);
    const evidenceRaw = /\*\*evidence_refs\*\*：`?([^\n`]+)`?/.exec(body)?.[1];
    if (acceptanceIds.length === 0 || !evidenceRaw) incomplete(`completed ${taskId} lacks covered_ac or evidence_refs`);
    const evidence = parseJson(evidenceRaw, `${taskId} evidence_refs`);
    if (!Array.isArray(evidence) || evidence.length === 0) incomplete(`completed ${taskId} evidence_refs are invalid`);
    const evidenceBindings = evidence.map((item) => ({
      ...binding(task, item, `${taskId} evidence`),
      ...(typeof item.kind === "string" && item.kind.trim() !== "" ? { kind: item.kind } : {}),
    }));
    const actualChanges = /\*\*actual_changes\*\*：([^\n]+)/.exec(body)?.[1]?.trim() ?? "completed task evidence";
    const phaseId = /\*\*phase_id\*\*[：:]\s*`([^`]+)`/.exec(body)?.[1] ?? taskId;
    // Anchor the actual completion marker, not the blank line after the task
    // heading. Provider-visible context must contain real text to be useful.
    const bodyOffset = found.index + whole.indexOf(body);
    const markerOffset = body.indexOf("[x]");
    const line = taskText.slice(0, bodyOffset + (markerOffset >= 0 ? markerOffset : 0)).split("\n").length;
    output.push(Object.freeze({
      task_id: taskId,
      phase_id: phaseId,
      acceptance_ids: acceptanceIds,
      evidence: evidenceBindings,
      review_fact: jsonField(body, "review_fact"),
      phase_map_trace: jsonField(body, "phase_map_trace"),
      green_test_receipt: jsonField(body, "green_test_receipt"),
      summary: actualChanges,
      line,
    }));
  }
  return output;
}

function currentBinding(tasks, finalTree, kind, taskHandle, currentRef) {
  const selected = [];
  for (const task of tasks) for (const item of task.evidence) {
    const value = item.value;
    const implementation = kind === "implementation" && (item.ref.startsWith("quality/evidence/implementation/") || item.ref === "quality/evidence/implementation.json");
    const green = kind === "green" && item.ref.startsWith("quality/tests/") && value.exit_code === 0;
    if ((implementation || green) && value?.snapshot_tree === finalTree) selected.push(item);
  }
  // The official build-code handler supplies the exact current receipt refs
  // through the capability boundary. Never discover task storage by path.
  if (typeof currentRef === "string" && currentRef !== "") {
    let raw;
    try { raw = taskHandle.readRecord(currentRef); } catch { raw = null; }
    if (raw !== null) {
      let value;
      try { value = JSON.parse(raw); } catch { value = null; }
      const validImplementation = kind === "implementation"
        && value?.stage === "build-code"
        && value?.producer?.component === "implementation";
      const validGreen = kind === "green"
        && value?.stage === "build-code"
        && value?.producer?.component === "build-code-test-capture"
        && value?.exit_code === 0;
      if ((validImplementation || validGreen) && value.snapshot_tree === finalTree) {
        selected.push({ ref: currentRef, sha256: sha256(raw), value });
      }
    }
  }
  if (selected.length === 0) incomplete(`current ${kind} receipt for final snapshot is missing`);
  // Retries may publish multiple valid receipts for the same immutable
  // snapshot. They are equivalent execution facts, not competing snapshots.
  // Choose deterministically so a retry cannot block integration; a receipt
  // from another snapshot was already filtered out above and still fails
  // closed as missing.
  const timestamp = (item) => item.value?.completed_at ?? item.value?.started_at ?? "";
  selected.sort((left, right) => {
    const byTime = timestamp(right).localeCompare(timestamp(left));
    return byTime !== 0 ? byTime : right.ref.localeCompare(left.ref);
  });
  const first = selected[0];
  return Object.freeze({ ref: first.ref, sha256: first.sha256, value: first.value });
}

function currentPhaseReview(task, finalTree, currentRef) {
  if (typeof currentRef !== "string" || currentRef === "") return null;
  let raw;
  try { raw = task.readRecord(currentRef); } catch { incomplete(`current Phase review is missing: ${currentRef}`); }
  const value = parseJson(raw, "current Phase review");
  const record = Object.freeze({ ref: currentRef, sha256: sha256(raw), value });
  if (value?.version !== "wh-review-result.v1" || value?.verdict !== "pass"
      || value?.subject_kind !== "phase" || value?.review_scope !== "phase"
      || value?.snapshot_tree !== finalTree) {
    incomplete("current Phase review is not a passing snapshot-bound fact");
  }
  return record;
}

function phaseCoverage({ task, finalTree, completed, implementation, green, phaseReview, baseCommit, baseTree }) {
  if (!Array.isArray(completed) || completed.length === 0) incomplete("current tasks.md has no completed Phase rows");
  const phaseRows = [];
  const seenPhaseIds = new Set();
  for (const item of completed) {
    if (seenPhaseIds.has(item.phase_id)) continue;
    seenPhaseIds.add(item.phase_id);
    phaseRows.push(item);
  }
  const phases = phaseRows.map((item) => {
    const review = phaseReview ?? binding(task, item.review_fact, `${item.task_id} review fact`);
    const phaseMap = {
      ref: implementation.value?.diff_ref,
      sha256: implementation.value?.diff_hash,
    };
    const phaseGreen = green;
    if (review.value?.version !== "wh-review-result.v1"
        || review.value?.verdict !== "pass"
        || review.value?.subject_kind !== "phase"
        || review.value?.review_scope !== "phase"
        || review.value?.phase_id !== item.phase_id
        || review.value?.snapshot_tree !== finalTree) {
      incomplete(`${item.task_id} review fact is not a passing current Phase result`);
    }
    if (typeof phaseMap.ref !== "string" || !HASH.test(phaseMap.sha256 ?? "")) {
      incomplete(`${item.task_id} phase map trace is not the current implementation diff`);
    }
    if (phaseGreen.ref !== green.ref || phaseGreen.sha256 !== green.sha256
        || phaseGreen.value?.snapshot_tree !== finalTree || phaseGreen.value?.exit_code !== 0) {
      incomplete(`${item.task_id} GREEN receipt is not the current passing test fact`);
    }
    return Object.freeze({
      phase_id: item.phase_id,
      snapshot_tree: finalTree,
      review_result: Object.freeze({ ref: review.ref, sha256: review.sha256, verdict: review.value.verdict }),
      phase_map_trace: Object.freeze({ ref: phaseMap.ref, sha256: phaseMap.sha256 }),
      green_test_receipt: Object.freeze({ ref: phaseGreen.ref, sha256: phaseGreen.sha256 }),
    });
  });
  return Object.freeze({
    schema_version: "phase-review-coverage.v1",
    status: "complete",
    snapshot_tree: finalTree,
    checkpoint: Object.freeze({ commit: baseCommit, tree: baseTree }),
    implementation_receipt: Object.freeze({ ref: implementation.ref, sha256: implementation.sha256 }),
    green_test_receipt: Object.freeze({ ref: green.ref, sha256: green.sha256 }),
    phases: Object.freeze(phases),
    completed_tasks: completedTaskSummaries(completed),
    continuity_model: Object.freeze({
      schema_version: "phase-continuity.v1",
      mode: "current-snapshot",
      exact_tree_equality: true,
      rationale: "Each completed Phase is bound to one passing review, one implementation diff, and one GREEN receipt on the final snapshot.",
      terminal_snapshot: finalTree,
    }),
  });
}

function completedTaskSummaries(tasks) {
  return Object.freeze((tasks ?? []).map(({ task_id, acceptance_ids, summary }) => Object.freeze({
    task_id,
    acceptance_ids: Object.freeze([...(acceptance_ids ?? [])]),
    summary,
  })));
}

/**
 * Historical Phase/checkpoint facts enrich an integration packet but are not
 * the current work contract.  A missing or stale historical chain must stay
 * visible to the reviewer without turning the packet into a material
 * blocker.  The current material revision plus same-snapshot implementation
 * and GREEN receipts remain the fail-closed inputs in buildIntegrationReviewSubject.
 */
function optionalHistoricalPhaseCoverage(args) {
  try {
    return { coverage: phaseCoverage(args), gaps: [] };
  } catch (error) {
    const reason = String(error?.message ?? error).replace(/^MATERIAL_INCOMPLETE:\s*/, "");
    return {
      coverage: Object.freeze({
        schema_version: "phase-review-coverage.v1",
        status: "unavailable",
        snapshot_tree: args.finalTree,
        checkpoint: null,
        implementation_receipt: args.implementation,
        green_test_receipt: args.green,
        completed_tasks: completedTaskSummaries(args.completed),
        phases: Object.freeze([]),
        continuity_model: Object.freeze({
          schema_version: "phase-continuity.v1",
          mode: "current-snapshot-only",
          exact_tree_equality: false,
          rationale: "Historical checkpoint/Phase lineage is audit context; current implementation and GREEN facts remain authoritative.",
          terminal_snapshot: args.finalTree,
        }),
      }),
      gaps: [Object.freeze({
        kind: "historical_phase_coverage",
        status: "unavailable",
        reason,
      })],
    };
  }
}

function seamIndex({ phases, finalTree }) {
  const entries = [];
  for (let index = 0; index < phases.length - 1; index += 1) {
    const left = phases[index];
    const right = phases[index + 1];
    entries.push(Object.freeze({
      seam_id: `${left.phase_id}->${right.phase_id}`,
      state: "unknown",
      status: "unknown",
      reason_code: "TRACE_HAS_PATHS_NOT_SEMANTIC_SEAMS",
      reason: "Canonical Phase traces prove paths and evidence bindings, but not producer/consumer, schema, shared state, error/cancel, or cross-Phase test semantics.",
      phase_ids: Object.freeze([left.phase_id, right.phase_id]),
      candidate_paths: Object.freeze([]),
      anchors: Object.freeze([]),
    }));
  }
  if (entries.length === 0) {
    entries.push(Object.freeze({
      seam_id: "historical-phase-chain",
      state: "unknown",
      status: "unknown",
      reason_code: "TRACE_HAS_PATHS_NOT_SEMANTIC_SEAMS",
      reason: "Historical Phase coverage is unavailable; no semantic cross-Phase seam is claimed.",
      phase_ids: Object.freeze([]),
      candidate_paths: Object.freeze([]),
      anchors: Object.freeze([]),
    }));
  }
  return Object.freeze({ schema_version: "cross-phase-seam-index.v1", snapshot_tree: finalTree, entries: Object.freeze(entries) });
}

function unavailable({ sourceRoot, task, finalTree, reason }) {
  let base_commit = null; let base_tree = null;
  try { base_commit = git(sourceRoot, ["rev-parse", "HEAD"], "current snapshot"); base_tree = git(sourceRoot, ["rev-parse", "HEAD^{tree}"], "current snapshot"); } catch { /* audit only */ }
  return Object.freeze({
    schema_version: "integration-review-subject.v1", subject_kind: "worktree", review_scope: "integration",
    base_commit, base_tree, snapshot_tree: finalTree,
    formal_record_status: Object.freeze({ status: "unavailable", reason }),
    phase_coverage: Object.freeze({ schema_version: "current-worktree-coverage.v1", snapshot_tree: finalTree, completed_tasks: Object.freeze([]) }),
    seam_index: Object.freeze({ schema_version: "current-worktree-seam-index.v1", snapshot_tree: finalTree, entries: Object.freeze([]) }),
    ac_trace: Object.freeze({ schema_version: "ac-change-test-trace.v1", snapshot_tree: finalTree, acceptance_ids: Object.freeze([]), entries: Object.freeze([]) }),
  });
}

/**
 * Final integration is grounded in the current material revision and
 * same-snapshot implementation/GREEN receipts.  Accepted checkpoints,
 * canonical Phase traces, and completed Task rows enrich the packet when
 * available, but remain historical audit context rather than work permits or
 * prerequisites for constructing the current subject.
 */
export function buildIntegrationReviewSubject({ task, sourceRoot, artifacts, finalTree, current_receipts = {} } = {}) {
  const safeTask = requiredTask(task);
  if (typeof sourceRoot !== "string" || sourceRoot === "") throw new TypeError("sourceRoot is required");
  if (!OID.test(finalTree ?? "")) throw new TypeError("finalTree is invalid");
  const materials = currentMaterials(safeTask, artifacts);
  const base_commit = git(sourceRoot, ["rev-parse", "HEAD"], "current snapshot");
  const base_tree = git(sourceRoot, ["rev-parse", "HEAD^{tree}"], "current snapshot");
  const acceptanceIds = ids(materials.texts["spec.md"]);
  if (acceptanceIds.length === 0) incomplete("current spec declares no acceptance criteria");
  const tasks = completedTasks(safeTask, materials.texts["tasks.md"]);
  const covered = new Map();
  for (const item of tasks) for (const id of item.acceptance_ids) if (!covered.has(id)) covered.set(id, item);
  const implementation = currentBinding(tasks, finalTree, "implementation", safeTask, current_receipts.implementation_ref);
  const green = currentBinding(tasks, finalTree, "green", safeTask, current_receipts.green_ref);
  const phaseReview = currentPhaseReview(safeTask, finalTree, current_receipts.phase_review_ref);
  const historical = optionalHistoricalPhaseCoverage({
    task: safeTask,
    sourceRoot,
    finalTree,
    completed: tasks,
    implementation,
    green,
    phaseReview,
    baseCommit: base_commit,
    baseTree: base_tree,
  });
  const auditGaps = [...historical.gaps];
  if (tasks.length === 0) {
    auditGaps.push(Object.freeze({
      kind: "task_completion_history",
      status: "incomplete",
      reason: "current tasks.md has no completed Task rows; AC evidence is bound directly to the current implementation and GREEN receipts",
    }));
  } else {
    const uncovered = acceptanceIds.filter((id) => !covered.has(id));
    if (uncovered.length) {
      auditGaps.push(Object.freeze({
        kind: "task_completion_history",
        status: "incomplete",
        reason: `current tasks.md has no completed Task row for ${uncovered.join(", ")}; AC evidence is bound directly to the current implementation and GREEN receipts`,
      }));
    }
  }
  let legacyDisposition;
  try {
    legacyDisposition = historicalLegacyDisposition(sourceRoot);
  } catch (error) {
    auditGaps.push(Object.freeze({
      kind: "historical_legacy_disposition",
      status: "unavailable",
      reason: String(error?.message ?? error).replace(/^MATERIAL_INCOMPLETE:\s*/, ""),
    }));
  }
  const coverage = historical.coverage;
  const entries = acceptanceIds.map((id) => {
    const item = covered.get(id);
    const taskEvidence = item?.evidence?.map(({ ref, sha256, kind }) => ({
      ref,
      sha256,
      ...(kind ? { kind } : {}),
    })) ?? [];
    return Object.freeze({
      acceptance_criterion_id: id,
      change: Object.freeze(item
        ? [{ task_id: item.task_id, summary: item.summary, evidence_refs: Object.freeze(taskEvidence) }]
        : [{ task_id: null, summary: "current implementation receipt and GREEN receipt" }]),
      test: Object.freeze([{ receipt_ref: green.ref, receipt_hash: green.sha256 }]),
      evidence: Object.freeze([{ ref: implementation.ref, sha256: implementation.sha256 }]),
      anchors: Object.freeze(item
        ? [{ id: `${item.task_id}:${id}`, path: materials.tasks_ref, start_line: item.line, end_line: item.line, role: "completion", reason: "current task completion evidence" }]
        : [{ id: `current-spec:${id}`, path: materials.spec_ref, start_line: acceptanceLineFor(materials.texts["spec.md"], id), end_line: acceptanceLineFor(materials.texts["spec.md"], id), role: "acceptance", reason: "current specification acceptance criterion" }]),
      ...(id === "AC-08" ? {
        evidence_status: "historical_non_replayable",
        evidence_note: "Immutable user-confirmed legacy import disposition is retained; the one-time pre-deletion fixture execution was not retained and is disclosed rather than replayed or represented as a fresh test.",
        ...(legacyDisposition ? { disposition: legacyDisposition } : {}),
      } : {}),
    });
  });
  const coverageWithGaps = Object.freeze({
    ...coverage,
    ...(auditGaps.length ? { audit_gaps: Object.freeze(auditGaps) } : {}),
  });
  return Object.freeze({
    schema_version: "integration-review-subject.v1", subject_kind: "worktree", review_scope: "integration",
    base_commit, base_tree, snapshot_tree: finalTree, material_revision: { ref: materials.ref, sha256: materials.sha256 },
    formal_record_status: Object.freeze(auditGaps.length
      ? { status: "unavailable", reason: auditGaps.map(({ reason }) => reason).join("; ") }
      : { status: "available", reason: "current materials and same-snapshot implementation/GREEN evidence are complete" }),
    audit_gaps: Object.freeze(auditGaps),
    phase_coverage: coverageWithGaps,
    seam_index: seamIndex({ phases: coverageWithGaps.phases, finalTree }),
    ac_trace: Object.freeze({ schema_version: "ac-change-test-trace.v1", snapshot_tree: finalTree, acceptance_ids: Object.freeze(acceptanceIds), entries: Object.freeze(entries) }),
  });
}

export function inspectIntegrationReviewSubject(options = {}) {
  try { return buildIntegrationReviewSubject(options); }
  catch (error) {
    if (error?.code !== "MATERIAL_INCOMPLETE") throw error;
    return unavailable({ sourceRoot: options.sourceRoot, task: options.task, finalTree: options.finalTree, reason: String(error.message).replace(/^MATERIAL_INCOMPLETE:\s*/, "") });
  }
}

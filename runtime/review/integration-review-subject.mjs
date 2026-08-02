import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { ArtifactDir, assertArtifactDir } from "../../core/artifact-dir.mjs";
import { readPhaseMapTrace } from "./phase-review-subject.mjs";

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
function currentMaterials(task, artifacts) {
  const safeArtifacts = assertArtifactDir(artifacts);
  let pointerRaw;
  try { pointerRaw = task.readRecord("materials/current.json"); } catch { incomplete("current material pointer is missing"); }
  const pointer = parseJson(pointerRaw, "current material pointer");
  if (pointer?.task_id !== task.identity.taskId || typeof pointer.revision_ref !== "string" || !HASH.test(pointer.revision_hash ?? "")) incomplete("current material pointer is invalid");
  let revisionRaw;
  try { revisionRaw = task.readRecord(pointer.revision_ref); } catch { incomplete("current material revision is missing"); }
  if (sha256(revisionRaw) !== pointer.revision_hash) incomplete("current material revision hash mismatch");
  const revision = parseJson(revisionRaw, "current material revision");
  if (revision?.task_id !== task.identity.taskId || !revision.hashes || typeof revision.hashes !== "object") incomplete("current material revision is invalid");
  const texts = {};
  for (const name of MATERIAL_NAMES) {
    let raw;
    try { raw = safeArtifacts.read(name, "utf8"); } catch { incomplete(`current material is missing: ${name}`); }
    const expected = revision.hashes[name] ?? revision.hashes[name.replace(".md", "").replace("-", "_")];
    if (!HASH.test(expected ?? "") || expected !== sha256(raw)) incomplete(`current material hash mismatch: ${name}`);
    texts[name] = raw;
  }
  return Object.freeze({
    ref: pointer.revision_ref,
    sha256: pointer.revision_hash,
    texts: Object.freeze(texts),
    tasks_ref: safeArtifacts.reference("tasks.md"),
  });
}

function binding(task, item, label) {
  if (!item || typeof item.ref !== "string" || !HASH.test(item.sha256 ?? "")) incomplete(`${label} binding is invalid`);
  let raw;
  try { raw = task.readRecord(item.ref); } catch { incomplete(`${label} is missing: ${item.ref}`); }
  if (sha256(raw) !== item.sha256) incomplete(`${label} hash mismatch: ${item.ref}`);
  return Object.freeze({ ref: item.ref, sha256: item.sha256, value: parseJson(raw, label) });
}

function ids(text) { return [...new Set((text.match(/\bAC-\d+\b/g) ?? []))]; }
function completedTasks(task, taskText) {
  const output = [];
  const matcher = /^####\s+(T\d+)\b[^\n]*\n([\s\S]*?)(?=^####\s+T\d+\b|(?![\s\S]))/gm;
  for (const found of taskText.matchAll(matcher)) {
    const [whole, taskId, body] = found;
    if (!/\[x\]\s+\*\*任务完成\*\*/.test(body) || !/\*\*status\*\*：`completed`/.test(body)) continue;
    const acLine = /\*\*covered_ac\*\*：([^\n]+)/.exec(body)?.[1] ?? "";
    const acceptanceIds = ids(acLine);
    const evidenceRaw = /\*\*evidence_refs\*\*：`?([^\n`]+)`?/.exec(body)?.[1];
    if (acceptanceIds.length === 0 || !evidenceRaw) incomplete(`completed ${taskId} lacks covered_ac or evidence_refs`);
    const evidence = parseJson(evidenceRaw, `${taskId} evidence_refs`);
    if (!Array.isArray(evidence) || evidence.length === 0) incomplete(`completed ${taskId} evidence_refs are invalid`);
    const evidenceBindings = evidence.map((item) => binding(task, item, `${taskId} evidence`));
    const actualChanges = /\*\*actual_changes\*\*：([^\n]+)/.exec(body)?.[1]?.trim() ?? "completed task evidence";
    // Anchor the actual completion marker, not the blank line after the task
    // heading. Provider-visible context must contain real text to be useful.
    const bodyOffset = found.index + whole.indexOf(body);
    const markerOffset = body.indexOf("[x]");
    const line = taskText.slice(0, bodyOffset + (markerOffset >= 0 ? markerOffset : 0)).split("\n").length;
    output.push(Object.freeze({ task_id: taskId, acceptance_ids: acceptanceIds, evidence: evidenceBindings, summary: actualChanges, line }));
  }
  return output;
}

function currentBinding(tasks, finalTree, kind, taskHandle, currentRef) {
  const selected = [];
  for (const task of tasks) for (const item of task.evidence) {
    const value = item.value;
    const implementation = kind === "implementation" && item.ref.startsWith("receipts/revisions/implementation/");
    const green = kind === "green" && item.ref.startsWith("receipts/build-tests") && value.exit_code === 0;
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
  return Object.freeze({ ref: first.ref, sha256: first.sha256 });
}

function checkpoint(task) {
  let raw;
  try { raw = task.readRecord("results/build-plan/accepted.json"); }
  catch { incomplete("accepted build-plan checkpoint is missing"); }
  const accepted = parseJson(raw, "accepted build-plan");
  const commit = accepted?.checkpoint?.commit_oid;
  const tree = accepted?.checkpoint?.tree_oid;
  if (!OID.test(commit ?? "") || !OID.test(tree ?? "")) incomplete("accepted build-plan checkpoint is invalid");
  return Object.freeze({ commit, tree });
}

function ancestor(root, older, newer, label) {
  try { execFileSync("git", ["merge-base", "--is-ancestor", older, newer], { cwd: root, stdio: "ignore" }); }
  catch { incomplete(`${label} is not a continuous Git ancestor`); }
}

function phaseCoverage({ task, sourceRoot, finalTree, completed, implementation, green }) {
  if (typeof task.listCanonicalPhaseTraceRefs !== "function") incomplete("canonical Phase trace enumeration is unavailable");
  let refs;
  try { refs = task.listCanonicalPhaseTraceRefs(); } catch { incomplete("canonical Phase trace enumeration failed"); }
  const semantic = [];
  for (const ref of refs) {
    const resolved = readPhaseMapTrace({ task, sourceRoot, traceRef: ref });
    if (resolved.trace.review_status !== "semantic") continue;
    if (resolved.trace.verdict !== "pass") incomplete(`Phase ${resolved.trace.phase_id} is not a final PASS`);
    if (!/^phase-\d+$/.test(resolved.trace.phase_id)) incomplete(`Phase trace id is invalid: ${resolved.trace.phase_id}`);
    semantic.push(resolved);
  }
  const byPhase = new Map();
  for (const resolved of semantic) {
    if (byPhase.has(resolved.trace.phase_id)) incomplete(`duplicate semantic Phase trace: ${resolved.trace.phase_id}`);
    byPhase.set(resolved.trace.phase_id, resolved);
  }
  const phaseNumbers = [...byPhase.keys()].map((id) => Number(id.slice("phase-".length))).sort((a, b) => a - b);
  if (phaseNumbers.length === 0 || phaseNumbers[0] !== 0 || phaseNumbers.some((n, index) => n !== index)) {
    incomplete("Phase PASS coverage is missing or has a gap");
  }
  const planCheckpoint = checkpoint(task);
  const currentHead = git(sourceRoot, ["rev-parse", "HEAD^{commit}"], "current snapshot");
  const phases = phaseNumbers.map((number) => byPhase.get(`phase-${number}`));
  let priorCommit = planCheckpoint.commit;
  for (const resolved of phases) {
    ancestor(sourceRoot, priorCommit, resolved.trace.baseline_commit, `${resolved.trace.phase_id} baseline`);
    ancestor(sourceRoot, resolved.trace.implementation_commit, currentHead, `${resolved.trace.phase_id} implementation`);
    priorCommit = resolved.trace.implementation_commit;
  }
  const phaseRows = phases.map((resolved) => Object.freeze({
    phase_id: resolved.trace.phase_id,
    baseline_commit: resolved.trace.baseline_commit,
    base_tree: resolved.trace.base_tree,
    snapshot_tree: resolved.trace.snapshot_tree,
    phase_map_trace: Object.freeze({ ref: resolved.traceRef, sha256: resolved.traceSha256 }),
    // Integration packets carry only hash-bound references and the verdict.
    // Raw Phase evidence/review attempts contain provider-private output_ref
    // fields and must remain in task storage, not cross the review boundary.
    review_result: resolved.review ? Object.freeze({ ref: resolved.review.ref, sha256: resolved.review.sha256, verdict: resolved.trace.verdict }) : null,
    green_test_receipt: Object.freeze({ ref: resolved.green.ref, sha256: resolved.green.sha256 }),
  }));
  return Object.freeze({
    schema_version: "phase-review-coverage.v1",
    checkpoint: Object.freeze({ commit: planCheckpoint.commit, tree: planCheckpoint.tree }),
    snapshot_tree: finalTree,
    implementation_receipt: implementation,
    green_test_receipt: green,
    completed_tasks: Object.freeze(completed.map(({ task_id, acceptance_ids, summary }) => Object.freeze({ task_id, acceptance_ids: Object.freeze(acceptance_ids), summary }))),
    continuity_model: Object.freeze({
      schema_version: "phase-continuity.v1",
      mode: "commit-ancestry-with-task-material-seams",
      exact_tree_equality: false,
      rationale: "Each Phase is independently authenticated; task-only material completion commits may occur between Phase snapshots. The final integration snapshot is authenticated separately by the current implementation and GREEN receipts.",
      terminal_snapshot: finalTree,
    }),
    phases: Object.freeze(phaseRows),
    excluded_phases: Object.freeze([{ phase_id: "phase-9", state: "not_applicable", reason_code: "FINAL_ACCEPTANCE_NOT_IMPLEMENTATION_PHASE", reason: "Phase 9 records final validation and user confirmation; implementation coverage ends at the last semantic build-code Phase." }]),
  });
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
        completed_tasks: Object.freeze(args.completed ?? []),
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
  const historical = optionalHistoricalPhaseCoverage({ task: safeTask, sourceRoot, finalTree, completed: tasks, implementation, green });
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
    return Object.freeze({
      acceptance_criterion_id: id,
      change: Object.freeze(item
        ? [{ task_id: item.task_id, summary: item.summary }]
        : [{ task_id: null, summary: "current implementation receipt and GREEN receipt" }]),
      test: Object.freeze([{ receipt_ref: green.ref, receipt_hash: green.sha256 }]),
      evidence: Object.freeze([{ ref: implementation.ref, sha256: implementation.sha256 }]),
      anchors: Object.freeze(item
        ? [{ id: `${item.task_id}:${id}`, path: materials.tasks_ref, start_line: item.line, end_line: item.line, role: "completion", reason: "current task completion evidence" }]
        : []),
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

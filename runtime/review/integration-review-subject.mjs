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
    throw new Error("legacy disposition is not an authenticated user-confirmed record");
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
  try { return JSON.parse(raw); } catch { throw new Error(`${label} is not JSON`); }
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
  catch (error) { throw new Error(`${label} failed: ${error?.stderr?.toString().trim() || error?.message || "Git command failed"}`); }
}

function finalSnapshotImplementationAnchors({ sourceRoot, baseTree, finalTree }) {
  const changed = git(sourceRoot, ["diff", "--name-only", baseTree, finalTree, "--", ".", ":(exclude)node_modules"], "final snapshot changed files")
    .split("\n")
    .map((path) => path.trim())
    .filter((path) => /^(?:runtime|skills|tools|workflows|tests)\//.test(path));
  const anchors = [];
  for (const path of changed) {
    const patch = git(sourceRoot, ["diff", "--unified=16", baseTree, finalTree, "--", path], `final snapshot diff for ${path}`);
    const current = git(sourceRoot, ["show", `${finalTree}:${path}`], `final snapshot file for ${path}`);
    const lineCount = current === "" ? 1 : current.split("\n").length;
    const ranges = [];
    const matcher = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/gm;
    for (const match of patch.matchAll(matcher)) {
      const start = Math.max(1, Number(match[1]) - 16);
      const changedCount = Number(match[2] ?? 1);
      const end = Math.min(lineCount, Math.max(start, Number(match[1]) + changedCount - 1 + 16));
      ranges.push({ start, end });
    }
    if (ranges.length === 0 && lineCount > 0) ranges.push({ start: 1, end: Math.min(lineCount, 160) });
    for (const [index, range] of ranges.entries()) {
      anchors.push(Object.freeze({
        id: `implementation-${path.replaceAll("/", "__")}-${index + 1}`,
        path,
        start_line: range.start,
        end_line: range.end,
        role: "implementation",
        reason: "current final-snapshot implementation excerpt selected from the changed source hunk",
      }));
    }
  }
  return Object.freeze(anchors);
}

/** Current material revision is the only design authority. */
function currentMaterials(_task, artifacts) {
  const safeArtifacts = assertArtifactDir(artifacts);
  const texts = {};
  for (const name of MATERIAL_NAMES) {
    let raw;
    try { raw = safeArtifacts.read(name, "utf8"); }
    catch (error) {
      if (error?.code === "ENOENT") incomplete(`current material is missing: ${name}`);
      throw error;
    }
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
  try { raw = task.readRecord(item.ref); }
  catch (error) {
    if (error?.code === "ENOENT") incomplete(`${label} is missing: ${item.ref}`);
    throw error;
  }
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
    try { return JSON.parse(raw); } catch { throw new Error(`${name} is not valid JSON`); }
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
    try { raw = taskHandle.readRecord(currentRef); }
    catch (error) {
      if (error?.code === "ENOENT") raw = null;
      else throw error;
    }
    if (raw !== null) {
      let value;
      try { value = JSON.parse(raw); } catch { throw new Error(`current ${kind} receipt is not JSON: ${currentRef}`); }
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
  try { raw = task.readRecord(currentRef); }
  catch (error) {
    if (error?.code === "ENOENT") incomplete(`current Phase review is missing: ${currentRef}`);
    throw error;
  }
  const value = parseJson(raw, "current Phase review");
  const record = Object.freeze({ ref: currentRef, sha256: sha256(raw), value });
  if (value?.version !== "wh-review-result.v1" || value?.verdict !== "pass"
      || value?.subject_kind !== "phase" || value?.review_scope !== "phase"
      || value?.snapshot_tree !== finalTree) {
    incomplete("current Phase review is not a passing snapshot-bound fact");
  }
  return record;
}

function phaseCoverage({ task, finalTree, completed, implementation, green, phaseReview, baseCommit, baseTree, implementationAnchors }) {
  if (!Array.isArray(completed) || completed.length === 0) incomplete("current tasks.md has no completed Phase rows");
  const phaseRows = [];
  const seenPhaseIds = new Set();
  for (const item of completed.filter((candidate) => candidate.review_fact || candidate.phase_map_trace || candidate.green_test_receipt)) {
    if (seenPhaseIds.has(item.phase_id)) continue;
    seenPhaseIds.add(item.phase_id);
    phaseRows.push(item);
  }
  if (phaseRows.length === 0) incomplete("current tasks.md has no declared Phase lineage bindings");
  const phases = [];
  const gaps = [];
  for (const item of phaseRows) {
    try {
      const review = item.review_fact
        ? binding(task, item.review_fact, `${item.task_id} review fact`)
        : phaseReview?.value?.phase_id === item.phase_id ? phaseReview : null;
      if (!review) incomplete(`${item.task_id} review fact is missing`);
      const phaseMap = binding(task, item.phase_map_trace, `${item.task_id} phase map trace`);
      const phaseGreen = binding(task, item.green_test_receipt, `${item.task_id} GREEN receipt`);
      const phaseSnapshot = review.value?.snapshot_tree;
      if (review.value?.version !== "wh-review-result.v1"
          || review.value?.verdict !== "pass"
          || review.value?.subject_kind !== "phase"
          || review.value?.review_scope !== "phase"
          || review.value?.phase_id !== item.phase_id
          || !OID.test(phaseSnapshot ?? "")) {
        incomplete(`${item.task_id} review fact is not a passing snapshot-bound Phase result`);
      }
      if (!phaseMap.value || typeof phaseMap.value !== "object" || Array.isArray(phaseMap.value)
          || (phaseMap.value.snapshot_tree !== undefined && phaseMap.value.snapshot_tree !== phaseSnapshot)) {
        incomplete(`${item.task_id} phase map trace is not bound to its Phase snapshot`);
      }
      if (phaseGreen.value?.snapshot_tree !== phaseSnapshot || phaseGreen.value?.exit_code !== 0) {
        incomplete(`${item.task_id} GREEN receipt is not the passing fact for its Phase snapshot`);
      }
      phases.push(Object.freeze({
        phase_id: item.phase_id,
        snapshot_tree: phaseSnapshot,
        review_result: Object.freeze({ ref: review.ref, sha256: review.sha256, verdict: review.value.verdict }),
        phase_map_trace: Object.freeze({ ref: phaseMap.ref, sha256: phaseMap.sha256 }),
        green_test_receipt: Object.freeze({ ref: phaseGreen.ref, sha256: phaseGreen.sha256 }),
      }));
    } catch (error) {
      if (error?.code !== "MATERIAL_INCOMPLETE") throw error;
      gaps.push(Object.freeze({
        kind: "historical_phase_row",
        status: "unavailable",
        phase_id: item.phase_id,
        reason: String(error.message).replace(/^MATERIAL_INCOMPLETE:\s*/, ""),
      }));
    }
  }
  if (phases.length === 0) incomplete(gaps.map(({ reason }) => reason).join("; ") || "no authenticated Phase lineage rows");
  return {
    coverage: Object.freeze({
    schema_version: "phase-review-coverage.v1",
    status: gaps.length > 0 ? "partial" : "complete",
    snapshot_tree: finalTree,
    checkpoint: Object.freeze({ commit: baseCommit, tree: baseTree }),
    implementation_receipt: Object.freeze({ ref: implementation.ref, sha256: implementation.sha256 }),
    green_test_receipt: Object.freeze({ ref: green.ref, sha256: green.sha256 }),
    implementation_anchors: Object.freeze(implementationAnchors),
    implementation_excerpt_status: implementationAnchors.length > 0 ? "complete" : "not_applicable",
    ...(implementationAnchors.length === 0 ? {
      implementation_excerpt_reason: "current final snapshot has no changed runtime/source file to excerpt",
    } : {}),
    phases: Object.freeze(phases),
    ...(gaps.length > 0 ? { audit_gaps: Object.freeze(gaps) } : {}),
    completed_tasks: completedTaskSummaries(completed),
    continuity_model: Object.freeze({
      schema_version: "phase-continuity.v1",
      mode: "per-phase-snapshot",
      exact_tree_equality: false,
      rationale: "Each completed Phase is bound to its own passing review, phase-map trace, and GREEN receipt; the final implementation and GREEN receipts are separately bound to the terminal snapshot.",
      terminal_snapshot: finalTree,
    }),
    }),
    gaps: Object.freeze(gaps),
  };
}

function completedTaskSummaries(tasks) {
  return Object.freeze((tasks ?? []).map(({ task_id, acceptance_ids, summary }) => Object.freeze({
    task_id,
    acceptance_ids: Object.freeze([...(acceptance_ids ?? [])]),
    summary,
  })));
}

function receiptBinding(receipt) {
  return Object.freeze({ ref: receipt.ref, sha256: receipt.sha256 });
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
    return phaseCoverage(args);
  } catch (error) {
    if (error?.code !== "MATERIAL_INCOMPLETE") throw error;
    const reason = String(error?.message ?? error).replace(/^MATERIAL_INCOMPLETE:\s*/, "");
    return {
      coverage: Object.freeze({
        schema_version: "phase-review-coverage.v1",
        status: "unavailable",
        snapshot_tree: args.finalTree,
        checkpoint: null,
        implementation_receipt: receiptBinding(args.implementation),
        green_test_receipt: receiptBinding(args.green),
        implementation_anchors: Object.freeze(args.implementationAnchors),
        implementation_excerpt_status: args.implementationAnchors.length > 0 ? "complete" : "not_applicable",
        ...(args.implementationAnchors.length === 0 ? {
          implementation_excerpt_reason: "current final snapshot has no changed runtime/source file to excerpt",
        } : {}),
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
  const base_commit = git(sourceRoot, ["rev-parse", "HEAD"], "current snapshot");
  const base_tree = git(sourceRoot, ["rev-parse", "HEAD^{tree}"], "current snapshot");
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
  for (const item of tasks) {
    for (const id of item.acceptance_ids) {
      if (!covered.has(id)) covered.set(id, []);
      covered.get(id).push(item);
    }
  }
  const implementation = currentBinding(tasks, finalTree, "implementation", safeTask, current_receipts.implementation_ref);
  const green = currentBinding(tasks, finalTree, "green", safeTask, current_receipts.green_ref);
  const implementationAnchors = finalSnapshotImplementationAnchors({ sourceRoot, baseTree: base_tree, finalTree });
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
    implementationAnchors,
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
    if (error?.code !== "MATERIAL_INCOMPLETE") throw error;
    auditGaps.push(Object.freeze({
      kind: "historical_legacy_disposition",
      status: "unavailable",
      reason: String(error?.message ?? error).replace(/^MATERIAL_INCOMPLETE:\s*/, ""),
    }));
  }
  const coverage = historical.coverage;
  const entries = acceptanceIds.map((id) => {
    const items = covered.get(id) ?? [];
    return Object.freeze({
      acceptance_criterion_id: id,
      change: Object.freeze(items.length
        ? items.map((item) => ({
          task_id: item.task_id,
          summary: item.summary,
          evidence_refs: Object.freeze(item.evidence.map(({ ref, sha256, kind }) => ({ ref, sha256, ...(kind ? { kind } : {}) }))),
        }))
        : [{ task_id: null, summary: "current implementation receipt and GREEN receipt" }]),
      test: Object.freeze([{ receipt_ref: green.ref, receipt_hash: green.sha256 }]),
      evidence: Object.freeze([{ ref: implementation.ref, sha256: implementation.sha256 }]),
      anchors: Object.freeze(items.length
        ? items.map((item) => ({ id: `${item.task_id}:${id}`, path: materials.tasks_ref, start_line: item.line, end_line: item.line, role: "completion", reason: "current task completion evidence" }))
        : [{ id: `current-spec:${id}`, path: materials.spec_ref, start_line: acceptanceLineFor(materials.texts["spec.md"], id), end_line: acceptanceLineFor(materials.texts["spec.md"], id), role: "acceptance", reason: "current specification acceptance criterion" }]),
      ...(id === "AC-008" ? {
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

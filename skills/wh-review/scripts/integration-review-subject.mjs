import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { assertTaskHandle } from "../../../core/task-handle.mjs";
import { validateSchema } from "./schema-validator.mjs";
import { readPhaseMapTrace } from "./phase-review-subject.mjs";

const OID = /^[a-f0-9]{40,64}$/;

function incomplete(message) {
  const error = new Error(`MATERIAL_INCOMPLETE: ${message}`);
  error.code = "MATERIAL_INCOMPLETE";
  throw error;
}

function readJson(task, ref, label) {
  let raw;
  try { raw = task.readRecord(ref); }
  catch { incomplete(`${label} is missing: ${ref}`); }
  try { return { raw, value: JSON.parse(raw), sha256: createHash("sha256").update(raw).digest("hex") }; }
  catch { incomplete(`${label} is not JSON: ${ref}`); }
}

function git(root, args, label) {
  try { return execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim(); }
  catch { incomplete(`${label} is unavailable from Git`); }
}

function checkpoint(task, sourceRoot) {
  const record = readJson(task, "results/build-plan/accepted.json", "accepted build-plan").value;
  const value = record?.stage === "build-plan" ? record.checkpoint : null;
  if (!value || typeof value !== "object" || !OID.test(value.commit_oid ?? "") || !OID.test(value.tree_oid ?? "")) {
    incomplete("accepted build-plan checkpoint is invalid");
  }
  const tree = git(sourceRoot, ["rev-parse", `${value.commit_oid}^{tree}`], "accepted build-plan checkpoint");
  if (tree !== value.tree_oid) incomplete("accepted build-plan checkpoint tree does not match its commit");
  return Object.freeze({ commit: value.commit_oid, tree: value.tree_oid, ref: value.ref ?? null });
}

function phaseTrace(task, sourceRoot, ref) {
  try { return readPhaseMapTrace({ task, sourceRoot, traceRef: ref }); }
  catch (error) { incomplete(`canonical Phase trace is invalid: ${ref}: ${error.message}`); }
}

function traceCoverage(trace) {
  const coverage = {
    phase_id: trace.trace.phase_id,
    baseline_commit: trace.trace.baseline_commit,
    implementation_commit: trace.trace.implementation_commit,
    base_tree: trace.trace.base_tree,
    snapshot_tree: trace.trace.snapshot_tree,
    trace_ref: trace.traceRef,
    trace_sha256: trace.traceSha256,
    canonical_phase_evidence: { ref: trace.trace.canonical_phase_evidence.ref, sha256: trace.trace.canonical_phase_evidence.sha256 },
    diff_scan: { ref: trace.trace.diff_scan.ref, sha256: trace.trace.diff_scan.sha256 },
    implementation_receipt: { ref: trace.trace.implementation_receipt.ref, sha256: trace.trace.implementation_receipt.sha256 },
    green_test_receipt: { ref: trace.trace.green_test_receipt.ref, sha256: trace.trace.green_test_receipt.sha256 },
    review_result: { ref: trace.trace.review_result.ref, sha256: trace.trace.review_result.sha256 },
    material_id: trace.trace.material_id,
    allowed_files: [...trace.trace.allowed_files],
    changed_files: [...trace.trace.changed_files],
  };
  // The accepted provider packet receives the final aggregated ac_trace, not
  // this Phase-local working fact.  Keep it non-enumerable so phase coverage
  // remains the small, public coverage record promised by the contract.
  Object.defineProperty(coverage, "acceptanceTrace", { value: trace.acceptanceTrace, enumerable: false });
  return Object.freeze(coverage);
}

function possiblePaths(traces, commit, tree, finalTree, seen = new Set()) {
  const key = `${commit}:${tree}`;
  if (seen.has(key)) return [];
  const nextSeen = new Set(seen); nextSeen.add(key);
  const paths = [];
  for (const trace of traces) {
    if (trace.trace.baseline_commit !== commit || trace.trace.base_tree !== tree || trace.trace.verdict !== "pass") continue;
    const coverage = traceCoverage(trace);
    if (coverage.snapshot_tree === finalTree) {
      paths.push([coverage]);
      continue;
    }
    for (const suffix of possiblePaths(traces, coverage.implementation_commit, coverage.snapshot_tree, finalTree, nextSeen)) {
      paths.push([coverage, ...suffix]);
    }
  }
  return paths;
}

function assertNoUntracedFormalPhase(task, coverage) {
  const coveredResults = new Set(coverage.map((phase) => phase.review_result.ref));
  const coveredTrees = new Set(coverage.flatMap((phase) => [phase.base_tree, phase.snapshot_tree]));
  for (const ref of task.listCanonicalReviewResultRefs()) {
    const record = readJson(task, ref, "formal review result").value;
    try { validateSchema("result", record); }
    catch { incomplete(`formal review result schema is invalid: ${ref}`); }
    if (record.stage !== "build-code" || record.subject_kind !== "phase" || record.review_scope !== "phase" || record.verdict !== "pass") continue;
    if (coveredResults.has(ref)) continue;
    if (coveredTrees.has(record.base_tree) || coveredTrees.has(record.candidate_tree)) {
      incomplete(`formal PASS Phase review has no phase-map trace: ${ref}`);
    }
  }
}

function seamIndex(coverage, finalTree) {
  const entries = [];
  for (let index = 1; index < coverage.length; index += 1) {
    const producer = coverage[index - 1];
    const consumer = coverage[index];
    const shared = producer.changed_files.filter((path) => consumer.changed_files.includes(path));
    entries.push({
      seam_id: `S-${producer.phase_id}-${consumer.phase_id}`,
      producer_phase_id: producer.phase_id,
      consumer_phase_id: consumer.phase_id,
      producer_changed_files: [...producer.changed_files],
      consumer_changed_files: [...consumer.changed_files],
      shared_paths: shared,
      disposition: "unknown",
      reason_code: "TRACE_HAS_PATHS_NOT_SEMANTIC_SEAMS",
      reason: "Canonical phase traces authenticate changed paths and evidence bindings, but do not contain a producer/consumer, schema, state, error/cancel, or cross-phase-test relation declaration.",
    });
  }
  return Object.freeze({ schema_version: "cross-phase-seam-index.v1", snapshot_tree: finalTree, entries: Object.freeze(entries) });
}

function acTrace(coverage, finalTree) {
  const acceptanceIds = [];
  const entries = new Map();
  for (const phase of coverage) {
    const phaseTrace = phase.acceptanceTrace;
    if (phaseTrace === null || phaseTrace === undefined) {
      incomplete(`canonical Phase trace has no AC change/test mapping: ${phase.trace_ref}`);
    }
    for (const acceptanceId of phaseTrace.acceptance_ids) {
      if (!entries.has(acceptanceId)) {
        acceptanceIds.push(acceptanceId);
        entries.set(acceptanceId, { acceptance_criterion_id: acceptanceId, change: [], test: [], evidence: [], anchors: [] });
      }
    }
    for (const entry of phaseTrace.entries) {
      const target = entries.get(entry.acceptance_criterion_id);
      target.change.push(...entry.change.map(({ change_id, path }) => ({ phase_id: phase.phase_id, change_id, path })));
      target.test.push(...entry.test.map(({ receipt_ref, receipt_hash }) => ({ phase_id: phase.phase_id, receipt_ref, receipt_hash })));
      target.evidence.push(
        { phase_id: phase.phase_id, ref: phase.canonical_phase_evidence.ref, sha256: phase.canonical_phase_evidence.sha256 },
        { phase_id: phase.phase_id, ref: phase.implementation_receipt.ref, sha256: phase.implementation_receipt.sha256 },
        { phase_id: phase.phase_id, ref: phase.review_result.ref, sha256: phase.review_result.sha256 },
      );
      target.anchors.push(...entry.anchors.map((anchor) => ({ ...anchor, id: `${phase.phase_id}:${anchor.id}` })));
    }
  }
  if (acceptanceIds.length === 0) incomplete("continuous PASS Phase coverage declares no AC mappings");
  for (const entry of entries.values()) {
    if (entry.change.length === 0 || entry.test.length === 0 || entry.evidence.length === 0 || entry.anchors.length === 0) {
      incomplete(`AC trace is incomplete for ${entry.acceptance_criterion_id}`);
    }
  }
  return Object.freeze({
    schema_version: "ac-change-test-trace.v1", snapshot_tree: finalTree,
    acceptance_ids: Object.freeze(acceptanceIds), entries: Object.freeze([...entries.values()].map((entry) => Object.freeze({
      ...entry, change: Object.freeze(entry.change), test: Object.freeze(entry.test), evidence: Object.freeze(entry.evidence), anchors: Object.freeze(entry.anchors),
    }))),
  });
}

/**
 * Reconstruct the only admissible final integration subject from canonical,
 * append-only Phase traces. It has no legacy pointer fallback and no diff.
 */
export function buildIntegrationReviewSubject({ task, sourceRoot, finalTree } = {}) {
  const safeTask = assertTaskHandle(task);
  if (typeof sourceRoot !== "string" || sourceRoot.length === 0) throw new TypeError("sourceRoot is required");
  if (!OID.test(finalTree ?? "")) throw new TypeError("finalTree is invalid");
  const accepted = checkpoint(safeTask, sourceRoot);
  const traces = safeTask.listCanonicalPhaseMapTraceRefs().map((ref) => phaseTrace(safeTask, sourceRoot, ref));
  if (traces.length === 0) incomplete("implementation work requires at least one canonical Phase map trace");
  const paths = possiblePaths(traces, accepted.commit, accepted.tree, finalTree);
  if (paths.length === 0) incomplete("no continuous PASS Phase coverage chain reaches the final tree");
  if (paths.length !== 1) incomplete(`Phase coverage is ambiguous: ${paths.length} continuous PASS chains reach the final tree`);
  const coverage = paths[0];
  if (coverage.length === 0) incomplete("zero-Phase coverage is not permitted");
  assertNoUntracedFormalPhase(safeTask, coverage);
  return Object.freeze({
    schema_version: "integration-review-subject.v1",
    subject_kind: "worktree",
    review_scope: "integration",
    base_commit: accepted.commit,
    base_tree: accepted.tree,
    snapshot_tree: finalTree,
    phase_coverage: Object.freeze({
      schema_version: "phase-review-coverage.v1",
      checkpoint: { commit: accepted.commit, tree: accepted.tree, ref: accepted.ref },
      snapshot_tree: finalTree,
      phases: Object.freeze(coverage),
    }),
    seam_index: seamIndex(coverage, finalTree),
    ac_trace: acTrace(coverage, finalTree),
  });
}

import { execFileSync } from "node:child_process";
import { assertTaskHandle } from "../../../core/task-handle.mjs";

function invalid(message) {
  const error = new Error(`PHASE_EVIDENCE_INVALID: ${message}`);
  error.code = "PHASE_EVIDENCE_INVALID";
  throw error;
}

function git(root, args) {
  try { return execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim(); }
  catch { invalid(`Git object is unavailable: ${args.at(-1)}`); }
}

function isAncestor(root, baseline, implementation) {
  try { execFileSync("git", ["merge-base", "--is-ancestor", baseline, implementation], { cwd: root }); return true; }
  catch (error) {
    if (error.status === 1) return false;
    invalid("phase commit ancestry is unavailable");
  }
}

function readJson(task, ref, label) {
  try { return JSON.parse(task.readRecord(ref)); }
  catch { invalid(`${label} is missing or invalid: ${ref}`); }
}

export function resolvePhaseReviewSubject({ task, sourceRoot, phaseId } = {}) {
  const safeTask = assertTaskHandle(task);
  if (typeof phaseId !== "string" || !/^[a-zA-Z0-9._-]+$/.test(phaseId)) invalid("phase_id is required");
  const phaseResult = readJson(safeTask, "phase-result.json", "phase result");
  if (phaseResult.phase_id !== phaseId) invalid("phase-result.json does not match phase_id");
  const diffRef = phaseResult.evidence?.diff ?? phaseResult.diff_scan?.path;
  if (typeof diffRef !== "string" || diffRef.length === 0) invalid("phase diff evidence ref is missing");
  const scan = readJson(safeTask, diffRef, "phase diff evidence");
  return Object.freeze({ ...validatePhaseReviewEvidence({ phaseResult, scan, sourceRoot, phaseId }), diffEvidenceRef: diffRef });
}

export function validatePhaseReviewEvidence({ phaseResult, scan, sourceRoot, phaseId } = {}) {
  if (typeof phaseId !== "string" || !/^[a-zA-Z0-9._-]+$/.test(phaseId)) invalid("phase_id is required");
  if (phaseResult?.phase_id !== phaseId) invalid("phase-result.json does not match phase_id");
  if (!scan || typeof scan !== "object" || Array.isArray(scan) || scan.schema_version !== "phase-diff-scan.v1" || scan.phase_id !== phaseId) invalid("phase diff evidence identity is invalid");
  for (const field of ["baseline_commit", "implementation_commit", "snapshot_tree"]) {
    if (typeof scan[field] !== "string" || !/^[a-f0-9]{40,64}$/.test(scan[field])) invalid(`${field} is invalid`);
  }
  git(sourceRoot, ["cat-file", "-e", `${scan.baseline_commit}^{commit}`]);
  git(sourceRoot, ["cat-file", "-e", `${scan.implementation_commit}^{commit}`]);
  if (!isAncestor(sourceRoot, scan.baseline_commit, scan.implementation_commit)) invalid("baseline_commit must be an ancestor of implementation_commit");
  const baseTree = git(sourceRoot, ["rev-parse", `${scan.baseline_commit}^{tree}`]);
  const candidateTree = git(sourceRoot, ["rev-parse", `${scan.implementation_commit}^{tree}`]);
  if (candidateTree !== scan.snapshot_tree) invalid("snapshot_tree does not match implementation_commit");
  return Object.freeze({ phaseId, baselineCommit: scan.baseline_commit, implementationCommit: scan.implementation_commit, baseTree, candidateTree });
}

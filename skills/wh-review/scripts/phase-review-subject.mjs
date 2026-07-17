import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { assertTaskHandle } from "../../../core/task-handle.mjs";
import { hashCanonical } from "../../../core/task-snapshot.mjs";
import { validateBuildPlanReleasePin } from "../../../core/release-pin.mjs";

function invalid(message) { const error = new Error(`PHASE_EVIDENCE_INVALID: ${message}`); error.code = "PHASE_EVIDENCE_INVALID"; throw error; }
function git(root, args) { try { return String(execFileSync("git", args, { cwd: root, encoding: "utf8", maxBuffer: 128 * 1024 * 1024 })).replace(/\r\n/g, "\n"); } catch { invalid(`Git tree is unavailable: ${args.at(-1)}`); } }
function read(task, ref, label) { try { const raw = task.readRecord(ref); return { raw, value: JSON.parse(raw) }; } catch { invalid(`${label} is missing or invalid: ${ref}`); } }

export function resolvePhaseReviewSubject({ task, sourceRoot, phaseId } = {}) {
  const safe = assertTaskHandle(task); if (typeof phaseId !== "string" || !/^[a-z0-9][a-z0-9-]*$/.test(phaseId)) invalid("phase_id is required");
  const subjectRef = `evidence/phases/${phaseId}/subject.json`; const diffRef = `evidence/phases/${phaseId}/diff.json`;
  const subject = read(safe, subjectRef, "phase subject").value; const scan = read(safe, diffRef, "phase diff").value;
  const release = read(safe, subject.release?.ref, "pinned release").value;
  try { validateBuildPlanReleasePin(release, safe.identity.taskId); } catch { invalid("pinned release contract is invalid"); }
  if (hashCanonical(release) !== subject.release?.hash) invalid("pinned release is not canonical");
  return Object.freeze({ ...validatePhaseReviewEvidence({ subject, scan, sourceRoot, phaseId, subjectRef, diffRef }), subjectRef, diffEvidenceRef: diffRef });
}
export function validatePhaseReviewEvidence({ subject, scan, sourceRoot, phaseId, subjectRef = `evidence/phases/${phaseId}/subject.json`, diffRef = `evidence/phases/${phaseId}/diff.json` } = {}) {
  if (subject?.schema_version !== "1.0.0" || subject.phase_id !== phaseId || !subject.baseline || !subject.implementation) invalid("phase subject identity is invalid");
  if (scan?.schema_version !== "1.0.0" || scan.phase_id !== phaseId || scan.task_id !== subject.task_id) invalid("phase diff evidence identity is invalid");
  const subjectHash = hashCanonical(subject); const diffHash = hashCanonical(scan);
  if (scan.subject?.ref !== subjectRef || scan.subject?.hash !== subjectHash) invalid("phase diff does not bind canonical subject");
  const baseTree = subject.baseline.tree_oid; const candidateTree = subject.implementation.tree_oid;
  if (scan.baseline_tree !== baseTree || scan.implementation_tree !== candidateTree) invalid("phase tree pair drift");
  for (const tree of [baseTree, candidateTree]) git(sourceRoot, ["cat-file", "-e", `${tree}^{tree}`]);
  const patch = git(sourceRoot, ["diff", "--binary", "--full-index", "--no-ext-diff", "--no-renames", baseTree, candidateTree]);
  if (patch !== scan.patch) invalid("canonical phase diff does not match tree pair");
  const changedFiles = git(sourceRoot, ["diff", "--name-only", "-z", baseTree, candidateTree]).split("\0").filter(Boolean).sort();
  if (JSON.stringify(scan.changed_files) !== JSON.stringify(changedFiles)) invalid("canonical changed_files do not match tree pair");
  if (scan.allowed !== changedFiles.every((file) => subject.allowed_files.includes(file))) invalid("canonical allowlist result does not match tree pair");
  if (scan.patch_hash !== createHash("sha256").update(patch).digest("hex")) invalid("canonical patch_hash does not match patch bytes");
  return Object.freeze({ phaseId, baseTree, candidateTree, subjectRef, subjectHash, diffRef, diffHash });
}

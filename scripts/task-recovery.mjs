#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

import { inspectRunnerIdentity } from "../core/runner-identity.mjs";
import { openTask } from "../core/task-handle.mjs";
import { createTaskKernel } from "../core/task-kernel.mjs";
import { openAcceptedWorkspace } from "../core/workspace.mjs";
import { publishBuildCodePhaseEvidence } from "../workflows/build-code/phase-evidence.mjs";
import {
  assertRecoveryUnused, canonical, deepEqual, generationRef, normalizedRecoveryRecordHash,
  normalizeRuntimeOnlyPaths, readRecoveryCredential, recoveryError, readRecoveryGeneration, sha256, validateRecoveryInput,
} from "../core/task-recovery.mjs";
import { validateSchema } from "../skills/wh-review/scripts/schema-validator.mjs";
import {
  readPhaseMapTrace,
  validatePhaseAcceptanceTrace,
  validatePhaseReviewEvidence,
} from "../skills/wh-review/scripts/phase-review-subject.mjs";

const STAGES = new Set(["make-decision", "build-spec", "build-plan", "build-code", "verify-code"]);
const HASH = /^[a-f0-9]{64}$/;
const OID = /^[a-f0-9]{40,64}$/;

function parse(argv) {
  const [command, ...rest] = argv;
  if (command === "--help" || command === "-h") return { help: true };
  if (!new Set(["runner-replacement", "phase-pointer", "phase-trace-lineage"]).has(command)) throw recoveryError("RECOVERY_INPUT_REQUIRED", "command must be runner-replacement, phase-pointer, or phase-trace-lineage");
  const values = { command };
  for (const item of rest) {
    const at = item.indexOf("=");
    if (!item.startsWith("--") || at < 3) throw recoveryError("RECOVERY_INPUT_REQUIRED", `invalid argument: ${item}`);
    const key = item.slice(2, at);
    if (Object.prototype.hasOwnProperty.call(values, key)) throw recoveryError("RECOVERY_INPUT_REQUIRED", `duplicate argument: --${key}`);
    values[key] = item.slice(at + 1);
  }
  const allowed = new Set([
    "command", "task-path", "project", "task", "runner-root", "credential-ref", "credential-hash", "stage",
    "phase-id", "phase-evidence-ref", "phase-evidence-hash", "review-result-ref", "review-result-hash",
  ]);
  const unexpected = Object.keys(values).find((key) => !allowed.has(key));
  if (unexpected) throw recoveryError("RECOVERY_INPUT_REQUIRED", `--${unexpected} is not accepted`);
  if (command === "phase-trace-lineage") validateLineageInput(values);
  else validateRecoveryInput(values, command);
  return values;
}

export function helpText() {
  return [
    "Usage:",
    "  node scripts/task-recovery.mjs runner-replacement --task-path=<absolute> --project=<project> --task=<task> --runner-root=<absolute> --stage=<stage> --credential-ref=<task-relative-ref> --credential-hash=<sha256>",
    "  node scripts/task-recovery.mjs phase-pointer --task-path=<absolute> --project=<project> --task=<task> --runner-root=<absolute> --stage=build-code --credential-ref=<task-relative-ref> --credential-hash=<sha256>",
    "  node scripts/task-recovery.mjs phase-trace-lineage --task-path=<absolute> --project=<project> --task=<task> --runner-root=<absolute> --stage=build-code --phase-id=<phase> --phase-evidence-ref=<task-relative-ref> --phase-evidence-hash=<sha256> --review-result-ref=<task-relative-ref> --review-result-hash=<sha256>",
    "",
    "Credentials are canonical task-local records. phase-trace-lineage binds historical Phase facts append-only and never replaces old records or pointers.",
    "Success returns recovery_ref/recovery_hash. Continue with task-bootstrap or stage-runtime official entries.",
    "Errors: RECOVERY_INPUT_REQUIRED, RECOVERY_CREDENTIAL_INVALID, RECOVERY_ALREADY_USED, RECOVERY_CONCURRENT_CHANGE, RECOVERY_*_MISMATCH.",
  ].join("\n");
}

function readRunnerMigration(task) {
  if (!task.manifest.runner_root_migration?.ref) throw recoveryError("RECOVERY_RUNNER_PROVENANCE_MISMATCH", "task has no previous runner lineage");
  let record;
  try { record = JSON.parse(task.readRecord(task.manifest.runner_root_migration.ref)); } catch { throw recoveryError("RECOVERY_RUNNER_PROVENANCE_MISMATCH", "previous runner lineage is unreadable"); }
  if (!record?.runner_identity || record.runner_identity.runner_root !== task.manifest.runner_root || record.runner_identity.runner_oid !== task.manifest.runner_oid) throw recoveryError("RECOVERY_RUNNER_PROVENANCE_MISMATCH", "previous runner lineage does not match the manifest");
  return record;
}

function assertAncestor(oldOid, newRoot) {
  try { execFileSync("git", ["cat-file", "-e", `${oldOid}^{commit}`], { cwd: newRoot, stdio: "ignore" }); }
  catch { throw recoveryError("RECOVERY_RUNNER_ANCESTRY_UNREACHABLE", "previous runner commit is not readable from the new runner"); }
  try { execFileSync("git", ["merge-base", "--is-ancestor", oldOid, "HEAD"], { cwd: newRoot, stdio: "ignore" }); }
  catch (error) { if (error.status === 1) throw recoveryError("RECOVERY_RUNNER_PROVENANCE_MISMATCH", "previous runner commit is not an ancestor of the new runner"); throw recoveryError("RECOVERY_RUNNER_ANCESTRY_UNREACHABLE", "runner ancestry could not be verified"); }
}

function assertBusinessSnapshot(task, credential, kernel) {
  let accepted;
  try { accepted = kernel.readAccepted("make-decision"); } catch { throw recoveryError("RECOVERY_BUSINESS_SNAPSHOT_MISMATCH", "accepted make-decision is unavailable"); }
  const business = credential.value.accepted_business_snapshot;
  if (business.accepted_ref !== accepted.accepted_ref || business.accepted_hash !== accepted.accepted_hash
    || business.baseline_commit !== accepted.facts.baseline_commit
    || !OID.test(accepted.facts.snapshot_tree ?? "") || business.snapshot_tree !== accepted.facts.snapshot_tree
    || business.target_repo_root !== task.manifest.target_repo_root) {
    throw recoveryError("RECOVERY_BUSINESS_SNAPSHOT_MISMATCH", "accepted business snapshot does not match the task");
  }
}

function runnerReplacement(values) {
  const task = openTask(values["task-path"], values.project, values.task);
  const kernel = createTaskKernel(task);
  const credential = readRecoveryCredential(task, values["credential-ref"], values["credential-hash"], "runner-replacement");
  assertRecoveryUnused(task, "runner-replacement");
  const previous = readRunnerMigration(task).runner_identity;
  let next;
  try { next = inspectRunnerIdentity({ runnerRoot: values["runner-root"], projectName: task.identity.projectName, taskId: task.identity.taskId, stage: values.stage, requireClean: true }); }
  catch (error) { throw recoveryError("RECOVERY_RUNNER_IDENTITY_INVALID", error.message); }
  if (credential.value.runner_subject.stage !== values.stage || !deepEqual(credential.value.runner_subject.previous_runner, previous) || !deepEqual(credential.value.runner_subject.new_runner, next)) throw recoveryError("RECOVERY_RUNNER_PROVENANCE_MISMATCH", "credential runner subject does not match Git identity");
  const manifestRaw = task.readRecord("task.json");
  const manifestHash = sha256(manifestRaw);
  if (credential.value.runner_subject.previous_manifest_hash !== manifestHash) throw recoveryError("RECOVERY_MANIFEST_HASH_MISMATCH", "credential previous_manifest_hash does not match task.json");
  assertAncestor(previous.runner_oid, next.runner_root);
  assertBusinessSnapshot(task, credential, kernel);
  const generation = 1;
  const generationPath = generationRef("runner-replacement", generation);
  const archiveRaw = manifestRaw;
  const archivePath = `identity/recovery-archives/runner-manifest-${manifestHash}.json`;
  const nextManifestTemplate = { ...task.manifest, runner_root: next.runner_root, runner_oid: next.runner_oid, runner_replacement: { ref: generationPath, integrity_hash: "__GENERATION_HASH__" } };
  const afterManifestHash = normalizedRecoveryRecordHash("runner-replacement", nextManifestTemplate);
  const generationValue = {
    schema_version: "workflowhub-recovery-generation.v1", project_name: task.identity.projectName, task_id: task.identity.taskId,
    recovery_kind: "runner-replacement", generation, credential_ref: credential.ref, credential_hash: credential.hash,
    before: { ref: "task.json", hash: manifestHash, identity: previous }, after: { ref: "task.json", hash: afterManifestHash, identity: next },
    created_at: new Date().toISOString(), result: "accepted",
  };
  const generationRaw = canonical(generationValue);
  const generationHash = sha256(generationRaw);
  const nextManifest = { ...task.manifest, runner_root: next.runner_root, runner_oid: next.runner_oid, runner_replacement: { ref: generationPath, integrity_hash: generationHash } };
  const nextManifestRaw = canonical(nextManifest);
  const result = task.withRecordLock("locks/task-identity-migration.lock", () => {
    if (readRecoveryGeneration(task, "runner-replacement")) throw recoveryError("RECOVERY_ALREADY_USED", "runner-replacement recovery gate is already consumed");
    if (sha256(task.readRecord("task.json")) !== manifestHash) throw recoveryError("RECOVERY_CONCURRENT_CHANGE", "task manifest changed before replacement");
    try {
      task.replaceRecoveryManifest({ previousManifestRaw: manifestRaw, manifestRaw: nextManifestRaw, archiveRef: archivePath, archiveRaw, generationRef: generationPath, generationRaw });
    } catch (error) { if (error.code?.startsWith("RECOVERY_")) throw error; throw recoveryError(error.message?.includes("changed") ? "RECOVERY_CONCURRENT_CHANGE" : "RECOVERY_RECORD_CONFLICT", error.message); }
    return Object.freeze({ recovery_ref: generationPath, recovery_hash: generationHash, previous_runner: previous, new_runner: next });
  });
  return { recovery_ref: result.recovery_ref, recovery_hash: result.recovery_hash, next_entry: "task-bootstrap" };
}

function readJson(task, ref, expectedHash, label, pattern = null) {
  if (typeof ref !== "string" || ref.includes("..") || ref.startsWith("/") || ref.includes("\\") || (pattern && !pattern.test(ref))) {
    throw recoveryError("RECOVERY_PHASE_EVIDENCE_MISMATCH", `${label} reference is outside the allowed namespace`);
  }
  let raw;
  try { raw = task.readRecord(ref); } catch { throw recoveryError("RECOVERY_PHASE_EVIDENCE_MISMATCH", `${label} is missing`); }
  if (expectedHash && sha256(raw) !== expectedHash) throw recoveryError("RECOVERY_PHASE_EVIDENCE_MISMATCH", `${label} hash mismatch`);
  try { return { raw, hash: sha256(raw), value: JSON.parse(raw), ref }; } catch { throw recoveryError("RECOVERY_PHASE_EVIDENCE_MISMATCH", `${label} is invalid JSON`); }
}

function snapshotFromEvidence(task, evidence) {
  if (OID.test(evidence.value.snapshot_tree ?? "")) return evidence.value.snapshot_tree;
  const diffRef = evidence.value.diff_scan?.path ?? evidence.value.evidence?.diff;
  if (!diffRef) throw recoveryError("RECOVERY_PHASE_EVIDENCE_MISMATCH", "baseline Phase 0 evidence has no snapshot");
  const diff = readJson(task, diffRef, undefined, "Phase 0 diff scan", /^evidence\/phases\/phase-0\/.+\.json$/);
  if (!OID.test(diff.value.snapshot_tree ?? "")) throw recoveryError("RECOVERY_PHASE_EVIDENCE_MISMATCH", "Phase 0 diff scan has no snapshot");
  return diff.value.snapshot_tree;
}

const PHASE0_EVIDENCE_REF = /^evidence\/phases\/phase-0\/[a-f0-9]{40,64}\/[A-Za-z0-9._-]+\.json$/;
const PHASE_REVIEW_RESULT_REF = /^reviews\/results\/[A-Za-z0-9._-]+\.json$/;
const PHASE_REVIEW_ATTEMPT_REF = /^reviews\/attempts\/[A-Za-z0-9-]+\/attempt\.json$/;
const RECEIPT_REF = /^receipts\/[A-Za-z0-9._/-]+\.json$/;
const TEST_OUTPUT_REF = /^evidence\/[A-Za-z0-9._/-]+$/;
const PHASE_EVIDENCE_REF = /^evidence\/phases\/([A-Za-z0-9._-]+)\/([a-f0-9]{40,64})\/phase-evidence-([a-f0-9]{64})\.json$/;
const PHASE_DIFF_REF = /^evidence\/phases\/([A-Za-z0-9._-]+)\/([a-f0-9]{40,64})\/diff-scan-([a-f0-9]{64})\.json$/;
const LINEAGE_REF = /^identity\/phase-trace-lineage\/([A-Za-z0-9._-]+)-([a-f0-9]{40,64})-([a-f0-9]{64})\.json$/;
const LINEAGE_SUPERSESSION_REF = /^identity\/phase-trace-lineage-supersessions\/([A-Za-z0-9._-]+)-([a-f0-9]{40,64})-([a-f0-9]{64})\.json$/;

function validateLineageInput(values) {
  for (const key of ["task-path", "project", "task", "runner-root", "stage", "phase-id", "phase-evidence-ref", "phase-evidence-hash", "review-result-ref", "review-result-hash"]) {
    if (typeof values[key] !== "string" || values[key].trim() === "") {
      throw recoveryError("RECOVERY_INPUT_REQUIRED", `--${key} is required`);
    }
  }
  if (values.stage !== "build-code") throw recoveryError("RECOVERY_INPUT_REQUIRED", "phase-trace-lineage requires --stage=build-code");
  if (!/^[A-Za-z0-9._-]+$/.test(values["phase-id"])) throw recoveryError("RECOVERY_INPUT_REQUIRED", "--phase-id is invalid");
  if (!HASH.test(values["phase-evidence-hash"]) || !HASH.test(values["review-result-hash"])) {
    throw recoveryError("RECOVERY_INPUT_REQUIRED", "lineage hashes must be sha256 values");
  }
  return values;
}

function phaseEvidenceError(detail) {
  return recoveryError("RECOVERY_PHASE_EVIDENCE_MISMATCH", detail);
}

function readPhaseReceipt(task, receipt, label, { component, green = null }) {
  if (!receipt || typeof receipt !== "object" || typeof receipt.ref !== "string" || typeof receipt.hash !== "string") {
    throw phaseEvidenceError(`${label} reference is incomplete`);
  }
  const record = readJson(task, receipt.ref, receipt.hash, label, RECEIPT_REF);
  const value = record.value;
  if (value.schema_version !== "workflowhub-receipt.v1" || value.task_id !== task.identity.taskId
    || value.stage !== "build-code" || value.producer?.stage !== "build-code"
    || value.producer?.component !== component || !OID.test(value.snapshot_tree ?? "")
    || !OID.test(value.snapshot_commit ?? "")) throw phaseEvidenceError(`${label} provenance is invalid`);
  if (green !== null && (!Number.isInteger(value.exit_code) || (green ? value.exit_code !== 0 : value.exit_code === 0))) {
    throw phaseEvidenceError(`${label} exit status is invalid`);
  }
  if (green !== null) {
    if (!TEST_OUTPUT_REF.test(value.output_ref ?? "")) throw phaseEvidenceError(`${label} output reference is outside the allowed namespace`);
    let outputRaw;
    try { outputRaw = task.readRecord(value.output_ref); } catch { throw phaseEvidenceError(`${label} output is missing`); }
    if (!HASH.test(value.output_hash ?? "") || sha256(outputRaw) !== value.output_hash) throw phaseEvidenceError(`${label} output hash mismatch`);
  }
  return record;
}

function assertBaselinePhaseClosure(task, baseline, baselineSnapshot, subject) {
  if (baseline.value.phase_id !== "phase-0" || !["awaiting_review", "done"].includes(baseline.value.status)) {
    throw phaseEvidenceError("baseline evidence is not a closed Phase 0 record");
  }
  const diffRef = baseline.value.diff_scan?.path ?? baseline.value.evidence?.diff;
  if (!PHASE0_EVIDENCE_REF.test(diffRef ?? "")) throw phaseEvidenceError("baseline Phase 0 diff reference is outside the allowed namespace");
  const diff = readJson(task, diffRef, undefined, "baseline Phase 0 diff scan", PHASE0_EVIDENCE_REF);
  if (diff.value.phase_id !== "phase-0" || diff.value.snapshot_tree !== baselineSnapshot || !Array.isArray(diff.value.changed_files) || !Array.isArray(diff.value.allowed_files)) {
    throw phaseEvidenceError("baseline Phase 0 diff scan is incomplete");
  }
  if (JSON.stringify(normalizeRuntimeOnlyPaths(diff.value.allowed_files)) !== JSON.stringify(normalizeRuntimeOnlyPaths(subject.allowed_files))) {
    throw phaseEvidenceError("baseline Phase 0 allowed-file contract does not match the credential");
  }
  const greenRef = baseline.value.tests?.green?.path ?? baseline.value.evidence?.green_test_receipt_ref;
  const implementationRef = baseline.value.evidence?.implementation_receipt_ref;
  if (implementationRef !== subject.implementation_receipt.ref || greenRef !== subject.green_test_receipt.ref) {
    throw phaseEvidenceError("baseline Phase 0 evidence does not close over the credentialed receipts");
  }
  readPhaseReceipt(task, subject.implementation_receipt, "baseline Phase 0 implementation receipt", { component: "implementation" });
  readPhaseReceipt(task, subject.green_test_receipt, "baseline Phase 0 GREEN test receipt", { component: "build-code-test-capture", green: true });
  if (subject.red_test_receipt) {
    const redRef = baseline.value.tests?.red?.path ?? baseline.value.evidence?.red_evidence_ref;
    if (redRef !== subject.red_test_receipt.ref) throw phaseEvidenceError("baseline Phase 0 RED receipt is not closed by the evidence");
    readPhaseReceipt(task, subject.red_test_receipt, "baseline Phase 0 RED test receipt", { component: "build-code-test-capture", green: false });
  }
}

function assertBaselineReviewClosure(task, subject, baselineSnapshot, review) {
  try { validateSchema("result", review.value); } catch (error) { throw phaseEvidenceError(`baseline Phase 0 review schema is invalid: ${error.message}`); }
  const value = review.value;
  let baselineTree;
  try { baselineTree = execFileSync("git", ["rev-parse", `${subject.baseline_commit}^{tree}`], { cwd: task.manifest.target_repo_root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim(); }
  catch { throw phaseEvidenceError("baseline commit tree cannot be verified"); }
  if (value.verdict !== "pass" || value.subject_kind !== "phase" || value.phase_id !== "phase-0"
    || value.review_scope !== "phase" || value.snapshot_tree !== baselineSnapshot
    || value.base_tree !== baselineTree || value.candidate_tree !== baselineSnapshot) {
    throw phaseEvidenceError("baseline Phase 0 review is not a matching PASS");
  }
  if (!PHASE_REVIEW_ATTEMPT_REF.test(value.attempt_ref ?? "")) throw phaseEvidenceError("baseline Phase 0 review attempt is outside the allowed namespace");
  const attempt = readJson(task, value.attempt_ref, undefined, "baseline Phase 0 review attempt", PHASE_REVIEW_ATTEMPT_REF);
  try { validateSchema("attempt", attempt.value); } catch (error) { throw phaseEvidenceError(`baseline Phase 0 review attempt schema is invalid: ${error.message}`); }
  for (const key of ["task_id", "stage", "subject_kind", "phase_id", "review_scope", "base_tree", "candidate_tree", "snapshot_tree", "material_id"]) {
    if (attempt.value[key] !== value[key]) throw phaseEvidenceError(`baseline Phase 0 review attempt/result ${key} mismatch`);
  }
}

function assertRefHashSuffix(record, match, label) {
  if (!match || record.hash !== match[3]) throw phaseEvidenceError(`${label} canonical reference hash mismatch`);
}

function readLineageReceipt(task, ref, label, { component, green = null, expectedTree }) {
  const receipt = readJson(task, ref, undefined, label, RECEIPT_REF);
  const value = receipt.value;
  if (value?.schema_version !== "workflowhub-receipt.v1" || value.task_id !== task.identity.taskId
    || value.stage !== "build-code" || value.producer?.stage !== "build-code"
    || value.producer?.component !== component || value.snapshot_tree !== expectedTree
    || !OID.test(value.snapshot_head ?? "") || !OID.test(value.snapshot_commit ?? "")) {
    throw phaseEvidenceError(`${label} provenance is invalid`);
  }
  if (green !== null) {
    if (!Number.isInteger(value.exit_code) || (green ? value.exit_code !== 0 : value.exit_code === 0)
      || !TEST_OUTPUT_REF.test(value.output_ref ?? "") || !HASH.test(value.output_hash ?? "")) {
      throw phaseEvidenceError(`${label} test evidence is invalid`);
    }
    let output;
    try { output = task.readRecord(value.output_ref); } catch { throw phaseEvidenceError(`${label} output is missing`); }
    if (sha256(output) !== value.output_hash) throw phaseEvidenceError(`${label} output hash mismatch`);
  } else if (!TEST_OUTPUT_REF.test(value.diff_ref ?? "") || !HASH.test(value.diff_hash ?? "")) {
    throw phaseEvidenceError(`${label} diff binding is invalid`);
  } else {
    let diff;
    try { diff = task.readRecord(value.diff_ref); } catch { throw phaseEvidenceError(`${label} diff is missing`); }
    if (sha256(diff) !== value.diff_hash) throw phaseEvidenceError(`${label} diff hash mismatch`);
  }
  return receipt;
}

function phaseCommitRef(task, phaseId, snapshotTree) {
  return `refs/workflowhub/phases/${task.identity.projectName}/${task.identity.taskId}/build-code/${phaseId}/snapshot-${snapshotTree}`;
}

function verifyLineagePinnedCommit(task, phaseId, snapshotTree, implementationCommit) {
  const ref = phaseCommitRef(task, phaseId, snapshotTree);
  let pinnedCommit;
  let pinnedTree;
  try {
    pinnedCommit = execFileSync("git", ["rev-parse", `${ref}^{commit}`], { cwd: task.manifest.target_repo_root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
    pinnedTree = execFileSync("git", ["rev-parse", `${ref}^{tree}`], { cwd: task.manifest.target_repo_root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  } catch { throw phaseEvidenceError("Phase snapshot ref is unavailable"); }
  if (pinnedCommit !== implementationCommit || pinnedTree !== snapshotTree) {
    throw phaseEvidenceError("Phase snapshot ref does not match the evidence");
  }
  return ref;
}

function readLineageSources(task, values) {
  const phaseId = values["phase-id"];
  const evidence = readJson(task, values["phase-evidence-ref"], values["phase-evidence-hash"], "Phase evidence", PHASE_EVIDENCE_REF);
  const evidenceMatch = PHASE_EVIDENCE_REF.exec(evidence.ref);
  assertRefHashSuffix(evidence, evidenceMatch, "Phase evidence");
  if (evidenceMatch[1] !== phaseId || evidence.value.phase_id !== phaseId) throw phaseEvidenceError("Phase evidence phase does not match the request");
  const diffRef = evidence.value.diff_scan?.path ?? evidence.value.evidence?.diff;
  if (evidence.value.diff_scan?.path !== diffRef || evidence.value.evidence?.diff !== diffRef) {
    throw phaseEvidenceError("Phase evidence diff closure is incomplete");
  }
  const scan = readJson(task, diffRef, undefined, "Phase diff scan", PHASE_DIFF_REF);
  const scanMatch = PHASE_DIFF_REF.exec(scan.ref);
  assertRefHashSuffix(scan, scanMatch, "Phase diff scan");
  if (scanMatch[1] !== phaseId || scanMatch[2] !== evidenceMatch[2] || scan.value.phase_id !== phaseId
    || scan.value.snapshot_tree !== evidenceMatch[2]) throw phaseEvidenceError("Phase diff scan identity does not match the evidence");
  let subject;
  try { subject = validatePhaseReviewEvidence({ phaseResult: evidence.value, scan: scan.value, sourceRoot: task.manifest.target_repo_root, phaseId }); }
  catch (error) { throw phaseEvidenceError(error.message); }
  const implementationRef = evidence.value.evidence?.implementation_receipt_ref;
  const greenRef = evidence.value.evidence?.green_test_receipt_ref;
  const redRef = evidence.value.evidence?.red_evidence_ref ?? null;
  if (evidence.value.tests?.green?.path !== greenRef || (evidence.value.tests?.red?.path ?? null) !== redRef) {
    throw phaseEvidenceError("Phase evidence receipt closure is incomplete");
  }
  const implementation = readLineageReceipt(task, implementationRef, "implementation receipt", {
    component: "implementation", expectedTree: subject.candidateTree,
  });
  const green = readLineageReceipt(task, greenRef, "GREEN test receipt", {
    component: "build-code-test-capture", green: true, expectedTree: subject.candidateTree,
  });
  const red = redRef === null ? null : readLineageReceipt(task, redRef, "RED test receipt", {
    component: "build-code-test-capture", green: false, expectedTree: subject.baseTree,
  });
  const review = readJson(task, values["review-result-ref"], values["review-result-hash"], "formal Phase review", PHASE_REVIEW_RESULT_REF);
  try { validateSchema("result", review.value); } catch (error) { throw phaseEvidenceError(`formal Phase review schema is invalid: ${error.message}`); }
  if (review.value.verdict !== "pass" || !PHASE_REVIEW_ATTEMPT_REF.test(review.value.attempt_ref ?? "")) {
    throw phaseEvidenceError("formal Phase review is not a PASS Phase result");
  }
  const attempt = readJson(task, review.value.attempt_ref, undefined, "formal Phase review attempt", PHASE_REVIEW_ATTEMPT_REF);
  try { validateSchema("attempt", attempt.value); } catch (error) { throw phaseEvidenceError(`formal Phase review attempt schema is invalid: ${error.message}`); }
  const expected = {
    task_id: task.identity.taskId, stage: "build-code", subject_kind: "phase", phase_id: phaseId,
    review_scope: "phase", base_tree: subject.baseTree, candidate_tree: subject.candidateTree,
    snapshot_tree: subject.candidateTree, material_id: review.value.material_id,
  };
  for (const [key, value] of Object.entries(expected)) {
    if (review.value[key] !== value || attempt.value[key] !== value) throw phaseEvidenceError(`formal Phase review ${key} does not match the evidence`);
  }
  if (review.value.attempt_ref !== attempt.ref || !HASH.test(review.value.material_id ?? "")) {
    throw phaseEvidenceError("formal Phase review linkage is invalid");
  }
  let acceptanceTrace;
  try {
    acceptanceTrace = validatePhaseAcceptanceTrace({
      trace: attempt.value.phase_ac_trace, phaseId, baseTree: subject.baseTree, snapshotTree: subject.candidateTree,
      changedFiles: scan.value.changed_files, greenTestReceipt: { ref: green.ref, sha256: green.hash }, required: true,
    });
  } catch (error) { throw phaseEvidenceError(error.message); }
  const implementationCommitRef = verifyLineagePinnedCommit(task, phaseId, subject.candidateTree, scan.value.implementation_commit);
  return { phaseId, evidence, scan, implementation, green, red, review, attempt, subject, acceptanceTrace, implementationCommitRef };
}

function phaseTraceFromSources(sources) {
  return {
    schema_version: "phase-map-trace.v1", phase_id: sources.phaseId,
    baseline_commit: sources.scan.value.baseline_commit, implementation_commit: sources.scan.value.implementation_commit,
    implementation_commit_ref: sources.implementationCommitRef, base_tree: sources.subject.baseTree,
    snapshot_tree: sources.subject.candidateTree, allowed_files: [...sources.scan.value.allowed_files],
    changed_files: [...sources.scan.value.changed_files],
    canonical_phase_evidence: { ref: sources.evidence.ref, sha256: sources.evidence.hash },
    diff_scan: { ref: sources.scan.ref, sha256: sources.scan.hash },
    implementation_receipt: { ref: sources.implementation.ref, sha256: sources.implementation.hash },
    green_test_receipt: { ref: sources.green.ref, sha256: sources.green.hash },
    red_test_receipt: sources.red === null ? null : { ref: sources.red.ref, sha256: sources.red.hash },
    review_result: { ref: sources.review.ref, sha256: sources.review.hash },
    review_attempt: { ref: sources.attempt.ref, sha256: sources.attempt.hash },
    material_id: sources.review.value.material_id, review_scope: "phase", verdict: "pass",
    acceptance_trace: sources.acceptanceTrace,
  };
}

function lineageGenerationRef(phaseId, snapshotTree, traceHash) {
  const ref = `identity/phase-trace-lineage/${phaseId}-${snapshotTree}-${traceHash}.json`;
  if (!LINEAGE_REF.test(ref)) throw recoveryError("RECOVERY_RECORD_CONFLICT", "lineage generation ref is invalid");
  return ref;
}

function lineageSupersessionRef(phaseId, snapshotTree, lineageHash) {
  const ref = `identity/phase-trace-lineage-supersessions/${phaseId}-${snapshotTree}-${lineageHash}.json`;
  if (!LINEAGE_SUPERSESSION_REF.test(ref)) throw recoveryError("RECOVERY_RECORD_CONFLICT", "lineage supersession ref is invalid");
  return ref;
}

function lineageGeneration(task, sources, traceRef, traceHash) {
  const value = {
    schema_version: "phase-trace-lineage-generation.v1", project_name: task.identity.projectName, task_id: task.identity.taskId,
    stage: "build-code", phase_id: sources.phaseId, snapshot_tree: sources.subject.candidateTree,
    trace: { ref: traceRef, sha256: traceHash },
    phase_evidence: { ref: sources.evidence.ref, sha256: sources.evidence.sha256 },
    diff_scan: { ref: sources.scan.ref, sha256: sources.scan.sha256 },
    implementation_receipt: { ref: sources.implementation.ref, sha256: sources.implementation.sha256 },
    green_test_receipt: { ref: sources.green.ref, sha256: sources.green.sha256 },
    red_test_receipt: sources.red === null ? null : { ref: sources.red.ref, sha256: sources.red.sha256 },
    review_result: { ref: sources.review.ref, sha256: sources.review.sha256 },
    review_attempt: { ref: sources.attempt.ref, sha256: sources.attempt.sha256 },
    material_id: sources.review.value.material_id, created_at: new Date().toISOString(), result: "bound",
  };
  const allowed = new Set(["schema_version", "project_name", "task_id", "stage", "phase_id", "snapshot_tree", "trace", "phase_evidence", "diff_scan", "implementation_receipt", "green_test_receipt", "red_test_receipt", "review_result", "review_attempt", "material_id", "created_at", "result"]);
  if (Object.keys(value).some((key) => !allowed.has(key)) || value.schema_version !== "phase-trace-lineage-generation.v1"
    || !OID.test(value.snapshot_tree) || !HASH.test(value.material_id) || !Number.isFinite(Date.parse(value.created_at)) || value.result !== "bound") {
    throw recoveryError("RECOVERY_RECORD_CONFLICT", "lineage generation schema is invalid");
  }
  return value;
}

function lineageGenerationFromTrace(task, verified) {
  const { trace } = verified;
  return lineageGeneration(task, {
    phaseId: trace.phase_id,
    subject: { candidateTree: trace.snapshot_tree },
    evidence: verified.phaseEvidence,
    scan: verified.scan,
    implementation: verified.implementation,
    green: verified.green,
    red: verified.red,
    review: verified.review,
    attempt: verified.attempt,
  }, verified.traceRef, verified.traceSha256);
}

function recordExists(task, ref) {
  try { task.readRecord(ref); return true; } catch (error) { if (error?.code === "ENOENT") return false; throw error; }
}

/**
 * Bind one already-published canonical Phase trace to its historical PASS.
 * The caller supplies no record closure of its own: readPhaseMapTrace
 * independently verifies every bound receipt, evidence record, review, tree,
 * material, and task identity before this append-only generation is written.
 */
export function publishPhaseTraceLineage({ task, workspace } = {}, input = {}) {
  if (!task || typeof task !== "object" || !workspace || typeof workspace.worktreeRoot !== "string") {
    throw new TypeError("authenticated task and workspace are required");
  }
  if (!input || typeof input !== "object" || Array.isArray(input)
    || typeof input.trace_ref !== "string" || !HASH.test(input.trace_hash ?? "")
    || Object.keys(input).some((key) => !new Set(["trace_ref", "trace_hash"]).has(key))) {
    throw new TypeError("Phase trace lineage input requires trace_ref and trace_hash only");
  }
  let verified;
  try {
    verified = readPhaseMapTrace({ task, sourceRoot: workspace.worktreeRoot, traceRef: input.trace_ref });
  } catch (error) {
    throw phaseEvidenceError(error.message);
  }
  if (verified.traceSha256 !== input.trace_hash) throw phaseEvidenceError("canonical Phase trace hash mismatch");
  if (verified.trace.verdict !== "pass" || verified.review.value.verdict !== "pass") {
    throw phaseEvidenceError("canonical Phase trace is not a PASS");
  }
  const generationRef = lineageGenerationRef(verified.trace.phase_id, verified.trace.snapshot_tree, verified.traceSha256);
  const generationRaw = canonical(lineageGenerationFromTrace(task, verified));
  return task.withRecordLock("locks/phase-trace-lineage.lock", () => {
    for (const ref of task.listCanonicalPhaseTraceLineageRefs()) {
      const existing = readJson(task, ref, undefined, "Phase trace lineage", LINEAGE_REF).value;
      if (ref === generationRef || existing.trace?.ref === verified.traceRef
        || existing.review_result?.ref === verified.review.ref) {
        throw recoveryError("RECOVERY_ALREADY_USED", "this Phase trace or formal review is already bound");
      }
    }
    try { task.writePhaseTraceLineage(generationRef, generationRaw); }
    catch (error) { throw recoveryError("RECOVERY_RECORD_CONFLICT", error.message); }
    return Object.freeze({
      trace_ref: verified.traceRef,
      trace_hash: verified.traceSha256,
      lineage_ref: generationRef,
      lineage_hash: sha256(generationRaw),
      phase_id: verified.trace.phase_id,
      snapshot_tree: verified.trace.snapshot_tree,
      review_result_ref: verified.review.ref,
      material_id: verified.trace.material_id,
    });
  });
}

function refOnly(value, expected, label) {
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.keys(value).length !== 1
    || typeof value.ref !== "string" || value.ref !== expected.ref) {
    throw phaseEvidenceError(`legacy Phase trace lineage ${label} is not the known missing-hash shape`);
  }
}

/**
 * Supersede only the one legacy producer defect: a canonical lineage whose
 * closure refs match a PASS trace but whose binding objects omitted sha256.
 * This creates a new immutable fact; it never changes the legacy record.
 */
export function supersedePhaseTraceLineage({ task, workspace } = {}, input = {}) {
  if (!task || typeof task !== "object" || !workspace || typeof workspace.worktreeRoot !== "string") {
    throw new TypeError("authenticated task and workspace are required");
  }
  if (!input || typeof input !== "object" || Array.isArray(input)
    || typeof input.lineage_ref !== "string" || !HASH.test(input.lineage_hash ?? "")
    || Object.keys(input).some((key) => !new Set(["lineage_ref", "lineage_hash"]).has(key))) {
    throw new TypeError("Phase trace lineage supersession input requires lineage_ref and lineage_hash only");
  }
  const legacy = readJson(task, input.lineage_ref, input.lineage_hash, "legacy Phase trace lineage", LINEAGE_REF);
  const value = legacy.value;
  const keys = new Set(["schema_version", "project_name", "task_id", "stage", "phase_id", "snapshot_tree", "trace",
    "phase_evidence", "diff_scan", "implementation_receipt", "green_test_receipt", "red_test_receipt",
    "review_result", "review_attempt", "material_id", "created_at", "result"]);
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.keys(value).some((key) => !keys.has(key))
    || value.schema_version !== "phase-trace-lineage-generation.v1" || value.project_name !== task.identity.projectName
    || value.task_id !== task.identity.taskId || value.stage !== "build-code" || !/^[A-Za-z0-9._-]+$/.test(value.phase_id ?? "")
    || !OID.test(value.snapshot_tree ?? "") || !HASH.test(value.material_id ?? "") || value.result !== "bound"
    || !Number.isFinite(Date.parse(value.created_at ?? ""))) {
    throw phaseEvidenceError("legacy Phase trace lineage is not eligible for supersession");
  }
  let traceBinding;
  try { traceBinding = value.trace; } catch { throw phaseEvidenceError("legacy Phase trace lineage trace binding is invalid"); }
  if (!traceBinding || typeof traceBinding !== "object" || Object.keys(traceBinding).length !== 2
    || typeof traceBinding.ref !== "string" || !HASH.test(traceBinding.sha256 ?? "")) {
    throw phaseEvidenceError("legacy Phase trace lineage trace binding is invalid");
  }
  let verified;
  try { verified = readPhaseMapTrace({ task, sourceRoot: workspace.worktreeRoot, traceRef: traceBinding.ref }); }
  catch (error) { throw phaseEvidenceError(error.message); }
  if (verified.traceSha256 !== traceBinding.sha256 || verified.trace.phase_id !== value.phase_id
    || verified.trace.snapshot_tree !== value.snapshot_tree || verified.trace.material_id !== value.material_id
    || verified.trace.verdict !== "pass" || verified.review.value.verdict !== "pass") {
    throw phaseEvidenceError("legacy Phase trace lineage does not match a PASS canonical trace");
  }
  refOnly(value.phase_evidence, verified.trace.canonical_phase_evidence, "phase evidence");
  refOnly(value.diff_scan, verified.trace.diff_scan, "diff scan");
  refOnly(value.implementation_receipt, verified.trace.implementation_receipt, "implementation receipt");
  refOnly(value.green_test_receipt, verified.trace.green_test_receipt, "GREEN test receipt");
  if (value.red_test_receipt !== null || verified.trace.red_test_receipt !== null) throw phaseEvidenceError("legacy Phase trace lineage RED binding is not eligible for supersession");
  refOnly(value.review_result, verified.trace.review_result, "review result");
  refOnly(value.review_attempt, verified.trace.review_attempt, "review attempt");
  const corrected = {
    ...lineageGenerationFromTrace(task, verified), schema_version: "phase-trace-lineage-supersession.v1",
    supersedes: { ref: legacy.ref, sha256: legacy.hash }, result: "superseded",
  };
  const ref = lineageSupersessionRef(value.phase_id, value.snapshot_tree, legacy.hash);
  const raw = canonical(corrected);
  return task.withRecordLock("locks/phase-trace-lineage.lock", () => {
    for (const existingRef of task.listCanonicalPhaseTraceLineageSupersessionRefs()) {
      const existing = readJson(task, existingRef, undefined, "Phase trace lineage supersession", LINEAGE_SUPERSESSION_REF).value;
      if (existing.supersedes?.ref === legacy.ref || existing.review_result?.ref === verified.review.ref) {
        throw recoveryError("RECOVERY_ALREADY_USED", "this legacy lineage or formal review is already superseded");
      }
    }
    try { task.writePhaseTraceLineageSupersession(ref, raw); }
    catch (error) { throw recoveryError("RECOVERY_RECORD_CONFLICT", error.message); }
    return Object.freeze({ supersession_ref: ref, supersession_hash: sha256(raw), lineage_ref: legacy.ref,
      trace_ref: verified.traceRef, trace_hash: verified.traceSha256, review_result_ref: verified.review.ref });
  });
}

function phaseTraceLineage(values) {
  const task = openTask(values["task-path"], values.project, values.task);
  try { inspectRunnerIdentity({ runnerRoot: values["runner-root"], projectName: task.identity.projectName, taskId: task.identity.taskId, stage: "build-code" }); }
  catch (error) { throw recoveryError("RECOVERY_RUNNER_IDENTITY_INVALID", error.message); }
  const sources = readLineageSources(task, values);
  const trace = phaseTraceFromSources(sources);
  const traceRaw = canonical(trace);
  const traceHash = sha256(traceRaw);
  const traceRef = `evidence/phases/${sources.phaseId}/${sources.subject.candidateTree}/phase-map-trace-${traceHash}.json`;
  const kernel = createTaskKernel(task);
  task.withRecordLock("locks/phase-trace-generation.lock", () => {
    if (recordExists(task, traceRef)) {
      if (task.readRecord(traceRef) !== traceRaw) throw recoveryError("RECOVERY_RECORD_CONFLICT", "canonical Phase trace bytes conflict");
      return;
    }
    try { kernel.publishCanonicalRecord(traceRef, traceRaw); }
    catch (error) { throw recoveryError("RECOVERY_RECORD_CONFLICT", error.message); }
    try { readPhaseMapTrace({ task, sourceRoot: task.manifest.target_repo_root, traceRef }); }
    catch (error) { throw recoveryError("RECOVERY_PHASE_EVIDENCE_MISMATCH", error.message); }
  });
  const result = publishPhaseTraceLineage({
    task,
    workspace: { worktreeRoot: task.manifest.target_repo_root },
  }, { trace_ref: traceRef, trace_hash: traceHash });
  return { ...result, next_entry: "stage-runtime receipt --revision=true + capture-tests + publish-phase-evidence + fresh wh-review" };
}

function phasePointer(values) {
  const task = openTask(values["task-path"], values.project, values.task);
  const credential = readRecoveryCredential(task, values["credential-ref"], values["credential-hash"], "phase-pointer");
  assertRecoveryUnused(task, "phase-pointer");
  try { inspectRunnerIdentity({ runnerRoot: values["runner-root"], projectName: task.identity.projectName, taskId: task.identity.taskId, stage: "build-code" }); }
  catch (error) { throw recoveryError("RECOVERY_RUNNER_IDENTITY_INVALID", error.message); }
  const pointer = readJson(task, "phase-result.json", undefined, "current Phase pointer");
  const subject = credential.value.phase_subject;
  if (pointer.value.phase_id !== "phase-1" || subject.current_pointer_hash !== pointer.hash) throw recoveryError("RECOVERY_PHASE_POINTER_MISMATCH", "current pointer is not the credentialed Phase 1 pointer");
  const baseline = readJson(task, subject.baseline_phase0_evidence_ref, subject.baseline_phase0_evidence_hash, "baseline Phase 0 evidence", PHASE0_EVIDENCE_REF);
  const baselineSnapshot = snapshotFromEvidence(task, baseline);
  const review = readJson(task, subject.baseline_phase0_review_ref, subject.baseline_phase0_review_hash, "baseline Phase 0 review", PHASE_REVIEW_RESULT_REF);
  assertBaselinePhaseClosure(task, baseline, baselineSnapshot, subject);
  assertBaselineReviewClosure(task, subject, baselineSnapshot, review);
  if (subject.snapshot_tree === baselineSnapshot) throw recoveryError("RECOVERY_PHASE_SNAPSHOT_ALREADY_CURRENT", "target Phase 0 snapshot is already current");
  const implementation = readPhaseReceipt(task, subject.implementation_receipt, "Phase 0 implementation receipt", { component: "implementation" });
  const green = readPhaseReceipt(task, subject.green_test_receipt, "Phase 0 GREEN test receipt", { component: "build-code-test-capture", green: true });
  if (implementation.value.snapshot_tree !== subject.snapshot_tree || green.value.snapshot_tree !== subject.snapshot_tree) throw phaseEvidenceError("Phase 0 receipt snapshot mismatch");
  if (subject.red_test_receipt) {
    const red = readPhaseReceipt(task, subject.red_test_receipt, "Phase 0 RED test receipt", { component: "build-code-test-capture", green: false });
    if (red.value.snapshot_tree !== subject.snapshot_tree) throw phaseEvidenceError("Phase 0 RED receipt snapshot mismatch");
  }
  const normalizedAllowedFiles = normalizeRuntimeOnlyPaths(subject.allowed_files);
  const generationPath = generationRef("phase-pointer", 1);
  const archivePath = `identity/recovery-archives/phase-result-${pointer.hash}.json`;
  const pointerBody = {
    phase_id: "phase-0", status: "awaiting_review", needs_human: false, recovery_ref: generationPath,
    recovery_hash: "__GENERATION_HASH__", tests: { green: { path: subject.green_test_receipt.ref }, ...(subject.red_test_receipt ? { red: { path: subject.red_test_receipt.ref } } : {}) },
    declared_allowed_files: normalizedAllowedFiles,
  };
  const afterHash = normalizedRecoveryRecordHash("phase-pointer", pointerBody);
  const generationValue = { schema_version: "workflowhub-recovery-generation.v1", project_name: task.identity.projectName, task_id: task.identity.taskId, recovery_kind: "phase-pointer", generation: 1, credential_ref: credential.ref, credential_hash: credential.hash, before: { ref: "phase-result.json", hash: pointer.hash, tree: pointer.value.snapshot_tree ?? baselineSnapshot }, after: { ref: "phase-result.json", hash: afterHash, tree: subject.snapshot_tree }, created_at: new Date().toISOString(), result: "accepted" };
  const generationRaw = canonical(generationValue);
  const generationHash = sha256(generationRaw);
  pointerBody.recovery_hash = generationHash;
  const pointerRaw = canonical(pointerBody);
  task.withRecordLock("locks/build-code-phase-evidence.lock", () => {
    if (readRecoveryGeneration(task, "phase-pointer")) throw recoveryError("RECOVERY_ALREADY_USED", "phase-pointer recovery gate is already consumed");
    if (sha256(task.readRecord("phase-result.json")) !== pointer.hash) throw recoveryError("RECOVERY_CONCURRENT_CHANGE", "Phase pointer changed before recovery");
    try { task.replaceRecoveryPointer({ previousPointerRaw: pointer.raw, pointerRaw, archiveRef: archivePath, archiveRaw: pointer.raw, generationRef: generationPath, generationRaw }); }
    catch (error) { if (error.code?.startsWith("RECOVERY_")) throw error; throw recoveryError(error.message?.includes("changed") ? "RECOVERY_CONCURRENT_CHANGE" : "RECOVERY_RECORD_CONFLICT", error.message); }
    return null;
  });
  let context;
  try {
    const workspace = openAcceptedWorkspace(task, createTaskKernel(task).readAccepted("make-decision"));
    context = { task, kernel: createTaskKernel(task, { workspace }), workspace };
  } catch (error) { throw recoveryError("RECOVERY_PHASE_CONTINUATION_MISMATCH", error.message); }
  let evidence;
  try {
    evidence = publishBuildCodePhaseEvidence(context, {
      phase_id: "phase-0", implementation_receipt_ref: subject.implementation_receipt.ref,
      green_test_receipt_ref: subject.green_test_receipt.ref,
      ...(subject.red_test_receipt ? { red_evidence_ref: subject.red_test_receipt.ref } : {}),
      allowed_files: normalizedAllowedFiles, recovery_ref: generationPath, recovery_hash: generationHash,
    });
  } catch (error) { throw phaseEvidenceError(`Phase 0 evidence publication failed: ${error.message}`); }
  return { recovery_ref: generationPath, recovery_hash: generationHash, phase_id: "phase-0", status: "awaiting_review", canonical_phase_evidence_ref: evidence.canonical_phase_evidence_ref, next_entry: "fresh wh-review" };
}

export function runRecovery(argv = process.argv.slice(2)) {
  const values = parse(argv);
  if (values.help) return helpText();
  if (values.command === "runner-replacement") return runnerReplacement(values);
  if (values.command === "phase-pointer") return phasePointer(values);
  return phaseTraceLineage(values);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { process.stdout.write(`${JSON.stringify(runRecovery(), null, 2)}\n`); }
  catch (error) { process.stderr.write(`${error.code ?? "RECOVERY_ERROR"}: ${error.message}\n`); process.exitCode = 1; }
}

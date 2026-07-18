import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { basename, dirname, isAbsolute, normalize, resolve } from "node:path";

import { assertGitCheckpointPlan, createGitCheckpoint, materializeGitCheckpoint, verifyGitCheckpoint, verifyGitCheckpointPlan } from "./git-checkpoint.mjs";
import { acceptanceModeFor, requiresHumanConfirmation } from "./stage-acceptance-policy.mjs";
import { assertCandidateWorkspace } from "./workspace.mjs";
import factsContract from "../contracts/facts-subschema.json" with { type: "json" };

const STAGES = ["make-decision", "build-spec", "build-plan", "build-code", "verify-code"];
const ATTEMPT_REF = /^attempt-([0-9]{4})\.json$/;
const ACCEPTED_FILE = /^accepted(?:-attempt-([0-9]{4}))?\.json$/;
const REOPEN_REF = /^results\/build-code\/revisions\/reopen-([0-9]{4})\.json$/;
const HASH = /^[a-f0-9]{64}$/;
const EXPECTED_UPSTREAM = Object.freeze({
  "make-decision": null,
  "build-spec": "make-decision",
  "build-plan": "build-spec",
  "build-code": "build-plan",
  "verify-code": "build-code",
});
const INPUT_STAGES = Object.freeze({
  decision: "make-decision",
  spec: "build-spec",
  build_plan: "build-plan",
});
const GIT_OID = /^[a-f0-9]{40}$/i;

const REQUIRED_FACTS = Object.freeze(Object.fromEntries(
  Object.entries(factsContract.stages).map(([stage, contract]) => [stage, Object.freeze([...contract.required_keys])]),
));
const ALLOWED_FACTS = Object.freeze({
  "make-decision": new Set(["worktree_root", "baseline_commit", "snapshot_tree", "decision", "scope", "risks", "decision_ref", "decision_hash", "reviews"]),
  "build-spec": new Set(["spec_ref", "checkpoint", "review"]),
  "build-plan": new Set(["plan_ref", "tasks_ref", "checkpoint", "review"]),
  "build-code": new Set(["changed", "tests", "review", "phase_completion"]),
  "verify-code": new Set(["tests", "review", "evidence_refs", "quality_note"]),
});

function stageName(stage) {
  if (!STAGES.includes(stage)) throw new TypeError(`unsupported stage: ${stage}`);
  return stage;
}

function plain(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${label} must be an object`);
  return value;
}

function parseJson(raw, label) {
  try { return JSON.parse(raw); } catch (error) { throw new Error(`invalid ${label}: ${error.message}`); }
}

function hash(raw) { return createHash("sha256").update(raw).digest("hex"); }

function jsonEquals(left, right) {
  if (left === right) return true;
  if (!left || !right || typeof left !== "object" || typeof right !== "object") return false;
  if (Array.isArray(left) || Array.isArray(right)) {
    return Array.isArray(left) && Array.isArray(right) && left.length === right.length
      && left.every((value, index) => jsonEquals(value, right[index]));
  }
  const leftKeys = Object.keys(left).sort(), rightKeys = Object.keys(right).sort();
  return leftKeys.length === rightKeys.length
    && leftKeys.every((key, index) => key === rightKeys[index] && jsonEquals(left[key], right[key]));
}

function sameAcceptedIdentity(left, right) {
  const { accepted_at: _leftAcceptedAt, ...leftIdentity } = left;
  const { accepted_at: _rightAcceptedAt, ...rightIdentity } = right;
  return jsonEquals(leftIdentity, rightIdentity);
}

function validateRefs(refs, label) {
  if (!Array.isArray(refs)) throw new TypeError(`${label} must be an array`);
  for (const ref of refs) {
    plain(ref, `${label} entry`);
    if (!(typeof ref.task_id === "string" && STAGES.includes(ref.stage) && typeof ref.accepted_ref === "string" && /^results\/(?:make-decision|build-spec|build-plan|build-code|verify-code)\/accepted\.json$/.test(ref.accepted_ref))) {
      throw new TypeError(`${label} entry requires task_id, stage, and relative accepted_ref`);
    }
  }
}

function validateUpstreamAcceptances(entries) {
  if (entries === undefined) return;
  if (!Array.isArray(entries)) throw new TypeError("upstream_acceptances must be an array");
  for (const [index, entry] of entries.entries()) {
    plain(entry, `upstream_acceptances[${index}]`);
    rejectUnknown(entry, new Set(["task_id", "stage", "accepted_ref", "integrity_hash"]), `upstream_acceptances[${index}]`);
    nonemptyString(entry.task_id, `upstream_acceptances[${index}].task_id`);
    stageName(entry.stage);
    if (!/^results\/(?:make-decision|build-spec|build-plan|build-code|verify-code)\/accepted(?:-attempt-[0-9]{4})?\.json$/.test(entry.accepted_ref ?? "")) throw new TypeError("upstream acceptance reference invalid");
    if (!HASH.test(entry.integrity_hash ?? "")) throw new TypeError("upstream acceptance integrity_hash must be sha256");
  }
}

function validateReopenProvenance(value) {
  if (value === undefined) return;
  plain(value, "reopen_provenance");
  rejectUnknown(value, new Set(["reopen_ref", "reopen_hash", "previous_accepted_ref", "previous_accepted_hash", "verify_failure_ref", "verify_failure_hash"]), "reopen_provenance");
  if (!REOPEN_REF.test(value.reopen_ref ?? "")) throw new TypeError("reopen_provenance.reopen_ref invalid");
  if (!/^results\/build-code\/accepted(?:-attempt-[0-9]{4})?\.json$/.test(value.previous_accepted_ref ?? "")) throw new TypeError("reopen_provenance.previous_accepted_ref invalid");
  if (!/^results\/verify-code\/attempt-[0-9]{4}\.json$/.test(value.verify_failure_ref ?? "")) throw new TypeError("reopen_provenance.verify_failure_ref invalid");
  for (const key of ["reopen_hash", "previous_accepted_hash", "verify_failure_hash"]) if (!HASH.test(value[key] ?? "")) throw new TypeError(`reopen_provenance.${key} must be sha256`);
}

function validateStageUpstream(stage, _taskId, refs) {
  const expected = EXPECTED_UPSTREAM[stage];
  if (expected === null) {
    if (refs.length > 1 || refs.some((ref) => ref.stage !== "make-decision" || ref.accepted_ref !== "results/make-decision/accepted.json")) {
      throw new Error("make-decision may declare only its manifest decision input as upstream");
    }
    return;
  }
  if (!refs.some((ref) => ref.stage === expected && ref.accepted_ref === `results/${expected}/accepted.json`)) {
    throw new Error(`${stage} missing accepted upstream reference to ${expected}`);
  }
}

export function validateStageFacts(stage, facts) {
  const name = stageName(stage);
  plain(facts, `${name} facts`);
  const missing = REQUIRED_FACTS[name].filter((key) => !Object.prototype.hasOwnProperty.call(facts, key));
  if (missing.length) throw new Error(`${name} facts missing required keys: ${missing.join(", ")}`);
  const empty = REQUIRED_FACTS[name].filter((key) => facts[key] === null || facts[key] === undefined || facts[key] === "");
  if (empty.length) throw new Error(`${name} facts contain empty required keys: ${empty.join(", ")}`);
  rejectUnknown(facts, ALLOWED_FACTS[name], `${name} facts`);
  if (name === "make-decision") {
    absoluteString(facts.worktree_root, "make-decision facts.worktree_root");
    gitOid(facts.baseline_commit, "make-decision facts.baseline_commit");
    if (facts.snapshot_tree !== undefined) gitOid(facts.snapshot_tree, "make-decision facts.snapshot_tree");
    if ((facts.decision_ref === undefined) !== (facts.decision_hash === undefined)) throw new TypeError("make-decision decision_ref and decision_hash must be provided together");
    if (facts.decision_ref !== undefined) {
      artifactRef(facts.decision_ref, "make-decision facts.decision_ref");
      if (!HASH.test(facts.decision_hash)) throw new TypeError("make-decision facts.decision_hash must be sha256");
    }
  }
  if (name === "build-spec") {
    artifactRef(facts.spec_ref, "build-spec facts.spec_ref");
    validateCheckpointPlan(facts.checkpoint);
  }
  if (name === "build-plan") {
    artifactRef(facts.plan_ref, "build-plan facts.plan_ref");
    artifactRef(facts.tasks_ref, "build-plan facts.tasks_ref");
    validateCheckpointPlan(facts.checkpoint);
  }
  if (name === "build-code") {
    if (!Array.isArray(facts.changed)) throw new TypeError("build-code facts.changed must be an array");
    facts.changed.forEach((ref, index) => artifactRef(ref, `build-code facts.changed[${index}]`));
    validateTests(facts.tests, "build-code facts.tests");
    validateReview(facts.review, "build-code facts.review");
    if (typeof facts.phase_completion !== "boolean" && (!facts.phase_completion || typeof facts.phase_completion !== "object" || Array.isArray(facts.phase_completion))) {
      throw new TypeError("build-code facts.phase_completion must be a boolean or object");
    }
    if (typeof facts.phase_completion === "object") {
      nonemptyString(facts.phase_completion.status, "build-code facts.phase_completion.status");
      artifactRef(facts.phase_completion.evidence_ref, "build-code facts.phase_completion.evidence_ref");
    }
  }
  if (name === "verify-code") {
    validateTests(facts.tests, "verify-code facts.tests");
    validateReview(facts.review, "verify-code facts.review");
    validateEvidenceRefs(facts.evidence_refs, "verify-code facts.evidence_refs");
  }
  return facts;
}

function nonemptyString(value, label) {
  if (typeof value !== "string" || value.trim() === "") throw new TypeError(`${label} must be a non-empty string`);
  return value;
}

function rejectUnknown(value, allowed, label) {
  const unknown = Object.keys(value).filter((key) => !allowed.has(key));
  if (unknown.length) throw new TypeError(`${label} contains unknown fields: ${unknown.join(", ")}`);
}

function absoluteString(value, label) {
  nonemptyString(value, label);
  if (!isAbsolute(value)) throw new TypeError(`${label} must be absolute`);
  return value;
}

function gitOid(value, label) {
  if (!GIT_OID.test(value ?? "")) throw new TypeError(`${label} must be a 40-character Git object id`);
  return value;
}

function artifactRef(value, label) {
  nonemptyString(value, label);
  if (isAbsolute(value) || normalize(value).split(/[\\/]/).includes("..")) throw new TypeError(`${label} must be a task-relative reference`);
  return value;
}

function validateTests(value, label) {
  plain(value, label);
  const allowed = new Set(["command", "exit_code", "command_hash", "snapshot_head", "snapshot_tree", "snapshot_commit", "started_at", "completed_at", "receipt_ref", "receipt_hash", "output_ref", "output_hash"]);
  rejectUnknown(value, allowed, label);
  nonemptyString(value.command, `${label}.command`);
  if (!Number.isInteger(value.exit_code)) throw new TypeError(`${label}.exit_code must be an integer`);
  for (const key of ["command_hash", "receipt_hash", "output_hash"]) if (!HASH.test(value[key] ?? "")) throw new TypeError(`${label}.${key} must be sha256 freshness evidence`);
  gitOid(value.snapshot_head, `${label}.snapshot_head`); gitOid(value.snapshot_tree, `${label}.snapshot_tree`); gitOid(value.snapshot_commit, `${label}.snapshot_commit`);
  for (const key of ["started_at", "completed_at"]) if (!Number.isFinite(Date.parse(value[key]))) throw new TypeError(`${label}.${key} must be an ISO timestamp`);
  artifactRef(value.receipt_ref, `${label}.receipt_ref`);
  artifactRef(value.output_ref, `${label}.output_ref`);
}

function validateReview(value, label) {
  plain(value, label);
  rejectUnknown(value, new Set(["verdict", "result_ref", "result_hash", "snapshot_tree"]), label);
  nonemptyString(value.verdict, `${label}.verdict`);
  artifactRef(value.result_ref, `${label}.result_ref`);
  if (!value.result_ref.startsWith("reviews/results/")) throw new TypeError(`${label}.result_ref must reference a formal wh-review result`);
  if (!HASH.test(value.result_hash ?? "")) throw new TypeError(`${label}.result_hash must be sha256`);
  gitOid(value.snapshot_tree, `${label}.snapshot_tree`);
}

function validateEvidenceRefs(refs, label) {
  if (!Array.isArray(refs)) throw new TypeError(`${label} must be an array`);
  refs.forEach((entry, index) => {
    if (typeof entry === "string") throw new TypeError(`${label}[${index}] must be an authenticated evidence reference object`);
    plain(entry, `${label}[${index}]`);
    rejectUnknown(entry, new Set(["ref", "sha256"]), `${label}[${index}]`);
    artifactRef(entry.ref, `${label}[${index}].ref`);
    if (!HASH.test(entry.sha256 ?? "")) throw new TypeError(`${label}[${index}].sha256 must be sha256`);
  });
}

function validateCheckpoint(checkpoint) {
  plain(checkpoint, "checkpoint");
  rejectUnknown(checkpoint, new Set(["ref", "commit_oid", "tree_oid", "artifacts"]), "checkpoint");
  for (const key of ["ref", "commit_oid", "tree_oid", "artifacts"]) {
    if (!Object.prototype.hasOwnProperty.call(checkpoint, key)) throw new Error(`checkpoint missing ${key}`);
  }
  nonemptyString(checkpoint.ref, "checkpoint.ref");
  gitOid(checkpoint.commit_oid, "checkpoint.commit_oid");
  gitOid(checkpoint.tree_oid, "checkpoint.tree_oid");
  if (!Array.isArray(checkpoint.artifacts)) throw new TypeError("checkpoint.artifacts must be an array");
  checkpoint.artifacts.forEach((record, index) => {
    plain(record, `checkpoint.artifacts[${index}]`);
    rejectUnknown(record, new Set(["path", "blob_oid", "content_hash"]), `checkpoint.artifacts[${index}]`);
    artifactRef(record.path, `checkpoint.artifacts[${index}].path`);
    gitOid(record.blob_oid, `checkpoint.artifacts[${index}].blob_oid`);
    if (!HASH.test(record.content_hash ?? "")) throw new TypeError(`checkpoint.artifacts[${index}].content_hash must be sha256`);
  });
  return checkpoint;
}

function validateCheckpointPlan(plan) {
  plain(plan, "checkpoint plan");
  rejectUnknown(plan, new Set(["schema_version", "stage", "parent_commit", "artifacts", "plan_hash"]), "checkpoint plan");
  if (plan.schema_version !== "git-checkpoint-plan.v1" || !["build-spec", "build-plan"].includes(plan.stage)) throw new Error("checkpoint plan schema/stage invalid");
  gitOid(plan.parent_commit, "checkpoint plan.parent_commit");
  if (!HASH.test(plan.plan_hash ?? "")) throw new Error("checkpoint plan.plan_hash must be sha256");
  if (!Array.isArray(plan.artifacts) || plan.artifacts.length === 0) throw new Error("checkpoint plan.artifacts required");
  plan.artifacts.forEach((record, index) => { plain(record, `checkpoint plan.artifacts[${index}]`); rejectUnknown(record, new Set(["path", "blob_oid", "content_hash"]), `checkpoint plan.artifacts[${index}]`); artifactRef(record.path, `checkpoint plan.artifacts[${index}].path`); gitOid(record.blob_oid, `checkpoint plan.artifacts[${index}].blob_oid`); if (!HASH.test(record.content_hash ?? "")) throw new Error("checkpoint plan artifact content_hash must be sha256"); });
  return plan;
}

export function validateAttempt(attempt, expected = {}) {
  plain(attempt, "attempt");
  if (attempt.schema_version !== "task-attempt.v2") throw new Error("attempt schema_version must be task-attempt.v2");
  const stage = stageName(attempt.stage);
  if (typeof attempt.task_id !== "string" || typeof attempt.attempt_id !== "string") throw new Error("attempt identity fields required");
  if (!Number.isFinite(Date.parse(attempt.created_at))) throw new Error("attempt created_at invalid");
  validateStageFacts(stage, attempt.facts);
  if (!Array.isArray(attempt.missing_items)) throw new Error("attempt missing_items list required");
  validateEvidenceRefs(attempt.evidence_refs, "attempt evidence_refs");
  validateRefs(attempt.upstream_refs, "upstream_refs");
  validateUpstreamAcceptances(attempt.upstream_acceptances);
  validateReopenProvenance(attempt.reopen_provenance);
  if (attempt.reopen_provenance !== undefined && stage !== "build-code") throw new Error("reopen_provenance is only valid for build-code");
  validateStageUpstream(stage, attempt.task_id, attempt.upstream_refs);
  if (expected.taskId && attempt.task_id !== expected.taskId) throw new Error("attempt task identity mismatch");
  if (expected.stage && stage !== expected.stage) throw new Error("attempt stage identity mismatch");
  if (expected.attemptId && attempt.attempt_id !== expected.attemptId) throw new Error("attempt id mismatch");
  return attempt;
}

export function validateAccepted(accepted, expected = {}) {
  plain(accepted, "accepted");
  if (accepted.schema_version !== "task-accepted.v2") throw new Error("accepted schema_version must be task-accepted.v2");
  const stage = stageName(accepted.stage);
  if (!ATTEMPT_REF.test(accepted.attempt_ref ?? "") || !HASH.test(String(accepted.integrity_hash ?? "").replace(/^sha256:/, ""))) throw new Error("accepted attempt_ref/integrity_hash invalid");
  const hasMode = Object.prototype.hasOwnProperty.call(accepted, "acceptance_mode");
  const hasHumanRef = typeof accepted.human_confirmation_ref === "string" && accepted.human_confirmation_ref.trim() !== "";
  if (!hasMode) {
    // Legacy task-accepted.v2 records predate automatic acceptance. They always
    // carry a human ref, including records for stages that are automatic now.
    if (!hasHumanRef) throw new Error("legacy accepted human_confirmation_ref required");
  } else {
    const expectedMode = acceptanceModeFor(stage);
    if (accepted.acceptance_mode !== expectedMode) throw new Error(`accepted acceptance_mode must be ${expectedMode} for ${stage}`);
    if (accepted.acceptance_mode === "human" && !hasHumanRef) throw new Error("accepted human_confirmation_ref required for human acceptance");
    if (accepted.acceptance_mode === "automatic" && Object.prototype.hasOwnProperty.call(accepted, "human_confirmation_ref")) {
      throw new Error("automatic accepted record must not contain human_confirmation_ref");
    }
  }
  if (!Number.isFinite(Date.parse(accepted.accepted_at))) throw new Error("accepted_at invalid");
  validateRefs(accepted.upstream_refs, "accepted upstream_refs");
  if (["build-spec", "build-plan"].includes(stage)) validateCheckpoint(accepted.checkpoint);
  if (expected.taskId && accepted.task_id !== expected.taskId) throw new Error("accepted task identity mismatch");
  if (expected.stage && stage !== expected.stage) throw new Error("accepted stage identity mismatch");
  return accepted;
}

export function buildTaskKernel(taskHandle, { now = () => new Date().toISOString(), workspace, artifacts, candidateWorkspace } = {}, authority) {
  const { assertTaskHandle, openTask, createKernelRecordFor, replaceKernelAcceptedFor } = authority;
  const task = assertTaskHandle(taskHandle);
  const createKernelRecord = createKernelRecordFor(task);
  const replaceKernelAccepted = typeof replaceKernelAcceptedFor === "function" ? replaceKernelAcceptedFor(task) : undefined;
  const candidate = candidateWorkspace === undefined ? undefined : assertCandidateWorkspace(candidateWorkspace);
  const verifyCandidateSnapshot = (facts) => {
    if (!candidate) return;
    const snapshot = candidate.captureSnapshot();
    if (snapshot.head !== facts.baseline_commit) throw new Error("make-decision CandidateWorkspace HEAD changed from baseline");
    if (facts.snapshot_tree !== undefined) {
      if (snapshot.tree !== facts.snapshot_tree) throw new Error("make-decision CandidateWorkspace snapshot_tree changed after publication");
      return;
    }
    const baselineTree = String(execFileSync("git", ["rev-parse", `${facts.baseline_commit}^{tree}`], {
      cwd: candidate.worktreeRoot, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
    })).trim();
    if (snapshot.tree !== baselineTree) throw new Error("legacy make-decision attempt cannot accept unbound CandidateWorkspace changes");
  };
  const verifyCheckpoint = (stage, checkpoint, { live = true } = {}) => verifyGitCheckpoint({
    repoRoot: workspace?.worktreeRoot ?? task.manifest.target_repo_root,
    checkpoint,
    projectName: task.identity.projectName,
    taskId: task.identity.taskId,
    stage,
    artifacts: live ? artifacts : undefined,
  });
  const archivedAcceptedFileFor = (attemptRef) => `accepted-${attemptRef}`;
  const readAcceptedAt = (name, acceptedFile) => {
    if (!ACCEPTED_FILE.test(acceptedFile)) throw new Error("invalid accepted record name");
    const acceptedRef = `results/${name}/${acceptedFile}`;
    const acceptedRaw = task.readRecord(acceptedRef);
    const accepted = validateAccepted(parseJson(acceptedRaw, `${name} ${acceptedFile}`), { taskId: task.identity.taskId, stage: name });
    const attemptRaw = task.readRecord(`results/${name}/${accepted.attempt_ref}`);
    const expectedHash = String(accepted.integrity_hash).replace(/^sha256:/, "");
    if (expectedHash !== hash(attemptRaw)) throw new Error(`${name} accepted integrity hash mismatch`);
    const attempt = validateAttempt(parseJson(attemptRaw, `${name} attempt`), { taskId: task.identity.taskId, stage: name });
    if (accepted.upstream_refs.length !== attempt.upstream_refs.length || JSON.stringify(accepted.upstream_refs) !== JSON.stringify(attempt.upstream_refs)) throw new Error(`${name} accepted upstream refs mismatch`);
    if (["build-spec", "build-plan"].includes(name)) verifyCheckpoint(name, accepted.checkpoint);
    const facts = accepted.checkpoint ? { ...structuredClone(attempt.facts), checkpoint: structuredClone(accepted.checkpoint) } : attempt.facts;
    return deepFreeze({ accepted_ref: acceptedRef, accepted_hash: hash(acceptedRaw), accepted, attempt, facts });
  };
  const readAcceptedLocal = (stage) => {
    const name = stageName(stage);
    return readAcceptedAt(name, "accepted.json");
  };
  const verifyUpstream = (stage, refs) => {
    validateStageUpstream(stage, task.identity.taskId, refs);
    const bindings = [];
    for (const ref of refs) {
      if (ref.task_id === task.identity.taskId) {
        const source = readAcceptedLocal(ref.stage);
        bindings.push({ task_id: source.accepted.task_id, stage: source.accepted.stage, accepted_ref: source.accepted_ref, integrity_hash: String(source.accepted.integrity_hash).replace(/^sha256:/, "") });
        continue;
      }
      const slot = Object.entries(INPUT_STAGES).find(([name, inputStage]) => inputStage === ref.stage
        && Object.prototype.hasOwnProperty.call(task.manifest.inputs ?? {}, name))?.[0];
      if (!slot) throw new Error(`${stage} upstream task identity is not declared by a manifest input`);
      const source = kernel.readInput(slot);
      if (source.accepted.task_id !== ref.task_id || source.accepted.stage !== ref.stage) throw new Error(`${stage} upstream source identity mismatch`);
      bindings.push({ task_id: source.accepted.task_id, stage: source.accepted.stage, accepted_ref: source.accepted_ref, integrity_hash: String(source.accepted.integrity_hash).replace(/^sha256:/, "") });
    }
    return bindings;
  };
  const readReopen = (reopenRef) => {
    if (!REOPEN_REF.test(reopenRef ?? "")) throw new Error("invalid build-code reopen reference");
    const raw = task.readRecord(reopenRef);
    const record = parseJson(raw, "build-code reopen record");
    plain(record, "build-code reopen record");
    rejectUnknown(record, new Set(["schema_version", "task_id", "stage", "previous_accepted_ref", "previous_accepted_hash", "previous_attempt_ref", "previous_attempt_hash", "verify_failure_ref", "verify_failure_hash", "failure_evidence_ref", "failure_evidence_hash", "reopened_at"]), "build-code reopen record");
    if (record.schema_version !== "stage-reopen.v1" || record.task_id !== task.identity.taskId || record.stage !== "build-code" ||
      !/^results\/build-code\/accepted(?:-attempt-[0-9]{4})?\.json$/.test(record.previous_accepted_ref ?? "") ||
      !ATTEMPT_REF.test(record.previous_attempt_ref ?? "") || !/^results\/verify-code\/attempt-[0-9]{4}\.json$/.test(record.verify_failure_ref ?? "") ||
      !/^evidence\/[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(record.failure_evidence_ref ?? "") || !Number.isFinite(Date.parse(record.reopened_at))) throw new Error("invalid build-code reopen record");
    for (const key of ["previous_accepted_hash", "previous_attempt_hash", "verify_failure_hash", "failure_evidence_hash"]) if (!HASH.test(record[key] ?? "")) throw new Error(`invalid build-code reopen ${key}`);
    return { ref: reopenRef, raw, hash: hash(raw), record };
  };
  const assertReopenProvenance = (provenance, current) => {
    validateReopenProvenance(provenance);
    if (!provenance) throw new Error("build-code accepted stage requires controlled reopen provenance");
    const reopen = readReopen(provenance.reopen_ref);
    if (provenance.reopen_hash !== reopen.hash || provenance.previous_accepted_ref !== current.accepted_ref || provenance.previous_accepted_hash !== current.accepted_hash ||
      provenance.previous_accepted_ref !== reopen.record.previous_accepted_ref || provenance.previous_accepted_hash !== reopen.record.previous_accepted_hash ||
      provenance.verify_failure_ref !== reopen.record.verify_failure_ref || provenance.verify_failure_hash !== reopen.record.verify_failure_hash) {
      throw new Error("build-code reopen provenance does not match the active accepted record");
    }
    return reopen;
  };
  const verifyFailureEvidence = (verifyAttempt, evidenceRef) => {
    if (!/^evidence\/[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(evidenceRef ?? "")) throw new Error("failure evidence must be a canonical evidence reference");
    const entry = verifyAttempt.facts.evidence_refs.find((item) => item.ref === evidenceRef);
    if (!entry) throw new Error("failure evidence is not declared by the verify-code attempt");
    const raw = task.readRecord(entry.ref);
    if (hash(raw) !== entry.sha256) throw new Error("failure evidence hash mismatch");
    const value = parseJson(raw, "failure evidence");
    if (!value || value.schema_version !== "acceptance-evidence.v1" || typeof value.acceptance_criterion_id !== "string" || value.acceptance_criterion_id.trim() === "" || value.result !== "fail" || !Array.isArray(value.refs)) {
      throw new Error("failure evidence must be acceptance-evidence.v1 with result=fail");
    }
    return { ref: entry.ref, hash: entry.sha256 };
  };
  const kernel = {
    task,
    publishCanonicalRecord(relativePath, data) {
      if (typeof relativePath !== "string" || !/^(?:receipts|reviews|evidence)\//.test(relativePath) || relativePath.includes("..")) throw new Error("canonical receipt namespace required");
      return createKernelRecord(relativePath, data);
    },
    createCheckpoint(stage) {
      if (!workspace || !artifacts) throw new Error("Git checkpoint requires Workspace and ArtifactDir capabilities");
      return createGitCheckpoint({ workspace, artifacts, task, stage: stageName(stage) });
    },
    publishAttempt(stage, data = {}) {
      const name = stageName(stage);
      return task.withRecordLock(`locks/${name}.publication.lock`, () => {
        let current;
        try { current = readAcceptedLocal(name); }
        catch (error) { if (error?.code !== "ENOENT") throw error; }
        if (current && name !== "build-code") throw new Error(`${name} is accepted and closed`);
        if (current) assertReopenProvenance(data.reopen_provenance, current);
        if (!current && data.reopen_provenance !== undefined) throw new Error("build-code reopen provenance requires an accepted build-code stage");
        validateRefs(data.upstream_refs ?? [], "upstream_refs");
        if (data.upstream_acceptances !== undefined) throw new Error("upstream_acceptances are kernel-derived and cannot be supplied");
        const upstreamAcceptances = verifyUpstream(name, data.upstream_refs ?? []);
        validateStageFacts(name, data.facts);
        if (name === "make-decision" && candidate && (resolve(data.facts.worktree_root) !== candidate.worktreeRoot || data.facts.baseline_commit !== candidate.baselineCommit)) {
          throw new Error("make-decision facts do not match CandidateWorkspace");
        }
        if (name === "make-decision") verifyCandidateSnapshot(data.facts);
        if (["build-spec", "build-plan"].includes(name)) {
          assertGitCheckpointPlan(data.facts.checkpoint);
          if (data.checkpoint !== undefined && data.checkpoint !== data.facts.checkpoint) throw new Error("caller checkpoint override is forbidden");
          verifyGitCheckpointPlan({ workspace, artifacts, task, plan: data.facts.checkpoint });
        }
        for (let sequence = 1; sequence <= 9999; sequence += 1) {
          const filename = `attempt-${String(sequence).padStart(4, "0")}.json`;
          const attempt = {
            schema_version: "task-attempt.v2",
            task_id: task.identity.taskId,
            stage: name,
            attempt_id: `${name}:${filename.slice(0, -5)}`,
            created_at: data.created_at ?? now(),
            facts: structuredClone(data.facts),
            evidence_refs: [...(data.evidence_refs ?? [])],
            missing_items: [...(data.missing_items ?? [])],
            upstream_refs: structuredClone(data.upstream_refs ?? []),
            ...(upstreamAcceptances.length ? { upstream_acceptances: upstreamAcceptances } : {}),
            ...(data.reopen_provenance ? { reopen_provenance: structuredClone(data.reopen_provenance) } : {}),
            ...((data.checkpoint ?? data.facts.checkpoint) ? { checkpoint: structuredClone(data.checkpoint ?? data.facts.checkpoint) } : {}),
            ...(data.reason !== undefined ? { reason: String(data.reason) } : {}),
          };
          validateAttempt(attempt, { taskId: task.identity.taskId, stage: name, attemptId: attempt.attempt_id });
          const raw = `${JSON.stringify(attempt, null, 2)}\n`;
          try {
            createKernelRecord(`results/${name}/${filename}`, raw);
            return deepFreeze({ attempt_ref: filename, integrity_hash: hash(raw), attempt });
          } catch (error) {
            if (error?.code !== "EEXIST") throw error;
          }
        }
        throw new Error(`${name} attempt sequence exhausted`);
      });
    },
    confirmAttempt(stage, attemptRef, decision) {
      const name = stageName(stage);
      if (!requiresHumanConfirmation(name)) throw new Error(`${name} uses automatic acceptance and does not accept human confirmation`);
      if (!ATTEMPT_REF.test(attemptRef ?? "")) throw new Error("invalid attemptRef");
      if (!new Set(["accepted", "rejected"]).has(decision)) throw new TypeError("explicit confirmation decision must be accepted or rejected");
      const attempt = validateAttempt(parseJson(task.readRecord(`results/${name}/${attemptRef}`), `${name} attempt`), { taskId: task.identity.taskId, stage: name });
      const record = { schema_version: "human-confirmation.v1", task_id: task.identity.taskId, stage: name, attempt_ref: attemptRef, decision, confirmed_at: now(),
        ...(attempt.checkpoint ? { checkpoint_plan_hash: attempt.checkpoint.plan_hash } : {}) };
      const ref = `confirmations/${name}/${attemptRef}`;
      createKernelRecord(ref, `${JSON.stringify(record, null, 2)}\n`);
      return deepFreeze({ ref, confirmation: record });
    },
    acceptAttempt(stage, attemptRef, humanConfirmationRef) {
      if (arguments.length > 3) throw new TypeError("caller checkpoint override is forbidden; acceptance uses the published attempt checkpoint");
      const name = stageName(stage);
      const acceptanceMode = acceptanceModeFor(name);
      if (acceptanceMode === "automatic" && humanConfirmationRef !== undefined) {
        throw new TypeError(`${name} uses automatic acceptance; omit humanConfirmationRef`);
      }
      if (acceptanceMode === "human" && (typeof humanConfirmationRef !== "string" || humanConfirmationRef.trim() === "")) {
        throw new TypeError(`${name} requires explicit humanConfirmationRef`);
      }
      return task.withRecordLock(`locks/${name}.publication.lock`, () => {
        if (!ATTEMPT_REF.test(attemptRef ?? "")) throw new Error("invalid attemptRef");
        const attemptRaw = task.readRecord(`results/${name}/${attemptRef}`);
        const attempt = validateAttempt(parseJson(attemptRaw, `${name} attempt`), { taskId: task.identity.taskId, stage: name });
        let current;
        try { current = readAcceptedLocal(name); }
        catch (error) { if (error?.code !== "ENOENT") throw error; }
        if (current && name !== "build-code") throw new Error(`${name} is accepted and closed`);
        if (current) assertReopenProvenance(attempt.reopen_provenance, current);
        if (!current && attempt.reopen_provenance !== undefined) throw new Error("build-code reopen provenance requires an accepted build-code stage");
        if (name === "make-decision" && candidate) {
          if (resolve(attempt.facts.worktree_root) !== candidate.worktreeRoot || attempt.facts.baseline_commit !== candidate.baselineCommit) {
            throw new Error("make-decision facts do not match CandidateWorkspace");
          }
          verifyCandidateSnapshot(attempt.facts);
        }
        verifyUpstream(name, attempt.upstream_refs);
        let confirmation;
        if (acceptanceMode === "human") {
          confirmation = parseJson(task.readRecord(humanConfirmationRef), "human confirmation");
          rejectUnknown(confirmation, new Set(["schema_version", "task_id", "stage", "attempt_ref", "decision", "confirmed_at", "checkpoint_plan_hash"]), "human confirmation");
          if (confirmation.decision === "rejected") {
            throw new Error("rejected confirmation leaves checkpoint ref unpublished");
          }
          if (confirmation.schema_version !== "human-confirmation.v1" || confirmation.task_id !== task.identity.taskId || confirmation.stage !== name || confirmation.attempt_ref !== attemptRef || confirmation.decision !== "accepted" || !Number.isFinite(Date.parse(confirmation.confirmed_at))) throw new Error("human confirmation does not bind this task/stage/attempt");
        }
        let acceptedCheckpoint;
        if (["build-spec", "build-plan"].includes(name)) {
          if (!workspace || !artifacts) throw new Error("accepting a design checkpoint requires Workspace and ArtifactDir capabilities");
          if (acceptanceMode === "human" && confirmation.checkpoint_plan_hash !== attempt.checkpoint.plan_hash) throw new Error("human confirmation checkpoint plan hash mismatch");
          acceptedCheckpoint = materializeGitCheckpoint({ workspace, artifacts, task, plan: attempt.checkpoint, publishRef: (ref, commit, zeroOid) => {
            execFileSync("git", ["update-ref", ref, commit, zeroOid], { cwd: workspace.worktreeRoot, stdio: "ignore" });
          } });
          execFileSync("git", ["merge-base", "--is-ancestor", attempt.checkpoint.parent_commit, acceptedCheckpoint.commit_oid], { cwd: workspace.worktreeRoot, stdio: "ignore" });
        }
        const accepted = {
          schema_version: "task-accepted.v2",
          task_id: task.identity.taskId,
          stage: name,
          attempt_ref: attemptRef,
          integrity_hash: hash(attemptRaw),
          acceptance_mode: acceptanceMode,
          ...(acceptanceMode === "human" ? { human_confirmation_ref: humanConfirmationRef } : {}),
          accepted_at: now(),
          upstream_refs: structuredClone(attempt.upstream_refs),
          ...(acceptedCheckpoint ? { checkpoint: structuredClone(acceptedCheckpoint) } : {}),
        };
        validateAccepted(accepted, { taskId: task.identity.taskId, stage: name });
        const acceptedRaw = `${JSON.stringify(accepted, null, 2)}\n`;
        if (!current) {
          createKernelRecord(`results/${name}/accepted.json`, acceptedRaw);
          return deepFreeze(accepted);
        }
        if (typeof replaceKernelAccepted !== "function") throw new Error("kernel canonical accepted replacement authority is required");
        const priorRaw = task.readRecord("results/build-code/accepted.json");
        const archiveRef = `results/build-code/${archivedAcceptedFileFor(current.accepted.attempt_ref)}`;
        try { createKernelRecord(archiveRef, priorRaw); }
        catch (error) {
          if (error?.code !== "EEXIST") throw error;
          const archived = readAcceptedAt("build-code", archivedAcceptedFileFor(current.accepted.attempt_ref));
          if (!sameAcceptedIdentity(archived.accepted, current.accepted)) throw new Error("build-code accepted archive conflicts with canonical record");
        }
        replaceKernelAccepted("results/build-code/accepted.json", acceptedRaw);
        return deepFreeze(accepted);
      });
    },
    reopenBuildCode({ verifyAttemptRef, failureEvidenceRef } = {}) {
      if (!ATTEMPT_REF.test(verifyAttemptRef ?? "")) throw new Error("valid verify-code attempt reference is required");
      return task.withRecordLock("locks/build-code.publication.lock", () => {
        const current = readAcceptedLocal("build-code");
        const verifyRef = `results/verify-code/${verifyAttemptRef}`;
        const verifyRaw = task.readRecord(verifyRef);
        const verifyAttempt = validateAttempt(parseJson(verifyRaw, "verify-code failure attempt"), { taskId: task.identity.taskId, stage: "verify-code", attemptId: `verify-code:${verifyAttemptRef.slice(0, -5)}` });
        const expectedUpstream = verifyAttempt.upstream_refs.filter((ref) => ref.task_id === task.identity.taskId && ref.stage === "build-code" && ref.accepted_ref === "results/build-code/accepted.json");
        if (expectedUpstream.length !== 1) throw new Error("verify-code failure does not reference this task's build-code acceptance");
        const binding = (verifyAttempt.upstream_acceptances ?? []).find((entry) => entry.task_id === task.identity.taskId && entry.stage === "build-code");
        if (binding && (binding.accepted_ref !== current.accepted_ref || binding.integrity_hash !== String(current.accepted.integrity_hash).replace(/^sha256:/, ""))) throw new Error("verify-code failure source does not match the active build-code acceptance");
        if (!binding && current.accepted_ref !== "results/build-code/accepted.json") throw new Error("legacy verify-code failure cannot reopen a revised build-code acceptance");
        const failure = verifyFailureEvidence(verifyAttempt, failureEvidenceRef);
        for (let sequence = 1; sequence <= 9999; sequence += 1) {
          const reopenRef = `results/build-code/revisions/reopen-${String(sequence).padStart(4, "0")}.json`;
          try {
            const existing = readReopen(reopenRef);
            if (existing.record.verify_failure_ref === verifyRef || existing.record.previous_accepted_hash === current.accepted_hash) throw new Error("build-code reopen already exists for this failure or accepted record");
          } catch (error) {
            if (error?.code !== "ENOENT") throw error;
            const record = {
              schema_version: "stage-reopen.v1", task_id: task.identity.taskId, stage: "build-code",
              previous_accepted_ref: current.accepted_ref, previous_accepted_hash: current.accepted_hash,
              previous_attempt_ref: current.accepted.attempt_ref, previous_attempt_hash: String(current.accepted.integrity_hash).replace(/^sha256:/, ""),
              verify_failure_ref: verifyRef, verify_failure_hash: hash(verifyRaw),
              failure_evidence_ref: failure.ref, failure_evidence_hash: failure.hash, reopened_at: now(),
            };
            const raw = `${JSON.stringify(record, null, 2)}\n`;
            createKernelRecord(reopenRef, raw);
            return deepFreeze({ reopen_ref: reopenRef, reopen_hash: hash(raw), previous_accepted_ref: record.previous_accepted_ref, previous_accepted_hash: record.previous_accepted_hash, verify_failure_ref: record.verify_failure_ref, verify_failure_hash: record.verify_failure_hash });
          }
        }
        throw new Error("build-code reopen sequence exhausted");
      });
    },
    buildCodeReopenProvenance(reopenRef) {
      const current = readAcceptedLocal("build-code");
      const reopen = readReopen(reopenRef);
      if (reopen.record.previous_accepted_ref !== current.accepted_ref || reopen.record.previous_accepted_hash !== current.accepted_hash) throw new Error("build-code reopen is not authorized for the active accepted record");
      return deepFreeze({ reopen_ref: reopen.ref, reopen_hash: reopen.hash, previous_accepted_ref: reopen.record.previous_accepted_ref, previous_accepted_hash: reopen.record.previous_accepted_hash, verify_failure_ref: reopen.record.verify_failure_ref, verify_failure_hash: reopen.record.verify_failure_hash });
    },
    readAccepted(stage) {
      return readAcceptedLocal(stage);
    },
    readInput(slot) {
      const stage = INPUT_STAGES[slot];
      if (!stage || !Object.prototype.hasOwnProperty.call(task.manifest.inputs ?? {}, slot)) {
        throw new Error(`unknown or undeclared input slot: ${slot}`);
      }
      const acceptedPath = task.manifest.inputs[slot];
      absoluteString(acceptedPath, `input ${slot}`);
      const stageDirectory = dirname(acceptedPath);
      const sourceTaskPath = dirname(dirname(stageDirectory));
      const expectedPath = resolve(sourceTaskPath, "results", stage, "accepted.json");
      if (resolve(acceptedPath) !== expectedPath || basename(stageDirectory) !== stage) {
        throw new Error(`input ${slot} must reference accepted ${stage} output`);
      }
      const sourceTaskId = basename(sourceTaskPath);
      const sourceProjectName = basename(dirname(dirname(sourceTaskPath)));
      const sourceTask = openTask(sourceTaskPath, { projectName: sourceProjectName, taskId: sourceTaskId });
      const result = buildTaskKernel(sourceTask, { now }, authority).readAccepted(stage);
      if (["build-spec", "build-plan"].includes(stage)) verifyGitCheckpoint({
        repoRoot: sourceTask.manifest.target_repo_root,
        checkpoint: result.accepted.checkpoint,
        projectName: sourceTask.identity.projectName,
        taskId: sourceTask.identity.taskId,
        stage,
      });
      return result;
    },
    publishInput(slot) {
      throw new Error(`input slot ${slot} is read-only; publishing inputs is unsupported`);
    },
  };
  return kernel;
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

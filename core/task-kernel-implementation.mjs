import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { basename, dirname, isAbsolute, normalize, resolve } from "node:path";

import { verifyGitCheckpoint } from "./git-checkpoint.mjs";
import { captureTaskSnapshotV1Sync, validateTaskSnapshotV1 } from "./task-snapshot.mjs";
import { acceptanceModeFor, requiresHumanConfirmation } from "./stage-acceptance-policy.mjs";
import { assertCandidateWorkspace } from "./workspace.mjs";
import { consumeTaskHumanConfirmation } from "./human-confirmation.mjs";
import factsContract from "../contracts/facts-subschema.json" with { type: "json" };

const STAGES = ["make-decision", "build-spec", "build-plan", "build-code", "verify-code"];
const ATTEMPT_REF = /^attempt-([0-9]{4})\.json$/;
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

function validateRefs(refs, label) {
  if (!Array.isArray(refs)) throw new TypeError(`${label} must be an array`);
  for (const ref of refs) {
    plain(ref, `${label} entry`);
    if (!(typeof ref.task_id === "string" && STAGES.includes(ref.stage) && typeof ref.accepted_ref === "string" && /^results\/(?:make-decision|build-spec|build-plan|build-code|verify-code)\/accepted\.json$/.test(ref.accepted_ref))) {
      throw new TypeError(`${label} entry requires task_id, stage, and relative accepted_ref`);
    }
  }
}

function validateV1Refs(refs, label) {
  if (!Array.isArray(refs)) throw new TypeError(`${label} must be an array`);
  for (const entry of refs) {
    plain(entry, `${label} entry`);
    rejectUnknown(entry, new Set(["ref", "sha256"]), `${label} entry`);
    if (!/^results\/(?:make-decision|build-spec|build-plan|build-code|verify-code)\/accepted\.json$/.test(entry.ref ?? "") || !HASH.test(entry.sha256 ?? "")) {
      throw new TypeError(`${label} entry requires exact accepted ref/hash`);
    }
  }
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
  const allowed = new Set(["command", "exit_code", "command_hash", "snapshot_head", "snapshot_tree", "snapshot_ref", "snapshot_hash", "snapshot_commit", "started_at", "completed_at", "receipt_ref", "receipt_hash", "output_ref", "output_hash"]);
  rejectUnknown(value, allowed, label);
  nonemptyString(value.command, `${label}.command`);
  if (!Number.isInteger(value.exit_code)) throw new TypeError(`${label}.exit_code must be an integer`);
  for (const key of ["command_hash", "receipt_hash", "output_hash"]) if (!HASH.test(value[key] ?? "")) throw new TypeError(`${label}.${key} must be sha256 freshness evidence`);
  gitOid(value.snapshot_head, `${label}.snapshot_head`); gitOid(value.snapshot_tree, `${label}.snapshot_tree`);
  if (value.snapshot_ref === undefined) gitOid(value.snapshot_commit, `${label}.snapshot_commit`);
  else { nonemptyString(value.snapshot_ref, `${label}.snapshot_ref`); if (!HASH.test(value.snapshot_hash ?? "")) throw new TypeError(`${label}.snapshot_hash must be sha256 freshness evidence`); }
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
  validateTaskSnapshotV1(plan);
  return plan;
}

export function validateAttempt(attempt, expected = {}) {
  plain(attempt, "attempt");
  if (attempt.schema_version === "1.0.0") {
    if (attempt.schema_id !== "https://workflowhub.dev/schemas/task-attempt.v1.schema.json") throw new Error("attempt schema_id must be task-attempt.v1");
    const stage = stageName(attempt.stage);
    if (typeof attempt.task_id !== "string" || !/^attempt-[0-9]{4}$/.test(attempt.attempt_id ?? "")) throw new Error("attempt identity fields required");
    if (!Number.isFinite(Date.parse(attempt.created_at))) throw new Error("attempt created_at invalid");
    plain(attempt.facts, "attempt facts");
    rejectUnknown(attempt.facts, new Set(["result_ref", "result_hash"]), "attempt facts");
    artifactRef(attempt.facts.result_ref, "attempt facts.result_ref");
    if (!HASH.test(attempt.facts.result_hash ?? "")) throw new Error("attempt facts.result_hash must be sha256");
    if (!Array.isArray(attempt.missing_items)) throw new Error("attempt missing_items list required");
    validateEvidenceRefs(attempt.evidence_refs, "attempt evidence_refs");
    validateV1Refs(attempt.upstream_refs, "upstream_refs");
    if (expected.taskId && attempt.task_id !== expected.taskId) throw new Error("attempt task identity mismatch");
    if (expected.stage && stage !== expected.stage) throw new Error("attempt stage identity mismatch");
    if (expected.attemptId && attempt.attempt_id !== expected.attemptId) throw new Error("attempt id mismatch");
    return attempt;
  }
  if (attempt.schema_version !== "task-attempt.v2") throw new Error("attempt schema_version must be task-attempt.v2 or v1");
  const stage = stageName(attempt.stage);
  if (typeof attempt.task_id !== "string" || typeof attempt.attempt_id !== "string") throw new Error("attempt identity fields required");
  if (!Number.isFinite(Date.parse(attempt.created_at))) throw new Error("attempt created_at invalid");
  validateStageFacts(stage, attempt.facts);
  if (!Array.isArray(attempt.missing_items)) throw new Error("attempt missing_items list required");
  validateEvidenceRefs(attempt.evidence_refs, "attempt evidence_refs");
  validateRefs(attempt.upstream_refs, "upstream_refs");
  validateStageUpstream(stage, attempt.task_id, attempt.upstream_refs);
  if (expected.taskId && attempt.task_id !== expected.taskId) throw new Error("attempt task identity mismatch");
  if (expected.stage && stage !== expected.stage) throw new Error("attempt stage identity mismatch");
  if (expected.attemptId && attempt.attempt_id !== expected.attemptId) throw new Error("attempt id mismatch");
  return attempt;
}

export function validateAccepted(accepted, expected = {}) {
  plain(accepted, "accepted");
    if (accepted.schema_version === "1.0.0") {
    if (accepted.schema_id !== "https://workflowhub.dev/schemas/task-accepted.v1.schema.json") throw new Error("accepted schema_id must be task-accepted.v1");
    const stage = stageName(accepted.stage);
    if (!/^results\/(?:make-decision|build-spec|build-plan|build-code|verify-code)\/attempt-[0-9]{4}\.json$/.test(accepted.attempt_ref ?? "") || !HASH.test(accepted.attempt_hash ?? "")) throw new Error("accepted attempt_ref/attempt_hash invalid");
    const expectedMode = acceptanceModeFor(stage);
    if (accepted.acceptance_mode !== expectedMode) throw new Error(`accepted acceptance_mode must be ${expectedMode} for ${stage}`);
    if (expectedMode === "human" && typeof accepted.confirmation_ref !== "string") throw new Error("accepted confirmation_ref required for human acceptance");
    if (expectedMode === "automatic" && Object.prototype.hasOwnProperty.call(accepted, "confirmation_ref")) throw new Error("automatic accepted record must not contain confirmation_ref");
    if (!Number.isFinite(Date.parse(accepted.accepted_at))) throw new Error("accepted_at invalid");
    validateV1Refs(accepted.upstream_refs, "accepted upstream_refs");
    artifactRef(accepted.snapshot_ref, "accepted snapshot_ref");
    if (!HASH.test(accepted.snapshot_hash ?? "")) throw new Error("accepted snapshot_hash must be sha256");
    if (expected.taskId && accepted.task_id !== expected.taskId) throw new Error("accepted task identity mismatch");
    if (expected.stage && stage !== expected.stage) throw new Error("accepted stage identity mismatch");
    return accepted;
  }
  if (accepted.schema_version !== "task-accepted.v2") throw new Error("accepted schema_version must be task-accepted.v2 or v1");
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

export function buildTaskKernel(taskHandle, { now = () => new Date().toISOString(), workspace, artifacts, candidateWorkspace, confirmationVerification = {} } = {}, authority) {
  const { assertTaskHandle, openTask, createKernelRecordFor } = authority;
  const task = assertTaskHandle(taskHandle);
  const createKernelRecord = createKernelRecordFor(task);
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
  const readAcceptedLocal = (stage) => {
    const name = stageName(stage);
    const acceptedRef = `results/${name}/accepted.json`;
    const acceptedRaw = task.readRecord(acceptedRef);
    const accepted = validateAccepted(parseJson(acceptedRaw, `${name} accepted.json`), { taskId: task.identity.taskId, stage: name });
    const attemptPath = accepted.schema_version === "1.0.0" ? accepted.attempt_ref : `results/${name}/${accepted.attempt_ref}`;
    const attemptRaw = task.readRecord(attemptPath);
    const expectedHash = accepted.schema_version === "1.0.0" ? accepted.attempt_hash : String(accepted.integrity_hash).replace(/^sha256:/, "");
    if (expectedHash !== hash(attemptRaw)) throw new Error(`${name} accepted integrity hash mismatch`);
    const attempt = validateAttempt(parseJson(attemptRaw, `${name} attempt`), { taskId: task.identity.taskId, stage: name });
    if (accepted.upstream_refs.length !== attempt.upstream_refs.length || JSON.stringify(accepted.upstream_refs) !== JSON.stringify(attempt.upstream_refs)) throw new Error(`${name} accepted upstream refs mismatch`);
    if (accepted.schema_version === "1.0.0" && accepted.snapshot_ref !== undefined) {
      const snapshotRaw = task.readRecord(accepted.snapshot_ref);
      if (hash(snapshotRaw) !== accepted.snapshot_hash) throw new Error(`${name} accepted snapshot hash mismatch`);
      validateTaskSnapshotV1(parseJson(snapshotRaw, `${name} task snapshot`), { taskId: task.identity.taskId });
    }
    if (accepted.schema_version !== "1.0.0" && ["build-spec", "build-plan"].includes(name)) verifyCheckpoint(name, accepted.checkpoint);
    let facts;
    if (attempt.schema_version === "1.0.0") {
      const resultRaw = task.readRecord(attempt.facts.result_ref);
      if (hash(resultRaw) !== attempt.facts.result_hash) throw new Error(`${name} attempt result hash mismatch`);
      facts = parseJson(resultRaw, `${name} stage result`);
      validateStageFacts(name, facts);
    } else {
      facts = accepted.checkpoint ? { ...structuredClone(attempt.facts), checkpoint: structuredClone(accepted.checkpoint) } : attempt.facts;
    }
    return deepFreeze({ accepted, attempt, facts, accepted_ref: acceptedRef, accepted_hash: hash(acceptedRaw) });
  };
  const verifyUpstream = (stage, refs) => {
    if (refs.every((entry) => Object.prototype.hasOwnProperty.call(entry, "ref"))) {
      const expected = EXPECTED_UPSTREAM[stage];
      if (expected === null) {
        if (refs.length !== 0) throw new Error(`${stage} must not declare an accepted upstream`);
        return;
      }
      if (refs.length !== 1 || refs[0].ref !== `results/${expected}/accepted.json`) throw new Error(`${stage} missing exact accepted upstream reference to ${expected}`);
      const raw = task.readRecord(refs[0].ref);
      if (hash(raw) !== refs[0].sha256) throw new Error(`${stage} accepted upstream hash mismatch`);
      readAcceptedLocal(expected);
      return;
    }
    validateStageUpstream(stage, task.identity.taskId, refs);
    for (const ref of refs) {
      if (ref.task_id === task.identity.taskId) {
        readAcceptedLocal(ref.stage);
        continue;
      }
      const slot = Object.entries(INPUT_STAGES).find(([name, inputStage]) => inputStage === ref.stage
        && Object.prototype.hasOwnProperty.call(task.manifest.inputs ?? {}, name))?.[0];
      if (!slot) throw new Error(`${stage} upstream task identity is not declared by a manifest input`);
      const source = kernel.readInput(slot);
      if (source.accepted.task_id !== ref.task_id || source.accepted.stage !== ref.stage) throw new Error(`${stage} upstream source identity mismatch`);
    }
  };
  const kernel = {
    task,
    publishCanonicalRecord(relativePath, data) {
      if (typeof relativePath !== "string" || !/^(?:receipts|reviews|evidence)\//.test(relativePath) || relativePath.includes("..")) throw new Error("canonical receipt namespace required");
      return createKernelRecord(relativePath, data);
    },
    createCheckpoint(stage) {
      stageName(stage);
      if (!workspace) throw new Error("task snapshot requires Workspace capability");
      return captureTaskSnapshotV1Sync({ taskId: task.identity.taskId, workspaceRoot: workspace.worktreeRoot, baselineCommit: workspace.baselineCommit, capturedAt: now() });
    },
    publishAttempt(stage, data = {}) {
      const name = stageName(stage);
      return task.withRecordLock(`locks/${name}.publication.lock`, () => {
        try {
          task.readRecord(`results/${name}/accepted.json`);
          throw new Error(`${name} is accepted and closed`);
        } catch (error) {
          if (error?.code !== "ENOENT") throw error;
        }
        validateV1Refs(data.upstream_refs ?? [], "upstream_refs");
        verifyUpstream(name, data.upstream_refs ?? []);
        validateStageFacts(name, data.facts);
        for (const future of STAGES.slice(STAGES.indexOf(name) + 1)) {
          try { task.readRecord(`results/${future}/accepted.json`); throw new Error(`${name} cannot publish while future stage ${future} is assigned`); }
          catch (error) { if (error?.code !== "ENOENT") throw error; }
        }
        if (name === "make-decision" && candidate && (resolve(data.facts.worktree_root) !== candidate.worktreeRoot || data.facts.baseline_commit !== candidate.baselineCommit)) {
          throw new Error("make-decision facts do not match CandidateWorkspace");
        }
        if (name === "make-decision") verifyCandidateSnapshot(data.facts);
        if (["build-spec", "build-plan"].includes(name)) {
          if (data.checkpoint !== undefined && data.checkpoint !== data.facts.checkpoint) throw new Error("caller checkpoint override is forbidden");
          validateTaskSnapshotV1(data.facts.checkpoint, { taskId: task.identity.taskId });
        }
        for (let sequence = 1; sequence <= 9999; sequence += 1) {
          const filename = `attempt-${String(sequence).padStart(4, "0")}.json`;
          const resultRef = `evidence/stage-results/${name}/${filename}`;
          const resultRaw = `${JSON.stringify(data.facts, null, 2)}\n`;
          const attempt = {
            schema_id: "https://workflowhub.dev/schemas/task-attempt.v1.schema.json",
            schema_version: "1.0.0",
            task_id: task.identity.taskId,
            stage: name,
            attempt_id: filename.slice(0, -5),
            created_at: data.created_at ?? now(),
            facts: { result_ref: resultRef, result_hash: hash(resultRaw) },
            evidence_refs: [...(data.evidence_refs ?? [])],
            missing_items: [...(data.missing_items ?? [])],
            upstream_refs: structuredClone(data.upstream_refs ?? []),
          };
          validateAttempt(attempt, { taskId: task.identity.taskId, stage: name, attemptId: attempt.attempt_id });
          const raw = `${JSON.stringify(attempt, null, 2)}\n`;
          try {
            createKernelRecord(resultRef, resultRaw);
            createKernelRecord(`results/${name}/${filename}`, raw);
            return deepFreeze({ attempt_ref: filename, integrity_hash: hash(raw), attempt });
          } catch (error) {
            if (error?.code !== "EEXIST") throw error;
          }
        }
        throw new Error(`${name} attempt sequence exhausted`);
      });
    },
    confirmAttempt(stage, attemptRef, envelope) {
      const name = stageName(stage);
      if (!requiresHumanConfirmation(name)) throw new Error(`${name} uses automatic acceptance and does not accept human confirmation`);
      if (!ATTEMPT_REF.test(attemptRef ?? "")) throw new Error("invalid attemptRef");
      const attemptPath = `results/${name}/${attemptRef}`;
      const attemptRaw = task.readRecord(attemptPath);
      validateAttempt(parseJson(attemptRaw, `${name} attempt`), { taskId: task.identity.taskId, stage: name });
      if (!envelope || typeof envelope !== "object") throw new TypeError("authenticated confirmation envelope is required");
      const outcome = consumeTaskHumanConfirmation(task, envelope, {
        purpose: "stage", taskId: task.identity.taskId, boundRef: attemptPath, boundHash: hash(attemptRaw),
        verifyPlatformReadback: confirmationVerification.verifyPlatformReadback,
        verifyTrustedSignature: confirmationVerification.verifyTrustedSignature,
      });
      const ref = outcome.confirmationRef;
      return deepFreeze({ ref, confirmation: structuredClone(envelope), accepted: outcome.accepted, decision: outcome.decision });
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
        const resultRaw = task.readRecord(attempt.facts.result_ref);
        if (hash(resultRaw) !== attempt.facts.result_hash) throw new Error(`${name} attempt result hash mismatch`);
        const resultFacts = parseJson(resultRaw, `${name} stage result`);
        validateStageFacts(name, resultFacts);
        if (name === "make-decision" && candidate) {
          if (resolve(resultFacts.worktree_root) !== candidate.worktreeRoot || resultFacts.baseline_commit !== candidate.baselineCommit) {
            throw new Error("make-decision facts do not match CandidateWorkspace");
          }
          verifyCandidateSnapshot(resultFacts);
        }
        verifyUpstream(name, attempt.upstream_refs);
        let confirmation;
        if (acceptanceMode === "human") {
          confirmation = parseJson(task.readRecord(humanConfirmationRef), "human confirmation");
          if (confirmation.schema_id !== "https://workflowhub.dev/schemas/human-confirmation-envelope.v1.schema.json" || confirmation.schema_version !== "1.0.0" || confirmation.purpose !== "stage" || confirmation.task_id !== task.identity.taskId || confirmation.bound_ref !== `results/${name}/${attemptRef}` || confirmation.bound_hash !== hash(attemptRaw) || confirmation.decision !== "accepted") throw new Error("authenticated human confirmation does not bind this task/stage/attempt");
        }
        let snapshot;
        if (["build-spec", "build-plan"].includes(name)) {
          if (!workspace) throw new Error("accepting a design snapshot requires Workspace capability");
          const published = validateTaskSnapshotV1(resultFacts.checkpoint, { taskId: task.identity.taskId });
          const current = captureTaskSnapshotV1Sync({ taskId: task.identity.taskId, workspaceRoot: workspace.worktreeRoot, baselineCommit: published.baseline_commit, capturedAt: published.captured_at });
          for (const key of ["baseline_commit", "tree_oid", "diff_ref", "diff_hash"]) if (current[key] !== published[key]) throw new Error(`task snapshot ${key} changed before acceptance`);
          snapshot = published;
        } else {
          const boundary = name === "make-decision" ? candidate : workspace;
          if (!boundary) throw new Error(`${name} acceptance requires an authenticated workspace snapshot capability`);
          snapshot = captureTaskSnapshotV1Sync({ taskId: task.identity.taskId, workspaceRoot: boundary.worktreeRoot, baselineCommit: boundary.baselineCommit, capturedAt: now() });
          const expectedTree = resultFacts.snapshot_tree ?? resultFacts.tests?.snapshot_tree;
          if (expectedTree && snapshot.tree_oid !== expectedTree) throw new Error(`${name} task snapshot tree changed before acceptance`);
        }
        const snapshotRaw = `${JSON.stringify(snapshot, null, 2)}\n`;
        const acceptedSnapshot = { ref: `snapshots/${hash(snapshotRaw)}.json`, hash: hash(snapshotRaw), raw: snapshotRaw };
        createKernelRecord(acceptedSnapshot.ref, snapshotRaw);
        const accepted = {
          schema_id: "https://workflowhub.dev/schemas/task-accepted.v1.schema.json",
          schema_version: "1.0.0",
          task_id: task.identity.taskId,
          stage: name,
          attempt_ref: `results/${name}/${attemptRef}`,
          attempt_hash: hash(attemptRaw),
          acceptance_mode: acceptanceMode,
          ...(acceptanceMode === "human" ? { confirmation_ref: humanConfirmationRef } : {}),
          accepted_at: now(),
          upstream_refs: structuredClone(attempt.upstream_refs),
          ...(acceptedSnapshot ? { snapshot_ref: acceptedSnapshot.ref, snapshot_hash: acceptedSnapshot.hash } : {}),
        };
        validateAccepted(accepted, { taskId: task.identity.taskId, stage: name });
        createKernelRecord(`results/${name}/accepted.json`, `${JSON.stringify(accepted, null, 2)}\n`);
        return deepFreeze(accepted);
      });
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
      if (result.accepted.schema_version !== "1.0.0" && ["build-spec", "build-plan"].includes(stage)) verifyGitCheckpoint({
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

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";

import { assertTaskHandle } from "../task/task-handle.mjs";
import { createTaskKernel } from "../task/task-kernel.mjs";
import { validateAcceptanceEvidence } from "../task/task-kernel-implementation.mjs";
import { assertWorkspace } from "../task/workspace.mjs";
import { MAX_OUTPUT_BYTES, runWorkspaceCommand } from "../task/workspace-runner.mjs";
import { captureExecutionSnapshot, isMaterialOnlySnapshotDelta } from "../task/git-worktree-snapshot.mjs";
import { validateSchema } from "../review/schema-validator.mjs";
import { normalizeRuntimeOnlyPaths } from "./canonical-utils.mjs";
import { validateCanonicalTestReceipt } from "./canonical-evidence-validators.mjs";
import { validateBuildCodePhaseEvidence } from "../stage/stage-content-contracts.mjs";

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const TEST_OUTPUT_REF = /^quality\/tests\/output\/[A-Za-z0-9][A-Za-z0-9._-]*(?:\/[A-Za-z0-9][A-Za-z0-9._-]*)*$/;
const FULL_TEST_COMMAND = "npm test";
const TEST_CAPTURE_LOCK_REF = "locks/test-capture.execution.lock";
const TEST_CAPTURE_LOCK_WAIT_MS = 10_000;
export const TEST_CAPTURE_TIMEOUT_MS = 10 * 60 * 1000;
const MAX_TEST_CAPTURE_TIMEOUT_MS = 15 * 60 * 1000;
const VERIFY_REVIEW_PROTOCOL = "architect-once-repair-once-review-once-repair-once";
const VERIFY_REVIEW_STEPS = Object.freeze(["architect_review", "main_repair_1", "independent_review", "main_repair_2"]);
const CURRENT_MATERIAL_COMPONENTS = new Set(["decision", "spec", "plan", "tasks"]);
const OFFICIAL_COMPONENTS = Object.freeze({
  decision: Object.freeze({ stage: "make-decision", kind: "decision-log", ref: "quality/evidence/decision.json" }),
  spec: Object.freeze({ stage: "build-spec", kind: "content", ref: "quality/evidence/spec.json" }),
  plan: Object.freeze({ stage: "build-plan", kind: "content", ref: "quality/evidence/plan.json" }),
  tasks: Object.freeze({ stage: "build-plan", kind: "content", ref: "quality/evidence/tasks.json" }),
  implementation: Object.freeze({ stage: "build-code", kind: "implementation", ref: "quality/evidence/implementation.json" }),
  evidence: Object.freeze({ stage: "verify-code", kind: "evidence-aggregate", ref: "quality/evidence/verify-evidence.json" }),
  verification: Object.freeze({ stage: "verify-code", kind: "verification-items", ref: "quality/evidence/verification.json" }),
});
function registrationFor(_task, component) { return OFFICIAL_COMPONENTS[component]; }

function canonicalJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

export function validateVerifyReviewCycle(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)
      || Object.keys(value).some((key) => !new Set(["protocol", "steps", "conclusion"]).has(key))
      || value.protocol !== VERIFY_REVIEW_PROTOCOL
      || !Array.isArray(value.steps) || value.steps.length !== VERIFY_REVIEW_STEPS.length
      || !new Set(["passed", "failed", "incomplete"]).has(value.conclusion)) {
    throw new TypeError("verification review_cycle is invalid");
  }
  const allowedStatuses = {
    architect_review: new Set(["completed"]),
    main_repair_1: new Set(["applied", "not_needed"]),
    independent_review: new Set(["completed", "unavailable"]),
    main_repair_2: new Set(["applied", "not_needed"]),
  };
  const seen = new Set();
  const steps = value.steps.map((entry, index) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)
        || Object.keys(entry).some((key) => !new Set(["step", "status", "note"]).has(key))
        || entry.step !== VERIFY_REVIEW_STEPS[index]
        || seen.has(entry.step)
        || !allowedStatuses[entry.step]?.has(entry.status)
        || typeof entry.note !== "string" || entry.note.trim() === "") {
      throw new TypeError(`verification review_cycle step ${index} is invalid or out of order`);
    }
    seen.add(entry.step);
    return { step: entry.step, status: entry.status, note: entry.note };
  });
  const independentReview = steps.find(({ step }) => step === "independent_review");
  if (value.conclusion === "passed" && independentReview.status !== "completed") {
    throw new TypeError("verification review_cycle cannot be passed when independent review is unavailable");
  }
  if (value.conclusion === "failed" && independentReview.status === "unavailable") {
    throw new TypeError("verification review_cycle cannot call an unavailable independent review a code failure");
  }
  return { protocol: value.protocol, steps, conclusion: value.conclusion };
}

function readCanonicalRecord(task, ref) {
  try {
    return task.readRecord(ref);
  } catch (error) {
    if (error?.code === "ENOENT") return undefined;
    throw error;
  }
}


function publishIdempotently({ task, write, ref, raw, label }) {
  const existing = readCanonicalRecord(task, ref);
  if (existing === undefined) {
    try {
      write(ref, raw);
    } catch (error) {
      if (error?.code !== "EEXIST") throw error;
      const recovered = readCanonicalRecord(task, ref);
      if (recovered === raw) return;
      throw new Error(`${label} already exists with different content`);
    }
    return;
  }
  if (existing !== raw) throw new Error(`${label} already exists with different content`);
}

function reusableTestCapture({ task, workspace, stage, component, command, receiptRef, outputRef }) {
  const snapshot = captureWorkspaceSnapshot(workspace, task.identity.taskId);
  const candidateRefs = [
    receiptRef,
    ...(stage === "verify-code" && command.trim() === FULL_TEST_COMMAND && typeof task.listCanonicalTestReceiptRefs === "function"
      ? task.listCanonicalTestReceiptRefs()
      : []),
  ].filter((ref, index, refs) => refs.indexOf(ref) === index);
  for (const candidateRef of candidateRefs) {
    const raw = readCanonicalRecord(task, candidateRef);
    if (raw === undefined) continue;
    let receipt;
    try { receipt = JSON.parse(raw); } catch {
      // A malformed historical/foreign test receipt is a quality fact, not a
      // reason to block a new authenticated capture.  Fail loudly only when
      // the caller explicitly asked to reuse that exact receipt ref.
      if (candidateRef === receiptRef) throw new Error("existing test receipt is invalid");
      continue;
    }
    const producerStage = receipt.producer?.stage;
    const stageAllowed = producerStage === stage || (stage === "verify-code" && producerStage === "build-code");
    const producerComponent = receipt.producer?.component;
    const componentAllowed = producerStage === stage
      ? producerComponent === component
      : stage === "verify-code"
        && component === "verify-code-test-capture"
        && producerStage === "build-code"
        && producerComponent === "build-code-test-capture";
    if (receipt.schema_version !== "workflowhub-receipt.v1"
        || receipt.task_id !== task.identity.taskId
        || receipt.stage !== producerStage
        || !stageAllowed
        || !componentAllowed
        || receipt.command !== command
        || receipt.output_ref !== (candidateRef === receiptRef ? outputRef : receipt.output_ref)) {
      if (candidateRef === receiptRef) throw new Error("existing test receipt conflicts with requested capture");
      continue;
    }
    if (receipt.exit_code !== 0 || typeof receipt.output_ref !== "string"
        || !TEST_OUTPUT_REF.test(receipt.output_ref)
        || typeof receipt.output_hash !== "string" || !/^[a-f0-9]{64}$/.test(receipt.output_hash)
        || typeof receipt.command_hash !== "string" || receipt.command_hash !== sha256(command)) {
      if (candidateRef === receiptRef) throw new Error("existing test receipt is invalid");
      continue;
    }
    const output = readCanonicalRecord(task, receipt.output_ref);
    if (output === undefined || sha256(output) !== receipt.output_hash) {
      if (candidateRef === receiptRef) throw new Error("existing test output is missing or tampered");
      continue;
    }
    const materialOnlySnapshot = receipt.snapshot_tree !== snapshot.tree
      && isMaterialOnlySnapshotDelta(workspace.worktreeRoot, receipt.snapshot_tree, snapshot.tree, task.identity.taskId);
    const snapshotMatches = receipt.snapshot_tree === snapshot.tree || materialOnlySnapshot;
    const sourceDigestMatches = /^[a-f0-9]{64}$/.test(snapshot.source_digest ?? "")
      && receipt.source_digest === snapshot.source_digest;
    // A committed executor status writeback changes HEAD and the full
    // workspace tree, but it does not change the implementation or test
    // inputs.  Reuse the immutable test result only after the narrow
    // material-only delta check above; all other HEAD changes stay stale.
    if ((!snapshotMatches) || (!sourceDigestMatches) || (receipt.snapshot_head !== snapshot.head && !materialOnlySnapshot)) {
      if (candidateRef === receiptRef) throw new Error("existing test receipt does not match current workspace; use a new receipt ref");
      continue;
    }
    return Object.freeze({ ...receipt, receipt_ref: candidateRef, receipt_hash: sha256(raw) });
  }
  return undefined;
}

function revisionRefFor(ref, component, contentHash) {
  const namespace = ref.slice(0, ref.indexOf("/"));
  return `${namespace}/revisions/${component}/${contentHash}.json`;
}

function workspaceCommand(workspace, command, args, label) {
  const result = runWorkspaceCommand(workspace, command, args);
  if (result.error || result.status !== 0) {
    throw new Error(`${label} failed: ${result.stderr?.trim() || result.error?.message || `exit ${result.status}`}`);
  }
  return result.stdout;
}

function workspaceGit(workspace, args, label = "workspace Git command") {
  return workspaceCommand(workspace, "git", args, label).trim();
}

function currentImplementationReceipt({ task, workspace, version }) {
  const safeTask = assertTaskHandle(task);
  const safeWorkspace = assertWorkspace(workspace);
  const snapshot = captureWorkspaceSnapshot(safeWorkspace, safeTask.identity.taskId);
  const patch = workspaceCommand(safeWorkspace, "git", ["diff", "--binary", "--no-ext-diff", safeWorkspace.baselineCommit, "--"], "implementation diff");
  const tracked = workspaceGit(safeWorkspace, ["diff", "--name-only", safeWorkspace.baselineCommit, "--"]).split("\n").filter(Boolean);
  const untracked = workspaceGit(safeWorkspace, ["ls-files", "--others", "--exclude-standard"]).split("\n")
    .filter(Boolean)
    .filter((path) => !path.startsWith(".multica/") && !path.startsWith("quality/"));
  const changed = normalizeRuntimeOnlyPaths([...new Set([...tracked, ...untracked])]);
  const diff = `${JSON.stringify({ schema_version: "workflowhub-diff-evidence.v1", baseline_commit: safeWorkspace.baselineCommit, snapshot_head: snapshot.head, snapshot_tree: snapshot.tree, patch, untracked: untracked.map((path) => ({ path, blob_oid: workspaceGit(safeWorkspace, ["hash-object", "--", path]) })) }, null, 2)}\n`;
  const diffHash = sha256(diff), diffRef = `quality/evidence/implementation/${diffHash}.diff`;
  publishIdempotently({ task, write: createTaskKernel(task).publishCanonicalRecord, ref: diffRef, raw: diff, label: "implementation diff evidence" });
  return {
    value: { schema_version: "workflowhub-receipt.v1", task_id: task.identity.taskId, stage: "build-code", producer: { stage: "build-code", component: "implementation", version }, changed, snapshot_head: snapshot.head, snapshot_tree: snapshot.tree, snapshot_commit: snapshot.commit, diff_ref: diffRef, diff_hash: diffHash },
    diffHash,
  };
}

/** Publish a create-only implementation snapshot under its content-addressed ref. */
export function writeCurrentImplementationReceipt({ task, workspace, version = "1.0.0" } = {}) {
  const safeTask = assertTaskHandle(task);
  const value = currentImplementationReceipt({ task: safeTask, workspace, version }).value;
  const raw = canonicalJson(value);
  const ref = `quality/evidence/implementation/${sha256(raw)}.json`;
  publishIdempotently({ task: safeTask, write: createTaskKernel(safeTask).publishCanonicalRecord, ref, raw, label: "implementation snapshot receipt" });
  return Object.freeze({ ref, sha256: sha256(raw), value: Object.freeze(value) });
}

/** Capture tracked, dirty, and untracked files in an immutable, unpublished Git commit. */
export function captureWorkspaceSnapshot(workspace, taskId = null) {
  const root = assertWorkspace(workspace).worktreeRoot;
  return captureExecutionSnapshot(root, taskId);
}

/** Legacy component registry; vNext current materials are ArtifactDir-owned. */
export function writeOfficialComponentReceipt({ task, workspace, stage, component, payload, version = "1.0.0", revisionOf } = {}) {
  const safeTask = assertTaskHandle(task);
  if (safeTask.manifest?.record_model === "vnext-single-write"
      && CURRENT_MATERIAL_COMPONENTS.has(component)) {
    throw new Error("vNext current four materials are ArtifactDir-owned; legacy material receipts are read-only");
  }
  const registration = registrationFor(safeTask, component);
  if (!registration || registration.stage !== stage) throw new Error("component is not allowlisted for this stage");
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new TypeError("official component payload must be an object");
  const write = createTaskKernel(safeTask).publishCanonicalRecord;
  const producer = { stage, component, version };
  let value;
  if (registration.kind === "decision-log") {
    if (Object.keys(payload).some((key) => !new Set(["decision_log", "contract_refs"]).has(key))
        || typeof payload.decision_log !== "string" || payload.decision_log.trim() === "") {
      throw new TypeError("decision_log payload required");
    }
    if (payload.contract_refs !== undefined && (!Array.isArray(payload.contract_refs)
        || payload.contract_refs.some((entry) => !entry || typeof entry.ref !== "string" || !/^[a-f0-9]{64}$/.test(entry.hash ?? "")))) {
      throw new TypeError("decision contract_refs must contain canonical ref/hash pairs");
    }
    const decisionHash = sha256(payload.decision_log);
    const decisionRef = `quality/evidence/${decisionHash}.md`;
    publishIdempotently({
      task: safeTask,
      write,
      ref: decisionRef,
      raw: payload.decision_log,
      label: "human-readable decision log",
    });
    value = {
      schema_version: "workflowhub-receipt.v1",
      task_id: safeTask.identity.taskId,
      stage,
      producer,
      decision_ref: decisionRef,
      decision_hash: decisionHash,
      contract_refs: structuredClone(payload.contract_refs ?? []),
      content_hash: decisionHash,
    };
  } else if (registration.kind === "content") {
    if (Object.keys(payload).some((key) => key !== "content") || typeof payload.content !== "string" || payload.content.trim() === "") throw new TypeError(`${component} content payload required`);
    value = { schema_version: "workflowhub-receipt.v1", task_id: safeTask.identity.taskId, stage, producer, content: payload.content, content_hash: sha256(payload.content) };
  } else if (registration.kind === "implementation") {
    if (Object.keys(payload).length !== 0) {
      throw new TypeError("implementation payload must be empty; phase_completion is derived by the official build-code handler");
    }
    value = currentImplementationReceipt({ task: safeTask, workspace, version }).value;
  } else if (registration.kind === "verification-items") {
    if (Object.keys(payload).some((key) => !new Set(["items", "review_cycle", "requirement_replay"]).has(key)) || !Array.isArray(payload.items)) {
      throw new TypeError("verification payload requires items and optional review_cycle/requirement_replay");
    }
    const required = [
      "current_materials", "diff_scope", "risk_tests", "acceptance_criteria",
      "tasks_completion", "browser_qa", "independent_review_resolution", "core_gaps", "human_handoff",
    ];
    const seen = new Set();
    const items = payload.items.map((entry, index) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)
          || Object.keys(entry).some((key) => !new Set(["id", "status", "evidence_refs", "reason"]).has(key))
          || !required.includes(entry.id) || seen.has(entry.id)
          || !new Set(["pass", "fail", "unknown", "not_applicable"]).has(entry.status)
          || !Array.isArray(entry.evidence_refs)
          || typeof entry.reason !== "string" || entry.reason.trim() === "") {
        throw new TypeError(`verification item ${index} is invalid or duplicate`);
      }
      seen.add(entry.id);
      if (entry.status === "pass" && entry.evidence_refs.length === 0) {
        throw new TypeError(`verification item ${entry.id} pass requires canonical evidence_refs`);
      }
      if (entry.status === "not_applicable" && entry.evidence_refs.length !== 0) {
        throw new TypeError(`verification item ${entry.id} not_applicable must not claim evidence_refs`);
      }
      const evidenceRefs = entry.evidence_refs.map((binding, bindingIndex) => {
        if (!binding || typeof binding !== "object" || Array.isArray(binding)
            || Object.keys(binding).some((key) => key !== "ref" && key !== "sha256")
            || typeof binding.ref !== "string" || binding.ref.trim() === ""
            || !/^[a-f0-9]{64}$/.test(binding.sha256 ?? "")) {
          throw new TypeError(`verification item ${entry.id} evidence_refs[${bindingIndex}] is invalid`);
        }
        const nested = safeTask.readRecord(binding.ref);
        if (sha256(nested) !== binding.sha256) {
          throw new Error(`verification item ${entry.id} evidence hash mismatch: ${binding.ref}`);
        }
        return { ref: binding.ref, sha256: binding.sha256 };
      });
      return { id: entry.id, status: entry.status, evidence_refs: evidenceRefs, reason: entry.reason };
    });
    for (const id of required) if (!seen.has(id)) throw new Error(`missing verify item: ${id}`);
    let requirementReplay;
    if (payload.requirement_replay !== undefined) {
      if (!Array.isArray(payload.requirement_replay)) throw new TypeError("requirement_replay must be an array");
      const replayIds = new Set();
      requirementReplay = payload.requirement_replay.map((entry, index) => {
        if (!entry || typeof entry !== "object" || Array.isArray(entry)
            || Object.keys(entry).some((key) => !new Set(["source_id", "status", "snapshot_tree", "linked_ids", "evidence_refs", "reason", "scenario", "oracle", "actual_outcome", "coverage_limits", "implementation_anchor", "verification_anchor"]).has(key))
            || typeof entry.source_id !== "string" || entry.source_id.trim() === ""
            || replayIds.has(entry.source_id)
            || !new Set(["pass", "fail", "unknown", "deferred", "unavailable"]).has(entry.status)
            || !/^[a-f0-9]{40,64}$/.test(entry.snapshot_tree ?? "")
            || !Array.isArray(entry.linked_ids) || entry.linked_ids.some((id) => typeof id !== "string" || id.trim() === "")
            || !Array.isArray(entry.evidence_refs)
            || typeof entry.reason !== "string" || entry.reason.trim() === "") {
          throw new TypeError(`requirement replay item ${index} is invalid or duplicate`);
        }
        replayIds.add(entry.source_id);
        if (entry.status === "pass" && entry.evidence_refs.length === 0) {
          throw new TypeError(`requirement replay item ${entry.source_id} pass requires evidence_refs`);
        }
        const evidenceRefs = entry.evidence_refs.map((binding, bindingIndex) => {
          if (!binding || typeof binding !== "object" || Array.isArray(binding)
              || Object.keys(binding).some((key) => key !== "ref" && key !== "sha256")
              || typeof binding.ref !== "string" || binding.ref.trim() === ""
              || !/^[a-f0-9]{64}$/.test(binding.sha256 ?? "")) {
            throw new TypeError(`requirement replay item ${entry.source_id} evidence_refs[${bindingIndex}] is invalid`);
          }
          const nested = safeTask.readRecord(binding.ref);
          if (sha256(nested) !== binding.sha256) throw new Error(`requirement replay item ${entry.source_id} evidence hash mismatch: ${binding.ref}`);
          return { ref: binding.ref, sha256: binding.sha256 };
        });
        const semantic = {};
        for (const key of ["scenario", "oracle", "actual_outcome"]) {
          if (entry[key] !== undefined) {
            if (typeof entry[key] !== "string" || entry[key].trim() === "") throw new TypeError(`requirement replay item ${entry.source_id}.${key} must be non-empty text`);
            semantic[key] = entry[key];
          }
        }
        for (const key of ["coverage_limits"]) {
          if (entry[key] !== undefined) {
            if (typeof entry[key] === "string") {
              if (entry[key].trim() === "") throw new TypeError(`requirement replay item ${entry.source_id}.${key} must be non-empty text`);
              semantic[key] = entry[key];
            } else if (Array.isArray(entry[key]) && entry[key].length > 0 && entry[key].every((item) => typeof item === "string" && item.trim() !== "")) {
              semantic[key] = [...entry[key]];
            } else {
              throw new TypeError(`requirement replay item ${entry.source_id}.${key} must be non-empty text or text array`);
            }
          }
        }
        for (const key of ["implementation_anchor", "verification_anchor"]) {
          if (entry[key] !== undefined) {
            if (!entry[key] || typeof entry[key] !== "object" || Array.isArray(entry[key])) throw new TypeError(`requirement replay item ${entry.source_id}.${key} must be an object`);
            semantic[key] = structuredClone(entry[key]);
          }
        }
        return { source_id: entry.source_id, status: entry.status, snapshot_tree: entry.snapshot_tree, linked_ids: [...entry.linked_ids], evidence_refs: evidenceRefs, reason: entry.reason, ...semantic };
      });
    }
    const reviewCycle = payload.review_cycle === undefined ? undefined : validateVerifyReviewCycle(payload.review_cycle);
    value = {
      schema_version: "workflowhub-receipt.v1", task_id: safeTask.identity.taskId, stage, producer, items,
      ...(reviewCycle === undefined ? {} : { review_cycle: reviewCycle }),
      ...(requirementReplay === undefined ? {} : { requirement_replay: requirementReplay }),
    };
  } else {
    if (!Array.isArray(payload.refs) || Object.keys(payload).some((key) => key !== "refs")) throw new TypeError("verify evidence aggregate requires refs only");
    const acceptanceIds = new Set();
    const refs = payload.refs.map((entry, index) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry) || typeof entry.ref !== "string" || !/^(?:evidence|quality\/evidence)\//.test(entry.ref) || !/^[a-f0-9]{64}$/.test(entry.sha256 ?? "")) throw new TypeError(`evidence ref ${index} is invalid`);
      const raw = safeTask.readRecord(entry.ref);
      if (sha256(raw) !== entry.sha256) throw new Error(`evidence ref hash mismatch: ${entry.ref}`);
      const acceptance = validateAcceptanceEvidence(JSON.parse(raw), `evidence ref ${index}`);
      if (acceptanceIds.has(acceptance.acceptance_criterion_id)) throw new Error(`duplicate acceptance_criterion_id: ${acceptance.acceptance_criterion_id}`);
      acceptanceIds.add(acceptance.acceptance_criterion_id);
      for (const [nestedIndex, nested] of acceptance.refs.entries()) {
        const nestedRaw = safeTask.readRecord(nested.ref);
        if (sha256(nestedRaw) !== nested.sha256) throw new Error(`acceptance evidence hash mismatch: ${entry.ref} refs[${nestedIndex}]`);
      }
      return { ref: entry.ref, sha256: entry.sha256 };
    });
    value = { schema_version: "workflowhub-receipt.v1", task_id: safeTask.identity.taskId, stage, producer, refs };
  }
  const raw = canonicalJson(value);
  if (revisionOf !== undefined) throw new Error("REPLACEMENT_RETIRED: official records are create-only; publish a new task material instead");
  // Verification is the one official receipt that may be produced again after
  // an earlier incomplete attempt on the same task. Keep the historical fixed
  // record untouched and give the new bytes an explicit content-addressed ref.
  // The caller must pass this returned ref to the public verify run; there is
  // no latest pointer, selector, or replacement path.
  const existing = readCanonicalRecord(safeTask, registration.ref);
  const ref = component === "verification" && existing !== undefined && existing !== raw
    ? `quality/evidence/verification/${sha256(raw)}.json`
    : registration.ref;
  publishIdempotently({ task: safeTask, write, ref, raw, label: "official component receipt" });
  return Object.freeze({ ref, sha256: sha256(raw), value: Object.freeze(value), revision: false });
}

export { validateAcceptanceEvidence };

export function createCanonicalReceiptWriter({ task, workspace, stage, component, version = "1.0.0", now = () => new Date().toISOString() } = {}) {
  const safeTask = assertTaskHandle(task), safeWorkspace = assertWorkspace(workspace);
  if (!new Set(["build-code", "verify-code"]).has(stage)) throw new TypeError("canonical test receipt stage required");
  if (typeof component !== "string" || component.trim() === "") throw new TypeError("canonical receipt producer component required");
  const write = createTaskKernel(safeTask).publishCanonicalRecord;
  const writer = {
    captureTests({ command, receiptRef, outputRef, lockWaitMs = TEST_CAPTURE_LOCK_WAIT_MS, timeoutMs = TEST_CAPTURE_TIMEOUT_MS, phaseEvidence = null } = {}) {
      if (typeof command !== "string" || command.trim() === "") throw new TypeError("test command required");
      const receiptPattern = /^quality\/tests\/[a-zA-Z0-9._/-]+\.json$/;
      const outputPattern = TEST_OUTPUT_REF;
      if (!receiptPattern.test(receiptRef ?? "") || !outputPattern.test(outputRef ?? "")) throw new Error("canonical tests receipt/output namespace required");
      if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > MAX_TEST_CAPTURE_TIMEOUT_MS) {
        throw new TypeError(`test capture timeoutMs must be between 1 and ${MAX_TEST_CAPTURE_TIMEOUT_MS}ms`);
      }
      const capture = () => safeTask.withRecordLock(TEST_CAPTURE_LOCK_REF, () => {
        const reusable = reusableTestCapture({ task: safeTask, workspace: safeWorkspace, stage, component, command, receiptRef, outputRef });
        if (reusable !== undefined) return reusable;
        const before = captureWorkspaceSnapshot(safeWorkspace, safeTask.identity.taskId), headBefore = before.head, treeBefore = before.tree, sourceDigestBefore = before.source_digest;
        const startedAt = now();
        const proc = runWorkspaceCommand(safeWorkspace, "/bin/sh", ["-c", command], { timeoutMs, killProcessGroup: true });
        const completedAt = now();
        const output = `${proc.stdout ?? ""}\n${proc.stderr ?? ""}`;
        const after = captureWorkspaceSnapshot(safeWorkspace, safeTask.identity.taskId);
        if (after.head !== headBefore || after.tree !== treeBefore || after.source_digest !== sourceDigestBefore) throw new Error("test command changed the bound Git HEAD/tree snapshot; receipt rejected");
        const timedOut = proc.error?.code === "ETIMEDOUT";
        const outputLimitExceeded = proc.error?.code === "ENOBUFS";
        const exitCode = timedOut ? 124 : (proc.status ?? (proc.error ? 1 : 128));
        const outputHash = sha256(output), commandHash = sha256(command);
        const timeoutFailure = timedOut ? {
          status: "failed", category: "test_timeout", code: "TEST_CAPTURE_TIMEOUT", exit_code: exitCode,
          reason: `test command exceeded ${timeoutMs}ms and was terminated`,
        } : null;
        const outputLimitFailure = outputLimitExceeded ? {
          status: "failed", category: "test_output_overflow", code: "TEST_OUTPUT_OVERFLOW", exit_code: exitCode,
          reason: `test command output exceeded ${MAX_OUTPUT_BYTES} bytes`,
        } : null;
        const captureFailure = timeoutFailure ?? outputLimitFailure;
        let phaseEvidenceValue;
        if (phaseEvidence !== null) {
          if (!phaseEvidence || typeof phaseEvidence !== "object" || Array.isArray(phaseEvidence)) throw new TypeError("phaseEvidence must be an object or null");
          phaseEvidenceValue = validateBuildCodePhaseEvidence({
            schema_version: "build-code-phase-evidence.v1",
            ...phaseEvidence,
            snapshot_tree: treeBefore,
            baseline: {
              ...phaseEvidence.baseline,
              implementation: { kind: "implementation", commit: safeWorkspace.baselineCommit },
            },
            failure_attribution: {
              ...phaseEvidence.failure_attribution,
              status: exitCode === 0 ? (phaseEvidence.failure_attribution?.status ?? "passed") : "failed",
              category: exitCode === 0 ? phaseEvidence.failure_attribution?.category : (captureFailure?.category ?? phaseEvidence.failure_attribution?.category ?? "test_command"),
              code: exitCode === 0 ? (phaseEvidence.failure_attribution?.code ?? "NONE") : (captureFailure?.code ?? phaseEvidence.failure_attribution?.code ?? `EXIT_${exitCode}`),
              reason: exitCode === 0 ? phaseEvidence.failure_attribution?.reason : (captureFailure?.reason ?? phaseEvidence.failure_attribution?.reason ?? "test command failed"),
              exit_code: exitCode,
            },
          }, { snapshotTree: treeBefore });
        }
        write(outputRef, output);
        const receipt = {
          schema_version: "workflowhub-receipt.v1", task_id: safeTask.identity.taskId, stage,
          producer: { stage, component, version }, command, command_hash: commandHash, exit_code: exitCode,
          snapshot_head: headBefore, snapshot_tree: treeBefore, snapshot_commit: before.commit, source_digest: sourceDigestBefore,
          started_at: startedAt, completed_at: completedAt, output_ref: outputRef, output_hash: outputHash,
          lease: { status: "released", ref: TEST_CAPTURE_LOCK_REF, wait_ms: lockWaitMs },
          ...(timedOut ? { execution: { status: "timed_out", timeout_ms: timeoutMs, signal: proc.signal ?? "SIGTERM" } } : {}),
          ...(outputLimitExceeded ? { execution: { status: "output_limit_exceeded", output_limit_bytes: MAX_OUTPUT_BYTES, signal: proc.signal ?? null } } : {}),
          ...(phaseEvidenceValue === undefined ? {} : { phase_evidence: phaseEvidenceValue }),
          ...(exitCode === 0 || phaseEvidenceValue !== undefined ? {} : {
            failure_attribution: captureFailure ?? { status: "failed", category: "test_command", code: `EXIT_${exitCode}`, exit_code: exitCode, reason: "test command exited non-zero" },
          }),
        };
        validateCanonicalTestReceipt(receipt, {
          taskId: safeTask.identity.taskId, stage, snapshotTree: treeBefore, subject: component,
        });
        const raw = `${JSON.stringify(receipt, null, 2)}\n`; write(receiptRef, raw);
        return Object.freeze({ ...receipt, receipt_ref: receiptRef, receipt_hash: sha256(raw) });
      }, { waitMs: lockWaitMs });
      try {
        return capture();
      } catch (error) {
        if (/timed out waiting for record lock/.test(error?.message ?? "")) {
          let owner = null;
          try {
            const rawOwner = safeTask.readRecord(TEST_CAPTURE_LOCK_REF);
            const parsed = JSON.parse(rawOwner);
            owner = { pid: parsed.pid ?? null, host: parsed.host ?? null, started_at: parsed.started_at ?? null };
          } catch {}
          error.code = "TEST_CAPTURE_LEASE_TIMEOUT";
          error.lease = { status: "timeout", ref: TEST_CAPTURE_LOCK_REF, wait_ms: lockWaitMs, owner };
          error.message = `${error.message}; lease timeout after ${lockWaitMs}ms${owner ? `; owner=${owner.host ?? "unknown"}:${owner.pid ?? "unknown"}` : ""}`;
        }
        throw error;
      }
    },
  };
  return Object.freeze(writer);
}

/** Canonical create-only writer for wh-review attempt/provider/result records. */
export function createCanonicalReviewWriter({ task, taskId, stage } = {}) {
  const safeTask = assertTaskHandle(task);
  if (taskId !== safeTask.identity.taskId) throw new Error("canonical review task identity mismatch");
  if (typeof stage !== "string" || stage.trim() === "") throw new TypeError("canonical review stage required");
  const write = createTaskKernel(safeTask).publishCanonicalRecord;
  const validateProvenance = (value, kind) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${kind} record must be an object`);
    if (value.task_id !== taskId || value.stage !== stage) throw new Error(`${kind} record producer provenance mismatch`);
    if (!value.source || typeof value.snapshot_tree !== "string" || typeof value.material_id !== "string") throw new Error(`${kind} record source provenance is required`);
    const expected = { result: "wh-review-result.v1", attempt: "wh-review-attempt.v1" }[kind];
    if (value.version !== expected) throw new Error(`${kind} record schema must be ${expected}`);
  };
  return Object.freeze({
    writeProviderOutput(ref, output, metadata = undefined) {
      const reviewRoot = "quality/reviews";
      const match = ref.match(new RegExp(`^${reviewRoot.replaceAll("/", "\\/")}\\/attempts\\/([a-zA-Z0-9._-]+)\\/providers\\/([a-zA-Z0-9._-]+)\\.output\\.json$`));
      if (!match) throw new Error("canonical provider output ref required");
      if (typeof output !== "string") throw new TypeError("provider output must be text");
      const providerName = metadata && typeof metadata === "object" && !Array.isArray(metadata)
        ? metadata.provider ?? match[2].replace(/-[0-9]+$/, "")
        : match[2].replace(/-[0-9]+$/, "");
      if (typeof providerName !== "string" || providerName.trim() === "") throw new TypeError("provider name required");
      const evidenceAnchors = metadata?.evidence_anchor_valid;
      if (evidenceAnchors !== undefined && (!Array.isArray(evidenceAnchors) || evidenceAnchors.some((value) => typeof value !== "boolean"))) {
        throw new TypeError("provider output evidence_anchor_valid must be a boolean array");
      }
      const record = {
        schema_version: "wh-review-provider-output.v1", task_id: taskId, stage, attempt_id: match[1], provider: providerName,
        content: output, content_hash: sha256(output),
        ...(evidenceAnchors === undefined ? {} : { evidence_anchor_valid: [...evidenceAnchors] }),
      };
      write(ref, `${JSON.stringify(record, null, 2)}\n`); return ref;
    },
    writeAttempt(ref, value) {
      const reviewRoot = "quality/reviews";
      if (!new RegExp(`^${reviewRoot.replaceAll("/", "\\/")}\\/attempts\\/[a-zA-Z0-9._-]+\\/attempt\\.json$`).test(ref)) throw new Error("canonical review attempt ref required");
      validateProvenance(value, "attempt"); validateSchema("attempt", value); write(ref, `${JSON.stringify(value, null, 2)}\n`); return ref;
    },
    writeResult(ref, value) {
      const reviewRoot = "quality/reviews";
      if (!new RegExp(`^${reviewRoot.replaceAll("/", "\\/")}\\/results\\/[a-zA-Z0-9._-]+\\.json$`).test(ref)) throw new Error("canonical review result ref required");
      validateProvenance(value, "result"); validateSchema("result", value); write(ref, `${JSON.stringify(value, null, 2)}\n`); return ref;
    },
    writeReport(ref, content) {
      const reviewRoot = "quality/reviews";
      if (!new RegExp(`^${reviewRoot.replaceAll("/", "\\/")}\\/reports\\/[a-zA-Z0-9._-]+\\.md$`).test(ref)) throw new Error("canonical review report ref required");
      if (typeof content !== "string" || content.trim() === "") throw new TypeError("canonical review report must be non-empty markdown");
      write(ref, content); return ref;
    },
  });
}

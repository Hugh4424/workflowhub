import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";

import { ArtifactDir } from "./artifact-dir.mjs";
import { assertTaskHandle } from "./task-handle.mjs";
import { createTaskKernel } from "./task-kernel.mjs";
import { validateAcceptanceEvidence, validatePhaseCompletion } from "./task-kernel-implementation.mjs";
import { assertWorkspace } from "./workspace.mjs";
import { runWorkspaceCommand } from "./workspace-runner.mjs";
import { captureGitWorktreeSnapshot } from "./git-worktree-snapshot.mjs";
import { validateSchema } from "../skills/wh-review/scripts/schema-validator.mjs";
import { normalizeRuntimeOnlyPaths } from "./canonical-utils.mjs";

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const TEST_CAPTURE_LOCK_REF = "locks/test-capture.execution.lock";
const TEST_CAPTURE_LOCK_WAIT_MS = Number.MAX_SAFE_INTEGER;
const OFFICIAL_COMPONENTS = Object.freeze({
  decision: Object.freeze({ stage: "make-decision", kind: "decision-log", ref: "receipts/decision.json" }),
  spec: Object.freeze({ stage: "build-spec", kind: "content", ref: "receipts/spec.json" }),
  plan: Object.freeze({ stage: "build-plan", kind: "content", ref: "receipts/plan.json" }),
  tasks: Object.freeze({ stage: "build-plan", kind: "content", ref: "receipts/tasks.json" }),
  implementation: Object.freeze({ stage: "build-code", kind: "implementation", ref: "receipts/implementation.json" }),
  evidence: Object.freeze({ stage: "verify-code", kind: "evidence-aggregate", ref: "evidence/verify-evidence.json" }),
});

function canonicalJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function receiptProvenance(value, { taskId, stage, component }) {
  if (!value || typeof value !== "object" || Array.isArray(value)
    || value.schema_version !== "workflowhub-receipt.v1"
    || value.task_id !== taskId
    || value.stage !== stage
    || !value.producer || typeof value.producer !== "object"
    || value.producer.stage !== stage
    || value.producer.component !== component) {
    throw new Error("revision source receipt provenance mismatch");
  }
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
  const raw = readCanonicalRecord(task, receiptRef);
  if (raw === undefined) return undefined;
  let receipt;
  try { receipt = JSON.parse(raw); } catch { throw new Error("existing test receipt is invalid"); }
  receiptProvenance(receipt, { taskId: task.identity.taskId, stage, component });
  if (receipt.command !== command || receipt.output_ref !== outputRef) {
    throw new Error("existing test receipt conflicts with requested capture");
  }
  if (typeof receipt.output_hash !== "string" || !/^[a-f0-9]{64}$/.test(receipt.output_hash)) {
    throw new Error("existing test receipt output hash is invalid");
  }
  const output = readCanonicalRecord(task, outputRef);
  if (output === undefined || sha256(output) !== receipt.output_hash) {
    throw new Error("existing test output is missing or tampered");
  }
  const snapshot = captureWorkspaceSnapshot(workspace);
  if (receipt.snapshot_head !== snapshot.head || receipt.snapshot_tree !== snapshot.tree) {
    throw new Error("existing test receipt does not match current workspace; use a new receipt ref");
  }
  return Object.freeze({ ...receipt, receipt_ref: receiptRef, receipt_hash: sha256(raw) });
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

/** Capture tracked, dirty, and untracked files in an immutable, unpublished Git commit. */
export function captureWorkspaceSnapshot(workspace) {
  const root = assertWorkspace(workspace).worktreeRoot;
  return captureGitWorktreeSnapshot(root);
}

/** Fixed registry for official non-test component receipts. */
export function writeOfficialComponentReceipt({ task, workspace, stage, component, payload, version = "1.0.0", revisionOf } = {}) {
  const safeTask = assertTaskHandle(task);
  const registration = OFFICIAL_COMPONENTS[component];
  if (!registration || registration.stage !== stage) throw new Error("component is not allowlisted for this stage");
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new TypeError("official component payload must be an object");
  const write = createTaskKernel(safeTask).publishCanonicalRecord;
  const producer = { stage, component, version };
  let value;
  if (registration.kind === "decision-log") {
    if (Object.keys(payload).some((key) => key !== "decision_log") || typeof payload.decision_log !== "string" || payload.decision_log.trim() === "") {
      throw new TypeError("decision_log payload required");
    }
    value = { schema_version: "workflowhub-receipt.v1", task_id: safeTask.identity.taskId, stage, producer, decision_log: payload.decision_log, content_hash: sha256(payload.decision_log) };
  } else if (registration.kind === "content") {
    if (Object.keys(payload).some((key) => key !== "content") || typeof payload.content !== "string" || payload.content.trim() === "") throw new TypeError(`${component} content payload required`);
    value = { schema_version: "workflowhub-receipt.v1", task_id: safeTask.identity.taskId, stage, producer, content: payload.content, content_hash: sha256(payload.content) };
  } else if (registration.kind === "implementation") {
    const safeWorkspace = assertWorkspace(workspace);
    if (!Object.prototype.hasOwnProperty.call(payload, "phase_completion") || Object.keys(payload).some((key) => key !== "phase_completion")) throw new TypeError("implementation payload accepts only phase_completion");
    validatePhaseCompletion(payload.phase_completion);
    const acceptedKernel = createTaskKernel(safeTask, { workspace: safeWorkspace, artifacts: ArtifactDir.open(safeWorkspace.worktreeRoot, safeTask) });
    try {
      acceptedKernel.readAccepted("build-spec");
      acceptedKernel.readAccepted("build-plan");
    } catch (error) {
      throw new Error(`build-code implementation receipt requires current accepted spec and plan: ${error.message}`);
    }
    const snapshot = captureWorkspaceSnapshot(safeWorkspace), snapshotHead = snapshot.head, snapshotTree = snapshot.tree;
    const patch = workspaceCommand(safeWorkspace, "git", ["diff", "--binary", "--no-ext-diff", safeWorkspace.baselineCommit, "--"], "implementation diff");
    const tracked = workspaceGit(safeWorkspace, ["diff", "--name-only", safeWorkspace.baselineCommit, "--"]).split("\n").filter(Boolean);
    const untracked = workspaceGit(safeWorkspace, ["ls-files", "--others", "--exclude-standard"]).split("\n").filter(Boolean);
    const changed = normalizeRuntimeOnlyPaths([...new Set([...tracked, ...untracked])]);
    const diff = `${JSON.stringify({ schema_version: "workflowhub-diff-evidence.v1", baseline_commit: safeWorkspace.baselineCommit, snapshot_head: snapshotHead, snapshot_tree: snapshotTree, patch, untracked: untracked.map((path) => ({ path, blob_oid: workspaceGit(safeWorkspace, ["hash-object", "--", path]) })) }, null, 2)}\n`;
    const diffHash = sha256(diff), diffRef = `evidence/implementation-${diffHash}.diff`;
    // The diff is content-addressed by its hash. Reusing the same snapshot
    // during a controlled reopen must be safe; a different payload is still
    // rejected by the idempotent writer.
    publishIdempotently({ task: safeTask, write, ref: diffRef, raw: diff, label: "implementation diff evidence" });
    value = { schema_version: "workflowhub-receipt.v1", task_id: safeTask.identity.taskId, stage, producer, changed, phase_completion: structuredClone(payload.phase_completion), snapshot_head: snapshotHead, snapshot_tree: snapshotTree, snapshot_commit: snapshot.commit, diff_ref: diffRef, diff_hash: diffHash };
  } else {
    if (!Array.isArray(payload.refs) || Object.keys(payload).some((key) => key !== "refs")) throw new TypeError("verify evidence aggregate requires refs only");
    const acceptanceIds = new Set();
    const refs = payload.refs.map((entry, index) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry) || typeof entry.ref !== "string" || !entry.ref.startsWith("evidence/") || !/^[a-f0-9]{64}$/.test(entry.sha256 ?? "")) throw new TypeError(`evidence ref ${index} is invalid`);
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
  if (revisionOf === undefined) {
    publishIdempotently({ task: safeTask, write, ref: registration.ref, raw, label: "official component receipt" });
    return Object.freeze({ ref: registration.ref, sha256: sha256(raw), value: Object.freeze(value), revision: false });
  }
  if (typeof revisionOf !== "string" || revisionOf.trim() === "") throw new TypeError("revision source receipt ref required");
  const previousRaw = readCanonicalRecord(safeTask, revisionOf);
  if (previousRaw === undefined) throw new Error(`revision source receipt does not exist: ${revisionOf}`);
  let previous;
  try { previous = JSON.parse(previousRaw); } catch { throw new Error("revision source receipt must be JSON"); }
  receiptProvenance(previous, { taskId: safeTask.identity.taskId, stage, component });
  const contentHash = sha256(raw);
  const ref = revisionRefFor(registration.ref, component, contentHash);
  const revision = Object.freeze({ previous_ref: revisionOf, previous_hash: sha256(previousRaw), content_hash: contentHash });
  const revised = { ...value, revision };
  const revisedRaw = canonicalJson(revised);
  const existing = readCanonicalRecord(safeTask, ref);
  if (existing !== undefined && existing !== revisedRaw) {
    let existingRevision;
    try { existingRevision = JSON.parse(existing).revision; } catch { /* publishIdempotently reports malformed conflicts below */ }
    if (existingRevision?.content_hash === contentHash) throw new Error("revision source mismatch");
  }
  publishIdempotently({ task: safeTask, write, ref, raw: revisedRaw, label: "official component receipt revision" });
  return Object.freeze({ ref, sha256: sha256(revisedRaw), value: Object.freeze(revised), revision: true, previous_ref: revisionOf, previous_hash: revision.previous_hash, content_hash: contentHash });
}

export { validateAcceptanceEvidence };

export function createCanonicalReceiptWriter({ task, workspace, stage, component, version = "1.0.0", now = () => new Date().toISOString() } = {}) {
  const safeTask = assertTaskHandle(task), safeWorkspace = assertWorkspace(workspace);
  if (!new Set(["build-code", "verify-code"]).has(stage)) throw new TypeError("canonical test receipt stage required");
  if (typeof component !== "string" || component.trim() === "") throw new TypeError("canonical receipt producer component required");
  const write = createTaskKernel(safeTask).publishCanonicalRecord;
  const writer = {
    captureTests({ command, receiptRef, outputRef } = {}) {
      if (typeof command !== "string" || command.trim() === "") throw new TypeError("test command required");
      if (!/^receipts\/[a-zA-Z0-9._/-]+\.json$/.test(receiptRef ?? "") || !/^evidence\/[a-zA-Z0-9._/-]+$/.test(outputRef ?? "")) throw new Error("canonical tests receipt/output namespace required");
      return safeTask.withRecordLock(TEST_CAPTURE_LOCK_REF, () => {
        const reusable = reusableTestCapture({ task: safeTask, workspace: safeWorkspace, stage, component, command, receiptRef, outputRef });
        if (reusable !== undefined) return reusable;
        const before = captureWorkspaceSnapshot(safeWorkspace), headBefore = before.head, treeBefore = before.tree;
        const startedAt = now();
        const proc = runWorkspaceCommand(safeWorkspace, "/bin/sh", ["-c", command]);
        const completedAt = now();
        const output = `${proc.stdout ?? ""}\n${proc.stderr ?? ""}`;
        const after = captureWorkspaceSnapshot(safeWorkspace);
        if (after.head !== headBefore || after.tree !== treeBefore) throw new Error("test command changed the bound Git HEAD/tree snapshot; receipt rejected");
        const exitCode = proc.status ?? (proc.error ? 1 : 128);
        const outputHash = sha256(output), commandHash = sha256(command);
        write(outputRef, output);
        const receipt = { schema_version: "workflowhub-receipt.v1", task_id: safeTask.identity.taskId, stage, producer: { stage, component, version }, command, command_hash: commandHash, exit_code: exitCode, snapshot_head: headBefore, snapshot_tree: treeBefore, snapshot_commit: before.commit, started_at: startedAt, completed_at: completedAt, output_ref: outputRef, output_hash: outputHash };
        const raw = `${JSON.stringify(receipt, null, 2)}\n`; write(receiptRef, raw);
        return Object.freeze({ ...receipt, receipt_ref: receiptRef, receipt_hash: sha256(raw) });
      }, { waitMs: TEST_CAPTURE_LOCK_WAIT_MS });
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
    if (kind !== "resolution" && (!value.source || typeof value.snapshot_tree !== "string" || typeof value.material_id !== "string")) throw new Error(`${kind} record source provenance is required`);
    if (kind === "resolution" && typeof value.snapshot_tree !== "string") throw new Error("resolution record snapshot provenance is required");
    const expected = { result: "wh-review-result.v1", attempt: "wh-review-attempt.v1", resolution: "wh-review-resolution.v1" }[kind];
    if (value.version !== expected) throw new Error(`${kind} record schema must be ${expected}`);
  };
  return Object.freeze({
    writeProviderOutput(ref, output, metadata = undefined) {
      const match = ref.match(/^reviews\/attempts\/([a-zA-Z0-9._-]+)\/providers\/([a-zA-Z0-9._-]+)\.output\.json$/);
      if (!match) throw new Error("canonical provider output ref required");
      if (typeof output !== "string") throw new TypeError("provider output must be text");
      const providerName = metadata && typeof metadata === "object" && !Array.isArray(metadata)
        ? metadata.provider ?? match[2].replace(/-[0-9]+$/, "")
        : match[2].replace(/-[0-9]+$/, "");
      if (typeof providerName !== "string" || providerName.trim() === "") throw new TypeError("provider name required");
      const record = { schema_version: "wh-review-provider-output.v1", task_id: taskId, stage, attempt_id: match[1], provider: providerName, content: output, content_hash: sha256(output) };
      write(ref, `${JSON.stringify(record, null, 2)}\n`); return ref;
    },
    writeAttempt(ref, value) {
      if (!/^reviews\/attempts\/[a-zA-Z0-9._-]+\/attempt\.json$/.test(ref)) throw new Error("canonical review attempt ref required");
      validateProvenance(value, "attempt"); validateSchema("attempt", value); write(ref, `${JSON.stringify(value, null, 2)}\n`); return ref;
    },
    writeResult(ref, value) {
      if (!/^reviews\/results\/[a-zA-Z0-9._-]+\.json$/.test(ref)) throw new Error("canonical review result ref required");
      validateProvenance(value, "result"); validateSchema("result", value); write(ref, `${JSON.stringify(value, null, 2)}\n`); return ref;
    },
    writeResolution(ref, value) {
      if (!/^reviews\/resolutions\/[a-f0-9]{64}\.json$/.test(ref)) throw new Error("canonical review resolution ref required");
      validateProvenance(value, "resolution"); validateSchema("resolution", value); write(ref, `${JSON.stringify(value, null, 2)}\n`); return ref;
    },
    writeReport(ref, content) {
      if (!/^reviews\/reports\/[a-zA-Z0-9._-]+\.md$/.test(ref)) throw new Error("canonical review report ref required");
      if (typeof content !== "string" || content.trim() === "") throw new TypeError("canonical review report must be non-empty markdown");
      write(ref, content); return ref;
    },
  });
}

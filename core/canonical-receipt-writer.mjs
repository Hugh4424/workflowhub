import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";

import { assertTaskHandle } from "./task-handle.mjs";
import { createTaskKernel } from "./task-kernel.mjs";
import { assertWorkspace } from "./workspace.mjs";
import { runWorkspaceCommand } from "./workspace-runner.mjs";
import { captureGitWorktreeSnapshot } from "./git-worktree-snapshot.mjs";
import { validateSchema } from "../skills/wh-review/scripts/schema-validator.mjs";

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const snapshotBinding = (snapshot) => {
  const snapshotRef = `git-tree:${snapshot.tree}`;
  return { snapshot_ref: snapshotRef, snapshot_hash: sha256(`${snapshot.head}\n${snapshot.tree}\n`) };
};
const ACCEPTANCE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const OFFICIAL_COMPONENTS = Object.freeze({
  decision: Object.freeze({ stage: "make-decision", kind: "content", ref: "receipts/decision.json" }),
  spec: Object.freeze({ stage: "build-spec", kind: "content", ref: "receipts/spec.json" }),
  plan: Object.freeze({ stage: "build-plan", kind: "content", ref: "receipts/plan.json" }),
  tasks: Object.freeze({ stage: "build-plan", kind: "content", ref: "receipts/tasks.json" }),
  implementation: Object.freeze({ stage: "build-code", kind: "implementation", ref: "receipts/implementation.json" }),
  evidence: Object.freeze({ stage: "verify-code", kind: "evidence-aggregate", ref: "evidence/verify-evidence.json" }),
});

function workspaceCommand(workspace, command, args, label) {
  const result = runWorkspaceCommand(workspace, "stage", command, args);
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
export function writeOfficialComponentReceipt({ task, workspace, stage, component, payload, version = "1.0.0" } = {}) {
  const safeTask = assertTaskHandle(task);
  const registration = OFFICIAL_COMPONENTS[component];
  if (!registration || registration.stage !== stage) throw new Error("component is not allowlisted for this stage");
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new TypeError("official component payload must be an object");
  const write = createTaskKernel(safeTask).publishCanonicalRecord;
  const producer = { stage, component, version };
  let value;
  if (registration.kind === "content") {
    if (Object.keys(payload).some((key) => key !== "content") || typeof payload.content !== "string" || payload.content.trim() === "") throw new TypeError(`${component} content payload required`);
    value = { schema_version: "workflowhub-receipt.v1", task_id: safeTask.identity.taskId, stage, producer, content: payload.content, content_hash: sha256(payload.content) };
  } else if (registration.kind === "implementation") {
    const safeWorkspace = assertWorkspace(workspace);
    if (!Object.prototype.hasOwnProperty.call(payload, "phase_completion") || Object.keys(payload).some((key) => key !== "phase_completion")) throw new TypeError("implementation payload accepts only phase_completion");
    const snapshot = captureWorkspaceSnapshot(safeWorkspace), snapshotHead = snapshot.head, snapshotTree = snapshot.tree;
    const patch = workspaceCommand(safeWorkspace, "git", ["diff", "--binary", "--no-ext-diff", safeWorkspace.baselineCommit, "--"], "implementation diff");
    const tracked = workspaceGit(safeWorkspace, ["diff", "--name-only", safeWorkspace.baselineCommit, "--"]).split("\n").filter(Boolean);
    const untracked = workspaceGit(safeWorkspace, ["ls-files", "--others", "--exclude-standard"]).split("\n").filter(Boolean);
    const changed = [...new Set([...tracked, ...untracked])].sort();
    const diff = `${JSON.stringify({ schema_version: "workflowhub-diff-evidence.v1", baseline_commit: safeWorkspace.baselineCommit, snapshot_head: snapshotHead, snapshot_tree: snapshotTree, patch, untracked: untracked.map((path) => ({ path, blob_oid: workspaceGit(safeWorkspace, ["hash-object", "--", path]) })) }, null, 2)}\n`;
    const diffHash = sha256(diff), diffRef = `evidence/implementation-${diffHash}.diff`;
    write(diffRef, diff);
    value = { schema_version: "workflowhub-receipt.v1", task_id: safeTask.identity.taskId, stage, producer, changed, phase_completion: structuredClone(payload.phase_completion), snapshot_head: snapshotHead, snapshot_tree: snapshotTree, ...snapshotBinding(snapshot), diff_ref: diffRef, diff_hash: diffHash };
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
  const raw = `${JSON.stringify(value, null, 2)}\n`; write(registration.ref, raw);
  return Object.freeze({ ref: registration.ref, sha256: sha256(raw), value: Object.freeze(value) });
}

export function validateAcceptanceEvidence(value, label = "acceptance evidence") {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${label} must be an object`);
  if (value.schema_version !== "acceptance-evidence.v1") throw new Error(`${label} schema_version must be acceptance-evidence.v1`);
  if (typeof value.acceptance_criterion_id !== "string" || !ACCEPTANCE_ID.test(value.acceptance_criterion_id)) throw new Error(`${label} acceptance_criterion_id must be stable and non-empty`);
  if (!new Set(["pass", "fail"]).has(value.result)) throw new Error(`${label} result must be pass or fail`);
  if (!Array.isArray(value.refs) || value.refs.length === 0) throw new Error(`${label} refs must be a non-empty array`);
  const refs = value.refs.map((entry, index) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry) || Object.keys(entry).some((key) => !["ref", "sha256"].includes(key)) || typeof entry.ref !== "string" || !/^evidence\/[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(entry.ref) || entry.ref.includes("..") || !/^[a-f0-9]{64}$/.test(entry.sha256 ?? "")) throw new Error(`${label} refs[${index}] must contain canonical ref and sha256`);
    return { ref: entry.ref, sha256: entry.sha256 };
  });
  return Object.freeze({ schema_version: value.schema_version, acceptance_criterion_id: value.acceptance_criterion_id, result: value.result, refs: Object.freeze(refs) });
}

export function createCanonicalReceiptWriter({ task, workspace, stage, component, version = "1.0.0", now = () => new Date().toISOString() } = {}) {
  const safeTask = assertTaskHandle(task), safeWorkspace = assertWorkspace(workspace);
  if (!new Set(["build-code", "verify-code"]).has(stage)) throw new TypeError("canonical test receipt stage required");
  if (typeof component !== "string" || component.trim() === "") throw new TypeError("canonical receipt producer component required");
  const write = createTaskKernel(safeTask).publishCanonicalRecord;
  const writer = {
    captureTests({ command, receiptRef, outputRef } = {}) {
      if (typeof command !== "string" || command.trim() === "") throw new TypeError("test command required");
      if (!/^receipts\/[a-zA-Z0-9._/-]+\.json$/.test(receiptRef ?? "") || !/^evidence\/[a-zA-Z0-9._/-]+$/.test(outputRef ?? "")) throw new Error("canonical tests receipt/output namespace required");
      const before = captureWorkspaceSnapshot(safeWorkspace), headBefore = before.head, treeBefore = before.tree;
      const startedAt = now();
      const proc = runWorkspaceCommand(safeWorkspace, "stage", "/bin/sh", ["-c", command]);
      const completedAt = now();
      const output = `${proc.stdout ?? ""}\n${proc.stderr ?? ""}`;
      const after = captureWorkspaceSnapshot(safeWorkspace);
      if (after.head !== headBefore || after.tree !== treeBefore) throw new Error("test command changed the bound Git HEAD/tree snapshot; receipt rejected");
      const exitCode = proc.status ?? (proc.error ? 1 : 128);
      const outputHash = sha256(output), commandHash = sha256(command);
      write(outputRef, output);
      const receipt = { schema_version: "workflowhub-receipt.v1", task_id: safeTask.identity.taskId, stage, producer: { stage, component, version }, command, command_hash: commandHash, exit_code: exitCode, snapshot_head: headBefore, snapshot_tree: treeBefore, ...snapshotBinding(before), started_at: startedAt, completed_at: completedAt, output_ref: outputRef, output_hash: outputHash };
      const raw = `${JSON.stringify(receipt, null, 2)}\n`; write(receiptRef, raw);
      return Object.freeze({ ...receipt, receipt_ref: receiptRef, receipt_hash: sha256(raw) });
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
    const expected = kind === "result" ? "wh-review-result.v1" : "wh-review-attempt.v1";
    if (value.version !== expected) throw new Error(`${kind} record schema must be ${expected}`);
  };
  return Object.freeze({
    writeProviderOutput(ref, output) {
      const match = ref.match(/^reviews\/attempts\/([a-zA-Z0-9._-]+)\/providers\/([a-zA-Z0-9._-]+)\.output\.json$/);
      if (!match) throw new Error("canonical provider output ref required");
      if (typeof output !== "string") throw new TypeError("provider output must be text");
      const record = { schema_version: "wh-review-provider-output.v1", task_id: taskId, stage, attempt_id: match[1], provider: match[2].replace(/-[0-9]+$/, ""), content: output, content_hash: sha256(output) };
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
  });
}

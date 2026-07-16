import { createHash, randomUUID } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

import { assertTaskHandle } from "./task-handle.mjs";
import { createTaskKernel } from "./task-kernel.mjs";
import { assertWorkspace } from "./workspace.mjs";

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const ACCEPTANCE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const OFFICIAL_COMPONENTS = Object.freeze({
  decision: Object.freeze({ stage: "make-decision", kind: "content", ref: "receipts/decision.json" }),
  spec: Object.freeze({ stage: "build-spec", kind: "content", ref: "receipts/spec.json" }),
  plan: Object.freeze({ stage: "build-plan", kind: "versioned-content", ref: "receipts/plan" }),
  tasks: Object.freeze({ stage: "build-plan", kind: "versioned-content", ref: "receipts/tasks" }),
  research: Object.freeze({ stage: "build-plan", kind: "versioned-fact", ref: "evidence/research" }),
  analysis: Object.freeze({ stage: "build-plan", kind: "versioned-fact", ref: "evidence/analysis" }),
  simplicity: Object.freeze({ stage: "build-plan", kind: "versioned-fact", ref: "evidence/simplicity" }),
  implementation: Object.freeze({ stage: "build-code", kind: "implementation", ref: "receipts/implementation.json" }),
  evidence: Object.freeze({ stage: "verify-code", kind: "evidence-aggregate", ref: "evidence/verify-evidence.json" }),
});

function git(root, args) { return String(execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] })).trim(); }

/** Capture tracked, dirty, and untracked files in an immutable, unpublished Git commit. */
export function captureWorkspaceSnapshot(workspace) {
  const root = assertWorkspace(workspace).worktreeRoot;
  const head = git(root, ["rev-parse", "HEAD"]), index = resolve(tmpdir(), `workflowhub-snapshot-${randomUUID()}.index`);
  const env = { ...process.env, GIT_INDEX_FILE: index };
  const run = (args, extra = {}) => String(execFileSync("git", args, { cwd: root, env, encoding: "utf8", stdio: [extra.input === undefined ? "ignore" : "pipe", "pipe", "pipe"], ...extra })).trim();
  try {
    run(["read-tree", head]); run(["add", "-A", "--", "."]);
    const tree = run(["write-tree"]);
    const commit = run(["commit-tree", tree, "-p", head, "-m", "workflowhub ephemeral workspace snapshot"], { env: { ...env, GIT_AUTHOR_NAME: "WorkflowHub", GIT_AUTHOR_EMAIL: "workflowhub@local", GIT_COMMITTER_NAME: "WorkflowHub", GIT_COMMITTER_EMAIL: "workflowhub@local" } });
    return Object.freeze({ head, tree, commit });
  } finally { rmSync(index, { force: true }); }
}

/** Fixed registry for official non-test component receipts. */
export function writeOfficialComponentReceipt({ task, workspace, stage, component, payload, version = "1.0.0", revision, supersedes, pairId } = {}) {
  const safeTask = assertTaskHandle(task);
  const registration = OFFICIAL_COMPONENTS[component];
  if (!registration || registration.stage !== stage) throw new Error("component is not allowlisted for this stage");
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new TypeError("official component payload must be an object");
  const write = createTaskKernel(safeTask).publishCanonicalRecord;
  const producer = { stage, component, version };
  let value;
  if (registration.kind === "content" || registration.kind === "versioned-content") {
    if (Object.keys(payload).some((key) => key !== "content") || typeof payload.content !== "string" || payload.content.trim() === "") throw new TypeError(`${component} content payload required`);
    value = { schema_version: "workflowhub-receipt.v1", task_id: safeTask.identity.taskId, stage, producer, content: payload.content, content_hash: sha256(payload.content) };
    if (registration.kind === "versioned-content") {
      if (!Number.isInteger(revision) || revision < 1) throw new TypeError(`${component} revision must be an integer >= 1`);
      const boundPairId = pairId ?? sha256(`${safeTask.identity.taskId}:build-plan:${revision}`);
      if (typeof boundPairId !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(boundPairId)) throw new TypeError(`${component} pair_id is invalid`);
      const expectedRef = `${registration.ref}/rev-${String(revision).padStart(4, "0")}.json`;
      if (revision === 1) {
        if (supersedes != null) throw new Error(`${component} revision 1 cannot supersede another receipt`);
        value = { ...value, revision, pair_id: boundPairId, supersedes: null };
      } else {
        if (!supersedes || typeof supersedes !== "object" || Array.isArray(supersedes) || Object.keys(supersedes).sort().join(",") !== "ref,sha256") throw new TypeError(`${component} supersedes must contain ref and sha256`);
        const previousRef = `${registration.ref}/rev-${String(revision - 1).padStart(4, "0")}.json`;
        if (supersedes.ref !== previousRef || !/^[a-f0-9]{64}$/.test(supersedes.sha256 ?? "")) throw new Error(`${component} supersedes must identify the immediately preceding revision`);
        let previousRaw;
        try { previousRaw = safeTask.readRecord(previousRef); } catch { throw new Error(`${component} superseded receipt is missing`); }
        if (sha256(previousRaw) !== supersedes.sha256) throw new Error(`${component} supersedes hash mismatch`);
        let previous;
        try { previous = JSON.parse(previousRaw); } catch { throw new Error(`${component} superseded receipt is invalid JSON`); }
        if (previous.task_id !== safeTask.identity.taskId || previous.stage !== stage || previous.producer?.component !== component || previous.revision !== revision - 1) throw new Error(`${component} superseded receipt provenance/revision mismatch`);
        if (previous.pair_id === boundPairId) throw new Error(`${component} pair_id must change between revisions`);
        value = { ...value, revision, pair_id: boundPairId, supersedes: { ref: supersedes.ref, sha256: supersedes.sha256 } };
      }
      const raw = `${JSON.stringify(value, null, 2)}\n`; write(expectedRef, raw);
      return Object.freeze({ ref: expectedRef, sha256: sha256(raw), value: Object.freeze(value) });
    }
  } else if (registration.kind === "versioned-fact") {
    if (Object.keys(payload).some((key) => !["status", "facts"].includes(key)) || !new Set(["pass", "fail"]).has(payload.status) || !payload.facts || typeof payload.facts !== "object" || Array.isArray(payload.facts)) throw new TypeError(`${component} fact payload requires status and facts`);
    if (!Number.isInteger(revision) || revision < 1) throw new TypeError(`${component} revision must be an integer >= 1`);
    const boundPairId = pairId ?? sha256(`${safeTask.identity.taskId}:build-plan:${revision}`), ref = `${registration.ref}/rev-${String(revision).padStart(4, "0")}.json`;
    if (revision === 1) { if (supersedes != null) throw new Error(`${component} revision 1 cannot supersede another receipt`); }
    else {
      const previousRef = `${registration.ref}/rev-${String(revision - 1).padStart(4, "0")}.json`;
      if (supersedes?.ref !== previousRef || !/^[a-f0-9]{64}$/.test(supersedes?.sha256 ?? "")) throw new Error(`${component} supersedes must identify the immediately preceding revision`);
      const previousRaw = safeTask.readRecord(previousRef); if (sha256(previousRaw) !== supersedes.sha256) throw new Error(`${component} supersedes hash mismatch`);
      const previous = JSON.parse(previousRaw); if (previous.producer?.component !== component || previous.revision !== revision - 1 || previous.task_id !== safeTask.identity.taskId) throw new Error(`${component} superseded receipt provenance/revision mismatch`);
    }
    value = { schema_version: "workflowhub-build-plan-fact.v1", task_id: safeTask.identity.taskId, stage, producer, revision, pair_id: boundPairId, supersedes: supersedes ?? null, status: payload.status, facts: structuredClone(payload.facts) };
    const raw = `${JSON.stringify(value, null, 2)}\n`; write(ref, raw); return Object.freeze({ ref, sha256: sha256(raw), value: Object.freeze(value) });
  } else if (registration.kind === "implementation") {
    const safeWorkspace = assertWorkspace(workspace), root = safeWorkspace.worktreeRoot;
    if (!Object.prototype.hasOwnProperty.call(payload, "phase_completion") || Object.keys(payload).some((key) => key !== "phase_completion")) throw new TypeError("implementation payload accepts only phase_completion");
    const snapshot = captureWorkspaceSnapshot(safeWorkspace), snapshotHead = snapshot.head, snapshotTree = snapshot.tree;
    const patch = String(execFileSync("git", ["diff", "--binary", "--no-ext-diff", safeWorkspace.baselineCommit, "--"], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }));
    const tracked = git(root, ["diff", "--name-only", safeWorkspace.baselineCommit, "--"]).split("\n").filter(Boolean);
    const untracked = git(root, ["ls-files", "--others", "--exclude-standard"]).split("\n").filter(Boolean);
    const changed = [...new Set([...tracked, ...untracked])].sort();
    const diff = `${JSON.stringify({ schema_version: "workflowhub-diff-evidence.v1", baseline_commit: safeWorkspace.baselineCommit, snapshot_head: snapshotHead, snapshot_tree: snapshotTree, patch, untracked: untracked.map((path) => ({ path, blob_oid: git(root, ["hash-object", "--", path]) })) }, null, 2)}\n`;
    const diffHash = sha256(diff), diffRef = `evidence/implementation-${diffHash}.diff`;
    write(diffRef, diff);
    value = { schema_version: "workflowhub-receipt.v1", task_id: safeTask.identity.taskId, stage, producer, changed, phase_completion: structuredClone(payload.phase_completion), snapshot_head: snapshotHead, snapshot_tree: snapshotTree, snapshot_commit: snapshot.commit, diff_ref: diffRef, diff_hash: diffHash };
  } else {
    if (!Array.isArray(payload.refs) || Object.keys(payload).some((key) => key !== "refs")) throw new TypeError("verify evidence aggregate requires refs only");
    const acceptanceIds = new Set();
    const refs = payload.refs.map((entry, index) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry) || typeof entry.ref !== "string" || !entry.ref.startsWith("evidence/") || !/^[a-f0-9]{64}$/.test(entry.sha256 ?? "")) throw new TypeError(`evidence ref ${index} is invalid`);
      const raw = safeTask.readRecord(entry.ref);
      if (sha256(raw) !== entry.sha256) throw new Error(`evidence ref hash mismatch: ${entry.ref}`);
      const acceptance = validateAcceptanceEvidence(JSON.parse(raw), `evidence ref ${index}`);
      if (acceptance.result !== "pass") throw new Error(`acceptance criterion ${acceptance.acceptance_criterion_id} did not pass`);
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
      const root = safeWorkspace.worktreeRoot;
      const before = captureWorkspaceSnapshot(safeWorkspace), headBefore = before.head, treeBefore = before.tree;
      const startedAt = now();
      const proc = spawnSync(command, { shell: true, cwd: root, encoding: "utf8", maxBuffer: 50 * 1024 * 1024 });
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
      validateProvenance(value, "attempt"); write(ref, `${JSON.stringify(value, null, 2)}\n`); return ref;
    },
    writeResult(ref, value) {
      if (!/^reviews\/results\/[a-zA-Z0-9._-]+\.json$/.test(ref)) throw new Error("canonical review result ref required");
      validateProvenance(value, "result"); write(ref, `${JSON.stringify(value, null, 2)}\n`); return ref;
    },
  });
}

import { createHash } from "node:crypto";
export { createPublication, publishImmutable } from "../runtime/stage/publication.mjs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { ArtifactDir } from "./artifact-dir.mjs";
import { assertTaskHandle } from "./task-handle.mjs";
import { createTaskKernel } from "../runtime/task/task-kernel.mjs";
import { validateAcceptanceEvidence } from "./task-kernel-implementation.mjs";
import { assertCandidateWorkspace, assertWorkspace } from "./workspace.mjs";
import { runWorkspaceCommand } from "../runtime/task/workspace-runner.mjs";
import { captureGitWorktreeSnapshot } from "../runtime/task/git-worktree-snapshot.mjs";
import { validateSchema } from "../skills/wh-review/scripts/schema-validator.mjs";
import { normalizeRuntimeOnlyPaths } from "../runtime/evidence/canonical-utils.mjs";
import { authenticateAuditRetryEvidence, buildAuditSummaryFromJournalEvents } from "./audit-aggregator.mjs";
import { carryAuditSummary, verifyAuditSummary } from "../runtime/evidence/audit-summary-carrier.mjs";
import { readLatestStageContentEvidence, requiredStageContentKinds, verifyStageContentEvidence } from "./stage-content-evidence.mjs";
import { loadStageManifest } from "../runtime/stage/step-manifest.mjs";
import { validateCanonicalTestReceipt } from "./canonical-evidence-validators.mjs";

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
  verification: Object.freeze({ stage: "verify-code", kind: "verification-items", ref: "receipts/verification.json" }),
});

function currentRequirementsLedger(task) {
  let pointerRaw;
  try { pointerRaw = task.readRecord("requirements/current.json"); }
  catch (error) {
    if (error?.code === "ENOENT") return JSON.parse(task.readRecord("requirements/ledger.json"));
    throw error;
  }
  let pointer;
  try { pointer = JSON.parse(pointerRaw); } catch { throw new Error("requirements current pointer is invalid JSON"); }
  if (pointer?.schema_version !== "requirements-current.v1"
      || pointer.task_id !== task.identity.taskId
      || !Number.isInteger(pointer.generation) || pointer.generation < 1
      || typeof pointer.ledger_ref !== "string"
      || !/^[a-f0-9]{64}$/.test(pointer.ledger_hash ?? "")
      || !/^[a-f0-9]{64}$/.test(pointer.content_hash ?? "")) {
    throw new Error("requirements current pointer binding is invalid");
  }
  const raw = task.readRecord(pointer.ledger_ref);
  if (sha256(raw) !== pointer.ledger_hash) throw new Error("requirements current ledger hash mismatch");
  const value = JSON.parse(raw);
  const ledger = pointer.ledger_ref === "requirements/ledger.json" ? value : value?.ledger;
  if (pointer.ledger_ref !== "requirements/ledger.json"
      && (value?.schema_version !== "requirements-ledger-revision.v1"
        || value.task_id !== task.identity.taskId
        || value.parent_ref !== pointer.parent_ref
        || JSON.stringify(value.supersedes) !== JSON.stringify([pointer.parent_ref]))) {
    throw new Error("requirements current revision parent/supersedes binding is invalid");
  }
  if (!ledger || sha256(`${canonicalHashJson(ledger)}\n`) !== pointer.content_hash) {
    throw new Error("requirements current ledger content hash mismatch");
  }
  return ledger;
}

function canonicalJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function canonicalHashJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalHashJson).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalHashJson(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
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

function journalEvents(task) {
  const raw = readCanonicalRecord(task, "journal.jsonl");
  if (raw === undefined) return [];
  return raw.split("\n").filter(Boolean).map((line, index) => {
    try { return JSON.parse(line); }
    catch (error) { throw new Error(`journal line ${index + 1} is invalid JSON: ${error.message}`); }
  });
}

function auditableJournalEvents(task, stage, workflowRunId) {
  const events = journalEvents(task).filter((event) =>
    event.workflow_run_id === workflowRunId && event.stage_slug === stage);
  const byAttempt = new Map();
  for (const event of events) {
    const key = `${event.step_id}\0${event.attempt_id}`;
    const bucket = byAttempt.get(key) ?? [];
    bucket.push(event);
    byAttempt.set(key, bucket);
  }
  const invalidated = new Set();
  const invalidatedEvents = new Map();
  for (const [key, attemptEvents] of byAttempt) {
    const [stepId, attemptId] = key.split("\0");
    const identityHash = sha256(`${workflowRunId}\0${stepId}\0${attemptId}`);
    const ref = `runs/${stage}/journal-invalidations/${identityHash}.json`;
    const raw = readCanonicalRecord(task, ref);
    if (raw === undefined) continue;
    const record = JSON.parse(raw);
    if (record.schema_version !== "stage-step-attempt-invalidation.v1"
        || record.task_id !== task.identity.taskId || record.stage !== stage
        || record.workflow_run_id !== workflowRunId || record.step_id !== Number(stepId)
        || record.attempt_id !== attemptId
        || record.events_hash !== sha256(canonicalHashJson(attemptEvents))) {
      throw new Error("stage step attempt invalidation binding mismatch");
    }
    invalidated.add(key);
    invalidatedEvents.set(key, attemptEvents);
  }
  const auditableEvents = events.filter((event) => !invalidated.has(`${event.step_id}\0${event.attempt_id}`));
  const authenticatedRetries = auditableEvents
    .filter((event) => event.event_type === "step_entry" && event.retry_of_attempt_id)
    .map((retryEvent) => {
      const previousEvents = invalidatedEvents.get(`${retryEvent.step_id}\0${retryEvent.retry_of_attempt_id}`);
      if (previousEvents === undefined) return null;
      return authenticateAuditRetryEvidence({
        task,
        stageSlug: stage,
        workflowRunId,
        retryEvent,
        previousEvents,
      });
    })
    .filter(Boolean);
  return { events: auditableEvents, authenticatedRetries };
}

/** Build and publish the only audit summary from canonical task records. */
function validateMakeDecisionAuditContent(task, contentEvidence, decisionRef = "receipts/decision.json") {
  const decisionRaw = task.readRecord(decisionRef);
  const decision = JSON.parse(decisionRaw);
  const interaction = contentEvidence.find(({ value }) => value.kind === "interaction-completion.v1")?.value;
  const coverage = contentEvidence.find(({ value }) => value.kind === "decision-coverage-audit.v1")?.value;
  if (interaction?.payload?.interaction_type !== "aggregate") {
    throw new Error("make-decision canonical audit requires the current interaction aggregate");
  }
  if (interaction.payload.decision_ref !== decision.decision_ref
      || interaction.payload.decision_hash !== decision.decision_hash) {
    throw new Error("make-decision interaction aggregate differs from the current canonical decision receipt");
  }
  if (coverage?.payload?.decision_log_ref !== decision.decision_ref
      || coverage?.payload?.decision_log_hash !== decision.decision_hash) {
    throw new Error("make-decision decision coverage audit differs from the current canonical decision receipt");
  }
}

export function writeCanonicalAuditSummary({ task, workspace, stage, throughStepId, decisionRef } = {}) {
  const safeTask = assertTaskHandle(task);
  let safeWorkspace;
  if (stage === "make-decision") safeWorkspace = assertCandidateWorkspace(workspace);
  else safeWorkspace = assertWorkspace(workspace);
  const kernel = createTaskKernel(safeTask, stage === "make-decision"
    ? { candidateWorkspace: safeWorkspace }
    : { workspace: safeWorkspace, artifacts: ArtifactDir.open(safeWorkspace.worktreeRoot, safeTask) });
  const activeRun = kernel.activeStageRun(stage);
  const workflowRunId = activeRun.run.workflow_run_id;
  const snapshot = captureGitWorktreeSnapshot(safeWorkspace.worktreeRoot);
  const kinds = requiredStageContentKinds(stage);
  const contentEvidence = kinds.map((kind) => {
    const latest = readLatestStageContentEvidence({
      task: safeTask, stage, workflowRunId, kind,
    });
    if (!latest) throw new Error(`${stage} canonical audit is missing required stage content evidence: ${kind}`);
    if (latest.value.snapshot_tree !== snapshot.tree) throw new Error("latest stage content evidence snapshot mismatch");
    return { ref: latest.ref, hash: latest.hash, value: latest.value };
  });
  // A bounded make-decision audit is the official runtime path. Keep the
  // unbounded writer readable for historical records and generic fixtures.
  if (stage === "make-decision" && throughStepId !== undefined) {
    validateMakeDecisionAuditContent(safeTask, contentEvidence, decisionRef);
  }
  const ledger = currentRequirementsLedger(safeTask);
  const manifest = loadStageManifest(stage, fileURLToPath(new URL("../", import.meta.url)));
  const auditable = auditableJournalEvents(safeTask, stage, workflowRunId);
  const summary = buildAuditSummaryFromJournalEvents(
    auditable.events,
    stage,
    workflowRunId,
    {
      task_id: safeTask.identity.taskId,
      snapshot_tree: snapshot.tree,
      manifest,
      ledger,
      required_content_kinds: kinds,
      content_evidence: contentEvidence,
      authenticated_retries: auditable.authenticatedRetries,
      ...(throughStepId === undefined ? {} : { through_step_id: throughStepId }),
    },
  ).audit_summary;
  const ref = `evidence/audits/${stage}/${summary.summary_hash}.json`;
  const raw = canonicalJson(summary);
  publishCanonicalAuditSummaryRecord({
    summary,
    ref,
    expectedHash: summary.summary_hash,
    readExisting: (recordRef) => readCanonicalRecord(safeTask, recordRef),
    write: kernel.publishCanonicalRecord,
    label: `${stage} canonical audit summary`,
  });
  return Object.freeze({
    ...carryAuditSummary(ref, summary),
    audit_record_hash: sha256(raw),
    content_evidence_refs: summary.content_evidence_refs,
  });
}

export function publishCanonicalAuditSummaryRecord({
  summary,
  ref,
  expectedHash,
  readExisting,
  write,
  label = "canonical audit summary",
}) {
  if (typeof readExisting !== "function" || typeof write !== "function") {
    throw new TypeError("canonical audit publication requires read/write capabilities");
  }
  const check = verifyAuditSummary(ref, summary, { hash: expectedHash });
  if (!check.ok) throw new Error(check.errors.join("; "));
  const raw = canonicalJson(summary);
  const existing = readExisting(ref);
  if (existing === undefined) {
    try {
      write(ref, raw);
    } catch (error) {
      if (error?.code !== "EEXIST" || readExisting(ref) !== raw) throw error;
    }
  } else if (existing !== raw) {
    throw new Error(`${label} already exists with different content`);
  }
  return Object.freeze({ ref, hash: sha256(raw), summary_hash: summary.summary_hash });
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
    if (Object.keys(payload).some((key) => !new Set(["decision_log", "contract_refs"]).has(key))
        || typeof payload.decision_log !== "string" || payload.decision_log.trim() === "") {
      throw new TypeError("decision_log payload required");
    }
    if (payload.contract_refs !== undefined && (!Array.isArray(payload.contract_refs)
        || payload.contract_refs.some((entry) => !entry || typeof entry.ref !== "string" || !/^[a-f0-9]{64}$/.test(entry.hash ?? "")))) {
      throw new TypeError("decision contract_refs must contain canonical ref/hash pairs");
    }
    const decisionHash = sha256(payload.decision_log);
    const decisionRef = `receipts/decision-log/${decisionHash}.md`;
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
    const safeWorkspace = assertWorkspace(workspace);
    if (Object.keys(payload).length !== 0) {
      throw new TypeError("implementation payload must be empty; phase_completion is derived by the official build-code handler");
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
    value = { schema_version: "workflowhub-receipt.v1", task_id: safeTask.identity.taskId, stage, producer, changed, snapshot_head: snapshotHead, snapshot_tree: snapshotTree, snapshot_commit: snapshot.commit, diff_ref: diffRef, diff_hash: diffHash };
  } else if (registration.kind === "verification-items") {
    if (Object.keys(payload).some((key) => key !== "items") || !Array.isArray(payload.items)) {
      throw new TypeError("verification payload requires items only");
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
    value = { schema_version: "workflowhub-receipt.v1", task_id: safeTask.identity.taskId, stage, producer, items };
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
        validateCanonicalTestReceipt(receipt, {
          taskId: safeTask.identity.taskId, stage, snapshotTree: treeBefore, subject: component,
        });
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

import { createHash, randomUUID } from "node:crypto";

import { assertArtifactDir } from "./artifact-dir.mjs";
import { canonical } from "./canonical-utils.mjs";
import { captureGitWorktreeSnapshot } from "./git-worktree-snapshot.mjs";
import { assertWorkspace } from "./workspace.mjs";
import { validateTaskMaterialRevision } from "./stage-content-contracts.mjs";

const BASE_REF = "receipts/spec.json";
const MARKER_REF = "receipts/recoveries/spec.json";
const HASH = /^[a-f0-9]{64}$/;
const TREE = /^[a-f0-9]{40,64}$/;
const REVISION_REF = /^receipts\/revisions\/spec\/[a-f0-9]{64}\.json$/;
const REVIEW_RESULT_REF = /^reviews\/results\/[A-Za-z0-9][A-Za-z0-9._-]*\.json$/;
const REVIEW_RESOLUTION_REF = /^reviews\/resolutions\/[a-f0-9]{64}\.json$/;
const REVIEW_EVENT_REF = /^reviews\/flows\/[a-f0-9]{64}\/event-[0-9]{4}\.json$/;
const INVOCATION_REF = /^identity\/executions\/[A-Za-z0-9][A-Za-z0-9._-]{0,127}\.json$/;
const RECOVERY_OPERATION = "recover-spec-receipt";
const RECOVERY_OWNER_CAPABILITIES = new WeakMap();

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const canonicalJson = (value) => `${JSON.stringify(value, null, 2)}\n`;

function plain(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${label} must be an object`);
  return value;
}

function exactKeys(value, expected, label) {
  const actual = Object.keys(plain(value, label)).sort();
  const wanted = [...expected].sort();
  if (JSON.stringify(actual) !== JSON.stringify(wanted)) throw new Error(`${label} fields are invalid`);
}

export function validateBuildSpecRecoveryInvocation(task, invocation) {
  exactKeys(invocation, ["ref", "hash", "identity"], "build-spec recovery invocation");
  if (!INVOCATION_REF.test(invocation.ref ?? "") || !HASH.test(invocation.hash ?? "")) {
    throw new Error("build-spec recovery invocation ref/hash is invalid");
  }
  const raw = task.readRecord(invocation.ref);
  if (sha256(raw) !== invocation.hash) throw new Error("build-spec recovery invocation hash changed");
  const value = JSON.parse(raw);
  if (raw !== `${canonical(value)}\n` || JSON.stringify(value) !== JSON.stringify(invocation.identity)) {
    throw new Error("build-spec recovery invocation identity changed");
  }
  if (value.schema_version !== "workflowhub-invocation-identity.v1"
      || value.project_name !== task.identity.projectName || value.task_id !== task.identity.taskId
      || value.stage !== "build-spec" || value.source_kind !== "git_invocation" || value.source_clean !== true
      || !TREE.test(value.source?.git_oid ?? "") || !TREE.test(value.source?.git_tree ?? "")) {
    throw new Error("build-spec recovery requires a clean committed invocation");
  }
  const unsigned = { ...value };
  delete unsigned.execution_manifest_hash;
  if (value.execution_manifest_hash !== sha256(canonical(unsigned))) {
    throw new Error("build-spec recovery invocation manifest hash changed");
  }
  exactKeys(value.contracts, ["agents", "stage_skill", "constitution"], "build-spec recovery invocation contracts");
  const expectedContractRefs = {
    agents: "AGENTS.md",
    stage_skill: "workflows/build-spec/SKILL.md",
    constitution: "CONSTITUTION.md",
  };
  for (const [name, contract] of Object.entries(value.contracts)) {
    exactKeys(contract, ["ref", "sha256"], `build-spec recovery ${name} contract`);
    if (contract.ref !== expectedContractRefs[name] || !HASH.test(contract.sha256 ?? "")) {
      throw new Error(`build-spec recovery ${name} contract is unavailable`);
    }
  }
  if (!Array.isArray(value.capabilities) || !value.capabilities.includes("stage:build-spec")) {
    throw new Error("build-spec recovery invocation capability is unavailable");
  }
  return Object.freeze({ ref: invocation.ref, hash: invocation.hash });
}

export function issueBuildSpecRecoveryOwnerCapability({
  task,
  workspace,
  boundary,
} = {}) {
  if (!task || typeof task.readRecord !== "function" || typeof task.identity?.taskId !== "string") {
    throw new TypeError("build-spec recovery owner requires a task read capability");
  }
  const safeWorkspace = assertWorkspace(workspace);
  if (!boundary || boundary.schema_version !== "workflowhub-write-boundary-preflight.v1"
      || boundary.status !== "valid" || !Array.isArray(boundary.violations) || boundary.violations.length !== 0
      || boundary.task_id !== task.identity.taskId || boundary.stage !== "build-spec"
      || boundary.operation !== RECOVERY_OPERATION
      || boundary.worktree_root !== safeWorkspace.worktreeRoot
      || boundary.path_card?.worktree_root !== safeWorkspace.worktreeRoot
      || boundary.path_card?.source?.invocation_ref !== boundary.invocation_ref
      || boundary.path_card?.source?.invocation_hash !== boundary.invocation_hash) {
    throw new Error("build-spec recovery requires the current recover-spec-receipt write boundary");
  }
  const invocationIdentity = JSON.parse(task.readRecord(boundary.invocation_ref));
  const invocation = validateBuildSpecRecoveryInvocation(task, {
    ref: boundary.invocation_ref,
    hash: boundary.invocation_hash,
    identity: invocationIdentity,
  });
  if (boundary.authority_refs?.length !== 1
      || boundary.authority_refs[0]?.ref !== invocation.ref
      || boundary.authority_refs[0]?.sha256 !== invocation.hash) {
    throw new Error("build-spec recovery write boundary invocation binding is invalid");
  }
  const nonce = randomUUID();
  const identity = Object.freeze({
    task_id: task.identity.taskId,
    stage: "build-spec",
    operation: RECOVERY_OPERATION,
    invocation_ref: invocation.ref,
    invocation_hash: invocation.hash,
    worktree_root: safeWorkspace.worktreeRoot,
  });
  const capabilityHash = sha256(canonical({ identity, nonce }));
  const capability = Object.freeze({
    schema_version: "workflowhub-build-spec-recovery-owner.v1",
    identity,
    nonce,
    capability_hash: capabilityHash,
    invocation: Object.freeze({
      ...invocation,
      identity: Object.freeze(invocationIdentity),
    }),
  });
  RECOVERY_OWNER_CAPABILITIES.set(capability, {
    identity,
    nonce,
    capabilityHash,
    invocation,
    consumed: false,
  });
  return capability;
}

export function consumeBuildSpecRecoveryOwnerCapability({
  task,
  workspace,
  capability,
} = {}) {
  const state = capability && RECOVERY_OWNER_CAPABILITIES.get(capability);
  const safeWorkspace = assertWorkspace(workspace);
  if (!state || capability.schema_version !== "workflowhub-build-spec-recovery-owner.v1"
      || state.consumed
      || capability.identity !== state.identity
      || capability.nonce !== state.nonce
      || capability.capability_hash !== state.capabilityHash
      || capability.capability_hash !== sha256(canonical({ identity: state.identity, nonce: state.nonce }))
      || state.identity.task_id !== task?.identity?.taskId
      || state.identity.stage !== "build-spec"
      || state.identity.operation !== RECOVERY_OPERATION
      || state.identity.worktree_root !== safeWorkspace.worktreeRoot) {
    throw new Error("build-spec receipt recovery requires an unconsumed current recovery owner capability");
  }
  state.consumed = true;
  return validateBuildSpecRecoveryInvocation(task, {
    ...state.invocation,
    identity: JSON.parse(task.readRecord(state.invocation.ref)),
  });
}

export function buildSpecReviewAction(task, binding) {
  const authentication = plain(binding?.authentication, "build-spec review authentication");
  const flow = plain(authentication.flow, "build-spec authenticated review flow");
  if (!REVIEW_EVENT_REF.test(flow.event_ref ?? "")) throw new Error("build-spec authenticated review event ref is invalid");
  if (!REVIEW_RESULT_REF.test(flow.head_result_ref ?? "") || !HASH.test(flow.result_sha256 ?? "")) {
    throw new Error("build-spec recovery requires an authenticated semantic review head");
  }
  const eventRaw = task.readRecord(flow.event_ref);
  const event = JSON.parse(eventRaw);
  if (event.event_ref !== flow.event_ref || event.head_result_ref !== flow.head_result_ref || event.result_sha256 !== flow.result_sha256) {
    throw new Error("build-spec authenticated review event changed");
  }
  const actionRef = flow.event_kind === "resolution" ? flow.action_ref : flow.head_result_ref;
  const actionHash = flow.event_kind === "resolution" ? flow.action_sha256 : flow.result_sha256;
  if (flow.event_kind === "resolution") {
    if (!REVIEW_RESOLUTION_REF.test(actionRef ?? "") || !HASH.test(actionHash ?? "")) throw new Error("build-spec recovery resolution action is invalid");
  } else if (flow.event_kind !== "semantic_result" || actionRef !== flow.head_result_ref || actionHash !== flow.result_sha256) {
    throw new Error("build-spec recovery requires the latest semantic result or resolution action");
  }
  return Object.freeze({
    event_ref: flow.event_ref,
    event_hash: sha256(eventRaw),
    event_kind: flow.event_kind,
    head_result_ref: flow.head_result_ref,
    head_result_hash: flow.result_sha256,
    action_ref: actionRef,
    action_hash: actionHash,
  });
}

export function validateBuildSpecBase(value, raw, taskId) {
  exactKeys(value, ["schema_version", "task_id", "stage", "producer", "content", "content_hash"], "build-spec base spec receipt");
  exactKeys(value.producer, ["stage", "component", "version"], "build-spec base spec receipt producer");
  if (value.schema_version !== "workflowhub-receipt.v1" || value.task_id !== taskId || value.stage !== "build-spec"
      || value.producer.stage !== "build-spec" || value.producer.component !== "spec"
      || typeof value.producer.version !== "string" || value.producer.version.trim() === ""
      || typeof value.content !== "string" || value.content.trim() === "" || value.content_hash !== sha256(value.content)
      || raw !== canonicalJson(value)) {
    throw new Error("build-spec receipt recovery base is not the canonical create-only spec receipt");
  }
}

function buildSpecRevision({ taskId, baseRaw, content }) {
  const value = {
    schema_version: "workflowhub-receipt.v1",
    task_id: taskId,
    stage: "build-spec",
    producer: { stage: "build-spec", component: "spec", version: "1.0.0" },
    content,
    content_hash: sha256(content),
  };
  const contentHash = sha256(canonicalJson(value));
  const ref = `receipts/revisions/spec/${contentHash}.json`;
  const revised = {
    ...value,
    revision: { previous_ref: BASE_REF, previous_hash: sha256(baseRaw), content_hash: contentHash },
  };
  return Object.freeze({ ref, value: revised, raw: canonicalJson(revised) });
}

export function validateBuildSpecRevision(value, raw, { ref, taskId, baseHash, content }) {
  exactKeys(value, ["schema_version", "task_id", "stage", "producer", "content", "content_hash", "revision"], "recovered spec receipt");
  exactKeys(value.producer, ["stage", "component", "version"], "recovered spec receipt producer");
  exactKeys(value.revision, ["previous_ref", "previous_hash", "content_hash"], "recovered spec receipt revision");
  const canonicalPayload = canonicalJson({
    schema_version: value.schema_version,
    task_id: value.task_id,
    stage: value.stage,
    producer: value.producer,
    content: value.content,
    content_hash: value.content_hash,
  });
  const payloadHash = sha256(canonicalPayload);
  if (value.schema_version !== "workflowhub-receipt.v1" || value.task_id !== taskId || value.stage !== "build-spec"
      || value.producer.stage !== "build-spec" || value.producer.component !== "spec"
      || value.producer.version !== "1.0.0"
      || value.content !== content || value.content_hash !== sha256(content)
      || value.revision.previous_ref !== BASE_REF || value.revision.previous_hash !== baseHash
      || value.revision.content_hash !== payloadHash
      || ref !== `receipts/revisions/spec/${payloadHash}.json`
      || raw !== canonicalJson(value)) {
    throw new Error("recovered spec receipt provenance is invalid");
  }
}

function buildSpecRecoveryMarker({ taskId, baseRaw, recoveredRaw, recoveredRef, artifactRef, content, snapshotTree, action, invocation }) {
  return {
    schema_version: "workflowhub-build-spec-receipt-recovery.v2",
    task_id: taskId,
    stage: "build-spec",
    component: "spec",
    base_receipt_ref: BASE_REF,
    base_receipt_hash: sha256(baseRaw),
    recovered_receipt_ref: recoveredRef,
    recovered_receipt_hash: sha256(recoveredRaw),
    artifact_ref: artifactRef,
    content_hash: sha256(content),
    snapshot_tree: snapshotTree,
    review_action: action,
    invocation,
  };
}

export function createBuildSpecReceiptRecoveryRecords({
  task,
  workspace,
  artifacts,
  input,
  authenticatedFlow,
  invocation,
} = {}) {
  if (!task || typeof task.readRecord !== "function" || typeof task.identity?.taskId !== "string") {
    throw new TypeError("build-spec receipt recovery requires a task read capability");
  }
  const safeWorkspace = assertWorkspace(workspace);
  const safeArtifacts = assertArtifactDir(artifacts);
  const invocationBinding = validateBuildSpecRecoveryInvocation(task, invocation);
  exactKeys(input, ["content", "receipts"], "build-spec receipt recovery input");
  const action = buildSpecReviewAction(task, { authentication: { flow: authenticatedFlow } });
  const expectedReceiptKeys = action.event_kind === "resolution"
    ? ["review", "review_resolution"]
    : ["review"];
  exactKeys(input.receipts, expectedReceiptKeys, "build-spec receipt recovery receipts");
  if (input.receipts.review !== action.head_result_ref) {
    throw new Error("build-spec receipt recovery review is not the authenticated review-flow head");
  }
  if (action.event_kind === "resolution" && input.receipts.review_resolution !== action.action_ref) {
    throw new Error("build-spec receipt recovery resolution is not the latest authenticated review-flow action");
  }
  const reviewRaw = task.readRecord(action.head_result_ref);
  if (sha256(reviewRaw) !== action.head_result_hash) throw new Error("build-spec authenticated review result changed");
  const content = safeArtifacts.read("spec.md", "utf8");
  if (input.content !== content) throw new Error("build-spec receipt recovery content must equal the current spec.md bytes");
  const snapshot = captureGitWorktreeSnapshot(safeWorkspace.worktreeRoot);
  const actionRaw = task.readRecord(action.action_ref);
  if (sha256(actionRaw) !== action.action_hash) throw new Error("build-spec authenticated review action changed");
  const actionValue = JSON.parse(actionRaw);
  if (actionValue.task_id !== task.identity.taskId || actionValue.stage !== "build-spec"
      || actionValue.snapshot_tree !== snapshot.tree) {
    throw new Error("build-spec recovery review action does not bind the final current snapshot");
  }
  const baseRaw = task.readRecord(BASE_REF);
  validateBuildSpecBase(JSON.parse(baseRaw), baseRaw, task.identity.taskId);
  const revision = buildSpecRevision({ taskId: task.identity.taskId, baseRaw, content });
  const marker = buildSpecRecoveryMarker({
    taskId: task.identity.taskId,
    baseRaw,
    recoveredRaw: revision.raw,
    recoveredRef: revision.ref,
    artifactRef: safeArtifacts.reference("spec.md"),
    content,
    snapshotTree: snapshot.tree,
    action,
    invocation: invocationBinding,
  });
  return Object.freeze({
    revisionRef: revision.ref,
    revisionRaw: revision.raw,
    markerRaw: canonicalJson(marker),
  });
}

export function validateBuildSpecRecoveryMarker(value, raw, {
  taskId,
  baseRaw,
  recoveredRaw,
  recoveredRef,
  artifactRef,
  content,
  snapshotTree,
  action,
  invocation,
}) {
  exactKeys(value, [
    "schema_version", "task_id", "stage", "component", "base_receipt_ref", "base_receipt_hash",
    "recovered_receipt_ref", "recovered_receipt_hash", "artifact_ref", "content_hash",
    "snapshot_tree", "review_action", "invocation",
  ], "build-spec receipt recovery marker");
  exactKeys(value.review_action, [
    "event_ref", "event_hash", "event_kind", "head_result_ref", "head_result_hash", "action_ref", "action_hash",
  ], "build-spec receipt recovery marker review_action");
  exactKeys(value.invocation, ["ref", "hash"], "build-spec receipt recovery marker invocation");
  if (value.schema_version !== "workflowhub-build-spec-receipt-recovery.v2"
      || value.task_id !== taskId || value.stage !== "build-spec" || value.component !== "spec"
      || value.base_receipt_ref !== BASE_REF || value.base_receipt_hash !== sha256(baseRaw)
      || value.recovered_receipt_ref !== recoveredRef || value.recovered_receipt_hash !== sha256(recoveredRaw)
      || value.artifact_ref !== artifactRef || value.content_hash !== sha256(content)
      || value.snapshot_tree !== snapshotTree || !TREE.test(value.snapshot_tree)
      || JSON.stringify(value.review_action) !== JSON.stringify(action)
      || JSON.stringify(value.invocation) !== JSON.stringify(invocation)
      || raw !== canonicalJson(value)) {
    throw new Error("build-spec receipt recovery marker binding is invalid");
  }
}

export function assertLatestBuildSpecReceipt({ worker, item, binding } = {}) {
  if (typeof worker?.readOptionalReceipt !== "function") {
    throw new Error("build-spec spec consumer requires readOptionalReceipt capability");
  }
  const markerRecord = worker.readOptionalReceipt(MARKER_REF);
  if (markerRecord === null) {
    if (item.ref !== BASE_REF || item.value.revision !== undefined) {
      throw new Error(`build-spec spec consumer accepts only ${BASE_REF} before recovery`);
    }
    const baseRaw = canonicalJson(item.value);
    validateBuildSpecBase(item.value, baseRaw, worker.identity.taskId);
    if (item.evidence.sha256 !== sha256(baseRaw)) throw new Error("build-spec base receipt is not canonical");
    const pointerRecord = worker.readOptionalReceipt("materials/current.json");
    if (pointerRecord === null) return;
    const pointer = pointerRecord.value;
    if (pointer?.schema_version !== "task-material-current.v1"
        || pointer.task_id !== worker.identity.taskId
        || !Number.isInteger(pointer.generation) || pointer.generation < 1
        || !/^materials\/revisions\/[a-f0-9]{64}\.json$/.test(pointer.revision_ref ?? "")
        || !HASH.test(pointer.revision_hash ?? "")) {
      throw new Error("build-spec material current pointer is invalid");
    }
    const revisionRecord = worker.readReceipt(pointer.revision_ref);
    const revision = revisionRecord.value;
    const revisionValidation = validateTaskMaterialRevision(revision);
    if (!revisionValidation.ok
        || revisionRecord.sha256 !== pointer.revision_hash
        || revision.task_id !== worker.identity.taskId
        || revision.revision_id !== pointer.revision_id
        || revision.previous_ref !== (pointer.previous_ref ?? null)
        || revision.hashes?.["spec.md"] !== sha256(binding.artifactContent)) {
      throw new Error("build-spec current material revision does not bind current spec.md");
    }
    if (revision.previous_ref === null) {
      if (revision.parent_revision !== null || revision.previous_hash !== null) {
        throw new Error("build-spec root material revision has a forged parent");
      }
    } else {
      const priorRecord = worker.readReceipt(revision.previous_ref);
      if (priorRecord.sha256 !== revision.previous_hash
          || !validateTaskMaterialRevision(priorRecord.value).ok
          || priorRecord.value.revision_id !== revision.parent_revision) {
        throw new Error("build-spec material revision parent does not match previous_ref");
      }
    }
    return Object.freeze({
      current_material_revision: Object.freeze({
        ref: pointer.revision_ref,
        hash: pointer.revision_hash,
        revision_id: revision.revision_id,
      }),
      accepted_history: "read_only",
    });
  }
  if (item.ref === BASE_REF) throw new Error("build-spec spec consumer rejects the stale base receipt after recovery");
  if (!REVISION_REF.test(item.ref)) throw new Error("build-spec spec consumer requires the latest recovered receipt");
  const baseRecord = worker.readReceipt(BASE_REF);
  validateBuildSpecBase(baseRecord.value, canonicalJson(baseRecord.value), worker.identity.taskId);
  if (baseRecord.sha256 !== sha256(canonicalJson(baseRecord.value))) throw new Error("build-spec base receipt is not canonical");
  const recoveredRecord = worker.readReceipt(item.ref);
  if (recoveredRecord.sha256 !== item.evidence.sha256) throw new Error("build-spec recovered receipt hash changed");
  validateBuildSpecRevision(recoveredRecord.value, canonicalJson(recoveredRecord.value), {
    ref: item.ref,
    taskId: worker.identity.taskId,
    baseHash: baseRecord.sha256,
    content: binding.artifactContent,
  });
  const action = buildSpecReviewAction({
    readRecord(ref) {
      const record = worker.readReceipt(ref);
      return canonicalJson(record.value);
    },
  }, binding);
  const markerInvocation = markerRecord.value.invocation;
  const invocationRecord = worker.readReceipt(markerInvocation?.ref);
  const invocation = validateBuildSpecRecoveryInvocation({
    identity: worker.identity,
    readRecord(ref) {
      const record = worker.readReceipt(ref);
      return `${canonical(record.value)}\n`;
    },
  }, {
    ref: markerInvocation?.ref,
    hash: markerInvocation?.hash,
    identity: invocationRecord.value,
  });
  validateBuildSpecRecoveryMarker(markerRecord.value, canonicalJson(markerRecord.value), {
    taskId: worker.identity.taskId,
    baseRaw: canonicalJson(baseRecord.value),
    recoveredRaw: canonicalJson(recoveredRecord.value),
    recoveredRef: item.ref,
    artifactRef: worker.artifactRef("spec.md"),
    content: binding.artifactContent,
    snapshotTree: binding.snapshot.tree,
    action,
    invocation,
  });
  if (markerRecord.sha256 !== sha256(canonicalJson(markerRecord.value))) throw new Error("build-spec receipt recovery marker hash changed");
}

export const BUILD_SPEC_RECOVERY_REFS = Object.freeze({ base: BASE_REF, marker: MARKER_REF });

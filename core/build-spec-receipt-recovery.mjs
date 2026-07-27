import { createHash } from "node:crypto";

const BASE_REF = "receipts/spec.json";
const MARKER_REF = "receipts/recoveries/spec.json";
const HASH = /^[a-f0-9]{64}$/;
const TREE = /^[a-f0-9]{40,64}$/;
const REVISION_REF = /^receipts\/revisions\/spec\/[a-f0-9]{64}\.json$/;
const REVIEW_RESULT_REF = /^reviews\/results\/[A-Za-z0-9][A-Za-z0-9._-]*\.json$/;
const REVIEW_RESOLUTION_REF = /^reviews\/resolutions\/[a-f0-9]{64}\.json$/;
const REVIEW_EVENT_REF = /^reviews\/flows\/[a-f0-9]{64}\/event-[0-9]{4}\.json$/;

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

function buildSpecRecoveryMarker({ taskId, baseRaw, recoveredRaw, recoveredRef, artifactRef, content, snapshotTree, action }) {
  return {
    schema_version: "workflowhub-build-spec-receipt-recovery.v1",
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
  };
}

export function validateBuildSpecRecoveryMarker(value, raw, { taskId, baseRaw, recoveredRaw, recoveredRef, artifactRef, content, snapshotTree, action }) {
  exactKeys(value, [
    "schema_version", "task_id", "stage", "component", "base_receipt_ref", "base_receipt_hash",
    "recovered_receipt_ref", "recovered_receipt_hash", "artifact_ref", "content_hash",
    "snapshot_tree", "review_action",
  ], "build-spec receipt recovery marker");
  exactKeys(value.review_action, [
    "event_ref", "event_hash", "event_kind", "head_result_ref", "head_result_hash", "action_ref", "action_hash",
  ], "build-spec receipt recovery marker review_action");
  if (value.schema_version !== "workflowhub-build-spec-receipt-recovery.v1"
      || value.task_id !== taskId || value.stage !== "build-spec" || value.component !== "spec"
      || value.base_receipt_ref !== BASE_REF || value.base_receipt_hash !== sha256(baseRaw)
      || value.recovered_receipt_ref !== recoveredRef || value.recovered_receipt_hash !== sha256(recoveredRaw)
      || value.artifact_ref !== artifactRef || value.content_hash !== sha256(content)
      || value.snapshot_tree !== snapshotTree || !TREE.test(value.snapshot_tree)
      || JSON.stringify(value.review_action) !== JSON.stringify(action)
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
    return;
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
  validateBuildSpecRecoveryMarker(markerRecord.value, canonicalJson(markerRecord.value), {
    taskId: worker.identity.taskId,
    baseRaw: canonicalJson(baseRecord.value),
    recoveredRaw: canonicalJson(recoveredRecord.value),
    recoveredRef: item.ref,
    artifactRef: worker.artifactRef("spec.md"),
    content: binding.artifactContent,
    snapshotTree: binding.snapshot.tree,
    action,
  });
  if (markerRecord.sha256 !== sha256(canonicalJson(markerRecord.value))) throw new Error("build-spec receipt recovery marker hash changed");
}

export const BUILD_SPEC_RECOVERY_REFS = Object.freeze({ base: BASE_REF, marker: MARKER_REF });

import { createHash, randomUUID } from "node:crypto";
import { assertTaskKernel } from "../task/task-capability.mjs";
import { aggregateCanonicalProviderResults, providerAdapter } from "./canonical-review-result.mjs";

const SHA256_HEX = /^[a-f0-9]{64}$/;
const GIT_OID = /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/;
const MATERIAL_REVISION = /^revision-[a-f0-9]{64}$/;
const IN_PROCESS_REQUEST_LOCKS = new Map();

function textHash(text) {
  return createHash("sha256").update(text).digest("hex");
}

function providerFileName(provider, index) {
  const encoded = Buffer.from(provider, "utf8").toString("base64url");
  return `p-${encoded}-${index}.output.json`;
}

function assertTaskHandle(task) {
  if (!task || typeof task.writeRecordAtomic !== "function" || typeof task.readRecord !== "function") {
    throw new TypeError("recordSimpleReviewResult requires a TaskHandle with writeRecordAtomic/readRecord");
  }
  return task;
}

function createCanonicalRecord(task, relativePath, data) {
  if (typeof task.createRecordAtomic === "function") return task.createRecordAtomic(relativePath, data);
  return task.writeRecordAtomic(relativePath, data);
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}
function policyHash(policy) {
  return createHash("sha256").update(canonicalJson(policy)).digest("hex");
}

function reviewRequestMaterialId(request, materialIdForRequest = null) {
  if (typeof materialIdForRequest === "function") {
    const value = materialIdForRequest(request);
    if (typeof value !== "string" || !SHA256_HEX.test(value)) throw new TypeError("materialIdForRequest must return a sha256 hex string");
    return value;
  }
  for (const value of [request?.material_id, request?.materialId]) {
    if (typeof value === "string" && SHA256_HEX.test(value)) return value;
  }
  return textHash(canonicalJson({
    stage: request?.stage ?? null,
    review_track: request?.review_track ?? request?.reviewTrack ?? null,
    review_kind: request?.review_kind ?? request?.reviewKind ?? null,
    materials: request?.materials ?? null,
  }));
}

function requestLockHash(request, materialId) {
  const stable = {
    stage: request.stage,
    review_track: request.review_track ?? request.reviewTrack ?? null,
    review_kind: request.review_kind ?? request.reviewKind ?? null,
    review_scope: request.review_scope ?? request.reviewScope ?? null,
    subject: request.subject ?? null,
    reason: request.reason ?? request.reason_code ?? request.recheck_reason ?? null,
    review_policy: request.review_policy ?? request.reviewPolicy ?? null,
    host_provider: request.host_provider ?? request.hostProvider ?? null,
    material_id: materialId,
  };
  return textHash(canonicalJson(stable));
}

function findReusableReview({ task, request, identity, materialId, requestKey }) {
  if (typeof task.listCanonicalReviewAttemptRefs !== "function" || (materialId === null && !requestKey)) return null;
  let partial = null;
  const attempts = task.listCanonicalReviewAttemptRefs();
  for (const attemptRef of attempts) {
    let attempt;
    try { attempt = JSON.parse(task.readRecord(attemptRef)); } catch { continue; }
    if (attempt.task_id !== task.identity.taskId
        || attempt.stage !== request.stage
        || (attempt.review_track ?? null) !== (request.review_track ?? request.reviewTrack ?? null)
        || (attempt.review_kind ?? null) !== (request.review_kind ?? request.reviewKind ?? null)
        || attempt.snapshot_tree !== identity.tree
        || attempt.material_revision !== identity.materialRevision
        || (materialId !== null && attempt.material_id !== materialId)) continue;
    if (requestKey) {
      if (typeof attempt.request_key === "string") {
        if (attempt.request_key !== requestKey) continue;
      } else {
        if (typeof attempt.report_ref !== "string") continue;
        let report;
        try { report = task.readRecord(attempt.report_ref); } catch { continue; }
        if (!report.includes(`request_key: ${requestKey}`)) continue;
      }
      // The report is part of the canonical request record. A matching
      // attempt/result without a readable report is a partial write and must
      // fail closed instead of being treated as reusable success.
      if (typeof attempt.report_ref !== "string") {
        partial ??= { attempt_ref: attemptRef, result_ref: null, incomplete: true };
        continue;
      }
      try { task.readRecord(attempt.report_ref); }
      catch {
        partial ??= { attempt_ref: attemptRef, result_ref: null, incomplete: true };
        continue;
      }
    }
    // An unavailable attempt is a complete terminal fact when its immutable
    // report exists. It has no result record by design, so do not classify it
    // as a partially written attempt or dispatch the same request again.
    if (attempt.terminal_status === "unavailable" && typeof attempt.report_ref === "string") {
      try {
        task.readRecord(attempt.report_ref);
        return { attempt_ref: attemptRef, result_ref: null, report_ref: attempt.report_ref };
      } catch { /* keep scanning for a readable immutable pair */ }
    }
    const resultRefs = typeof task.listCanonicalReviewResultRefs === "function" ? task.listCanonicalReviewResultRefs() : [];
    for (const resultRef of resultRefs) {
      try {
        const result = JSON.parse(task.readRecord(resultRef));
        if (result.attempt_ref === attemptRef) return { attempt_ref: attemptRef, result_ref: resultRef, report_ref: attempt.report_ref ?? null };
      } catch { /* retain only a complete readable pair */ }
    }
    // A partially written attempt must not hide a later complete immutable
    // pair for the same request. Keep scanning; only reuse the partial record
    // when no complete pair exists, and let the caller fail closed rather than
    // dispatching a duplicate request.
    partial ??= { attempt_ref: attemptRef, result_ref: null, incomplete: true };
  }
  return partial;
}

function reviewReportRef(stage, resultId) {
  return `quality/reviews/reports/${stage}-simple-${resultId}.md`;
}

function reviewReportBody({ attempt, result = null, requestKey = null }) {
  const status = attempt.terminal_status === "semantic" ? "available" : "unavailable";
  return [
    "# WorkflowHub review record",
    "",
    `status: ${status}`,
    `terminal_status: ${attempt.terminal_status}`,
    `task_id: ${attempt.task_id}`,
    `stage: ${attempt.stage}`,
    `attempt_id: ${attempt.attempt_id}`,
    `snapshot_tree: ${attempt.snapshot_tree}`,
    `material_id: ${attempt.material_id}`,
    `dispatch_state: ${attempt.dispatch_state ?? "legacy_unclassified"}`,
    ...(requestKey ? [`request_key: ${requestKey}`] : []),
    `error: ${attempt.error ? JSON.stringify(attempt.error) : "null"}`,
    ...(result ? ["", "```json", JSON.stringify({ findings: result.findings, provider_results: result.provider_results }), "```"] : []),
    "",
  ].join("\n");
}

function reviewRequestError(error) {
  const code = typeof error?.code === "string" && error.code.trim() !== "" ? error.code : "REVIEW_EXECUTION_FAILED";
  const message = typeof error?.message === "string" && error.message.trim() !== "" ? error.message : "review request failed before a semantic result";
  return { code, message };
}

function recordError(error, fallback) {
  const value = error ?? fallback;
  if (!value || typeof value !== "object" || Array.isArray(value)
      || typeof value.code !== "string" || value.code.trim() === ""
      || typeof value.message !== "string" || value.message.trim() === "") {
    throw new TypeError("review error must contain a non-empty code and message");
  }
  // Public diagnostics may retain cause_code; attempt/provider records use
  // the existing two-field schema. Transport detail remains on provider facts.
  return { code: value.code, message: value.message };
}

function buildPolicy(result) {
  const providers = result.provider_results?.map((item) => item.provider) ?? [];
  const minimum = Number.isSafeInteger(result.minimum_heterologous) && result.minimum_heterologous >= 1
    ? result.minimum_heterologous : 1;
  const effectiveProfiles = providers.map((provider) => ({
    provider,
    adapter: providerAdapter(provider),
    model: result.provider_results.find((item) => item.provider === provider)?.identity?.model ?? null,
    effort: null,
    thinking: null,
  }));
  const specs = providers.map((provider, index) => {
    const item = result.provider_results[index];
    return {
      provider,
      model: item?.identity?.model ?? null,
      effort: null,
      thinking: null,
      priority: 0,
    };
  });
  const policy = {
    source: "wh_review.v2",
    mode: "single_round",
    minimum_heterologous: minimum,
    requested_profiles: providers,
    eligible_profiles: providers,
    same_source_exclusions: [],
    effective_profiles: effectiveProfiles,
    requested_profile_specs: specs,
  };
  return { policy, policy_snapshot_hash: policyHash(policy) };
}
function normalizeIdentity(item, provider) {
  if (!item || typeof item !== "object") return null;
  return {
    provider,
    adapter: providerAdapter(provider),
    source_id: typeof item.source_id === "string" && item.source_id.trim() !== "" ? item.source_id : provider,
    config_id: typeof item.config_id === "string" && item.config_id.trim() !== "" ? item.config_id : provider,
    model: item.model ?? "unknown",
  };
}

function providerAttemptRecord(item, runtimeId, outputRef = null) {
  const completed = item?.status === "completed" && item?.error === null;
  const status = completed ? "completed" : item?.status === "cancelled" ? "cancelled" : "failed";
  return {
    provider: item.provider,
    status,
    identity: normalizeIdentity(item.identity, item.provider),
    session_id: item.session_id ?? null,
    runtime_id: runtimeId ?? null,
    output_ref: outputRef,
    raw_output_ref: null,
    error: status === "completed" ? null : recordError(item.error, { code: "PROVIDER_RESULT_UNAVAILABLE", message: "provider result unavailable" }),
    execution: {
      adapter: providerAdapter(item.provider),
      model: item.identity?.model ?? "unknown",
      effort: null,
      thinking: null,
      timing: item.timing ?? { started_at_ms: null, completed_at_ms: null, duration_ms: null },
      usage: item.usage ?? null,
      retry: { count: 0, progress_events: 0 },
      runtime_id: runtimeId ?? "unknown",
      session_file_path: null,
    },
  };
}

function assertAuthenticatedReviewIdentity(task, kernel) {
  const taskKernel = assertTaskKernel(kernel);
  if (taskKernel.task !== task
      || typeof taskKernel.currentVNextSnapshot !== "function"
      || typeof taskKernel.currentVNextMaterialRevision !== "function") {
    throw new TypeError("review record requires the authenticated TaskKernel for this task");
  }
  const context = typeof taskKernel.currentVNextContext === "function"
    ? taskKernel.currentVNextContext()
    : { snapshot: taskKernel.currentVNextSnapshot(), materialRevision: taskKernel.currentVNextMaterialRevision() };
  const snapshot = context.snapshot;
  const materialRevision = context.materialRevision;
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) {
    throw new TypeError("review record requires an authenticated current snapshot");
  }
  for (const [name, value] of [["head", snapshot.head], ["tree", snapshot.tree], ["commit", snapshot.commit]]) {
    if (typeof value !== "string" || !GIT_OID.test(value)) {
      throw new TypeError(`review record current snapshot.${name} must be a Git object id`);
    }
  }
  if (typeof materialRevision !== "string" || !MATERIAL_REVISION.test(materialRevision)) {
    throw new TypeError("review record current material revision must match revision-<sha256>");
  }
  return Object.freeze({
    tree: snapshot.tree,
    source: {
      target_commit: snapshot.head,
      base_commit: snapshot.commit,
      base_tree: snapshot.tree,
      captured_head: snapshot.head,
    },
    materialRevision,
  });
}

/**
 * Authenticated host request path. The request is dispatched and persisted
 * under one task lock; a second identical current request reuses the
 * immutable canonical refs instead of dispatching a second provider call.
 */
export async function recordSimpleReviewRequest({ task, kernel, request, runRound, materialIdForRequest = null } = {}) {
  const taskHandle = assertTaskHandle(task);
  if (!request || typeof request !== "object" || Array.isArray(request)) throw new TypeError("review request must be an object");
  if (Object.hasOwn(request, "result")) throw new TypeError("review request cannot contain a result field");
  for (const field of ["snapshot_tree", "material_revision", "task_id", "task_path", "project_name"]) {
    if (Object.hasOwn(request, field)) throw new TypeError(`review request identity field is host-owned: ${field}`);
  }
  if (typeof request.stage !== "string" || request.stage.trim() === "") throw new TypeError("review request stage is required");
  if (typeof runRound !== "function") throw new TypeError("runRound must be a function");
  const before = assertAuthenticatedReviewIdentity(taskHandle, kernel);
  const materialId = reviewRequestMaterialId(request, materialIdForRequest);
  const authenticatedMaterialId = typeof materialIdForRequest === "function"
    || [request.material_id, request.materialId].some((value) => typeof value === "string" && SHA256_HEX.test(value))
    ? materialId : null;
  const lockRef = `quality/reviews/request-locks/${requestLockHash(request, materialId)}.lock`;
  const requestKey = requestLockHash(request, materialId);
  const operation = async () => {
    const reusable = findReusableReview({ task: taskHandle, request, identity: before, materialId: authenticatedMaterialId, requestKey });
    if (reusable?.incomplete) {
      const error = new Error("an immutable review attempt exists without a complete result");
      error.code = "REVIEW_RECORD_INCOMPLETE";
      error.attempt_ref = reusable.attempt_ref;
      throw error;
    }
    if (reusable) return { status: "recorded", reused: true, dispatch_state: "reused", ...reusable };
    let result;
    try {
      result = await runRound(structuredClone(request));
    } catch (error) {
      result = {
        status: "unavailable",
        stage: request.stage,
        review_track: request.review_track ?? request.reviewTrack ?? null,
        review_kind: request.review_kind ?? request.reviewKind ?? null,
        material_id: materialId ?? textHash(canonicalJson(request)),
        runtime_id: null,
        outcome: "unavailable",
        provider_results: [],
        findings: [],
        error: reviewRequestError(error),
      };
    }
    if (!result || typeof result !== "object" || Array.isArray(result)) throw new TypeError("review runner must return a result object");
    const after = assertAuthenticatedReviewIdentity(taskHandle, kernel);
    if (after.tree !== before.tree || after.materialRevision !== before.materialRevision) {
      const error = new Error("review source changed while dispatching; result was not recorded");
      error.code = "REVIEW_SOURCE_DRIFT";
      throw error;
    }
    if (authenticatedMaterialId !== null && result.material_id !== materialId) {
      const error = new Error("review result material_id does not match the authenticated request material");
      error.code = "REVIEW_MATERIAL_MISMATCH";
      throw error;
    }
    const refs = recordSimpleReviewResult({ task: taskHandle, result, kernel, requestKey });
    return {
      status: "recorded",
      reused: false,
      dispatch_state: result.dispatch_state === "blocked_before_dispatch" ? "blocked_before_dispatch" : "dispatched",
      ...refs,
    };
  };
  const lockKey = `${taskHandle.identity.taskId}:${lockRef}`;
  const previous = IN_PROCESS_REQUEST_LOCKS.get(lockKey) ?? Promise.resolve();
  const current = previous.then(() => typeof taskHandle.withRecordLock === "function"
    ? taskHandle.withRecordLock(lockRef, operation)
    : operation());
  const tracked = current.catch(() => undefined);
  IN_PROCESS_REQUEST_LOCKS.set(lockKey, tracked);
  try { return await current; }
  finally {
    if (IN_PROCESS_REQUEST_LOCKS.get(lockKey) === tracked) IN_PROCESS_REQUEST_LOCKS.delete(lockKey);
  }
}

export function recordSimpleReviewResult({ task, result, kernel, requestKey = null }) {
  const taskHandle = assertTaskHandle(task);
  const currentIdentity = assertAuthenticatedReviewIdentity(taskHandle, kernel);
  if (!result || typeof result !== "object" || Array.isArray(result)) {
    throw new TypeError("review result must be an object");
  }
  if (!new Set(["available", "unavailable"]).has(result.status)) {
    throw new TypeError("review result status must be available or unavailable");
  }
  if (typeof result.stage !== "string" || !new Set(["make-decision", "build-spec", "build-plan", "build-code", "verify-code"]).has(result.stage)) {
    throw new TypeError("review result stage is required");
  }
  if (typeof result.material_id !== "string" || !SHA256_HEX.test(result.material_id)) {
    throw new TypeError("review result material_id must be a sha256 hex string");
  }
  if (!Array.isArray(result.provider_results)) {
    throw new TypeError("review result provider_results must be an array");
  }
  const providers = new Set();
  for (const [index, item] of result.provider_results.entries()) {
    if (!item || typeof item !== "object" || Array.isArray(item)
        || typeof item.provider !== "string" || item.provider.trim() === "") {
      throw new TypeError(`review result provider_results[${index}].provider must be a non-empty string`);
    }
    if (providers.has(item.provider)) throw new TypeError(`review result provider is duplicated: ${item.provider}`);
    providers.add(item.provider);
  }
  const callerIdentityFields = ["source", "base_tree", "candidate_tree", "snapshot_tree", "material_revision"]
    .filter((key) => Object.prototype.hasOwnProperty.call(result, key));
  if (callerIdentityFields.length > 0) {
    throw new TypeError(`review result identity fields must come from the authenticated current context: ${callerIdentityFields.join(", ")}`);
  }

  const attemptId = randomUUID();
  const taskId = taskHandle.identity.taskId;
  const stage = result.stage;
  const reviewTrack = result.review_track ?? null;
  const reviewKind = result.review_kind ?? null;
  const materialId = result.material_id;
  const tree = currentIdentity.tree;

  const attemptRef = `quality/reviews/attempts/${attemptId}/attempt.json`;
  const providerDirRef = `quality/reviews/attempts/${attemptId}/providers`;
  const resultId = randomUUID();
  const resultRef = `quality/reviews/results/${stage}-simple-${resultId}.json`;

  const source = currentIdentity.source;

  const commonSubject = {
    subject_kind: result.subject_kind ?? "worktree",
    phase_id: result.phase_id ?? null,
    review_scope: result.review_scope ?? (stage === "build-code" ? "integration" : null),
  };

  if (result.status === "unavailable") {
    const error = recordError(result.error, { code: "ROUTE_UNAVAILABLE", message: "review unavailable" });
    const policyResult = buildPolicy(result);
    const attempt = {
      version: "wh-review-attempt.v1",
      attempt_id: attemptId,
      task_id: taskId,
      stage,
      review_track: reviewTrack,
      review_kind: reviewKind,
      ...commonSubject,
      base_tree: tree,
      candidate_tree: tree,
      source,
      snapshot_tree: tree,
      material_id: materialId,
      material_revision: currentIdentity.materialRevision,
      ...(requestKey ? { request_key: requestKey } : {}),
      provider_attempts: result.provider_results.map((item) => providerAttemptRecord(item, result.runtime_id)),
      terminal_status: "unavailable",
      dispatch_state: result.dispatch_state === "blocked_before_dispatch" ? "blocked_before_dispatch" : "dispatched",
      error,
      review_policy: policyResult.policy,
      policy_snapshot_hash: policyResult.policy_snapshot_hash,
    };
    const reportRef = reviewReportRef(stage, resultId);
    attempt.report_ref = reportRef;
    createCanonicalRecord(taskHandle, attemptRef, JSON.stringify(attempt));
    createCanonicalRecord(taskHandle, reportRef, reviewReportBody({ attempt, requestKey }));
    return { attempt_ref: attemptRef, result_ref: null, report_ref: reportRef };
  }

  // available: canonicalize provider outputs and run aggregation
  const providerOutputContents = new Map();
  const providerOutputRefs = new Map();
  const providerOutputRecords = new Map();

  const semanticResults = result.provider_results.filter((item) => item.status === "completed" && item.error === null);
  const providerAttemptRecords = result.provider_results.map((item) => providerAttemptRecord(item, result.runtime_id, null));
  if (semanticResults.length === 0) {
    const attempt = {
      version: "wh-review-attempt.v1", attempt_id: attemptId, task_id: taskId, stage,
      review_track: reviewTrack, review_kind: reviewKind, ...commonSubject, base_tree: tree,
      candidate_tree: tree, source, snapshot_tree: tree, material_id: materialId,
      material_revision: currentIdentity.materialRevision, provider_attempts: providerAttemptRecords,
      ...(requestKey ? { request_key: requestKey } : {}),
      terminal_status: "unavailable", dispatch_state: "dispatched",
      error: recordError(result.error, { code: "REVIEW_ALL_PROVIDERS_FAILED", message: "all provider results failed" }),
      review_policy: buildPolicy(result).policy,
      policy_snapshot_hash: buildPolicy(result).policy_snapshot_hash,
    };
    const reportRef = reviewReportRef(stage, resultId);
    attempt.report_ref = reportRef;
    createCanonicalRecord(taskHandle, attemptRef, JSON.stringify(attempt));
    createCanonicalRecord(taskHandle, reportRef, reviewReportBody({ attempt, requestKey }));
    return { attempt_ref: attemptRef, result_ref: null, report_ref: reportRef };
  }
  for (let index = 0; index < semanticResults.length; index += 1) {
    const item = semanticResults[index];
    const providerFindings = (result.findings ?? []).filter((f) => f.provider === item.provider);
    const evidenceAnchors = item.evidence_anchor_valid;
    if (!Array.isArray(evidenceAnchors)
        || evidenceAnchors.length !== providerFindings.length
        || evidenceAnchors.some((value) => typeof value !== "boolean")) {
      throw new TypeError(`review result provider_results[${index}].evidence_anchor_valid must match provider findings`);
    }
    const outputContent = JSON.stringify({ findings: providerFindings.map(({ provider, ...rest }) => rest) });
    providerOutputContents.set(item.provider, outputContent);

    const outputRef = `${providerDirRef}/${providerFileName(item.provider, index)}`;
    providerOutputRefs.set(item.provider, outputRef);
    const outputRecord = {
      schema_version: "wh-review-provider-output.v1",
      task_id: taskId,
      stage,
      attempt_id: attemptId,
      provider: item.provider,
      content: outputContent,
      content_hash: textHash(outputContent),
      evidence_anchor_valid: evidenceAnchors,
    };
    providerOutputRecords.set(outputRef, outputRecord);
  }

  const providerOutputs = semanticResults.map((item) => {
    const content = providerOutputContents.get(item.provider);
    return {
      provider: item.provider,
      ...(item.identity ? { identity: normalizeIdentity(item.identity, item.provider) } : {}),
      evidenceAnchors: item.evidence_anchor_valid,
      review: JSON.parse(content ?? "{\"findings\":[]}"),
    };
  });

  const aggregation = aggregateCanonicalProviderResults(providerOutputs, Number.isSafeInteger(result.minimum_heterologous) ? result.minimum_heterologous : 1, {
    profilePriority: semanticResults.map((item) => item.provider),
    requireIdentity: false,
    requireSourceId: false,
  });
  if (aggregation.status !== "available") {
    throw new Error(`simple-review provider outputs could not be aggregated: ${JSON.stringify(aggregation.invalid_members ?? "quorum not satisfied")}`);
  }

  for (const [outputRef, outputRecord] of providerOutputRecords) {
    createCanonicalRecord(taskHandle, outputRef, JSON.stringify(outputRecord));
  }

  const providerAttemptRecordsWithOutputs = result.provider_results.map((item) => providerAttemptRecord(item, result.runtime_id, providerOutputRefs.get(item.provider) ?? null));

  const resultFindings = aggregation.findings.map((finding) => ({ provider: finding.providers[0], ...finding }));

  const policyResult = buildPolicy(result);

  const attempt = {
    version: "wh-review-attempt.v1",
    attempt_id: attemptId,
    task_id: taskId,
    stage,
    review_track: reviewTrack,
    review_kind: reviewKind,
    ...commonSubject,
    base_tree: tree,
    candidate_tree: tree,
    source,
    snapshot_tree: tree,
    material_id: materialId,
    material_revision: currentIdentity.materialRevision,
    ...(requestKey ? { request_key: requestKey } : {}),
    provider_attempts: providerAttemptRecordsWithOutputs,
    terminal_status: "semantic",
    dispatch_state: "dispatched",
    error: null,
    review_policy: policyResult.policy,
    policy_snapshot_hash: policyResult.policy_snapshot_hash,
  };

  const resultRecord = {
    version: "wh-review-result.v1",
    task_id: taskId,
    stage,
    review_track: reviewTrack,
    review_kind: reviewKind,
    ...commonSubject,
    base_tree: tree,
    candidate_tree: tree,
    source,
    snapshot_tree: tree,
    material_id: materialId,
    material_revision: currentIdentity.materialRevision,
    attempt_ref: attemptRef,
    provider_results: aggregation.valid.map((item) => ({ provider: item.provider, output: item.review })),
    findings: resultFindings,
    adjudication: { version: aggregation.adjudication.version, clusters: aggregation.adjudication.clusters },
  };

  const reportRef = reviewReportRef(stage, resultId);
  attempt.report_ref = reportRef;
  resultRecord.report_ref = reportRef;

  createCanonicalRecord(taskHandle, attemptRef, JSON.stringify(attempt));
  createCanonicalRecord(taskHandle, resultRef, JSON.stringify(resultRecord));
  createCanonicalRecord(taskHandle, reportRef, reviewReportBody({ attempt, result: resultRecord, requestKey }));

  return { attempt_ref: attemptRef, result_ref: resultRef, report_ref: reportRef };
}

function taskBoundIdentity({ task, result, snapshot_tree: snapshotTree, material_revision: materialRevision }) {
  const taskHandle = assertTaskHandle(task);
  if (!result || typeof result !== "object" || Array.isArray(result) || !new Set(["available", "unavailable"]).has(result.status)) throw new TypeError("task-bound review result is invalid");
  if (result.stage !== "verify-code" || !SHA256_HEX.test(result.material_id ?? "") || !Array.isArray(result.provider_results)) throw new TypeError("task-bound verify-code result identity is invalid");
  if (!GIT_OID.test(snapshotTree ?? "") || !MATERIAL_REVISION.test(materialRevision ?? "")) throw new TypeError("task-bound review current identity is invalid");
  return { taskHandle, taskId: taskHandle.identity.taskId, snapshotTree, materialRevision };
}

function taskBoundSource(tree) {
  return { target_commit: tree, base_commit: tree, base_tree: tree, captured_head: tree };
}

function taskBoundAttempt({ identity, result, attemptId, terminalStatus, error, providerAttempts, binding = undefined }) {
  return {
    version: "wh-review-attempt.v1", attempt_id: attemptId, task_id: identity.taskId, stage: "verify-code",
    review_track: result.review_track ?? null, review_kind: result.review_kind ?? null,
    subject_kind: "worktree", phase_id: null, review_scope: null,
    source: taskBoundSource(identity.snapshotTree), snapshot_tree: identity.snapshotTree,
    material_id: result.material_id, material_revision: identity.materialRevision,
    ...(binding ? { e2e_binding: binding } : {}),
    ...(result.review_policy ? { review_policy: result.review_policy, policy_snapshot_hash: policyHash(result.review_policy) } : {}),
    provider_attempts: providerAttempts, terminal_status: terminalStatus, error,
  };
}

export function recordTaskBoundE2eReviewUnavailable(input = {}) {
  const identity = taskBoundIdentity(input);
  const attemptId = randomUUID();
  const attemptRef = `quality/reviews/attempts/${attemptId}/attempt.json`;
  const attempt = taskBoundAttempt({ identity, result: input.result, attemptId, terminalStatus: "unavailable", error: input.result.error ?? { code: "E2E_REVIEWER_UNAVAILABLE", message: "task-bound review unavailable" }, providerAttempts: [] });
  identity.taskHandle.writeRecordAtomic(attemptRef, JSON.stringify(attempt));
  return Object.freeze({ attempt_ref: attemptRef, result_ref: null });
}

export function recordTaskBoundE2eReviewResult(input = {}) {
  const { binding, result } = input;
  const identity = taskBoundIdentity({ ...input, snapshot_tree: binding?.snapshot_tree, material_revision: binding?.material_revision });
  if (!binding || typeof binding !== "object" || Array.isArray(binding)) throw new TypeError("task-bound review binding is required");
  const frozen = binding.frozen_material;
  const execution = binding.reviewed_execution;
  const reviewer = binding.reviewer_actor;
  if (!frozen || !execution || !reviewer || !SHA256_HEX.test(frozen.sha256 ?? "") || !SHA256_HEX.test(frozen.provider_input_sha256 ?? "")
      || frozen.provider_input_sha256 !== result.material_id || !SHA256_HEX.test(execution.sha256 ?? "")
      || !execution.actor || typeof reviewer.source_id !== "string" || typeof reviewer.run_id !== "string") throw new TypeError("task-bound review E2E binding is invalid");
  const e2eBinding = {
    frozen_material: { ref: frozen.ref, sha256: frozen.sha256, provider_input_sha256: frozen.provider_input_sha256 },
    reviewed_execution: { ref: execution.ref, sha256: execution.sha256, actor: { ...execution.actor } },
    reviewer_actor: { ...reviewer },
  };
  if (result.provider_results.length !== 1) throw new TypeError("task-bound review requires exactly one provider result");
  const provider = result.provider_results[0];
  if (provider.status !== "completed" || provider.error !== null || provider.identity?.source_id !== reviewer.source_id) throw new TypeError("task-bound provider result identity is invalid");
  const providerFindings = (result.findings ?? []).filter((finding) => finding.provider === provider.provider);
  const outputContent = JSON.stringify({ findings: providerFindings.map(({ provider: _provider, ...finding }) => finding) });
  const attemptId = randomUUID();
  const attemptRef = `quality/reviews/attempts/${attemptId}/attempt.json`;
  const outputRef = `quality/reviews/attempts/${attemptId}/providers/${providerFileName(provider.provider, 0)}`;
  const outputRecord = { schema_version: "wh-review-provider-output.v1", task_id: identity.taskId, stage: "verify-code", attempt_id: attemptId, provider: provider.provider, content: outputContent, content_hash: textHash(outputContent), evidence_anchor_valid: providerFindings.map(() => true) };
  const aggregation = aggregateCanonicalProviderResults([{ provider: provider.provider, identity: normalizeIdentity(provider.identity, provider.provider), evidenceAnchors: outputRecord.evidence_anchor_valid, review: JSON.parse(outputContent) }], 1, { profilePriority: [provider.provider], requireIdentity: true, requireSourceId: true });
  if (aggregation.status !== "available") throw new Error("task-bound provider output could not be aggregated");
  const attempt = taskBoundAttempt({ identity, result, attemptId, terminalStatus: "semantic", error: null, binding: e2eBinding, providerAttempts: [providerAttemptRecord(provider, result.runtime_id, outputRef)] });
  const resultRef = `quality/reviews/results/verify-code-e2e-${randomUUID()}.json`;
  const resultRecord = {
    version: "wh-review-result.v1", task_id: identity.taskId, stage: "verify-code", review_track: result.review_track ?? null, review_kind: result.review_kind ?? null,
    subject_kind: "worktree", phase_id: null, review_scope: null,
    source: taskBoundSource(identity.snapshotTree), snapshot_tree: identity.snapshotTree, material_id: result.material_id, material_revision: identity.materialRevision,
    e2e_binding: e2eBinding, ...(result.review_policy ? { review_policy: result.review_policy } : {}), attempt_ref: attemptRef,
    provider_results: aggregation.valid.map((item) => ({ provider: item.provider, output: item.review })),
    findings: aggregation.findings.map((finding) => ({ provider: finding.providers[0], ...finding })),
    adjudication: { version: aggregation.adjudication.version, clusters: aggregation.adjudication.clusters },
  };
  identity.taskHandle.writeRecordAtomic(outputRef, JSON.stringify(outputRecord));
  identity.taskHandle.writeRecordAtomic(attemptRef, JSON.stringify(attempt));
  identity.taskHandle.writeRecordAtomic(resultRef, JSON.stringify(resultRecord));
  return Object.freeze({ attempt_ref: attemptRef, result_ref: resultRef });
}

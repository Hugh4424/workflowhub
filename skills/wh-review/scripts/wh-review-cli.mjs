#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { homedir } from "node:os";
import { isAbsolute } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { ReviewProviderClient } from "./review-provider-client.mjs";
import { verifyFinal } from "./review-runner.mjs";
import {
  loadTrustedThirdReviewConfig,
  resolveTrustedReviewRoute,
  selectTrustedReviewProviderSelection,
  validateAllWhReviewRoutes,
} from "./third-review-host-config.mjs";
import { bootstrapStage, assertWorkspace } from "../../../runtime/stage/stage-context.mjs";
import { readAuthenticatedExecutionSource } from "../../../runtime/review/review-record-route.mjs";
import { validateSchema } from "../../../runtime/review/schema-validator.mjs";
import { openTask } from "../../../runtime/task/task-handle.mjs";
import { openCurrentTaskWorkspace } from "../../../runtime/task/workspace.mjs";
import { ArtifactDir } from "../../../core/artifact-dir.mjs";
import { reviewIdentityFromInput } from "../../../runtime/review/review-policy.mjs";
import { recordSimpleReviewRequest } from "../../../runtime/review/review-record-route.mjs";
import {
  createSimpleReviewPacket,
  simpleReviewProviderMaterialId,
  runSimpleReview,
  reviewSubjectFields,
  resolveSimpleReviewRouteIdentity,
  serializeProviderInput,
} from "./simple-review-runner.mjs";
import { SHA256_HEX } from "../../../runtime/evidence/canonical-utils.mjs";

const RUNNER_ROOT = fileURLToPath(new URL("../../../", import.meta.url));
const HOST_PATH = /(?:\/(?:Users|home|private|tmp|var|etc|opt|mnt|Volumes|root|usr|bin|sbin|dev|proc|sys|Library)\/[^\s"'`<>()[\]{}]+|[A-Za-z]:[\\/][^\s"'`<>()[\]{}]+)/g;
const bareSinkLocks = new Map();

function safeRecoveryError(error) {
  const code = typeof error?.code === "string" && error.code !== "" ? error.code : "WORKFLOWHUB_LOCAL_ERROR";
  const message = String(error?.message ?? error).replace(HOST_PATH, "<host-path-redacted>");
  return { code, message };
}

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map((item) => item === undefined ? "null" : stableJson(item)).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).filter((key) => value[key] !== undefined).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

function bareSinkMaterialId(request) {
  // Recovery requests may already carry the material identity. Use
  // it directly so a bare request cannot collide with another request that
  // has no material payload (for example, a stale unavailable recovery fact).
  if (typeof request?.material_id === "string" && request.material_id !== "") return request.material_id;
  if (typeof request?.materialId === "string" && request.materialId !== "") return request.materialId;
  return bareSinkMaterialDigest(request);
}

function bareSinkMaterialDigest(request) {
  if (request?.materials === undefined) return null;
  try {
    return createSimpleReviewPacket({
      stage: request.stage,
      review_track: request.review_track ?? request.reviewTrack ?? null,
      review_kind: request.review_kind ?? request.reviewKind ?? null,
      materials: request.materials,
    }).material_id;
  } catch {
    return createHash("sha256").update(stableJson({ materials: request.materials ?? null })).digest("hex");
  }
}

function bareSinkAuthContext(request) {
  return {
    task_id: request.task_id ?? request.taskId ?? null,
    snapshot_tree: request.snapshot_tree ?? request.snapshotTree ?? null,
    material_revision: request.material_revision ?? request.materialRevision ?? null,
    material_id: bareSinkMaterialId(request),
    material_digest: bareSinkMaterialDigest(request),
  };
}

function bareSinkRequest(request) {
  return {
    stage: request.stage ?? null,
    review_track: request.review_track ?? request.reviewTrack ?? null,
    review_kind: request.review_kind ?? request.reviewKind ?? null,
    review_scope: request.review_scope ?? request.reviewScope ?? null,
    subject: request.subject ?? null,
    ...reviewSubjectFields(request),
    host_provider: request.host_provider ?? request.hostProvider ?? null,
    ...bareSinkAuthContext(request),
  };
}

function bareSinkKey(request) {
  return createHash("sha256").update(stableJson({
    ...bareSinkRequest(request),
  })).digest("hex");
}

function bareSinkRecord(request, result, key, routeIdentity = null) {
  const record = {
    version: "workflowhub-review-sink.v1",
    authoritative: false,
    request_key: key,
    route_identity: routeIdentity,
    request: bareSinkRequest(request),
    result: structuredClone(result),
  };
  record.sink_sha256 = bareSinkDigest(record);
  return record;
}

function bareSinkDigest(record) {
  const { sink_sha256: _sinkSha256, ...unsigned } = record;
  return createHash("sha256").update(stableJson(unsigned), "utf8").digest("hex");
}

function bareSinkRequestMatches(stored, request) {
  if (!stored || typeof stored !== "object" || Array.isArray(stored)) return false;
  const expected = bareSinkRequest(request);
  return Object.entries(expected).every(([field, value]) => {
    if (!Object.hasOwn(stored, field)) return value === null;
    return stableJson(stored[field]) === stableJson(value);
  });
}

function bareSinkLocation(request) {
  const root = process.env.WORKFLOWHUB_REVIEW_SINK_ROOT || `${homedir()}/.workflowhub/review-sink`;
  return { root, ref: `${root}/${bareSinkKey(request)}.json` };
}

function readBareReviewSink(request) {
  const { ref } = bareSinkLocation(request);
  if (!existsSync(ref)) return null;
  try {
    const value = JSON.parse(readFileSync(ref, "utf8"));
    if (value?.version !== "workflowhub-review-sink.v1" || value.request_key !== bareSinkKey(request)) throw new Error("review sink identity is invalid");
    if (!SHA256_HEX.test(value.sink_sha256 ?? "") || value.sink_sha256 !== bareSinkDigest(value)) throw new Error("review sink integrity is invalid");
    if (!bareSinkRequestMatches(value.request, request)) throw new Error("review sink authentication context is invalid");
    if (value.route_identity !== null && !SHA256_HEX.test(value.route_identity ?? "")) throw new Error("review sink route identity is invalid");
    return { ...value, sink_ref: ref };
  } catch (cause) {
    const error = new Error("review sink exists but cannot be authenticated", { cause });
    error.code = "REVIEW_SINK_INVALID";
    throw error;
  }
}

function writeBareReviewSink(request, result, routeIdentity = null) {
  const key = bareSinkKey(request);
  const { root, ref } = bareSinkLocation(request);
  mkdirSync(root, { recursive: true, mode: 0o700 });
  // The bare CLI is a diagnostic sink, never a formal writer.  Reassert the
  // boundary at the sink call so a broker/result field cannot upgrade the
  // returned or persisted record to canonical/current authority.
  const record = bareSinkRecord(request, { ...result, authoritative: false }, key, routeIdentity);
  const bytes = `${JSON.stringify(record)}\n`;
  if (existsSync(ref)) {
    const existing = readFileSync(ref, "utf8");
    if (existing !== bytes) {
      const error = new Error("review sink key already contains different bytes");
      error.code = "REVIEW_SINK_CONFLICT";
      throw error;
    }
    return { sink_ref: ref, authoritative: false, reused: true };
  }
  writeFileSync(ref, bytes, { encoding: "utf8", mode: 0o600, flag: "wx" });
  return { sink_ref: ref, authoritative: false, reused: false };
}

function hasReviewIdentity(input) {
  return REVIEW_IDENTITY_FIELDS.some((field) => Object.hasOwn(input, field));
}

function hasMeaningfulReviewIdentity(input) {
  return REVIEW_IDENTITY_FIELDS.some((field) => input?.[field] !== undefined && input?.[field] !== null);
}

function recoveryIdentityFields(identity) {
  return identity === null ? {} : {
    stage: identity.stage,
    review_track: identity.reviewTrack,
    review_scope: identity.reviewScope,
    review_kind: identity.reviewKind,
  };
}

function recoveryRequestIdentityFields(request, identity) {
  if (identity !== null) return recoveryIdentityFields(identity);
  return {
    stage: request.stage ?? null,
    review_track: request.review_track ?? request.reviewTrack ?? null,
    review_scope: request.review_scope ?? request.reviewScope ?? null,
    review_kind: request.review_kind ?? request.reviewKind ?? null,
  };
}

function rejectBuildPrdRecoveryIdentity(identity, label = "review recovery") {
  if (identity.stage === "build-prd" || identity.reviewKind === "build_prd") {
    throw new TypeError(`BUILD_PRD_REPORT_ONLY_NOT_PERSISTED: ${label} cannot use the build_prd review surface`);
  }
}

function normalizeBareRecoveryResult(request, requestIdentity, result) {
  if (!result || typeof result !== "object" || Array.isArray(result)) {
    throw new TypeError("review recovery result must be an object");
  }
  if (!new Set(["available", "available-with-failures", "unavailable"]).has(result.status)) {
    throw new TypeError("review recovery result status is invalid");
  }
  const authContext = bareSinkAuthContext(request);
  for (const field of ["task_id", "snapshot_tree", "material_revision", "material_id"]) {
    if (Object.hasOwn(result, field) && authContext[field] !== null && result[field] !== authContext[field]) {
      throw new TypeError(`review recovery result ${field} does not match its request`);
    }
  }
  if (requestIdentity === null) {
    if (!hasMeaningfulReviewIdentity(result)) return result;
    const resultIdentity = reviewIdentityFromInput(result);
    rejectBuildPrdRecoveryIdentity(resultIdentity, "review recovery result");
    throw new TypeError("identityless bare recovery cannot persist an identified result");
  }
  if (!hasMeaningfulReviewIdentity(result)) return { ...result, ...recoveryIdentityFields(requestIdentity) };
  const resultIdentity = reviewIdentityFromInput(result);
  rejectBuildPrdRecoveryIdentity(resultIdentity, "review recovery result");
  if (resultIdentity.stage !== requestIdentity.stage
      || resultIdentity.reviewTrack !== requestIdentity.reviewTrack
      || resultIdentity.reviewScope !== requestIdentity.reviewScope
      || resultIdentity.reviewKind !== requestIdentity.reviewKind) {
    throw new TypeError("review result stage/track/scope/kind does not match its request");
  }
  const {
    review_track: _reviewTrack,
    reviewTrack: _reviewTrackAlias,
    review_scope: _reviewScope,
    reviewScope: _reviewScopeAlias,
    review_kind: _reviewKind,
    reviewKind: _reviewKindAlias,
    ...rest
  } = result;
  return { ...rest, ...recoveryIdentityFields(resultIdentity) };
}

async function runBareReview(request, runRound, resolveRouteIdentity, requestIdentity) {
  const key = bareSinkKey(request);
  const previous = bareSinkLocks.get(key) ?? Promise.resolve();
  const current = previous.then(async () => {
    // Route identity comes exclusively from current trusted host configuration.
    // The bare sink has no authenticated retry budget. A changed route cannot
    // turn its saved result into permission to dispatch another review.
    const existing = readBareReviewSink(request);
    const existingResult = existing
      ? normalizeBareRecoveryResult(request, requestIdentity, existing.result)
      : null;
    let routeIdentity = null;
    try {
      routeIdentity = request.stage && (request.host_provider ?? request.hostProvider)
        ? resolveRouteIdentity(request)?.route_identity : null;
      if (routeIdentity !== null && !SHA256_HEX.test(routeIdentity ?? "")) throw new TypeError("trusted route identity must be a sha256 hex string");
    } catch (error) {
      const diagnostic = { code: "ROUTE_UNAVAILABLE", message: safeRecoveryError(error).message };
      if (existing) return {
        ...existingResult, route_error: diagnostic,
        sink_ref: existing.sink_ref, authoritative: false, reused: true, dispatch_state: "reused",
      };
      const unavailable = {
        status: "unavailable", ...recoveryRequestIdentityFields(request, requestIdentity),
        ...bareSinkAuthContext(request), ...reviewSubjectFields(request),
        runtime_id: null, outcome: "unavailable", dispatch_state: "blocked_before_dispatch",
        provider_results: [], findings: [], error: diagnostic,
      };
      return { ...unavailable, ...writeBareReviewSink(request, unavailable, null) };
    }
    if (existing) {
      if ((existing.route_identity ?? null) !== routeIdentity) return {
        status: "unavailable", ...recoveryRequestIdentityFields(request, requestIdentity),
        ...bareSinkAuthContext(request), ...reviewSubjectFields(request),
        error: { code: "REVIEW_RETRY_BUDGET_UNKNOWN", message: "trusted review route changed but bare review has no authenticated retry budget" },
        prior_result: existingResult, sink_ref: existing.sink_ref, authoritative: false, reused: true, dispatch_state: "reused",
      };
      return { ...existingResult, sink_ref: existing.sink_ref, authoritative: false, reused: true, dispatch_state: "reused" };
    }
    let result;
    try {
      result = await runRound(request);
    } catch (error) {
      const diagnostic = safeRecoveryError(error);
      const review = error?.reviewResult;
      result = {
        status: "unavailable", recovery: "run_round_exception", error_code: diagnostic.code,
        error: diagnostic,
        ...(request.snapshot_tree === undefined ? {} : { snapshot_tree: request.snapshot_tree }),
        ...(request.material_id === undefined ? {} : { material_id: request.material_id }),
        ...(review?.attemptRef ? { attempt_ref: review.attemptRef } : {}),
        ...(review?.resultRef ? { result_ref: review.resultRef } : {}),
        ...(review?.reportRef ? { report_ref: review.reportRef } : {}),
      };
    }
    result = normalizeBareRecoveryResult(request, requestIdentity, result);
    const subject = reviewSubjectFields(request);
    for (const [field, value] of Object.entries(subject)) {
      if (result[field] !== undefined && result[field] !== value) throw new TypeError(`review result ${field} conflicts with the request`);
    }
    result = { ...result, ...subject };
    return { ...result, ...writeBareReviewSink(request, result, routeIdentity) };
  });
  const tracked = current.catch(() => undefined);
  bareSinkLocks.set(key, tracked);
  try { return await current; }
  finally {
    if (bareSinkLocks.get(key) === tracked) bareSinkLocks.delete(key);
  }
}

export function resolveTrustedReviewSubject(input) {
  if (!isAbsolute(input.task_path ?? "")) throw new TypeError("task_path must be an absolute TaskHandle path");
  const taskId = input.task_id ?? input.taskId;
  const projectName = input.project_name ?? input.projectName;
  const stage = input.stage;
  if (input.source_root !== undefined || input.sourceRoot !== undefined) {
    throw new TypeError("source_root is forbidden; Workspace comes from accepted make-decision facts");
  }
  if (input.runner_root !== undefined || input.runnerRoot !== undefined) {
    throw new TypeError("runner_root is forbidden; runner identity comes from the authenticated TaskHandle manifest");
  }
  openTask(input.task_path, projectName, taskId);
  let context = bootstrapStage(stage, {
    mode: "sidecar",
    taskPath: input.task_path,
    projectName,
    taskId,
    runnerRoot: RUNNER_ROOT,
    // Trusted subject resolution only needs to read the existing task and
    // workspace state. Keep it read-only so callers cannot accidentally
    // prepare a worktree or trigger expensive material checks during binding.
    readOnly: true,
  });
  if (stage === "make-decision") {
    const workspace = openCurrentTaskWorkspace(context.task);
    return {
      taskId,
      task: context.task,
      kernel: context.kernel,
      identity: context.identity,
      workflowRunId: context.workflowRunId,
      workspace,
      artifacts: context.artifacts,
    };
  }
  const workspace = assertWorkspace(context.workspace);
  return {
    taskId,
    task: context.task,
    kernel: context.kernel,
    identity: context.identity,
    workflowRunId: context.workflowRunId,
    workspace,
    artifacts: context.artifacts,
  };
}

function providerClient(stage = null, reviewTrack = null, reviewKind = null) {
  const thirdReview = loadTrustedThirdReviewConfig({ requestedStage: stage, requestedTrack: reviewTrack, requestedReviewKind: reviewKind });
  return { thirdReview, client: new ReviewProviderClient({ command: thirdReview.command, config: thirdReview.config }) };
}

const RETIRED_RECOVERY_FIELDS = ["previous_result_ref", "previousResultRef", "review_round", "reviewRound", "review_delta", "reviewDelta", "request_id", "requestId", "prior_attempt_refs", "priorAttemptRefs", "dispatch_sequence", "dispatchSequence"];
const REVIEW_IDENTITY_FIELDS = ["stage", "review_track", "reviewTrack", "review_scope", "reviewScope", "review_kind", "reviewKind"];
const FORMAL_REVIEW_STAGES = new Set(["make-decision", "build-spec", "build-plan", "build-code", "verify-code"]);
const RECOVERY_REVIEW_KINDS = new Set(["mini_task.design", "mini_task.implementation"]);

function validateBareRecoveryIdentity(request) {
  if (!hasReviewIdentity(request)) return null;
  const identity = reviewIdentityFromInput(request);
  // build-prd is report-only. Reject it before formal-stage and mini-task
  // recovery checks so no unreachable branch suggests canonical recovery.
  if (identity.stage === "build-prd" || identity.reviewKind === "build_prd") {
    rejectBuildPrdRecoveryIdentity(identity, "review recovery request");
  }
  if (!FORMAL_REVIEW_STAGES.has(identity.stage) && identity.stage !== "build-prd") {
    throw new TypeError(`unsupported recovery review stage: ${identity.stage}`);
  }
  if (identity.reviewKind !== null && !RECOVERY_REVIEW_KINDS.has(identity.reviewKind)) {
    throw new TypeError(`unsupported recovery review kind: ${identity.reviewKind}`);
  }
  if (identity.reviewKind?.startsWith("mini_task.") && identity.stage !== "build-code") {
    throw new TypeError(`${identity.reviewKind} recovery requires stage build-code`);
  }
  if (identity.stage === "make-decision"
      && identity.reviewTrack !== null
      && !["direction", "detail"].includes(identity.reviewTrack)) {
    throw new TypeError(`unsupported recovery review track: ${identity.reviewTrack}`);
  }
  if (identity.stage !== "make-decision" && identity.reviewTrack !== null) {
    throw new TypeError(`${identity.stage} recovery does not use review_track`);
  }
  return identity;
}

/** One WorkflowHub call. Provider recovery and lifecycle belong to 3rd-review. */

const REVIEW_RESULT_REF = /^quality\/reviews\/results\/[A-Za-z0-9][A-Za-z0-9._-]*\.json$/;
const REVIEW_ATTEMPT_REF = /^quality\/reviews\/attempts\/([A-Za-z0-9][A-Za-z0-9._-]*)\/attempt\.json$/;

function publishReviewFactOrThrow(args) {
  try {
    return publishStageReviewFact(args);
  } catch (error) {
    // Preserve the immutable review refs when the stage-fact write fails. The
    // recovery envelope must not turn a real review into an untraceable local
    // unavailable result.
    error.reviewResult = args.result;
    throw error;
  }
}

export function publishStageReviewFact({ trusted, stage, reviewTrack = null, reviewScope = null, reviewKind = null, result }) {
  // Authenticate both sides of the publication boundary before deciding
  // whether this surface emits a quality-fact intent.  The caller-selected
  // identity is not an authority for the broker result: both identities must
  // be valid, canonical, and exactly equal.  This also rejects build_prd and
  // alias conflicts before any canonical evidence is read or published.
  const requestIdentity = reviewIdentityFromInput({
    stage,
    review_track: reviewTrack,
    review_scope: reviewScope,
    review_kind: reviewKind,
  });
  const resultIdentity = reviewIdentityFromInput({
    ...recoveryIdentityFields(requestIdentity),
    ...result,
  });
  if (resultIdentity.stage !== requestIdentity.stage
      || resultIdentity.reviewTrack !== requestIdentity.reviewTrack
      || resultIdentity.reviewScope !== requestIdentity.reviewScope
      || resultIdentity.reviewKind !== requestIdentity.reviewKind) {
    throw new TypeError("review result stage/track/scope/kind does not match the publication request");
  }
  // The broker result is the review fact.  Bind it to the vNext stage quality
  // predicate at the same write boundary so a direct wh-review invocation
  // cannot leave an immutable result that stage-runtime status/close cannot
  // discover.  Mini-task reviews are deliberately excluded: they have their
  // own acceptance-evidence contract and must not masquerade as verify-code.
  if (requestIdentity.stage !== "verify-code" || requestIdentity.reviewKind !== null) return null;
  if (!new Set(["available", "unavailable"]).has(result?.status)) {
    throw new Error("verify-code review status must be available or unavailable");
  }
  const currentSnapshot = typeof trusted.kernel.currentVNextSnapshot === "function"
    ? trusted.kernel.currentVNextSnapshot()
    : null;
  const currentMaterialRevision = typeof trusted.kernel.currentVNextMaterialRevision === "function"
    ? trusted.kernel.currentVNextMaterialRevision()
    : null;
  if (!/^revision-[a-f0-9]{64}$/.test(currentMaterialRevision ?? "")) {
    throw new Error("verify-code review cannot authenticate the current material revision");
  }
  if (typeof result.snapshotTree !== "string" || !currentSnapshot?.tree || result.snapshotTree !== currentSnapshot.tree) {
    throw new Error("verify-code review result is stale before quality-fact publication");
  }
  if (result.subjectKind !== "worktree" || result.phaseId !== null || result.reviewScope !== null) {
    throw new Error("verify-code quality fact requires a worktree-scoped final review");
  }
  if (typeof result.materialId !== "string" || !SHA256_HEX.test(result.materialId)) {
    throw new Error("verify-code review result is missing material identity");
  }
  const evidenceRef = result.status === "available" ? result.resultRef : result.attemptRef;
  const expectedRefPattern = result.status === "available" ? REVIEW_RESULT_REF : REVIEW_ATTEMPT_REF;
  if (typeof evidenceRef !== "string" || !expectedRefPattern.test(evidenceRef)) {
    throw new Error("verify-code review did not return a canonical quality review reference");
  }
  let evidence;
  let evidenceRaw;
  try {
    evidenceRaw = trusted.task.readRecord(evidenceRef);
    evidence = JSON.parse(evidenceRaw);
  } catch {
    throw new Error("verify-code review evidence is missing or invalid JSON");
  }
  validateSchema(result.status === "available" ? "result" : "attempt", evidence);
  if (evidence.task_id !== trusted.taskId || evidence.stage !== stage || evidence.subject_kind !== "worktree"
    || evidence.phase_id !== null || evidence.review_scope !== null || evidence.snapshot_tree !== result.snapshotTree) {
    throw new Error("verify-code review evidence is not bound to the current task, stage, or snapshot");
  }
  if (evidence.material_id !== result.materialId) {
    throw new Error("verify-code review evidence is not bound to the returned material identity");
  }
  if (evidence.material_revision !== currentMaterialRevision) {
    throw new Error("verify-code review evidence is not bound to the current material revision");
  }
  if (result.status === "available") {
    if (evidence.attempt_ref !== result.attemptRef || (evidence.review_kind ?? null) !== reviewKind || evidence.terminal_status === "unavailable") {
      throw new Error("verify-code review result is not bound to the current review request");
    }
    if (typeof evidence.attempt_ref !== "string" || !REVIEW_ATTEMPT_REF.test(evidence.attempt_ref)) {
      throw new Error("verify-code review result does not reference a canonical attempt");
    }
    let attempt;
    try { attempt = JSON.parse(trusted.task.readRecord(evidence.attempt_ref)); }
    catch { throw new Error("verify-code review attempt is missing or invalid JSON"); }
    validateSchema("attempt", attempt);
    const attemptRefMatch = REVIEW_ATTEMPT_REF.exec(evidence.attempt_ref);
    if (attempt.task_id !== trusted.taskId || attempt.stage !== stage || attempt.subject_kind !== "worktree"
      || attempt.phase_id !== null || attempt.review_scope !== null || (attempt.review_kind ?? null) !== reviewKind
      || attempt.attempt_id !== attemptRefMatch?.[1]
      || attempt.snapshot_tree !== result.snapshotTree || attempt.terminal_status !== "semantic" || attempt.error !== null) {
      throw new Error("verify-code review result is not bound to a semantic terminal attempt");
    }
  } else if (evidence.terminal_status !== "unavailable") {
    throw new Error("verify-code unavailable fact requires an unavailable terminal attempt");
  } else if ((evidence.review_kind ?? null) !== reviewKind || evidence.attempt_id !== REVIEW_ATTEMPT_REF.exec(evidenceRef)?.[1]) {
    throw new Error("verify-code unavailable attempt is not bound to the current review request");
  }
  const evidenceHash = createHash("sha256").update(evidenceRaw).digest("hex");
  // wh-review owns broker-provenance review bytes. It returns a narrow fact
  // intent for stage-runtime to consume; it never writes current quality.
  return Object.freeze({
    schema_version: "workflowhub-quality-fact-intent.v1",
    stage,
    kind: "review",
    status: result.status === "available" ? "recorded" : "unavailable",
    // verify-code's canonical code_review belongs to dsh-code-review. Keep
    // this broker result under the existing advisory subject so it cannot
    // compete with the completion fact while its provenance remains intact.
    subject: "independent_review",
    material_id: result.materialId,
    material_revision: currentMaterialRevision,
    evidence: [{ ref: evidenceRef, sha256: evidenceHash, evidence_type: "review_result" }],
  });
}

export async function runReviewRecovery(input, { runRound = runReviewRound, recordContext = null, sameSourceFallback = null, resolveRouteIdentity = resolveSimpleReviewRouteIdentity } = {}) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new TypeError("review recovery input is required");
  if (typeof runRound !== "function") throw new TypeError("runRound must be a function");
  if (typeof resolveRouteIdentity !== "function") throw new TypeError("resolveRouteIdentity must be a host function");
  if (sameSourceFallback !== null) throw new TypeError("sameSourceFallback is retired; 3rd-review owns heterologous recovery");
  const request = structuredClone(input);
  const identity = validateBareRecoveryIdentity(request);
  if (identity) {
    request.stage = identity.stage;
    request.review_track = identity.reviewTrack;
    request.review_scope = identity.reviewScope;
    request.review_kind = identity.reviewKind;
    delete request.reviewTrack;
    delete request.reviewScope;
    delete request.reviewKind;
  }
  for (const field of RETIRED_RECOVERY_FIELDS) delete request[field];
  if (recordContext !== null) {
    if (!recordContext || typeof recordContext !== "object" || !recordContext.task || !recordContext.kernel) {
      throw new TypeError("recordContext requires the authenticated task and kernel");
    }
    return recordSimpleReviewRequest({ task: recordContext.task, kernel: recordContext.kernel, request, runRound,
      materialIdForRequest: simpleReviewProviderMaterialId, resolveRouteIdentity });
  }
  return runBareReview(request, runRound, resolveRouteIdentity, identity);
}

export async function runReviewRound(input) {
  return runSimpleReview(input);
}

export function verifyFinalReview(input) {
  const trusted = resolveTrustedReviewSubject(input);
  const result = verifyFinal({
    ...trusted, attachmentRoot: providerClient(input.stage, input.review_track ?? input.reviewTrack ?? null).thirdReview.attachmentRoot, resultRef: input.result_ref ?? input.resultRef,
    taskId: trusted.taskId, stage: input.stage, reviewTrack: input.review_track ?? input.reviewTrack,
  });
  return { status: result.status, snapshot_tree: result.snapshotTree };
}

export function doctorThirdReviewConfig() {
  const trusted = loadTrustedThirdReviewConfig();
  validateAllWhReviewRoutes(trusted.whReview);
  return { status: "ok", config: trusted.config, stages: Object.keys(trusted.whReview?.stages ?? {}) };
}

async function main() {
  const command = process.argv[2];
  if (!new Set(["run", "verify-final", "doctor"]).has(command)) throw new Error("usage: wh-review-cli.mjs <run|verify-final|doctor> [input.json]");
  if (command === "doctor") {
    process.stdout.write(`${JSON.stringify(doctorThirdReviewConfig())}\n`);
    return;
  }
  const input = JSON.parse(readFileSync(process.argv[3] ?? 0, "utf8"));
  const result = command === "run" ? await runReviewRecovery(input) : verifyFinalReview(input);
  process.stdout.write(`${JSON.stringify(result)}\n`);
}

// The mini-task runner imports this module from an eval/stdin entrypoint, where
// Node does not define process.argv[1]. Keep module loading side-effect free.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => { process.stderr.write(`${error?.stack ?? error}\n`); process.exitCode = 1; });
}

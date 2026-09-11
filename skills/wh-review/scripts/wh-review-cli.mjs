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
import { authenticateCurrentBuildCodeStageOutcome } from "../../../runtime/stage/stage-runner.mjs";
import { validateSchema } from "../../../runtime/review/schema-validator.mjs";
import { openTask } from "../../../runtime/task/task-handle.mjs";
import { openCurrentTaskWorkspace } from "../../../runtime/task/workspace.mjs";
import { ArtifactDir } from "../../../core/artifact-dir.mjs";
import { freezeReviewMaterial, readFrozenReviewMaterial } from "../../../runtime/evidence/canonical-receipt-writer.mjs";
import { validateCanonicalTestReceipt } from "../../../runtime/evidence/canonical-evidence-validators.mjs";
import { validateAcceptanceEvidence } from "../../../runtime/evidence/acceptance-evidence-validator.mjs";
import { validateBrowserQaEvidence } from "../../../runtime/evidence/stage-content-evidence.mjs";
import { qualityFactDigest } from "../../../runtime/evidence/quality-fact.mjs";
import { reviewIdentityFromInput } from "../../../runtime/review/review-policy.mjs";
import { recordSimpleReviewRequest, recordTaskBoundE2eReviewResult, recordTaskBoundE2eReviewUnavailable } from "../../../runtime/review/review-record-route.mjs";
import {
  createSimpleReviewPacket,
  dispatchFrozenProviderInput,
  runSimpleReview,
  reviewSubjectFields,
  resolveSimpleReviewRouteIdentity,
  serializeProviderInput,
} from "./simple-review-runner.mjs";
import {
  compactReviewDiff,
  compactVerifyCodeMaterials,
  TASK_BOUND_PROVIDER_INPUT_MAX_BYTES,
} from "./review-input-bounds.mjs";
import { parseReviewerOutput } from "./review-output.mjs";

const RUNNER_ROOT = fileURLToPath(new URL("../../../", import.meta.url));
const taskBoundReviewQueues = new Map();
const QUALITY_FACT_REF = /^quality\/facts\/([a-f0-9]{64})\.json$/;
const ACCEPTANCE_EVIDENCE_REF = /^quality\/evidence\/acceptance\/build-code\/[A-Za-z0-9][A-Za-z0-9._-]*\.json$/;
const STAGE_QUALITY_EVIDENCE_REF = /^quality\/evidence\/stage-quality\/build-code\/[A-Za-z0-9][A-Za-z0-9._-]*\.json$/;
const BROWSER_QA_EVIDENCE_REF = /^quality\/evidence\/browser-qa\/[A-Za-z0-9][A-Za-z0-9._-]*\.json$/;
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
    if (!/^[a-f0-9]{64}$/.test(value.sink_sha256 ?? "") || value.sink_sha256 !== bareSinkDigest(value)) throw new Error("review sink integrity is invalid");
    if (!bareSinkRequestMatches(value.request, request)) throw new Error("review sink authentication context is invalid");
    if (value.route_identity !== null && !/^[a-f0-9]{64}$/.test(value.route_identity ?? "")) throw new Error("review sink route identity is invalid");
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
  if (!new Set(["available", "unavailable"]).has(result.status)) {
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
      if (routeIdentity !== null && !/^[a-f0-9]{64}$/.test(routeIdentity ?? "")) throw new TypeError("trusted route identity must be a sha256 hex string");
    } catch (error) {
      const diagnostic = { code: "ROUTE_UNAVAILABLE", message: safeRecoveryError(error).message };
      if (existing) return {
        ...existingResult, route_error: diagnostic,
        sink_ref: existing.sink_ref, authoritative: false, reused: true,
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
        prior_result: existingResult, sink_ref: existing.sink_ref, authoritative: false, reused: true,
      };
      return { ...existingResult, sink_ref: existing.sink_ref, authoritative: false, reused: true };
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

function currentBuildCodeExecution(trusted) {
  try {
    const current = authenticateCurrentBuildCodeStageOutcome({
      ...trusted,
      identity: trusted.identity ?? trusted.task?.identity ?? { taskId: trusted.taskId },
      workflowRunId: trusted.kernel.deriveStageWorkflowRunId("build-code"),
    });
    return Object.freeze({
      ref: current.ref,
      sha256: current.sha256,
      raw: current.raw,
      value: current.value,
      actor: current.actor,
    });
  } catch {
    // Do not disclose whether a caller supplied a structurally plausible but
    // semantically invalid stage outcome. The E2E route must remain a single
    // unavailable fact for every missing or unauthenticated current outcome.
    throw new Error("verify-code E2E review requires one current completed build-code outcome");
  }
}

function sourceFamily(sourceId) {
  if (typeof sourceId !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._-]*(?:\/[A-Za-z0-9][A-Za-z0-9._-]*)*$/.test(sourceId)) {
    throw new Error("review actor source_id must use the configured provider identity namespace");
  }
  return sourceId.split("/")[0];
}

function withTaskBoundE2eLock(task, lockRef, operation) {
  const key = `${task.taskPath ?? task.identity?.taskId ?? "unknown-task"}:${lockRef}`;
  const previous = taskBoundReviewQueues.get(key) ?? Promise.resolve();
  let release;
  const current = new Promise((resolve) => { release = resolve; });
  taskBoundReviewQueues.set(key, current);
  return previous
    .then(() => task.withRecordLock(lockRef, operation, { waitMs: 900000 }))
    .finally(() => {
      release();
      if (taskBoundReviewQueues.get(key) === current) taskBoundReviewQueues.delete(key);
    });
}

function taskBoundSubjectBinding(trusted, execution, snapshotTree, materialRevision) {
  sourceFamily(execution.actor.source_id);
  return Object.freeze({
    task_id: trusted.taskId,
    stage: "build-code",
    snapshot_tree: snapshotTree,
    material_revision: materialRevision,
    execution_ref: execution.ref,
    execution_sha256: execution.sha256,
    executor_actor: Object.freeze({ ...execution.actor }),
  });
}

function readHashedJson(task, reference) {
  if (!reference || typeof reference.ref !== "string" || !/^[a-f0-9]{64}$/.test(reference.sha256 ?? "")) return null;
  try {
    const raw = task.readRecord(reference.ref);
    if (createHash("sha256").update(raw).digest("hex") !== reference.sha256) return null;
    return Object.freeze({ raw, value: JSON.parse(raw) });
  } catch {
    return null;
  }
}

function hasContentAddressedSuffix(ref, hash) {
  return typeof ref === "string" && typeof hash === "string"
    && (ref.endsWith(`/${hash}.json`) || ref.endsWith(`-${hash}.json`));
}

function readCurrentExecutionFact(trusted, factRef, subjectBinding, snapshot) {
  const match = QUALITY_FACT_REF.exec(factRef ?? "");
  if (!match) return null;
  let raw;
  let fact;
  try {
    raw = trusted.task.readRecord(factRef);
    fact = JSON.parse(raw);
  } catch {
    return null;
  }
  const digest = qualityFactDigest(fact);
  if (match[1] !== digest || fact?.fact_id !== `quality-${digest}`
      || fact.schema_version !== "quality-fact.v1"
      || fact.task_id !== subjectBinding.task_id || fact.stage !== "build-code"
      || fact.kind !== "acceptance_criterion" || fact.subject !== "acceptance_execution"
      || !new Set(["passed", "failed", "missing"]).has(fact.status)
      || fact.snapshot_tree !== snapshot.tree || fact.material_revision !== subjectBinding.material_revision
      || !Array.isArray(fact.evidence) || fact.evidence.length !== 1) return null;

  const acceptanceBinding = fact.evidence[0];
  if (acceptanceBinding?.evidence_type !== "acceptance_evidence"
      || !ACCEPTANCE_EVIDENCE_REF.test(acceptanceBinding.ref ?? "")
      || !hasContentAddressedSuffix(acceptanceBinding.ref, acceptanceBinding.sha256)) return null;
  const acceptance = readHashedJson(trusted.task, acceptanceBinding);
  if (!acceptance) return null;
  try { validateAcceptanceEvidence(acceptance.value); } catch { return null; }
  const expectedResult = fact.status === "passed" ? "pass" : fact.status === "failed" ? "fail" : "deferred";
  if (acceptance.value.acceptance_criterion_id !== "acceptance_execution"
      || acceptance.value.result !== expectedResult
      || acceptance.value.snapshot_tree !== snapshot.tree
      || acceptance.value.refs.length !== 1
      || acceptance.value.freshness?.status !== "current"
      || acceptance.value.freshness.snapshot_tree !== snapshot.tree
      || acceptance.value.freshness.material_revision !== subjectBinding.material_revision
      || acceptance.value.freshness.evidence_freshness?.length !== 1
      || acceptance.value.freshness.evidence_freshness[0]?.ref !== acceptance.value.refs[0].ref
      || acceptance.value.freshness.evidence_freshness[0]?.sha256 !== acceptance.value.refs[0].sha256
      || acceptance.value.freshness.evidence_freshness[0]?.status !== "current") return null;

  const stageBinding = acceptance.value.refs[0];
  if (!STAGE_QUALITY_EVIDENCE_REF.test(stageBinding.ref ?? "")
      || !hasContentAddressedSuffix(stageBinding.ref, stageBinding.sha256)) return null;
  const stageEvidence = readHashedJson(trusted.task, stageBinding);
  if (!stageEvidence || stageEvidence.value?.schema_version !== "stage-quality-evidence.v1"
      || stageEvidence.value.task_id !== subjectBinding.task_id
      || stageEvidence.value.stage !== "build-code"
      || stageEvidence.value.subject !== "acceptance_execution"
      || stageEvidence.value.status !== fact.status
      || stageEvidence.value.material_revision !== subjectBinding.material_revision
      || stageEvidence.value.snapshot_tree !== snapshot.tree
      || stageEvidence.value.subject_fact?.status !== fact.status
      || stageEvidence.value.subject_fact?.execution_binding?.stage_outcome_ref !== subjectBinding.execution_ref
      || stageEvidence.value.subject_fact?.execution_binding?.stage_outcome_hash !== subjectBinding.execution_sha256
      || !Array.isArray(stageEvidence.value.subject_fact?.execution_items)) return null;

  const browser = [];
  for (const item of stageEvidence.value.subject_fact.execution_items) {
    const scenario = item && typeof item === "object" && !Array.isArray(item)
      && typeof item.task_id === "string" && item.task_id.trim() !== ""
      && typeof item.source === "string" && item.source.trim() !== ""
      && typeof item.sample === "string" && item.sample.trim() !== ""
      && typeof item.scenario === "string" && item.scenario.trim() !== ""
      && item.tier === "browser"
      ? item : null;
    if (!scenario || item.status !== "executed"
        || !Array.isArray(item.evidence_refs) || item.evidence_refs.length === 0) return null;
    for (const evidenceBinding of item.evidence_refs) {
      if (!BROWSER_QA_EVIDENCE_REF.test(evidenceBinding?.ref ?? "")) return null;
      const evidence = readHashedJson(trusted.task, evidenceBinding);
      if (!evidence) return null;
      try { validateBrowserQaEvidence(evidence.value); } catch { return null; }
      const value = evidence.value;
      if (value.applicability !== "ui" || value.result !== "pass"
          || value.task_id !== subjectBinding.task_id || value.stage !== "build-code"
          || value.snapshot_tree !== snapshot.tree || value.material_revision !== subjectBinding.material_revision
          || value.acceptance_scenario?.source !== scenario.source
          || value.acceptance_scenario?.sample !== scenario.sample
          || value.acceptance_scenario?.scenario !== scenario.scenario
          || value.acceptance_scenario?.tier !== "browser"
          || value.cancellation?.status !== "not_cancelled"
          || value.cleanup?.status !== "completed"
          || value.fixture?.fixture_only !== false) return null;
      const screenshots = Array.isArray(value.screenshots) ? value.screenshots : [];
      const screenshotRefs = Array.isArray(value.visual?.screenshot_refs) ? value.visual.screenshot_refs : [];
      if (screenshots.length === 0 || screenshots.length !== screenshotRefs.length
          || screenshots.some((attachment) => !screenshotRefs.includes(attachment?.ref))) return null;
      const screenshotBytes = [];
      try {
        for (const attachment of screenshots) {
          if (!attachment?.ref || !/^[a-f0-9]{64}$/.test(attachment.hash ?? "")) return null;
          const attachmentRaw = trusted.task.readRecord(attachment.ref);
          if (createHash("sha256").update(attachmentRaw).digest("hex") !== attachment.hash) return null;
          const publication = JSON.parse(attachmentRaw);
          if (publication?.schema_version !== "workflowhub-evidence-publication.v1"
              || publication.content_encoding !== "base64"
              || typeof publication.content_base64 !== "string"
              || createHash("sha256").update(Buffer.from(publication.content_base64, "base64")).digest("hex") !== publication.content_sha256
              || attachment.ref !== `quality/evidence/browser-qa/${publication.content_sha256}.json`) return null;
          screenshotBytes.push(attachmentRaw);
        }
        const outputRef = value.test?.output_ref;
        const outputHash = value.test?.output_hash;
        if (typeof outputRef !== "string" || !outputRef.startsWith("quality/tests/output/")
            || !/^[a-f0-9]{64}$/.test(outputHash ?? "")) return null;
        const output = trusted.task.readRecord(outputRef);
        if (createHash("sha256").update(output).digest("hex").toString() !== outputHash) return null;
        browser.push({ raw: evidence.raw, screenshots: screenshotBytes, output });
      } catch {
        return null;
      }
    }
  }
  return { fact, acceptance, stageEvidence, browser };
}

function currentTaskBoundReviewMaterials(trusted, execution, subjectBinding) {
  const snapshot = trusted.kernel.currentVNextSnapshot();
  if (snapshot.tree !== subjectBinding.snapshot_tree || typeof snapshot.commit !== "string" || snapshot.commit.trim() === "") {
    throw new Error("verify-code E2E review has no current implementation snapshot commit");
  }
  const fullDiff = execFileSync("git", ["diff", "--binary", "--no-ext-diff", trusted.workspace.baselineCommit, snapshot.commit, "--"], {
    cwd: trusted.workspace.worktreeRoot,
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
  });
  const bounded = compactReviewDiff(fullDiff);
  const diff = bounded.diff;
  const materials = {
    "decision-log.md": ArtifactDir.open(trusted.workspace.worktreeRoot, trusted.task).read("decision-log.md"),
    "spec.md": ArtifactDir.open(trusted.workspace.worktreeRoot, trusted.task).read("spec.md"),
    "plan.md": ArtifactDir.open(trusted.workspace.worktreeRoot, trusted.task).read("plan.md"),
    "tasks.md": ArtifactDir.open(trusted.workspace.worktreeRoot, trusted.task).read("tasks.md"),
    "review-subject-binding.json": subjectBinding,
    "build-code-outcome.json": execution.raw,
    "implementation-diff.patch": diff,
    "implementation-index.json": {
      baseline_commit: trusted.workspace.baselineCommit,
      snapshot_commit: snapshot.commit,
      snapshot_tree: snapshot.tree,
      diff_sha256: bounded.index.diff_sha256,
      full_diff_sha256: bounded.index.full_diff_sha256,
      full_diff_bytes: bounded.index.full_diff_bytes,
      diff_bytes: bounded.index.diff_bytes,
      delivery: bounded.index,
    },
  };
  const testRefs = trusted.task.listCanonicalTestReceiptRefs?.() ?? [];
  let currentTests = 0;
  for (const ref of testRefs) {
    try {
      const raw = trusted.task.readRecord(ref);
      const value = JSON.parse(raw);
      validateCanonicalTestReceipt(value, {
        taskId: trusted.taskId,
        stage: "build-code",
        snapshotTree: snapshot.tree,
        allowedProducerComponents: ["build-code-test-capture"],
      });
      if (value.runtime_profile !== undefined && (value.runtime_profile_status !== "ready" || value.runtime_profile_authenticated !== true)) {
        throw new Error("verify-code E2E review requires authenticated current build-code test evidence; runtime profile is unavailable");
      }
      const output = trusted.task.readRecord(value.output_ref);
      if (createHash("sha256").update(output).digest("hex") !== value.output_hash) continue;
      currentTests += 1;
      materials[`test-${currentTests}-receipt.json`] = raw;
      materials[`test-${currentTests}-output.txt`] = output;
    } catch { /* stale or malformed historical test evidence is not current review material */ }
  }
  if (currentTests === 0) throw new Error("verify-code E2E review requires current build-code test evidence");

  let browserIndex = 0;
  for (const factRef of trusted.task.listCanonicalQualityFactRefs?.() ?? []) {
    const authenticated = readCurrentExecutionFact(trusted, factRef, subjectBinding, snapshot);
    if (!authenticated) continue;
    for (const entry of authenticated.browser) {
      browserIndex += 1;
      materials[`browser-evidence-${browserIndex}.json`] = entry.raw;
      entry.screenshots.forEach((raw, index) => {
        materials[`browser-${browserIndex}-screenshot-${index + 1}.bin`] = Buffer.from(raw);
      });
      materials[`browser-${browserIndex}-test-output.txt`] = entry.output;
    }
  }
  const projected = compactVerifyCodeMaterials(materials).materials;
  const providerBytes = Object.values(projected).reduce((total, value) => total + (Buffer.isBuffer(value) ? value.length : Buffer.byteLength(typeof value === "string" ? value : JSON.stringify(value), "utf8")), 0);
  if (providerBytes > TASK_BOUND_PROVIDER_INPUT_MAX_BYTES) {
    throw Object.assign(new Error("MATERIAL_TOO_LARGE: verify-code provider input exceeds the bounded 300 KiB budget"), { code: "MATERIAL_TOO_LARGE" });
  }
  return Object.freeze(projected);
}

function frozenGroupResult({ group, stage, reviewTrack, reviewKind, materialId, expectedProviders, expectedProviderIdentities, reviewPolicy }) {
  if (!group || !Array.isArray(group.providers) || group.providers.length !== 1) {
    return { status: "unavailable", stage, review_track: reviewTrack, review_kind: reviewKind, material_id: materialId,
      provider_results: [], error: { code: "E2E_REVIEWER_UNAVAILABLE", message: "E2E review requires exactly one strict heterologous provider result" } };
  }
  const member = group.providers[0];
  const expectedSourceId = expectedProviderIdentities?.[member?.provider]?.source_id;
  if (member.status !== "completed" || member.error !== null || typeof member.output !== "string"
      || !Array.isArray(expectedProviders) || !expectedProviders.includes(member.provider)
      || member.identity?.provider !== member.provider || typeof member.identity?.source_id !== "string" || member.identity.source_id.trim() === ""
      || member.identity.source_id !== expectedSourceId
      || member.identity.config_id !== expectedProviderIdentities?.[member?.provider]?.config_id
      || typeof group.runtimeId !== "string" || group.runtimeId.trim() === "") {
    return { status: "unavailable", stage, review_track: reviewTrack, review_kind: reviewKind, material_id: materialId,
      provider_results: [], error: { code: "E2E_REVIEWER_UNAVAILABLE", message: "strict provider identity or output is unavailable" } };
  }
  let findings;
  try { findings = parseReviewerOutput(member.output, { requireEvidence: true }).findings.map((finding) => ({ ...finding, provider: member.provider })); }
  catch { return { status: "unavailable", stage, review_track: reviewTrack, review_kind: reviewKind, material_id: materialId, provider_results: [], error: { code: "OUTPUT_INVALID", message: "strict provider output is not valid findings JSON" } }; }
  return {
    status: "available", stage, review_track: reviewTrack, review_kind: reviewKind, material_id: materialId,
    runtime_id: group.runtimeId, outcome: group.outcome,
    review_policy: reviewPolicy,
    provider_results: [{ provider: member.provider, status: member.status, identity: member.identity, error: member.error, timing: member.timing, usage: member.usage }],
    findings,
  };
}

function publishTaskBoundUnavailable({ trusted, reviewTrack, reviewKind, snapshotTree, materialRevision, error, reviewPolicy = null, materialId = null }) {
  const result = {
    status: "unavailable",
    stage: "verify-code",
    review_track: reviewTrack,
    review_kind: reviewKind,
    material_id: materialId ?? materialRevision.slice("revision-".length),
    provider_results: [],
    error: safeRecoveryError(error),
    ...(reviewPolicy ? { review_policy: reviewPolicy } : {}),
  };
  const refs = recordTaskBoundE2eReviewUnavailable({
    task: trusted.task,
    result,
    snapshot_tree: snapshotTree,
    material_revision: materialRevision,
  });
  const published = Object.freeze({
    ...result,
    ...refs,
    resultRef: null,
    attemptRef: refs.attempt_ref,
    snapshotTree,
    materialId: result.material_id,
    subjectKind: "worktree",
    phaseId: null,
    reviewScope: null,
  });
  return Object.freeze({
    ...published,
    review_fact_intent: publishStageReviewFact({ trusted, stage: "verify-code", reviewTrack, reviewScope: null, reviewKind, result: published }),
  });
}

function selectTaskBoundReviewer(selection, executorSourceId) {
  if (!selection || typeof selection !== "object" || Array.isArray(selection)
      || !Array.isArray(selection.providers) || selection.providers.length !== 1
      || !selection.provider_identities || typeof selection.provider_identities !== "object"
      || Array.isArray(selection.provider_identities)) {
    throw new Error("verify-code E2E review requires an explicit one-profile reviewer route");
  }
  const eligible = Array.isArray(selection.eligibleProfiles)
    ? selection.eligibleProfiles
    : selection.providers;
  if (eligible.length !== 1 || eligible[0] !== selection.providers[0]) {
    throw new Error("verify-code E2E review route does not yield one eligible reviewer");
  }
  const provider = selection.providers[0];
  const reviewerSourceId = selection.provider_identities[provider]?.source_id;
  const reviewerConfigId = selection.provider_identities[provider]?.config_id;
  if (typeof reviewerSourceId !== "string" || reviewerSourceId.trim() === ""
      || typeof reviewerConfigId !== "string" || !/^[a-f0-9]{64}$/.test(reviewerConfigId)
      || reviewerSourceId === executorSourceId) {
    throw new Error("verify-code E2E review requires one configured heterologous reviewer source identity");
  }
  return Object.freeze({
    providers: Object.freeze([provider]),
    provider_identities: Object.freeze({
      [provider]: Object.freeze({ source_id: reviewerSourceId, config_id: reviewerConfigId }),
    }),
    requestedProfileSpecs: Object.freeze([...(selection.requestedProfileSpecs ?? [])]),
    effectiveProfiles: Object.freeze([...(selection.effectiveProfiles ?? [])]),
  });
}

function frozenTaskBoundPolicy(route, selection) {
  const provider = selection.providers[0];
  const effective = (selection.effectiveProfiles ?? []).find((entry) => entry.provider === provider)
    ?? { provider, adapter: provider.split("/")[0], model: null, effort: null, thinking: null };
  const configuredSpec = (selection.requestedProfileSpecs ?? []).find((entry) => entry.provider === provider);
  const spec = configuredSpec ?? {
    provider, model: effective.model ?? null, effort: effective.effort ?? null, thinking: effective.thinking ?? null,
    priority: route.profile_priorities?.[provider] ?? 0,
  };
  return Object.freeze({
    source: "wh_review.v2", mode: route.mode, minimum_heterologous: 1,
    requested_profiles: Object.freeze([provider]), requested_profile_specs: Object.freeze([Object.freeze({ ...spec })]),
    eligible_profiles: Object.freeze([provider]), same_source_exclusions: Object.freeze([]),
    effective_profiles: Object.freeze([Object.freeze({ ...effective })]),
    broker_identity: Object.freeze({ provider, ...selection.provider_identities[provider] }),
  });
}

function reusableTaskBoundE2eReview({ trusted, materialId, execution, subjectBinding, selection, reviewPolicy, reviewTrack, reviewKind }) {
  const provider = selection.providers[0];
  const reviewerSourceId = selection.provider_identities[provider].source_id;
  for (const ref of trusted.task.listCanonicalReviewResultRefs?.() ?? []) {
    try {
      const raw = trusted.task.readRecord(ref);
      const value = JSON.parse(raw);
      validateSchema("result", value);
      const binding = value.e2e_binding;
      if (value.task_id !== trusted.taskId || value.stage !== "verify-code"
          || (value.review_track ?? null) !== reviewTrack || (value.review_kind ?? null) !== reviewKind
          || value.snapshot_tree !== subjectBinding.snapshot_tree || value.material_revision !== subjectBinding.material_revision
          || value.material_id !== materialId || binding?.reviewed_execution?.ref !== execution.ref
          || JSON.stringify(value.review_policy) !== JSON.stringify(reviewPolicy)
          || binding.reviewed_execution.sha256 !== execution.sha256
          || JSON.stringify(binding.reviewed_execution.actor) !== JSON.stringify(execution.actor)
          || binding.reviewer_actor?.source_id !== reviewerSourceId
          || !Array.isArray(value.provider_results) || value.provider_results.length !== 1
          || value.provider_results[0]?.provider !== provider) continue;
      const attempt = JSON.parse(trusted.task.readRecord(value.attempt_ref));
      validateSchema("attempt", attempt);
      if (attempt.terminal_status !== "semantic" || attempt.error !== null
          || attempt.material_id !== materialId || JSON.stringify(attempt.e2e_binding) !== JSON.stringify(binding)
          || JSON.stringify(attempt.review_policy) !== JSON.stringify(reviewPolicy)) continue;
      const frozen = readFrozenReviewMaterial({
        task: trusted.task,
        ref: binding.frozen_material?.ref,
        sha256: binding.frozen_material?.sha256,
      });
      if (frozen.provider_input_sha256 !== materialId) continue;
      const parsed = JSON.parse(frozen.bytes.toString("utf8"));
      if (JSON.stringify(parsed.subject_binding) !== JSON.stringify(subjectBinding)) continue;
      if (JSON.stringify(parsed.review_policy) !== JSON.stringify(reviewPolicy)) continue;
      return Object.freeze({
        status: "available", stage: "verify-code", review_track: reviewTrack, review_kind: reviewKind,
        resultRef: ref, attemptRef: value.attempt_ref,
        snapshotTree: subjectBinding.snapshot_tree, materialId,
        subjectKind: "worktree", phaseId: null, reviewScope: null, reused: true,
      });
    } catch { /* only a fully authenticated current semantic result is reusable */ }
  }
  // A frozen provider input can also terminate unavailable (transport failure,
  // invalid output, or strict identity mismatch). Reuse that immutable
  // terminal fact for the same current input/policy instead of dispatching a
  // second provider request. The provider-input hash is recomputed from the
  // current materials before this lookup, so it is the frozen-bytes identity.
  for (const ref of trusted.task.listCanonicalReviewAttemptRefs?.() ?? []) {
    try {
      const attempt = JSON.parse(trusted.task.readRecord(ref));
      validateSchema("attempt", attempt);
      if (attempt.task_id !== trusted.taskId || attempt.stage !== "verify-code"
          || (attempt.review_track ?? null) !== reviewTrack || (attempt.review_kind ?? null) !== reviewKind
          || attempt.snapshot_tree !== subjectBinding.snapshot_tree || attempt.material_revision !== subjectBinding.material_revision
          || attempt.material_id !== materialId || attempt.subject_kind !== "worktree" || attempt.phase_id !== null
          || attempt.review_scope !== null || attempt.terminal_status !== "unavailable" || attempt.error === null
          || JSON.stringify(attempt.review_policy) !== JSON.stringify(reviewPolicy)
          || !Array.isArray(attempt.provider_attempts) || attempt.provider_attempts.length !== 0) continue;
      return Object.freeze({
        status: "unavailable", stage: "verify-code", review_track: reviewTrack, review_kind: reviewKind,
        resultRef: null, attemptRef: ref,
        snapshotTree: subjectBinding.snapshot_tree, materialId,
        subjectKind: "worktree", phaseId: null, reviewScope: null,
        reused: true, error: attempt.error,
      });
    } catch { /* only a fully authenticated current unavailable attempt is reusable */ }
  }
  return null;
}

/** Private task-bound route: freeze A, re-read A, then dispatch only rehydrated A. */
// Not reachable from the public CLI. The authenticated stage host imports this
// private module capability after it has bound the current task context.
export async function runTaskBoundE2eReview(input, dependencies = {}) {
  if (!input || input.stage !== "verify-code") throw new TypeError("task-bound E2E review is only valid for verify-code");
  const trusted = dependencies.resolveTrustedSubject ? dependencies.resolveTrustedSubject(input) : resolveTrustedReviewSubject(input);
  const reviewTrack = input.review_track ?? input.reviewTrack ?? null;
  const reviewKind = input.review_kind ?? input.reviewKind ?? null;
  if (reviewKind !== null) throw new TypeError("task-bound E2E review does not support mini-task review kinds");
  const snapshotTree = trusted.kernel.currentVNextSnapshot().tree;
  const materialRevision = trusted.kernel.currentVNextMaterialRevision();
  if (!/^revision-[a-f0-9]{64}$/.test(materialRevision)) {
    throw new Error("verify-code E2E review requires the current material revision");
  }
  let execution;
  try { execution = currentBuildCodeExecution(trusted); }
  catch (error) { return publishTaskBoundUnavailable({ trusted, reviewTrack, reviewKind, snapshotTree, materialRevision, error }); }
  const subjectBinding = taskBoundSubjectBinding(trusted, execution, snapshotTree, materialRevision);
  let materials;
  try { materials = currentTaskBoundReviewMaterials(trusted, execution, subjectBinding); }
  catch (error) { return publishTaskBoundUnavailable({ trusted, reviewTrack, reviewKind, snapshotTree, materialRevision, error }); }
  const loadConfig = dependencies.loadConfig ?? loadTrustedThirdReviewConfig;
  const resolveRoute = dependencies.resolveRoute ?? resolveTrustedReviewRoute;
  const selectProviders = dependencies.selectProviders ?? selectTrustedReviewProviderSelection;
  let configured;
  let route;
  let selection;
  let reviewPolicy;
  let hostProvider;
  try {
    configured = loadConfig({ requestedStage: "verify-code", requestedTrack: reviewTrack, requestedReviewKind: reviewKind });
    route = resolveRoute(configured.whReview, "verify-code", reviewTrack, reviewKind);
    if (!route) throw new Error("no heterologous review route is configured");
    if (route.minimum_heterologous !== 1 || !Array.isArray(route.initial) || route.initial.length !== 1) {
      throw new Error("verify-code E2E review requires an explicit one-profile route with minimum_heterologous=1");
    }
    hostProvider = input.host_provider ?? input.hostProvider;
    selection = selectTaskBoundReviewer(selectProviders(configured.config, execution.actor.source_id, route), execution.actor.source_id);
    reviewPolicy = frozenTaskBoundPolicy(route, selection);
  } catch (error) {
    return publishTaskBoundUnavailable({ trusted, reviewTrack, reviewKind, snapshotTree, materialRevision, error });
  }
  const packet = createSimpleReviewPacket({ stage: "verify-code", review_track: reviewTrack, materials });
  const providerInput = serializeProviderInput({
    packet,
    hostProvider,
    providers: selection.providers,
    providerIdentities: selection.provider_identities,
    reviewMode: route.mode,
    subjectBinding,
    reviewPolicy,
  });
  const providerInputSha256 = createHash("sha256").update(providerInput).digest("hex");
  const lockRef = `locks/e2e-review-${providerInputSha256}.lock`;
  return withTaskBoundE2eLock(trusted.task, lockRef, async () => {
    const reusable = reusableTaskBoundE2eReview({
      trusted, materialId: providerInputSha256, execution, subjectBinding, selection, reviewPolicy, reviewTrack, reviewKind,
    });
    if (reusable) {
      return Object.freeze({
        ...reusable,
        review_fact_intent: publishStageReviewFact({ trusted, stage: "verify-code", reviewTrack, reviewScope: null, reviewKind, result: reusable }),
      });
    }
    const frozen = freezeReviewMaterial({ task: trusted.task, bytes: providerInput });
    const reloaded = readFrozenReviewMaterial({ task: trusted.task, ref: frozen.ref, sha256: frozen.sha256 });
    const client = dependencies.client ?? new ReviewProviderClient({ command: configured.command, config: configured.config });
    let group;
    try { group = await dispatchFrozenProviderInput({ bytes: reloaded.bytes, attachmentRoot: configured.attachmentRoot, client }); }
    catch (error) {
      return publishTaskBoundUnavailable({ trusted, reviewTrack, reviewKind, snapshotTree, materialRevision, error, reviewPolicy, materialId: frozen.provider_input_sha256 });
    }
    const result = Object.freeze({ ...frozenGroupResult({
      group,
      stage: "verify-code",
      reviewTrack,
      reviewKind,
      materialId: frozen.provider_input_sha256,
      expectedProviders: selection.providers,
      expectedProviderIdentities: selection.provider_identities,
      reviewPolicy,
    }), review_policy: reviewPolicy });
    if (result.status !== "available") {
      const refs = recordTaskBoundE2eReviewUnavailable({
        task: trusted.task, result,
        snapshot_tree: snapshotTree,
        material_revision: materialRevision,
      });
      const published = Object.freeze({
        ...result, ...refs, resultRef: null, attemptRef: refs.attempt_ref,
        snapshotTree, materialId: frozen.provider_input_sha256,
        subjectKind: "worktree", phaseId: null, reviewScope: null,
      });
      return Object.freeze({ ...published, review_fact_intent: publishStageReviewFact({ trusted, stage: "verify-code", reviewTrack, reviewScope: null, reviewKind, result: published }) });
    }
    const provider = result.provider_results[0];
    const reviewerSourceId = selection.provider_identities?.[provider.provider]?.source_id;
    if (typeof reviewerSourceId !== "string" || reviewerSourceId.trim() === "") {
      throw new Error("E2E review provider has no configured source identity");
    }
    if (reviewerSourceId === execution.actor.source_id) {
      throw new Error("E2E review provider source identity belongs to the build-code executor source identity");
    }
    const refs = recordTaskBoundE2eReviewResult({
      task: trusted.task,
      result,
      binding: {
        frozen_material: frozen,
        reviewed_execution: execution,
        reviewer_actor: { source_kind: "review_provider", source_id: reviewerSourceId, run_id: `${group.runtimeId}:${provider.provider}` },
        snapshot_tree: snapshotTree,
        material_revision: materialRevision,
      },
    });
    const published = Object.freeze({
      ...result,
      ...refs,
      resultRef: refs.result_ref,
      attemptRef: refs.attempt_ref,
      snapshotTree,
      materialId: frozen.provider_input_sha256,
      subjectKind: "worktree",
      phaseId: null,
      reviewScope: null,
    });
    return Object.freeze({ ...published, review_fact_intent: publishStageReviewFact({ trusted, stage: "verify-code", reviewTrack, reviewScope: null, reviewKind, result: published }) });
  });
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
  if (typeof result.materialId !== "string" || !/^[a-f0-9]{64}$/.test(result.materialId)) {
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
    return recordSimpleReviewRequest({ task: recordContext.task, kernel: recordContext.kernel, request, runRound, resolveRouteIdentity });
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

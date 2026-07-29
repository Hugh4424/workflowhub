import { assertTaskHandle } from "./task-handle.mjs";
import { assertTaskKernel } from "./task-kernel.mjs";
import { officialStageHandler } from "./stage-handlers.mjs";
import { requiresHumanConfirmation } from "./stage-acceptance-policy.mjs";
import { createHash } from "node:crypto";
import { captureWorkspaceSnapshot } from "./canonical-receipt-writer.mjs";
import { inspectIntegrationReviewSubject } from "../skills/wh-review/scripts/integration-review-subject.mjs";

const UPSTREAM_STAGE = Object.freeze({
  "make-decision": null,
  "build-spec": "make-decision",
  "build-plan": "build-spec",
  "build-code": "build-plan",
  "verify-code": "build-code",
});
const UPSTREAM_INPUT = Object.freeze({
  "make-decision": "decision",
  "build-spec": null,
  "build-plan": "spec",
  "build-code": "build_plan",
  "verify-code": null,
});

function upstreamForStage(ctx, stage, upstreamStage) {
  const slot = UPSTREAM_INPUT[stage];
  const hasInput = slot && Object.prototype.hasOwnProperty.call(ctx.manifest.inputs ?? {}, slot);
  if (!upstreamStage) return hasInput ? ctx.kernel.readInput(slot) : null;
  const readOptions = stage === "verify-code" && upstreamStage === "build-code"
    ? { allowLegacyBuildCode: true }
    : undefined;
  if (!hasInput) {
    try { return ctx.kernel.readAcceptedAudit(upstreamStage, readOptions); }
    catch (error) {
      if (error?.code === "ENOENT") return null;
      throw error;
    }
  }
  let local;
  try { local = ctx.kernel.readAcceptedAudit(upstreamStage, readOptions); } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  if (local) throw new Error(`${stage} has both current accepted ${upstreamStage} and manifest input ${slot}`);
  return ctx.kernel.readInput(slot);
}

function workerContext(ctx, publication = {}) {
  return Object.freeze({
    stage: ctx.stage,
    identity: ctx.identity,
    workflowRunId: ctx.workflowRunId,
    manifest: ctx.manifest,
    ...(ctx.candidateWorkspace ? { candidateWorkspace: ctx.candidateWorkspace } : {}),
    ...(ctx.workspace ? { workspace: ctx.workspace } : {}),
    ...(ctx.artifacts ? { artifacts: ctx.artifacts } : {}),
    createCheckpoint: (stage = ctx.stage) => ctx.kernel.createCheckpoint(stage, publication.baselineRebindRef ? { baselineRebindRef: publication.baselineRebindRef } : undefined),
  });
}

function assertContext(context, stage) {
  if (!context || typeof context !== "object" || context.stage !== stage) {
    throw new TypeError(`StageContext for ${stage} is required`);
  }
  const task = assertTaskHandle(context.task);
  const kernel = assertTaskKernel(context.kernel);
  if (kernel.task !== task) throw new Error("StageContext TaskHandle/TaskKernel mismatch");
  return context;
}

function plainResult(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError("stage handler must return a plain result object");
  }
  if (!value.facts || typeof value.facts !== "object" || Array.isArray(value.facts)) {
    throw new TypeError("stage handler result.facts is required");
  }
  if (Object.prototype.hasOwnProperty.call(value, "schema_version") && value.schema_version !== "stage-runtime-result.v2") {
    throw new TypeError("stage handler result schema_version must be stage-runtime-result.v2");
  }
  return value;
}

/**
 * Execute the shared publication boundary for every workflow stage.
 * The handler receives capabilities and already verified upstream data; it does
 * not discover task identity or publish records itself.
 */
export async function runStage(stage, context, handler, publication = {}) {
  if (!Object.prototype.hasOwnProperty.call(UPSTREAM_STAGE, stage)) {
    throw new TypeError(`unsupported stage: ${stage}`);
  }
  const ctx = assertContext(context, stage);
  if (typeof handler !== "function") throw new TypeError("stage handler is required");

  const upstreamStage = UPSTREAM_STAGE[stage];
  const upstream = upstreamForStage(ctx, stage, upstreamStage);
  const result = plainResult(await handler(workerContext(ctx, publication), upstream));
  const upstreamRefs = upstream ? [{
    task_id: upstream.accepted.task_id,
    stage: upstream.accepted.stage,
    accepted_ref: `results/${upstream.accepted.stage}/accepted.json`,
  }] : [];

  if (!publication || typeof publication !== "object" || Array.isArray(publication)) throw new TypeError("stage publication options must be an object");
  const attempt = ctx.kernel.publishAttempt(stage, {
    facts: result.facts,
    evidence_refs: result.evidence_refs ?? [],
    missing_items: result.missing_items ?? [],
    upstream_refs: upstreamRefs,
    ...(result.verification_failure ? { verification_failure: true } : {}),
    ...(result.checkpoint !== undefined ? { checkpoint: result.checkpoint } : {}),
    ...(result.reason !== undefined ? { reason: result.reason } : {}),
    ...(publication.reopenProvenance !== undefined ? { reopen_provenance: publication.reopenProvenance } : {}),
    ...(publication.baselineRebindRef !== undefined ? { baseline_rebind_ref: publication.baselineRebindRef } : {}),
  });
  if (result.verification_failure) {
    const error = new Error(`${stage} verification failed; formal failure attempt published: ${attempt.attempt_ref}`);
    error.attempt_ref = attempt.attempt_ref;
    throw error;
  }
  return attempt;
}

function reviewSubjectKey(value) {
  return JSON.stringify([
    value.stage,
    value.review_track ?? null,
    value.subject_kind,
    value.phase_id ?? null,
    value.review_scope ?? null,
  ]);
}

function reviewFlowSubjectsForStage(stage) {
  if (stage === "make-decision") return ["direction", "detail"].map((reviewTrack) => ({
    stage, review_track: reviewTrack, subject_kind: "worktree", phase_id: null, review_scope: null,
  }));
  if (stage === "verify-code") return [
    { stage: "build-code", review_track: null, subject_kind: "worktree", phase_id: null, review_scope: "integration" },
    { stage: "verify-code", review_track: null, subject_kind: "worktree", phase_id: null, review_scope: null },
  ];
  return [{
    stage,
    review_track: null,
    subject_kind: "worktree",
    phase_id: null,
    review_scope: stage === "build-code" ? "integration" : null,
  }];
}

function trustedReviewFlowIdentities(ctx, publication = {}) {
  let revision = null;
  if (ctx.stage === "build-code" && publication.reopenProvenance) {
    revision = publication.reopenProvenance;
  } else if (ctx.stage === "verify-code") {
    try {
      revision = ctx.kernel.readAccepted("build-code", { allowLegacyBuildCode: true }).attempt.reopen_provenance ?? null;
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
  }
  return reviewFlowSubjectsForStage(ctx.stage).map((subject) => {
    if (revision === null || subject.stage !== "build-code") return ctx.kernel.deriveReviewFlowIdentity(subject);
    return ctx.kernel.deriveReviewFlowIdentity({ ...subject, revision_ref: revision.reopen_ref });
  });
}

function withReviewFlowLocks(kernel, identities, operation, index = 0) {
  if (index >= identities.length) return operation();
  return kernel.withReviewFlowLock(identities[index], () => withReviewFlowLocks(kernel, identities, operation, index + 1));
}

function sameReviewFlowIdentities(left, right) {
  return left.length === right.length && left.every((identity, index) =>
    JSON.stringify(identity) === JSON.stringify(right[index]));
}

function withTrustedUpstreamAcceptance(ctx, reviewFlowIdentities, publication, operation) {
  const upstreamStage = UPSTREAM_STAGE[ctx.stage];
  if (upstreamStage === null) return operation();
  const slot = UPSTREAM_INPUT[ctx.stage];
  if (slot && Object.prototype.hasOwnProperty.call(ctx.manifest.inputs ?? {}, slot)) return operation();
  return ctx.task.withRecordLock(`locks/${upstreamStage}.publication.lock`, () => {
    const currentIdentities = trustedReviewFlowIdentities(ctx, publication);
    if (!sameReviewFlowIdentities(reviewFlowIdentities, currentIdentities)) {
      throw new Error("trusted upstream acceptance changed while acquiring the review publication boundary; retry the stage");
    }
    return operation();
  });
}

function officialWorkerContext(ctx, publication = {}, reviewFlowIdentities = []) {
  const trustedFlows = new Map(reviewFlowIdentities.map((identity) => [reviewSubjectKey(identity), identity]));
  return Object.freeze({
    stage: ctx.stage,
    identity: ctx.identity,
    workflowRunId: ctx.workflowRunId,
    accepted: Object.freeze({ readInput: (slot) => ctx.kernel.readInput(slot) }),
    readReceipt: (ref) => {
      const raw = ctx.task.readRecord(ref);
      return Object.freeze({ value: JSON.parse(raw), sha256: createHash("sha256").update(raw).digest("hex") });
    },
    readOptionalReceipt: (ref) => {
      try {
        const raw = ctx.task.readRecord(ref);
        return Object.freeze({ value: JSON.parse(raw), sha256: createHash("sha256").update(raw).digest("hex") });
      } catch (error) {
        if (error?.code === "ENOENT") return null;
        throw error;
      }
    },
    readEvidence: (ref) => {
      const raw = ctx.task.readRecord(ref);
      return Object.freeze({ bytes: raw, sha256: createHash("sha256").update(raw).digest("hex") });
    },
    // External audit records are visible only for human-boundary notices.
    // They are deliberately not receipts, facts, evidence refs, or gates.
    listReviewAuditRefs: () => ctx.task.listCanonicalReviewResolutionRefs(),
    readReviewAudit: (ref) => {
      const raw = ctx.task.readRecord(ref);
      return Object.freeze({ value: JSON.parse(raw), sha256: createHash("sha256").update(raw).digest("hex") });
    },
    readAuthenticatedReviewFlow: (subject) => {
      const identity = trustedFlows.get(reviewSubjectKey(subject ?? {}));
      if (!identity) throw new Error("review subject is not authorized for this stage consumer");
      return ctx.kernel.readReviewFlow(identity);
    },
    ...(ctx.stage === "build-code" && ctx.workspace ? {
      inspectIntegrationReviewSubject: (finalTree) => inspectIntegrationReviewSubject({
        task: ctx.task,
        sourceRoot: ctx.workspace.worktreeRoot,
        finalTree,
      }),
    } : {}),
    ...(ctx.stage === "verify-code" ? {
      // Verify must be able to turn a legacy accepted build into an explicit
      // failure so the controlled reopen path can upgrade it. The handler
      // still fails closed when acceptance_coverage is absent.
      readAcceptedBuildCode: ({ allowLegacyBuildCode = false, required = true } = {}) => {
        try { return ctx.kernel.readAccepted("build-code", { allowLegacyBuildCode }); }
        catch (error) {
          if (!required && error?.code === "ENOENT") return null;
          throw error;
        }
      },
    } : {}),
    ...(ctx.workspace ? { workspace: Object.freeze({ worktreeRoot: ctx.workspace.worktreeRoot, baselineCommit: ctx.workspace.baselineCommit }) } : {}),
    ...(ctx.workspace ? { snapshotWorkspace: () => captureWorkspaceSnapshot(ctx.workspace) } : {}),
    ...(ctx.candidateWorkspace ? { candidateWorkspace: Object.freeze({
      worktreeRoot: ctx.candidateWorkspace.worktreeRoot,
      baselineCommit: ctx.candidateWorkspace.baselineCommit,
      captureSnapshot: () => ctx.candidateWorkspace.captureSnapshot(),
    }) } : {}),
    ...(ctx.artifacts ? {
      readArtifact: (name) => ctx.artifacts.read(name),
      writeArtifact: (name, value) => ctx.artifacts.writeAtomic(name, value),
      artifactRef: (name) => ctx.artifacts.reference(name),
      createCheckpoint: (name) => ctx.kernel.createCheckpoint(name, publication.baselineRebindRef ? { baselineRebindRef: publication.baselineRebindRef } : undefined),
    } : {}),
  });
}

function verifyEvidenceReference(ctx, entry, label = "evidence") {
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) throw new TypeError(`${label} must be an authenticated reference`);
  if (typeof entry.ref !== "string" || !entry.ref.startsWith("evidence/") && !entry.ref.startsWith("receipts/") && !entry.ref.startsWith("reviews/results/") && !entry.ref.startsWith("reviews/attempts/") && !entry.ref.startsWith("reviews/resolutions/")) {
    throw new Error(`${label} is outside a canonical namespace`);
  }
  if (!/^[a-f0-9]{64}$/.test(entry.sha256 ?? "")) throw new TypeError(`${label} sha256 is required`);
  const raw = ctx.task.readRecord(entry.ref);
  const actual = createHash("sha256").update(raw).digest("hex");
  if (actual !== entry.sha256) throw new Error(`${label} hash mismatch: ${entry.ref}`);
  return entry;
}

function verifyOfficialEvidence(ctx, result) {
  for (const [index, entry] of (result.evidence_refs ?? []).entries()) verifyEvidenceReference(ctx, entry, `evidence_refs[${index}]`);
  const tests = result.facts?.tests;
  if (tests) {
    // output_ref is independently re-read; a valid receipt cannot vouch for a
    // missing or subsequently replaced command output.
    const output_ref = tests.output_ref;
    const raw = ctx.task.readRecord(output_ref);
    if (createHash("sha256").update(raw).digest("hex") !== tests.output_hash) throw new Error(`test output_ref hash mismatch: ${output_ref}`);
  }
  return result;
}

function assertOfficialRevisionAuthorization(stage, ctx, invocation, publication) {
  if (!new Set(["build-code", "verify-code"]).has(stage)) return;
  const refs = Object.values(invocation?.receipts ?? {});
  const hasRevision = refs.some((ref) => {
    if (typeof ref !== "string") return false;
    let value;
    try { value = JSON.parse(ctx.task.readRecord(ref)); } catch { return false; }
    return value?.schema_version === "workflowhub-receipt.v1" && value.revision && typeof value.revision === "object";
  });
  if (!hasRevision) return;
  if (stage === "build-code") {
    if (publication?.reopenProvenance) return;
    try {
      ctx.task.readRecord("results/build-code/accepted.json");
    } catch (error) {
      if (error?.code === "ENOENT") return;
      throw error;
    }
    ctx.kernel.readAccepted("build-code");
    throw new Error("accepted build-code revision receipt requires a controlled reopen");
  }
  let acceptedVerify;
  try { acceptedVerify = ctx.kernel.readAccepted("verify-code"); }
  catch (error) {
    // The first fresh verify may revise a stale create-only evidence record
    // before any verify result has been accepted. That is a failure attempt,
    // not a reopen of an accepted verify result. Keep the normal path strict.
    if (error?.code === "ENOENT") return;
    throw new Error("verify-code revision receipt requires controlled fresh verify lineage");
  }
  const activeBuild = ctx.kernel.readAccepted("build-code");
  if (!acceptedVerify || !activeBuild.attempt.reopen_provenance) throw new Error("verify-code revision receipt requires controlled fresh verify lineage");
}

/** Fixed repository-owned handler path; callers provide receipt references, never facts or code. */
export function runOfficialStage(stage, context, invocation, publication) {
  const ctx = assertContext(context, stage);
  assertOfficialRevisionAuthorization(stage, ctx, invocation, publication);
  const handler = officialStageHandler(stage);
  const input = Object.freeze(structuredClone(invocation));
  const reviewFlowIdentities = trustedReviewFlowIdentities(ctx, publication);
  return withReviewFlowLocks(ctx.kernel, reviewFlowIdentities, () =>
    withTrustedUpstreamAcceptance(ctx, reviewFlowIdentities, publication, () => runStage(
      stage,
      ctx,
      async () => verifyOfficialEvidence(ctx, await handler(officialWorkerContext(ctx, publication, reviewFlowIdentities), input)),
      publication,
    )));
}

/** Re-run the official verifier after a revised build without replacing the accepted verify result. */
export async function publishOfficialVerifyPassing(context, invocation) {
  const ctx = assertContext(context, "verify-code");
  const handler = officialStageHandler("verify-code");
  const input = Object.freeze(structuredClone(invocation));
  const reviewFlowIdentities = trustedReviewFlowIdentities(ctx);
  return withReviewFlowLocks(ctx.kernel, reviewFlowIdentities, () =>
    withTrustedUpstreamAcceptance(ctx, reviewFlowIdentities, {}, async () => {
    const result = plainResult(
      verifyOfficialEvidence(ctx, await handler(officialWorkerContext(ctx, {}, reviewFlowIdentities), input)),
    );
    if (result.verification_failure) {
      if (result.reason?.includes("acceptance criterion(s) failed")) {
        throw new Error("verify-code passing publication requires acceptance-evidence.v1 with result=pass");
      }
      throw new Error(result.reason ?? "verify-code verification failed");
    }
    return ctx.kernel.publishVerifyPassingFromAccepted({
      facts: result.facts,
      evidenceRefs: result.evidence_refs ?? [],
      missingItems: result.missing_items ?? [],
      ...(result.reason !== undefined ? { reason: result.reason } : {}),
    });
    }));
}

/** Persist the user's explicit decision before acceptance. */
export function confirmStageAttempt(stage, context, { attemptRef, decision } = {}) {
  const ctx = assertContext(context, stage);
  if (!requiresHumanConfirmation(stage)) throw new Error(`${stage} uses automatic acceptance and does not require confirmation`);
  return ctx.kernel.confirmAttempt(stage, attemptRef, decision);
}

/** Acceptance stays separate from execution; only decision gates require a human ref. */
export function acceptStageAttempt(stage, context, request = {}) {
  if (Object.prototype.hasOwnProperty.call(request, "checkpoint")) throw new TypeError("caller checkpoint override is forbidden");
  const { attemptRef, humanConfirmationRef, fullAuditWriter } = request;
  const ctx = assertContext(context, stage);
  if (requiresHumanConfirmation(stage) && (typeof humanConfirmationRef !== "string" || humanConfirmationRef.trim() === "")) {
    throw new TypeError("explicit humanConfirmationRef is required");
  }
  if (!requiresHumanConfirmation(stage) && humanConfirmationRef !== undefined) {
    throw new TypeError(`${stage} uses automatic acceptance; omit humanConfirmationRef`);
  }
  if (fullAuditWriter !== undefined && (stage !== "make-decision" || typeof fullAuditWriter !== "function")) {
    throw new TypeError("fullAuditWriter is an internal make-decision runtime capability");
  }
  return ctx.kernel.acceptAttempt(stage, attemptRef, humanConfirmationRef, {
    ...(fullAuditWriter === undefined ? {} : { full_audit_writer: fullAuditWriter }),
  });
}

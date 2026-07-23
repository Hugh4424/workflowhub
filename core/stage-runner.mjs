import { assertTaskHandle } from "./task-handle.mjs";
import { assertTaskKernel } from "./task-kernel.mjs";
import { officialStageHandler } from "./stage-handlers.mjs";
import { requiresHumanConfirmation } from "./stage-acceptance-policy.mjs";
import { createHash } from "node:crypto";
import { captureWorkspaceSnapshot } from "./canonical-receipt-writer.mjs";

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
  if (!hasInput) return ctx.kernel.readAccepted(upstreamStage);
  let local;
  try { local = ctx.kernel.readAccepted(upstreamStage); } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  if (local) throw new Error(`${stage} has both current accepted ${upstreamStage} and manifest input ${slot}`);
  return ctx.kernel.readInput(slot);
}

function workerContext(ctx) {
  return Object.freeze({
    stage: ctx.stage,
    identity: ctx.identity,
    manifest: ctx.manifest,
    ...(ctx.candidateWorkspace ? { candidateWorkspace: ctx.candidateWorkspace } : {}),
    ...(ctx.workspace ? { workspace: ctx.workspace } : {}),
    ...(ctx.artifacts ? { artifacts: ctx.artifacts } : {}),
    createCheckpoint: (stage = ctx.stage) => ctx.kernel.createCheckpoint(stage),
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
  const result = plainResult(await handler(workerContext(ctx), upstream));
  const upstreamRefs = upstream ? [{
    task_id: upstream.accepted.task_id,
    stage: upstream.accepted.stage,
    accepted_ref: `results/${upstream.accepted.stage}/accepted.json`,
  }] : [];

  if (!publication || typeof publication !== "object" || Array.isArray(publication)) throw new TypeError("stage publication options must be an object");
  return ctx.kernel.publishAttempt(stage, {
    facts: result.facts,
    evidence_refs: result.evidence_refs ?? [],
    missing_items: result.missing_items ?? [],
    upstream_refs: upstreamRefs,
    ...(result.checkpoint !== undefined ? { checkpoint: result.checkpoint } : {}),
    ...(result.reason !== undefined ? { reason: result.reason } : {}),
    ...(publication.reopenProvenance !== undefined ? { reopen_provenance: publication.reopenProvenance } : {}),
  });
}

function officialWorkerContext(ctx) {
  return Object.freeze({
    stage: ctx.stage,
    identity: ctx.identity,
    accepted: Object.freeze({ readInput: (slot) => ctx.kernel.readInput(slot) }),
    readReceipt: (ref) => {
      const raw = ctx.task.readRecord(ref);
      return Object.freeze({ value: JSON.parse(raw), sha256: createHash("sha256").update(raw).digest("hex") });
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
    ...(ctx.stage === "verify-code" ? { readAcceptedBuildCode: () => ctx.kernel.readAccepted("build-code") } : {}),
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
      createCheckpoint: (name) => ctx.kernel.createCheckpoint(name),
    } : {}),
  });
}

function verifyEvidenceReference(ctx, entry, label = "evidence") {
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) throw new TypeError(`${label} must be an authenticated reference`);
  if (typeof entry.ref !== "string" || !entry.ref.startsWith("evidence/") && !entry.ref.startsWith("receipts/") && !entry.ref.startsWith("reviews/results/") && !entry.ref.startsWith("reviews/attempts/")) {
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
  catch { throw new Error("verify-code revision receipt requires controlled fresh verify lineage"); }
  const activeBuild = ctx.kernel.readAccepted("build-code");
  if (!acceptedVerify || !activeBuild.attempt.reopen_provenance) throw new Error("verify-code revision receipt requires controlled fresh verify lineage");
}

/** Fixed repository-owned handler path; callers provide receipt references, never facts or code. */
export function runOfficialStage(stage, context, invocation, publication) {
  const ctx = assertContext(context, stage);
  assertOfficialRevisionAuthorization(stage, ctx, invocation, publication);
  const handler = officialStageHandler(stage);
  const input = Object.freeze(structuredClone(invocation));
  return runStage(stage, ctx, async () => verifyOfficialEvidence(ctx, await handler(officialWorkerContext(ctx), input)), publication);
}

/** Re-run the official verifier after a revised build without replacing the accepted verify result. */
export async function publishOfficialVerifyPassing(context, invocation) {
  const ctx = assertContext(context, "verify-code");
  const handler = officialStageHandler("verify-code");
  const input = Object.freeze(structuredClone(invocation));
  const result = plainResult(verifyOfficialEvidence(ctx, await handler(officialWorkerContext(ctx), input)));
  return ctx.kernel.publishVerifyPassingFromAccepted({
    facts: result.facts,
    evidenceRefs: result.evidence_refs ?? [],
    missingItems: result.missing_items ?? [],
    ...(result.reason !== undefined ? { reason: result.reason } : {}),
  });
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
  const { attemptRef, humanConfirmationRef } = request;
  const ctx = assertContext(context, stage);
  if (requiresHumanConfirmation(stage) && (typeof humanConfirmationRef !== "string" || humanConfirmationRef.trim() === "")) {
    throw new TypeError("explicit humanConfirmationRef is required");
  }
  if (!requiresHumanConfirmation(stage) && humanConfirmationRef !== undefined) {
    throw new TypeError(`${stage} uses automatic acceptance; omit humanConfirmationRef`);
  }
  return ctx.kernel.acceptAttempt(stage, attemptRef, humanConfirmationRef);
}

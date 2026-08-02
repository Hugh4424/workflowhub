import { assertTaskHandle } from "./task-handle.mjs";
import { assertTaskKernel } from "../runtime/task/task-kernel.mjs";
import { officialStageHandler } from "./stage-handlers.mjs";
import { requiresHumanConfirmation } from "../runtime/stage/stage-acceptance-policy.mjs";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { captureWorkspaceSnapshot } from "./canonical-receipt-writer.mjs";
import { inspectIntegrationReviewSubject } from "../runtime/review/integration-review-subject.mjs";
import { fileURLToPath } from "node:url";
import { loadStageSkillManifest } from "../runtime/stage/stage-skill-runtime.mjs";

const RUNNER_ROOT = fileURLToPath(new URL("../", import.meta.url));
function declaredBundleHash(root, dependency) {
  const bundle = JSON.parse(readFileSync(resolve(root, dependency.bundle), "utf8"));
  if (bundle?.schema_version !== 1 || bundle.skill !== dependency.name || !Array.isArray(bundle.files) || bundle.files.length === 0) {
    throw new Error(`${dependency.name} declared skill bundle is invalid`);
  }
  const entries = bundle.files.map((entry) => ({
    path: typeof entry === "string" ? entry : entry.path,
    sha256: typeof entry === "string" ? null : entry.sha256 ?? null,
  })).sort((left, right) => left.path.localeCompare(right.path));
  return createHash("sha256").update(JSON.stringify(entries)).digest("hex");
}

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

function upstreamForStage(ctx, stage) {
  const slot = UPSTREAM_INPUT[stage];
  return slot && Object.prototype.hasOwnProperty.call(ctx.manifest.inputs ?? {}, slot)
    ? ctx.kernel.readInput(slot)
    : null;
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

  const upstream = upstreamForStage(ctx, stage);
  const result = plainResult(await handler(workerContext(ctx, publication), upstream));

  if (!publication || typeof publication !== "object" || Array.isArray(publication)) throw new TypeError("stage publication options must be an object");
  const attempt = ctx.kernel.publishAttempt(stage, {
    facts: result.facts,
    evidence_refs: result.evidence_refs ?? [],
    missing_items: result.missing_items ?? [],
    upstream_refs: [],
    ...(result.verification_failure ? { verification_failure: true } : {}),
    ...(result.checkpoint !== undefined ? { checkpoint: result.checkpoint } : {}),
    ...(result.reason !== undefined ? { reason: result.reason } : {}),
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

function currentReviewFlowIdentities(ctx) {
  const snapshotTree = ctx.stage === "build-code" && ctx.workspace
    ? captureWorkspaceSnapshot(ctx.workspace).tree
    : null;
  return reviewFlowSubjectsForStage(ctx.stage).map((subject) => ctx.kernel.deriveReviewFlowIdentity(
    snapshotTree === null ? subject : { ...subject, snapshot_tree: snapshotTree },
  ));
}

function withReviewFlowLocks(kernel, identities, operation, index = 0) {
  if (index >= identities.length) return operation();
  return kernel.withReviewFlowLock(identities[index], () => withReviewFlowLocks(kernel, identities, operation, index + 1));
}

function officialWorkerContext(ctx, publication = {}, reviewFlowIdentities = []) {
  const trustedFlows = new Map(reviewFlowIdentities.map((identity) => [reviewSubjectKey(identity), identity]));
  const completionInvocationFacts = () => {
    const loaded = loadStageSkillManifest(RUNNER_ROOT, ctx.stage);
    const declaredComponents = [];
    const invocationFacts = [];
    for (const dependency of loaded.manifest.skills) {
      const bundleHash = declaredBundleHash(loaded.root, dependency);
      const keys = ctx.stage === "make-decision" && dependency.name === "talk-with-zhipeng"
        ? ["talk-1", "talk-2", "talk-3"]
        : [ctx.stage === "make-decision" && dependency.name === "grill-with-docs" ? "grill" : "default"];
      for (const invocationKey of keys) {
        declaredComponents.push({
          task_id: ctx.identity.taskId,
          stage: ctx.stage,
          workflow_run_id: ctx.workflowRunId,
          name: dependency.name,
          invocation_key: invocationKey,
          bundle_hash: bundleHash,
          declared_trigger: dependency.trigger,
          invocation: dependency.invocation,
        });
        const observed = ctx.kernel.readStageSkillInvocation(ctx.stage, dependency.name, invocationKey);
        if (observed) invocationFacts.push(observed.fact);
      }
    }
    return Object.freeze({
      declaredComponents: Object.freeze(declaredComponents),
      invocationFacts: Object.freeze(invocationFacts),
    });
  };
  return Object.freeze({
    stage: ctx.stage,
    identity: ctx.identity,
    workflowRunId: ctx.workflowRunId,
    readCompletionInvocationFacts: completionInvocationFacts,
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
      inspectIntegrationReviewSubject: (finalTree, current_receipts = {}) => inspectIntegrationReviewSubject({
        task: ctx.task,
        sourceRoot: ctx.workspace.worktreeRoot,
        artifacts: ctx.artifacts,
        current_receipts,
        finalTree,
      }),
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
      createCheckpoint: (name) => ctx.kernel.createCheckpoint(name),
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

/** Fixed repository-owned handler path; callers provide receipt references, never facts or code. */
export function runOfficialStage(stage, context, invocation, publication) {
  const ctx = assertContext(context, stage);
  const handler = officialStageHandler(stage);
  const input = Object.freeze(structuredClone(invocation));
  const reviewFlowIdentities = currentReviewFlowIdentities(ctx);
  return withReviewFlowLocks(ctx.kernel, reviewFlowIdentities, () =>
    runStage(
      stage,
      ctx,
      async () => verifyOfficialEvidence(ctx, await handler(officialWorkerContext(ctx, publication, reviewFlowIdentities), input)),
      publication,
    ));
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
  if (fullAuditWriter !== undefined
      && (!new Set(["make-decision", "build-plan"]).has(stage) || typeof fullAuditWriter !== "function")) {
    throw new TypeError("fullAuditWriter is an internal bounded-audit runtime capability");
  }
  return ctx.kernel.acceptAttempt(stage, attemptRef, humanConfirmationRef, {
    ...(fullAuditWriter === undefined ? {} : { full_audit_writer: fullAuditWriter }),
  });
}

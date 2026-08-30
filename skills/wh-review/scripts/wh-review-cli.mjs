#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { isAbsolute } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { ReviewProviderClient } from "./review-provider-client.mjs";
import { verifyFinal } from "./review-runner.mjs";
import { loadTrustedThirdReviewConfig, validateAllWhReviewRoutes } from "./third-review-host-config.mjs";
import { bootstrapStage, assertWorkspace } from "../../../runtime/stage/stage-context.mjs";
import { validateSchema } from "../../../runtime/review/schema-validator.mjs";
import { openTask } from "../../../runtime/task/task-handle.mjs";
import { openCurrentTaskWorkspace } from "../../../runtime/task/workspace.mjs";
import { runSimpleReview } from "./simple-review-runner.mjs";

const RUNNER_ROOT = fileURLToPath(new URL("../../../", import.meta.url));
const HOST_PATH = /(?:\/(?:Users|home|private|tmp|var|etc|opt|mnt|Volumes|root|usr|bin|sbin|dev|proc|sys|Library)\/[^\s"'`<>()[\]{}]+|[A-Za-z]:[\\/][^\s"'`<>()[\]{}]+)/g;

function safeRecoveryError(error) {
  const code = typeof error?.code === "string" && error.code !== "" ? error.code : "WORKFLOWHUB_LOCAL_ERROR";
  const message = String(error?.message ?? error).replace(HOST_PATH, "<host-path-redacted>");
  return { code, message };
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
      workspace,
    };
  }
  const workspace = assertWorkspace(context.workspace);
  return {
    taskId,
    task: context.task,
    kernel: context.kernel,
    workspace,
  };
}

function providerClient(stage = null, reviewTrack = null, reviewKind = null) {
  const thirdReview = loadTrustedThirdReviewConfig({ requestedStage: stage, requestedTrack: reviewTrack, requestedReviewKind: reviewKind });
  return { thirdReview, client: new ReviewProviderClient({ command: thirdReview.command, config: thirdReview.config }) };
}

const RETIRED_RECOVERY_FIELDS = ["previous_result_ref", "previousResultRef", "review_round", "reviewRound", "review_delta", "reviewDelta", "request_id", "requestId", "prior_attempt_refs", "priorAttemptRefs", "dispatch_sequence", "dispatchSequence"];
/** One WorkflowHub call. Provider recovery and lifecycle belong to 3rd-review. */

const REVIEW_RESULT_REF = /^quality\/reviews\/results\/[A-Za-z0-9._-]+\.json$/;
const REVIEW_ATTEMPT_REF = /^quality\/reviews\/attempts\/([A-Za-z0-9._-]+)\/attempt\.json$/;

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

export function publishStageReviewFact({ trusted, stage, reviewKind, result }) {
  // The broker result is the review fact.  Bind it to the vNext stage quality
  // predicate at the same write boundary so a direct wh-review invocation
  // cannot leave an immutable result that stage-runtime status/close cannot
  // discover.  Mini-task reviews are deliberately excluded: they have their
  // own acceptance-evidence contract and must not masquerade as verify-code.
  if (stage !== "verify-code" || reviewKind !== null) return null;
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

export async function runReviewRecovery(input, { runRound = runReviewRound, sameSourceFallback = null } = {}) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new TypeError("review recovery input is required");
  if (typeof runRound !== "function") throw new TypeError("runRound must be a function");
  if (sameSourceFallback !== null) throw new TypeError("sameSourceFallback is retired; 3rd-review owns heterologous recovery");
  const request = structuredClone(input);
  for (const field of RETIRED_RECOVERY_FIELDS) delete request[field];
  try {
    return await runRound(request);
  } catch (error) {
    const diagnostic = safeRecoveryError(error);
    const review = error?.reviewResult;
    return {
      status: "unavailable", recovery: "run_round_exception", error_code: diagnostic.code,
      error: diagnostic,
      ...(request.snapshot_tree === undefined ? {} : { snapshot_tree: request.snapshot_tree }),
      ...(request.material_id === undefined ? {} : { material_id: request.material_id }),
      ...(review?.attemptRef ? { attempt_ref: review.attemptRef } : {}),
      ...(review?.resultRef ? { result_ref: review.resultRef } : {}),
      ...(review?.reportRef ? { report_ref: review.reportRef } : {}),
    };
  }
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

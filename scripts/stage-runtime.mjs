#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  authenticateStageWriteBoundary,
  bootstrapStage,
  prepareMakeDecisionWorkspace,
} from "../core/stage-context.mjs";
import { persistWriteBoundaryPathCard } from "../runtime/evidence/write-boundary-preflight.mjs";
import { acceptStageAttempt, confirmStageAttempt, runOfficialStage } from "../core/stage-runner.mjs";
import { requiresHumanConfirmation } from "../runtime/stage/stage-acceptance-policy.mjs";
import {
  validateAcceptanceEvidence,
  writeCanonicalAuditSummary,
  writeOfficialComponentReceipt,
} from "../core/canonical-receipt-writer.mjs";
import { createStageContentEvidenceWriter } from "../core/stage-content-evidence.mjs";
import { runCapture as captureBuildCodeTests } from "../workflows/build-code/capture.mjs";
import { publishBuildCodePhaseEvidence } from "../workflows/build-code/phase-evidence.mjs";
import { runCapture as captureVerifyCodeTests } from "../workflows/verify-code/capture.mjs";
import { ArtifactDir } from "../core/artifact-dir.mjs";
import { captureExecutionSnapshot, captureGitWorktreeSnapshot } from "../runtime/task/git-worktree-snapshot.mjs";
import { dispatchStageSkill, preflightStageSkills } from "../runtime/stage/stage-skill-runtime.mjs";
import { invokeRuntimeCommand, RUNTIME_BEHAVIORS } from "../runtime/interface/runtime-facade.mjs";
import { LOCAL_RUNNER_CONTRACT, LOCAL_SKILL_BUNDLE_CONTRACT } from "../runtime/interface/runner-contract.mjs";

const DESIGN_ARTIFACTS = Object.freeze({
  "build-spec": new Set(["spec.md"]),
  "build-plan": new Set(["plan.md", "tasks.md"]),
});
const RUNNER_ROOT = fileURLToPath(new URL("../", import.meta.url));
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const SHA256 = /^[a-f0-9]{64}$/;
const GIT_OID = /^[a-f0-9]{40,64}$/;

export function normalizeAcceptanceEvidencePublication(input, snapshotTree) {
  if (!input || typeof input !== "object" || Array.isArray(input)
      || typeof input.acceptance_criterion_id !== "string"
      || !new Set(["pass", "fail"]).has(input.result)
      || !Array.isArray(input.refs)) {
    throw new TypeError("acceptance evidence input requires acceptance_criterion_id, result, refs, and optional summary");
  }
  const allowed = new Set(["acceptance_criterion_id", "result", "refs", "summary"]);
  const unknown = Object.keys(input).filter((key) => !allowed.has(key));
  if (unknown.length) {
    throw new TypeError(`acceptance evidence input has caller-forbidden or unknown field: ${unknown.join(", ")}`);
  }
  if (!GIT_OID.test(snapshotTree ?? "")) throw new TypeError("acceptance evidence runtime snapshot_tree is required");
  return validateAcceptanceEvidence({
    schema_version: "acceptance-evidence.v1",
    acceptance_criterion_id: input.acceptance_criterion_id,
    result: input.result,
    refs: input.refs,
    ...(input.summary === undefined ? {} : { summary: input.summary }),
    snapshot_tree: snapshotTree,
  });
}

function publishAcceptedDecisionLog(context, accepted) {
  if (accepted?.stage !== "make-decision") return;
  const attemptRaw = context.task.readRecord(`results/make-decision/${accepted.attempt_ref}`);
  if (sha256(attemptRaw) !== String(accepted.integrity_hash ?? "").replace(/^sha256:/, "")) {
    throw new Error("accepted make-decision attempt changed before live artifact publication");
  }
  const attempt = JSON.parse(attemptRaw);
  const ref = attempt.facts?.decision_ref;
  const expectedHash = attempt.facts?.decision_hash;
  if (typeof ref !== "string" || !SHA256.test(expectedHash ?? "")) {
    throw new Error("accepted make-decision result is missing its canonical decision binding");
  }
  const content = context.task.readRecord(ref);
  if (sha256(content) !== expectedHash) {
    throw new Error("accepted make-decision decision binding changed before live artifact publication");
  }
  const artifacts = ArtifactDir.open(context.candidateWorkspace.worktreeRoot, context.task);
  artifacts.writeAtomic("decision-log.md", content);
  if (artifacts.read("decision-log.md") !== content) {
    throw new Error("live decision-log publication did not preserve accepted canonical bytes");
  }
}

function completedStep(task, stage, workflowRunId, stepId) {
  let raw;
  try { raw = task.readRecord("journal.jsonl"); } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
  return raw.split("\n").filter(Boolean).map((line) => JSON.parse(line)).some((event) =>
    event.workflow_run_id === workflowRunId && event.stage_slug === stage
    && event.step_id === stepId && event.attempt_id === "attempt-1"
    && event.event_type === "step_exit" && event.terminal_status === "success");
}

function requireCompletedMakeDecisionStep(context, stepId) {
  const runId = context.kernel.activeStageRun("make-decision").run.workflow_run_id;
  if (!completedStep(context.task, "make-decision", runId, stepId)) {
    throw new Error(`make-decision canonical producer did not complete step ${stepId}`);
  }
}

function parseArgs(argv) {
  const [command, ...raw] = argv;
  const values = {};
  for (const item of raw) {
    const split = item.indexOf("=");
    if (!item.startsWith("--") || split < 3) throw new TypeError(`invalid argument: ${item}`);
    values[item.slice(2, split)] = item.slice(split + 1);
  }
  if (!new Set(["prepare", "start-run", "invoke-stage-skill", "publish-requirements-ledger", "publish-material-revision", "record-step-entry", "record-step-exit", "record-research", "artifact", "receipt", "capture-tests", "publish-content-evidence", "publish-phase-evidence", "publish-acceptance-evidence", "review-risk-pause", "accept-review-risk", "run", "confirm", "accept"]).has(command)) {
    throw new TypeError("usage: stage-runtime.mjs <prepare|start-run|invoke-stage-skill|...> --stage=<stage> --project=<project> --task=<task> [...]");
  }
  return { command, values };
}

export async function stageRuntimeMain(argv = process.argv.slice(2)) {
  const { command, values } = parseArgs(argv);
  if (Object.prototype.hasOwnProperty.call(values, "worktree-root") || Object.prototype.hasOwnProperty.call(values, "baseline-commit")) {
    throw new TypeError("--worktree-root/--baseline-commit are no longer supported; make-decision owns deterministic worktree preparation");
  }
  if (Object.prototype.hasOwnProperty.call(values, "runner-root")) throw new TypeError("--runner-root is forbidden; stage-runtime authenticates its own repository root");
  if (values.stage === "make-decision" && new Set(["record-step-entry", "record-step-exit"]).has(command)) {
    throw new TypeError("make-decision journal is runtime-owned; public record-step-entry/record-step-exit are forbidden");
  }
  if (!new Set(["receipt", "publish-content-evidence"]).has(command)
      && (Object.prototype.hasOwnProperty.call(values, "revision") || Object.prototype.hasOwnProperty.call(values, "recover"))) {
    throw new TypeError("--revision is only valid for receipt or trusted stage-content publication");
  }
  if (command === "publish-content-evidence" && values.recover !== undefined) throw new TypeError("--recover is only valid for receipt");
  if (command === "receipt" && (!values.component || !values.input)) throw new TypeError("receipt requires --component and --input=<payload.json>");
  if (command === "capture-tests" && (!new Set(["build-code", "verify-code"]).has(values.stage) || !values.input)) throw new TypeError("capture-tests requires --stage=build-code|verify-code --input=<test-capture.json>");
  if (command === "publish-content-evidence" && (!values.kind || !values.input)) throw new TypeError("publish-content-evidence requires --kind and --input=<payload.json>");
  if (command === "start-run" && !values.reason) throw new TypeError("start-run requires --reason");
  if (command === "invoke-stage-skill" && (!values.name || !values["invocation-key"])) {
    throw new TypeError("invoke-stage-skill requires --name and --invocation-key");
  }
  if (new Set(["publish-requirements-ledger", "record-step-entry", "record-step-exit", "record-research"]).has(command) && !values.input) throw new TypeError(`${command} requires --input`);
  if (command === "record-research" && values.stage !== "make-decision") throw new TypeError("record-research is only valid for make-decision");
  if (command === "publish-phase-evidence") {
    if (values.stage !== "build-code" || !values.input) throw new TypeError("publish-phase-evidence requires --stage=build-code --input=<phase-evidence.json>");
    const allowed = new Set(["stage", "project", "task", "input"]);
    if (Object.keys(values).some((key) => !allowed.has(key))) throw new TypeError("publish-phase-evidence accepts only --stage, --project, --task, and --input");
  }
  if (command === "publish-acceptance-evidence" && (values.stage !== "verify-code" || !values.input)) throw new TypeError("publish-acceptance-evidence requires --stage=verify-code --input=<acceptance-evidence.json>");
  if (new Set(["review-risk-pause", "accept-review-risk"]).has(command) && !values.input) {
    throw new TypeError(`${command} requires --input=<risk-input.json>`);
  }
  if (command === "artifact" && (!values.name || !values.input)) throw new TypeError("artifact requires --name=<artifact.md> --input=<content-file>");
  if (command === "receipt" && Object.prototype.hasOwnProperty.call(values, "revision") && values.revision !== "true") throw new TypeError("--revision must be --revision=true");
  if (command === "receipt" && Object.prototype.hasOwnProperty.call(values, "recover") && values.revision !== "true") throw new TypeError("--recover requires --revision=true");
  if (command === "receipt" && values.revision === "true" && !values.recover) throw new TypeError("receipt revision requires --recover=<previous-receipt-ref>");
  if (command === "run" && !values.input) throw new TypeError("run requires --input=<component-receipts.json>");
  if (command === "publish-material-revision" && !values.input) throw new TypeError("publish-material-revision requires --input=<revision-source.json>");
  let context = bootstrapStage(values.stage, {
    mode: "launcher",
    projectName: values.project,
    taskId: values.task,
    runnerRoot: RUNNER_ROOT,
  });
  const input = new Set(["publish-requirements-ledger", "publish-material-revision", "record-step-entry", "record-step-exit", "record-research", "receipt", "capture-tests", "publish-content-evidence", "publish-phase-evidence", "publish-acceptance-evidence", "review-risk-pause", "accept-review-risk", "run"]).has(command)
      && values.input !== undefined
    ? JSON.parse(readFileSync(values.input, "utf8"))
    : undefined;
  if (values.stage === "make-decision") {
    context = prepareMakeDecisionWorkspace(context);
  }
  const writeBoundary = authenticateStageWriteBoundary(context, {
    runnerRoot: RUNNER_ROOT,
    operation: command,
  });
  if (command === "prepare") {
    if (values.stage !== "make-decision") throw new TypeError("prepare is only valid for make-decision");
    return {
      worktree_root: context.candidateWorkspace.worktreeRoot,
      baseline_commit: context.candidateWorkspace.baselineCommit,
    };
  }
  if (command === "start-run") {
    const allowed = new Set(["stage", "project", "task", "reason"]);
    if (Object.keys(values).some((key) => !allowed.has(key))) throw new TypeError("start-run accepts only --stage, --project, --task, and --reason");
    const started = context.kernel.startStageRun(values.stage, { reason: values.reason });
    return started;
  }
  if (command === "invoke-stage-skill") {
    const allowed = new Set(["stage", "project", "task", "name", "invocation-key", "triggered", "reason"]);
    if (Object.keys(values).some((key) => !allowed.has(key))) {
      throw new TypeError("invoke-stage-skill accepts only identity, name, invocation-key, triggered, and reason");
    }
    const prepared = preflightStageSkills({ packageRoot: RUNNER_ROOT, stage: values.stage });
    const dependency = prepared.manifest.skills.find((item) => item.name === values.name);
    if (!dependency) throw new Error(`${values.stage}: undeclared skill ${values.name}`);
    if (values.triggered !== undefined && !new Set(["true", "false"]).has(values.triggered)) {
      throw new TypeError("invoke-stage-skill --triggered must be true or false");
    }
    const triggered = values.triggered !== "false";
    if (triggered && values.reason !== undefined) {
      throw new TypeError("invoke-stage-skill reason is forbidden when triggered=true");
    }
    if (!triggered && (typeof values.reason !== "string" || values.reason.trim() === "")) {
      throw new TypeError("invoke-stage-skill triggered=false requires a concrete reason");
    }
    if (!triggered) {
      const fact = await dispatchStageSkill({
        packageRoot: RUNNER_ROOT,
        stage: values.stage,
        name: values.name,
        invocationKey: values["invocation-key"],
        triggered: false,
        notInvokedReason: values.reason,
        kernel: context.kernel,
      });
      return { status: "trigger=false", invocation: fact };
    }
    const invocationWorkspace = context.candidateWorkspace ?? context.workspace;
    const request = {
      schema_version: "host-invocation-request.v1",
      task_id: context.task.identity.taskId,
      stage: values.stage,
      workflow_run_id: context.kernel.deriveStageWorkflowRunId(values.stage),
      name: values.name,
      invocation_key: values["invocation-key"],
      bundle_hash: prepared.payloads.get(values.name).bundle_hash,
      declared_trigger: dependency.trigger,
      snapshot_tree: captureGitWorktreeSnapshot(invocationWorkspace.worktreeRoot).tree,
    };
    process.stdout.write(`${JSON.stringify(request)}\n`);
    const responseRaw = await new Promise((resolve, reject) => {
      let body = "";
      process.stdin.setEncoding("utf8");
      process.stdin.on("data", (chunk) => { body += chunk; });
      process.stdin.on("end", () => resolve(body));
      process.stdin.on("error", reject);
    });
    const lines = responseRaw.split("\n").filter((line) => line.trim() !== "");
    if (lines.length !== 1) throw new Error("host bridge requires exactly one response after request");
    let response;
    try { response = JSON.parse(lines[0]); } catch { throw new Error("host bridge response must be one JSON line"); }
    const allowedResponse = new Set(["outcome_ref", "outcome_hash", "snapshot_tree"]);
    if (!response || typeof response !== "object" || Array.isArray(response)
        || Object.keys(response).some((key) => !allowedResponse.has(key))) {
      throw new TypeError("host response must contain only outcome_ref, outcome_hash, and snapshot_tree");
    }
    const fact = await dispatchStageSkill({
      packageRoot: RUNNER_ROOT,
      stage: values.stage,
      name: values.name,
      invocationKey: values["invocation-key"],
      kernel: context.kernel,
      hostInvoke: async () => response,
    });
    return { status: "executed", invocation: fact };
  }
  if (command === "publish-requirements-ledger") {
    const allowed = new Set(["stage", "project", "task", "input"]);
    if (Object.keys(values).some((key) => !allowed.has(key))) throw new TypeError("publish-requirements-ledger accepts only --stage, --project, --task, and --input");
    const published = context.kernel.publishRequirementsLedger(values.stage, input);
    return published;
  }
  if (command === "publish-material-revision") {
    const allowed = new Set(["stage", "project", "task", "input"]);
    if (Object.keys(values).some((key) => !allowed.has(key))) {
      throw new TypeError("publish-material-revision accepts only --stage, --project, --task, and --input");
    }
    return context.kernel.publishMaterialRevision(input);
  }
  if (command === "publish-quality-fact") {
    const allowed = new Set(["stage", "project", "task", "input"]);
    if (Object.keys(values).some((key) => !allowed.has(key))) throw new TypeError("publish-quality-fact accepts only --stage, --project, --task, and --input");
    return context.kernel.publishVNextQualityFact(values.stage, input);
  }
  if (command === "publish-publication") {
    const allowed = new Set(["stage", "project", "task", "input"]);
    if (Object.keys(values).some((key) => !allowed.has(key))) throw new TypeError("publish-publication accepts only --stage, --project, --task, and --input");
    return context.kernel.publishVNextPublication(values.stage, input);
  }
  if (command === "record-step-entry") {
    if (values.stage === "make-decision") throw new Error("make-decision journal entries are runtime-owned");
    const allowed = new Set(["stage", "project", "task", "input"]);
    if (Object.keys(values).some((key) => !allowed.has(key))) throw new TypeError("record-step-entry accepts only --stage, --project, --task, and --input");
    return context.kernel.writeStageStepEntry(values.stage, input);
  }
  if (command === "record-step-exit") {
    if (values.stage === "make-decision") throw new Error("make-decision journal exits are runtime-owned");
    const allowed = new Set(["stage", "project", "task", "input"]);
    if (Object.keys(values).some((key) => !allowed.has(key))) throw new TypeError("record-step-exit accepts only --stage, --project, --task, and --input");
    return context.kernel.writeStageStepExit(values.stage, input);
  }
  if (command === "record-research") {
    const allowed = new Set(["status", "reason", "evidence"]);
    if (!input || typeof input !== "object" || Array.isArray(input)
        || Object.keys(input).some((key) => !allowed.has(key))
        || !new Set(["performed", "skipped"]).has(input.status)
        || typeof input.reason !== "string" || input.reason.trim() === ""
        || !input.evidence || typeof input.evidence !== "object" || Array.isArray(input.evidence)
        || typeof input.evidence.kind !== "string" || input.evidence.kind.trim() === ""
        || typeof input.evidence.uri_or_path !== "string" || input.evidence.uri_or_path.trim() === ""
        || !SHA256.test(input.evidence.content_hash ?? "")) {
      throw new TypeError("record-research requires status=performed|skipped, reason, and a canonical evidence ref");
    }
    return context.kernel.completeMakeDecisionResearch(input);
  }
  if (command === "artifact") {
    if (!DESIGN_ARTIFACTS[values.stage]?.has(values.name)) throw new TypeError(`unsupported ${values.stage} artifact: ${values.name}`);
    context.artifacts.writeAtomic(values.name, readFileSync(values.input, "utf8"));
    return { artifact_ref: context.artifacts.reference(values.name) };
  }
  if (command === "publish-phase-evidence") return publishBuildCodePhaseEvidence(context, input);
  if (command === "capture-tests") {
    if (!input || typeof input !== "object" || Array.isArray(input)
      || typeof input.command !== "string"
      || typeof input.receipt_ref !== "string"
      || (input.output_ref !== undefined && typeof input.output_ref !== "string")
      || Object.keys(input).some((key) => !new Set(["command", "receipt_ref", "output_ref"]).has(key))) {
      throw new TypeError("test capture input requires command, receipt_ref, and optional output_ref only");
    }
    const capture = values.stage === "build-code" ? captureBuildCodeTests : captureVerifyCodeTests;
    return capture(input.command, input.receipt_ref, {
      task: context.task,
      workspace: context.workspace,
      ...(input.output_ref === undefined ? {} : { outputRef: input.output_ref }),
    });
  }
  if (command === "publish-acceptance-evidence") {
    // Acceptance leaves bind the same execution snapshot as test/verify facts.
    // Exclude runtime evidence written during the run; otherwise each leaf
    // publication changes the tree identity and makes the aggregate stale.
    const snapshot = captureExecutionSnapshot((context.candidateWorkspace ?? context.workspace).worktreeRoot);
    const value = normalizeAcceptanceEvidencePublication(input, snapshot.tree);
    for (const nested of value.refs) {
      const raw = context.task.readRecord(nested.ref);
      const actual = createHash("sha256").update(raw).digest("hex");
      if (actual !== nested.sha256) throw new Error(`acceptance evidence nested ref hash mismatch: ${nested.ref}`);
    }
    const raw = `${JSON.stringify(value, null, 2)}\n`;
    const sha256 = createHash("sha256").update(raw).digest("hex");
    const ref = `evidence/acceptance-${sha256}.json`;
    context.kernel.publishCanonicalRecord(ref, raw);
    return { evidence_ref: ref, evidence_hash: sha256, acceptance_criterion_id: value.acceptance_criterion_id, result: value.result };
  }
  if (command === "review-risk-pause") {
    const allowed = new Set(["review_result_ref"]);
    if (!input || typeof input !== "object" || Array.isArray(input)
        || typeof input.review_result_ref !== "string"
        || Object.keys(input).some((key) => !allowed.has(key))) {
      throw new TypeError("review-risk-pause input requires review_result_ref and optional authenticated revision ref");
    }
    return context.kernel.prepareReviewRiskPause({
      stage: values.stage,
      reviewResultRef: input.review_result_ref,
    });
  }
  if (command === "accept-review-risk") {
    const allowed = new Set([
      "review_result_ref", "finding_id", "card_ref", "card_hash", "selected_option",
      "reply_ref", "reply_hash",
    ]);
    if (!input || typeof input !== "object" || Array.isArray(input)
        || Object.keys(input).some((key) => !allowed.has(key))) {
      throw new TypeError("accept-review-risk input is invalid");
    }
    return context.kernel.acceptReviewRisk({
      stage: values.stage,
      reviewResultRef: input.review_result_ref,
      findingId: input.finding_id,
      cardRef: input.card_ref,
      cardHash: input.card_hash,
      selectedOption: input.selected_option,
      replyRef: input.reply_ref,
      replyHash: input.reply_hash,
    });
  }
  if (command === "receipt") {
    const result = writeOfficialComponentReceipt({ task: context.task, workspace: context.workspace, stage: values.stage, component: values.component, payload: input, ...(values.revision === "true" ? { revisionOf: values.recover } : {}) });
    if (values.stage === "make-decision" && values.component === "decision") {
      const raw = context.task.readRecord(result.ref);
      context.kernel.completeMakeDecisionReceipt({
        receipt_ref: result.ref,
        receipt_hash: sha256(raw),
      });
    }
    return { receipt_ref: result.ref, receipt_hash: result.sha256, revision: result.revision, ...(result.revision ? { previous_receipt_ref: result.previous_ref, previous_receipt_hash: result.previous_hash, content_hash: result.content_hash } : {}) };
  }
  if (command === "publish-content-evidence") {
    const allowed = new Set(["stage", "project", "task", "kind", "input", "revision"]);
    if (Object.keys(values).some((key) => !allowed.has(key))) throw new TypeError("publish-content-evidence accepts only --stage, --project, --task, --kind, and --input");
    const writer = createStageContentEvidenceWriter({
      task: context.task,
      workspace: context.candidateWorkspace ?? context.workspace,
      stage: values.stage,
      workflowRunId: context.kernel.deriveStageWorkflowRunId(values.stage),
    });
    const revision = values.revision === undefined ? undefined : Number(values.revision);
    const published = writer.publish({ kind: values.kind, payload: input, ...(revision === undefined ? {} : { revision }) });
    return { evidence_ref: published.ref, evidence_hash: published.hash, kind: values.kind };
  }
  if (command === "run") {
    if (!input || typeof input !== "object" || Array.isArray(input)
        || !input.receipts || typeof input.receipts !== "object" || Array.isArray(input.receipts)) {
      throw new TypeError("run input requires a receipts object");
    }
    const allowedRunFields = new Set(values.stage === "build-code" ? ["receipts", "acceptance_coverage"] : ["receipts"]);
    const unknownRunFields = Object.keys(input).filter((key) => !allowedRunFields.has(key));
    if (unknownRunFields.length) throw new TypeError(`run input has unknown fields: ${unknownRunFields.join(", ")}`);
    if (Object.prototype.hasOwnProperty.call(input?.receipts ?? {}, "audit")) throw new TypeError("run audit summary is runtime-derived and caller-forbidden");
    if (values.stage === "make-decision") {
      const reviewEvidence = (track, stepId, ref) => {
        const raw = context.task.readRecord(ref);
        const review = JSON.parse(raw);
        if (review.review_track !== track) throw new Error(`${track} review receipt does not match its track`);
        const identity = context.kernel.deriveReviewFlowIdentity({
          stage: "make-decision",
          review_track: track,
          subject_kind: review.subject_kind,
          phase_id: review.phase_id ?? null,
          review_scope: review.review_scope ?? null,
        });
        const flow = context.kernel.readReviewFlow(identity);
        const semanticHead = review.version === "wh-review-result.v1"
          && flow?.head_result_ref === ref && flow.result_sha256 === sha256(raw);
        const unavailableHead = review.version === "wh-review-attempt.v1"
          && review.terminal_status === "unavailable"
          && flow?.event_kind === "provider_attempt"
          && flow.action_ref === ref && flow.action_sha256 === sha256(raw);
        if (!semanticHead && !unavailableHead) {
          throw new Error(`${track} review receipt is not the current authenticated review-flow head`);
        }
        requireCompletedMakeDecisionStep(context, stepId);
      };
      reviewEvidence("direction", 6, input.receipts.direction_review);
      reviewEvidence("detail", 10, input.receipts.detail_review);
    }
    let audit;
    try {
      audit = writeCanonicalAuditSummary({
        task: context.task,
        workspace: context.candidateWorkspace ?? context.workspace,
        stage: values.stage,
        ...(values.stage === "make-decision" && input.receipts.decision_revision
          ? { decisionRef: input.receipts.decision_revision }
          : {}),
        ...(values.stage === "make-decision"
          ? { throughStepId: 10 }
          : values.stage === "build-spec" ? { throughStepId: 5 }
            : values.stage === "build-plan" ? { throughStepId: 6 } : {}),
      });
    } catch (error) {
      if (!new Set(["build-spec", "build-plan", "build-code"]).has(values.stage)) throw error;
    }
    const controlledInput = {
      ...input,
      receipts: {
        ...input.receipts,
        // Build/verify audit summaries are diagnostic only. Do not inject
        // them into the stage input: a generated summary can become stale as
        // the run publishes receipts, and audit drift must never block the
        // current implementation or verification result.
        ...(audit && !new Set(["build-code", "verify-code"]).has(values.stage)
          ? { audit: audit.audit_summary_ref }
          : {}),
      },
    };
    const attempt = await runOfficialStage(values.stage, context, controlledInput);
    if (requiresHumanConfirmation(values.stage)) return attempt;
    let buildSpecFullAudit;
    if (values.stage === "build-spec") {
      const attemptRaw = context.task.readRecord(`results/build-spec/${attempt.attempt_ref}`);
      context.kernel.completeBuildSpecResultPublication({
        attempt_ref: attempt.attempt_ref,
        attempt_hash: sha256(attemptRaw),
      });
      try {
        buildSpecFullAudit = context.kernel.readBuildSpecCompletionAudit(
          attempt.attempt_ref,
          sha256(attemptRaw),
        );
      } catch (error) {
        if (error?.code !== "ENOENT") throw error;
        try {
          const finalAudit = writeCanonicalAuditSummary({
            task: context.task,
            workspace: context.workspace,
            stage: "build-spec",
            throughStepId: 6,
          });
          buildSpecFullAudit = {
            status: "recorded",
            ref: finalAudit.audit_summary_ref,
            hash: finalAudit.audit_record_hash,
          };
        } catch (auditError) {
          buildSpecFullAudit = { status: "unavailable", reason: auditError.message };
        }
        buildSpecFullAudit = context.kernel.publishBuildSpecCompletionAudit({
          attempt_ref: attempt.attempt_ref,
          attempt_hash: sha256(attemptRaw),
          audit: buildSpecFullAudit,
        });
      }
    }
    const accepted = acceptStageAttempt(values.stage, context, { attemptRef: attempt.attempt_ref });
    const acceptedSourceRef = `results/${values.stage}/accepted.json`;
    const acceptedSourceRaw = context.task.readRecord(acceptedSourceRef);
    persistWriteBoundaryPathCard({
      task: context.task,
      boundary: writeBoundary,
      source: { ref: acceptedSourceRef, hash: createHash("sha256").update(acceptedSourceRaw).digest("hex") },
    });
    return {
      ...attempt,
      accepted,
      ...(buildSpecFullAudit === undefined ? {} : { completion_audit: buildSpecFullAudit }),
    };
  }
  if (command === "confirm") {
    return confirmStageAttempt(values.stage, context, { attemptRef: values.attempt, decision: values.decision });
  }
  const acceptedResult = acceptStageAttempt(values.stage, context, {
    attemptRef: values.attempt,
    humanConfirmationRef: values["human-confirmation-ref"],
    ...(!new Set(["make-decision", "build-plan"]).has(values.stage) ? {} : {
      fullAuditWriter: () => {
        if (values.stage === "build-plan") {
          const audit = writeCanonicalAuditSummary({
            task: context.task,
            workspace: context.workspace,
            stage: "build-plan",
            throughStepId: 8,
          });
          return {
            ref: audit.audit_summary_ref,
            hash: audit.audit_record_hash,
            summary_hash: audit.audit_summary_hash,
          };
        }
        const attemptRaw = context.task.readRecord(`results/make-decision/${values.attempt}`);
        const attempt = JSON.parse(attemptRaw);
        const decisionRevisionRef = attempt.evidence_refs?.find((entry) =>
          typeof entry?.ref === "string" && entry.ref.startsWith("receipts/revisions/decision/"))?.ref;
        const audit = writeCanonicalAuditSummary({
          task: context.task,
          workspace: context.candidateWorkspace,
          stage: "make-decision",
          ...(decisionRevisionRef ? { decisionRef: decisionRevisionRef } : {}),
          throughStepId: 12,
        });
        return {
          ref: audit.audit_summary_ref,
          hash: audit.audit_record_hash,
          summary_hash: audit.audit_summary_hash,
        };
      },
    }),
  });
  publishAcceptedDecisionLog(context, acceptedResult);
  const acceptedSourceRef = `results/${values.stage}/accepted.json`;
  const acceptedSourceRaw = context.task.readRecord(acceptedSourceRef);
  persistWriteBoundaryPathCard({
    task: context.task,
    boundary: writeBoundary,
    source: { ref: acceptedSourceRef, hash: createHash("sha256").update(acceptedSourceRaw).digest("hex") },
  });
  return acceptedResult;
}

export async function stageRuntimeCliMain(argv = process.argv.slice(2), {
  delegate = stageRuntimeMain,
  skillBundleContract = LOCAL_SKILL_BUNDLE_CONTRACT,
  runnerContract = LOCAL_RUNNER_CONTRACT,
} = {}) {
  const [behavior, ...raw] = argv;
  if (behavior === "--help" || behavior === "help") {
    return {
      behaviors: ["doctor", "status", "run", "review", "verify", "confirm", "authorize"],
      actions: {
        doctor: ["workspace"],
        status: ["begin", "repair"],
        run: ["execute", "scope", "research", "draft", "record", "content", "material-revision"],
        review: ["invoke", "risk"],
        verify: ["tests", "phase", "criterion"],
        confirm: ["decision"],
        authorize: ["decision", "risk"],
      },
    };
  }
  if (!RUNTIME_BEHAVIORS.includes(behavior)) throw new Error("unknown public runtime behavior");
  const actionArgument = raw.find((item) => item.startsWith("--action="));
  if (!actionArgument) throw new TypeError("public runtime behavior requires --action=<high-level-action>");
  const action = actionArgument.slice("--action=".length);
  const publicRoute = `${behavior}:${action}`;
  const internalOperation = ({
    "doctor:workspace": "prepare",
    "status:begin": "start-run",
    "run:execute": "run",
    "run:scope": "publish-requirements-ledger",
    "run:research": "record-research",
    "run:draft": "artifact",
    "run:record": "receipt",
    "run:content": "publish-content-evidence",
    "run:material-revision": "publish-material-revision",
    "review:invoke": "invoke-stage-skill",
    "review:risk": "review-risk-pause",
    "verify:tests": "capture-tests",
    "verify:phase": "publish-phase-evidence",
    "verify:criterion": "publish-acceptance-evidence",
    "confirm:decision": "confirm",
    "authorize:decision": "accept",
    "authorize:risk": "accept-review-risk",
  })[publicRoute];
  if (!internalOperation) throw new Error("unknown public runtime action");
  const delegatedArgv = [
    internalOperation,
    ...raw.filter((item) => item !== actionArgument),
  ];
  return invokeRuntimeCommand(
    behavior,
    Object.freeze({ action, argv: delegatedArgv }),
    ({ argv: internalArgv }) => delegate(internalArgv),
    { skillBundleContract, runnerContract },
    internalOperation,
  );
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  stageRuntimeCliMain().then((result) => {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  }).catch((error) => {
    process.stderr.write(`${error?.stack ?? error}\n`);
    process.exitCode = 1;
  });
}

#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  bootstrapStage,
  prepareMakeDecisionWorkspace,
  validateMakeDecisionWorkspaceAttempt,
} from "../core/stage-context.mjs";
import { acceptStageAttempt, confirmStageAttempt, publishOfficialVerifyPassing, runOfficialStage } from "../core/stage-runner.mjs";
import { requiresHumanConfirmation } from "../core/stage-acceptance-policy.mjs";
import {
  validateAcceptanceEvidence,
  writeCanonicalAuditSummary,
  writeOfficialComponentReceipt,
} from "../core/canonical-receipt-writer.mjs";
import { createStageContentEvidenceWriter } from "../core/stage-content-evidence.mjs";
import { runCapture as captureBuildCodeTests } from "../workflows/build-code/capture.mjs";
import { publishBuildCodePhaseEvidence } from "../workflows/build-code/phase-evidence.mjs";
import { runCapture as captureVerifyCodeTests } from "../workflows/verify-code/capture.mjs";
import { publishPhaseTraceLineage, supersedePhaseTraceLineage } from "./task-recovery.mjs";

const DESIGN_ARTIFACTS = Object.freeze({
  "build-spec": new Set(["spec.md"]),
  "build-plan": new Set(["plan.md", "tasks.md"]),
});
const RUNNER_ROOT = fileURLToPath(new URL("../", import.meta.url));

function parseArgs(argv) {
  const [command, ...raw] = argv;
  const values = {};
  for (const item of raw) {
    const split = item.indexOf("=");
    if (!item.startsWith("--") || split < 3) throw new TypeError(`invalid argument: ${item}`);
    values[item.slice(2, split)] = item.slice(split + 1);
  }
  if (!new Set(["prepare", "continue-stage", "start-run", "publish-requirements-ledger", "record-step-entry", "record-step-exit", "rebind", "artifact", "receipt", "capture-tests", "publish-content-evidence", "publish-phase-evidence", "publish-phase-trace-lineage", "supersede-phase-trace-lineage", "publish-acceptance-evidence", "review-risk-pause", "accept-review-risk", "run", "confirm", "accept", "reopen", "publish-verify-failure", "publish-verify-passing"]).has(command)) {
    throw new TypeError("usage: stage-runtime.mjs <prepare|continue-stage|start-run|publish-requirements-ledger|record-step-entry|record-step-exit|rebind|artifact|receipt|capture-tests|publish-content-evidence|publish-phase-evidence|publish-phase-trace-lineage|supersede-phase-trace-lineage|publish-acceptance-evidence|review-risk-pause|accept-review-risk|run|confirm|accept|reopen|publish-verify-failure|publish-verify-passing> --stage=<stage> --project=<project> --task=<task> [...]");
  }
  return { command, values };
}

export async function stageRuntimeMain(argv = process.argv.slice(2)) {
  const { command, values } = parseArgs(argv);
  if (Object.prototype.hasOwnProperty.call(values, "worktree-root") || Object.prototype.hasOwnProperty.call(values, "baseline-commit")) {
    throw new TypeError("--worktree-root/--baseline-commit are no longer supported; make-decision owns deterministic worktree preparation");
  }
  if (Object.prototype.hasOwnProperty.call(values, "runner-root")) throw new TypeError("--runner-root is forbidden; stage-runtime authenticates its own repository root");
  if (!new Set(["receipt", "publish-content-evidence"]).has(command)
      && (Object.prototype.hasOwnProperty.call(values, "revision") || Object.prototype.hasOwnProperty.call(values, "recover"))) {
    throw new TypeError("--revision is only valid for receipt or trusted stage-content publication");
  }
  if (command === "publish-content-evidence" && values.recover !== undefined) throw new TypeError("--recover is only valid for receipt");
  if (command === "receipt" && (!values.component || !values.input)) throw new TypeError("receipt requires --component and --input=<payload.json>");
  if (command === "capture-tests" && (!new Set(["build-code", "verify-code"]).has(values.stage) || !values.input)) throw new TypeError("capture-tests requires --stage=build-code|verify-code --input=<test-capture.json>");
  if (command === "publish-content-evidence" && (!values.kind || !values.input)) throw new TypeError("publish-content-evidence requires --kind and --input=<payload.json>");
  if (command === "start-run" && !values.reason) throw new TypeError("start-run requires --reason");
  if (command === "continue-stage" && !values.input) throw new TypeError("continue-stage requires --input=<continuation.json>");
  if (new Set(["publish-requirements-ledger", "record-step-entry", "record-step-exit"]).has(command) && !values.input) throw new TypeError(`${command} requires --input`);
  if (command === "publish-phase-evidence") {
    if (values.stage !== "build-code" || !values.input) throw new TypeError("publish-phase-evidence requires --stage=build-code --input=<phase-evidence.json>");
    const allowed = new Set(["stage", "project", "task", "input"]);
    if (Object.keys(values).some((key) => !allowed.has(key))) throw new TypeError("publish-phase-evidence accepts only --stage, --project, --task, and --input");
  }
  if (command === "publish-phase-trace-lineage") {
    if (values.stage !== "build-code" || !values.input) throw new TypeError("publish-phase-trace-lineage requires --stage=build-code --input=<phase-trace-lineage.json>");
    const allowed = new Set(["stage", "project", "task", "input"]);
    if (Object.keys(values).some((key) => !allowed.has(key))) throw new TypeError("publish-phase-trace-lineage accepts only --stage, --project, --task, and --input");
  }
  if (command === "supersede-phase-trace-lineage") {
    if (values.stage !== "build-code" || !values.input) throw new TypeError("supersede-phase-trace-lineage requires --stage=build-code --input=<lineage-supersession.json>");
    const allowed = new Set(["stage", "project", "task", "input"]);
    if (Object.keys(values).some((key) => !allowed.has(key))) throw new TypeError("supersede-phase-trace-lineage accepts only --stage, --project, --task, and --input");
  }
  if (command === "publish-acceptance-evidence" && (values.stage !== "verify-code" || !values.input)) throw new TypeError("publish-acceptance-evidence requires --stage=verify-code --input=<acceptance-evidence.json>");
  if (new Set(["review-risk-pause", "accept-review-risk"]).has(command) && !values.input) {
    throw new TypeError(`${command} requires --input=<risk-input.json>`);
  }
  if (command === "artifact" && (!values.name || !values.input)) throw new TypeError("artifact requires --name=<artifact.md> --input=<content-file>");
  if (command === "reopen" && (values.stage !== "build-code" || !values["verify-attempt"] || !values["failure-evidence"])) throw new TypeError("reopen requires --stage=build-code --verify-attempt=<attempt-0001.json> --failure-evidence=<evidence/ref.json>");
  if (command === "publish-verify-failure" && (values.stage !== "verify-code" || !values["failure-evidence"])) throw new TypeError("publish-verify-failure requires --stage=verify-code --failure-evidence=<evidence/ref.json>");
  if (command === "publish-verify-passing" && (values.stage !== "verify-code" || !values.input)) throw new TypeError("publish-verify-passing requires --stage=verify-code --input=<component-receipts.json>");
  if (Object.prototype.hasOwnProperty.call(values, "reopen") && (command !== "run" || values.stage !== "build-code")) throw new TypeError("--reopen is only valid for build-code run");
  if (Object.prototype.hasOwnProperty.call(values, "baseline-rebind") && (command !== "run" || values.stage !== "build-plan")) throw new TypeError("--baseline-rebind is only valid for build-plan run");
  if (command === "rebind" && values.stage !== "build-plan") throw new TypeError("rebind is only valid for build-plan");
  if (command === "receipt" && Object.prototype.hasOwnProperty.call(values, "revision") && values.revision !== "true") throw new TypeError("--revision must be --revision=true");
  if (Object.prototype.hasOwnProperty.call(values, "recover") && values.revision !== "true") throw new TypeError("--recover requires --revision=true");
  if (command === "receipt" && values.revision === "true" && !values.recover) throw new TypeError("receipt revision requires --recover=<previous-receipt-ref>");
  if (command === "run" && !values.input) throw new TypeError("run requires --input=<component-receipts.json>");
  let context = bootstrapStage(values.stage, {
    mode: "launcher",
    projectName: values.project,
    taskId: values.task,
    runnerRoot: RUNNER_ROOT,
  });
  const input = new Set(["continue-stage", "publish-requirements-ledger", "record-step-entry", "record-step-exit", "receipt", "capture-tests", "publish-content-evidence", "publish-phase-evidence", "publish-phase-trace-lineage", "supersede-phase-trace-lineage", "publish-acceptance-evidence", "review-risk-pause", "accept-review-risk", "run", "publish-verify-passing"]).has(command)
    ? JSON.parse(readFileSync(values.input, "utf8"))
    : undefined;
  if (command === "prepare") {
    if (values.stage !== "make-decision") throw new TypeError("prepare is only valid for make-decision");
    context = prepareMakeDecisionWorkspace(context);
    return {
      worktree_root: context.candidateWorkspace.worktreeRoot,
      baseline_commit: context.candidateWorkspace.baselineCommit,
    };
  }
  if (command === "start-run") {
    const allowed = new Set(["stage", "project", "task", "reason", "continuation-ref"]);
    if (Object.keys(values).some((key) => !allowed.has(key))) throw new TypeError("start-run accepts only --stage, --project, --task, and --reason");
    return context.kernel.startStageRun(values.stage, {
      reason: values.reason,
      ...(values["continuation-ref"] ? { continuation_ref: values["continuation-ref"] } : {}),
    });
  }
  if (command === "continue-stage") {
    const allowed = new Set(["stage", "project", "task", "input"]);
    if (Object.keys(values).some((key) => !allowed.has(key))) throw new TypeError("continue-stage accepts only --stage, --project, --task, and --input");
    return context.kernel.createStageContinuation(values.stage, input);
  }
  if (command === "publish-requirements-ledger") {
    const allowed = new Set(["stage", "project", "task", "input"]);
    if (Object.keys(values).some((key) => !allowed.has(key))) throw new TypeError("publish-requirements-ledger accepts only --stage, --project, --task, and --input");
    return context.kernel.publishRequirementsLedger(values.stage, input);
  }
  if (command === "record-step-entry") {
    const allowed = new Set(["stage", "project", "task", "input"]);
    if (Object.keys(values).some((key) => !allowed.has(key))) throw new TypeError("record-step-entry accepts only --stage, --project, --task, and --input");
    return context.kernel.writeStageStepEntry(values.stage, input);
  }
  if (command === "record-step-exit") {
    const allowed = new Set(["stage", "project", "task", "input"]);
    if (Object.keys(values).some((key) => !allowed.has(key))) throw new TypeError("record-step-exit accepts only --stage, --project, --task, and --input");
    return context.kernel.writeStageStepExit(values.stage, input);
  }
  if (command === "rebind") return context.kernel.authorizeBuildPlanBaselineRebind();
  if (command === "artifact") {
    if (!DESIGN_ARTIFACTS[values.stage]?.has(values.name)) throw new TypeError(`unsupported ${values.stage} artifact: ${values.name}`);
    context.artifacts.writeAtomic(values.name, readFileSync(values.input, "utf8"));
    return { artifact_ref: context.artifacts.reference(values.name) };
  }
  if (command === "reopen") return context.kernel.reopenBuildCode({ verifyAttemptRef: values["verify-attempt"], failureEvidenceRef: values["failure-evidence"] });
  if (command === "publish-verify-failure") return context.kernel.publishVerifyFailureFromAccepted({ failureEvidenceRef: values["failure-evidence"] });
  if (command === "publish-verify-passing") {
    if (Object.prototype.hasOwnProperty.call(input?.receipts ?? {}, "audit")) throw new TypeError("verify passing audit summary is runtime-derived and caller-forbidden");
    const audit = writeCanonicalAuditSummary({ task: context.task, workspace: context.workspace, stage: "verify-code" });
    return publishOfficialVerifyPassing(context, {
      ...input,
      receipts: { ...input.receipts, audit: audit.audit_summary_ref },
    });
  }
  if (command === "publish-phase-evidence") return publishBuildCodePhaseEvidence(context, input);
  if (command === "publish-phase-trace-lineage") return publishPhaseTraceLineage(context, input);
  if (command === "supersede-phase-trace-lineage") return supersedePhaseTraceLineage(context, input);
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
    if (!input || typeof input !== "object" || Array.isArray(input)
      || typeof input.acceptance_criterion_id !== "string"
      || !new Set(["pass", "fail"]).has(input.result)
      || !Array.isArray(input.refs)
      || Object.keys(input).some((key) => !new Set(["acceptance_criterion_id", "result", "refs"]).has(key))) {
      throw new TypeError("acceptance evidence input requires acceptance_criterion_id, result, and refs only");
    }
    const value = validateAcceptanceEvidence({
      schema_version: "acceptance-evidence.v1",
      acceptance_criterion_id: input.acceptance_criterion_id,
      result: input.result,
      refs: input.refs,
    });
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
    const allowed = new Set(["review_result_ref", "revision_ref", "adjudication_correction_ref"]);
    if (!input || typeof input !== "object" || Array.isArray(input)
        || typeof input.review_result_ref !== "string"
        || Object.keys(input).some((key) => !allowed.has(key))) {
      throw new TypeError("review-risk-pause input requires review_result_ref and optional authenticated revision ref");
    }
    return context.kernel.prepareReviewRiskPause({
      stage: values.stage,
      reviewResultRef: input.review_result_ref,
      ...(input.revision_ref === undefined ? {} : { revisionRef: input.revision_ref }),
      ...(input.adjudication_correction_ref === undefined ? {} : { adjudicationCorrectionRef: input.adjudication_correction_ref }),
    });
  }
  if (command === "accept-review-risk") {
    const allowed = new Set([
      "review_result_ref", "finding_id", "card_ref", "card_hash", "selected_option",
      "reply_ref", "reply_hash", "revision_ref", "adjudication_correction_ref",
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
      ...(input.revision_ref === undefined ? {} : { revisionRef: input.revision_ref }),
      ...(input.adjudication_correction_ref === undefined ? {} : { adjudicationCorrectionRef: input.adjudication_correction_ref }),
    });
  }
  if (values.stage === "make-decision" && new Set(["run", "publish-content-evidence"]).has(command)) context = prepareMakeDecisionWorkspace(context);
  if (values.stage === "make-decision" && command === "accept") context = validateMakeDecisionWorkspaceAttempt(context, values.attempt);
  if (command === "receipt") {
    const result = writeOfficialComponentReceipt({ task: context.task, workspace: context.workspace, stage: values.stage, component: values.component, payload: input, ...(values.revision === "true" ? { revisionOf: values.recover } : {}) });
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
    const audit = writeCanonicalAuditSummary({
      task: context.task,
      workspace: context.candidateWorkspace ?? context.workspace,
      stage: values.stage,
    });
    const controlledInput = { ...input, receipts: { ...input.receipts, audit: audit.audit_summary_ref } };
    const attempt = await runOfficialStage(values.stage, context, controlledInput, {
      ...(values.reopen ? { reopenProvenance: context.kernel.buildCodeReopenProvenance(values.reopen) } : {}),
      ...(values["baseline-rebind"] ? { baselineRebindRef: values["baseline-rebind"] } : {}),
    });
    if (requiresHumanConfirmation(values.stage)) return attempt;
    const accepted = acceptStageAttempt(values.stage, context, { attemptRef: attempt.attempt_ref });
    return { ...attempt, accepted };
  }
  if (command === "confirm") return confirmStageAttempt(values.stage, context, { attemptRef: values.attempt, decision: values.decision });
  return acceptStageAttempt(values.stage, context, {
    attemptRef: values.attempt,
    humanConfirmationRef: values["human-confirmation-ref"],
  });
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  stageRuntimeMain().then((result) => {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  }).catch((error) => {
    process.stderr.write(`${error?.stack ?? error}\n`);
    process.exitCode = 1;
  });
}

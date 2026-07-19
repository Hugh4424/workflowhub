#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

import {
  bootstrapStage,
  prepareMakeDecisionWorkspace,
  validateMakeDecisionWorkspaceAttempt,
} from "../core/stage-context.mjs";
import { acceptStageAttempt, confirmStageAttempt, publishOfficialVerifyPassing, runOfficialStage } from "../core/stage-runner.mjs";
import { requiresHumanConfirmation } from "../core/stage-acceptance-policy.mjs";
import { writeOfficialComponentReceipt } from "../core/canonical-receipt-writer.mjs";
import { runCapture as captureBuildCodeTests } from "../workflows/build-code/capture.mjs";

const DESIGN_ARTIFACTS = Object.freeze({
  "build-spec": new Set(["spec.md"]),
  "build-plan": new Set(["plan.md", "tasks.md"]),
});

function parseArgs(argv) {
  const [command, ...raw] = argv;
  const values = {};
  for (const item of raw) {
    const split = item.indexOf("=");
    if (!item.startsWith("--") || split < 3) throw new TypeError(`invalid argument: ${item}`);
    values[item.slice(2, split)] = item.slice(split + 1);
  }
  if (!new Set(["prepare", "artifact", "receipt", "capture-tests", "run", "confirm", "accept", "reopen", "publish-verify-failure", "publish-verify-passing"]).has(command)) {
    throw new TypeError("usage: stage-runtime.mjs <prepare|artifact|receipt|capture-tests|run|confirm|accept|reopen|publish-verify-failure|publish-verify-passing> --stage=<stage> --project=<project> --task=<task> [...]");
  }
  return { command, values };
}

export async function stageRuntimeMain(argv = process.argv.slice(2)) {
  const { command, values } = parseArgs(argv);
  if (Object.prototype.hasOwnProperty.call(values, "worktree-root") || Object.prototype.hasOwnProperty.call(values, "baseline-commit")) {
    throw new TypeError("--worktree-root/--baseline-commit are no longer supported; make-decision owns deterministic worktree preparation");
  }
  if (command !== "receipt" && (Object.prototype.hasOwnProperty.call(values, "revision") || Object.prototype.hasOwnProperty.call(values, "recover"))) throw new TypeError("--revision/--recover are only valid for receipt");
  if (command === "receipt" && (!values.component || !values.input)) throw new TypeError("receipt requires --component and --input=<payload.json>");
  if (command === "capture-tests" && (values.stage !== "build-code" || !values.input)) throw new TypeError("capture-tests requires --stage=build-code --input=<test-capture.json>");
  if (command === "artifact" && (!values.name || !values.input)) throw new TypeError("artifact requires --name=<artifact.md> --input=<content-file>");
  if (command === "reopen" && (values.stage !== "build-code" || !values["verify-attempt"] || !values["failure-evidence"])) throw new TypeError("reopen requires --stage=build-code --verify-attempt=<attempt-0001.json> --failure-evidence=<evidence/ref.json>");
  if (command === "publish-verify-failure" && (values.stage !== "verify-code" || !values["failure-evidence"])) throw new TypeError("publish-verify-failure requires --stage=verify-code --failure-evidence=<evidence/ref.json>");
  if (command === "publish-verify-passing" && (values.stage !== "verify-code" || !values.input)) throw new TypeError("publish-verify-passing requires --stage=verify-code --input=<component-receipts.json>");
  if (Object.prototype.hasOwnProperty.call(values, "reopen") && (command !== "run" || values.stage !== "build-code")) throw new TypeError("--reopen is only valid for build-code run");
  if (Object.prototype.hasOwnProperty.call(values, "revision") && values.revision !== "true") throw new TypeError("--revision must be --revision=true");
  if (Object.prototype.hasOwnProperty.call(values, "recover") && values.revision !== "true") throw new TypeError("--recover requires --revision=true");
  if (command === "receipt" && values.revision === "true" && !values.recover) throw new TypeError("receipt revision requires --recover=<previous-receipt-ref>");
  if (command === "run" && !values.input) throw new TypeError("run requires --input=<component-receipts.json>");
  let context = bootstrapStage(values.stage, {
    mode: "launcher",
    projectName: values.project,
    taskId: values.task,
    runnerRoot: values["runner-root"],
  });
  const input = new Set(["receipt", "capture-tests", "run", "publish-verify-passing"]).has(command)
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
  if (command === "artifact") {
    if (!DESIGN_ARTIFACTS[values.stage]?.has(values.name)) throw new TypeError(`unsupported ${values.stage} artifact: ${values.name}`);
    context.artifacts.writeAtomic(values.name, readFileSync(values.input, "utf8"));
    return { artifact_ref: context.artifacts.reference(values.name) };
  }
  if (command === "reopen") return context.kernel.reopenBuildCode({ verifyAttemptRef: values["verify-attempt"], failureEvidenceRef: values["failure-evidence"] });
  if (command === "publish-verify-failure") return context.kernel.publishVerifyFailureFromAccepted({ failureEvidenceRef: values["failure-evidence"] });
  if (command === "publish-verify-passing") return publishOfficialVerifyPassing(context, input);
  if (command === "capture-tests") {
    if (!input || typeof input !== "object" || Array.isArray(input)
      || typeof input.command !== "string"
      || typeof input.receipt_ref !== "string"
      || (input.output_ref !== undefined && typeof input.output_ref !== "string")
      || Object.keys(input).some((key) => !new Set(["command", "receipt_ref", "output_ref"]).has(key))) {
      throw new TypeError("test capture input requires command, receipt_ref, and optional output_ref only");
    }
    return captureBuildCodeTests(input.command, input.receipt_ref, {
      task: context.task,
      workspace: context.workspace,
      ...(input.output_ref === undefined ? {} : { outputRef: input.output_ref }),
    });
  }
  if (values.stage === "make-decision" && command === "run") context = prepareMakeDecisionWorkspace(context);
  if (values.stage === "make-decision" && command === "accept") context = validateMakeDecisionWorkspaceAttempt(context, values.attempt);
  if (command === "receipt") {
    const result = writeOfficialComponentReceipt({ task: context.task, workspace: context.workspace, stage: values.stage, component: values.component, payload: input, ...(values.revision === "true" ? { revisionOf: values.recover } : {}) });
    return { receipt_ref: result.ref, receipt_hash: result.sha256, revision: result.revision, ...(result.revision ? { previous_receipt_ref: result.previous_ref, previous_receipt_hash: result.previous_hash, content_hash: result.content_hash } : {}) };
  }
  if (command === "run") {
    const attempt = await runOfficialStage(values.stage, context, input, values.reopen ? { reopenProvenance: context.kernel.buildCodeReopenProvenance(values.reopen) } : undefined);
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

#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

import {
  bootstrapStage,
  prepareMakeDecisionWorkspace,
  validateMakeDecisionWorkspaceAttempt,
} from "../core/stage-context.mjs";
import { acceptStageAttempt, confirmStageAttempt, runOfficialStage } from "../core/stage-runner.mjs";
import { writeOfficialComponentReceipt } from "../core/canonical-receipt-writer.mjs";

function parseArgs(argv) {
  const [command, ...raw] = argv;
  const values = {};
  for (const item of raw) {
    const split = item.indexOf("=");
    if (!item.startsWith("--") || split < 3) throw new TypeError(`invalid argument: ${item}`);
    values[item.slice(2, split)] = item.slice(split + 1);
  }
  if (!new Set(["receipt", "run", "confirm", "accept"]).has(command)) {
    throw new TypeError("usage: stage-runtime.mjs <receipt|run|confirm|accept> --stage=<stage> --project=<project> --task=<task> [...]");
  }
  return { command, values };
}

export async function stageRuntimeMain(argv = process.argv.slice(2)) {
  const { command, values } = parseArgs(argv);
  if (Object.prototype.hasOwnProperty.call(values, "worktree-root") || Object.prototype.hasOwnProperty.call(values, "baseline-commit")) {
    throw new TypeError("--worktree-root/--baseline-commit are no longer supported; make-decision owns deterministic worktree preparation");
  }
  if (command === "receipt" && (!values.component || !values.input)) throw new TypeError("receipt requires --component and --input=<payload.json>");
  if (command === "run" && !values.input) throw new TypeError("run requires --input=<component-receipts.json>");
  let context = bootstrapStage(values.stage, {
    mode: "launcher",
    projectName: values.project,
    taskId: values.task,
  });
  const input = new Set(["receipt", "run"]).has(command)
    ? JSON.parse(readFileSync(values.input, "utf8"))
    : undefined;
  if (values.stage === "make-decision" && command === "run") context = prepareMakeDecisionWorkspace(context);
  if (values.stage === "make-decision" && command === "accept") context = validateMakeDecisionWorkspaceAttempt(context, values.attempt);
  if (command === "receipt") {
    const result = writeOfficialComponentReceipt({ task: context.task, workspace: context.workspace, stage: values.stage, component: values.component, payload: input });
    return { receipt_ref: result.ref, receipt_hash: result.sha256 };
  }
  if (command === "run") {
    return runOfficialStage(values.stage, context, input);
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

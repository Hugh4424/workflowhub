#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

import { bootstrapStage } from "../core/stage-context.mjs";
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

function declareCandidateWorkspace(values) {
  if (values.stage !== "make-decision") return undefined;
  return { worktreeRoot: values["worktree-root"], baselineCommit: values["baseline-commit"] };
}

export async function stageRuntimeMain(argv = process.argv.slice(2)) {
  const { command, values } = parseArgs(argv);
  const candidateWorkspace = command === "receipt" ? undefined : declareCandidateWorkspace(values);
  const context = bootstrapStage(values.stage, {
    mode: "launcher",
    projectName: values.project,
    taskId: values.task,
    ...(candidateWorkspace ? { candidateWorkspace } : {}),
  });
  if (command === "receipt") {
    if (!values.component || !values.input) throw new TypeError("receipt requires --component and --input=<payload.json>");
    const result = writeOfficialComponentReceipt({ task: context.task, workspace: context.workspace, stage: values.stage, component: values.component, payload: JSON.parse(readFileSync(values.input, "utf8")) });
    return { receipt_ref: result.ref, receipt_hash: result.sha256 };
  }
  if (command === "run") {
    if (!values.input) throw new TypeError("run requires --input=<component-receipts.json>");
    return runOfficialStage(values.stage, context, JSON.parse(readFileSync(values.input, "utf8")));
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

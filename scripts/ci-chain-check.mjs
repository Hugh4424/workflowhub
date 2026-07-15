#!/usr/bin/env node

import { openTask } from "../core/task-handle.mjs";
import { createTaskKernel } from "../core/task-kernel.mjs";

const values = Object.fromEntries(process.argv.slice(2).map((arg) => {
  const index = arg.indexOf("=");
  return index < 0 ? [arg, true] : [arg.slice(0, index), arg.slice(index + 1)];
}));
const leafPath = values["--task-path"];
const project = values["--project"];
const taskId = values["--task"];
if (!(leafPath && project && taskId)) {
  console.error("Usage: node scripts/ci-chain-check.mjs --task-path=<absolute-leaf> --project=<name> --task=<id>");
  process.exit(2);
}

try {
  const task = openTask(leafPath, project, taskId);
  const kernel = createTaskKernel(task);
  const stages = ["make-decision", "build-spec", "build-plan", "build-code", "verify-code"];
  const accepted = stages.map((stage) => kernel.readAccepted(stage));
  for (let index = 1; index < accepted.length; index += 1) {
    if (accepted[index].attempt.created_at < accepted[index - 1].attempt.created_at) {
      throw new Error(`${stages[index]} predates ${stages[index - 1]}`);
    }
  }
  console.log("[ci-chain-check] PASS: accepted stage chain is complete and integrity-verified");
} catch (error) {
  console.error(`[ci-chain-check] FAIL: ${error.message}`);
  process.exit(1);
}

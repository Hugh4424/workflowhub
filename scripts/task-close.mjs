#!/usr/bin/env node

import { openTask } from "../core/task-handle.mjs";
import { createTaskKernel } from "../core/task-kernel.mjs";
import {
  closePlanHash,
  completeDeliveryClosePlan,
  confirmClosePlan,
  createDeliveryCloseExecutorRegistry,
  executeClosePlan,
  inspectDeliveryCloseState,
  prepareDeliveryClosePlan,
} from "../core/task-close.mjs";

function args(argv) {
  const [command, ...rest] = argv;
  const values = Object.fromEntries(rest.map((arg) => {
    const index = arg.indexOf("=");
    if (!arg.startsWith("--") || index < 3) throw new TypeError(`invalid argument: ${arg}`);
    return [arg.slice(2, index), arg.slice(index + 1)];
  }));
  return { command, values };
}

function required(values, name) {
  if (typeof values[name] !== "string" || values[name] === "") throw new TypeError(`--${name} is required`);
  return values[name];
}

function context(values) {
  const task = openTask(required(values, "task-path"), required(values, "project"), required(values, "task"));
  return { task, kernel: createTaskKernel(task) };
}

function preparedPlan(task, hash) {
  if (!/^[a-f0-9]{64}$/.test(hash ?? "")) throw new TypeError("--plan-hash must be a SHA-256 hash");
  const record = JSON.parse(task.readRecord(`operations/close/plans/${hash}/plan.json`));
  if (record.schema_version !== "task-close-plan-record.v1" || record.task_id !== task.identity.taskId || record.plan_hash !== hash || closePlanHash(record.plan) !== hash) {
    throw new Error("prepared close plan record is invalid");
  }
  return record.plan;
}

function optionalCompletion(task) {
  try { return JSON.parse(task.readRecord("operations/close/completed.json")); }
  catch (error) { if (error?.code === "ENOENT") return null; throw error; }
}

function usage() {
  return [
    "Usage:",
    "  task-close.mjs prepare --task-path=... --project=... --task=... --task-branch=... --target-branch=... --remote=... --task-commit=... --spec-source=... --spec-archive=...",
    "  task-close.mjs confirm --task-path=... --project=... --task=... --plan-hash=... --decision=confirmed|rejected|timeout",
    "  task-close.mjs execute --task-path=... --project=... --task=... --plan-hash=... --confirmation-ref=...",
    "  task-close.mjs complete --task-path=... --project=... --task=... --plan-hash=... --confirmation-ref=...",
    "  task-close.mjs status --task-path=... --project=... --task=... --plan-hash=...",
  ].join("\n");
}

async function main() {
  const { command, values } = args(process.argv.slice(2));
  if (!new Set(["prepare", "confirm", "execute", "complete", "status"]).has(command)) throw new TypeError(usage());
  const { task, kernel } = context(values);
  if (command === "prepare") {
    return prepareDeliveryClosePlan({ task, kernel, delivery: {
      task_branch: required(values, "task-branch"),
      target_branch: required(values, "target-branch"),
      remote: required(values, "remote"),
      task_commit: required(values, "task-commit"),
      spec_source_path: required(values, "spec-source"),
      spec_archive_path: required(values, "spec-archive"),
    } });
  }
  const plan = preparedPlan(task, required(values, "plan-hash"));
  if (command === "confirm") return confirmClosePlan({ task, kernel, plan, outcome: required(values, "decision") });
  if (command === "execute") return executeClosePlan({ task, kernel, plan, closeConfirmationRef: required(values, "confirmation-ref"), executors: createDeliveryCloseExecutorRegistry({ task, kernel, plan }) });
  if (command === "complete") return completeDeliveryClosePlan({ task, kernel, plan, closeConfirmationRef: required(values, "confirmation-ref") });
  const completion = optionalCompletion(task);
  if (completion && (completion.schema_version !== "task-close-completed.v1" || completion.task_id !== task.identity.taskId || completion.plan_hash !== closePlanHash(plan))) {
    throw new Error("completed close record conflicts with the requested plan");
  }
  return { plan_hash: closePlanHash(plan), record_status: completion?.status ?? "not_completed", physical_state: inspectDeliveryCloseState({ task, kernel, plan }) };
}

main().then((result) => console.log(JSON.stringify(result, null, 2))).catch((error) => {
  console.error(`task-close: ${error.message}`);
  process.exitCode = 1;
});

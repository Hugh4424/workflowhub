#!/usr/bin/env node

import { pathToFileURL } from "node:url";

import { migrateTaskRunnerRoot } from "../../core/task-handle.mjs";

function parse(argv) {
  const values = {};
  for (const item of argv) {
    const at = item.indexOf("=");
    if (!item.startsWith("--") || at < 3) throw new TypeError(`invalid argument: ${item}`);
    values[item.slice(2, at)] = item.slice(at + 1);
  }
  for (const key of ["task-path", "project", "task", "runner-root", "stage"]) {
    if (typeof values[key] !== "string" || values[key].trim() === "") throw new TypeError(`--${key} is required`);
  }
  if (Object.keys(values).some((key) => !new Set(["task-path", "project", "task", "runner-root", "stage"]).has(key))) {
    throw new TypeError("runner migration accepts only explicit task and runner identity arguments");
  }
  return values;
}

export function migrateTaskRunner(argv = process.argv.slice(2)) {
  const values = parse(argv);
  const result = migrateTaskRunnerRoot({
    taskPath: values["task-path"],
    projectName: values.project,
    taskId: values.task,
    runnerRoot: values["runner-root"],
    stage: values.stage,
  });
  return {
    task_path: result.task.taskPath,
    project: result.task.identity.projectName,
    task: result.task.identity.taskId,
    migration_ref: result.migration_ref,
    runner_identity: result.runner_identity,
    idempotent_replay: result.idempotent_replay,
  };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { process.stdout.write(`${JSON.stringify(migrateTaskRunner(), null, 2)}\n`); }
  catch (error) { process.stderr.write(`${error?.stack ?? error}\n`); process.exitCode = 1; }
}

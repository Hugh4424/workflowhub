#!/usr/bin/env node

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { basename, dirname, resolve } from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import { validatePlanTaskContract } from "../../runtime/stage/stage-content-contracts.mjs";
import { captureExecutionSnapshot } from "../../runtime/task/git-worktree-snapshot.mjs";

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const OID = /^[a-f0-9]{40,64}$/i;
const HASH = /^[a-f0-9]{64}$/i;

function parseArgs(argv) {
  const values = {};
  for (const argument of argv) {
    const split = argument.indexOf("=");
    if (!argument.startsWith("--") || split < 3) throw new TypeError(`invalid argument: ${argument}`);
    const key = argument.slice(2, split);
    if (!["spec", "plan", "tasks", "output", "task-id", "source-root"].includes(key)) throw new TypeError(`unsupported argument: ${argument}`);
    values[key] = argument.slice(split + 1);
  }
  for (const key of ["spec", "plan", "tasks"]) {
    if (typeof values[key] !== "string" || values[key].trim() === "") throw new TypeError(`--${key}=<path> is required`);
  }
  if (values["task-id"] !== undefined && values["task-id"].trim() === "") throw new TypeError("--task-id=<id> cannot be empty");
  if (values["source-root"] !== undefined && values["source-root"].trim() === "") throw new TypeError("--source-root=<path> cannot be empty");
  const tasksPath = resolve(values.tasks);
  return Object.freeze({
    spec: resolve(values.spec),
    plan: resolve(values.plan),
    tasks: tasksPath,
    output: values.output === undefined ? undefined : resolve(values.output),
    taskId: values["task-id"] ?? basename(dirname(tasksPath)),
    sourceRoot: values["source-root"] === undefined ? process.cwd() : resolve(values["source-root"]),
  });
}

function readMaterial(path, name) {
  const content = readFileSync(path, "utf8");
  if (content.trim() === "") throw new Error(`${name} material is empty: ${path}`);
  return Object.freeze({ path, sha256: sha256(content), content });
}

function currentIdentity({ taskId, sourceRoot, materials }) {
  const materialRevision = `revision-${sha256(materials.map(({ name, content }) => `${name}\0${content}`).join("\0"))}`;
  let snapshot;
  try {
    snapshot = captureExecutionSnapshot(resolve(sourceRoot), taskId);
  } catch (error) {
    throw new Error(`current worktree snapshot cannot be captured: ${error.message}`);
  }
  if (!OID.test(snapshot?.tree ?? "") || !OID.test(snapshot?.commit ?? "") || !HASH.test(snapshot?.source_digest ?? "")) {
    throw new Error("current worktree snapshot has incomplete tree/commit/source identity");
  }
  return Object.freeze({
    task_id: taskId,
    material_revision: materialRevision,
    snapshot_tree: snapshot.tree,
    snapshot_commit: snapshot.commit,
    source_digest: snapshot.source_digest,
    snapshot_head: snapshot.head,
  });
}

export function validateCurrentPlanTasks({ specPath, planPath, tasksPath, taskId = basename(dirname(resolve(tasksPath))), sourceRoot = process.cwd() } = {}) {
  const spec = readMaterial(specPath, "spec");
  const plan = readMaterial(planPath, "plan");
  const tasks = readMaterial(tasksPath, "tasks");
  const identity = currentIdentity({
    taskId,
    sourceRoot,
    materials: [
      { name: "spec.md", content: spec.content },
      { name: "plan.md", content: plan.content },
      { name: "tasks.md", content: tasks.content },
    ],
  });
  const validation = validatePlanTaskContract({
    spec: spec.content,
    plan: plan.content,
    tasks: tasks.content,
  });
  const sliceAdvisory = validation.facts?.slice_advisory ?? Object.freeze({
    status: "unavailable",
    signals: Object.freeze([]),
    explained_signals: Object.freeze([]),
    unexplained_signals: Object.freeze([]),
    signal_details: Object.freeze([]),
    markers: Object.freeze([]),
    marker_count: 0,
    diagnostics: Object.freeze(["validator did not produce slicing advisory facts"]),
  });
  return Object.freeze({
    schema_version: "plan-task-slicing-self-check.v1",
    ...identity,
    status: validation.ok ? "passed" : "failed",
    result: validation.ok ? "passed" : "failed",
    state: validation.ok ? "ready" : "invalid",
    materials: Object.freeze({
      spec: Object.freeze({ path: spec.path, sha256: spec.sha256 }),
      plan: Object.freeze({ path: plan.path, sha256: plan.sha256 }),
      tasks: Object.freeze({ path: tasks.path, sha256: tasks.sha256 }),
    }),
    validator: Object.freeze({ ok: validation.ok, errors: Object.freeze([...validation.errors]) }),
    slice_advisory: sliceAdvisory,
    zero_cross_phase_producer: !sliceAdvisory.signals.includes("SIG-CROSS-PHASE"),
    exit_code: validation.ok ? 0 : 1,
  });
}

export function main(argv = process.argv.slice(2), { stdout = process.stdout } = {}) {
  const values = parseArgs(argv);
  let result;
  try {
    result = validateCurrentPlanTasks({
      specPath: values.spec,
      planPath: values.plan,
      tasksPath: values.tasks,
      taskId: values.taskId,
      sourceRoot: values.sourceRoot,
    });
  } catch (error) {
    result = Object.freeze({
      schema_version: "plan-task-slicing-self-check.v1",
      task_id: values.taskId,
      status: "unavailable",
      result: "unavailable",
      state: "unavailable",
      materials: Object.freeze({
        spec: Object.freeze({ path: values.spec, sha256: null }),
        plan: Object.freeze({ path: values.plan, sha256: null }),
        tasks: Object.freeze({ path: values.tasks, sha256: null }),
      }),
      validator: Object.freeze({ ok: false, errors: Object.freeze([error.message]) }),
      slice_advisory: Object.freeze({
        status: "unavailable",
        signals: Object.freeze([]),
        explained_signals: Object.freeze([]),
        unexplained_signals: Object.freeze([]),
        signal_details: Object.freeze([]),
        markers: Object.freeze([]),
        marker_count: 0,
        diagnostics: Object.freeze([error.message]),
      }),
      error: Object.freeze({ name: error.name, message: error.message }),
      exit_code: 1,
    });
  }
  const serialized = `${JSON.stringify(result, null, 2)}\n`;
  if (values.output) {
    mkdirSync(dirname(values.output), { recursive: true });
    writeFileSync(values.output, serialized, "utf8");
  }
  else stdout.write(serialized);
  return result;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  try {
    const result = main();
    process.exitCode = result.exit_code;
  } catch (error) {
    process.stderr.write(`${error?.stack ?? error}\n`);
    process.exitCode = 1;
  }
}

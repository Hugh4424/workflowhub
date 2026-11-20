#!/usr/bin/env node
// Read-only diagnostics for a delivered close: archive tree, both push
// receipts and the code-graph result. It adds no write path, plan or state.
import { pathToFileURL } from "node:url";
import { readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { resolveCanonicalTaskPath } from "../../runtime/task/load-config.mjs";
import { archiveReadback } from "./task-close.mjs";

function latestPlanReference(taskDir) {
  const directory = join(resolve(taskDir), "quality", "evidence", "close");
  let names;
  try { names = readdirSync(directory).filter(name => /^\d{4}-\d{2}-\d{2}-\d{3}-close-plan\.json$/.test(name)).sort(); }
  catch { names = []; }
  if (!names.length) throw Object.assign(new Error("no ordinary close plan exists for this task"), { code: "CLOSE_PLAN_REFERENCE" });
  return join(directory, names.at(-1));
}

export async function checkSpecsArchive({ taskDir, planRef } = {}) {
  if (typeof taskDir !== "string" || !taskDir) throw new TypeError("--task-path is required");
  const canonicalTask = resolve(taskDir);
  const reference = typeof planRef === "string" && planRef ? resolve(planRef) : latestPlanReference(canonicalTask);
  const state = await archiveReadback({ taskDir: canonicalTask, planRef: reference });
  const readback = state.readback;
  return { task_dir: canonicalTask, plan_ref: readback.plan_ref, archive: state.archive,
    merge: state.merge, pushes: state.pushes, graph: state.graph, archive_readback: state.archive_readback,
    facts: readback.facts, physical_delivery_status: readback.physical_delivery_status };
}

function parse(argv) {
  const values = {};
  for (const arg of argv) {
    const index = arg.indexOf("=");
    if (!arg.startsWith("--") || index < 3) throw new TypeError(`invalid argument: ${arg}`);
    const key = arg.slice(2, index);
    if (key in values) throw new TypeError(`duplicate --${key}`);
    values[key] = arg.slice(index + 1);
  }
  return values;
}

export async function checkSpecsArchiveMain(argv = process.argv.slice(2), { env = process.env, home = process.env.HOME } = {}) {
  const values = parse(argv);
  const allowed = new Set(["project", "task", "task-path", "plan-ref"]);
  if (Object.keys(values).some((key) => !allowed.has(key))) throw new TypeError("unknown archive diagnostic option");
  if (values["task-path"]) return checkSpecsArchive({ taskDir: values["task-path"], planRef: values["plan-ref"] });
  if (!values.project || !values.task) throw new TypeError("provide --task-path, or --project with --task, to identify the task");
  const path = resolveCanonicalTaskPath({ project: values.project, task: values.task, env, home });
  return checkSpecsArchive({ taskDir: path.taskPath, planRef: values["plan-ref"] });
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  checkSpecsArchiveMain(process.argv.slice(2)).then((result) => {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    process.exitCode = 0;
  }).catch((error) => {
    process.stderr.write(`${JSON.stringify({ code: error.code ?? null, message: error.message })}\n`);
    process.exitCode = 1;
  });
}

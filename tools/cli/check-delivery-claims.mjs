#!/usr/bin/env node
// Read-only delivery-claims entry. It calls the single claim reader and exits
// 1 when either of the two claims (implemented / verified) lacks its bound
// original. It never signs, writes, or re-runs a gate.
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { resolveCanonicalTaskPath } from "../../runtime/task/load-config.mjs";
import { readDeliveryClaims } from "../../runtime/task/delivery-claims.mjs";

export function checkDeliveryClaims({ taskDir } = {}) {
  if (typeof taskDir !== "string" || !taskDir) throw new TypeError("--task-path is required");
  return readDeliveryClaims({ taskPath: resolve(taskDir) });
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

export async function checkDeliveryClaimsMain(argv = process.argv.slice(2), { env = process.env, home = process.env.HOME } = {}) {
  const values = parse(argv);
  const allowed = new Set(["project", "task", "task-path"]);
  if (Object.keys(values).some((key) => !allowed.has(key))) throw new TypeError("unknown delivery-claims option");
  if (values["task-path"]) return checkDeliveryClaims({ taskDir: values["task-path"] });
  if (!values.project || !values.task) throw new TypeError("provide --task-path, or --project with --task, to identify the task");
  const path = resolveCanonicalTaskPath({ project: values.project, task: values.task, env, home });
  return checkDeliveryClaims({ taskDir: path.taskPath });
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  checkDeliveryClaimsMain(process.argv.slice(2)).then((result) => {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    process.exitCode = result.status === "pass" || result.status === "not_required" ? 0 : 1;
  }).catch((error) => {
    process.stderr.write(`${JSON.stringify({ code: error.code ?? null, message: error.message })}\n`);
    process.exitCode = 2;
  });
}

#!/usr/bin/env node
import { pathToFileURL } from "node:url";
import { runReviewRound } from "./wh-review-cli.mjs";

export function parsePhaseReviewArgv(argv) {
  const input = { stage: "build-code" };
  for (const arg of argv) {
    const match = /^--(project|task|phase-id)=([a-zA-Z0-9._-]+)$/.exec(arg);
    if (!match) throw new TypeError(`phase wh-review rejects argument: ${arg}`);
    const key = match[1] === "project" ? "project_name" : match[1] === "task" ? "task_id" : "phase_id";
    if (input[key] !== undefined) throw new TypeError(`duplicate phase wh-review argument: --${match[1]}`);
    input[key] = match[2];
  }
  if (!input.project_name || !input.task_id || !input.phase_id) throw new TypeError("usage: wh-review --project=<project> --task=<task> --phase-id=<phase>");
  return Object.freeze(input);
}
export async function runPhaseReviewCli(argv) { return runReviewRound(parsePhaseReviewArgv(argv)); }
async function main() { process.stdout.write(`${JSON.stringify(await runPhaseReviewCli(process.argv.slice(2)))}\n`); }
if (import.meta.url === pathToFileURL(process.argv[1]).href) main().catch((error) => { process.stderr.write(`${error?.stack ?? error}\n`); process.exitCode = 1; });

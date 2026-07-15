#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ReviewProviderClient } from "../skills/wh-review/scripts/review-provider-client.mjs";
import { runReview } from "../skills/wh-review/scripts/review-runner.mjs";

function required(input, key) { if (input[key] === undefined || input[key] === null || input[key] === "") throw new Error(`provider smoke requires explicit ${key}`); return input[key]; }
function absolute(input, key) { const value = required(input, key); if (!isAbsolute(value)) throw new Error(`${key} must be absolute`); return resolve(value); }

export async function runProviderSmoke(input) {
  const sourceRoot = absolute(input, "source_root"); const targetRepoRoot = absolute(input, "target_repo_root");
  const reviewDataRoot = absolute(input, "review_data_root"); const attachmentRoot = absolute(input, "attachment_root");
  const config = absolute(input, "config"); const evidencePath = absolute(input, "evidence_path");
  const command = required(input, "command"); const providers = required(input, "providers"); const materials = required(input, "materials");
  if (!Array.isArray(providers) || providers.length === 0) throw new Error("providers must be a non-empty array");
  mkdirSync(reviewDataRoot, { recursive: true }); mkdirSync(attachmentRoot, { recursive: true }); mkdirSync(dirname(evidencePath), { recursive: true });
  const providerClient = new ReviewProviderClient({ command, config });
  const result = await runReview({ sourceRoot, targetRepoRoot, reviewDataRoot, attachmentRoot, taskId: required(input, "task_id"), stage: required(input, "stage"), reviewTrack: input.review_track ?? null,
    materials, hostProvider: required(input, "host_provider"), providers, previousRuntimeIds: input.previous_runtime_ids ?? {}, providerClient });
  const evidence = { version: 1, kind: "real-provider-smoke", input: { source_root: sourceRoot, target_repo_root: targetRepoRoot, review_data_root: reviewDataRoot, attachment_root: attachmentRoot, config, providers, task_id: input.task_id, stage: input.stage, review_track: input.review_track ?? null }, result };
  writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`, { flag: "wx" }); return { ...result, evidencePath };
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isMain) {
  const inputArg = process.argv.find((value) => value.startsWith("--input="));
  if (!inputArg) { process.stderr.write("Usage: node scripts/run-wh-review-provider-smoke.mjs --input=/absolute/input.json\n"); process.exit(2); }
  const input = JSON.parse(readFileSync(resolve(inputArg.slice("--input=".length)), "utf8"));
  runProviderSmoke(input).then((value) => process.stdout.write(`${JSON.stringify(value, null, 2)}\n`)).catch((error) => { process.stderr.write(`${error.stack ?? error}\n`); process.exitCode = 1; });
}

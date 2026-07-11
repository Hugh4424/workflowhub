#!/usr/bin/env node

/** Stable adapter-facing facade for wh-review's two-phase protocol. */
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { join } from "node:path";
import { prepareRoundState } from "./round-state.mjs";
import { assembleAndInvokeReviewEngine } from "./invoke-review-engine.mjs";

function providerEnv(input) {
  const env = { ...process.env, ...(input.env ?? {}) };
  if (input.provider) env.WH_REVIEW_PROVIDER = input.provider;
  if (input.host_provider) env.WH_REVIEW_HOST_PROVIDER = input.host_provider;
  return env;
}

export function prepareReview(input) {
  return prepareRoundState({
    taskId: input.task_id ?? input.taskId,
    stage: input.stage,
    taskTrackingRoot: input.task_tracking_root ?? input.taskTrackingRoot,
  });
}

export async function executeReview(input) {
  const taskId = input.task_id ?? input.taskId;
  const reviewFlowId = input.review_flow_id ?? input.reviewFlowId;
  const totalRound = input.total_round ?? input.totalRound;
  const taskTrackingRoot = input.task_tracking_root ?? input.taskTrackingRoot;
  const result = await assembleAndInvokeReviewEngine({
    taskId,
    stage: input.stage,
    reviewFlowId,
    totalRound,
    taskTrackingRoot,
    currentContent: input.current_content ?? input.currentContent,
    materialSources: input.material_sources ?? input.materialSources,
    docType: input.doc_type ?? input.docType,
    gitSha: input.git_sha ?? input.gitSha,
    coveredPaths: input.covered_paths ?? input.coveredPaths,
    timeoutMs: input.timeout_ms ?? input.timeoutMs,
    env: providerEnv(input),
  });
  const artifactPath = join(taskTrackingRoot, taskId, "reviews", `verdict-${input.stage}-${reviewFlowId}-round-${totalRound}.raw.json`);
  const raw = JSON.parse(readFileSync(artifactPath, "utf8"));
  const attestation = {};
  for (const field of ["provider", "backend_provider", "reviewer_source", "trueCrossEngine", "synthetic", "failure_reason", "diagnostic_path", "diagnostic_sha256", "diagnostic_bytes", "execution_status"]) {
    if (raw[field] !== undefined) attestation[field] = raw[field];
  }
  return { ...result, ...attestation };
}

async function main() {
  const command = process.argv[2];
  if (command !== "prepare" && command !== "execute") {
    throw new Error("usage: wh-review-cli.mjs <prepare|execute> [input.json]; JSON stdin is used when input.json is omitted");
  }
  const input = JSON.parse(readFileSync(process.argv[3] ?? 0, "utf8"));
  const result = command === "prepare" ? prepareReview(input) : await executeReview(input);
  process.stdout.write(`${JSON.stringify(result)}\n`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    process.stderr.write(`${error?.stack ?? error}\n`);
    process.exitCode = 1;
  });
}

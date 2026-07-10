#!/usr/bin/env node
/** Stable wh-review prepare/execute CLI facade. JSON in, JSON out. */
import { readFileSync } from "node:fs";
import { prepareRoundState } from "./round-state.mjs";
import { assembleAndInvokeReviewEngine } from "./invoke-review-engine.mjs";

function fail(message, details) {
  process.stdout.write(`${JSON.stringify({ status: "failed", failure_reason: message, details })}\n`);
  process.exitCode = 1;
}

function inputFrom(argv, stdin = process.stdin.fd) {
  const fileArg = argv.find((arg) => arg.startsWith("--input="));
  const text = fileArg
    ? readFileSync(fileArg.slice("--input=".length), "utf8")
    : readFileSync(stdin, "utf8");
  return JSON.parse(text);
}

export function prepare(input) {
  return prepareRoundState({
    taskId: input.task_id,
    stage: input.stage,
    taskTrackingRoot: input.task_tracking_root,
  });
}

export function execute(input, env = process.env) {
  const result = assembleAndInvokeReviewEngine({
    taskId: input.task_id,
    stage: input.stage,
    reviewFlowId: input.review_flow_id,
    totalRound: input.total_round,
    taskTrackingRoot: input.task_tracking_root,
    currentContent: input.current_content,
    materialSources: input.material_sources,
    gitSha: input.git_sha,
    coveredPaths: input.covered_paths,
    env,
  });
  return {
    status: result.actual_mode === "not_executed" ? "failed" : "completed",
    ...result,
  };
}

export function runCli(argv = process.argv.slice(2)) {
  const command = argv[0];
  if (!new Set(["prepare", "execute"]).has(command)) throw new Error("usage: wh-review.mjs <prepare|execute> [--input=<json-file>]");
  const input = inputFrom(argv.slice(1));
  return command === "prepare" ? prepare(input) : execute(input);
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  try { process.stdout.write(`${JSON.stringify(runCli())}\n`); }
  catch (error) { fail("wh-review-cli-error", { name: error?.name, message: error?.message }); }
}

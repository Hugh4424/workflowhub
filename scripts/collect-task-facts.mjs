#!/usr/bin/env node

import { randomUUID } from "node:crypto";
import { pathToFileURL } from "node:url";

import { RUNTIME_FACT_SOURCES } from "../config/runtime-fact-sources.mjs";
import { RUNTIME_FACT_V2_SOURCES } from "../config/runtime-fact-v2-sources.mjs";
import { TRANSCRIPT_SOURCES } from "../config/transcript-sources.mjs";
import { collectTaskFacts, createRuntimeFactRegistry, createRuntimeFactV2Registry, createTranscriptSourceRegistry } from "../core/fact-collector.mjs";
import { loadConfig } from "../core/load-config.mjs";
import { bootstrapStage } from "../core/stage-context.mjs";
import { configForCollector, createMetricsLauncherConfig, recordSkeleton, updateOwnResult } from "../metrics/collector.mjs";

function parseArgs(argv) {
  const values = {};
  for (const argument of argv) {
    const separator = argument.indexOf("=");
    if (!argument.startsWith("--") || separator < 3) throw new TypeError(`invalid argument: ${argument}`);
    const key = argument.slice(2, separator);
    if (!new Set(["stage", "project", "task"]).has(key) || Object.hasOwn(values, key)) throw new TypeError(`unsupported argument: ${argument}`);
    values[key] = argument.slice(separator + 1);
  }
  if (Object.keys(values).length !== 3 || !values.stage || !values.project || !values.task) {
    throw new TypeError("usage: collect-task-facts.mjs --stage=<canonical-stage> --project=<project> --task=<task>");
  }
  return values;
}

function productionRegistry() {
  return createTranscriptSourceRegistry(TRANSCRIPT_SOURCES);
}

function productionRuntimeRegistry() {
  return createRuntimeFactRegistry(RUNTIME_FACT_SOURCES);
}

function productionRuntimeV2Registry() {
  return createRuntimeFactV2Registry(RUNTIME_FACT_V2_SOURCES);
}

function recordMetric(operation, warnings) {
  try { operation(); }
  catch { warnings.push({ code: "METRICS_WRITE_FAILED", message: "Metrics collection failed" }); }
}

export function collectTaskFactsMain(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);
  const loadedConfig = loadConfig();
  const ctx = bootstrapStage(options.stage, { mode: "launcher", projectName: options.project, taskId: options.task });
  const metricWarnings = [];
  const metrics = configForCollector(createMetricsLauncherConfig(loadedConfig), {
    task: ctx.task,
    workspace: ctx.workspace,
    onWarn: (message) => metricWarnings.push({ code: "METRICS_WRITE_FAILED", message }),
  });
  const executionId = randomUUID();
  const started = Date.now();
  recordMetric(() => recordSkeleton({ execution_id: executionId, skill_or_stage: "fact-collection", stage: options.stage, skill_version: "v1" }, metrics), metricWarnings);
  let result;
  try {
    result = collectTaskFacts(ctx, { transcriptRegistry: productionRegistry(), runtimeRegistry: productionRuntimeRegistry(), runtimeV2Registry: productionRuntimeV2Registry(), runId: executionId });
    return result;
  } finally {
    recordMetric(() => updateOwnResult(executionId, {
      executed: result?.status === "success",
      duration_ms: Date.now() - started,
      exit_code: result?.status === "success" ? 0 : 1,
    }, metrics), metricWarnings);
    if (result) result.warnings.push(...metricWarnings);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const result = collectTaskFactsMain();
    process.stdout.write(`${JSON.stringify(result)}\n`);
    if (result.status === "failed") process.exitCode = 1;
  } catch (error) {
    process.stderr.write(`${error?.stack ?? error}\n`);
    process.exitCode = 1;
  }
}

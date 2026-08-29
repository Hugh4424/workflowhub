#!/usr/bin/env node

/**
 * Private same-session lifecycle marker.
 *
 * WorkflowHub skills call this at declared step/skill boundaries.  It never
 * writes canonical facts; `stage-runtime run` later authenticates the
 * collected events and publishes one outcome through TaskKernel.
 */

import { readFileSync } from "node:fs";
import process from "node:process";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";

import {
  currentCodexSessionId,
  finishCodexSessionEvent,
  recordCodexSessionCodeReview,
  recordCodexSessionSpecAnalyze,
  startCodexSessionEvent,
} from "./workflowhub-codex-session-state.mjs";
import { loadStageManifest } from "../../runtime/stage/step-manifest.mjs";

const RUNNER_ROOT = fileURLToPath(new URL("../../", import.meta.url));

function option(argv, name, { required = true } = {}) {
  const inline = argv.find((entry) => typeof entry === "string" && entry.startsWith(`${name}=`));
  const index = argv.indexOf(name);
  const value = inline !== undefined
    ? inline.slice(name.length + 1)
    : index >= 0 ? argv[index + 1] : undefined;
  if (required && (typeof value !== "string" || value.trim() === "")) throw new TypeError(`${name} is required`);
  return value;
}

function repeated(argv, name) {
  const values = [];
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === name && typeof argv[index + 1] === "string") values.push(argv[index + 1]);
    else if (typeof argv[index] === "string" && argv[index].startsWith(`${name}=`)) values.push(argv[index].slice(name.length + 1));
  }
  return values;
}

function assertDeclaredSubject(stage, subjectKind, subjectId) {
  const manifest = loadStageManifest(stage, RUNNER_ROOT);
  if (subjectKind === "step" && manifest.steps.some((step) => step.step_slug === subjectId)) return;
  if (subjectKind === "skill") {
    const dependencies = yaml.load(readFileSync(new URL(`../../workflows/${stage}/skill-deps.yaml`, import.meta.url), "utf8"));
    if (Array.isArray(dependencies?.skills) && dependencies.skills.some((skill) => skill?.name === subjectId)) return;
  }
  throw new Error(`${stage} ${subjectKind} is not declared: ${subjectId}`);
}

function main(argv) {
  const command = argv[2];
  const sessionId = currentCodexSessionId(process.env);
  if (sessionId === null) {
    return {
      status: "unavailable",
      reason: "no codex session id in environment; host is not a codex-based session",
      stage: command === "start" || command === "finish" || command === "record-spec-analyze" || command === "record-code-review"
        ? option(argv, "--stage", { required: false }) ?? null
        : null,
    };
  }
  if (command === "start") {
    const stage = option(argv, "--stage");
    const subjectKind = option(argv, "--subject-kind");
    const subjectId = option(argv, "--subject-id");
    assertDeclaredSubject(stage, subjectKind, subjectId);
    return startCodexSessionEvent({
      taskId: option(argv, "--task-id", { required: false }) ?? null,
      stage,
      subjectKind,
      subjectId,
      sessionId,
    });
  }
  if (command === "finish") {
    const stage = option(argv, "--stage");
    const subjectKind = option(argv, "--subject-kind");
    const subjectId = option(argv, "--subject-id");
    assertDeclaredSubject(stage, subjectKind, subjectId);
    return finishCodexSessionEvent({
      taskId: option(argv, "--task-id", { required: false }) ?? null,
      stage,
      subjectKind,
      subjectId,
      status: option(argv, "--status", { required: false }) ?? "completed",
      resultSummary: option(argv, "--summary", { required: false }) ?? "",
      reason: option(argv, "--reason", { required: false }) ?? null,
      evidenceRefs: repeated(argv, "--evidence"),
      trigger: option(argv, "--trigger", { required: false }) === undefined ? null : option(argv, "--trigger") === "true",
      executed: option(argv, "--executed", { required: false }) === undefined ? null : option(argv, "--executed") === "true",
      version: option(argv, "--version", { required: false }) ?? "unavailable",
      sessionId,
    });
  }
  if (command === "record-spec-analyze") {
    const path = option(argv, "--input");
    return recordCodexSessionSpecAnalyze({ taskId: option(argv, "--task-id", { required: false }) ?? null, stage: option(argv, "--stage"), value: JSON.parse(readFileSync(path, "utf8")), sessionId });
  }
  if (command === "record-code-review") {
    const path = option(argv, "--input");
    return recordCodexSessionCodeReview({ taskId: option(argv, "--task-id", { required: false }) ?? null, stage: option(argv, "--stage", { required: false }) ?? "verify-code", value: JSON.parse(readFileSync(path, "utf8")), sessionId });
  }
  throw new Error("usage: workflowhub-codex-session-event.mjs <start|finish|record-spec-analyze|record-code-review> ...");
}

try {
  process.stdout.write(`${JSON.stringify(main(process.argv))}\n`);
} catch (error) {
  process.stderr.write(`${error?.stack ?? error}\n`);
  process.exitCode = 1;
}

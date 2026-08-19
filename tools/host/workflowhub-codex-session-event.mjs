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

import {
  finishCodexSessionEvent,
  recordCodexSessionSpecAnalyze,
  startCodexSessionEvent,
} from "./workflowhub-codex-session-state.mjs";

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

function main(argv) {
  const command = argv[2];
  if (command === "start") {
    return startCodexSessionEvent({
      taskId: option(argv, "--task-id", { required: false }) ?? null,
      stage: option(argv, "--stage"),
      subjectKind: option(argv, "--subject-kind"),
      subjectId: option(argv, "--subject-id"),
      sessionId: process.env.CODEX_THREAD_ID ?? null,
    });
  }
  if (command === "finish") {
    return finishCodexSessionEvent({
      taskId: option(argv, "--task-id", { required: false }) ?? null,
      stage: option(argv, "--stage"),
      subjectKind: option(argv, "--subject-kind"),
      subjectId: option(argv, "--subject-id"),
      status: option(argv, "--status", { required: false }) ?? "completed",
      resultSummary: option(argv, "--summary", { required: false }) ?? "",
      reason: option(argv, "--reason", { required: false }) ?? null,
      evidenceRefs: repeated(argv, "--evidence"),
      trigger: option(argv, "--trigger", { required: false }) === undefined ? null : option(argv, "--trigger") === "true",
      executed: option(argv, "--executed", { required: false }) === undefined ? null : option(argv, "--executed") === "true",
      version: option(argv, "--version", { required: false }) ?? "unavailable",
      sessionId: process.env.CODEX_THREAD_ID ?? null,
    });
  }
  if (command === "record-spec-analyze") {
    const path = option(argv, "--input");
    return recordCodexSessionSpecAnalyze({ taskId: option(argv, "--task-id", { required: false }) ?? null, stage: option(argv, "--stage"), value: JSON.parse(readFileSync(path, "utf8")), sessionId: process.env.CODEX_THREAD_ID ?? null });
  }
  throw new Error("usage: workflowhub-codex-session-event.mjs <start|finish|record-spec-analyze> ...");
}

try {
  process.stdout.write(`${JSON.stringify(main(process.argv))}\n`);
} catch (error) {
  process.stderr.write(`${error?.stack ?? error}\n`);
  process.exitCode = 1;
}

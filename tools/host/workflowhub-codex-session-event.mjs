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
const SAFE_ID = /^[A-Za-z0-9._:-]{1,160}$/;
const TERMINAL_STATUSES = new Set(["completed", "failed", "skipped", "not_applicable", "unknown", "unavailable", "incomplete"]);

function parseOptions(argv, allowed, repeatable = new Set()) {
  const values = new Map();
  for (let index = 3; index < argv.length; index += 1) {
    const entry = argv[index];
    if (typeof entry !== "string" || !entry.startsWith("--")) throw new TypeError(`invalid argument: ${entry}`);
    const separator = entry.indexOf("=");
    const name = separator === -1 ? entry : entry.slice(0, separator);
    if (!allowed.has(name)) throw new TypeError(`invalid argument: ${name}`);
    const value = separator === -1 ? argv[++index] : entry.slice(separator + 1);
    if (typeof value !== "string" || value.startsWith("--")) throw new TypeError(`${name} is required`);
    if (!repeatable.has(name) && values.has(name)) throw new TypeError(`${name} must not be repeated`);
    const prior = values.get(name) ?? [];
    prior.push(value);
    values.set(name, prior);
  }
  return values;
}

function textOption(options, name, { required = false, fallback = null } = {}) {
  const value = options.get(name)?.[0];
  if (value === undefined) {
    if (required) throw new TypeError(`${name} is required`);
    return fallback;
  }
  if (value.trim() === "") throw new TypeError(`${name} must be non-empty`);
  return value;
}

function idOption(options, name, { required = false } = {}) {
  const value = textOption(options, name, { required });
  if (value !== null && !SAFE_ID.test(value)) throw new TypeError(`${name} must be an opaque identifier`);
  return value;
}

function booleanOption(options, name) {
  const value = textOption(options, name);
  if (value === null) return null;
  if (value !== "true" && value !== "false") throw new TypeError(`${name} must be true or false`);
  return value === "true";
}

function repeatedText(options, name) {
  return (options.get(name) ?? []).map((value) => {
    if (value.trim() === "") throw new TypeError(`${name} must be non-empty`);
    return value;
  });
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

function validateInputIdentity(value, { kind, stage, taskId }) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${kind} input must be a JSON object`);
  if (value.stage !== undefined && value.stage !== stage) throw new Error(`${kind} stage identity mismatch: expected ${stage}, received ${value.stage}`);
  if (value.task_id !== undefined) {
    if (typeof value.task_id !== "string" || !SAFE_ID.test(value.task_id)) throw new TypeError(`${kind} task identity is invalid`);
    if (taskId !== null && value.task_id !== taskId) throw new Error(`${kind} task identity mismatch: expected ${taskId}, received ${value.task_id}`);
  }
  for (const [field, pattern] of [["snapshot_tree", /^[a-f0-9]{40}$/], ["material_revision", /^revision-[a-f0-9]{64}$/]]) {
    if (value[field] !== undefined && (typeof value[field] !== "string" || !pattern.test(value[field]))) {
      throw new TypeError(`${kind} ${field} identity is invalid`);
    }
  }
}

function validateSpecAnalyzeInput(value, stage, taskId) {
  validateInputIdentity(value, { kind: "spec_analyze", stage, taskId });
  if (value.schema_version !== undefined && value.schema_version !== "workflowhub-spec-analyze-stage-outcome.v1") {
    throw new Error("spec_analyze schema_version is unsupported");
  }
  if (value.schema_version === "workflowhub-spec-analyze-stage-outcome.v1") {
    if (!value.packet || typeof value.packet !== "object" || Array.isArray(value.packet)) throw new TypeError("spec_analyze packet is required");
    if (!value.result || typeof value.result !== "object" || Array.isArray(value.result)) throw new TypeError("spec_analyze result is required");
  }
}

function validateCodeReviewInput(value, stage, taskId) {
  if (stage !== "verify-code") throw new TypeError("code_review recording is only valid for verify-code");
  validateInputIdentity(value, { kind: "code_review", stage, taskId });
  if (value.schema_version !== undefined && value.schema_version !== "workflowhub-code-review-stage-outcome.v1") {
    throw new Error("code_review schema_version is unsupported");
  }
  if ((value.quality_review_ref === undefined) !== (value.quality_review_hash === undefined)) {
    throw new TypeError("code_review quality_review_ref/hash must be provided together");
  }
  if (value.quality_review_ref !== undefined
      && (typeof value.quality_review_ref !== "string"
        || !/^quality\/reviews\/(?:results\/[A-Za-z0-9][A-Za-z0-9._-]*\.json|attempts\/[A-Za-z0-9][A-Za-z0-9._-]*\/attempt\.json)$/.test(value.quality_review_ref)
        || typeof value.quality_review_hash !== "string"
        || !/^[a-f0-9]{64}$/.test(value.quality_review_hash))) {
    throw new TypeError("code_review quality review binding is invalid");
  }
  if (!value.result || typeof value.result !== "object" || Array.isArray(value.result)
      || !new Set(["clean", "findings", "unavailable"]).has(value.result.status)
      || !Array.isArray(value.result.findings)
      || typeof value.result.summary !== "string"
      || value.result.summary.trim() === "") {
    throw new TypeError("code_review result is invalid");
  }
}

function parseInvocation(argv) {
  const command = argv[2];
  if (command === "start" || command === "finish") {
    const finishOnly = ["--status", "--summary", "--reason", "--evidence", "--trigger", "--executed", "--version"];
    const options = parseOptions(argv, new Set(["--stage", "--subject-kind", "--subject-id", "--task-id", ...(command === "finish" ? finishOnly : [])]), new Set(["--evidence"]));
    const stage = textOption(options, "--stage", { required: true });
    const subjectKind = textOption(options, "--subject-kind", { required: true });
    if (subjectKind !== "step" && subjectKind !== "skill") throw new TypeError("--subject-kind must be step or skill");
    const subjectId = idOption(options, "--subject-id", { required: true });
    const taskId = idOption(options, "--task-id");
    assertDeclaredSubject(stage, subjectKind, subjectId);
    if (command === "start") return Object.freeze({ command, stage, subjectKind, subjectId, taskId });
    const status = textOption(options, "--status", { fallback: "completed" });
    if (!TERMINAL_STATUSES.has(status)) throw new TypeError(`unsupported session event status: ${status}`);
    const resultSummary = textOption(options, "--summary", { fallback: "" });
    const reason = textOption(options, "--reason");
    const evidenceRefs = repeatedText(options, "--evidence");
    const trigger = booleanOption(options, "--trigger");
    const executed = booleanOption(options, "--executed");
    const version = textOption(options, "--version", { fallback: "unavailable" });
    if (subjectKind !== "skill" && (trigger !== null || executed !== null || options.has("--version"))) {
      throw new TypeError("--trigger/--executed/--version are only valid for skill events");
    }
    return Object.freeze({ command, stage, subjectKind, subjectId, taskId, status, resultSummary, reason, evidenceRefs, trigger, executed, version });
  }
  if (command === "record-spec-analyze" || command === "record-code-review") {
    const options = parseOptions(argv, new Set(["--stage", "--input", "--task-id"]));
    const stage = textOption(options, "--stage", { required: command === "record-spec-analyze", fallback: "verify-code" });
    const taskId = idOption(options, "--task-id");
    loadStageManifest(stage, RUNNER_ROOT);
    const inputPath = textOption(options, "--input", { required: true });
    const value = JSON.parse(readFileSync(inputPath, "utf8"));
    if (command === "record-spec-analyze") validateSpecAnalyzeInput(value, stage, taskId);
    else validateCodeReviewInput(value, stage, taskId);
    return Object.freeze({ command, stage, taskId, value });
  }
  throw new Error("usage: workflowhub-codex-session-event.mjs <start|finish|record-spec-analyze|record-code-review> ...");
}

function main(argv) {
  // Validate the complete invocation before checking optional host capability.
  // A missing Codex session is unavailable; a bad command, stage, subject, or
  // input remains a real caller error in every host.
  const invocation = parseInvocation(argv);
  const sessionId = currentCodexSessionId(process.env);
  if (sessionId === null) {
    return {
      status: "unavailable",
      reason: "no codex session id in environment; host is not a codex-based session",
      stage: invocation.stage,
    };
  }
  if (invocation.command === "start") {
    return startCodexSessionEvent({
      taskId: invocation.taskId,
      stage: invocation.stage,
      subjectKind: invocation.subjectKind,
      subjectId: invocation.subjectId,
      sessionId,
    });
  }
  if (invocation.command === "finish") {
    return finishCodexSessionEvent({
      taskId: invocation.taskId,
      stage: invocation.stage,
      subjectKind: invocation.subjectKind,
      subjectId: invocation.subjectId,
      status: invocation.status,
      resultSummary: invocation.resultSummary,
      reason: invocation.reason,
      evidenceRefs: invocation.evidenceRefs,
      trigger: invocation.trigger,
      executed: invocation.executed,
      version: invocation.version,
      sessionId,
    });
  }
  if (invocation.command === "record-spec-analyze") {
    return recordCodexSessionSpecAnalyze({ taskId: invocation.taskId, stage: invocation.stage, value: invocation.value, sessionId });
  }
  if (invocation.command === "record-code-review") {
    return recordCodexSessionCodeReview({ taskId: invocation.taskId, stage: invocation.stage, value: invocation.value, sessionId });
  }
}

try {
  process.stdout.write(`${JSON.stringify(main(process.argv))}\n`);
} catch (error) {
  process.stderr.write(`${error?.stack ?? error}\n`);
  process.exitCode = 1;
}

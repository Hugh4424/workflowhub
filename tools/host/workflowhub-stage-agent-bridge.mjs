#!/usr/bin/env node

/**
 * Private host boundary for the current WorkflowHub session.
 *
 * The current session host submits lifecycle events on stdin. This bridge
 * measures and binds those events to the existing TaskKernel adapter, then
 * prints the immutable outcome reference. The legacy execution shape remains
 * accepted for compatibility. This bridge never starts an agent, resolves a
 * skill, scans sessions, or guesses a source.
 */

import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

import {
  createWorkflowHubSessionRecorder,
  publishStageAgentOutcome,
  publishUnavailableStageAgentOutcome,
} from "../../runtime/stage/stage-agent-outcome-adapter.mjs";
import { bootstrapStage, prepareMakeDecisionWorkspace } from "../../runtime/stage/stage-context.mjs";

const STAGES = new Set(["make-decision", "build-spec", "build-plan", "build-code", "verify-code"]);

function readInput() {
  const raw = readFileSync(0, "utf8");
  if (!raw.trim()) throw new Error("WorkflowHub host bridge requires a JSON request on stdin");
  const value = JSON.parse(raw);
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError("WorkflowHub host bridge request must be an object");
  return value;
}

function requiredText(value, label) {
  if (typeof value !== "string" || value.trim() === "") throw new TypeError(`${label} must be non-empty`);
  return value;
}

function requiredTimestamp(value, label) {
  if (!Number.isSafeInteger(value) || value < 0) throw new TypeError(`${label} must be a non-negative integer`);
  return value;
}

export function publishCurrentWorkflowHubSession({ context, input, stage, attemptId, requirementAuthentication = null }) {
  const session = input.session;
  if (!session || typeof session !== "object" || Array.isArray(session)) throw new TypeError("session must be an object");
  if (!Array.isArray(session.events)) throw new TypeError("session.events must be an array");
  if (requiredText(session.task_id, "session.task_id") !== context.task.identity.taskId) throw new Error("session.task_id does not match the current WorkflowHub task");
  let clock = 0;
  const recorder = createWorkflowHubSessionRecorder({
    task: context.task,
    kernel: context.kernel,
    artifacts: context.artifacts,
    workspace: context.workspace,
    candidateWorkspace: context.candidateWorkspace,
    stage,
    attemptId,
    workflowRunId: context.workflowRunId,
    host: requiredText(session.host, "session.host"),
    sessionId: requiredText(session.session_id, "session.session_id"),
    sourceRef: requiredText(session.source_ref, "session.source_ref"),
    now: () => clock,
    requirementAuthentication,
  });
  for (const [index, event] of session.events.entries()) {
    if (!event || typeof event !== "object" || Array.isArray(event)) throw new TypeError(`session.events[${index}] must be an object`);
    const subjectKind = requiredText(event.subject_kind, `session.events[${index}].subject_kind`);
    const subjectId = requiredText(event.subject_id, `session.events[${index}].subject_id`);
    if (requiredText(event.task_id, `session.events[${index}].task_id`) !== session.task_id) throw new Error(`session.events[${index}] task_id does not match session.task_id`);
    if (requiredText(event.stage, `session.events[${index}].stage`) !== stage) throw new Error(`session.events[${index}] stage does not match the current stage`);
    const startedAt = requiredTimestamp(event.started_at_ms, `session.events[${index}].started_at_ms`);
    const endedAt = requiredTimestamp(event.ended_at_ms, `session.events[${index}].ended_at_ms`);
    if (endedAt < startedAt) throw new Error(`session.events[${index}] ended before it started`);
    clock = startedAt;
    const finish = subjectKind === "step" ? recorder.startStep(subjectId) : subjectKind === "skill" ? recorder.startSkill(subjectId) : null;
    if (!finish) throw new Error(`unsupported session subject_kind: ${subjectKind}`);
    clock = endedAt;
    finish(event);
  }
  return recorder.finish({ status: session.status, spec_analyze: session.spec_analyze });
}

function main(input) {
  const projectName = requiredText(input.project_name, "project_name");
  const taskId = requiredText(input.task_id, "task_id");
  const stage = requiredText(input.stage, "stage");
  if (!STAGES.has(stage)) throw new Error(`unsupported stage: ${stage}`);
  const taskPath = requiredText(input.task_path, "task_path");
  const attemptId = requiredText(input.attempt_id, "attempt_id");
  if (input.project_name !== projectName || input.task_id !== taskId || input.stage !== stage || input.attempt_id !== attemptId) {
    throw new Error("WorkflowHub host bridge request identity does not match its explicit fields");
  }
  const hasExecution = input.execution && typeof input.execution === "object" && !Array.isArray(input.execution);
  const hasSession = input.session && typeof input.session === "object" && !Array.isArray(input.session);
  const hasUnavailable = input.unavailable && typeof input.unavailable === "object" && !Array.isArray(input.unavailable);
  if ([hasExecution, hasSession, hasUnavailable].filter(Boolean).length !== 1) throw new TypeError("session, execution or unavailable host result is required exactly once");

  let context = bootstrapStage(stage, {
    mode: "sidecar",
    projectName,
    taskId,
    taskPath,
    readOnly: false,
  });
  if (stage === "make-decision" && !context.candidateWorkspace) {
    context = prepareMakeDecisionWorkspace(context);
  }
  const outcome = hasSession
    ? publishCurrentWorkflowHubSession({ context, input, stage, attemptId })
    : hasUnavailable
    ? publishUnavailableStageAgentOutcome({
        task: context.task,
        kernel: context.kernel,
        artifacts: context.artifacts,
        workspace: context.workspace,
        candidateWorkspace: context.candidateWorkspace,
        stage,
        attemptId,
        workflowRunId: context.workflowRunId,
        host: requiredText(input.unavailable.host, "unavailable.host"),
        agentRunId: requiredText(input.unavailable.agent_run_id, "unavailable.agent_run_id"),
        reason: requiredText(input.unavailable.reason, "unavailable.reason"),
      })
    : publishStageAgentOutcome({
        task: context.task,
        kernel: context.kernel,
        artifacts: context.artifacts,
        workspace: context.workspace,
        candidateWorkspace: context.candidateWorkspace,
        stage,
        attemptId,
        workflowRunId: context.workflowRunId,
        execution: input.execution,
      });
  return {
    schema_version: "workflowhub-stage-agent-bridge-result.v1",
    task_id: taskId,
    stage,
    attempt_id: attemptId,
    outcome_ref: outcome.ref,
    outcome_sha256: outcome.sha256,
    outcome_status: outcome.value.status,
    producer: outcome.value.producer,
  };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  try {
    process.stdout.write(`${JSON.stringify(main(readInput()))}\n`);
  } catch (error) {
    process.stderr.write(`${error?.stack ?? error}\n`);
    process.exitCode = 1;
  }
}

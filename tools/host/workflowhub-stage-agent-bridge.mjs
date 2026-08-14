#!/usr/bin/env node

/**
 * Private host boundary for a real Stage Agent.
 *
 * The external host owns agent execution and submits the execution object on
 * stdin. This bridge only authenticates the explicit current task/workspace,
 * forwards the already-produced result to the existing TaskKernel adapter,
 * and prints the immutable outcome reference. It never starts an agent,
 * resolves a skill, scans sessions, or guesses a source.
 */

import { readFileSync } from "node:fs";

import {
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
  const hasUnavailable = input.unavailable && typeof input.unavailable === "object" && !Array.isArray(input.unavailable);
  if (!hasExecution && !hasUnavailable) throw new TypeError("execution or unavailable host result is required");

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
  const outcome = hasUnavailable
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

try {
  process.stdout.write(`${JSON.stringify(main(readInput()))}\n`);
} catch (error) {
  process.stderr.write(`${error?.stack ?? error}\n`);
  process.exitCode = 1;
}

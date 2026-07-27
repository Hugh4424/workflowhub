#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import { readLatestStageContentEvidence, verifyStageContentEvidence } from "../core/stage-content-evidence.mjs";
import { createTaskKernel, openTask } from "../core/task-handle.mjs";
import { resolveStorageRoot } from "../core/storage-root.mjs";

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const HASH = /^[a-f0-9]{64}$/;

function object(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label} is missing or invalid`);
  return value;
}

function same(value, expected, label) {
  if (value !== expected) throw new Error(`${label} binding mismatch`);
}

function parseArgs(argv) {
  const values = {};
  for (const item of argv) {
    const split = item.indexOf("=");
    if (!item.startsWith("--") || split < 3) throw new TypeError(`invalid argument: ${item}`);
    const key = item.slice(2, split);
    if (!new Set(["project", "task", "continuation-ref"]).has(key) || Object.hasOwn(values, key)) {
      throw new TypeError(`unsupported argument: ${item}`);
    }
    values[key] = item.slice(split + 1);
  }
  if (!values.project || !values.task || !values["continuation-ref"]) {
    throw new TypeError("usage: validate-stage-replay.mjs --project=<project> --task=<task> --continuation-ref=<canonical-ref-or-ref-file>");
  }
  return values;
}

function continuationRef(value) {
  if (value.startsWith("results/")) return value;
  return readFileSync(value, "utf8").trim();
}

function readJson(task, ref, label = ref) {
  let value;
  try { value = JSON.parse(task.readRecord(ref)); }
  catch (error) { throw new Error(`${label} is missing or invalid: ${error.message}`); }
  return value;
}

function continuedRun(task, continuationRef) {
  let latest = null;
  for (let sequence = 1; sequence <= 9999; sequence += 1) {
    const ref = `runs/make-decision/run-${String(sequence).padStart(4, "0")}.json`;
    try {
      const raw = task.readRecord(ref);
      const value = JSON.parse(raw);
      if (value.continuation_ref === continuationRef) latest = { ref, raw, value };
    }
    catch (error) {
      if (error?.code === "ENOENT") break;
      throw error;
    }
  }
  if (!latest) throw new Error("continued make-decision run is missing");
  return latest;
}

function exactEvidence(task, ref, hash, runId, tree, kind) {
  return verifyStageContentEvidence({
    task, ref, hash, expectedStage: "make-decision", expectedRunId: runId,
    expectedTree: tree, expectedKind: kind,
  });
}

export function validateReplayRecordSet(records) {
  const continuation = object(records.continuation, "continuation");
  const run = object(records.run, "run");
  same(continuation.schema_version, "stage-continuation.v1", "continuation schema");
  same(continuation.task_id, records.taskId, "continuation task");
  same(continuation.stage, "make-decision", "continuation stage");
  same(run.schema_version, "stage-run.v1", "run schema");
  same(run.task_id, records.taskId, "run task");
  same(run.stage, "make-decision", "run stage");
  same(run.continuation_ref, records.continuationRef, "run continuation ref");
  same(run.continuation_hash, records.continuationHash, "run continuation hash");

  const aggregate = object(records.aggregate, "interaction aggregate");
  const tree = aggregate.snapshot_tree;
  same(aggregate.workflow_run_id, run.workflow_run_id, "aggregate run");
  same(aggregate.payload?.workspace_tree, tree, "aggregate workspace tree");
  if (!Array.isArray(records.talks) || records.talks.length !== 3) throw new Error("exactly three talk rounds are required");
  for (const [index, talk] of records.talks.entries()) {
    same(talk.workflow_run_id, run.workflow_run_id, `talk ${index + 1} run`);
    same(talk.snapshot_tree, tree, `talk ${index + 1} tree`);
    same(talk.payload?.rounds?.[0]?.round, index + 1, `talk ${index + 1} order`);
  }
  same(records.grill.workflow_run_id, run.workflow_run_id, "grill run");
  same(records.grill.snapshot_tree, tree, "grill tree");
  if (!Array.isArray(records.grill.payload?.rounds) || records.grill.payload.rounds.length === 0) throw new Error("complete grill interaction is required");

  same(aggregate.payload?.decision_ref, records.decisionReceiptRef, "aggregate decision ref");
  same(aggregate.payload?.decision_hash, records.decisionReceiptHash, "aggregate decision hash");
  same(records.decisionReceipt.decision_ref, records.decisionMarkdownRef, "decision Markdown ref");
  same(records.decisionReceipt.decision_hash, records.decisionMarkdownHash, "decision Markdown hash");
  if (!records.decisionMarkdown.trim()) throw new Error("decision Markdown is empty");

  same(records.coverage.workflow_run_id, run.workflow_run_id, "coverage run");
  same(records.coverage.snapshot_tree, tree, "coverage tree");
  same(records.coverage.payload?.decision_log_ref, records.decisionMarkdownRef, "coverage decision log ref");
  if (records.coverage.payload?.summary?.missing !== 0) throw new Error("decision coverage still has missing items");

  for (const track of ["direction", "detail"]) {
    const review = object(records.reviews?.[track], `${track} review`);
    same(review.task_id, records.taskId, `${track} review task`);
    same(review.stage, "make-decision", `${track} review stage`);
    same(review.review_track, track, `${track} review track`);
    same(review.snapshot_tree, tree, `${track} review tree`);
    same(records.reviewRuns?.[track], run.workflow_run_id, `${track} review run`);
  }

  const attempt = object(records.attempt, "new make-decision attempt");
  same(attempt.task_id, records.taskId, "attempt task");
  same(attempt.stage, "make-decision", "attempt stage");
  same(attempt.facts?.snapshot_tree, tree, "attempt tree");
  same(attempt.facts?.decision_ref, records.decisionReceiptRef, "attempt decision ref");
  same(attempt.facts?.audit_summary_ref, records.auditRef, "attempt audit ref");
  if (!attempt.facts?.content_evidence_refs?.some((entry) => entry.ref === records.aggregateRef)
      || !attempt.facts?.content_evidence_refs?.some((entry) => entry.ref === records.coverageRef)) {
    throw new Error("attempt does not bind aggregate and coverage evidence");
  }
  same(records.audit.workflow_run_id, run.workflow_run_id, "audit run");
  same(records.audit.snapshot_tree, tree, "audit tree");
  same(records.audit.verdict, "pass", "audit verdict");
  same(records.confirmation.task_id, records.taskId, "confirmation task");
  same(records.confirmation.stage, "make-decision", "confirmation stage");
  same(records.confirmation.attempt_ref, records.attemptRef.replace("results/make-decision/", ""), "confirmation attempt");
  same(records.confirmation.decision, "accepted", "confirmation decision");
  return { status: "pass", workflow_run_id: run.workflow_run_id, snapshot_tree: tree, attempt_ref: records.attemptRef };
}

export function validateStageReplay({ task, kernel, continuationRef: suppliedRef }) {
  const continuationRaw = task.readRecord(suppliedRef);
  const continuation = JSON.parse(continuationRaw);
  const runRecord = continuedRun(task, suppliedRef);
  const run = runRecord.value;
  const root = `evidence/stage-content/${sha256(`${task.identity.taskId}\0make-decision\0${run.workflow_run_id}`)}`;
  const evidence = (name, kind) => {
    const ref = `${root}/${name}`;
    const raw = task.readRecord(ref);
    return { ref, hash: sha256(raw), value: exactEvidence(task, ref, sha256(raw), run.workflow_run_id, undefined, kind) };
  };
  const talks = [1, 2, 3].map((number) => evidence(`interaction-completion.talk-${String(number).padStart(4, "0")}.json`, "interaction-completion.v1"));
  const grill = evidence("interaction-completion.grill.json", "interaction-completion.v1");
  const latest = (kind) => readLatestStageContentEvidence({
    task, stage: "make-decision", workflowRunId: run.workflow_run_id, kind,
  });
  const aggregate = latest("interaction-completion.v1");
  const coverage = latest("decision-coverage-audit.v1");
  const tree = aggregate.value.snapshot_tree;
  for (const item of [...talks, grill, coverage]) same(item.value.snapshot_tree, tree, `${item.ref} snapshot`);
  const decisionReceiptRef = aggregate.value.payload.decision_ref;
  const decisionReceiptRaw = task.readRecord(decisionReceiptRef);
  const decisionReceipt = JSON.parse(decisionReceiptRaw);
  const decisionMarkdownRef = decisionReceipt.decision_ref;
  const decisionMarkdown = task.readRecord(decisionMarkdownRef);
  same(sha256(decisionMarkdown), decisionReceipt.decision_hash, "decision Markdown integrity");

  const reviews = {};
  const reviewRuns = {};
  for (const track of ["direction", "detail"]) {
    const flow = kernel.readReviewFlow({
      workflow_run_id: run.workflow_run_id, stage: "make-decision", review_track: track,
      subject_kind: "worktree", phase_id: null, review_scope: null,
    });
    if (!flow?.head_result_ref) throw new Error(`${track} review is not bound to the continued workflow run`);
    reviews[track] = readJson(task, flow.head_result_ref, `${track} review`);
    reviewRuns[track] = flow.identity.workflow_run_id;
  }

  const previousAttemptRef = continuation.previous_attempt.ref;
  const candidates = task.listStageAttemptRefs("make-decision").filter((ref) => {
    if (ref === previousAttemptRef) return false;
    const raw = task.readRecord(ref);
    const invalidationRef = `results/make-decision/invalidations/${sha256(raw)}.json`;
    try {
      const invalidation = JSON.parse(task.readRecord(invalidationRef));
      if (invalidation.schema_version !== "stage-attempt-invalidation.v1"
          || invalidation.attempt_ref !== ref || invalidation.attempt_hash !== sha256(raw)) {
        throw new Error("stage attempt invalidation binding mismatch");
      }
      return false;
    } catch (error) {
      if (error?.code === "ENOENT") return true;
      throw error;
    }
  });
  if (candidates.length !== 1) throw new Error("continued replay must publish exactly one new make-decision attempt");
  const attemptRef = candidates[0];
  const attempt = readJson(task, attemptRef, "new make-decision attempt");
  const auditRef = attempt.facts?.audit_summary_ref;
  const audit = readJson(task, auditRef, "make-decision audit");
  const confirmationRef = `confirmations/make-decision/${attemptRef.split("/").at(-1)}`;
  const confirmation = readJson(task, confirmationRef, "make-decision confirmation");

  return validateReplayRecordSet({
    taskId: task.identity.taskId,
    continuationRef: suppliedRef,
    continuationHash: sha256(continuationRaw),
    continuation, run, talks: talks.map(({ value }) => value), grill: grill.value,
    aggregate: aggregate.value, aggregateRef: aggregate.ref,
    coverage: coverage.value, coverageRef: coverage.ref,
    decisionReceiptRef, decisionReceiptHash: sha256(decisionReceiptRaw), decisionReceipt,
    decisionMarkdownRef, decisionMarkdownHash: sha256(decisionMarkdown), decisionMarkdown,
    reviews, reviewRuns, attemptRef, attempt, auditRef, audit, confirmation,
  });
}

export function validateStageReplayMain(argv = process.argv.slice(2)) {
  const values = parseArgs(argv);
  const task = openTask(
    join(resolveStorageRoot(), "Projects", values.project, "tasks", values.task),
    values.project,
    values.task,
  );
  return validateStageReplay({
    task, kernel: createTaskKernel(task),
    continuationRef: continuationRef(values["continuation-ref"]),
  });
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { process.stdout.write(`${JSON.stringify(validateStageReplayMain(), null, 2)}\n`); }
  catch (error) {
    process.stderr.write(`${error?.stack ?? error}\n`);
    process.exitCode = 1;
  }
}

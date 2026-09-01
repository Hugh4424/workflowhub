#!/usr/bin/env node

import { createHash } from "node:crypto";
import { lstatSync, readdirSync, readFileSync } from "node:fs";
import { isAbsolute, join, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";

const STAGES = ["make-decision", "build-spec", "build-plan", "build-code", "verify-code"];
const STAGE_INDEX = new Map(STAGES.map((stage, index) => [stage, index]));
const HASHED_JSON = /^[a-f0-9]{64}\.json$/;

function fail(message) {
  const error = new Error(message);
  error.code = "CONSUMPTION_EDGES_FAILED";
  throw error;
}

function parseArgs(argv) {
  const allowed = new Set(["root", "now"]);
  const values = {};
  for (const argument of argv) {
    const equals = argument.indexOf("=");
    if (!argument.startsWith("--") || equals < 3) fail(`invalid argument: ${argument}`);
    const name = argument.slice(2, equals);
    const value = argument.slice(equals + 1);
    if (!allowed.has(name)) fail(`unsupported argument: --${name}`);
    if (Object.hasOwn(values, name)) fail(`duplicate argument: --${name}`);
    if (value === "") fail(`--${name} must be non-empty`);
    values[name] = value;
  }
  if (!isAbsolute(values.root ?? "")) fail("--root must be an absolute storage root");
  if (values.now !== undefined && !Number.isFinite(Date.parse(values.now))) fail("--now must be an ISO-compatible timestamp");
  return { root: resolve(values.root), now: values.now ?? new Date().toISOString() };
}

function assertTrustedPath(root, path, label) {
  const trustedRoot = resolve(root);
  const candidate = resolve(path);
  const rel = relative(trustedRoot, candidate);
  if (rel === ".." || rel.startsWith(`..${sep}`) || isAbsolute(rel)) {
    fail(`${label} escapes trusted root`);
  }
  let cursor = trustedRoot;
  for (const segment of rel.split(sep).filter(Boolean)) {
    cursor = join(cursor, segment);
    let stat;
    try { stat = lstatSync(cursor); }
    catch (error) {
      if (error?.code === "ENOENT") return;
      throw error;
    }
    if (stat.isSymbolicLink()) fail(`${label} contains a symlink: ${cursor}`);
    if (cursor !== candidate && !stat.isDirectory()) fail(`${label} contains a non-directory ancestor: ${cursor}`);
  }
}

function realDirectory(path, label) {
  let stat;
  try { stat = lstatSync(path); } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
  if (stat.isSymbolicLink() || !stat.isDirectory()) fail(`${label} must be a real directory`);
  return true;
}

function childDirectories(path, storageRoot) {
  assertTrustedPath(storageRoot, path, "trusted directory");
  if (!realDirectory(path, path)) return [];
  return readdirSync(path, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.isSymbolicLink())
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));
}

function readOutcomeFiles(taskRoot, project, taskId, stage, storageRoot) {
  const directory = join(taskRoot, "quality", "evidence", "stage-outcomes", stage);
  assertTrustedPath(storageRoot, directory, `stage outcomes for ${stage}`);
  if (!realDirectory(directory, `stage outcomes for ${stage}`)) {
    return { files: [], records: [], invalid: [] };
  }
  const entries = readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && HASHED_JSON.test(entry.name))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));
  const records = [];
  const invalid = [];
  for (const filename of entries) {
    const path = join(directory, filename);
    try {
      const raw = readFileSync(path, "utf8");
      const value = JSON.parse(raw);
      if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("outcome must be an object");
      if (value.schema_version !== "workflowhub-stage-outcomes.v1") throw new Error("outcome schema_version is invalid");
      if (value.task_id !== taskId || value.stage !== stage) throw new Error("outcome task/stage identity does not match its path");
      if (!Array.isArray(value.step_outcomes) || !Array.isArray(value.skill_outcomes)) throw new Error("outcome subject arrays are required");
      for (const [kind, subjects] of [["step", value.step_outcomes], ["skill", value.skill_outcomes]]) {
        for (const subject of subjects) {
          const subjectId = kind === "step" ? (subject?.step_slug ?? subject?.step_id) : (subject?.skill_id ?? subject?.skill_slug);
          if (typeof subjectId !== "string" || subjectId.trim() === "") throw new Error(`${kind} outcome subject id is required`);
          if (!Array.isArray(subject.input_refs) || subject.input_refs.some((ref) => typeof ref !== "string" || ref.trim() === "")) {
            throw new Error(`${kind} outcome input_refs must be a complete string array`);
          }
          if (!Array.isArray(subject.evidence_refs)
              || subject.evidence_refs.some((entry) => !entry || typeof entry !== "object" || Array.isArray(entry)
                || typeof entry.ref !== "string" || entry.ref.trim() === "")) {
            throw new Error(`${kind} outcome evidence_refs must be a complete reference array`);
          }
          if (subject.output_refs !== undefined
              && (!Array.isArray(subject.output_refs)
                || subject.output_refs.some((ref) => typeof ref !== "string" || ref.trim() === ""))) {
            throw new Error(`${kind} outcome output_refs must be a complete string array`);
          }
        }
      }
      records.push({ path, value });
    } catch (error) {
      invalid.push({ ref: `quality/evidence/stage-outcomes/${stage}/${filename}`, reason: error.message });
    }
  }
  return { files: entries, records, invalid };
}

function outputExists(taskRoot, ref, storageRoot) {
  if (typeof ref !== "string" || !ref.startsWith("quality/") || ref.startsWith("/") || ref.includes("..")) return false;
  const path = join(taskRoot, ...ref.split("/"));
  assertTrustedPath(storageRoot, path, "output reference");
  let stat;
  try { stat = lstatSync(path); }
  catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
  return stat.isFile() && !stat.isSymbolicLink();
}

function inputRefs(value) {
  return Array.isArray(value?.input_refs)
    ? value.input_refs.filter((ref) => typeof ref === "string" && ref.trim() !== "")
    : [];
}

function evidenceRefs(value) {
  if (!Array.isArray(value?.evidence_refs)) return [];
  return value.evidence_refs
    .filter((entry) => entry && typeof entry === "object" && !Array.isArray(entry) && typeof entry.ref === "string" && entry.ref.trim() !== "")
    .map((entry) => entry.ref);
}

function declaredOutputRefs(value) {
  const refs = Array.isArray(value?.output_refs)
    ? value.output_refs.filter((ref) => typeof ref === "string" && ref.trim() !== "")
    : [];
  return [...new Set([...evidenceRefs(value), ...refs])];
}

function recordDate(value) {
  for (const key of ["generated_at", "recorded_at", "observed_at"]) {
    if (typeof value?.[key] === "string" && Number.isFinite(Date.parse(value[key]))) return value[key];
  }
  return null;
}

function subjectRecords(stage, outcomeRecords, taskRoot, storageRoot) {
  const records = [];
  let order = 0;
  for (const { value: outcome } of outcomeRecords) {
    const append = (value, subjectKind, subjectId) => {
      if (!subjectId) return;
      records.push({
        stage,
        subject_kind: subjectKind,
        subject_id: subjectId,
        position: order,
        produced_at: recordDate(value) ?? recordDate(outcome),
        input_refs: inputRefs(value),
        output_refs: declaredOutputRefs(value),
        outputs_complete: declaredOutputRefs(value).every((ref) => outputExists(taskRoot, ref, storageRoot)),
      });
      order += 1;
    };
    for (const value of Array.isArray(outcome.step_outcomes) ? outcome.step_outcomes : []) {
      append(value, "step", value.step_slug ?? value.step_id);
    }
    for (const value of Array.isArray(outcome.skill_outcomes) ? outcome.skill_outcomes : []) {
      append(value, "skill", value.skill_id ?? value.skill_slug);
    }
  }
  return records;
}

function sourceKey(source) {
  return `${source.stage}\0${source.subject_kind}\0${source.subject_id}`;
}

function positionOf(record) {
  return [STAGE_INDEX.get(record.stage), record.position];
}

function isLater(source, consumer) {
  const [sourceStage, sourcePosition] = positionOf(source);
  const [consumerStage, consumerPosition] = positionOf(consumer);
  return consumerStage > sourceStage || (consumerStage === sourceStage && consumerPosition > sourcePosition);
}

function deriveTask(project, taskId, taskRoot, storageRoot, scannedAt) {
  assertTrustedPath(storageRoot, taskRoot, "task path");
  const stageData = STAGES.map((stage) => ({ stage, ...readOutcomeFiles(taskRoot, project, taskId, stage, storageRoot) }));
  const outcomeLedgerComplete = stageData.every((entry) => entry.files.length > 0 && entry.invalid.length === 0);
  const records = stageData.flatMap((entry) => subjectRecords(entry.stage, entry.records, taskRoot, storageRoot));
  const outputLedgerComplete = records.every((record) => record.outputs_complete);
  const consumerScanComplete = outcomeLedgerComplete && outputLedgerComplete;
  const scopeRevision = stageData
    .flatMap((entry) => entry.files.map((file) => `${entry.stage}/${file}`))
    .sort()
    .join("\n");
  const consumerScan = {
    schema_version: "consumer-scan-proof.v1",
    project,
    task_id: taskId,
    status: consumerScanComplete ? "complete" : "unknown",
    coverage_status: consumerScanComplete ? "complete" : "partial",
    scope: "all-current-stage-outcome-files",
    stage_count: STAGES.length,
    expected_stage_set: STAGES,
    scanned_stage_set: stageData.filter((entry) => entry.files.length > 0 && entry.invalid.length === 0).map((entry) => entry.stage),
    outcome_file_count: stageData.reduce((count, entry) => count + entry.files.length, 0),
    subject_count: records.length,
    scanned_at: scannedAt,
    scope_revision: hashScopeRevision(scopeRevision),
    diagnostics: stageData.flatMap(({ invalid }) => invalid),
  };
  const outputs = [];
  const edges = [];
  const edgeKeys = new Set();
  for (const source of records) {
    for (const ref of source.output_refs) {
      const consumers = records.filter((candidate) => isLater(source, candidate) && candidate.input_refs.includes(ref));
      const sourceSummary = {
        stage: source.stage,
        subject_kind: source.subject_kind,
        subject_id: source.subject_id,
      };
      for (const consumer of consumers) {
        const key = `${ref}\0${sourceKey(source)}\0${sourceKey(consumer)}`;
        if (edgeKeys.has(key)) continue;
        edgeKeys.add(key);
        edges.push({
          ref,
          source: sourceSummary,
          target: {
            stage: consumer.stage,
            subject_kind: consumer.subject_kind,
            subject_id: consumer.subject_id,
          },
        });
      }
      outputs.push({
        ref,
        source: sourceSummary,
        produced_at: source.produced_at,
        // An individual missing edge is conservatively unknown.  The remove
        // gate may use only the separate complete consumer_scan proof below;
        // the page must never render an unreferenced output as "zero".
        consumption_status: consumers.length > 0 ? "consumed" : "unknown",
        consumer_count: consumers.length,
      });
    }
  }
  outputs.sort((left, right) => `${left.ref}\0${left.source.stage}\0${left.source.subject_id}`.localeCompare(`${right.ref}\0${right.source.stage}\0${right.source.subject_id}`));
  edges.sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)));
  return {
    project,
    task_id: taskId,
    scan_status: consumerScanComplete ? "complete" : "partial",
    stages: stageData.map(({ stage, files, invalid }) => ({ stage, outcome_count: files.length, invalid_count: invalid.length })),
    outputs,
    edges,
    consumer_scan: {
      ...consumerScan,
      zero_consumption_proof: consumerScan.status === "complete",
    },
    consumer_scan_proof: {
      ...consumerScan,
      registered_output_refs: outputs.map((entry) => ({ ref: entry.ref, source: entry.source, consumer_count: entry.consumer_count, freshness: "current" })),
      zero_consumption: consumerScan.status === "complete" && outputs.length > 0 && outputs.every((entry) => entry.consumer_count === 0),
      source_subject: "tools/cli/derive-consumption-edges.mjs",
      source_refs: stageData.flatMap((entry) => entry.files.map((file) => `quality/evidence/stage-outcomes/${entry.stage}/${file}`)),
    },
    diagnostics: stageData.flatMap(({ invalid }) => invalid),
  };
}

function hashScopeRevision(value) {
  return createHash("sha256").update(value).digest("hex");
}

export function deriveConsumptionEdges(root, { now = new Date().toISOString() } = {}) {
  const storageRoot = resolve(root);
  assertTrustedPath(storageRoot, storageRoot, "storage root");
  if (!realDirectory(storageRoot, "storage root")) fail(`storage root does not exist: ${storageRoot}`);
  const projectsRoot = join(storageRoot, "Projects");
  const tasks = [];
  for (const project of childDirectories(projectsRoot, storageRoot)) {
    const projectTasksRoot = join(projectsRoot, project, "tasks");
    for (const taskId of childDirectories(projectTasksRoot, storageRoot)) {
      tasks.push(deriveTask(project, taskId, join(projectTasksRoot, taskId), storageRoot, now));
    }
  }
  return {
    schema_version: "consumption-edges.v1",
    generated_at: now,
    tasks,
  };
}

function main() {
  const { root, now } = parseArgs(process.argv.slice(2));
  console.log(JSON.stringify(deriveConsumptionEdges(root, { now }), null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try { main(); }
  catch (error) {
    console.log(JSON.stringify({ status: "failed", error: { summary: error.message } }));
    process.exitCode = 1;
  }
}

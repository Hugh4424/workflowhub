#!/usr/bin/env node

import { createHash, randomUUID } from "node:crypto";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { isAbsolute, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const STAGES = Object.freeze(["make-decision", "build-spec", "build-plan", "build-code", "verify-code"]);
const PROJECTS = new Set(["workflowhub", "paperbuilder"]);
const SEGMENT = /^[A-Za-z0-9][A-Za-z0-9._-]*$/u;
const SOURCE_REF = /^historical:\/\/([^/]+)\/(line\/\d+)$/u;
const SEVERITIES = new Set(["low", "medium", "high"]);
const HISTORICAL_EVIDENCE = "quality/evidence/historical-replay-20260901/transcript-index.jsonl";
const TRANSCRIPT_INDEX = "quality/evidence/transcript-index.jsonl";
const HISTORICAL_RECORDS = "quality/stage-reflection/historical-records.jsonl";
const LESSONS = Object.freeze(Object.fromEntries(STAGES.map((stage) => [stage, `lessons/${stage}.jsonl`])));

function fail(message, code = "HISTORICAL_IMPORT_FAILED") {
  const error = new Error(message);
  error.code = code;
  throw error;
}

function assertSafeSegment(value, label) {
  if (typeof value !== "string" || !SEGMENT.test(value)) fail(`${label} must be one safe path segment`);
}

function assertRegularFile(path, label) {
  if (!existsSync(path)) fail(`${label} is unavailable`);
  const stat = lstatSync(path);
  if (stat.isSymbolicLink() || !stat.isFile()) fail(`${label} must be a regular file`);
}

function assertDirectory(path, label) {
  if (!existsSync(path)) fail(`${label} is unavailable`);
  const stat = lstatSync(path);
  if (stat.isSymbolicLink() || !stat.isDirectory()) fail(`${label} must be a directory`);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function canonicalJson(value) {
  return JSON.stringify(value);
}

function readJsonl(path, label) {
  assertRegularFile(path, label);
  const raw = readFileSync(path);
  const rows = [];
  let offset = 0;
  for (const [index, line] of raw.toString("utf8").split(/\r?\n/u).entries()) {
    const lineBytes = Buffer.from(line, "utf8");
    if (line.trim() === "") {
      offset += lineBytes.length + 1;
      continue;
    }
    let value;
    try { value = JSON.parse(line); }
    catch (error) { fail(`${label} line ${index + 1} is invalid JSON: ${error.message}`); }
    if (!value || typeof value !== "object" || Array.isArray(value)) fail(`${label} line ${index + 1} must be an object`);
    Object.defineProperty(value, "__source_bytes_hash", { value: sha256(lineBytes), enumerable: false });
    Object.defineProperty(value, "__source_line", { value: index + 1, enumerable: false });
    Object.defineProperty(value, "__source_offset", { value: offset, enumerable: false });
    rows.push(value);
    offset += lineBytes.length + 1;
  }
  return rows;
}

function validateSourceRows(rows) {
  if (rows.length !== 20) fail(`${TRANSCRIPT_INDEX} must contain 20 source rows; found ${rows.length}`);
  const byThread = new Map();
  for (const [index, row] of rows.entries()) {
    if (row.record_kind !== "historical_source") fail(`${TRANSCRIPT_INDEX} row ${index + 1} has invalid record_kind`);
    assertSafeSegment(row.thread_id, `${TRANSCRIPT_INDEX} row ${index + 1}.thread_id`);
    assertSafeSegment(row.task_id, `${TRANSCRIPT_INDEX} row ${index + 1}.task_id`);
    if (!PROJECTS.has(row.project)) fail(`${TRANSCRIPT_INDEX} row ${index + 1} has unsupported project`);
    if (!isAbsolute(row.transcript_path)) fail(`${TRANSCRIPT_INDEX} row ${index + 1}.transcript_path must be absolute`);
    assertRegularFile(row.transcript_path, `${TRANSCRIPT_INDEX} row ${index + 1}.transcript_path`);
    if (!Number.isSafeInteger(row.line_count) || row.line_count < 1) fail(`${TRANSCRIPT_INDEX} row ${index + 1}.line_count is invalid`);
    if (!Array.isArray(row.analysis_refs) || row.analysis_refs.length === 0) fail(`${TRANSCRIPT_INDEX} row ${index + 1}.analysis_refs is empty`);
    if (byThread.has(row.thread_id)) fail(`${TRANSCRIPT_INDEX} duplicates thread_id ${row.thread_id}`);
    byThread.set(row.thread_id, row);
  }
  return byThread;
}

function validateHistoricalRecords(rows) {
  if (rows.length !== 20) fail(`${HISTORICAL_RECORDS} must contain 20 records; found ${rows.length}`);
  const bySubject = new Map();
  for (const [index, row] of rows.entries()) {
    if (row.schema_version !== "stage-reflection.v1" || row.record_kind !== "judgment") fail(`${HISTORICAL_RECORDS} row ${index + 1} has invalid envelope`);
    assertSafeSegment(row.task_id, `${HISTORICAL_RECORDS} row ${index + 1}.task_id`);
    if (!STAGES.includes(row.stage)) fail(`${HISTORICAL_RECORDS} row ${index + 1}.stage is unsupported`);
    if (!Array.isArray(row.judgments) || row.judgments.length !== 1) fail(`${HISTORICAL_RECORDS} row ${index + 1} must contain one judgment`);
    const judgment = row.judgments[0];
    assertSafeSegment(judgment.subject_id, `${HISTORICAL_RECORDS} row ${index + 1}.judgments[0].subject_id`);
    if (!Array.isArray(judgment.evidence_refs) || judgment.evidence_refs.length === 0) fail(`${HISTORICAL_RECORDS} row ${index + 1} has no evidence_refs`);
    if (bySubject.has(judgment.subject_id)) fail(`${HISTORICAL_RECORDS} duplicates subject_id ${judgment.subject_id}`);
    bySubject.set(judgment.subject_id, { record: row, judgment });
  }
  return bySubject;
}

function sourceRefParts(value) {
  if (typeof value !== "string") fail("historical source_refs must contain strings");
  const match = SOURCE_REF.exec(value);
  if (!match) fail(`invalid historical source ref: ${value}`);
  return { threadId: match[1], lineRef: match[2], ref: value };
}

function validateLessonRows(rows, stage, sourceByThread, recordsBySubject) {
  if (rows.length < 2 || rows.length % 2 !== 0) fail(`lessons/${stage}.jsonl must contain raw/merged pairs`);
  const seen = new Set();
  const entries = [];
  for (const [index, row] of rows.entries()) {
    if (row.stage !== stage) fail(`lessons/${stage}.jsonl row ${index + 1} has a stage mismatch`);
    assertSafeSegment(row.entry_id, `lessons/${stage}.jsonl row ${index + 1}.entry_id`);
    if (!Array.isArray(row.source_refs) || row.source_refs.length === 0) fail(`lessons/${stage}.jsonl row ${index + 1} has no source_refs`);
    const sources = row.source_refs.map(sourceRefParts).map((source) => {
      const sourceRow = sourceByThread.get(source.threadId);
      if (!sourceRow) fail(`lessons/${stage}.jsonl row ${index + 1} references unknown thread ${source.threadId}`);
      const record = recordsBySubject.get(row.entry_id);
      if (!record) fail(`lessons/${stage}.jsonl row ${index + 1} has no historical judgment for ${row.entry_id}`);
      return { ...source, sourceRow, record };
    });
    const sourceProjects = new Set(sources.map((source) => source.sourceRow.project));
    if (sourceProjects.size !== 1) fail(`lessons/${stage}.jsonl row ${index + 1} crosses projects`);
    if (row.record_kind === "raw_observation") {
      if (typeof row.raw_observation !== "string" || row.raw_observation.trim() === "") fail(`lessons/${stage}.jsonl row ${index + 1}.raw_observation is empty`);
    } else if (row.record_kind === "merged_lesson") {
      if (typeof row.lesson !== "string" || row.lesson.trim() === "") fail(`lessons/${stage}.jsonl row ${index + 1}.lesson is empty`);
      if (!SEVERITIES.has(row.severity)) fail(`lessons/${stage}.jsonl row ${index + 1}.severity is invalid`);
      if (!Number.isSafeInteger(row.occurrence_count) || row.occurrence_count < 1) fail(`lessons/${stage}.jsonl row ${index + 1}.occurrence_count is invalid`);
      if (!Array.isArray(row.supersedes)) fail(`lessons/${stage}.jsonl row ${index + 1}.supersedes must be an array`);
    } else fail(`lessons/${stage}.jsonl row ${index + 1} has unsupported record_kind`);
    const identity = `${stage}\0${row.entry_id}\0${row.record_kind}`;
    if (seen.has(identity)) fail(`lessons/${stage}.jsonl duplicates ${identity}`);
    seen.add(identity);
    entries.push({ row, sources, source: sources[0].sourceRow, record: sources[0].record });
  }
  const byEntry = new Map();
  for (const entry of entries) {
    const kinds = byEntry.get(entry.row.entry_id) ?? new Set();
    kinds.add(entry.row.record_kind);
    byEntry.set(entry.row.entry_id, kinds);
  }
  for (const [entryId, kinds] of byEntry) {
    if (kinds.size !== 2 || !kinds.has("raw_observation") || !kinds.has("merged_lesson")) {
      fail(`lessons/${stage}.jsonl entry ${entryId} must have one raw and one merged row`);
    }
  }
  return entries;
}

export function readPackage(inputRoot) {
  if (typeof inputRoot !== "string" || !isAbsolute(inputRoot)) fail("inputRoot must be an absolute package directory");
  const root = resolve(inputRoot);
  assertDirectory(root, "historical package root");
  const transcriptIndex = readJsonl(join(root, TRANSCRIPT_INDEX), TRANSCRIPT_INDEX);
  const historicalRecords = readJsonl(join(root, HISTORICAL_RECORDS), HISTORICAL_RECORDS);
  const sourceByThread = validateSourceRows(transcriptIndex);
  const recordsBySubject = validateHistoricalRecords(historicalRecords);
  const lessonsByStage = {};
  for (const stage of STAGES) {
    lessonsByStage[stage] = validateLessonRows(readJsonl(join(root, LESSONS[stage]), LESSONS[stage]), stage, sourceByThread, recordsBySubject);
  }
  return Object.freeze({
    root,
    transcriptIndex,
    historicalRecords,
    lessonsByStage,
    filePaths: Object.freeze({
      transcriptIndex: join(root, TRANSCRIPT_INDEX),
      historicalRecords: join(root, HISTORICAL_RECORDS),
    }),
  });
}

function formalSourceRefs(row, entries) {
  return entries.map(() => ({ task_id: row.task_id, raw_entry_id: row.entry_id }));
}

function fileEvidenceRefs() {
  return [HISTORICAL_EVIDENCE];
}

function importedIdentity(project, stage, row) {
  return `${project}\0${stage}\0${row.entry_id}`;
}

function interventionStatus(record) {
  const interventions = Array.isArray(record?.record?.interventions) ? record.record.interventions : [];
  const extracted = Array.isArray(record?.record?.extraction_evidence) && record.record.extraction_evidence.length > 0;
  if (!extracted) return "pending_extraction";
  return interventions.length > 0 ? "observed" : "none_observed";
}

function buildImportedRows(packageData, now) {
  const byProjectStage = new Map();
  const errors = [];
  const valid = [];
  for (const stage of STAGES) {
    for (const entry of packageData.lessonsByStage[stage]) {
      try {
        const { row, sources, source, record } = entry;
        const project = source.project;
        const judgment = record.judgment;
        if (judgment.subject_id !== row.entry_id) fail(`judgment subject_id does not match ${row.entry_id}`);
        if (record.record.task_id !== row.task_id) fail(`${row.entry_id} task_id does not match its historical judgment`);
        const destinationKey = `${project}\0${stage}`;
        const target = byProjectStage.get(destinationKey) ?? { project, stage, rows: [] };
        const imported = {
          entry_kind: row.record_kind,
          entry_id: row.entry_id,
          task_id: row.task_id,
          stage,
          historical_replay: true,
          import_identity: importedIdentity(project, stage, row),
          content_sha256: row.__source_bytes_hash,
          source_refs: formalSourceRefs(row, sources),
          historical_source_refs: sources.map(({ ref }) => ref),
          evidence_refs: fileEvidenceRefs(),
          source_generated_at: record.record.generated_at,
          imported_at: now,
          ...(row.record_kind === "raw_observation"
            ? {
              observed_at: record.record.generated_at,
              text: row.raw_observation,
              merged: true,
              reflection_ref: null,
              interventions: record.record.interventions ?? [],
              intervention_status: interventionStatus(record),
              extraction_evidence: record.record.extraction_evidence ?? [],
            }
            : {
              merged_at: now,
              lesson: row.lesson,
              severity: judgment.severity ?? row.severity,
              severity_reason: judgment.severity_reason ?? row.severity_reason ?? "pending T503 severity calibration",
              severity_calibration_status: judgment.severity_reason || row.severity_reason ? "calibrated" : "pending",
              occurrence_count: row.occurrence_count,
              supersedes: row.supersedes,
              interventions: record.record.interventions ?? [],
              intervention_status: interventionStatus(record),
              extraction_evidence: record.record.extraction_evidence ?? [],
            }),
        };
        target.rows.push(imported);
        byProjectStage.set(destinationKey, target);
        valid.push({ project, stage, row: imported });
      } catch (error) {
        errors.push({ stage, entry_id: entry.row.entry_id, summary: error.message });
      }
    }
  }
  return { byProjectStage, valid, errors };
}

function readExistingRows(path) {
  if (!existsSync(path)) return [];
  return readJsonl(path, path);
}

function rowsForWrite(existing, incoming, path) {
  const next = [...existing];
  for (const row of incoming) {
    const sameKind = next.find((candidate) => candidate.entry_kind === row.entry_kind && candidate.entry_id === row.entry_id);
    if (sameKind) {
      if (sameKind.import_identity === row.import_identity && sameKind.content_sha256 === row.content_sha256) continue;
      fail(`import conflicts with existing lesson ${path}#${row.entry_id}`);
    }
    next.push(row);
  }
  return next;
}

function rowsBytes(rows) {
  return Buffer.from(`${rows.map(canonicalJson).join("\n")}\n`, "utf8");
}

function ensureDirectory(path) {
  if (!existsSync(path)) mkdirSync(path, { recursive: true });
  assertDirectory(path, path);
}

function ensureParentDirectory(path) {
  ensureDirectory(resolve(path, ".."));
}

function atomicWrite(path, bytes) {
  ensureParentDirectory(path);
  const temporary = `${path}.tmp-${randomUUID()}`;
  try {
    writeFileSync(temporary, bytes, { flag: "wx", mode: 0o600 });
    renameSync(temporary, path);
  } catch (error) {
    try { unlinkSync(temporary); } catch (cleanupError) { if (cleanupError.code !== "ENOENT") throw cleanupError; }
    fail(`atomic write failed for ${path}: ${error.message}`);
  }
}

function snapshot(path) {
  if (!existsSync(path)) return null;
  assertRegularFile(path, path);
  return readFileSync(path);
}

function restore(path, prior) {
  if (prior === null) {
    if (existsSync(path)) unlinkSync(path);
    return;
  }
  atomicWrite(path, prior);
}

function storagePath(storageRoot, project, suffix) {
  assertSafeSegment(project, "project");
  const root = resolve(storageRoot);
  return join(root, "Projects", project, suffix);
}

export function buildImportPlan({ inputRoot, storageRoot, now = new Date().toISOString() }) {
  if (typeof storageRoot !== "string" || !isAbsolute(storageRoot)) fail("storageRoot must be an absolute storage root");
  if (typeof now !== "string" || now.trim() === "") fail("now must be a non-empty timestamp");
  const packageData = readPackage(inputRoot);
  const built = buildImportedRows(packageData, now);
  const targets = [];
  for (const target of built.byProjectStage.values()) {
    const path = storagePath(storageRoot, target.project, `lessons/${target.stage}.jsonl`);
    const existing = readExistingRows(path);
    const rows = rowsForWrite(existing, target.rows, path);
    targets.push({ project: target.project, stage: target.stage, path, existing, rows, added: rows.length - existing.length });
  }
  const evidenceBytes = readFileSync(packageData.filePaths.transcriptIndex);
  const projects = [...new Set(targets.map((target) => target.project))];
  const evidenceTargets = projects.map((project) => {
    const path = storagePath(storageRoot, project, HISTORICAL_EVIDENCE);
    const existing = snapshot(path);
    if (existing !== null && !existing.equals(evidenceBytes)) fail(`import conflicts with existing evidence ${path}`);
    return { project, path, existing };
  });
  return Object.freeze({
    inputRoot: packageData.root,
    storageRoot: resolve(storageRoot),
    now,
    packageData,
    targets: Object.freeze(targets),
    evidenceTargets: Object.freeze(evidenceTargets),
    evidenceBytes,
    validCount: built.valid.filter(({ row }) => row.entry_kind === "merged_lesson").length,
    rowCount: built.valid.length,
    errors: Object.freeze(built.errors),
    sourceCount: packageData.transcriptIndex.length,
  });
}

export function executeImport(plan) {
  if (!plan || !Array.isArray(plan.targets) || !Array.isArray(plan.evidenceTargets) || !Buffer.isBuffer(plan.evidenceBytes)) fail("invalid import plan");
  const changed = [];
  try {
    for (const target of plan.targets) {
      if (target.added === 0) continue;
      const prior = snapshot(target.path);
      atomicWrite(target.path, rowsBytes(target.rows));
      changed.push({ path: target.path, prior });
    }
    for (const evidence of plan.evidenceTargets) {
      if (evidence.existing !== null) continue;
      atomicWrite(evidence.path, plan.evidenceBytes);
      changed.push({ path: evidence.path, prior: null });
    }
    return {
      status: "imported",
      source_count: plan.sourceCount,
      valid_entries: plan.validCount,
      written_rows: plan.rowCount,
      added_targets: plan.targets.filter((target) => target.added > 0).length,
      errors: plan.errors,
      idempotent: plan.targets.every((target) => target.added === 0) && plan.evidenceTargets.every((target) => target.existing !== null),
    };
  } catch (error) {
    for (const item of changed.reverse()) {
      try { restore(item.path, item.prior); }
      catch (rollbackError) { error.message += `; rollback failed for ${item.path}: ${rollbackError.message}`; }
    }
    throw error;
  }
}

function parseArgs(argv) {
  const values = { mode: null };
  for (const argument of argv) {
    if (argument === "--dry-run" || argument === "--execute") {
      if (values.mode !== null) fail("choose exactly one of --dry-run or --execute");
      values.mode = argument.slice(2);
      continue;
    }
    const equals = argument.indexOf("=");
    if (!argument.startsWith("--") || equals < 3) fail(`invalid argument: ${argument}`);
    const name = argument.slice(2, equals);
    if (!["input", "storage-root"].includes(name)) fail(`unsupported argument: --${name}`);
    if (values[name] !== undefined) fail(`duplicate argument: --${name}`);
    values[name] = argument.slice(equals + 1);
  }
  if (!values.mode) fail("one of --dry-run or --execute is required");
  if (!values.input || !values["storage-root"]) fail("--input and --storage-root are required");
  return values;
}

function summary(plan, mode, result = null) {
  return {
    status: result?.status ?? "dry_run",
    mode,
    input: plan.inputRoot,
    storage_root: plan.storageRoot,
    source_count: plan.sourceCount,
    valid_entries: plan.validCount,
    valid_rows: plan.rowCount,
    target_count: plan.targets.length,
    targets: plan.targets.map((target) => ({ project: target.project, stage: target.stage, path: target.path, added_rows: target.added })),
    evidence_paths: plan.evidenceTargets.map((target) => target.path),
    evidence_status: plan.evidenceTargets.every((target) => target.existing !== null) ? "already_present_same_bytes" : "will_write",
    errors: plan.errors,
    ...(result ? { result } : {}),
  };
}

function main() {
  const values = parseArgs(process.argv.slice(2));
  const plan = buildImportPlan({ inputRoot: values.input, storageRoot: values["storage-root"] });
  const result = values.mode === "execute" ? executeImport(plan) : null;
  console.log(JSON.stringify(summary(plan, values.mode, result)));
  if (plan.errors.length > 0) process.exitCode = 2;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try { main(); }
  catch (error) {
    console.log(JSON.stringify({ status: "failed", error: { code: error.code ?? "HISTORICAL_IMPORT_FAILED", summary: error.message } }));
    process.exitCode = 1;
  }
}

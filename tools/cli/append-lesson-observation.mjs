#!/usr/bin/env node

import { appendFileSync, existsSync, lstatSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { isAbsolute, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { acquireProjectLock } from "../../runtime/evidence/workflow-evolution.mjs";

const STAGES = new Set(["make-decision", "build-spec", "build-plan", "build-code", "verify-code"]);
const SEGMENT = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
const REF = /^quality\/stage-reflection\/(make-decision|build-spec|build-plan|build-code|verify-code)\.json$/;
const LESSON_REF = /^lessons\/(make-decision|build-spec|build-plan|build-code|verify-code)\.jsonl#[A-Za-z0-9][A-Za-z0-9._-]*$/;

function fail(message) {
  const error = new Error(message);
  error.code = "LESSON_APPEND_FAILED";
  throw error;
}

function parseArgs(argv) {
  const allowed = new Set(["root", "proj", "stage", "task-id", "text", "reflection-ref"]);
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
  for (const name of ["root", "proj", "stage", "task-id", "text", "reflection-ref"]) {
    if (values[name] === undefined) fail(`--${name} is required`);
  }
  if (!isAbsolute(values.root)) fail("--root must be an absolute storage root");
  if (!SEGMENT.test(values.proj) || !SEGMENT.test(values["task-id"])) fail("--proj and --task-id must be one safe path segment");
  if (!STAGES.has(values.stage)) fail(`unsupported stage: ${values.stage}`);
  if (!REF.test(values["reflection-ref"]) || !values["reflection-ref"].endsWith(`/${values.stage}.json`)) {
    fail("--reflection-ref must be quality/stage-reflection/<stage>.json for --stage");
  }
  return values;
}

function assertDirectory(path, label) {
  try { lstatSync(path); }
  catch (error) {
    if (error?.code === "ENOENT") return;
    throw error;
  }
  const stat = lstatSync(path);
  if (stat.isSymbolicLink() || !stat.isDirectory()) fail(`${label} must be a directory`);
}

function entryExists(path) {
  try { lstatSync(path); return true; }
  catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

function assertDirectoryChain(root, segments, label) {
  const storageRoot = resolve(root);
  assertDirectory(storageRoot, "storage root");
  let cursor = storageRoot;
  for (const segment of segments) {
    cursor = join(cursor, segment);
    if (!entryExists(cursor)) return false;
    assertDirectory(cursor, label);
  }
  return true;
}

function ensureDirectoryChain(root, segments, label) {
  const storageRoot = resolve(root);
  if (!entryExists(storageRoot)) mkdirSync(storageRoot, { recursive: true });
  assertDirectory(storageRoot, "storage root");
  let cursor = storageRoot;
  for (const segment of segments) {
    cursor = join(cursor, segment);
    if (!entryExists(cursor)) {
      try { mkdirSync(cursor); }
      catch (error) { if (error?.code !== "EEXIST") throw error; }
    }
    assertDirectory(cursor, label);
  }
  return cursor;
}

function validateLessonIdentity({ proj, stage, taskId }) {
  if (!SEGMENT.test(proj ?? "") || !SEGMENT.test(taskId ?? "")) {
    fail("proj and taskId must be one safe path segment");
  }
  if (!STAGES.has(stage)) fail(`unsupported stage: ${stage}`);
}

function assertRegularFile(path, label) {
  if (!existsSync(path)) fail(`${label} is unavailable`);
  const stat = lstatSync(path);
  if (stat.isSymbolicLink() || !stat.isFile()) fail(`${label} must be a regular file`);
}

function readLessonRows(path) {
  if (!existsSync(path)) return [];
  assertRegularFile(path, "lesson index");
  const raw = readFileSync(path, "utf8");
  return raw.split(/\r?\n/)
    .filter((line) => line.trim() !== "")
    .map((line, index) => {
      let value;
      try { value = JSON.parse(line); }
      catch (error) { fail(`lesson index line ${index + 1} is invalid JSON: ${error.message}`); }
      if (!value || typeof value !== "object" || Array.isArray(value)) fail(`lesson index line ${index + 1} must be an object`);
      if (value.entry_kind !== "raw_observation" && value.entry_kind !== "merged_lesson") {
        fail(`lesson index line ${index + 1} has an unsupported entry_kind`);
      }
      return value;
    });
}

function normalizedLesson(value) {
  return String(value ?? "").trim().replace(/\s+/gu, " ");
}

function severityWeight(value) {
  return { low: 1, medium: 2, high: 3 }[value] ?? 0;
}

export function lessonEntryRef(stage, entryId) {
  if (!STAGES.has(stage) || typeof entryId !== "string" || !SEGMENT.test(entryId)) {
    fail("lesson entry reference is invalid");
  }
  return `lessons/${stage}.jsonl#${entryId}`;
}

function sourceRefs(value) {
  if (!Array.isArray(value?.source_refs)) return [];
  return value.source_refs.filter((source) => source
    && typeof source === "object"
    && !Array.isArray(source)
    && SEGMENT.test(source.task_id ?? "")
    && SEGMENT.test(source.raw_entry_id ?? ""))
    .map((source) => ({ task_id: source.task_id, raw_entry_id: source.raw_entry_id }));
}

function sourceKey(source) {
  return `${source.task_id}\0${source.raw_entry_id}`;
}

function atomicWriteRows(path, rows) {
  const temporary = `${path}.tmp-${randomUUID()}`;
  try {
    writeFileSync(temporary, `${rows.map((row) => JSON.stringify(row)).join("\n")}\n`, {
      encoding: "utf8",
      flag: "wx",
      mode: 0o600,
    });
    renameSync(temporary, path);
  } catch (error) {
    try { unlinkSync(temporary); } catch (cleanupError) { if (cleanupError?.code !== "ENOENT") throw cleanupError; }
    fail(`lesson index write-back failed: ${error.message}`);
  }
}

function acquireLessonMergeLock(storageRoot, project) {
  const waitBuffer = new Int32Array(new SharedArrayBuffer(4));
  let last;
  for (let attempt = 0; attempt < 200; attempt += 1) {
    const lock = acquireProjectLock({ storageRoot, project, attemptId: `lesson-merge-${randomUUID()}` });
    if (lock.status === "ok") return lock;
    last = lock;
    const transientUnreadable = lock.status === "failed" && lock.error?.summary?.startsWith("lock is unreadable:");
    if (lock.status !== "conflict" && !transientUnreadable) break;
    Atomics.wait(waitBuffer, 0, 0, 10);
  }
  fail(last?.error?.summary ?? "lesson merge project lock is unavailable");
}

export function appendLessonObservation({ root, proj, stage, taskId, text, reflectionRef, now = new Date().toISOString(), entryId = randomUUID() }) {
  validateLessonIdentity({ proj, stage, taskId });
  if (typeof reflectionRef !== "string" || !REF.test(reflectionRef) || !reflectionRef.endsWith(`/${stage}.json`)) {
    fail("reflectionRef must be quality/stage-reflection/<stage>.json for stage");
  }
  if (typeof text !== "string" || text.trim() === "") fail("text must be non-empty");
  const storageRoot = resolve(root);
  const taskRoot = join(storageRoot, "Projects", proj, "tasks", taskId);
  if (!assertDirectoryChain(storageRoot, ["Projects", proj, "tasks", taskId], "task")) {
    fail("task is unavailable");
  }
  const lessonsRoot = ensureDirectoryChain(storageRoot, ["Projects", proj, "lessons"], "lessons");
  const row = {
    entry_kind: "raw_observation",
    entry_id: entryId,
    observed_at: now,
    task_id: taskId,
    stage,
    text,
    reflection_ref: reflectionRef,
    merged: false,
  };
  const path = join(lessonsRoot, `${stage}.jsonl`);
  if (existsSync(path)) {
    const stat = lstatSync(path);
    if (stat.isSymbolicLink() || !stat.isFile()) fail("lesson index must be a regular file");
  }
  const prior = existsSync(path) ? readFileSync(path, "utf8") : "";
  appendFileSync(path, `${prior.length > 0 && !prior.endsWith("\n") ? "\n" : ""}${JSON.stringify(row)}\n`, "utf8");
  return { status: "appended", path: `Projects/${proj}/lessons/${stage}.jsonl`, entry: row };
}

/**
 * Merge one raw observation only after the corresponding reflection has passed
 * validation.  The index is rewritten atomically so a failed merge cannot
 * alter an existing merged lesson or partially mark the raw row.
 */
export function mergeLessonObservation({
  root,
  proj,
  stage,
  taskId,
  rawEntryId,
  lesson,
  severity = "medium",
  now = new Date().toISOString(),
}) {
  validateLessonIdentity({ proj, stage, taskId });
  const storageRoot = resolve(root);
  const taskRoot = join(storageRoot, "Projects", proj, "tasks", taskId);
  if (!assertDirectoryChain(storageRoot, ["Projects", proj, "tasks", taskId], "task")) {
    fail("task is unavailable");
  }
  if (!SEGMENT.test(rawEntryId ?? "")) fail("rawEntryId must be one safe path segment");
  if (!Object.hasOwn({ low: true, medium: true, high: true }, severity)) fail("severity must be low, medium, or high");
  const lessonsRoot = join(storageRoot, "Projects", proj, "lessons");
  assertDirectoryChain(storageRoot, ["Projects", proj, "lessons"], "lessons");
  assertDirectory(lessonsRoot, "lessons");
  const path = join(lessonsRoot, `${stage}.jsonl`);
  const lock = acquireLessonMergeLock(storageRoot, proj);
  try {
    const rows = readLessonRows(path);
    const rawIndex = rows.findIndex((row) => row.entry_kind === "raw_observation" && row.entry_id === rawEntryId);
    if (rawIndex < 0) fail(`raw lesson ${rawEntryId} is unavailable`);
    const raw = rows[rawIndex];
    if (raw.task_id !== taskId || raw.stage !== stage) fail("raw lesson identity does not match the requested task and stage");

  const existingMerged = rows.find((row) => row.entry_kind === "merged_lesson"
    && sourceRefs(row).some((source) => source.task_id === taskId && source.raw_entry_id === rawEntryId));
    if (raw.merged === true && !existingMerged) {
      fail("raw lesson is marked merged but no merged lesson source exists");
    }
    if (raw.merged !== true && existingMerged) {
      fail("raw lesson has a merged lesson source but merged flag is false");
    }
    if (raw.merged === true) {
      return {
        status: "already_merged",
        path: `Projects/${proj}/lessons/${stage}.jsonl`,
        ref: lessonEntryRef(stage, existingMerged.entry_id),
        entry: existingMerged,
      };
    }
    if (raw.merged !== false) fail("raw lesson merged flag must be false before merge");

    const lessonText = normalizedLesson(lesson || raw.text);
    if (!lessonText) fail("lesson must be non-empty");
    const matchingIndexes = rows
      .map((row, index) => ({ row, index }))
      .filter(({ row }) => row.entry_kind === "merged_lesson" && normalizedLesson(row.lesson) === lessonText);
    const canonical = matchingIndexes[0]?.row ?? null;
    const mergedEntryId = canonical?.entry_id ?? randomUUID();
    if (!SEGMENT.test(mergedEntryId)) fail("merged lesson entry_id must be one safe path segment");
    const priorSources = matchingIndexes.flatMap(({ row }) => sourceRefs(row));
    const allSources = new Map(priorSources.map((source) => [sourceKey(source), source]));
    allSources.set(sourceKey({ task_id: taskId, raw_entry_id: rawEntryId }), { task_id: taskId, raw_entry_id: rawEntryId });
    const priorCount = matchingIndexes.reduce((sum, { row }) => {
      const count = Number.isSafeInteger(row.occurrence_count) && row.occurrence_count > 0 ? row.occurrence_count : sourceRefs(row).length;
      return sum + count;
    }, 0);
    const supersedes = [...new Set(matchingIndexes.slice(1).map(({ row }) => row.entry_id).filter((entryId) => SEGMENT.test(entryId ?? "")))];
    const merged = {
      entry_kind: "merged_lesson",
      entry_id: mergedEntryId,
      merged_at: now,
      stage,
      lesson: canonical?.lesson ?? lessonText,
      severity: severityWeight(canonical?.severity) >= severityWeight(severity) ? canonical.severity : severity,
      occurrence_count: priorCount + 1,
      source_refs: [...allSources.values()],
      supersedes: [...new Set([...(canonical?.supersedes ?? []), ...supersedes])],
    };
    const next = rows
      .filter((_row, index) => !matchingIndexes.slice(1).some((entry) => entry.index === index))
      .map((row) => row.entry_id === rawEntryId ? { ...row, merged: true } : row);
    const canonicalIndex = next.findIndex((row) => row.entry_kind === "merged_lesson" && row.entry_id === mergedEntryId);
    if (canonicalIndex >= 0) next[canonicalIndex] = merged;
    else next.push(merged);
    atomicWriteRows(path, next);
    return {
      status: "merged",
      path: `Projects/${proj}/lessons/${stage}.jsonl`,
      ref: lessonEntryRef(stage, merged.entry_id),
      entry: merged,
    };
  } finally {
    lock.release();
  }
}

function main() {
  const values = parseArgs(process.argv.slice(2));
  console.log(JSON.stringify(appendLessonObservation({
    root: values.root,
    proj: values.proj,
    stage: values.stage,
    taskId: values["task-id"],
    text: values.text,
    reflectionRef: values["reflection-ref"],
  })));
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try { main(); }
  catch (error) {
    console.log(JSON.stringify({ status: "failed", error: { summary: error.message } }));
    process.exitCode = 1;
  }
}

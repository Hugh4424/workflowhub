#!/usr/bin/env node

import Ajv from "ajv";
import { createHash, randomUUID } from "node:crypto";
import { existsSync, lstatSync, readdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import { isAbsolute, join, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { deriveConsumptionEdges } from "./derive-consumption-edges.mjs";
import { isStageReflectionRef, validateHumanConfirmation } from "../../runtime/evidence/canonical-evidence-validators.mjs";

const STAGES = new Set(["make-decision", "build-spec", "build-plan", "build-code", "verify-code"]);
const CONFIRMATION_REF = /^quality\/confirmations\/[a-f0-9]{64}\.json$/;
const SEGMENT = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
const WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
const schema = JSON.parse(readFileSync(new URL("../../runtime/schemas/stage-reflection.v1.json", import.meta.url), "utf8"));
const validateSchema = new Ajv({ allErrors: true, strict: false }).compile(schema);

function fail(message) {
  const error = new Error(message);
  error.code = "STAGE_REFLECTION_VALIDATION_FAILED";
  throw error;
}

function assertTrustedPath(root, path, label) {
  const trustedRoot = resolve(root);
  const candidate = resolve(path);
  let rootStat;
  try { rootStat = lstatSync(trustedRoot); }
  catch (error) {
    if (error?.code === "ENOENT") fail(`storage root does not exist: ${trustedRoot}`);
    throw error;
  }
  if (rootStat.isSymbolicLink() || !rootStat.isDirectory()) fail("storage root must be a real directory");
  const rel = relative(trustedRoot, candidate);
  if (rel === ".." || rel.startsWith(`..${sep}`) || isAbsolute(rel)) fail(`${label} escapes trusted root`);
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

function parseArgs(argv) {
  const allowed = new Set(["root", "proj", "task-id", "stage", "reflection-ref", "now"]);
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
  for (const name of ["root", "proj", "task-id", "stage", "reflection-ref"]) {
    if (values[name] === undefined) fail(`--${name} is required`);
  }
  if (!isAbsolute(values.root)) fail("--root must be an absolute storage root");
  if (!SEGMENT.test(values.proj) || !SEGMENT.test(values["task-id"])) fail("--proj and --task-id must be one safe path segment");
  if (!STAGES.has(values.stage)) fail(`unsupported stage: ${values.stage}`);
  if (!isStageReflectionRef(values["reflection-ref"]) || !values["reflection-ref"].endsWith(`/${values.stage}.json`)) {
    fail("--reflection-ref must be quality/stage-reflection/<stage>.json for --stage");
  }
  if (values.now !== undefined && !Number.isFinite(Date.parse(values.now))) fail("--now must be an ISO-compatible timestamp");
  return values;
}

function readJson(path, label) {
  let raw;
  try { raw = readFileSync(path, "utf8"); }
  catch (error) { fail(`${label} is unavailable: ${error.message}`); }
  try { return { raw, value: JSON.parse(raw) }; }
  catch (error) { fail(`${label} is not valid JSON: ${error.message}`); }
}

function regularFile(path) {
  if (!existsSync(path)) return false;
  const stat = lstatSync(path);
  return stat.isFile() && !stat.isSymbolicLink();
}

function qualityRefExists(taskRoot, ref, storageRoot) {
  if (typeof ref !== "string" || !ref.startsWith("quality/") || ref.includes("..") || ref.startsWith("/")) return false;
  const path = join(taskRoot, ...ref.split("/"));
  assertTrustedPath(storageRoot, path, "quality reference");
  return regularFile(path);
}

function inWindow(value, nowMs) {
  const timestamp = Date.parse(value ?? "");
  return Number.isFinite(timestamp) && timestamp >= nowMs - WINDOW_MS && timestamp <= nowMs;
}

function confirmationFacts(taskRoot, taskId, stage, nowMs, storageRoot) {
  const directory = join(taskRoot, "quality", "confirmations");
  assertTrustedPath(storageRoot, directory, "quality/confirmations");
  if (!regularFile(directory) && !existsSync(directory)) return [];
  if (!existsSync(directory)) return [];
  const stat = lstatSync(directory);
  if (stat.isSymbolicLink() || !stat.isDirectory()) fail("quality/confirmations must be a directory");
  return readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && CONFIRMATION_REF.test(`quality/confirmations/${entry.name}`))
    .flatMap((entry) => {
      const ref = `quality/confirmations/${entry.name}`;
      const path = join(directory, entry.name);
      try {
        assertTrustedPath(storageRoot, path, "confirmation reference");
        const raw = readFileSync(path, "utf8");
        if (createHash("sha256").update(raw).digest("hex") !== entry.name.slice(0, -5)) return [];
        const value = JSON.parse(raw);
        const subject = value?.schema_version === "human-confirmation.v1" ? value.attempt_ref : undefined;
        validateHumanConfirmation(value, { taskId, stage, subject });
        if (!inWindow(value.confirmed_at, nowMs)) return [];
        return [{
          ref,
          task_id: value.task_id,
          stage: value.stage,
          decision: value.decision,
          step_slug: value.step_slug ?? null,
          reply_text: value.schema_version === "human-confirmation.v3" ? value.reply_text : null,
          subject_ref: value.subject_ref ?? null,
          attempt_ref: value.attempt_ref ?? null,
          version: value.schema_version,
        }];
      } catch {
        return [];
      }
    });
}

function findTaskEdges(derived, project, taskId) {
  return derived.tasks.find((task) => task.project === project && task.task_id === taskId)
    ?? { project, task_id: taskId, scan_status: "partial", outputs: [], edges: [], diagnostics: [] };
}

function zeroConsumption(edges, stage, subjectId, nowMs) {
  const outputs = edges.outputs.filter((entry) => entry.source.stage === stage && entry.source.subject_id === subjectId);
  const recent = outputs.filter((entry) => inWindow(entry.produced_at, nowMs));
  if (recent.length === 0) return { allowed: false, reason: "no registered output is inside the 30-day window" };
  if (edges.consumer_scan?.status !== "complete" || edges.consumer_scan.zero_consumption_proof !== true) {
    return { allowed: false, reason: "complete consumer scan is unavailable; consumption remains unknown" };
  }
  if (recent.some((entry) => entry.consumer_count !== 0 || entry.consumption_status === "consumed")) {
    return { allowed: false, reason: "consumption is non-zero" };
  }
  return { allowed: true, reason: "complete consumer scan proves zero consumers for all registered outputs in the 30-day window" };
}

export function validateReflectionValue({ storageRoot, taskRoot, project, taskId, stage, reflectionRef, now, input, raw }) {
  assertTrustedPath(storageRoot, taskRoot, "task path");
  if (!validateSchema(input)) fail(`reflection schema is invalid: ${validateSchema.errors?.[0]?.instancePath ?? "/"}`);
  if (input.task_id !== taskId || input.stage !== stage) fail("reflection identity does not match the requested task and stage");
  const nowMs = Date.parse(now);
  const derived = findTaskEdges(deriveConsumptionEdges(storageRoot), project, taskId);
  const confirmations = confirmationFacts(taskRoot, taskId, stage, nowMs, storageRoot);
  const confirmationsByRef = new Map(confirmations.map((confirmation) => [confirmation.ref, confirmation]));
  const missingEvidenceRefs = new Set();
  const missingConfirmationRefs = new Set();
  const downgrades = [];
  const judgments = input.judgments.map((judgment) => {
    const missing = judgment.evidence_refs.filter((ref) => !qualityRefExists(taskRoot, ref, storageRoot));
    for (const ref of missing) missingEvidenceRefs.add(ref);
    let next = { ...judgment };
    if (missing.length > 0 && next.confidence === "high") next = { ...next, confidence: "medium" };
    if (next.classification === "remove_candidate") {
      const zero = zeroConsumption(derived, stage, next.subject_id, nowMs);
      const rejected = confirmations.some((confirmation) => confirmation.decision === "rejected" && confirmation.step_slug === next.subject_id);
      const repeated = confirmations.filter((confirmation) => confirmation.step_slug === next.subject_id).length >= 2;
      if (!zero.allowed || (!rejected && !repeated)) {
        const reasons = [];
        if (!zero.allowed) reasons.push(zero.reason);
        if (!rejected && !repeated) reasons.push("no rejected confirmation or two same-step interventions");
        next = { ...next, classification: "needs_evidence" };
        downgrades.push({
          subject_id: next.subject_id,
          subject_kind: next.subject_kind,
          downgraded_from: "remove_candidate",
          downgrade_reason: reasons.join("；"),
          checked_at: now,
        });
      }
    }
    return next;
  });
  const interventions = input.interventions.map((intervention) => {
    const confirmation = confirmationsByRef.get(intervention.confirmation_ref);
    if (!confirmation) {
      missingConfirmationRefs.add(intervention.confirmation_ref);
      return {
        ...intervention,
        reply_text: null,
        confidence: intervention.confidence === "low" ? "low" : "medium",
      };
    }
    const replyText = confirmation.version === "human-confirmation.v3" ? confirmation.reply_text : null;
    return {
      ...intervention,
      step_slug: confirmation.step_slug ?? intervention.step_slug,
      reply_text: replyText,
      confidence: replyText !== null ? intervention.confidence : (intervention.confidence === "low" ? "low" : "medium"),
    };
  });
  const missing = [...missingEvidenceRefs].sort();
  const missingConfirmations = [...missingConfirmationRefs].sort();
  const status = input.status === "failed"
    ? "failed"
    : missing.length > 0 || missingConfirmations.length > 0 ? "degraded" : input.status;
  const reflection = {
    ...input,
    ...(status === "degraded" ? { status: "degraded", error: null } : {}),
    judgments,
    interventions,
  };
  if (!validateSchema(reflection)) fail(`validated reflection is invalid: ${validateSchema.errors?.[0]?.instancePath ?? "/"}`);
  return {
    schema_version: "stage-reflection-validation.v1",
    project,
    task_id: taskId,
    stage,
    status,
    reflection_ref: reflectionRef,
    reflection,
    downgrades,
    missing_evidence_refs: missing,
    missing_confirmation_refs: missingConfirmations,
    consumption: derived,
    confirmations: confirmations.map(({ ref, decision, step_slug, version, task_id: confirmationTaskId, stage: confirmationStage, reply_text, subject_ref, attempt_ref }) => ({
      ref,
      task_id: confirmationTaskId,
      stage: confirmationStage,
      decision,
      step_slug,
      reply_text,
      subject_ref,
      attempt_ref,
      version,
    })),
    input_sha256: createHash("sha256").update(raw).digest("hex"),
    validated_at: now,
  };
}

function reflectionPath(storageRoot, taskRoot, reflectionRef) {
  if (!isStageReflectionRef(reflectionRef)) fail(`reflection ref is invalid: ${reflectionRef}`);
  const path = join(taskRoot, ...reflectionRef.split("/"));
  assertTrustedPath(storageRoot, path, "reflection reference");
  if (!regularFile(path)) fail(`reflection ${reflectionRef} must be a real file`);
  return path;
}

function writeValidatedReflection({ storageRoot, taskRoot, reflectionRef, sourceRaw, reflection }) {
  const path = reflectionPath(storageRoot, taskRoot, reflectionRef);
  const currentRaw = readFileSync(path, "utf8");
  if (currentRaw !== sourceRaw) fail(`reflection ${reflectionRef} changed during validation`);
  const validatedRaw = `${JSON.stringify(reflection, null, 2)}\n`;
  if (validatedRaw === currentRaw) return { status: "unchanged", ref: reflectionRef };
  const temporary = `${path}.tmp-${randomUUID()}`;
  try {
    writeFileSync(temporary, validatedRaw, { encoding: "utf8", flag: "wx", mode: 0o600 });
    renameSync(temporary, path);
  } catch (error) {
    try { unlinkSync(temporary); } catch (cleanupError) { if (cleanupError?.code !== "ENOENT") throw cleanupError; }
    fail(`reflection ${reflectionRef} write-back failed: ${error.message}`);
  }
  return { status: "written", ref: reflectionRef };
}

export function validateReflection({ storageRoot, taskRoot, project, taskId, stage, reflectionRef, now, writeBack = false }) {
  const path = reflectionPath(storageRoot, taskRoot, reflectionRef);
  const { raw, value: input } = readJson(path, `reflection ${reflectionRef}`);
  const result = validateReflectionValue({ storageRoot, taskRoot, project, taskId, stage, reflectionRef, now, input, raw });
  return writeBack
    ? { ...result, reflection_write: writeValidatedReflection({ storageRoot, taskRoot, reflectionRef, sourceRaw: raw, reflection: result.reflection }) }
    : result;
}

function main() {
  const values = parseArgs(process.argv.slice(2));
  const root = resolve(values.root);
  const taskRoot = join(root, "Projects", values.proj, "tasks", values["task-id"]);
  assertTrustedPath(root, taskRoot, "task path");
  const now = values.now ?? new Date().toISOString();
  console.log(JSON.stringify(validateReflection({
    storageRoot: root,
    taskRoot,
    project: values.proj,
    taskId: values["task-id"],
    stage: values.stage,
    reflectionRef: values["reflection-ref"],
    now,
    writeBack: true,
  }), null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try { main(); }
  catch (error) {
    console.log(JSON.stringify({ status: "failed", error: { summary: error.message } }));
    process.exitCode = 1;
  }
}

#!/usr/bin/env node

import Ajv from "ajv";
import { spawnSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, extname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { buildInputInventory, computeQualityTaxProjection, readCurrentEvolutionProjection, refreshEvolutionSnapshot, resolveTargetRef, validateStageOutcomeStructure } from "../../runtime/evidence/workflow-evolution.mjs";
import { validateHumanConfirmation } from "../../runtime/evidence/canonical-evidence-validators.mjs";

const STAGES = ["make-decision", "build-spec", "build-plan", "build-code", "verify-code"];
const CLASSIFICATIONS = ["keep", "optimize", "simplify", "merge", "remove_candidate", "add", "needs_evidence"];
const SEVERITIES = ["high", "medium", "low"];
const SEVERITY_WEIGHT = { high: 3, medium: 2, low: 1 };
const WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
const SAFE_SEGMENT = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
const SAFE_REF = /^quality\/(?:evidence|tests|reviews|confirmations|stage-reflection)\/(?!.*\.\.)[A-Za-z0-9._/-]+$/;
const CONFIRMATION_REF = /^quality\/confirmations\/[a-f0-9]{64}\.json$/;
const SAFE_LESSON_REF = /^lessons\/(make-decision|build-spec|build-plan|build-code|verify-code)\.jsonl#([A-Za-z0-9][A-Za-z0-9._-]*)$/;
const REFLECTION_FILE = /^(make-decision|build-spec|build-plan|build-code|verify-code)\.json$/;
const HASHED_JSON = /^[a-f0-9]{64}\.json$/;
const AVAILABILITY_STATES = new Set(["unavailable", "not_scheduled"]);
const AVAILABILITY_REASONS_BY_STATE = {
  unavailable: new Set(["executor_absent"]),
  not_scheduled: new Set(["preflight_failed", "identity_failed", "startup_failed", "interrupted", "not_started"]),
};
const schema = JSON.parse(readFileSync(new URL("../../runtime/schemas/stage-reflection.v1.json", import.meta.url), "utf8"));
const dateTimeFormats = { "date-time": isDateTime };
const validateSchema = new Ajv({ allErrors: true, strict: false, formats: dateTimeFormats }).compile(schema);
const schemaV2 = JSON.parse(readFileSync(new URL("../../runtime/schemas/stage-reflection.v2.json", import.meta.url), "utf8"));
const validateSchemaV2 = new Ajv({ allErrors: true, strict: false, formats: dateTimeFormats }).compile(schemaV2);
const validateAvailabilityFact = new Ajv({ allErrors: true, strict: false, formats: dateTimeFormats }).compile({
  type: "object",
  additionalProperties: false,
  required: ["schema_version", "record_kind", "task_id", "stage", "state", "reason_code", "observed_at", "task_identity"],
  properties: {
    schema_version: { const: "stage-reflection-availability.v1" },
    record_kind: { const: "availability" },
    task_id: { type: "string", minLength: 1 },
    stage: { enum: STAGES },
    state: { enum: ["unavailable", "not_scheduled"] },
    reason_code: { enum: ["executor_absent", "preflight_failed", "identity_failed", "startup_failed", "interrupted", "not_started"] },
    observed_at: { type: "string", format: "date-time" },
    task_identity: schema.$defs.availability_fact.properties.task_identity,
  },
});
const template = readFileSync(new URL("./build-reflection-page-template.html", import.meta.url), "utf8");
const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

function fail(message, code = "REFLECTION_PAGE_FAILED") {
  const error = new Error(message);
  error.code = code;
  throw error;
}

function parseArgs(argv) {
  const allowed = new Set(["root", "tasks-root", "out", "now"]);
  const values = {};
  for (const argument of argv) {
    const equals = argument.indexOf("=");
    if (!argument.startsWith("--") || equals < 3) fail(`invalid argument: ${argument}`, "INVALID_ARGUMENT");
    const name = argument.slice(2, equals);
    const value = argument.slice(equals + 1);
    if (!allowed.has(name)) fail(`unsupported argument: --${name}`, "INVALID_ARGUMENT");
    if (Object.hasOwn(values, name)) fail(`duplicate argument: --${name}`, "INVALID_ARGUMENT");
    if (value === "") fail(`--${name} must be non-empty`, "INVALID_ARGUMENT");
    values[name] = value;
  }
  for (const name of ["root", "tasks-root", "out"]) {
    if (values[name] === undefined) fail(`--${name} is required`, "INVALID_ARGUMENT");
    if (!isAbsolute(values[name])) fail(`--${name} must be an absolute path`, "INVALID_ARGUMENT");
  }
  if (values.now !== undefined && !Number.isFinite(Date.parse(values.now))) {
    fail("--now must be an ISO-compatible timestamp", "INVALID_ARGUMENT");
  }
  return {
    root: resolve(values.root),
    tasksRoot: resolve(values["tasks-root"]),
    out: resolve(values.out),
    now: values.now ?? new Date().toISOString(),
  };
}

function statOf(path) {
  try { return lstatSync(path); }
  catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
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
    const stat = statOf(cursor);
    if (!stat) return;
    if (stat.isSymbolicLink()) fail(`${label} contains a symlink: ${cursor}`);
    if (cursor !== candidate && !stat.isDirectory()) fail(`${label} contains a non-directory ancestor: ${cursor}`);
  }
}

function requireRealDirectory(path, label, trustedRoot = null) {
  if (trustedRoot !== null) assertTrustedPath(trustedRoot, path, label);
  const stat = statOf(path);
  if (!stat) fail(`${label} does not exist: ${path}`);
  if (stat.isSymbolicLink() || !stat.isDirectory()) fail(`${label} must be a real directory: ${path}`);
}

function optionalRealDirectory(path, label, trustedRoot = null) {
  if (trustedRoot !== null) assertTrustedPath(trustedRoot, path, label);
  const stat = statOf(path);
  if (!stat) return false;
  if (stat.isSymbolicLink() || !stat.isDirectory()) fail(`${label} must be a real directory: ${path}`);
  return true;
}

function safeRef(ref) {
  return typeof ref === "string" && SAFE_REF.test(ref) ? ref : null;
}

function availableRef(taskRoot, ref, storageRoot) {
  const lexicalRef = safeRef(ref);
  if (lexicalRef === null) return null;
  const path = join(taskRoot, ...lexicalRef.split("/"));
  assertTrustedPath(storageRoot, path, "evidence reference");
  const stat = statOf(path);
  return stat && stat.isFile() && !stat.isSymbolicLink() ? lexicalRef : null;
}

function authenticatedConfirmation(taskRoot, storageRoot, project, taskId, stage, intervention, nowMs) {
  const ref = intervention?.confirmation_ref;
  if (typeof ref !== "string" || !CONFIRMATION_REF.test(ref)) return null;
  const path = join(taskRoot, ...ref.split("/"));
  try {
    assertTrustedPath(storageRoot, path, "confirmation reference");
    const stat = statOf(path);
    if (!stat || stat.isSymbolicLink() || !stat.isFile()) return null;
    const raw = readFileSync(path, "utf8");
    const expectedHash = ref.slice("quality/confirmations/".length, -".json".length);
    if (createHash("sha256").update(raw).digest("hex") !== expectedHash) return null;
    const value = JSON.parse(raw);
    const subject = value.schema_version === "human-confirmation.v1" ? value.attempt_ref : value.schema_version === "human-confirmation.v3" ? intervention.step_slug : undefined;
    validateHumanConfirmation(value, { taskId, stage, subject });
    const confirmedMs = Date.parse(value.confirmed_at ?? "");
    if (typeof value.confirmed_at !== "string" || !/T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(value.confirmed_at)
        || !Number.isFinite(confirmedMs) || confirmedMs < nowMs - WINDOW_MS || confirmedMs > nowMs) return null;
    if (value.schema_version === "human-confirmation.v3") {
      const step = value.step_slug ?? value.subject_ref;
      if (typeof step !== "string" || step.trim() === "" || (intervention.step_slug !== undefined && step !== intervention.step_slug)) return null;
    }
    return { ref, sha256: expectedHash, value };
  } catch {
    return null;
  }
}

function availableLessonRef(root, project, ref) {
  if (!SAFE_LESSON_REF.test(ref)) return null;
  const [, stage, entryId] = ref.match(SAFE_LESSON_REF);
  const path = join(root, "Projects", project, "lessons", `${stage}.jsonl`);
  assertTrustedPath(root, path, "lesson reference");
  const stat = statOf(path);
  if (!stat || stat.isSymbolicLink() || !stat.isFile()) return null;
  try {
    const found = readFileSync(path, "utf8").split(/\r?\n/).some((line) => {
      if (line.trim() === "") return false;
      try {
        const value = JSON.parse(line);
        return value?.entry_id === entryId && value?.entry_kind === "merged_lesson";
      } catch {
        return false;
      }
    });
    return found ? ref : null;
  } catch {
    return null;
  }
}

function availableLessonOrQualityRef(root, project, taskRoot, ref) {
  return availableRef(taskRoot, ref, root) ?? availableLessonRef(root, project, ref);
}

function parseJson(path, label) {
  let raw;
  try { raw = readFileSync(path, "utf8"); }
  catch (error) { return { ok: false, error: `${label} unavailable: ${error.message}` }; }
  try { return { ok: true, raw, value: JSON.parse(raw) }; }
  catch (error) { return { ok: false, error: `${label} invalid JSON: ${error.message}` }; }
}

function isDateTime(value) {
  if (typeof value !== "string") return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(Z|[+-]\d{2}:\d{2})$/.exec(value);
  if (!match) return false;
  const [, year, month, day, hour, minute, second, zone] = match;
  const monthNumber = Number(month);
  if (monthNumber < 1 || monthNumber > 12 || Number(day) < 1 || Number(day) > new Date(Date.UTC(Number(year), monthNumber, 0)).getUTCDate()
    || Number(hour) > 23 || Number(minute) > 59 || Number(second) > 59) return false;
  if (zone !== "Z" && (Number(zone.slice(1, 3)) > 23 || Number(zone.slice(4, 6)) > 59)) return false;
  return Number.isFinite(Date.parse(value));
}

function dateMs(value) {
  const parsed = Date.parse(value ?? "");
  return Number.isFinite(parsed) ? parsed : null;
}

function stateForReflection(reflection, nowMs) {
  const generatedMs = dateMs(reflection.generated_at);
  if (generatedMs !== null && (generatedMs < nowMs - WINDOW_MS || generatedMs > nowMs)) return "stale";
  return reflection.status;
}

function judgmentCounts(judgments) {
  return Object.fromEntries(CLASSIFICATIONS.map((classification) => [
    classification,
    judgments.filter((judgment) => judgment.classification === classification).length,
  ]));
}

function normalizedJudgment(judgment, taskRoot, storageRoot) {
  const evidenceRefs = (Array.isArray(judgment.evidence_refs) ? judgment.evidence_refs : []).map((ref) => {
    const availableRefValue = availableRef(taskRoot, ref, storageRoot);
    return {
      ref,
      safe_ref: availableRefValue,
      state: availableRefValue ? "available" : "unavailable",
    };
  });
  return {
    subject_id: judgment.subject_id,
    subject_kind: judgment.subject_kind,
    classification: judgment.classification,
    severity: judgment.severity,
    reason: judgment.reason,
    evidence_refs: evidenceRefs,
    confidence: judgment.confidence,
    next_review_trigger: judgment.next_review_trigger,
    judgment_layer: "judgment",
    is_fact: false,
  };
}

function normalizedIntervention(intervention) {
  return {
    confirmation_ref: intervention.confirmation_ref,
    step_slug: intervention.step_slug,
    reply_text: intervention.reply_text ?? null,
    reply_state: intervention.reply_text ? "available" : "unknown",
    attribution: intervention.attribution,
    confidence: intervention.confidence,
    judgment_layer: "judgment",
    is_fact: false,
  };
}

function readReflection(root, project, taskRoot, taskId, stage, filename, nowMs) {
  const ref = `quality/stage-reflection/${filename}`;
  const path = join(taskRoot, ...ref.split("/"));
  assertTrustedPath(root, path, `reflection ${ref}`);
  const parsed = parseJson(path, `reflection ${ref}`);
  if (!parsed.ok) return { stage, state: "unavailable", reflection_status: null, error: { summary: parsed.error }, judgments: [], interventions: [], lessons_added: [] };
  const value = parsed.value;
  const validator = value?.schema_version === "stage-reflection.v2" ? validateSchemaV2 : validateSchema;
  if (!validator(value)) {
    return {
      stage,
      state: "unavailable",
      reflection_status: null,
      error: { summary: `reflection ${ref} does not satisfy ${value?.schema_version === "stage-reflection.v2" ? "stage-reflection.v2" : "stage-reflection.v1"}` },
      judgments: [],
      interventions: [],
      lessons_added: [],
    };
  }
  if (value.task_id !== taskId || value.stage !== stage) {
    return {
      stage,
      state: "unavailable",
      reflection_status: null,
      error: { summary: `reflection ${ref} identity does not match its task or stage` },
      judgments: [],
      interventions: [],
      lessons_added: [],
    };
  }
  const state = stateForReflection(value, nowMs);
  return {
    stage,
    state,
    stage_status: value.stage_status,
    reflection_status: value.status,
    generated_at: value.generated_at,
    error: value.error,
    judgments: value.judgments.map((judgment) => normalizedJudgment(judgment, taskRoot, root)),
    interventions: value.interventions.map(normalizedIntervention),
    lessons_added: value.lessons_added.map((entry) => {
      const availableRefValue = availableLessonOrQualityRef(root, project, taskRoot, entry);
      return { ref: entry, safe_ref: availableRefValue, state: availableRefValue ? "available" : "unavailable" };
    }),
    judgment_counts: judgmentCounts(value.judgments),
    judgment_layer: "judgment",
    is_fact: false,
    reflection_ref: ref,
    input_sha256: createHash("sha256").update(parsed.raw).digest("hex"),
  };
}

function readAvailabilityFact(root, taskRoot, taskId, stage, nowMs) {
  const directory = join(taskRoot, "quality", "evidence", "stage-reflection-availability");
  if (!optionalRealDirectory(directory, "stage reflection availability directory", root)) return null;
  const facts = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (!entry.isFile() || entry.isSymbolicLink() || !HASHED_JSON.test(entry.name)) continue;
    const path = join(directory, entry.name);
    try {
      const raw = readFileSync(path, "utf8");
      if (createHash("sha256").update(raw).digest("hex") !== entry.name.slice(0, -5)) continue;
      const value = JSON.parse(raw);
      if (value?.schema_version !== "stage-reflection-availability.v1"
        || value.record_kind !== "availability"
        || value.task_id !== taskId
        || value.stage !== stage
        || !AVAILABILITY_STATES.has(value.state)
        || !AVAILABILITY_REASONS_BY_STATE[value.state]?.has(value.reason_code)
        || value.task_identity?.task_id !== taskId
        || !Number.isFinite(Date.parse(value.observed_at))
        || Date.parse(value.observed_at) > nowMs
        || !validateAvailabilityFact(value)) continue;
      facts.push({ ...value, ref: `quality/evidence/stage-reflection-availability/${entry.name}` });
    } catch {
      // Malformed availability facts are unavailable evidence, not a reason
      // to infer a state for the stage.
    }
  }
  return facts.sort((left, right) => Date.parse(right.observed_at) - Date.parse(left.observed_at) || right.ref.localeCompare(left.ref))[0] ?? null;
}

function hasValidStageOutcome(root, taskRoot, taskId, stage, nowMs) {
  const directory = join(taskRoot, "quality", "evidence", "stage-outcomes", stage);
  if (!optionalRealDirectory(directory, `stage outcomes for ${stage}`, root)) return false;
  return readdirSync(directory, { withFileTypes: true }).some((entry) => {
    if (!entry.isFile() || entry.isSymbolicLink() || !HASHED_JSON.test(entry.name)) return false;
    try {
      const raw = readFileSync(join(directory, entry.name), "utf8");
      if (createHash("sha256").update(raw).digest("hex") !== entry.name.slice(0, -5)) return false;
      const value = JSON.parse(raw);
      validateStageOutcomeStructure(value, { taskId, stage });
      const generatedMs = Date.parse(value.generated_at ?? "");
      return value.generated_at === undefined || (Number.isFinite(generatedMs) && generatedMs <= nowMs);
    } catch {
      return false;
    }
  });
}

function missingStage(root, taskRoot, taskId, stage, stageIndex, outcomeByStage, nowMs) {
  const availability = readAvailabilityFact(root, taskRoot, taskId, stage, nowMs);
  if (availability) {
    return {
      stage,
      state: availability.state,
      stage_status: null,
      reflection_status: availability.state,
      generated_at: availability.observed_at,
      error: null,
      judgments: [],
      interventions: [],
      lessons_added: [],
      judgment_counts: judgmentCounts([]),
      judgment_layer: "fact",
      is_fact: true,
      reflection_ref: null,
      availability_fact: availability,
    };
  }
  const laterOutcome = STAGES.slice(stageIndex + 1).some((laterStage) => outcomeByStage.get(laterStage));
  const currentOutcome = outcomeByStage.get(stage);
  const state = !currentOutcome && laterOutcome ? "not_scheduled" : "unknown";
  const inferred = state === "not_scheduled";
  return {
    stage,
    state,
    stage_status: null,
    reflection_status: state,
    generated_at: null,
    error: null,
    judgments: [],
    interventions: [],
    lessons_added: [],
    judgment_counts: judgmentCounts([]),
    judgment_layer: "judgment",
    is_fact: false,
    reflection_ref: null,
    availability_fact: null,
  };
}

function readTask(root, project, taskRoot, taskId, nowMs) {
  assertTrustedPath(root, taskRoot, "task path");
  const reflectionRoot = join(taskRoot, "quality", "stage-reflection");
  let files = [];
  if (optionalRealDirectory(reflectionRoot, "stage-reflection directory", root)) {
    files = readdirSync(reflectionRoot, { withFileTypes: true })
      .filter((entry) => entry.isFile() && !entry.isSymbolicLink() && REFLECTION_FILE.test(entry.name))
      .map((entry) => entry.name)
      .sort();
  }
  const byStage = new Map(files.map((filename) => [filename.slice(0, -5), readReflection(root, project, taskRoot, taskId, filename.slice(0, -5), filename, nowMs)]));
  const outcomeByStage = new Map(STAGES.map((stage) => [stage, hasValidStageOutcome(root, taskRoot, taskId, stage, nowMs)]));
  const stages = STAGES.map((stage, index) => byStage.get(stage) ?? missingStage(root, taskRoot, taskId, stage, index, outcomeByStage, nowMs));
  const generated = stages.map((stage) => stage.generated_at).filter(Boolean).sort().at(-1) ?? null;
  return {
    task_id: taskId,
    state: stages.some((stage) => stage.state === "unavailable")
      ? "unavailable"
      : stages.some((stage) => stage.state === "failed")
        ? "failed"
        : stages.some((stage) => stage.state === "degraded")
          ? "degraded"
          : files.length === 0
            ? stages.some((stage) => stage.state === "not_scheduled") ? "not_scheduled" : "empty"
            : "ready",
    generated_at: generated,
    coverage: { present: files.length, total: STAGES.length },
    stages,
    judgment_layer: "judgment",
    is_fact: false,
  };
}

function readLessons(root, project, diagnostics) {
  const lessonsRoot = join(root, "Projects", project, "lessons");
  const byStage = Object.fromEntries(STAGES.map((stage) => [stage, []]));
  if (!optionalRealDirectory(lessonsRoot, "lessons directory", root)) return { by_stage: byStage, count: 0 };
  for (const entry of readdirSync(lessonsRoot, { withFileTypes: true })) {
    if (!entry.isFile() || entry.isSymbolicLink() || !entry.name.endsWith(".jsonl")) continue;
    const stage = entry.name.slice(0, -6);
    if (!STAGES.includes(stage)) continue;
    const path = join(lessonsRoot, entry.name);
    const lines = readFileSync(path, "utf8").split(/\r?\n/).filter((line) => line.trim() !== "");
    for (let index = 0; index < lines.length; index += 1) {
      try {
        const value = JSON.parse(lines[index]);
        if (!value || typeof value !== "object" || !["raw_observation", "merged_lesson"].includes(value.entry_kind)) throw new Error("unsupported lesson entry_kind");
        const taskIds = [...new Set([
          ...(typeof value.task_id === "string" ? [value.task_id] : []),
          ...(Array.isArray(value.source_refs) ? value.source_refs.map((source) => source?.task_id).filter((taskId) => typeof taskId === "string") : []),
        ])];
        byStage[stage].push({
          ...value,
          lesson_ref: typeof value.entry_id === "string" && /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(value.entry_id)
            ? `lessons/${stage}.jsonl#${value.entry_id}`
            : null,
          task_ids: taskIds,
          judgment_layer: "fact",
          is_fact: true,
        });
      } catch (error) {
        diagnostics.push({ state: "unavailable", summary: `lesson ${entry.name}:${index + 1} unavailable: ${error.message}` });
      }
    }
  }
  return { by_stage: byStage, count: Object.values(byStage).reduce((sum, entries) => sum + entries.length, 0) };
}

function historicalReferenceCandidates(lessons) {
  return Object.values(lessons.by_stage).flat()
    .filter((entry) => entry.entry_kind === "merged_lesson" && entry.historical_replay === true)
    .map((entry) => {
      const sourceRefs = Array.isArray(entry.evidence_refs) ? entry.evidence_refs.filter((ref) => typeof ref === "string" && !ref.includes("#")) : [];
      const sourceId = `${entry.stage}\0${entry.entry_id}\0${entry.task_id ?? "unknown"}`;
      const candidateHash = createHash("sha256").update(sourceId).digest("hex");
      const observedAt = entry.merged_at ?? entry.source_generated_at ?? entry.imported_at ?? null;
      const sourceObservation = {
        task_id: entry.task_id ?? "unknown",
        stage: entry.stage,
        entry_id: entry.entry_id,
        occurred_at: observedAt,
        historical_replay: true,
        evidence_refs: sourceRefs,
        lesson_ref: entry.lesson_ref ?? null,
      };
      return {
        schema_version: "workflow-evolution.v1",
        record_kind: "candidate",
        candidate_id: `historical-replay.v1:${candidateHash}`,
        candidate_group_id: `historical-replay.v1:${candidateHash}`,
        tier: "reference_only",
        lifecycle_status: "open",
        row_status: "active",
        freshness: "stale",
        evidence_status: sourceRefs.length > 0 ? "complete" : "unavailable",
        sample_status: "insufficient_samples",
        validation_status: "unverified",
        classification: "needs_evidence",
        severity: ["high", "medium", "low"].includes(entry.severity) ? entry.severity : "medium",
        confidence: "low",
        frequency: 1,
        first_seen: observedAt,
        recent_seen: observedAt,
        judgment_layer: "fact",
        is_fact: true,
        historical_replay: true,
        reference_only_reason: "历史回放仅供参考，不进入 action_suggested、质量税分母或当前趋势。",
        source_refs: sourceRefs,
        source_observations: [sourceObservation],
        lesson: entry.lesson ?? null,
      };
    });
}

function runDeriveConsumptionEdges(root, now) {
  const script = fileURLToPath(new URL("./derive-consumption-edges.mjs", import.meta.url));
  // The derived edge report is a complete audit projection. On real task stores
  // it can exceed Node's 1 MiB spawnSync default even though the child exits
  // successfully; keep the report lossless instead of turning it into ENOBUFS.
  const result = spawnSync(process.execPath, [script, `--root=${root}`, `--now=${now}`], {
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
  });
  if (result.error) fail(`derive-consumption-edges failed to start: ${result.error.message}`);
  if (result.status !== 0) fail(`derive-consumption-edges failed: ${result.stdout || result.stderr}`.trim());
  try {
    const value = JSON.parse(result.stdout);
    if (value?.status === "failed") fail(value.error?.summary ?? "derive-consumption-edges failed");
    if (value?.schema_version !== "consumption-edges.v1") fail("derive-consumption-edges returned an unexpected schema");
    return value;
  } catch (error) {
    fail(`derive-consumption-edges returned invalid JSON: ${error.message}`);
  }
}

function authorityForTarget(project, stageSlug, judgment) {
  const hashFile = (ref) => createHash("sha256").update(readFileSync(join(repositoryRoot, ref))).digest("hex");
  const manifestRef = `workflows/${stageSlug}/steps.json`;
  const manifest = JSON.parse(readFileSync(join(repositoryRoot, manifestRef), "utf8"));
  const manifestHash = hashFile(manifestRef);
  const moveMapRef = "docs/architecture/move-map.json";
  const moveMap = JSON.parse(readFileSync(join(repositoryRoot, moveMapRef), "utf8"));
  const catalogRef = "skills/catalog.yaml";
  const catalog = readFileSync(join(repositoryRoot, catalogRef), "utf8");
  const skills = [...catalog.matchAll(/^\s*- name:\s*([^\s#]+)[\s\S]*?^\s*local_version:\s*([^\s#]+)/gm)].map((match) => ({ id: match[1], version: match[2].replaceAll('"', ""), authority: catalogRef, authority_sha256: hashFile(catalogRef) }));
  const authorities = {
    stages: [{ stage: stageSlug, version: manifest.schema_version, authority: manifestRef, authority_sha256: manifestHash }],
    steps: (manifest.steps ?? []).map((entry) => ({ slug: entry.step_slug, version: manifest.schema_version, authority: manifestRef, authority_sha256: manifestHash })),
    skills,
    surfaces: (moveMap.moves ?? moveMap.entries ?? []).flatMap((entry) => [entry.source, entry.destination].filter(Boolean).map((id) => ({ id, version: moveMap.schema_version ?? "1", authority: moveMapRef, authority_sha256: hashFile(moveMapRef) }))),
  };
  return resolveTargetRef({ projectId: project, targetKind: judgment.subject_kind, targetId: judgment.subject_id, authorities });
}

function projectOverall(tasks, nowMs) {
  const scoped = new Map();
  for (const task of tasks) {
    for (const stage of task.stages) {
      const stageTime = dateMs(stage.generated_at);
      if (stageTime === null || stageTime < nowMs - WINDOW_MS || stageTime > nowMs) continue;
      for (const judgment of stage.judgments) {
        if (judgment.classification === "keep") continue;
        const key = `${task.task_id}\0${stage.stage}\0${judgment.subject_kind}\0${judgment.subject_id}\0${judgment.classification}`;
        const prior = scoped.get(key);
        if (!prior || SEVERITY_WEIGHT[judgment.severity] > SEVERITY_WEIGHT[prior.judgment.severity]) {
          scoped.set(key, { task_id: task.task_id, stage: stage.stage, generated_at: stage.generated_at, judgment });
        }
      }
    }
  }
  const grouped = new Map();
  for (const item of scoped.values()) {
    const key = `${item.judgment.subject_kind}\0${item.judgment.subject_id}\0${item.judgment.classification}`;
    const prior = grouped.get(key) ?? {
      subject_id: item.judgment.subject_id,
      subject_kind: item.judgment.subject_kind,
      classification: item.judgment.classification,
      reason: item.judgment.reason,
      severity: item.judgment.severity,
      frequency: 0,
      score: 0,
      first_seen: item.generated_at,
      recent_seen: item.generated_at,
      source_task_stages: [],
      suggested_action: item.judgment.classification,
      judgment_layer: "judgment",
      is_fact: false,
    };
    prior.frequency += 1;
    prior.score += SEVERITY_WEIGHT[item.judgment.severity] ?? 0;
    prior.source_task_stages.push({ task_id: item.task_id, stage: item.stage });
    if (item.generated_at < prior.first_seen) prior.first_seen = item.generated_at;
    if (item.generated_at > prior.recent_seen) {
      prior.recent_seen = item.generated_at;
      prior.reason = item.judgment.reason;
    }
    if ((SEVERITY_WEIGHT[item.judgment.severity] ?? 0) > (SEVERITY_WEIGHT[prior.severity] ?? 0)) prior.severity = item.judgment.severity;
    grouped.set(key, prior);
  }
  return [...grouped.values()]
    .map((entry) => ({ ...entry, source_task_stages: entry.source_task_stages.sort((a, b) => `${a.task_id}\0${a.stage}`.localeCompare(`${b.task_id}\0${b.stage}`)) }))
    .sort((left, right) => right.score - left.score || right.frequency - left.frequency || right.recent_seen.localeCompare(left.recent_seen) || `${left.subject_kind}\0${left.subject_id}`.localeCompare(`${right.subject_kind}\0${right.subject_id}`));
}

function project({ root, tasksRoot, now }) {
  requireRealDirectory(root, "storage root", root);
  const rel = relative(root, tasksRoot);
  const parts = rel.split("/");
  if (parts.length !== 3 || parts[0] !== "Projects" || parts[2] !== "tasks") fail("--tasks-root must be <root>/Projects/<project>/tasks");
  requireRealDirectory(tasksRoot, "tasks root", root);
  const project = parts[1];
  if (!SAFE_SEGMENT.test(project)) fail("project must be one safe path segment");
  const nowMs = Date.parse(now);
  const diagnostics = [];
  const tasks = readdirSync(tasksRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.isSymbolicLink())
    .map((entry) => entry.name)
    .filter((taskId) => SAFE_SEGMENT.test(taskId))
    .sort((a, b) => a.localeCompare(b))
      .map((taskId) => readTask(root, project, join(tasksRoot, taskId), taskId, nowMs));
  const lessons = readLessons(root, project, diagnostics);
  const historicalCandidates = historicalReferenceCandidates(lessons);
  for (const task of tasks) {
    const referencedReflectionRefs = new Map(task.stages.map((stage) => [
      stage.stage,
      new Set(stage.lessons_added.filter((entry) => entry.safe_ref).map((entry) => entry.safe_ref)),
    ]));
    task.lessons = Object.values(lessons.by_stage).flat().filter((entry) => {
      if (!(entry.task_ids ?? [entry.task_id]).includes(task.task_id)) return false;
      const refs = referencedReflectionRefs.get(entry.stage) ?? new Set();
      const defaultRef = `quality/stage-reflection/${entry.stage}.json`;
      return refs.has(entry.lesson_ref)
        || refs.has(entry.reflection_ref)
        || refs.has(defaultRef);
    });
  }
  const derived = runDeriveConsumptionEdges(root, now);
  const taskEdges = derived.tasks
    .filter((entry) => entry.project === project)
    .flatMap((entry) => (entry.edges ?? []).map((edge) => ({ ...edge, project, task_id: entry.task_id })));
  const taskDiagnostics = derived.tasks.filter((entry) => entry.project === project).flatMap((entry) => entry.diagnostics ?? []);
  diagnostics.push(...taskDiagnostics.map((entry) => ({ state: "unavailable", summary: entry.reason ?? "consumption edge diagnostic" })));
  const hasUnavailable = diagnostics.length > 0 || tasks.some((task) => task.state === "unavailable");
  const status = tasks.length === 0 ? "empty" : hasUnavailable ? "degraded" : "ok";
  const observations = [];
  const interventions = [];
  const authorityErrors = [];
  const unverifiedJudgments = [];
  const materialIdentities = ["skills/catalog.yaml", "docs/architecture/move-map.json"].map((ref) => ({
    ref,
    sha256: createHash("sha256").update(readFileSync(join(repositoryRoot, ref))).digest("hex"),
  }));
  for (const task of tasks) {
    for (const stage of task.stages) {
      const stageTime = dateMs(stage.generated_at);
      // Only the current 30-day window is eligible for the live evolution
      // snapshot. Old and future reflections remain visible as page facts but
      // cannot affect candidate or quality-tax projections.
      if (stageTime === null || stageTime < nowMs - WINDOW_MS || stageTime > nowMs) continue;
      if (stage.reflection_ref && stage.input_sha256) materialIdentities.push({ ref: `${task.task_id}/${stage.reflection_ref}`, sha256: stage.input_sha256 });
      const taskRoot = join(tasksRoot, task.task_id);
      const authenticatedInterventions = stage.interventions.map((entry) => ({
        entry,
        confirmation: authenticatedConfirmation(taskRoot, root, project, task.task_id, stage.stage, entry, nowMs),
      }));
      for (const { confirmation } of authenticatedInterventions) {
        if (confirmation?.ref && confirmation.sha256) materialIdentities.push({ ref: `${task.task_id}/${confirmation.ref}`, sha256: confirmation.sha256 });
      }
      for (const judgment of stage.judgments) {
        const resolved = authorityForTarget(project, stage.stage, judgment);
        if (resolved.status !== "ok") { authorityErrors.push({ task_id: task.task_id, stage: stage.stage, subject_id: judgment.subject_id, status: resolved.status }); continue; }
        const authenticated = authenticatedInterventions.find(({ entry, confirmation }) => entry.step_slug === judgment.subject_id && confirmation)?.confirmation ?? null;
        if (!authenticated) {
          unverifiedJudgments.push({ task_id: task.task_id, stage: stage.stage, subject_id: judgment.subject_id, subject_kind: judgment.subject_kind });
          continue;
        }
        const safeConfirmationRef = authenticated.ref;
        const confirmationSha256 = authenticated.sha256;
        observations.push({ task_id: task.task_id, stage: stage.stage, confirmation_ref: safeConfirmationRef, confirmation_sha256: confirmationSha256, human_confirmation: safeConfirmationRef && confirmationSha256 ? { ref: safeConfirmationRef, sha256: confirmationSha256 } : null, occurred_at: stage.generated_at ?? now, target_ref: resolved.target_ref, intervention_kind: judgment.classification, intervention_payload: { reason: judgment.reason ?? "" }, classification: judgment.classification, severity: judgment.severity, confidence: judgment.confidence, evidence_refs: judgment.evidence_refs, material_identities: materialIdentities.filter((entry) => entry.ref.startsWith(`${task.task_id}/`)) });
      }
      for (const intervention of stage.interventions ?? []) {
        const confirmation = authenticatedConfirmation(taskRoot, root, project, task.task_id, stage.stage, intervention, nowMs);
        interventions.push({ project, task_id: task.task_id, confirmation_ref: confirmation?.ref ?? intervention.confirmation_ref ?? null, confirmation_sha256: confirmation?.sha256 ?? null, intervention_stage: stage.stage, step_slug: intervention.step_slug, occurred_at: stage.generated_at ?? now, primary_attribution_stage: intervention.attribution });
      }
    }
  }
  let evolution = {
    schema_version: "workflow-evolution.v1",
    status: "unavailable",
    candidates: historicalCandidates,
    quality_tax: { status: "unavailable", label: "未验证，待真实任务数据" },
    regions: {
      summary_status: "unavailable",
      action_suggested: { status: "unavailable", reason: "候选快照不可用" },
      reference_only: { status: "unavailable", reason: "候选快照不可用" },
      quality_tax: { status: "unavailable", reason: "质量税投影不可用" },
    },
    diagnostics: [{ summary: "evolution snapshot unavailable" }],
  };
  try {
    if (authorityErrors.length > 0) throw new Error(`target authority resolution failed: ${JSON.stringify(authorityErrors)}`);
    const consumerProofs = derived.tasks.filter((entry) => entry.project === project).map((entry) => entry.consumer_scan_proof).filter((proof) => proof?.coverage_status === "complete" && Array.isArray(proof.registered_output_refs) && proof.registered_output_refs.length > 0 && Array.isArray(proof.source_refs) && proof.source_refs.length > 0);
    const producerIdentity = { ref: "runtime/evidence/workflow-evolution.mjs", sha256: createHash("sha256").update(readFileSync(join(repositoryRoot, "runtime/evidence/workflow-evolution.mjs"))).digest("hex") };
    const schemaIdentity = { ref: "runtime/schemas/workflow-evolution.v1.json", sha256: createHash("sha256").update(readFileSync(join(repositoryRoot, "runtime/schemas/workflow-evolution.v1.json"))).digest("hex") };
    const inventory = buildInputInventory({ project, producerIdentity, schemaIdentity, inventory: { observations, consumer_proofs: consumerProofs, material_identities: materialIdentities } });
    const refresh = refreshEvolutionSnapshot({ storageRoot: root, project, attemptId: `monitor-${randomUUID()}`, inventory, now });
    const tax = computeQualityTaxProjection({ storageRoot: root, inventory: inventory.inventory, interventions, asOf: now });
    if (refresh.status === "ok") {
      const projection = readCurrentEvolutionProjection({ storageRoot: root, project, expectedIdentity: { snapshot_id: refresh.snapshot_id, producer_identity: producerIdentity, schema_identity: schemaIdentity }, taxProjection: tax, sourceInventoryHash: inventory.input_inventory_hash, asOf: now, refreshResult: refresh.refresh_result });
      if (projection.status !== "ok") throw new Error(projection.error?.summary ?? "evolution projection unavailable");
      const unverifiedDiagnostics = unverifiedJudgments.length > 0
        ? [{ state: "unverified", summary: `${unverifiedJudgments.length} 条判断缺少与 subject 对应的有效人工确认，未进入候选快照。`, judgments: unverifiedJudgments }]
        : [];
      const regions = unverifiedJudgments.length > 0
        ? {
          ...projection.regions,
          summary_status: projection.regions.summary_status === "ok" ? "partial" : projection.regions.summary_status,
          reference_only: {
            ...projection.regions.reference_only,
            status: projection.regions.reference_only.status === "ok" || projection.regions.reference_only.status === "empty" ? "unverified" : projection.regions.reference_only.status,
            reason: `${projection.regions.reference_only.reason ?? ""}${projection.regions.reference_only.reason ? "；" : ""}存在未绑定人工确认的判断`,
          },
        }
        : projection.regions;
      const candidates = [...projection.candidates, ...historicalCandidates];
      const referenceRegion = historicalCandidates.length > 0
        ? { ...regions.reference_only, status: "stale", historical_count: historicalCandidates.length, reason: "含历史回放，仅供参考，不进入质量税或当前趋势。" }
        : regions.reference_only;
      const mixedRegions = historicalCandidates.length > 0
        ? { ...regions, reference_only: referenceRegion, summary_status: regions.summary_status === "ok" ? "partial" : regions.summary_status }
        : regions;
      evolution = { ...projection, candidates, regions: mixedRegions, snapshot_content_id: inventory.input_inventory_hash, unverified_judgments: unverifiedJudgments, diagnostics: unverifiedDiagnostics, historical_replay_count: historicalCandidates.length };
    } else {
      evolution = { ...evolution, status: refresh.status, diagnostics: [refresh.error ?? { summary: "refresh failed" }], unverified_judgments: unverifiedJudgments };
    }
  } catch (error) {
    evolution = { ...evolution, status: "unavailable", diagnostics: [{ summary: error.message }] };
  }
  return {
    schema_version: "workflowhub-reflection-page.v1",
    generated_at: now,
    status,
    state: status,
    project,
    judgment_layer: {
      record_kind: "judgment",
      label: "判断层",
      description: "LLM 复盘归因，不是机器事实，也不等于质量裁决。",
      is_fact: false,
    },
    states: ["unknown", "unavailable", "not_scheduled", "degraded", "failed", "error", "empty", "fatal", "partial", "stale", "insufficient_samples", "unverified"],
    coverage: {
      tasks: tasks.length,
      reflections: tasks.reduce((sum, task) => sum + task.coverage.present, 0),
      lessons: lessons.count,
    },
    filters: {
      tasks: tasks.map((task) => task.task_id),
      stages: STAGES,
      classifications: CLASSIFICATIONS,
    },
    tasks,
    overall_pending: projectOverall(tasks, nowMs),
    evolution,
    lessons,
    consumption_edges: taskEdges,
    diagnostics,
    source: {
      project,
      tasks_root: "Projects/<project>/tasks",
      lessons_root: "Projects/<project>/lessons",
      derived_by: "tools/cli/derive-consumption-edges.mjs",
      ai_used: false,
    },
  };
}

function outputPaths(out) {
  if (extname(out).toLowerCase() === ".html") return { directory: dirname(out), html: out, data: join(dirname(out), "data.js") };
  return { directory: out, html: join(out, "workflowhub-monitor.html"), data: join(out, "data.js") };
}

function fatalData(error, now) {
  return {
    schema_version: "workflowhub-reflection-page.v1",
    generated_at: now,
    status: "fatal",
    state: "fatal",
    judgment_layer: { record_kind: "judgment", label: "判断层", description: "投影失败，未展示陈旧数据。", is_fact: false },
    states: ["unknown", "unavailable", "not_scheduled", "degraded", "failed", "error", "empty", "fatal", "partial", "stale", "insufficient_samples", "unverified"],
    coverage: { tasks: 0, reflections: 0, lessons: 0 },
    filters: { tasks: [], stages: STAGES, classifications: CLASSIFICATIONS },
    tasks: [],
    overall_pending: [],
    lessons: { by_stage: Object.fromEntries(STAGES.map((stage) => [stage, []])), count: 0 },
    consumption_edges: [],
    diagnostics: [{ state: "fatal", summary: error.message }],
    source: { ai_used: false },
  };
}

function writePage(paths, data) {
  mkdirSync(paths.directory, { recursive: true });
  // data.js is embedded as a classic script by the static page. Escape the
  // opening angle bracket so an LLM-derived value cannot terminate that script
  // with a literal </script> sequence.
  const serializedData = JSON.stringify(data, null, 2).replaceAll("<", "\\u003c");
  const dataSource = `globalThis.__WH_MONITOR_DATA__ = Object.freeze(${serializedData});\n`;
  const htmlSource = template.replace("<!-- __WH_MONITOR_DATA_SCRIPT__ -->", `<script>\n${dataSource}</script>`);
  if (htmlSource === template) fail("reflection page template is missing the data script placeholder");
  const writeAtomic = (path, source) => {
    const temporary = `${path}.tmp-${randomUUID()}`;
    try { writeFileSync(temporary, source, "utf8"); renameSync(temporary, path); }
    finally { try { unlinkSync(temporary); } catch (error) { if (error?.code !== "ENOENT") throw error; } }
  };
  // Keep data.js for tooling compatibility, while the HTML embeds the exact
  // same snapshot so a partial two-file update can never change what the page
  // renders.
  writeAtomic(paths.data, dataSource);
  writeAtomic(paths.html, htmlSource);
  return paths;
}

export function buildReflectionPage(options) {
  const data = project(options);
  const paths = outputPaths(resolve(options.out));
  writePage(paths, data);
  return { ...paths, data };
}

function main() {
  let options = null;
  let paths = null;
  try {
    options = parseArgs(process.argv.slice(2));
    paths = outputPaths(options.out);
    const result = buildReflectionPage(options);
    console.log(JSON.stringify({ status: result.data.status, html: result.html, data: result.data }));
  } catch (error) {
    const requestedOut = process.argv.slice(2).find((argument) => argument.startsWith("--out="))?.slice("--out=".length);
    if (!paths && requestedOut && isAbsolute(requestedOut)) paths = outputPaths(resolve(requestedOut));
    if (paths) writePage(paths, fatalData(error, options?.now ?? new Date().toISOString()));
    console.log(JSON.stringify({ status: "fatal", ...(paths ? { html: paths.html, data: paths.data } : {}), error: { summary: error.message } }));
    process.exitCode = 1;
  }
}

if (import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main();

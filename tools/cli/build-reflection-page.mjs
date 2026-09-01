#!/usr/bin/env node

import Ajv from "ajv";
import { spawnSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, extname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { buildInputInventory, computeQualityTaxProjection, readCurrentEvolutionProjection, refreshEvolutionSnapshot, resolveTargetRef } from "../../runtime/evidence/workflow-evolution.mjs";
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
const schema = JSON.parse(readFileSync(new URL("../../runtime/schemas/stage-reflection.v1.json", import.meta.url), "utf8"));
const validateSchema = new Ajv({ allErrors: true, strict: false }).compile(schema);
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

function authenticatedConfirmation(taskRoot, storageRoot, project, taskId, stage, intervention) {
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
    const subject = value.schema_version === "human-confirmation.v1" ? value.attempt_ref : intervention.step_slug;
    validateHumanConfirmation(value, { taskId, stage, subject });
    if (typeof value.confirmed_at !== "string" || !/T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(value.confirmed_at) || !Number.isFinite(Date.parse(value.confirmed_at))) return null;
    if (value.schema_version !== "human-confirmation.v1") {
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

function dateMs(value) {
  const parsed = Date.parse(value ?? "");
  return Number.isFinite(parsed) ? parsed : null;
}

function stateForReflection(reflection, nowMs) {
  const generatedMs = dateMs(reflection.generated_at);
  if (generatedMs !== null && generatedMs < nowMs - WINDOW_MS) return "stale";
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
  if (!validateSchema(value)) {
    return {
      stage,
      state: "unavailable",
      reflection_status: null,
      error: { summary: `reflection ${ref} does not satisfy stage-reflection.v1` },
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
  const stages = STAGES.map((stage) => byStage.get(stage) ?? {
    stage,
    state: files.length === 0 ? "empty" : "unknown",
    stage_status: null,
    reflection_status: null,
    generated_at: null,
    error: null,
    judgments: [],
    interventions: [],
    lessons_added: [],
    judgment_counts: judgmentCounts([]),
    judgment_layer: "judgment",
    is_fact: false,
    reflection_ref: null,
  });
  const generated = stages.map((stage) => stage.generated_at).filter(Boolean).sort().at(-1) ?? null;
  return {
    task_id: taskId,
    state: files.length === 0 ? "empty" : stages.some((stage) => stage.state === "unavailable") ? "unavailable" : "ready",
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

function runDeriveConsumptionEdges(root, now) {
  const script = fileURLToPath(new URL("./derive-consumption-edges.mjs", import.meta.url));
  const result = spawnSync(process.execPath, [script, `--root=${root}`, `--now=${now}`], { encoding: "utf8" });
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
  const materialIdentities = ["skills/catalog.yaml", "docs/architecture/move-map.json"].map((ref) => ({
    ref,
    sha256: createHash("sha256").update(readFileSync(join(repositoryRoot, ref))).digest("hex"),
  }));
  for (const task of tasks) {
    for (const stage of task.stages) {
      if (stage.reflection_ref && stage.input_sha256) materialIdentities.push({ ref: `${task.task_id}/${stage.reflection_ref}`, sha256: stage.input_sha256 });
      const taskRoot = join(tasksRoot, task.task_id);
      const authenticated = stage.interventions
        .map((entry) => authenticatedConfirmation(taskRoot, root, project, task.task_id, stage.stage, entry))
        .find(Boolean) ?? null;
      const safeConfirmationRef = authenticated?.ref ?? null;
      const confirmationSha256 = authenticated?.sha256 ?? null;
      if (safeConfirmationRef && confirmationSha256) materialIdentities.push({ ref: `${task.task_id}/${safeConfirmationRef}`, sha256: confirmationSha256 });
      for (const judgment of stage.judgments) {
        const resolved = authorityForTarget(project, stage.stage, judgment);
        if (resolved.status !== "ok") { authorityErrors.push({ task_id: task.task_id, stage: stage.stage, subject_id: judgment.subject_id, status: resolved.status }); continue; }
        observations.push({ task_id: task.task_id, stage: stage.stage, confirmation_ref: safeConfirmationRef, confirmation_sha256: confirmationSha256, human_confirmation: safeConfirmationRef && confirmationSha256 ? { ref: safeConfirmationRef, sha256: confirmationSha256 } : null, occurred_at: stage.generated_at ?? now, target_ref: resolved.target_ref, intervention_kind: judgment.classification, intervention_payload: { reason: judgment.reason ?? "" }, classification: judgment.classification, severity: judgment.severity, confidence: judgment.confidence, evidence_refs: judgment.evidence_refs, material_identities: materialIdentities.filter((entry) => entry.ref.startsWith(`${task.task_id}/`)) });
      }
      for (const intervention of stage.interventions ?? []) {
        const confirmation = authenticatedConfirmation(taskRoot, root, project, task.task_id, stage.stage, intervention);
        interventions.push({ project, task_id: task.task_id, confirmation_ref: confirmation?.ref ?? intervention.confirmation_ref ?? null, confirmation_sha256: confirmation?.sha256 ?? null, intervention_stage: stage.stage, step_slug: intervention.step_slug, occurred_at: stage.generated_at ?? now, primary_attribution_stage: intervention.attribution });
      }
    }
  }
  let evolution = { schema_version: "workflow-evolution.v1", status: "unavailable", candidates: [], quality_tax: { status: "unavailable", label: "未验证，待真实任务数据" }, diagnostics: [{ summary: "evolution snapshot unavailable" }] };
  try {
    if (authorityErrors.length > 0) throw new Error(`target authority resolution failed: ${JSON.stringify(authorityErrors)}`);
    const consumerProofs = derived.tasks.filter((entry) => entry.project === project).map((entry) => entry.consumer_scan_proof).filter((proof) => proof?.coverage_status === "complete" && Array.isArray(proof.registered_output_refs) && proof.registered_output_refs.length > 0 && Array.isArray(proof.source_refs) && proof.source_refs.length > 0);
    const producerIdentity = { ref: "runtime/evidence/workflow-evolution.mjs", sha256: createHash("sha256").update(readFileSync(join(repositoryRoot, "runtime/evidence/workflow-evolution.mjs"))).digest("hex") };
    const schemaIdentity = { ref: "runtime/schemas/workflow-evolution.v1.json", sha256: createHash("sha256").update(readFileSync(join(repositoryRoot, "runtime/schemas/workflow-evolution.v1.json"))).digest("hex") };
    const inventory = buildInputInventory({ project, producerIdentity, schemaIdentity, inventory: { observations, consumer_proofs: consumerProofs, material_identities: materialIdentities } });
    const refresh = refreshEvolutionSnapshot({ storageRoot: root, project, attemptId: `monitor-${randomUUID()}`, inventory, now });
    const tax = computeQualityTaxProjection({ storageRoot: root, inventory: inventory.inventory, interventions, asOf: now });
    evolution = refresh.status === "ok" ? { ...readCurrentEvolutionProjection({ storageRoot: root, project, expectedIdentity: { snapshot_id: refresh.snapshot_id, producer_identity: producerIdentity, schema_identity: schemaIdentity }, taxProjection: tax, sourceInventoryHash: inventory.input_inventory_hash, asOf: now, refreshResult: refresh.refresh_result }), snapshot_content_id: inventory.input_inventory_hash } : { ...evolution, status: refresh.status, diagnostics: [refresh.error ?? { summary: "refresh failed" }] };
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
    states: ["unknown", "unavailable", "degraded", "failed", "empty", "fatal", "stale"],
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
    states: ["unknown", "unavailable", "degraded", "failed", "empty", "fatal", "stale"],
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
  writeFileSync(paths.data, `globalThis.__WH_MONITOR_DATA__ = Object.freeze(${JSON.stringify(data, null, 2)});\n`, "utf8");
  writeFileSync(paths.html, template, "utf8");
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

// C10 P2 unique owner for reading, inspecting and minimally completing the
// single WorkflowHub user configuration. Provider/model definitions stay in the
// 3rd-review configuration; this module only owns the host JSON shape.
import { createHash, randomUUID } from "node:crypto";
import { constants, closeSync, existsSync, fsyncSync, lstatSync, mkdirSync, mkdtempSync, openSync, readFileSync, realpathSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join } from "node:path";
import { workflowHubConfigPath } from "../evidence/storage-root.mjs";
import { FORMAL_DEVELOPMENT_STAGES, RETIRED_STAGE_BUILD_SPEC, RETIRED_STAGE_VERIFY_CODE } from "../stage/stage-registry.mjs";
import { withLock } from "../interface/record-lock.mjs";

const plain = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const absolutePath = (value) => typeof value === "string" && value.trim() !== "" && isAbsolute(value.trim());
const CONFIG_TEMPLATE_REFERENCE = "config/workflowhub.config.template.json";

// Structural keys that may be completed without guessing any user value or
// external path. Empty routes are explicitly not a configured review.
const EMPTY_WH_REVIEW = Object.freeze({ version: 2, stages: {}, non_stage: {} });

function sourceOf({ env = process.env } = {}) {
  const xdg = env?.XDG_CONFIG_HOME;
  return typeof xdg === "string" && xdg.trim() !== "" ? "XDG_CONFIG_HOME" : "HOME";
}

function configProblem(code, message, path) {
  return Object.freeze({ id: "config", code, message, path });
}

function commandShape(value) {
  if (typeof value === "string") return value.trim() !== "";
  return Array.isArray(value) && value.length > 0
    && value.every((item) => typeof item === "string" && item.trim() !== "");
}

function requiredProblems(value, path) {
  const problems = [];
  if (!Object.hasOwn(value, "task_dir")) {
    problems.push(configProblem("CONFIG_TASK_DIR_MISSING", `workflowhub host config requires an absolute task_dir: ${path}`, path));
  } else if (!absolutePath(value.task_dir)) {
    problems.push(configProblem("CONFIG_TASK_DIR_INVALID", `workflowhub host config task_dir must be a non-empty absolute path: ${path}`, path));
  }
  const thirdReview = value.third_review;
  if (thirdReview === undefined) {
    problems.push(configProblem("CONFIG_THIRD_REVIEW_MISSING", `workflowhub host config requires third_review: ${path}`, path));
  } else if (!plain(thirdReview)) {
    problems.push(configProblem("CONFIG_THIRD_REVIEW_INVALID", `workflowhub host config third_review must be an object: ${path}`, path));
  } else {
    if (!Object.hasOwn(thirdReview, "command")) {
      problems.push(configProblem("CONFIG_THIRD_REVIEW_COMMAND_MISSING", `workflowhub host config requires third_review.command: ${path}`, path));
    } else if (!commandShape(thirdReview.command)) {
      problems.push(configProblem("CONFIG_THIRD_REVIEW_COMMAND_INVALID", `workflowhub host third_review.command must be a non-empty string or argv array: ${path}`, path));
    }
    if (!Object.hasOwn(thirdReview, "config")) {
      problems.push(configProblem("CONFIG_THIRD_REVIEW_CONFIG_MISSING", `workflowhub host config requires third_review.config: ${path}`, path));
    } else if (!absolutePath(thirdReview.config)) {
      problems.push(configProblem("CONFIG_THIRD_REVIEW_CONFIG_INVALID", `workflowhub host third_review.config must be an absolute path: ${path}`, path));
    }
    if (!Object.hasOwn(thirdReview, "attachment_root")) {
      problems.push(configProblem("CONFIG_ATTACHMENT_ROOT_MISSING", `workflowhub host config requires third_review.attachment_root: ${path}`, path));
    } else if (!absolutePath(thirdReview.attachment_root)) {
      problems.push(configProblem("CONFIG_ATTACHMENT_ROOT_INVALID", `workflowhub host third_review.attachment_root must be an absolute path: ${path}`, path));
    }
  }
  return problems;
}

// Mirrors the current wh-review loader contract for structural checks. The
// loader treats verify-code as a known passive route (it never validates or
// dispatches it) and tolerates malformed routes for stages other than the
// requested one; the same split is kept here so both verdicts agree.
const REVIEW_STAGES = new Set([FORMAL_DEVELOPMENT_STAGES[0], RETIRED_STAGE_BUILD_SPEC, ...FORMAL_DEVELOPMENT_STAGES.slice(1), RETIRED_STAGE_VERIFY_CODE]);
const DECISION_TRACKS = new Set(["direction", "detail"]);
const NON_STAGE_REVIEW_KINDS = new Set(["build_prd"]);
const REVIEW_MODES = new Set(["single_round", "adaptive", "full_only", "full_on_structural_rework"]);
const PROVIDER_ID = /^[a-z][a-z0-9-]*(?:\/[a-z0-9](?:[a-z0-9-]|\.(?=[a-z0-9]))*)?$/;

function routeProviderList(value) {
  return Array.isArray(value) && value.length > 0
    && value.every((provider) => typeof provider === "string" && PROVIDER_ID.test(provider))
    && new Set(value).size === value.length;
}

export function routeShapeProblem(route, label) {
  if (!plain(route)) return `${label} must be an object`;
  if (Object.hasOwn(route, "minimum_heterologous")) return `${label}.minimum_heterologous is retired`;
  const unknown = Object.keys(route).filter((key) => !["initial", "closure", "mode"].includes(key));
  if (unknown.length) return `${label}.${unknown[0]} is not supported`;
  const mode = route.mode ?? "adaptive";
  if (!REVIEW_MODES.has(mode)) return `${label}.mode is invalid`;
  if (!routeProviderList(route.initial)) return `${label}.initial must be a non-empty provider list`;
  const closure = route.closure;
  if (closure !== undefined && !routeProviderList(closure)) return `${label}.closure must be a non-empty provider list`;
  if (mode !== "adaptive" && closure !== undefined) return `${label}.closure is supported only for adaptive`;
  return null;
}

export function routeModeProblem(route, label, required) {
  const mode = route.mode ?? "adaptive";
  return mode === required ? null : `${label}.mode must be ${required}`;
}

function whReviewTopLevelProblems(value, path) {
  if (value.wh_review === undefined) return [];
  const whReview = value.wh_review;
  if (!plain(whReview)) {
    return [configProblem("CONFIG_WH_REVIEW_INVALID", `workflowhub host wh_review must be an object: ${path}`, path)];
  }
  if (whReview.version !== 2) {
    return [configProblem("CONFIG_WH_REVIEW_VERSION_UNSUPPORTED", `workflowhub host wh_review must be version 2; the original file is preserved and no migration is performed: ${path}`, path)];
  }
  for (const retired of ["profiles", "priority"]) {
    if (Object.hasOwn(whReview, retired)) {
      return [configProblem("CONFIG_WH_REVIEW_RETIRED_FIELD", `workflowhub host wh_review.${retired} is not supported; provider definitions belong to the 3rd-review config: ${path}`, path)];
    }
  }
  const unknown = Object.keys(whReview).filter((key) => !["version", "stages", "non_stage"].includes(key));
  if (unknown.length) {
    return [configProblem("CONFIG_WH_REVIEW_UNKNOWN_KEY", `workflowhub host wh_review.${unknown[0]} is not supported: ${path}`, path)];
  }
  if (whReview.stages !== undefined && !plain(whReview.stages)) {
    return [configProblem("CONFIG_WH_REVIEW_ROUTE_INVALID", `workflowhub host wh_review.stages must be an object: ${path}`, path)];
  }
  for (const stage of Object.keys(whReview.stages ?? {})) {
    if (!REVIEW_STAGES.has(stage)) {
      return [configProblem("CONFIG_WH_REVIEW_ROUTE_INVALID", `workflowhub host wh_review.stages.${stage} is unsupported: ${path}`, path)];
    }
  }
  if (whReview.non_stage !== undefined && !plain(whReview.non_stage)) {
    return [configProblem("CONFIG_WH_REVIEW_ROUTE_INVALID", `workflowhub host wh_review.non_stage must be an object: ${path}`, path)];
  }
  for (const reviewKind of Object.keys(whReview.non_stage ?? {})) {
    if (!NON_STAGE_REVIEW_KINDS.has(reviewKind)) {
      return [configProblem("CONFIG_WH_REVIEW_ROUTE_INVALID", `workflowhub host wh_review.non_stage.${reviewKind} is unsupported: ${path}`, path)];
    }
  }
  return [];
}

/**
 * Route-shape problems for the current configuration. The loader accepts these
 * for stages other than the requested one, so they block only an automatic
 * rewrite; the per-request check in precheck still rejects the requested stage.
 */
export function whReviewRouteProblems(value, path) {
  const problems = [];
  const whReview = value?.wh_review;
  if (!plain(whReview) || whReview.version !== 2) return problems;
  for (const [stage, configured] of Object.entries(plain(whReview.stages) ? whReview.stages : {})) {
    if (!REVIEW_STAGES.has(stage) || stage === RETIRED_STAGE_VERIFY_CODE) continue;
    const label = `workflowhub host wh_review.stages.${stage}`;
    if (stage === "make-decision") {
      if (!plain(configured)) { problems.push(`${label} must be an object of review tracks`); continue; }
      for (const [track, trackRoute] of Object.entries(configured)) {
        const trackLabel = `${label}.${track}`;
        if (!DECISION_TRACKS.has(track)) { problems.push(`${trackLabel} is unsupported`); continue; }
        const problem = routeShapeProblem(trackRoute, trackLabel) ?? routeModeProblem(trackRoute, trackLabel, "single_round");
        if (problem) problems.push(problem);
      }
    } else {
      const problem = routeShapeProblem(configured, label) ?? routeModeProblem(configured, label, stage === "build-code" ? "full_only" : "single_round");
      if (problem) problems.push(problem);
    }
  }
  for (const [reviewKind, configured] of Object.entries(plain(whReview.non_stage) ? whReview.non_stage : {})) {
    if (!NON_STAGE_REVIEW_KINDS.has(reviewKind)) continue;
    const label = `workflowhub host wh_review.non_stage.${reviewKind}`;
    const problem = routeShapeProblem(configured, label) ?? routeModeProblem(configured, label, "single_round");
    if (problem) problems.push(problem);
  }
  return problems;
}

function whReviewProblems(value, path) {
  return whReviewTopLevelProblems(value, path);
}

function mergePatch(value) {
  if (value.wh_review === undefined) return { wh_review: { ...EMPTY_WH_REVIEW } };
  if (!plain(value.wh_review)) return {};
  const patch = {};
  if (value.wh_review.stages === undefined) patch.stages = {};
  if (value.wh_review.non_stage === undefined) patch.non_stage = {};
  return Object.keys(patch).length === 0 ? {} : { wh_review: { ...value.wh_review, ...patch } };
}

function safeJsonPosition(error) {
  const message = String(error?.message ?? "");
  const located = /line (\d+) column (\d+)/.exec(message);
  if (located) return `line ${located[1]}, column ${located[2]}`;
  const positioned = /at position (\d+)/.exec(message);
  return positioned ? `position ${positioned[1]}` : "position unknown";
}

/**
 * Read the single user configuration without changing it.
 *
 * States are explicit so callers can name the exact missing input:
 * missing, invalid_json, not_object, invalid (required keys), unsupported
 * (retired/unknown wh_review shape), present.
 */
export function inspectHostConfig({ env = process.env, home, path } = {}) {
  const target = path ?? workflowHubConfigPath({ env, home });
  const source = sourceOf({ env });
  const named = lstatSync(target, { throwIfNoEntry: false });
  if (named?.isSymbolicLink() && !existsSync(target)) {
    return Object.freeze({
      path: target, source, state: "invalid", value: null, bytes_sha256: null,
      problems: Object.freeze([configProblem("CONFIG_SYMLINK_DANGLING", `WorkflowHub user config is a dangling symlink: ${target}`, target)]),
    });
  }
  if (!existsSync(target)) {
    return Object.freeze({
      path: target, source, state: "missing", value: null, bytes_sha256: null,
      problems: Object.freeze([configProblem("CONFIG_MISSING", `WorkflowHub user config is missing: ${target}`, target)]),
    });
  }
  let bytes;
  try { bytes = readFileSync(target); }
  catch (error) { throw Object.assign(error, { path: target, code: error.code ?? "CONFIG_READ_FAILED" }); }
  const bytesSha = sha256(bytes);
  let value;
  try { value = JSON.parse(bytes.toString("utf8")); }
  catch (error) {
    return Object.freeze({
      path: target, source, state: "invalid_json", value: null, bytes_sha256: bytesSha,
      problems: Object.freeze([configProblem("CONFIG_INVALID_JSON", `WorkflowHub user config is not valid JSON and was left untouched: ${target} (${safeJsonPosition(error)}); parser content is not echoed`, target)]),
    });
  }
  if (!plain(value)) {
    return Object.freeze({
      path: target, source, state: "not_object", value: null, bytes_sha256: bytesSha,
      problems: Object.freeze([configProblem("CONFIG_NOT_OBJECT", `WorkflowHub user config must be a JSON object and was left untouched: ${target}`, target)]),
    });
  }
  const unsupported = whReviewProblems(value, target);
  if (unsupported.length) {
    return Object.freeze({ path: target, source, state: "unsupported", value: null, bytes_sha256: bytesSha, problems: Object.freeze(unsupported) });
  }
  const required = requiredProblems(value, target);
  if (required.length) {
    return Object.freeze({ path: target, source, state: "invalid", value: null, bytes_sha256: bytesSha, problems: Object.freeze(required) });
  }
  const routeProblems = whReviewRouteProblems(value, target).map((message) =>
    configProblem("CONFIG_WH_REVIEW_ROUTE_INVALID", `workflowhub host wh_review route needs repair but is left untouched: ${message}: ${target}`, target));
  return Object.freeze({ path: target, source, state: "present", value: Object.freeze(value), bytes_sha256: bytesSha,
    problems: Object.freeze([]), route_problems: Object.freeze(routeProblems) });
}

/**
 * Compute the single planned configuration action. Required values are never
 * guessed: only documented non-sensitive structural keys may be merged.
 */
export function planHostConfigBootstrap(inspection) {
  if (!plain(inspection) || typeof inspection.path !== "string") throw new TypeError("host config inspection is required");
  const base = { path: inspection.path, source: inspection.source, baseline_sha256: inspection.bytes_sha256 ?? null };
  const first = inspection.problems?.[0] ?? null;
  if (inspection.state === "missing") {
    return Object.freeze({ ...base, action: "blocked", patch: null, problems: inspection.problems,
      next_action: `create ${inspection.path} from ${CONFIG_TEMPLATE_REFERENCE}, fill task_dir and the third_review paths, then rerun this check` });
  }
  if (inspection.state === "invalid_json" || inspection.state === "not_object" || inspection.state === "unsupported" || inspection.state === "invalid") {
    return Object.freeze({ ...base, action: "blocked", patch: null, problems: inspection.problems,
      next_action: `repair ${inspection.path} (${first?.code ?? "CONFIG_INVALID"}); the original bytes are preserved and no value is overwritten` });
  }
  const routeProblems = inspection.route_problems ?? [];
  if (routeProblems.length) {
    return Object.freeze({ ...base, action: "blocked", patch: null, problems: Object.freeze(routeProblems),
      next_action: `repair the reported wh_review route in ${inspection.path}; the original bytes are preserved and no structure is merged` });
  }
  const patch = mergePatch(inspection.value);
  if (Object.keys(patch).length === 0) {
    return Object.freeze({ ...base, action: "none", patch: null, problems: Object.freeze([]), next_action: null });
  }
  return Object.freeze({ ...base, action: "merge", patch: Object.freeze(patch), problems: Object.freeze([]),
    next_action: `add the missing non-sensitive structure (${Object.keys(patch).join(", ")}) and keep every existing value` });
}

function uniqueBackup(path, bytes) {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..+$/, "");
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const candidate = `${path}.bak-${stamp}-${randomUUID().slice(0, 8)}`;
    try {
      writeFileSync(candidate, bytes, { flag: "wx", mode: 0o600 });
      return candidate;
    } catch (error) {
      if (error.code !== "EEXIST") throw Object.assign(error, { code: "CONFIG_BACKUP_FAILED", path: candidate });
    }
  }
  throw Object.assign(new Error(`could not create a unique config backup beside ${path}`), { code: "CONFIG_BACKUP_FAILED", path });
}

function atomicWriteJson(path, value) {
  const directory = dirname(path);
  const staging = mkdtempSync(join(directory, ".workflowhub-config-"));
  try {
    const temporary = join(staging, "payload.json");
    const descriptor = openSync(temporary, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL, 0o600);
    try {
      writeFileSync(descriptor, `${JSON.stringify(value, null, 2)}\n`);
      fsyncSync(descriptor);
    } finally { closeSync(descriptor); }
    renameSync(temporary, path);
  } finally { rmSync(staging, { recursive: true, force: true }); }
}

/**
 * Apply the planned configuration action under the existing record lock.
 * A concurrent byte change is a conflict: nothing is overwritten and the
 * caller reports the preserved bytes and the next executable step.
 */
export async function applyHostConfigBootstrap(plan) {
  if (!plain(plan) || typeof plan.path !== "string") throw new TypeError("host config plan is required");
  if (plan.action === "blocked") {
    return Object.freeze({ status: "blocked", path: plan.path, problems: plan.problems ?? [], next_action: plan.next_action });
  }
  if (plan.action === "none") return Object.freeze({ status: "noop", path: plan.path });
  if (plan.action !== "merge") throw new TypeError(`unknown host config action: ${plan.action}`);
  if (!existsSync(plan.path)) return Object.freeze({ status: "conflict", path: plan.path, preserved: true, reason: "configuration disappeared after planning" });
  mkdirSync(dirname(plan.path), { recursive: true });
  return withLock(dirname(plan.path), "workflowhub-config", async () => {
    // A symlinked configuration keeps its link: write through the current real
    // target instead of replacing the symlink with a regular file.
    const named = lstatSync(plan.path);
    let target = plan.path;
    if (named.isSymbolicLink()) {
      try { target = realpathSync(plan.path); }
      catch { return Object.freeze({ status: "conflict", path: plan.path, preserved: true, reason: "configuration symlink target is missing" }); }
    }
    const current = readFileSync(target);
    if (plan.baseline_sha256 !== null && sha256(current) !== plan.baseline_sha256) {
      return Object.freeze({ status: "conflict", path: plan.path, preserved: true, reason: "configuration bytes changed after planning" });
    }
    const parsed = JSON.parse(current.toString("utf8"));
    const merged = { ...parsed };
    for (const [key, value] of Object.entries(plan.patch ?? {})) merged[key] = value;
    // Re-read immediately before publishing: a non-cooperating writer that
    // saved between planning and this lock is a conflict, not an overwrite.
    // A residual race between this read and rename cannot be closed on POSIX;
    // the merge is opt-in and the previous bytes stay in the unique backup.
    const justBefore = readFileSync(target);
    if (sha256(justBefore) !== sha256(current)) {
      return Object.freeze({ status: "conflict", path: plan.path, preserved: true, reason: "configuration bytes changed during the pending write" });
    }
    const backup = uniqueBackup(target, current);
    atomicWriteJson(target, merged);
    const written = readFileSync(target);
    if (named.isSymbolicLink() && (!lstatSync(plan.path, { throwIfNoEntry: false })?.isSymbolicLink() || realpathSync(plan.path) !== target)) {
      return Object.freeze({ status: "conflict", path: plan.path, preserved: true, reason: "configuration symlink changed during the pending write", backup_path: backup });
    }
    return Object.freeze({
      status: "applied", path: plan.path, target_path: target, backup_path: backup,
      previous_sha256: sha256(current), sha256: sha256(written),
      added: Object.keys(plan.patch ?? {}),
    });
  });
}


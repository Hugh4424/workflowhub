// C10 P2 action-scoped precheck. It reports what a real action needs and the
// next executable step; it never installs tools, changes an executor, or
// silently falls back to another browser/search route.
import { accessSync, constants as fsConstants, existsSync, lstatSync, readFileSync, realpathSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { homedir } from "node:os";
import { isAbsolute, join } from "node:path";
import { workflowHubConfigPath } from "../evidence/storage-root.mjs";
import { inspectHostConfig, planHostConfigBootstrap, routeModeProblem, routeShapeProblem } from "./config-bootstrap.mjs";
import { detectOcr } from "../review/ocr-delegation-adapter.mjs";
import { loadTrustedThirdReviewConfig } from "../../skills/wh-review/scripts/third-review-host-config.mjs";

const CHECK_ORDER = Object.freeze(["node", "config", "provider_config", "provider", "route", "ocr", "ego", "anysearch", "npm", "git"]);

// Every action names exactly the capabilities it really needs. doctor, status
// and draft stay free of review/browser/search requirements by construction.
export const ACTION_REQUIREMENTS = Object.freeze({
  doctor: Object.freeze([]),
  status: Object.freeze([]),
  draft: Object.freeze([]),
  onboard: Object.freeze(["node", "config"]),
  // The build-code code review really dispatches through OCR; its pre-dispatch
  // gate is the current user config and the trusted review route only. Provider
  // executables are reported by review-full/tools because an installed provider
  // failure is an existing post-dispatch fact, not a missing input.
  review: Object.freeze(["node", "config", "provider_config", "route"]),
  "review-full": Object.freeze(["node", "config", "provider_config", "provider", "route", "ocr"]),
  install: Object.freeze(["node", "npm", "git"]),
  browser: Object.freeze(["ego"]),
  search: Object.freeze(["anysearch"]),
  tools: Object.freeze(["node", "ocr", "ego", "anysearch", "npm", "git"]),
});

const plain = (value) => value !== null && typeof value === "object" && !Array.isArray(value);

function check(id, status, fields) {
  return Object.freeze({ id, status, requirement: status === "ok" ? "informational" : "required", ...fields });
}

// Resolve a command name exactly as a shell would (PATH for relative names,
// realpath for linked installs) without executing it.
function resolveExecutable(name, env) {
  if (typeof name !== "string" || name.trim() === "") return Object.freeze({ problem: "command is empty" });
  const candidate = name.trim();
  let path = candidate;
  if (!isAbsolute(candidate)) {
    const entries = String(env?.PATH ?? "").split(":").filter(Boolean);
    path = entries.map((entry) => join(entry, candidate)).find((item) => {
      try { accessSync(item, fsConstants.X_OK); return true; } catch { return false; }
    });
    if (!path) return Object.freeze({ problem: `${candidate} is not on PATH` });
  }
  let real;
  try { real = realpathSync(path); }
  catch { return Object.freeze({ problem: `${path} is a dangling link or missing` }); }
  try { accessSync(real, fsConstants.X_OK); }
  catch { return Object.freeze({ problem: `${path} is not executable` }); }
  try { if (!statSync(real).isFile()) return Object.freeze({ problem: `${path} is not a regular file` }); }
  catch { return Object.freeze({ problem: `${path} is missing` }); }
  return Object.freeze({ path: real });
}

function probeCommand(name, env) {
  try {
    execFileSync(name, ["--version"], { env, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 20000 });
    return Object.freeze({ status: "available" });
  } catch (error) {
    if (error.code === "ENOENT") return Object.freeze({ status: "not_installed", reason: "ENOENT" });
    return Object.freeze({ status: "unavailable", reason: `${error.code ?? "PROBE_FAILED"}: ${String(error.message ?? "").split("\n")[0]}` });
  }
}

function nodeCheck({ nodeVersion }) {
  const version = String(nodeVersion ?? "");
  const match = /^v?(\d+)\.(\d+)\.(\d+)/.exec(version);
  if (!match) return check("node", "unknown", { path: process.execPath, source: "process.versions.node",
    message: `current Node.js version is not parseable: ${version}`, next_action: "run the CLI with Node.js 24 or newer" });
  const major = Number(match[1]);
  if (major < 24) return check("node", "missing", { code: "NODE_VERSION_UNSUPPORTED", path: process.execPath, source: "process.versions.node",
    message: `Node.js ${version} is below the required >=24`, next_action: "install Node.js 24 or newer, open a new shell, and rerun" });
  return check("node", "ok", { path: process.execPath, source: "process.versions.node", message: `Node.js ${version}` });
}

function configCheck({ env, home, configPath }) {
  const inspection = inspectHostConfig({ env, home, path: configPath });
  const plan = planHostConfigBootstrap(inspection);
  if (inspection.state === "present") {
    return { inspection, check: check("config", "ok", { path: inspection.path, source: inspection.source, message: `WorkflowHub user config: ${inspection.path}` }) };
  }
  const first = inspection.problems[0];
  const status = inspection.state === "missing" ? "missing" : "invalid";
  return { inspection, check: check("config", status, {
    code: first.code, path: inspection.path, source: inspection.source, message: first.message, next_action: plan.next_action,
  }) };
}

function providerCommand(value) {
  if (Array.isArray(value)) return value[0];
  if (typeof value === "string") return value.trim().split(/\s+/)[0];
  return undefined;
}

function executableProblem(path, label, env) {
  const resolved = resolveExecutable(path, env);
  return resolved.problem ? `${label}: ${resolved.problem}` : null;
}

function statOrProblem(path) {
  try { return { stat: statSync(path) }; }
  catch (error) {
    if (error.code === "ENOENT") return { kind: "missing", code: error.code };
    if (error.code === "EACCES" || error.code === "EPERM") return { kind: "permission", code: error.code };
    return { kind: "io", code: String(error.code ?? "STAT_FAILED") };
  }
}

function providerConfigCheck({ inspection }) {
  if (inspection.state !== "present") {
    return check("provider_config", "unknown", { path: inspection.path, source: inspection.source,
      message: `provider configuration was not evaluated because the WorkflowHub user config is ${inspection.state}`,
      next_action: "repair the reported configuration first" });
  }
  const thirdReview = inspection.value.third_review;
  const command = providerCommand(thirdReview.command);
  if (typeof command !== "string" || command.trim() === "") {
    return check("provider_config", "missing", { code: "PROVIDER_COMMAND_INVALID", path: inspection.path, source: "third_review.command",
      message: "third_review.command must be a non-empty string or argv array", next_action: "set third_review.command to the installed 3rd-review broker CLI" });
  }
  if (!isAbsolute(thirdReview.config)) {
    return check("provider_config", "missing", { code: "PROVIDER_CONFIG_PATH_INVALID", path: thirdReview.config, source: "third_review.config",
      message: `third_review.config must be an absolute path: ${String(thirdReview.config)}`, next_action: "set third_review.config to the absolute 3rd-review config path" });
  }
  const configStat = statOrProblem(thirdReview.config);
  if (configStat.kind === "permission" || configStat.kind === "io") {
    const permission = configStat.kind === "permission";
    return check("provider_config", "missing", {
      code: permission ? "PROVIDER_CONFIG_PERMISSION_DENIED" : "PROVIDER_CONFIG_UNREADABLE",
      path: thirdReview.config, source: "third_review.config",
      message: permission
        ? `3rd-review config cannot be read because of permissions (${configStat.code}): ${thirdReview.config}`
        : `3rd-review config cannot be read (${configStat.code}): ${thirdReview.config}`,
      next_action: permission
        ? `restore read and execute permission on ${thirdReview.config} and its parent directories, then rerun`
        : `check the filesystem state of ${thirdReview.config} and rerun once it is readable` });
  }
  if (configStat.kind === "missing" || !configStat.stat.isFile()) {
    return check("provider_config", "missing", { code: "PROVIDER_CONFIG_NOT_FOUND", path: thirdReview.config, source: "third_review.config",
      message: `3rd-review config is missing or is not a regular file: ${thirdReview.config}`,
      next_action: `create or repair ${thirdReview.config} (providers and attachment_roots stay owned by the 3rd-review config), then rerun` });
  }
  if (!isAbsolute(thirdReview.attachment_root)) {
    return check("provider_config", "missing", { code: "PROVIDER_ATTACHMENT_ROOT_INVALID", path: thirdReview.attachment_root, source: "third_review.attachment_root",
      message: `third_review.attachment_root must be an absolute path: ${String(thirdReview.attachment_root)}`, next_action: "set third_review.attachment_root to the allowlisted real packet directory" });
  }
  const rootStat = statOrProblem(thirdReview.attachment_root);
  if (rootStat.kind === "permission" || rootStat.kind === "io") {
    const permission = rootStat.kind === "permission";
    return check("provider_config", "missing", {
      code: permission ? "PROVIDER_ATTACHMENT_ROOT_PERMISSION_DENIED" : "PROVIDER_ATTACHMENT_ROOT_UNREADABLE",
      path: thirdReview.attachment_root, source: "third_review.attachment_root",
      message: permission
        ? `3rd-review attachment root cannot be inspected because of permissions (${rootStat.code}): ${thirdReview.attachment_root}`
        : `3rd-review attachment root cannot be inspected (${rootStat.code}): ${thirdReview.attachment_root}`,
      next_action: permission
        ? `restore read and execute permission on ${thirdReview.attachment_root}, then rerun`
        : `check the filesystem state of ${thirdReview.attachment_root} and rerun once it is readable` });
  }
  if (rootStat.kind === "missing" || !rootStat.stat.isDirectory()) {
    return check("provider_config", "missing", { code: "PROVIDER_ATTACHMENT_ROOT_NOT_FOUND", path: thirdReview.attachment_root, source: "third_review.attachment_root",
      message: `3rd-review attachment root is missing or is not a directory: ${thirdReview.attachment_root}`,
      next_action: `create ${thirdReview.attachment_root} and allowlist the fixed packet source in the 3rd-review config, then rerun` });
  }
  return check("provider_config", "ok", { path: thirdReview.config, source: "third_review", message: `3rd-review config: ${thirdReview.config}` });
}

function providerCheck({ inspection, requestedStage, requestedTrack, requestedReviewKind, env }) {
  if (inspection.state !== "present") {
    return check("provider", "unknown", { path: inspection.path, source: inspection.source,
      message: `provider configuration was not evaluated because the WorkflowHub user config is ${inspection.state}`,
      next_action: "repair the reported configuration first" });
  }
  const thirdReview = inspection.value.third_review;
  const problems = [];
  const command = providerCommand(thirdReview.command);
  const commandProblem = executableProblem(command, "third_review.command", env);
  if (commandProblem) problems.push({ code: "PROVIDER_COMMAND_NOT_FOUND", path: command, message: commandProblem });
  if (!isAbsolute(thirdReview.config)) problems.push({ code: "PROVIDER_CONFIG_PATH_INVALID", path: thirdReview.config, message: `third_review.config must be an absolute path: ${String(thirdReview.config)}` });
  else if (!existsSync(thirdReview.config)) problems.push({ code: "PROVIDER_CONFIG_NOT_FOUND", path: thirdReview.config, message: `3rd-review config is missing: ${thirdReview.config}` });
  if (!isAbsolute(thirdReview.attachment_root)) problems.push({ code: "PROVIDER_ATTACHMENT_ROOT_INVALID", path: thirdReview.attachment_root, message: `third_review.attachment_root must be an absolute path: ${String(thirdReview.attachment_root)}` });
  else if (!existsSync(thirdReview.attachment_root)) problems.push({ code: "PROVIDER_ATTACHMENT_ROOT_NOT_FOUND", path: thirdReview.attachment_root, message: `3rd-review attachment root is missing: ${thirdReview.attachment_root}` });
  if (problems.length) {
    const first = problems[0];
    return check("provider", "missing", { code: first.code, path: first.path, source: "third_review", message: first.message,
      next_action: `install or repair ${first.path}; provider definitions stay in the 3rd-review config` });
  }
  // The portable loader is the single authority for allowlists, retired fields
  // and provider definitions; a shape check cannot replace it.
  let trusted;
  try {
    trusted = loadTrustedThirdReviewConfig({ hostConfigPath: inspection.path, requestedStage, requestedTrack, requestedReviewKind });
  } catch (error) {
    return check("provider", "invalid", { code: "PROVIDER_CONFIG_INVALID", path: thirdReview.config, source: "third_review",
      message: String(error.message ?? error), next_action: "repair the reported 3rd-review field or allowlist entry, then rerun" });
  }
  // The selected route's provider executables are the real dispatch dependency;
  // provider/model definitions stay owned by the 3rd-review config.
  let providerConfig;
  try { providerConfig = JSON.parse(readFileSync(thirdReview.config, "utf8")); }
  catch (error) {
    return check("provider", "invalid", { code: "PROVIDER_CONFIG_INVALID", path: thirdReview.config, source: "3rd-review config",
      message: `3rd-review config is not valid JSON: ${thirdReview.config}`, next_action: "repair the 3rd-review config JSON, then rerun" });
  }
  for (const provider of selectedProviders(trusted, requestedStage, requestedTrack, requestedReviewKind)) {
    const profile = providerConfig.providers?.[provider];
    if (!profile) {
      return check("provider", "missing", { code: "PROVIDER_NOT_DEFINED", path: thirdReview.config, source: "3rd-review config",
        message: `provider ${provider} is not defined by the 3rd-review config`, next_action: `define provider ${provider} in the 3rd-review config, then rerun` });
    }
    const executable = typeof profile.command === "string" && profile.command.trim() !== ""
      ? profile.command.trim().split(/\s+/)[0] : String(provider).split("/")[0];
    const resolved = resolveExecutable(executable, env);
    if (resolved.problem) {
      return check("provider", "missing", { code: "PROVIDER_EXECUTABLE_NOT_FOUND", path: executable, source: `providers.${provider}`,
        message: `provider ${provider} executable: ${resolved.problem}`,
        next_action: `install ${executable} or set providers.${provider}.command to an installed executable, then rerun` });
    }
  }
  return check("provider", "ok", { path: thirdReview.config, source: "third_review", message: `trusted 3rd-review config: ${thirdReview.config}` });
}

function selectedProviders(trusted, requestedStage, requestedTrack, requestedReviewKind) {
  if (requestedReviewKind !== null) return [...new Set(trusted.whReview?.non_stage?.[requestedReviewKind]?.initial ?? [])];
  if (requestedStage === null) return [];
  const stages = trusted.whReview?.stages ?? {};
  let route = stages[requestedStage];
  if (requestedTrack !== null && plain(route)) route = route[requestedTrack];
  return [...new Set(route?.initial ?? [])];
}

function routeReady(route) {
  return plain(route) && Array.isArray(route.initial) && route.initial.length > 0;
}

function routeInvalid(route, label, requiredMode, { path, inspectionPath, source }) {
  const problem = routeShapeProblem(route, label) ?? routeModeProblem(route, label, requiredMode);
  if (!problem) return null;
  return check("route", "invalid", { code: "ROUTE_INVALID", path: path ?? inspectionPath, source,
    message: `${problem}; the original file is preserved`, next_action: "repair the reported wh_review route, then rerun" });
}

function routeCheck({ inspection, requestedStage, requestedTrack, requestedReviewKind }) {
  if (inspection.state !== "present") {
    return check("route", "unknown", { path: inspection.path, source: inspection.source,
      message: `review route was not evaluated because the WorkflowHub user config is ${inspection.state}` });
  }
  const whReview = inspection.value.wh_review;
  if (whReview === undefined) {
    return check("route", "missing", { code: "ROUTE_NOT_CONFIGURED", path: inspection.path, source: "wh_review",
      message: `no wh_review route is configured for the requested review`, next_action: "add the current provider route under wh_review (version 2), or rerun a non-review action" });
  }
  if (!plain(whReview) || whReview.version !== 2) {
    return check("route", "invalid", { code: "ROUTE_VERSION_UNSUPPORTED", path: inspection.path, source: "wh_review",
      message: "wh_review must be version 2; the original file is preserved", next_action: "repair wh_review; no v1 migration is performed" });
  }
  if (requestedReviewKind !== null) {
    const route = whReview.non_stage?.[requestedReviewKind];
    if (!routeReady(route)) {
      return check("route", "missing", { code: "ROUTE_KIND_ABSENT", path: inspection.path, source: "wh_review.non_stage",
        message: `no wh_review.non_stage.${requestedReviewKind} route with providers is configured`, next_action: `add a current provider route for non_stage.${requestedReviewKind}` });
    }
    const invalid = routeInvalid(route, `workflowhub host wh_review.non_stage.${requestedReviewKind}`, "single_round",
      { path: inspection.path, source: "wh_review.non_stage" });
    if (invalid) return invalid;
    return check("route", "ok", { path: inspection.path, source: "wh_review.non_stage", message: `route: non_stage.${requestedReviewKind}` });
  }
  if (requestedStage === null) {
    return check("route", "unknown", { path: inspection.path, source: "wh_review", message: "no review stage requested" });
  }
  let stageRoute = whReview.stages?.[requestedStage];
  if (requestedTrack !== null && plain(stageRoute)) stageRoute = stageRoute[requestedTrack];
  if (!routeReady(stageRoute)) {
    const nestedTrack = requestedTrack === null && plain(stageRoute)
      && Object.values(stageRoute).some((item) => plain(item));
    return check("route", "missing", { code: nestedTrack ? "ROUTE_TRACK_REQUIRED" : "ROUTE_STAGE_ABSENT",
      path: inspection.path, source: `wh_review.stages.${requestedStage}`,
      message: nestedTrack
        ? `wh_review.stages.${requestedStage} needs an explicit review track`
        : `no wh_review.stages.${requestedStage}${requestedTrack ? `.${requestedTrack}` : ""} route with providers is configured`,
      next_action: `add a current provider route for ${requestedStage}${requestedTrack ? ` / ${requestedTrack}` : ""}` });
  }
  const label = `workflowhub host wh_review.stages.${requestedStage}${requestedTrack ? `.${requestedTrack}` : ""}`;
  const invalid = routeInvalid(stageRoute, label, requestedStage === "build-code" ? "full_only" : "single_round",
    { path: inspection.path, source: `wh_review.stages.${requestedStage}` });
  if (invalid) return invalid;
  return check("route", "ok", { path: inspection.path, source: `wh_review.stages.${requestedStage}`, message: `route: ${requestedStage}${requestedTrack ? ` / ${requestedTrack}` : ""}` });
}

function ocrCheck({ env, probe }) {
  if (probe === "static") {
    const resolved = resolveExecutable("ocr", env);
    if (resolved.problem) {
      return check("ocr", "missing", { code: "OCR_NOT_INSTALLED", path: "ocr", source: "PATH (ocr)",
        message: `open-code-review: ${resolved.problem}`,
        next_action: "install open-code-review at version 1.12.9 or newer (the open-code-review/ocr CLI on PATH), then verify with `ocr --version`; no substitute executor is used" });
    }
    return check("ocr", "unknown", { path: resolved.path, source: "PATH (ocr)",
      message: "open-code-review is on PATH but its version was not probed in read-only mode",
      next_action: "run doctor or a review to verify open-code-review >= 1.12.9; no substitute executor is used" });
  }
  const detection = detectOcr({ env });
  if (detection.status === "installed") {
    return check("ocr", "ok", { path: "ocr", source: detection.detected_by, message: `open-code-review ${detection.version}` });
  }
  return check("ocr", detection.status === "not_installed" ? "missing" : "unavailable", {
    code: detection.status === "not_installed" ? "OCR_NOT_INSTALLED" : "OCR_DETECTION_UNAVAILABLE",
    path: "ocr", source: detection.detected_by, message: detection.reason,
    next_action: "install open-code-review at version 1.12.9 or newer (the open-code-review/ocr CLI on PATH), then verify with `ocr --version`; no substitute executor is used",
  });
}

function egoCheck({ env, probe }) {
  const configured = env?.EGO_BROWSER_BIN;
  const command = typeof configured === "string" && configured.trim() !== "" ? configured.trim() : "ego-browser";
  const resolved = resolveExecutable(command, env);
  if (resolved.problem) return check("ego", "missing", { code: "EGO_NOT_INSTALLED", path: command,
    source: isAbsolute(command) ? "EGO_BROWSER_BIN" : "PATH (ego-browser)", message: `ego-browser helper: ${resolved.problem}`,
    next_action: "install ego lite (citrolabs/ego-lite) so ego-browser is on PATH, or point EGO_BROWSER_BIN at the installed helper; do not fall back to another browser" });
  if (probe === "static") return check("ego", "unknown", { path: resolved.path, source: "PATH (ego-browser)",
    message: "ego-browser helper is on PATH but was not executed in read-only mode",
    next_action: "run doctor or the real browser action to verify the helper, then rerun; do not fall back to another browser" });
  const execution = probeCommand(command, env);
  if (execution.status === "unavailable") return check("ego", "unavailable", { code: "EGO_PROBE_FAILED", path: resolved.path, source: "PATH (ego-browser)",
    message: execution.reason, next_action: "repair the ego-browser helper invocation, then rerun; do not fall back to another browser" });
  return check("ego", "ok", { path: resolved.path, source: "PATH (ego-browser)", message: "ego-browser helper detected" });
}

function anysearchCheck({ env }) {
  const key = env?.ANYSEARCH_API_KEY;
  if (typeof key === "string" && key.trim() !== "") {
    return check("anysearch", "ok", { path: null, source: "ANYSEARCH_API_KEY", message: "anysearch key is configured" });
  }
  return check("anysearch", "missing", { code: "ANYSEARCH_KEY_MISSING", path: null, source: "ANYSEARCH_API_KEY",
    message: "ANYSEARCH_API_KEY is not set in the current environment",
    next_action: "set ANYSEARCH_API_KEY in the shell environment used by the search action, then rerun; anonymous access is not used silently" });
}

function toolCommandCheck(id, name, env, probe) {
  const resolved = resolveExecutable(name, env);
  if (resolved.problem) return check(id, "missing", { code: `${id.toUpperCase()}_NOT_INSTALLED`, path: name, source: "PATH",
    message: `${name}: ${resolved.problem}`, next_action: `install ${name} and put it on PATH before the action that needs it` });
  if (probe === "static") return check(id, "unknown", { path: resolved.path, source: "PATH",
    message: `${name} is on PATH but was not executed in read-only mode`,
    next_action: `run the action that needs ${name} (or doctor) to prove it executes, then rerun` });
  const execution = probeCommand(name, env);
  if (execution.status === "unavailable") return check(id, "unavailable", { code: `${id.toUpperCase()}_PROBE_FAILED`, path: resolved.path, source: "PATH",
    message: execution.reason, next_action: `repair the ${name} invocation and rerun the action that needs it` });
  return check(id, "ok", { path: resolved.path, source: "PATH", message: `${name} is available` });
}

/**
 * Compute the union of checks required by the requested actions.
 *
 * Only checks with status "missing" or "invalid" block their dependent action;
 * "unknown" stays honest and never reports success. Actions with no
 * requirements (doctor/status/draft) return no missing items.
 */
export function precheckForActions(actions, {
  env = process.env, home = homedir(), configPath, nodeVersion = process.versions.node,
  requestedStage = null, requestedTrack = null, requestedReviewKind = null, probe = "spawn",
} = {}) {
  if (!Array.isArray(actions) || actions.length === 0) throw new TypeError("at least one precheck action is required");
  if (!["spawn", "static"].includes(probe)) throw new TypeError("precheck probe mode must be spawn or static");
  const unique = [...new Set(actions)];
  const requirements = new Map();
  for (const action of unique) {
    if (!Object.hasOwn(ACTION_REQUIREMENTS, action)) throw new TypeError(`unknown precheck action: ${action}`);
    for (const id of ACTION_REQUIREMENTS[action]) {
      if (!requirements.has(id)) requirements.set(id, []);
      requirements.get(id).push(action);
    }
  }
  const path = configPath ?? workflowHubConfigPath({ env, home });
  const inspectionHolder = { value: null };
  const checks = [];
  for (const id of CHECK_ORDER) {
    if (!requirements.has(id)) continue;
    let built;
    if (id === "node") built = nodeCheck({ nodeVersion });
    else if (id === "config") {
      const { check: configResult, inspection } = configCheck({ env, home, configPath: path });
      inspectionHolder.value = inspection;
      built = configResult;
    } else if (id === "provider_config" || id === "provider" || id === "route") {
      const inspection = inspectionHolder.value ?? inspectHostConfig({ env, home, path });
      inspectionHolder.value = inspection;
      built = id === "provider_config"
        ? providerConfigCheck({ inspection })
        : id === "provider"
        ? providerCheck({ inspection, requestedStage, requestedTrack, requestedReviewKind, env })
        : routeCheck({ inspection, requestedStage, requestedTrack, requestedReviewKind });
    } else if (id === "ocr") built = ocrCheck({ env, probe });
    else if (id === "ego") built = egoCheck({ env, probe });
    else if (id === "anysearch") built = anysearchCheck({ env });
    else if (id === "npm" || id === "git") built = toolCommandCheck(id, id, env, probe);
    checks.push(Object.freeze({ ...built, required_by: Object.freeze([...requirements.get(id)]) }));
  }
  // Any non-ok required check blocks its dependent action; unknown/unavailable
  // stay distinct but never aggregate to ready.
  const missing = checks.filter((item) => item.status !== "ok");
  return Object.freeze({
    status: missing.length ? "blocked" : "ready",
    actions: Object.freeze([...unique]),
    config_path: path,
    checks: Object.freeze(checks),
    missing: Object.freeze(missing),
  });
}

export function precheckForAction(action, options) {
  return precheckForActions([action], options);
}

export { inspectHostConfig };

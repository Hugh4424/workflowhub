import { lstatSync, readFileSync, realpathSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, isAbsolute, join, resolve } from "node:path";

export const PACKET_SOURCE_PREFIX = ".wh-review-packets";

const FIXED_SYSTEM_ALIASES = new Map([
  ["/tmp", "/private/tmp"],
  ["/var", "/private/var"],
  ["/etc", "/private/etc"],
]);

function assertNoSymlinkChain(path, label) {
  const parts = path.split("/").filter(Boolean);
  let cursor = "/";
  for (const part of parts) {
    if (part === ".") continue;
    if (part === "..") {
      cursor = dirname(cursor);
      continue;
    }
    cursor = join(cursor, part);
    const stat = lstatSync(cursor);
    if (stat.isSymbolicLink()) {
      if (FIXED_SYSTEM_ALIASES.get(cursor) === realpathSync(cursor)) continue;
      throw new Error(`${label} contains a symlink: ${cursor}`);
    }
  }
}

function regularFile(path, label) {
  if (!isAbsolute(path)) throw new Error(`${label} must be an absolute path`);
  assertNoSymlinkChain(path, label);
  const stat = lstatSync(path);
  if (stat.isSymbolicLink() || !stat.isFile()) throw new Error(`${label} must be a real regular file`);
  return realpathSync(path);
}

function realDirectory(path, label) {
  if (!isAbsolute(path)) throw new Error(`${label} must be an absolute path`);
  assertNoSymlinkChain(path, label);
  const stat = lstatSync(path);
  if (stat.isSymbolicLink() || !stat.isDirectory()) throw new Error(`${label} must be a real directory`);
  return realpathSync(path);
}

function hostConfigPath() { return join(process.env.HOME || homedir(), ".config", "workflowhub", "config.json"); }
function readJson(path, label) {
  try { return JSON.parse(readFileSync(path, "utf8")); }
  catch (error) { throw new Error(`${label} is invalid JSON: ${error.message}`); }
}

function command(value) {
  if (typeof value === "string" && value.trim()) return value;
  if (Array.isArray(value) && value.length > 0 && value.every((item) => typeof item === "string" && item)) return [...value];
  throw new Error("workflowhub host third_review.command must be a command string or non-empty argv array");
}

const REVIEW_STAGES = new Set(["make-decision", "build-spec", "build-plan", "build-code", "verify-code"]);
const DECISION_TRACKS = new Set(["direction", "detail"]);
const MINI_TASK_REVIEW_KINDS = new Set(["mini_task.design", "mini_task.implementation"]);
const REVIEW_MODES = new Set(["single_round", "adaptive", "full_only", "full_on_structural_rework"]);

function adapterOf(provider, label) {
  if (typeof provider !== "string" || !/^[a-z][a-z0-9-]*(?:\/[a-z][a-z0-9-]*)?$/.test(provider)) throw new Error(label + " must be a provider id");
  return provider.split("/", 1)[0];
}

function nullableString(value, label) {
  if (value !== null && typeof value !== "string") throw new Error(label + " must be a string or null");
  return value;
}

function profileList(value, label) {
  if (!Array.isArray(value) || value.length === 0) throw new Error(label + " must be a non-empty provider list");
  if (new Set(value).size !== value.length) throw new Error(label + " must not repeat a provider");
  value.forEach((provider) => adapterOf(provider, label));
  return [...value];
}

function profileDeclarations(value, label) {
  if (value === undefined) return {};
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(label + " must be an object");
  return Object.fromEntries(Object.entries(value).map(([provider, profile]) => {
    adapterOf(provider, `${label}.${provider}`);
    if (!profile || typeof profile !== "object" || Array.isArray(profile)) throw new Error(`${label}.${provider} must be an object`);
    const keys = Object.keys(profile).sort(); const expected = ["effort", "model", "priority", "thinking"];
    if (keys.length !== expected.length || keys.some((key, index) => key !== expected[index])) throw new Error(`${label}.${provider} must contain model, effort, thinking, and priority only`);
    if (!Number.isSafeInteger(profile.priority) || profile.priority < 0) throw new Error(`${label}.${provider}.priority must be a non-negative safe integer`);
    if (profile.thinking !== null && typeof profile.thinking !== "boolean") throw new Error(`${label}.${provider}.thinking must be a boolean or null`);
    return [provider, {
      model: nullableString(profile.model, `${label}.${provider}.model`),
      effort: nullableString(profile.effort, `${label}.${provider}.effort`),
      thinking: profile.thinking,
      priority: profile.priority,
    }];
  }));
}

function route(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(label + " must be an object");
  for (const key of Object.keys(value)) if (!["initial", "closure", "mode", "minimum_heterologous"].includes(key)) throw new Error(label + "." + key + " is not supported");
  const mode = value.mode ?? "adaptive";
  if (!REVIEW_MODES.has(mode)) throw new Error(label + ".mode is invalid");
  const initial = profileList(value.initial, label + ".initial");
  const closure = value.closure === undefined ? null : profileList(value.closure, label + ".closure");
  if (mode !== "adaptive" && closure !== null) throw new Error(label + ".closure is supported only for adaptive");
  if (value.minimum_heterologous !== undefined && (!Number.isSafeInteger(value.minimum_heterologous) || value.minimum_heterologous < 1)) throw new Error(label + ".minimum_heterologous must be a positive integer");
  return {
    initial, ...(closure ? { closure } : {}), mode,
    ...(value.minimum_heterologous ? { minimum_heterologous: value.minimum_heterologous } : {}),
  };
}

function validateRouteProfiles(route, profiles, label) {
  if (Object.keys(profiles).length === 0) return;
  for (const [name, providers] of [["initial", route.initial], ["closure", route.closure ?? []]]) {
    let previousPriority = -1;
    for (const provider of providers) {
      const profile = profiles[provider];
      if (!profile) throw new Error(`${label}.${name} profile ${provider} must be declared in wh_review.profiles`);
      if (profile.priority < previousPriority) throw new Error(`${label}.${name} must be ordered by ascending wh_review.profiles priority`);
      previousPriority = profile.priority;
    }
  }
}

function requireStageReviewMode(stage, configuredRoute, label) {
  if (stage === "make-decision") {
    if (!["single_round", "full_on_structural_rework"].includes(configuredRoute.mode)) {
      throw new Error(`${label}.mode must be single_round or full_on_structural_rework`);
    }
    return;
  }
  const required = stage === "build-code" ? "full_only"
      : "full_on_structural_rework";
  if (configuredRoute.mode !== required) throw new Error(`${label}.mode must be ${required}`);
}

function requireMiniTaskReviewMode(reviewKind, configuredRoute, label) {
  const required = reviewKind === "mini_task.design" ? "full_on_structural_rework" : "full_only";
  if (configuredRoute.mode !== required) throw new Error(`${label}.mode must be ${required}`);
}

function routeEntries(stages) {
  return Object.entries(stages).flatMap(([stage, configured]) => stage === "make-decision"
    ? Object.entries(configured).map(([track, route]) => ({ stage, track, route }))
    : [{ stage, track: null, route: configured }]);
}

function miniTaskRouteEntries(miniTask) {
  return Object.entries(miniTask ?? {}).map(([key, route]) => ({ reviewKind: key.startsWith("mini_task.") ? key : `mini_task.${key}`, route }));
}

function miniTaskConfigKey(reviewKind) {
  return reviewKind.startsWith("mini_task.") ? reviewKind.slice("mini_task.".length) : reviewKind;
}

export function validateWhReviewRoute(whReview, stage, reviewTrack = null) {
  if (!whReview) return null;
  const configured = whReview.stages[stage];
  if (!configured) return null;
  const route = stage === "make-decision" ? configured[reviewTrack] : configured;
  if (!route) return null;
  const label = `workflowhub host wh_review.stages.${stage}${stage === "make-decision" ? `.${reviewTrack}` : ""}`;
  requireStageReviewMode(stage, route, label);
  validateRouteProfiles(route, whReview.profiles, label);
  return route;
}

export function validateAllWhReviewRoutes(whReview) {
  if (!whReview) return [];
  for (const { stage, track, route } of routeEntries(whReview.stages)) {
    const label = `workflowhub host wh_review.stages.${stage}${track ? `.${track}` : ""}`;
    requireStageReviewMode(stage, route, label);
    validateRouteProfiles(route, whReview.profiles, label);
  }
  for (const { reviewKind, route } of miniTaskRouteEntries(whReview.mini_task)) {
    if (!MINI_TASK_REVIEW_KINDS.has(reviewKind)) throw new Error(`workflowhub host wh_review.mini_task.${reviewKind} is unsupported`);
    const label = `workflowhub host wh_review.mini_task.${reviewKind}`;
    requireMiniTaskReviewMode(reviewKind, route, label);
    validateRouteProfiles(route, whReview.profiles, label);
  }
  return [];
}

function whReviewPolicy(value, { requestedStage = null, requestedTrack = null, requestedReviewKind = null } = {}) {
  if (value === undefined) return null;
  if (!value || typeof value !== "object" || Array.isArray(value) || value.version !== 2 || !value.stages || typeof value.stages !== "object" || Array.isArray(value.stages)) throw new Error("workflowhub host wh_review must be version 2 with stages");
  for (const key of Object.keys(value)) if (!["version", "profiles", "stages", "mini_task"].includes(key)) throw new Error("workflowhub host wh_review." + key + " is not supported");
  const profiles = profileDeclarations(value.profiles, "workflowhub host wh_review.profiles");
  const stages = {};
  for (const [stage, configured] of Object.entries(value.stages)) {
    if (!REVIEW_STAGES.has(stage)) throw new Error("workflowhub host wh_review.stages." + stage + " is unsupported");
    if (stage === "make-decision") {
      if (!configured || typeof configured !== "object" || Array.isArray(configured)) {
        if (requestedStage === stage) throw new Error("workflowhub host wh_review.stages.make-decision must be an object");
        stages[stage] = { __invalid_route: "must be an object" };
        continue;
      }
      stages[stage] = {};
      for (const [track, item] of Object.entries(configured)) {
        const label = "workflowhub host wh_review.stages." + stage + "." + track;
        if (!DECISION_TRACKS.has(track)) {
          if (requestedStage === stage) throw new Error(label + " is unsupported");
          stages[stage][track] = { __invalid_route: "unsupported track" };
          continue;
        }
        try {
          stages[stage][track] = route(item, label);
        } catch (error) {
          if (requestedStage === null || (requestedStage === stage && (requestedTrack === null || requestedTrack === track))) throw error;
          stages[stage][track] = { __invalid_route: error.message };
        }
      }
    } else {
      try { stages[stage] = route(configured, "workflowhub host wh_review.stages." + stage); }
      catch (error) {
        if (requestedStage === null || requestedStage === stage) throw error;
        stages[stage] = { __invalid_route: error.message };
      }
    }
  }
  const miniTask = {};
  if (value.mini_task !== undefined) {
    if (!value.mini_task || typeof value.mini_task !== "object" || Array.isArray(value.mini_task)) throw new Error("workflowhub host wh_review.mini_task must be an object");
    for (const [configuredKind, item] of Object.entries(value.mini_task)) {
      const reviewKind = configuredKind.startsWith("mini_task.") ? configuredKind : `mini_task.${configuredKind}`;
      const label = `workflowhub host wh_review.${reviewKind}`;
      if (!MINI_TASK_REVIEW_KINDS.has(reviewKind)) throw new Error(`${label} is unsupported`);
      try {
        const configured = route(item, label);
        requireMiniTaskReviewMode(reviewKind, configured, label);
        miniTask[miniTaskConfigKey(reviewKind)] = configured;
      } catch (error) {
        if (requestedStage === null || requestedReviewKind === reviewKind) throw error;
        miniTask[miniTaskConfigKey(reviewKind)] = { __invalid_route: error.message };
      }
    }
  }
  const policy = { version: 2, profiles, stages, ...(Object.keys(miniTask).length ? { mini_task: miniTask } : {}) };
  if (requestedStage === null) validateAllWhReviewRoutes(policy);
  else validateWhReviewRoute(policy, requestedStage, requestedTrack);
  return policy;
}

function verifyPacketAllowlist(configPath, attachmentRoot) {
  const config = readJson(configPath, "3rd-review config");
  const entry = Array.isArray(config?.attachment_roots)
    ? config.attachment_roots.find((item) => typeof item?.root === "string" && (() => {
      try { return realDirectory(item.root, "3rd-review attachment_roots.root") === attachmentRoot; } catch { return false; }
    })())
    : null;
  if (!entry || !Array.isArray(entry.sources) || !entry.sources.includes(PACKET_SOURCE_PREFIX)) throw new Error(`fixed packet source ${PACKET_SOURCE_PREFIX} is not allowlisted for the configured attachment root`);
}

function validateProfileDeclaration(provider, declaration, config) {
  const configured = config.providers[provider];
  if (!configured) throw new Error(`workflowhub host wh_review.profiles.${provider} is not configured by 3rd-review`);
  for (const field of ["model", "effort", "thinking"]) {
    const expected = configured[field] ?? null;
    if (declaration[field] !== expected) throw new Error(`workflowhub host wh_review.profiles.${provider}.${field} must match 3rd-review config`);
  }
}

function validateWhReviewProfileDeclarations(whReview, config, { requestedStage = null, requestedTrack = null, requestedReviewKind = null } = {}) {
  if (!whReview) return;
  const providers = requestedReviewKind !== null
    ? [...new Set([...(whReview.mini_task?.[miniTaskConfigKey(requestedReviewKind)]?.initial ?? []), ...(whReview.mini_task?.[miniTaskConfigKey(requestedReviewKind)]?.closure ?? [])])]
    : requestedStage === null
    ? Object.keys(whReview.profiles)
    : [...new Set(routeEntries(whReview.stages)
      .filter(({ stage, track }) => stage === requestedStage && track === requestedTrack)
      .flatMap(({ route }) => [...(route.initial ?? []), ...(route.closure ?? [])]))];
  for (const provider of providers) validateProfileDeclaration(provider, whReview.profiles[provider], config);
}

/**
 * Resolve broker execution data from the host-owned WorkflowHub config only.
 * CLI/workflow input has no authority to replace command, broker config, or
 * the fixed packet root.
 */
export function loadTrustedThirdReviewConfig({ hostConfigPath: configuredPath = hostConfigPath(), requestedStage = null, requestedTrack = null, requestedReviewKind = null } = {}) {
  const path = regularFile(configuredPath, "workflowhub host config");
  const config = readJson(path, "workflowhub host config");
  const thirdReview = config?.third_review;
  if (!thirdReview || typeof thirdReview !== "object" || Array.isArray(thirdReview)) throw new Error("workflowhub host config requires third_review");
  const configPath = regularFile(thirdReview.config, "workflowhub host third_review.config");
  const attachmentRoot = realDirectory(thirdReview.attachment_root, "workflowhub host third_review.attachment_root");
  verifyPacketAllowlist(configPath, attachmentRoot);
  const broker = brokerConfig(configPath);
  const whReview = whReviewPolicy(config.wh_review, { requestedStage, requestedTrack, requestedReviewKind });
  validateWhReviewProfileDeclarations(whReview, broker, { requestedStage, requestedTrack, requestedReviewKind });
  const routeWarnings = whReview && requestedStage !== null
    ? routeEntries(whReview.stages).flatMap(({ stage, track }) => {
      if (stage === requestedStage && track === requestedTrack) return [];
      try { validateWhReviewRoute(whReview, stage, track); return []; }
      catch (error) { return [{ stage, ...(track ? { track } : {}), message: error.message }]; }
    })
    : [];
  return { command: command(thirdReview.command), config: configPath, attachmentRoot, attachmentSource: PACKET_SOURCE_PREFIX, ...(whReview ? { whReview } : {}), ...(requestedStage !== null ? { routeWarnings } : {}) };
}

function routeWithProfilePriorities(route, profiles) {
  const profileSpecs = Object.fromEntries([...route.initial, ...(route.closure ?? [])]
    .filter((provider) => profiles[provider] !== undefined)
    .map((provider) => [provider, { provider, ...profiles[provider] }]));
  const priorities = Object.fromEntries(Object.entries(profileSpecs).map(([provider, profile]) => [provider, profile.priority]));
  return Object.keys(profileSpecs).length === 0 ? route : { ...route, profile_priorities: priorities, profile_specs: profileSpecs };
}

export function resolveTrustedReviewRoute(whReview, stage, reviewTrack = null, reviewKind = null) {
  if (reviewKind !== null && reviewKind !== undefined) return resolveTrustedMiniTaskReviewRoute(whReview, reviewKind);
  if (!whReview) return null;
  const configured = whReview.stages[stage];
  if (!configured) return null;
  if (stage !== "make-decision") {
    validateWhReviewRoute(whReview, stage, null);
    return routeWithProfilePriorities(configured, whReview.profiles);
  }
  if (!DECISION_TRACKS.has(reviewTrack)) throw new Error("make-decision wh_review route requires direction or detail review_track");
  if (!configured[reviewTrack]) return null;
  validateWhReviewRoute(whReview, stage, reviewTrack);
  return routeWithProfilePriorities(configured[reviewTrack], whReview.profiles);
}

export function resolveTrustedMiniTaskReviewRoute(whReview, reviewKind) {
  if (!whReview) return null;
  if (!MINI_TASK_REVIEW_KINDS.has(reviewKind)) throw new Error(`unsupported mini-task review kind ${reviewKind}`);
  const configured = whReview.mini_task?.[miniTaskConfigKey(reviewKind)];
  if (!configured) return null;
  const label = `workflowhub host wh_review.mini_task.${reviewKind}`;
  requireMiniTaskReviewMode(reviewKind, configured, label);
  validateRouteProfiles(configured, whReview.profiles, label);
  return routeWithProfilePriorities(configured, whReview.profiles);
}

/**
 * Select the complete first usable review tier from the host-owned broker
 * config. Workflow input has no authority to name providers or models.
 */
function brokerConfig(configuredPath) {
  const path = regularFile(configuredPath, "3rd-review config");
  const config = readJson(path, "3rd-review config");
  if (!Array.isArray(config.tiers) || !config.providers || typeof config.providers !== "object" || Array.isArray(config.providers)) {
    throw new Error("3rd-review config requires tiers and providers");
  }
  return config;
}

function effectiveProfile(config, provider) {
  const configured = config.providers[provider];
  return {
    provider, adapter: adapterOf(provider, "3rd-review provider"),
    model: configured.model ?? null, effort: configured.effort ?? null, thinking: configured.thinking ?? null,
  };
}

function highestPriorityProfilesByAdapter(providers) {
  // The already ranked route order chooses the first profile for an adapter.
  // A second
  // profile on the same CLI stays in the broker group only for its attested
  // SAME_SOURCE outcome, never as a second heterologous reviewer.
  const adapters = new Set();
  return providers.filter((provider) => {
    const adapter = adapterOf(provider, "3rd-review provider");
    if (adapters.has(adapter)) return false;
    adapters.add(adapter);
    return true;
  });
}

function rankRouteProfiles(route, profileSet) {
  const providers = profileSet === "closure" ? route.closure : route.initial;
  const priorities = route.profile_priorities ?? {};
  return providers.map((provider, index) => ({ provider, index, priority: priorities[provider] ?? Number.MAX_SAFE_INTEGER }))
    .sort((left, right) => left.priority - right.priority || left.index - right.index)
    .map(({ provider }) => provider);
}

export function selectTrustedReviewProviderSelection(configuredPath, hostProvider, configuredRoute = null, profileSet = "initial") {
  if (typeof hostProvider !== "string" || hostProvider.length === 0) throw new TypeError("host_provider is required");
  if (!new Set(["initial", "closure"]).has(profileSet)) throw new TypeError("profileSet is invalid");
  const hostAdapter = adapterOf(hostProvider, "host_provider");
  const config = brokerConfig(configuredPath);
  const selectedRoute = configuredRoute
    ? (profileSet === "closure" ? configuredRoute.closure : configuredRoute.initial)
    : null;
  if (configuredRoute && !selectedRoute) throw new Error("wh_review route has no configured closure provider set");
  const candidates = configuredRoute ? [rankRouteProfiles(configuredRoute, profileSet)] : config.tiers;
  for (const tier of candidates) {
    if (!Array.isArray(tier)) throw new Error("3rd-review config tier must be an array");
    for (const provider of tier) {
      if (!config.providers[provider]) {
        throw new Error(configuredRoute
          ? "wh_review route references unknown 3rd-review provider " + provider
          : "3rd-review config tier references unknown provider " + provider);
      }
      // A disabled fallback provider is intentionally skipped: the next
      // configured default tier remains the 3rd-review fallback contract.
      if (configuredRoute && config.providers[provider].enabled !== true) {
        throw new Error("wh_review route references disabled 3rd-review provider " + provider);
      }
    }
    const sameSourceExcluded = tier.filter((provider) => config.providers[provider]?.enabled === true && adapterOf(provider, "3rd-review provider") === hostAdapter);
    const enabledHeterologous = tier.filter((provider) => adapterOf(provider, "3rd-review provider") !== hostAdapter && config.providers[provider]?.enabled === true);
    const selected = highestPriorityProfilesByAdapter(enabledHeterologous);
    const minimum = profileSet === "closure" ? 1 : (configuredRoute?.minimum_heterologous ?? 1);
    if (configuredRoute && selected.length < minimum) throw new Error("wh_review route has insufficient enabled heterologous providers");
    if (selected.length > 0) return {
      // This is the complete candidate group that must reach 3rd-review.
      // eligibleProfiles is local quorum accounting only; it never chooses
      // which same-source candidate the broker gets to attest.
      providers: [...tier],
      eligibleProfiles: selected,
      requestedProfiles: [...tier],
      requestedProfileSpecs: tier.flatMap((provider) => configuredRoute?.profile_specs?.[provider] ? [configuredRoute.profile_specs[provider]] : []),
      sameSourceExcluded,
      effectiveProfiles: selected.map((provider) => effectiveProfile(config, provider)),
    };
  }
  throw new Error(configuredRoute ? "wh_review route has no enabled heterologous provider" : "3rd-review config has no enabled heterologous provider tier");
}

export function selectTrustedReviewProviders(configuredPath, hostProvider, configuredRoute = null, profileSet = "initial") {
  return selectTrustedReviewProviderSelection(configuredPath, hostProvider, configuredRoute, profileSet).providers;
}

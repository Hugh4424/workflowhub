import { lstatSync, readFileSync, realpathSync } from "node:fs";
import { homedir } from "node:os";
import { isAbsolute, join } from "node:path";

export const PACKET_SOURCE_PREFIX = ".wh-review-packets";

function regularFile(path, label) {
  if (!isAbsolute(path)) throw new Error(`${label} must be an absolute path`);
  const stat = lstatSync(path);
  if (stat.isSymbolicLink() || !stat.isFile()) throw new Error(`${label} must be a real regular file`);
  return realpathSync(path);
}

function realDirectory(path, label) {
  if (!isAbsolute(path)) throw new Error(`${label} must be an absolute path`);
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
  const required = stage === "make-decision" ? "single_round"
    : stage === "build-code" ? "full_only"
      : "full_on_structural_rework";
  if (configuredRoute.mode !== required) throw new Error(`${label}.mode must be ${required}`);
}

function whReviewPolicy(value) {
  if (value === undefined) return null;
  if (!value || typeof value !== "object" || Array.isArray(value) || value.version !== 2 || !value.stages || typeof value.stages !== "object" || Array.isArray(value.stages)) throw new Error("workflowhub host wh_review must be version 2 with stages");
  for (const key of Object.keys(value)) if (!["version", "profiles", "stages"].includes(key)) throw new Error("workflowhub host wh_review." + key + " is not supported");
  const profiles = profileDeclarations(value.profiles, "workflowhub host wh_review.profiles");
  const stages = {};
  for (const [stage, configured] of Object.entries(value.stages)) {
    if (!REVIEW_STAGES.has(stage)) throw new Error("workflowhub host wh_review.stages." + stage + " is unsupported");
    if (stage === "make-decision") {
      if (!configured || typeof configured !== "object" || Array.isArray(configured)) throw new Error("workflowhub host wh_review.stages.make-decision must be an object");
      for (const track of Object.keys(configured)) if (!DECISION_TRACKS.has(track)) throw new Error("workflowhub host wh_review.stages.make-decision." + track + " is unsupported");
      stages[stage] = Object.fromEntries(Object.entries(configured).map(([track, item]) => [track, route(item, "workflowhub host wh_review.stages." + stage + "." + track)]));
    } else stages[stage] = route(configured, "workflowhub host wh_review.stages." + stage);
  }
  for (const [stage, configured] of Object.entries(stages)) {
    if (stage === "make-decision") {
      for (const [track, route] of Object.entries(configured)) {
        const label = `workflowhub host wh_review.stages.${stage}.${track}`;
        requireStageReviewMode(stage, route, label);
        validateRouteProfiles(route, profiles, label);
      }
    } else {
      const label = `workflowhub host wh_review.stages.${stage}`;
      requireStageReviewMode(stage, configured, label);
      validateRouteProfiles(configured, profiles, label);
    }
  }
  return { version: 2, profiles, stages };
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

function validateWhReviewProfileDeclarations(whReview, config) {
  if (!whReview) return;
  for (const [provider, declaration] of Object.entries(whReview.profiles)) validateProfileDeclaration(provider, declaration, config);
}

/**
 * Resolve broker execution data from the host-owned WorkflowHub config only.
 * CLI/workflow input has no authority to replace command, broker config, or
 * the fixed packet root.
 */
export function loadTrustedThirdReviewConfig({ hostConfigPath: configuredPath = hostConfigPath() } = {}) {
  const path = regularFile(configuredPath, "workflowhub host config");
  const config = readJson(path, "workflowhub host config");
  const thirdReview = config?.third_review;
  if (!thirdReview || typeof thirdReview !== "object" || Array.isArray(thirdReview)) throw new Error("workflowhub host config requires third_review");
  const configPath = regularFile(thirdReview.config, "workflowhub host third_review.config");
  const attachmentRoot = realDirectory(thirdReview.attachment_root, "workflowhub host third_review.attachment_root");
  verifyPacketAllowlist(configPath, attachmentRoot);
  const broker = brokerConfig(configPath);
  const whReview = whReviewPolicy(config.wh_review);
  validateWhReviewProfileDeclarations(whReview, broker);
  const runtimeRoot = realDirectory(broker?.runtime?.root, "3rd-review config runtime.root");
  return { command: command(thirdReview.command), config: configPath, attachmentRoot, attachmentSource: PACKET_SOURCE_PREFIX, runtimeRoot, ...(whReview ? { whReview } : {}) };
}

function routeWithProfilePriorities(route, profiles) {
  const profileSpecs = Object.fromEntries([...route.initial, ...(route.closure ?? [])]
    .filter((provider) => profiles[provider] !== undefined)
    .map((provider) => [provider, { provider, ...profiles[provider] }]));
  const priorities = Object.fromEntries(Object.entries(profileSpecs).map(([provider, profile]) => [provider, profile.priority]));
  return Object.keys(profileSpecs).length === 0 ? route : { ...route, profile_priorities: priorities, profile_specs: profileSpecs };
}

export function resolveTrustedReviewRoute(whReview, stage, reviewTrack = null) {
  if (!whReview) return null;
  const configured = whReview.stages[stage];
  if (!configured) return null;
  if (stage !== "make-decision") return routeWithProfilePriorities(configured, whReview.profiles);
  if (!DECISION_TRACKS.has(reviewTrack)) throw new Error("make-decision wh_review route requires direction or detail review_track");
  return configured[reviewTrack] ? routeWithProfilePriorities(configured[reviewTrack], whReview.profiles) : null;
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

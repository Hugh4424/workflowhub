import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { homedir } from "node:os";
import { fail } from "./errors.mjs";
import { parseProviderId } from "./provider-ids.mjs";

const envName = /^[A-Za-z_][A-Za-z0-9_]{0,127}$/;

function object(value, label) { if (!value || typeof value !== "object" || Array.isArray(value)) fail("CONFIG_INVALID", `${label} must be an object`); return value; }
function string(value, label, nullable = false) { if (nullable && (value === null || value === undefined)) return null; if (typeof value !== "string" || !value) fail("CONFIG_INVALID", `${label} must be a non-empty string`); return value; }
function names(value, label) { if (!Array.isArray(value) || !value.every((item) => typeof item === "string" && envName.test(item))) fail("CONFIG_INVALID", `${label} must contain environment-variable names`); return [...new Set(value)]; }
function positive(value, label, fallback) { if (value === undefined) return fallback; if (!Number.isSafeInteger(value) || value < 1) fail("CONFIG_INVALID", `${label} must be a positive integer`); return value; }
function sourceId(value, label, fallback) { const id = value === undefined ? fallback : value; if (typeof id !== "string" || id.length === 0 || /[\u0000-\u001f]/.test(id)) fail("CONFIG_INVALID", `${label} must be a safe non-empty string`); return id; }
function attachmentRoots(value) {
  if (value === undefined) return [];
  if (!Array.isArray(value)) fail("CONFIG_INVALID", "attachment_roots must be an array");
  const seen = new Set();
  return value.map((item, index) => {
    const source = object(item, `attachment_roots[${index}]`); const root = string(source.root, `attachment_roots[${index}].root`);
    if (!path.isAbsolute(root)) fail("CONFIG_INVALID", `attachment_roots[${index}].root must be absolute`);
    let canonical; try { canonical = fs.realpathSync(root); if (!fs.statSync(canonical).isDirectory()) fail("CONFIG_INVALID", `attachment_roots[${index}].root must be a directory`); } catch (error) { if (error?.code === "CONFIG_INVALID") throw error; fail("CONFIG_INVALID", `attachment_roots[${index}].root must exist`); }
    if (seen.has(canonical)) fail("CONFIG_INVALID", `attachment_roots[${index}].root duplicates another root`); seen.add(canonical);
    if (!Array.isArray(source.sources) || source.sources.length === 0 || !source.sources.every((entry) => typeof entry === "string" && entry.split("/").every((part) => part && part !== "." && part !== ".." && !part.startsWith("~") && !part.includes("\\")))) fail("CONFIG_INVALID", `attachment_roots[${index}].sources must contain safe relative prefixes`);
    return { root: canonical, sources: [...new Set(source.sources)] };
  });
}

export function defaultConfigPath() { return path.join(homedir(), ".config", "3rd-review", "config.json"); }

export function validateConfig(input) {
  const root = object(input, "config");
  if (root.version !== 4) fail("CONFIG_INVALID", "config.version must be 4");
  const runtimeIn = object(root.runtime ?? {}, "config.runtime");
  if (Object.hasOwn(runtimeIn, "idle_timeout_ms") || Object.hasOwn(runtimeIn, "max_duration_ms")) fail("CONFIG_INVALID", "config.runtime.idle_timeout_ms and max_duration_ms are no longer supported; provider execution has no elapsed-time limit");
  // v4 accepted a positive value here. Preserve read compatibility, but do
  // not let an old config silently restore a wall-clock kill switch.
  const runtime = {
    root: string(runtimeIn.root ?? path.join("/tmp", "3rd-review"), "config.runtime.root"),
    ttl_hours: positive(runtimeIn.ttl_hours, "config.runtime.ttl_hours", 24),
    max_prompt_bytes: positive(runtimeIn.max_prompt_bytes, "config.runtime.max_prompt_bytes", 524288),
    max_output_bytes: positive(runtimeIn.max_output_bytes, "config.runtime.max_output_bytes", 10485760),
    max_attachment_bytes: positive(runtimeIn.max_attachment_bytes, "config.runtime.max_attachment_bytes", 10485760),
    liveness_interval_ms: positive(runtimeIn.liveness_interval_ms, "config.runtime.liveness_interval_ms", 1000),
    // Retain the null field in the normalized v4 shape for callers that read
    // it, but never permit elapsed time to terminate an active review.
    max_wall_clock_ms: null,
    orphan_timeout_ms: positive(runtimeIn.orphan_timeout_ms, "config.runtime.orphan_timeout_ms", 30000),
  };
  if (!path.isAbsolute(runtime.root)) fail("CONFIG_INVALID", "config.runtime.root must be absolute");
  if (root.file_only_sandbox !== undefined) fail("CONFIG_INVALID", "config.file_only_sandbox is no longer supported; file_only uses the provider-private workspace");
  const roots = attachmentRoots(root.attachment_roots);
  const rawProviders = object(root.providers, "config.providers");
  const providers = {};
  for (const [id, raw] of Object.entries(rawProviders)) {
    const identity = parseProviderId(id);
    if (!identity) fail("CONFIG_INVALID", `provider must be a supported CLI id or CLI/model instance: ${id}`);
    const source = object(raw, `providers.${id}`);
    const auth = object(source.auth ?? { type: "native" }, `providers.${id}.auth`);
    if (!["native", "env"].includes(auth.type)) fail("CONFIG_INVALID", `providers.${id}.auth.type must be native or env`);
    if (source.allow_host_state !== undefined && typeof source.allow_host_state !== "boolean") fail("CONFIG_INVALID", `providers.${id}.allow_host_state must be a boolean`);
    const authEnv = names(auth.env ?? [], `providers.${id}.auth.env`);
    if (auth.type === "env" && authEnv.length === 0) fail("CONFIG_INVALID", `providers.${id}.auth.env is required for env authentication`);
    const configuredSourceId = sourceId(source.source_id, `providers.${id}.source_id`, id);
    // Provider wall-clock deadlines are retired from the v4 execution model.
    // Keep a null public fact for the existing result protocol instead of
    // accepting a second elapsed-time timer.
    if (source.deadline_ms !== undefined && source.deadline_ms !== null) fail("CONFIG_INVALID", `providers.${id}.deadline_ms is no longer supported; provider execution has no elapsed-time limit`);
    const deadlineMs = null;
    providers[id] = {
      ...identity, enabled: source.enabled !== false, command: string(source.command, `providers.${id}.command`),
      model: string(source.model, `providers.${id}.model`, true), effort: string(source.effort, `providers.${id}.effort`, true),
      thinking: source.thinking === undefined || source.thinking === null ? null : Boolean(source.thinking),
      source_id: configuredSourceId,
      deadline_ms: deadlineMs,
      config_id: createHash("sha256").update(JSON.stringify({ id, source_id: configuredSourceId, model: source.model ?? null, effort: source.effort ?? null, thinking: source.thinking ?? null, deadline_ms: deadlineMs }), "utf8").digest("hex"),
      allow_host_state: source.allow_host_state === true,
      auth: { type: auth.type, env: authEnv }, env: names(source.env ?? [], `providers.${id}.env`),
    };
  }
  if (!Array.isArray(root.tiers) || root.tiers.length === 0) fail("CONFIG_INVALID", "config.tiers must be a non-empty array");
  const seen = new Set();
  const tiers = [];
  for (const [index, tier] of root.tiers.entries()) {
    if (!Array.isArray(tier) || tier.length === 0) fail("CONFIG_INVALID", `tiers[${index}] must be non-empty`);
    const normalized = [];
    for (const id of tier) {
      if (!providers[id]) fail("CONFIG_INVALID", `tiers[${index}] references unknown provider ${id}`);
      // A provider instance has one routing position. Keep its first tier and
      // drop later duplicate references so one malformed fallback entry cannot
      // invalidate an otherwise usable current route or run the same session
      // more than once.
      if (seen.has(id)) continue;
      seen.add(id); normalized.push(id);
    }
    if (normalized.length > 0) tiers.push(normalized);
  }
  if (tiers.length === 0) fail("CONFIG_INVALID", "config.tiers must reference at least one provider");
  return { version: 4, runtime, attachment_roots: roots, tiers, providers };
}
function freeze(value) { if (value && typeof value === "object" && !Object.isFrozen(value)) { for (const item of Object.values(value)) freeze(item); Object.freeze(value); } return value; }
export function loadConfig(file = defaultConfigPath()) {
  try {
    return freeze(validateConfig(JSON.parse(fs.readFileSync(path.resolve(file), "utf8"))));
  }
  catch (error) { if (error?.code) throw error; fail("CONFIG_INVALID", `cannot load config ${file}: ${error.message}`); }
}

export const SUPPORTED_PROVIDER_IDS = Object.freeze([
  "claude-code",
  "codex",
  "cursor",
  "dsh",
  "grok",
  "kimi",
  "opencode",
  "antigravity",
  "pi",
]);

const supported = new Set(SUPPORTED_PROVIDER_IDS);

export function isSupportedProviderId(value) {
  return typeof value === "string" && supported.has(value);
}

const providerInstance = /^([a-z][a-z0-9-]*)(?:\/([a-z0-9](?:[a-z0-9-]|\.(?=[a-z0-9]))*))?$/;

export function parseProviderId(value) {
  if (typeof value !== "string") return null;
  const match = providerInstance.exec(value);
  if (!match || !supported.has(match[1])) return null;
  return { id: value, adapter: match[1], profile: match[2] ?? null, runtime_key: match[2] ? `${match[1]}%2F${match[2]}` : match[1] };
}

export function adapterForProviderId(value) { return parseProviderId(value)?.adapter ?? null; }
export function providerRuntimeKey(value) { return parseProviderId(value)?.runtime_key ?? null; }

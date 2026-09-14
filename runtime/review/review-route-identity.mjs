import { createHash } from "node:crypto";

import { reviewIdentityFromInput } from "./review-policy.mjs";

function hash(value) {
  return createHash("sha256").update(value).digest("hex");
}

function providerSelectionShape(selection) {
  const providers = Array.isArray(selection) ? [...selection] : selection?.providers;
  if (!Array.isArray(providers) || providers.length === 0) {
    throw new TypeError("PROVIDER_SELECTION_INVALID: trusted provider selection is empty");
  }
  if (providers.some((provider) => typeof provider !== "string" || provider.trim() === "")) {
    throw new TypeError("PROVIDER_SELECTION_INVALID: provider names are invalid");
  }
  if (new Set(providers).size !== providers.length) {
    throw new TypeError("PROVIDER_SELECTION_INVALID: provider selection repeats a provider");
  }
  const identities = Array.isArray(selection) ? undefined : (selection?.provider_identities ?? selection?.providerIdentities);
  if (identities === undefined || identities === null) return { providers };
  if (!identities || typeof identities !== "object" || Array.isArray(identities)) {
    throw new TypeError("PROVIDER_SELECTION_INVALID: provider identities are invalid");
  }
  return {
    providers,
    provider_identities: Object.fromEntries(Object.entries(identities).map(([provider, identity]) => [
      provider,
      identity && typeof identity === "object" ? { ...identity } : identity,
    ])),
  };
}

/** Resolve a trusted broker route from injected host configuration functions. */
export function resolveReviewRouteIdentity(input, { loadConfig, resolveRoute, selectProviders } = {}) {
  if (typeof loadConfig !== "function" || typeof resolveRoute !== "function" || typeof selectProviders !== "function") {
    throw new Error("trusted review route dependencies are required");
  }
  const identity = reviewIdentityFromInput(input);
  const track = identity.reviewTrack;
  const scope = identity.reviewScope;
  const kind = identity.reviewKind;
  const host = input.host_provider ?? input.hostProvider;
  if (typeof host !== "string" || !host.trim()) throw new TypeError("host_provider is required for trusted route identity");
  const trusted = loadConfig({ requestedStage: input.stage, requestedTrack: track, requestedReviewKind: kind });
  const route = resolveRoute(trusted.whReview, input.stage, track, kind, scope);
  if (!route) throw new Error("ROUTE_UNAVAILABLE: no trusted review route");
  const selection = providerSelectionShape(selectProviders(trusted.config, host, route));
  const stable = (value) => Array.isArray(value) ? value.map(stable) : value && typeof value === "object"
    ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])])) : value;
  return Object.freeze({
    route_identity: hash(JSON.stringify(stable({ stage: input.stage, review_track: track, review_scope: scope, review_kind: kind, host_provider: host, route, selection }))),
    provider_selection: selection,
  });
}

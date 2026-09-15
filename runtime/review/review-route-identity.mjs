import { createHash } from "node:crypto";

import { reviewIdentityFromInput } from "./review-policy.mjs";

function hash(value) {
  return createHash("sha256").update(value).digest("hex");
}

function plainRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    && Object.getPrototypeOf(value) === Object.prototype;
}

function exactKeys(value, expected, label) {
  if (!plainRecord(value) || Object.keys(value).sort().join("\\u0000") !== [...expected].sort().join("\\u0000")) {
    throw new TypeError(`PROVIDER_SELECTION_INVALID: ${label} has unsupported fields`);
  }
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
  if (!plainRecord(identities)) {
    throw new TypeError("PROVIDER_SELECTION_INVALID: provider identities are invalid");
  }
  const identityKeys = Object.keys(identities).sort();
  if (identityKeys.join("\\u0000") !== [...providers].sort().join("\\u0000")) {
    throw new TypeError("PROVIDER_SELECTION_INVALID: provider identities do not match providers");
  }
  return {
    providers,
    provider_identities: Object.fromEntries(providers.map((provider) => {
      const identity = identities[provider];
      exactKeys(identity, ["source_id", "config_id"], `provider identity ${provider}`);
      if (typeof identity.source_id !== "string" || identity.source_id.trim() === ""
          || typeof identity.config_id !== "string" || identity.config_id.trim() === "") {
        throw new TypeError(`PROVIDER_SELECTION_INVALID: provider identity ${provider} is invalid`);
      }
      return [provider, { source_id: identity.source_id, config_id: identity.config_id }];
    })),
  };
}

/**
 * Resolve a trusted broker route from injected host configuration functions.
 *
 * The production host config loader lives in the wh-review skill, so this
 * runtime helper cannot supply a working default by itself. A caller that uses
 * it as the default must thread the dependencies through; otherwise the
 * request fails closed with an explicit typed code instead of an opaque
 * message.
 */
export function resolveReviewRouteIdentity(input, { loadConfig, resolveRoute, selectProviders } = {}) {
  if (typeof loadConfig !== "function" || typeof resolveRoute !== "function" || typeof selectProviders !== "function") {
    const error = new Error("trusted review route dependencies are required: pass loadConfig, resolveRoute, and selectProviders");
    error.code = "REVIEW_ROUTE_DEPENDENCIES_REQUIRED";
    throw error;
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

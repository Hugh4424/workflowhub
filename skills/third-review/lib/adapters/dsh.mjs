import { fail } from "../errors.mjs";

/**
 * dsh (DeepSeek Harness) is a host identity, not a review provider.
 *
 * Callers declare `host_provider: "dsh"` so the broker can apply same-source
 * exclusion and provenance recording for DSH-hosted review requests. There is
 * no dsh reviewer CLI to spawn; any attempt to use dsh as a reviewer profile
 * fails loudly instead of degrading into an opaque spawn error.
 */
function hostOnly() {
  fail("UNSUPPORTED_PROVIDER", "dsh is a host identity for same-source exclusion, not a review provider; configure a real reviewer profile instead");
}

export default {
  capabilities: { continuation: false, attachment_delivery: [] },
  host_identity_only: true,
  modelInstruction: "",
  publicOutputRewritePrompt: "",
  doctor: hostOnly,
  start: hostOnly,
  resume: hostOnly,
  parse: hostOnly,
  observeLine: hostOnly,
};

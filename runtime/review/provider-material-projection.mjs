/**
 * How caller review materials become provider-visible bundle materials.
 *
 * This module owns the two rules that the *declared* packet material identity and
 * the *delivered* bundle bytes must agree on. They are one module on purpose:
 * when these rules lived in two copies, the copies drifted and every managed
 * review failed with
 * `PROTOCOL_INCOMPATIBLE: 3rd-review managed lifecycle envelope is invalid`.
 *
 * Rule 1 — host-path redaction
 * ----------------------------
 * Absolute host paths must never reach a review provider. On 2026-09-19 the
 * runtime copy stopped only at whitespace and ASCII quoting characters, so a
 * host path followed by Chinese text swallowed the rest of the line, while the
 * skill-side copy stopped at CJK punctuation and fullwidth forms. WorkflowHub
 * therefore declared an identity computed over bytes it never delivered, and
 * the broker — which hashes the bytes it actually received — disagreed. The
 * concrete trigger was the Windows drive-letter branch matching the `s:/`
 * inside `https://…` and then consuming the Chinese sentence that followed.
 *
 * Do not reintroduce a second copy of this rule anywhere: import this module.
 *
 * Why the stop set is this wide
 * -----------------------------
 * `[^\s"'`<>()[\]{}]` alone consumes everything up to the next whitespace. In
 * Chinese review material a path is normally followed by punctuation and prose
 * with no space, for example `，取消理由：DEF-01；DEF-01`. Stopping only at
 * whitespace destroys reviewer-relevant prose and tokens. The extra exclusion
 * ranges below stop the match at CJK punctuation, CJK symbols and fullwidth
 * forms instead. That behaviour is a contract, pinned by
 * `skills/wh-review/scripts/__tests__/material-redaction.test.mjs`
 * ("preserves CJK prose and DEF-01 tokens after a redacted host path").
 * Widening these classes silently changes material identity; do not do it
 * without changing that test's intent.
 *
 * Rule 2 — provider material paths
 * --------------------------------
 * Ordinary materials are delivered as `materials/<NN>-<stem>.<ext>`. The
 * direction-review flow is the exception: the broker's managed direction
 * validation requires a delivered path whose last segment is exactly
 * `direction_flow.json`
 * (`3rd-review/lib/broker.mjs` `validateDirectionReviewMaterial`, which accepts
 * `direction_flow.json` or any `*​/direction_flow.json`). The numbered form
 * `materials/09-direction_flow.json` does NOT match, so every direction provider
 * failed with `MATERIAL_INCOMPLETE: direction-review.v1 material is missing
 * direction_flow.json` even though the file was present. Keep the flow at the
 * bundle root under its exact basename.
 */

export const HOST_PATH_PLACEHOLDER = "<host-path-redacted>";
export const AUTHENTICATED_EVIDENCE_PATH = "authenticated-evidence.json";

const DIRECTION_FLOW_MATERIAL_KEY = "direction_flow";
const DIRECTION_FLOW_PATH = "direction_flow.json";

const LOCAL_HOST_PATH = /\/(?:Users|home|private|tmp|var|etc|opt|mnt|Volumes|root|usr|bin|sbin|dev|proc|sys|Library)\/[^\s"'`<>()[\]{}\u2018-\u201f\u2026\u3000-\u303f\ufe30-\ufe4f\uff01-\uff0f\uff1a-\uff20\uff3b-\uff40\uff5b-\uff65]+|[A-Za-z]:[\\/][^\s"'`<>()[\]{}\u2018-\u201f\u2026\u3000-\u303f\ufe30-\ufe4f\uff01-\uff0f\uff1a-\uff20\uff3b-\uff40\uff5b-\uff65]+/g;

export function redactHostPathText(value) {
  return value.replace(LOCAL_HOST_PATH, HOST_PATH_PLACEHOLDER);
}

export function redactProviderHostPaths(value) {
  if (typeof value === "string") return redactHostPathText(value);
  if (Array.isArray(value)) return value.map((item) => redactProviderHostPaths(item));
  if (!value || typeof value !== "object" || Buffer.isBuffer(value)) return value;
  return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, redactProviderHostPaths(child)]));
}

/**
 * The bundle-relative path a redacted material is delivered under. `index` is
 * the material's position in the caller's material order.
 */
export function providerMaterialPath(key, index, value) {
  if (key === DIRECTION_FLOW_MATERIAL_KEY) return DIRECTION_FLOW_PATH;
  const stem = String(key).replace(/[^A-Za-z0-9._-]+/g, "_").replace(/^\.+/, "") || `material_${index + 1}`;
  return `materials/${String(index + 1).padStart(2, "0")}-${stem}${typeof value === "string" || Buffer.isBuffer(value) ? ".md" : ".json"}`;
}

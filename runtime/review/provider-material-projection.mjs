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
  if (/^phase_authority:phases\/P[1-9]\d*\.md$/.test(key)) return `requirements/${key.slice("phase_authority:".length)}`;
  const stem = String(key).replace(/[^A-Za-z0-9._-]+/g, "_").replace(/^\.+/, "") || `material_${index + 1}`;
  return `materials/${String(index + 1).padStart(2, "0")}-${stem}${typeof value === "string" || Buffer.isBuffer(value) ? ".md" : ".json"}`;
}

/** One cohort identity and one physical Phase expansion for packet and hash writers. */
export function reviewActivationCohort(input) {
  if (input?.stage !== "build-plan") return null;
  const snake = input.activation_cohort;
  const camel = input.activationCohort;
  if (snake !== undefined && camel !== undefined && snake !== camel) throw new Error("MATERIAL_INCOMPLETE: conflicting activation cohort aliases");
  const cohort = snake ?? camel ?? "pre";
  if (!new Set(["pre", "post"]).has(cohort)) throw new Error(`MATERIAL_INCOMPLETE: invalid activation cohort ${cohort}`);
  return cohort;
}

export function providerMaterialEntries(input) {
  const materials = input?.materials;
  if (!materials || typeof materials !== "object" || Array.isArray(materials)) throw new Error("MATERIAL_INCOMPLETE: materials must be an object");
  if (reviewActivationCohort(input) !== "post") return Object.entries(materials);
  const authorities = materials.phase_authorities;
  const index = materials.phase_index;
  if (!authorities || typeof authorities !== "object" || Array.isArray(authorities)
      || Object.getPrototypeOf(authorities) !== Object.prototype || typeof index !== "string") {
    throw new Error("MATERIAL_INCOMPLETE: post phase_authorities and phase_index are required");
  }
  const section = index.split(/^##\s+Execution Index\s*$/m)[1]?.split(/^##\s+/m)[0];
  if (!section) throw new Error("MATERIAL_INCOMPLETE: post phase_index requires Execution Index");
  const rows = section.split("\n").filter((line) => /^\|/.test(line.trim())
    && !/^\|\s*(?:phase\b|[-: ]+\|)/i.test(line.trim()));
  const refs = [...section.matchAll(/^\|\s*`?(P[1-9]\d*)`?\s*\|\s*`?(phases\/P[1-9]\d*\.md)`?\s*\|/gm)]
    .map(([, id, path]) => ({ id, path }));
  if (refs.length === 0 || refs.length !== rows.length || Object.keys(authorities).length !== refs.length) {
    throw new Error("MATERIAL_INCOMPLETE: post phase index and physical files differ");
  }
  for (const [position, { id, path }] of refs.entries()) {
    if (id !== `P${position + 1}` || path !== `phases/P${position + 1}.md`
        || typeof authorities[path] !== "string" || authorities[path].trim() === ""
        || !new RegExp(`^#\\s+Phase\\s+${id}\\b`, "m").test(authorities[path])) {
      throw new Error(`MATERIAL_INCOMPLETE: ${path} is missing or invalid`);
    }
  }
  return Object.entries(materials).flatMap(([key, value]) => key === "phase_authorities"
    ? refs.map(({ path }) => [`phase_authority:${path}`, authorities[path]])
    : [[key, value]]);
}

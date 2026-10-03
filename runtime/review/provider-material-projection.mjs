/** Shared provider-visible text/JSON/UTF-8 byte projection.
 * Preserve public provenance and line positions; remove known credentials and
 * local host paths before serialization. This is not a universal secret detector.
 * Direction flow keeps the broker-required direction_flow.json delivery path.
 */

export const HOST_PATH_PLACEHOLDER = "<host-path-redacted>";
export const AUTHENTICATED_EVIDENCE_PATH = "authenticated-evidence.json";

const DIRECTION_FLOW_MATERIAL_KEY = "direction_flow";
const DIRECTION_FLOW_PATH = "direction_flow.json";

// Keep the existing CJK stop set: path redaction must not eat the next
// sentence or change line positions used by reviewer findings.
const LOCAL_HOST_PATH = /\/(?:Users|home|private|tmp|var|etc|opt|mnt|Volumes|root|usr|bin|sbin|dev|proc|sys|Library)\/[^\s"'`<>()[\]{}\u2018-\u201f\u2026\u3000-\u303f\ufe30-\ufe4f\uff01-\uff0f\uff1a-\uff20\uff3b-\uff40\uff5b-\uff65]+|(?<![A-Za-z0-9])[A-Za-z]:[\\/][^\s"'`<>()[\]{}\u2018-\u201f\u2026\u3000-\u303f\ufe30-\ufe4f\uff01-\uff0f\uff1a-\uff20\uff3b-\uff40\uff5b-\uff65]+/g;
const URL_TEXT = /\b(?:https?|file):\/\/[^\s"'`<>()[\]{}\u2018-\u201f\u2026\u3000-\u303f\ufe30-\ufe4f\uff01-\uff0f\uff1a-\uff20\uff3b-\uff40\uff5b-\uff65]+/gi;
const SECRET_PLACEHOLDER = "<secret-redacted>";
const SECRET_TOKEN = "[^\\s\\\"'`,;<>()[\\]{}\\u2018-\\u201f\\u2026\\u3000-\\u303f\\ufe30-\\ufe4f\\uff01-\\uff0f\\uff1a-\\uff20\\uff3b-\\uff40\\uff5b-\\uff65]+";
const KEY_VALUE_SECRET = new RegExp(`(?<![A-Za-z0-9_.-])(["']?[A-Za-z0-9_.-]*(?:api[_-]?key|access[_-]?token|refresh[_-]?token|id[_-]?token|auth[_-]?token|bearer[_-]?token|client[_-]?secret|password|passwd|secret|authorization|credentials?)["']?[ \\t]*[:=][ \\t]*)(?:((?:Bearer|Basic)[ \\t]+${SECRET_TOKEN})|("[^"\\r\\n]*"|'[^'\\r\\n]*'|${SECRET_TOKEN}))`, "gi");
const BEARER_SECRET = new RegExp(`\\b(Bearer[ \\t]+)${SECRET_TOKEN}`, "gi");
function sensitiveKey(key, query = false) {
  const normalized = key.replace(/[^a-z0-9]/gi, "").toLowerCase();
  return /(?:apikey|accesstoken|refreshtoken|idtoken|authtoken|bearertoken|clientsecret|password|passwd|secret|authorization|credentials?)$/.test(normalized)
    || (query && ["key", "token", "auth", "signature", "sig", "xamzsignature", "xamzsecuritytoken"].includes(normalized));
}
function redactUrl(url) {
  if (/^file:/i.test(url)) return HOST_PATH_PLACEHOLDER;
  // Edit only credentials and known secret query values. URL normalization
  // would rewrite public provenance URLs, escapes and source line content.
  return url.replace(/^(https?:\/\/)[^/?#]*@/i, "$1REDACTED@")
    .replace(/([?&])([^=&#]+)=([^&#]*)/g, (whole, separator, key) => {
      let decoded; try { decoded = decodeURIComponent(key); } catch { decoded = key; }
      return sensitiveKey(decoded, true) ? `${separator}${key}=REDACTED` : whole;
    });
}
function urlRanges(text) {
  return [...text.matchAll(URL_TEXT)].map(match => [match.index, match.index + match[0].length]);
}
function insideUrl(ranges, offset) { return ranges.some(([start, end]) => offset >= start && offset < end); }
function redactKnownSecrets(value) {
  const ranges = urlRanges(value);
  const text = value.replace(KEY_VALUE_SECRET, (whole, prefix, authorization, literal, offset) => {
    // Query keys belong to redactUrl. Outside URLs, redact the complete known
    // credential value even when its quoted text or Bearer token contains a URL.
    if (insideUrl(ranges, offset)) return whole;
    if (literal === '""' || literal === "''") return whole;
    const quote = literal?.[0];
    return prefix + (quote === '"' || quote === "'" ? `${quote}${SECRET_PLACEHOLDER}${quote}` : SECRET_PLACEHOLDER);
  });
  const remainingUrls = urlRanges(text);
  return text.replace(BEARER_SECRET, (whole, prefix, offset) => insideUrl(remainingUrls, offset) ? whole : `${prefix}${SECRET_PLACEHOLDER}`);
}
export function redactHostPathText(value) {
  const text = redactKnownSecrets(value);
  // Public URL chunks are handled before local paths, so /Users/ in a remote
  // URL and the s:/ inside https:// cannot be mistaken for host paths.
  let output = "", offset = 0;
  for (const match of text.matchAll(URL_TEXT)) {
    output += text.slice(offset, match.index).replace(LOCAL_HOST_PATH, HOST_PATH_PLACEHOLDER) + redactUrl(match[0]);
    offset = match.index + match[0].length;
  }
  return output + text.slice(offset).replace(LOCAL_HOST_PATH, HOST_PATH_PLACEHOLDER);
}

export function redactProviderHostPaths(value) {
  if (typeof value === "string") return redactHostPathText(value);
  if (Buffer.isBuffer(value) || value instanceof Uint8Array) {
    let text;
    try { text = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(value); }
    catch (cause) { throw Object.assign(new TypeError("MATERIAL_NOT_UTF8: provider material bytes must be UTF-8 text", { cause }), { code: "MATERIAL_NOT_UTF8" }); }
    const bytes = Buffer.from(redactHostPathText(text), "utf8");
    return Buffer.isBuffer(value) ? bytes : new Uint8Array(bytes);
  }
  if (Array.isArray(value)) return value.map((item) => redactProviderHostPaths(item));
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value).map(([key, child]) => [key,
    sensitiveKey(key) && child !== null && child !== undefined && child !== ""
      ? (typeof child === "string" ? child.replace(/[^\r\n]+/g, SECRET_PLACEHOLDER) : SECRET_PLACEHOLDER)
      : redactProviderHostPaths(child)]));
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

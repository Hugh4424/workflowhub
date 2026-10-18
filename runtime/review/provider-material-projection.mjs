import { Script } from "node:vm";

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
const LOCAL_HOST_PATH = /\/(?:Users|home|private|tmp|var|etc|opt|mnt|Volumes|root|usr|bin|sbin|dev|proc|sys|Library)\/[^\s"'`<>()[\]{}\u2018-\u201f\u2026\u3000-\u303f\ufe30-\ufe4f\uff01-\uff0f\uff1a-\uff20\uff3b-\uff40\uff5b-\uff65]+|(?:\\\\[?.]\\|(?<![A-Za-z0-9\\]))[A-Za-z]:[\\/][^\s"'`<>()[\]{}\u2018-\u201f\u2026\u3000-\u303f\ufe30-\ufe4f\uff01-\uff0f\uff1a-\uff20\uff3b-\uff40\uff5b-\uff65]+/g;
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
// Only a complete, parseable single-line declaration can preserve an await
// keyword. The API accepts arbitrary text: strings/comments/templates are not
// executable context, even when a line in their body looks like a declaration.
function executableAwaitOffsets(text) {
  const candidates = [...text.matchAll(/^[ \t]*(?:[+-][ \t]*)?(?:const|let|var)[ \t]+[A-Za-z_$][\w$]*[ \t]*=[ \t]*(await)[ \t]+[A-Za-z_$][\w$]*(?:[ \t]*\.[ \t]*[A-Za-z_$][\w$]*)*[ \t]*\(/gm)];
  if (candidates.length === 0) return new Set();
  const code = new Uint8Array(text.length).fill(1);
  const quotedEnd = (start, quote) => {
    let i = start + 1;
    while (i < text.length) {
      if (text[i] === "\\") { i += 2; continue; }
      if (text[i++] === quote) return i;
    }
    return i;
  };
  const commentEnd = start => {
    const end = text.indexOf("*/", start + 2);
    return end < 0 ? text.length : end + 2;
  };
  const lineEnd = start => { const end = text.indexOf("\n", start); return end < 0 ? text.length : end; };
  const templateEnd = start => {
    const stack = [{ text: true }]; let i = start + 1;
    while (i < text.length && stack.length) {
      const frame = stack.at(-1), char = text[i];
      if (frame.text) {
        if (char === "\\") { i += 2; continue; }
        if (char === "`") { stack.pop(); i++; continue; }
        if (char === "$" && text[i + 1] === "{") { stack.push({ depth: 1 }); i += 2; continue; }
      } else {
        if (char === "'" || char === '"') { i = quotedEnd(i, char); continue; }
        if (char === "`") { stack.push({ text: true }); i++; continue; }
        if (char === "/" && text[i + 1] === "*") { i = commentEnd(i); continue; }
        // A slash expression is deliberately conservative; no execution
        // exception is needed inside a template interpolation or regex body.
        if (char === "/") { i = lineEnd(i); continue; }
        if (char === "{") frame.depth++;
        if (char === "}" && --frame.depth === 0) stack.pop();
      }
      i++;
    }
    return i;
  };
  for (let i = 0; i < text.length;) {
    const start = i, char = text[i];
    if (char === "'" || char === '"') i = quotedEnd(i, char);
    else if (char === "`") i = templateEnd(i);
    else if (char === "/" && text[i + 1] === "*") i = commentEnd(i);
    else if (char === "/") i = lineEnd(i);
    else { i++; continue; }
    code.fill(0, start, i);
  }
  const allowed = new Set();
  for (const match of candidates) {
    const keyword = match.index + match[0].indexOf("await", match[0].indexOf("=") + 1);
    if (code.subarray(match.index, keyword + 5).some(value => value === 0)) continue;
    const end = lineEnd(match.index);
    const declaration = text.slice(match.index, end).replace(/^([ \t]*)[+-][ \t]*/, "$1");
    try {
      // Parse only. Never evaluate caller material. V8 rejects incomplete or
      // ambiguous RHS syntax instead of granting it an exception.
      new Script(`(async function(){\n${declaration}\n})`);
      allowed.add(keyword);
    } catch { /* Ambiguous material retains ordinary credential redaction. */ }
  }
  return allowed;
}

function redactKnownSecrets(value) {
  const executableAwait = executableAwaitOffsets(value);
  const ranges = urlRanges(value);
  const text = value.replace(KEY_VALUE_SECRET, (whole, prefix, authorization, literal, offset) => {
    // Query keys belong to redactUrl. Outside URLs, redact the complete known
    // credential value even when its quoted text or Bearer token contains a URL.
    if (insideUrl(ranges, offset)) return whole;
    if (literal === "await" && executableAwait.has(offset + prefix.length)) return whole;
    if (literal === '""' || literal === "''") return whole;
    const quote = literal?.[0];
    return prefix + (quote === '"' || quote === "'" ? `${quote}${SECRET_PLACEHOLDER}${quote}` : SECRET_PLACEHOLDER);
  });
  const remainingUrls = urlRanges(text);
  return text.replace(BEARER_SECRET, (whole, prefix, offset) => insideUrl(remainingUrls, offset) ? whole : `${prefix}${SECRET_PLACEHOLDER}`);
}
export function redactHostPathText(value) {
  const text = redactKnownSecrets(value);
  // /dev/null is Git's add/delete header sentinel, not a host input file.
  // Preserve only exact header lines before a hunk; ordinary prose is redacted.
  const gitNullOffsets = new Set();
  let inGitHeader = false;
  for (const match of text.matchAll(/^[^\n]*(?:\n|$)/gm)) {
    const line = match[0].replace(/\r?\n$/, "");
    if (line.startsWith("diff --git ")) inGitHeader = true;
    else if (/^(?:@@ |GIT binary patch$|Binary files |```)/.test(line)) inGitHeader = false;
    if (inGitHeader && /^(?:---|\+\+\+) \/dev\/null\r?$/.test(line)) gitNullOffsets.add(match.index + 4);
  }
  const redactLocal = (chunk, base) => chunk.replace(LOCAL_HOST_PATH, (path, offset) =>
    path === "/dev/null" && gitNullOffsets.has(base + offset) ? path : HOST_PATH_PLACEHOLDER);
  // Public URL chunks are handled before local paths, so /Users/ in a remote
  // URL and the s:/ inside https:// cannot be mistaken for host paths.
  let output = "", offset = 0;
  for (const match of text.matchAll(URL_TEXT)) {
    output += redactLocal(text.slice(offset, match.index), offset) + redactUrl(match[0]);
    offset = match.index + match[0].length;
  }
  return output + redactLocal(text.slice(offset), offset);
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
  if (/^phase_authority:phases\/P[1-9]\d*(?:-[^/\\.\s|`:\x00-\x1f]+)?\.md$/.test(key)) return `requirements/${key.slice("phase_authority:".length)}`;
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
  const section = index.split(/^##\s+(?:Execution Index|执行索引)\s*$/mi)[1]?.split(/^##\s+/m)[0];
  if (!section) throw new Error("MATERIAL_INCOMPLETE: post phase_index requires Execution Index");
  const plain = value => value.trim().replace(/^`|`$/g, "");
  const rows = section.split(/\r?\n/).filter(line => /^\|/.test(line.trim()))
    .map(line => line.trim().split("|").slice(1, -1).map(plain))
    .filter(cells => !/^(?:phase|阶段)$/i.test(cells[0] ?? "") && !cells.every(cell => /^:?-+:?$/.test(cell)));
  const refs = rows.map(cells => ({ id: cells[0], path: cells[1] }));
  if (refs.length === 0 || Object.keys(authorities).length !== refs.length) {
    throw new Error("MATERIAL_INCOMPLETE: post phase index and physical files differ");
  }
  const paths = new Set();
  for (const [position, { id, path }] of refs.entries()) {
    const match = typeof path === "string" && path.match(/^phases\/P([1-9]\d*)(?:-[^/\\.\s|`:\x00-\x1f]+)?\.md$/);
    if (id !== `P${position + 1}` || !match || `P${match[1]}` !== id || paths.has(path)
        || !Object.hasOwn(authorities, path) || typeof authorities[path] !== "string" || authorities[path].trim() === ""
        || !new RegExp(`^#\\s+(?:Phase|阶段)\\s+${id}\\b`, "m").test(authorities[path])) {
      throw new Error(`MATERIAL_INCOMPLETE: ${path} is missing or invalid`);
    }
    paths.add(path);
  }
  return Object.entries(materials).flatMap(([key, value]) => key === "phase_authorities"
    ? refs.map(({ path }) => [`phase_authority:${path}`, authorities[path]])
    : [[key, value]]);
}

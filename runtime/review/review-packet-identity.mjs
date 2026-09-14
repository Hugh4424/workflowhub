import { createHash } from "node:crypto";

import { compactVerifyCodeMaterials } from "./review-input-bounds.mjs";
import { reviewIdentityFromInput } from "./review-policy.mjs";

const AUTHENTICATED_EVIDENCE_PATH = "authenticated-evidence.json";
const LOCAL_HOST_PATH = /\/(?:Users|home|private|tmp|var|etc|opt|mnt|Volumes|root|usr|bin|sbin|dev|proc|sys|Library)\/[^\s"'`<>()[\]{}]+|[A-Za-z]:[\\/][^\s"'`<>()[\]{}]+/g;
const FOCUS = Object.freeze({
  "build-spec": "Check requirement coverage, user journey, states, failure recovery, testable acceptance, and scope.",
  "build-plan": "Check dependencies, implementation order, real consumers, verification, recovery, and unnecessary work.",
  "build-code": "Check the submitted implementation material for correctness, real consumers, failure paths, tests, and unnecessary code.",
  "verify-code": "Check only the submitted implementation and test code for correctness, real consumer seams, lifecycle/concurrency and security risks, failure boundaries, and test strength. Do not report T010 status, AC coverage, repository-wide gate status, review packet/material completeness, receipt or provenance availability, or release/close status as code findings; those are acceptance and quality facts outside this review.",
});

function hash(value) {
  return createHash("sha256").update(value).digest("hex");
}

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function redactHostPathText(value) {
  return value.replace(LOCAL_HOST_PATH, "<host-path-redacted>");
}

function redactProviderHostPaths(value) {
  if (typeof value === "string") return redactHostPathText(value);
  if (Array.isArray(value)) return value.map((item) => redactProviderHostPaths(item));
  if (!value || typeof value !== "object" || Buffer.isBuffer(value)) return value;
  return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, redactProviderHostPaths(child)]));
}

function materialBytes(value) {
  if (Buffer.isBuffer(value)) return value;
  if (typeof value === "string") return Buffer.from(value, "utf8");
  return Buffer.from(`${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function safeName(key, index, value) {
  const stem = String(key).replace(/[^A-Za-z0-9._-]+/g, "_").replace(/^\.+/, "") || `material_${index + 1}`;
  return `materials/${String(index + 1).padStart(2, "0")}-${stem}${typeof value === "string" || Buffer.isBuffer(value) ? ".md" : ".json"}`;
}

function surface(input) {
  const kind = input.review_kind ?? input.reviewKind ?? null;
  if (kind) return kind;
  const stage = input.stage;
  const track = input.review_track ?? input.reviewTrack ?? null;
  const scope = input.review_scope ?? input.reviewScope ?? null;
  if (stage === "make-decision") return `${stage}/${track ?? "detail"}`;
  if (stage === "build-code") return `${stage}/${scope ?? "phase"}`;
  return stage;
}

function defaultInstructionText(input) {
  const identity = reviewIdentityFromInput(input);
  if (identity.reviewKind === "build_prd") {
    throw new Error("review packet instruction source is required for build_prd");
  }
  const name = surface(input);
  return [
    `Review surface: ${name}.`,
    FOCUS[name] ?? "Review the supplied current-stage material for concrete delivery risks.",
    "This is heterologous advice only. Review only the submitted material; do not access Workspace, TaskHandle, Git, repository files, shell, network, or host paths.",
    "Report only concrete findings that could change delivery. Merge duplicate root causes. Findings may be empty, but empty findings do not mean completion or approval.",
  ].join("\n");
}

/**
 * Compute the provider-visible packet identity without depending on a skill
 * implementation. The skill runner can supply its exact instruction text;
 * runtime consumers use the same canonical manifest algorithm for
 * authentication and fallback identity checks.
 */
export function reviewPacketMaterialId(input, { instructionText = null, compactMaterials = compactVerifyCodeMaterials } = {}) {
  const identity = reviewIdentityFromInput(input);
  if (!input.materials || typeof input.materials !== "object" || Array.isArray(input.materials) || Object.keys(input.materials).length === 0) {
    throw new TypeError("materials are required");
  }
  if (typeof compactMaterials !== "function") throw new TypeError("compactMaterials must be a function");
  const instruction = instructionText === null
    ? defaultInstructionText(input)
    : typeof instructionText === "function" ? instructionText(input) : instructionText;
  if (typeof instruction !== "string" || instruction.length === 0) throw new TypeError("review packet instructions are required");
  let packetMaterials = input.materials;
  if (identity.stage === "verify-code") {
    try { packetMaterials = compactMaterials(input.materials).materials; }
    catch { packetMaterials = input.materials; }
  }
  const instructionBytes = Buffer.from(`${redactProviderHostPaths(instruction)}\n`, "utf8");
  const entries = [{ path: "review-instructions.md", bytes: instructionBytes.length, sha256: hash(instructionBytes) }];
  Object.entries(packetMaterials ?? {}).forEach(([key, value], index) => {
    const redacted = redactProviderHostPaths(value);
    const bytes = materialBytes(redacted);
    entries.push({ path: safeName(key, index, redacted), bytes: bytes.length, sha256: hash(bytes) });
  });
  if (input.authenticated_evidence !== undefined) {
    const bytes = Buffer.from(`${stableJson(redactProviderHostPaths(input.authenticated_evidence))}\n`, "utf8");
    entries.push({ path: AUTHENTICATED_EVIDENCE_PATH, bytes: bytes.length, sha256: hash(bytes) });
  }
  const manifest = Buffer.from(`${JSON.stringify({ version: 1, surface: surface(input), files: entries }, null, 2)}\n`, "utf8");
  entries.push({ path: "manifest.json", bytes: manifest.length, sha256: hash(manifest) });
  const canonicalEntries = entries
    .filter((entry) => !["manifest.json", "canonical-evidence.json", AUTHENTICATED_EVIDENCE_PATH].includes(entry.path))
    .map(({ path, bytes, sha256 }) => ({ path, bytes, sha256: sha256.toLowerCase() }))
    .sort((left, right) => Buffer.compare(Buffer.from(left.path, "utf8"), Buffer.from(right.path, "utf8")));
  return hash(Buffer.from(JSON.stringify(canonicalEntries), "utf8"));
}

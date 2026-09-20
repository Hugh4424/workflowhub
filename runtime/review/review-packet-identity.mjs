import { createHash } from "node:crypto";

import { AUTHENTICATED_EVIDENCE_PATH, providerMaterialPath, redactProviderHostPaths } from "./provider-material-projection.mjs";
import { compactVerifyCodeMaterials } from "./review-input-bounds.mjs";
import { reviewIdentityFromInput } from "./review-policy.mjs";
const REVIEW_FOCUS = Object.freeze({
  "make-decision/direction": "Challenge whether the proposed direction solves the stated problem with the smallest useful scope. Check assumptions, constraints, failure consequences, and rejected alternatives.",
  "make-decision/detail": "Check scope, complete user flow, pages, data states, success and failure boundaries, acceptance, non-goals, deferred work, risks, and unnecessary complexity.",
  "build-spec": "Check requirement coverage, user journey, states, failure recovery, testable acceptance, and scope.",
  "build-plan": "Check dependencies, implementation order, real consumers, verification, recovery, and unnecessary work.",
  "build-code/phase": "Check the submitted implementation material for correctness, real consumers, failure paths, tests, and unnecessary code.",
  "build-code/integration": "Focus on the final current worktree implementation, the complete user flow, cross-Phase seams, real interfaces, state transitions, failure recovery, necessity, and actionable major or blocking risks. The host validates AC bindings separately; do not report missing or unknown task rows, receipts, snapshots, lineage, or evidence metadata unless it directly causes or conceals a user-visible behavior failure. Do not replay Phase history, cumulative diffs, or require a provider pass.",
  "verify-code": "Check only the submitted implementation and test code for correctness, real consumer seams, lifecycle/concurrency and security risks, failure boundaries, and test strength. Do not report T010 status, AC coverage, repository-wide gate status, review packet/material completeness, receipt or provenance availability, or release/close status as code findings; those are acceptance and quality facts outside this review.",
});

const PACKET_REVIEW_BOUNDARY = "This is heterologous advice only. Review only the submitted material; do not access Workspace, TaskHandle, Git, repository files, shell, network, or host paths.";
const PACKET_FINDING_BOUNDARY = "Report only concrete findings that could change delivery. Merge duplicate root causes. Findings may be empty, but empty findings do not mean completion or approval.";
const MAKE_DECISION_PACKET_BOUNDARY = "For make-decision, keep findings-only advice separate from stage completion: direction must preserve one reconstruct -> reveal -> challenge flow with current selection hidden until reveal; detail must not substitute for direction or invent OI answers.";
const MAKE_DECISION_CONTRACT = "The provider protocol is findings-only: findings:[] is not checked_no_gap, completion, approval, or proof that every OI was covered. Do not invent checked_no_gap or a verdict.";
const MAKE_DECISION_CONTRACT_INTRO = "Read and apply the governed make-decision review contract below; it is part of this review's instruction source.";

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

function materialBytes(value) {
  if (Buffer.isBuffer(value)) return value;
  if (typeof value === "string") return Buffer.from(value, "utf8");
  return Buffer.from(`${JSON.stringify(value)}\n`, "utf8");
}

/**
 * One canonical authenticated-evidence byte form for the whole review path.
 *
 * The provider-visible projection is host-path redacted, and the recorded
 * identity must be computed over exactly those bytes. The skill runner, the
 * runtime packet identity, and the record route all use this single helper so a
 * path-bearing evidence value can no longer hash differently on either side.
 */
export function authenticatedEvidenceBytes(value) {
  if (value === undefined) return null;
  if (!value || typeof value !== "object" || Array.isArray(value) || Buffer.isBuffer(value)) {
    throw new TypeError("authenticated_evidence must be a non-empty JSON object");
  }
  return Buffer.from(`${stableJson(redactProviderHostPaths(value))}\n`, "utf8");
}

/** Canonical authenticated-evidence digest, or null when no evidence is bound. */
export function authenticatedEvidenceDigest(value) {
  const bytes = authenticatedEvidenceBytes(value);
  return bytes === null ? null : hash(bytes);
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
  const focus = identity.stage === "make-decision"
    ? REVIEW_FOCUS[`make-decision/${identity.reviewTrack}`]
    : identity.stage === "build-code"
      ? REVIEW_FOCUS[`build-code/${identity.reviewScope ?? "phase"}`]
      : REVIEW_FOCUS[identity.stage] ?? null;
  if (!focus) throw new Error(`review instructions are unavailable for ${surface(input)}`);
  return [
    `Review surface: ${surface(input)}.`,
    focus,
    ...(identity.stage === "make-decision" ? [
      MAKE_DECISION_CONTRACT_INTRO,
      MAKE_DECISION_CONTRACT,
      MAKE_DECISION_PACKET_BOUNDARY,
    ] : []),
    PACKET_REVIEW_BOUNDARY,
    PACKET_FINDING_BOUNDARY,
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
  let materialIndex = 0;
  Object.entries(packetMaterials ?? {}).forEach(([key, value]) => {
    if (key === "review_instructions") return;
    const redacted = redactProviderHostPaths(value);
    const bytes = materialBytes(redacted);
    entries.push({ path: providerMaterialPath(key, materialIndex, redacted), bytes: bytes.length, sha256: hash(bytes) });
    materialIndex += 1;
  });
  if (input.authenticated_evidence !== undefined) {
    const bytes = Buffer.from(`${stableJson(redactProviderHostPaths(input.authenticated_evidence))}\n`, "utf8");
    entries.push({ path: AUTHENTICATED_EVIDENCE_PATH, bytes: bytes.length, sha256: hash(bytes) });
  }
  const manifest = Buffer.from(`${JSON.stringify({ version: 1, surface: surface(input), files: entries }, null, 2)}\n`, "utf8");
  entries.push({ path: "manifest.json", bytes: manifest.length, sha256: hash(manifest) });
  return hash(Buffer.from(JSON.stringify(canonicalBundleEntries(entries)), "utf8"));
}

/**
 * Canonical, broker-exact bundle-entry filter shared by the declared packet
 * identity (`reviewPacketMaterialId`) and the delivered-bundle self-check
 * (`deliveredMaterialId`). Single source of truth so the two can never drift
 * apart again (a past merge re-split them, which made every dispatched review
 * fail the pre-dispatch identity self-check). Only the transport wrappers
 * `manifest.json` and `canonical-evidence.json` are excluded; provider-visible
 * material such as `review-instructions.md` and `authenticated-evidence.json`
 * is part of the identity.
 */
function canonicalBundleEntries(entries) {
  return entries
    .filter((entry) => !["manifest.json", "canonical-evidence.json"].includes(entry.path))
    .map(({ path, bytes, sha256 }) => ({ path, bytes, sha256: sha256.toLowerCase() }))
    .sort((left, right) => Buffer.compare(Buffer.from(left.path, "utf8"), Buffer.from(right.path, "utf8")));
}

/**
 * Canonical identity of a delivered review bundle, mirroring the broker's
 * `canonicalWorkflowHubMaterialId(files)` in `3rd-review/lib/attachments.mjs`.
 *
 * This is the single implementation behind both the declared packet identity
 * (`reviewPacketMaterialId`) and the pre-dispatch self-check over the bytes that
 * were actually written to the bundle. Two copies of this rule — or of the
 * host-path redaction and material-path rules it depends on — are what let
 * WorkflowHub declare an identity the broker could not reproduce.
 *
 * The exclusion set is exactly the broker's: only the transport wrappers
 * `manifest.json` and `canonical-evidence.json` are excluded.
 * `authenticated-evidence.json` is provider-visible delivered material and is
 * therefore part of the identity. Excluding it here made every packet carrying
 * bound authenticated evidence hash differently from the bytes a provider
 * received, so such a packet could never match the broker envelope. Keeping the
 * base material identity independent of supplemental evidence is the job of the
 * separately recorded `authenticated_evidence_sha256`, not of this digest.
 */
export function deliveredMaterialId(entries) {
  return hash(Buffer.from(JSON.stringify(canonicalBundleEntries(entries)), "utf8"));
}

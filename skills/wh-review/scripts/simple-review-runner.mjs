import { createHash, randomUUID } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";

import { registerReviewSupplement, ReviewProviderClient } from "./review-provider-client.mjs";
import { parseReviewerOutput } from "./review-output.mjs";
import {
  loadTrustedThirdReviewConfig,
  resolveTrustedReviewRoute,
  selectTrustedReviewProviderSelection,
} from "./third-review-host-config.mjs";
import { materialAllowlistForRule, materialForbiddenMessage, reviewInstructionsFor as canonicalReviewInstructionsFor,
  validateMaterialAllowlist } from "./review-materials.mjs";
import { providerAdapter } from "../../../runtime/review/canonical-review-result.mjs";
import { reviewIdentityFromInput, reviewRuleFor } from "../../../runtime/review/review-policy.mjs";
import { AUTHENTICATED_EVIDENCE_PATH, providerMaterialEntries, providerMaterialPath, redactProviderHostPaths, reviewActivationCohort } from "../../../runtime/review/provider-material-projection.mjs";
import { reviewPacketMaterialId, deliveredMaterialId, authenticatedEvidenceBytes as canonicalAuthenticatedEvidenceBytes } from "../../../runtime/review/review-packet-identity.mjs";
import { resolveReviewRouteIdentity } from "../../../runtime/review/review-route-identity.mjs";
import { compactVerifyCodeMaterials } from "./review-input-bounds.mjs";
import { SHA256_HEX } from "../../../runtime/evidence/canonical-utils.mjs";
import stageMaterials from "../../../runtime/review/stage-materials.json" with { type: "json" };

// Managed review ownership lives in 3rd-review. WorkflowHub must keep polling
// while the broker reports a live session.
//
// Bounded caller-side wait (user decision 2026-09-11, option B):
// 3rd-review's v4 policy forbids *any* elapsed-time termination of an active
// provider (lib/config.mjs:35/:47/:68 reject idle_timeout_ms, max_duration_ms,
// deadline_ms; lib/health-runner.mjs:54 keeps PROCESS_STALLED diagnostic-only;
// five tests enforce that). So a silent provider can legitimately never reach a
// terminal state. Waiting forever is therefore not a bug fix — it is the
// designed consequence.
//
// This bound stops *waiting*, NOT the work: the broker is deliberately NOT
// cancelled, its operation keeps its own runtime (each review creates a fresh
// runtime via `createdRuntime = !continuing`), OPERATION_ACTIVE is runtime
// scoped, and orphans are reaped by `cleanup(root, ttl_hours)`. The caller
// records a truthful `REVIEW_WAIT_EXCEEDED` -> "stalled" fact instead.
//
// It is a total wait bound, NOT a stall detector: D-030③ forbids WorkflowHub
// from inventing its own wall-clock stall verdict.
const DEFAULT_MANAGED_TERMINAL_WAIT_MS = 1_200_000;
// Each managed status poll spawns a fresh 3rd-review CLI process, so the poll
// interval is a direct CPU/process-churn knob: at 1s two paired roles spawn
// ~2 processes per second for the whole terminal wait. 5s keeps terminal
// detection within seconds of the provider's real finish while cutting process
// churn ~5x. Callers can still override it per call via
// `dependencies.managedStatusPollMs`.
const DEFAULT_MANAGED_STATUS_POLL_MS = 5000;

function assertReviewAbortSignal(signal) {
  if (signal === null || signal === undefined) return null;
  if (typeof signal !== "object" || typeof signal.aborted !== "boolean"
      || typeof signal.addEventListener !== "function" || typeof signal.removeEventListener !== "function") {
    throw new TypeError("review signal must be an AbortSignal");
  }
  return signal;
}

function reviewCancelledError(signal) {
  const reason = signal?.reason;
  const message = typeof reason?.message === "string" && reason.message.trim() !== ""
    ? reason.message
    : "review wait was interrupted";
  const error = new Error(message);
  error.code = "REVIEW_CANCELLED";
  return error;
}

function throwIfReviewAborted(signal) {
  if (signal?.aborted) throw reviewCancelledError(signal);
}

function waitForManagedPoll(delayMs, signal) {
  if (delayMs <= 0) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, delayMs);
    const onAbort = () => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
      reject(reviewCancelledError(signal));
    };
    if (signal?.aborted) return onAbort();
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

function redactHostPaths(value) {
  if (typeof value !== "string") return value;
  let redacted = "";
  for (let index = 0; index < value.length;) {
    const current = value[index];
    const previous = value[index - 1] ?? "";
    const unixStart = current === "/" && value[index + 1] !== "/"
      && previous !== "/" && (index === 0 || !/[A-Za-z0-9_.-]/.test(previous));
    const windowsStart = /[A-Za-z]/.test(current) && value[index + 1] === ":"
      && (value[index + 2] === "\\" || value[index + 2] === "/");
    const uncStart = current === "\\" && value[index + 1] === "\\";
    if (!unixStart && !windowsStart && !uncStart) {
      redacted += current;
      index += 1;
      continue;
    }
    const start = index;
    if (windowsStart) index += 3;
    else if (uncStart) index += 2;
    else index += 1;
    while (index < value.length && !/[\n"<>()[\]{};,]/.test(value[index])) index += 1;
    redacted += "<host-path-redacted>";
    if (start === index) index += 1;
  }
  return redacted;
}

const RESULT_SAMPLE = `Example of a complete finding:\n{\n  "findings": [{\n    "severity": "major",\n    "path": "diff-shards/S-0024.diff",\n    "line": 42,\n    "issue": "FR-REV-002 requires a constitution clause citation, but the evidence field only contains the decision id; acceptance cannot verify clause-level traceability.",\n    "recommendation": "Add the constitution clause (e.g., F9, F4) to the 'evidence' field of FR-REV-002.",\n    "root_cause": "New FR was copied without the existing template's evidence field.",\n    "evidence_kind": "direct",\n    "evidence": "FR-REV-002 evidence field reads 'D-007' but lacks any '宪法' clause reference, unlike other FRs which cite specific clauses."\n  }]\n}\nExample of an empty result (no findings):\n{\n  "findings": []\n}\nOutput rules:\n- Emit exactly one JSON object shaped like the example above.\n- severity must be one of: blocking, major, minor.\n- evidence_kind must be one of: direct, machine, inferred.\n- path must be the manifest-relative path recorded in manifest.json, for example diff-shards/S-0024.diff.\n- Never prefix path with bundle/; never use an absolute path or a private/source path.\n- line must be an integer line number in that file, or omitted.\n- Do not output a verdict, summary, pass/fail, checklist, or a second JSON object.\n- Do not wrap the JSON in markdown code fences.\n`;

const RESULT_PROMPT = `Read bundle/review-instructions.md and bundle/manifest.json, then every submitted material listed in the manifest. Review only those bytes. Return exactly one JSON object shaped as shown in the sample below.\n\n${RESULT_SAMPLE}`;

function promptForPair(pair) {
  if (!pair) return RESULT_PROMPT;
  return `${RESULT_PROMPT}\nPaired review role: ${pair.role}. Keep this request independent and preserve pair_id=${pair.pair_id}; do not infer or merge the other role's advice.`;
}

const FOCUS = Object.freeze({
  "make-decision/direction": "Challenge whether the proposed direction solves the stated problem with the smallest useful scope. Check assumptions, constraints, failure consequences, and rejected alternatives.",
  "make-decision/detail": "Check scope, complete user flow, pages, data states, success and failure boundaries, acceptance, non-goals, deferred work, risks, and unnecessary complexity.",
  "build-spec": "Check requirement coverage, user journey, states, failure recovery, testable acceptance, and scope.",
  "build-plan": "Check dependencies, implementation order, real consumers, verification, recovery, and unnecessary work.",
  "build-code/phase": "Check the submitted implementation material for correctness, real consumers, failure paths, tests, and unnecessary code.",
  "build-code/integration": "Focus on the final current worktree implementation, the complete user flow, cross-Phase seams, real interfaces, state transitions, failure recovery, necessity, and actionable major or blocking risks. The host validates AC bindings separately; do not report missing or unknown task rows, receipts, snapshots, lineage, or evidence metadata unless it directly causes or conceals a user-visible behavior failure. Do not replay Phase history, cumulative diffs, or require a provider pass.",
  "build-code": "Check the submitted implementation material for correctness, real consumers, failure paths, tests, and unnecessary code.",
  "verify-code": "Check only the submitted implementation and test code for correctness, real consumer seams, lifecycle/concurrency and security risks, failure boundaries, and test strength. Do not report T010 status, AC coverage, repository-wide gate status, review packet/material completeness, receipt or provenance availability, or release/close status as code findings; those are acceptance and quality facts outside this review.",
  build_prd: "Review only the complete PRD materials (decision log, PRD, task map, design facts, quality facts, and declared supporting facts) for coverage, task ownership, handoff, acceptance, and necessity. This is report-only advice for the non-formal build-prd surface; do not treat it as a formal stage, verdict, completion, or release authorization.",
  "mini_task.design": "Check that the mini-task remains small, complete, testable, and reversible.",
  "mini_task.implementation": "Check implementation correctness, user result, tests, and scope boundaries.",
});

// The simple runner is the public review execution seam used by stage-runtime
// for non-integration requests.  Keep the make-decision contract as a real
// input to the generated provider instructions instead of relying on a
// duplicated focus sentence that can drift from the governed contract.
const MAKE_DECISION_CONTRACT = readFileSync(new URL("../contracts/make-decision.md", import.meta.url), "utf8");

function hash(bytes) { return createHash("sha256").update(bytes).digest("hex"); }

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stableValue(value[key])]));
  return value;
}

// Local request-identity input version.  This changes only the managed request
// id's stable input so a protocol revision can be retried within the broker's
// TTL; the managed public envelope and its exact key set remain unchanged.
const MANAGED_REQUEST_ID_PROTOCOL_VERSION = "managed-request-id.v1";

function managedRequestId(input, { materialId, hostProvider, providers, providerIdentities, minimumHeterologous, reviewMode, prompt }) {
  const subject = {
    stage: input.stage,
    review_track: input.review_track ?? input.reviewTrack ?? null,
    review_kind: input.review_kind ?? input.reviewKind ?? null,
    review_scope: input.review_scope ?? input.reviewScope ?? null,
    subject_kind: input.subject_kind ?? null,
    phase_id: input.phase_id ?? null,
    pair_id: input.pair_id ?? input.pairId ?? null,
    role: input.role ?? null,
  };
  const identity = stableValue({ protocol_version: MANAGED_REQUEST_ID_PROTOCOL_VERSION, material_id: materialId, host_provider: hostProvider, providers, provider_identities: providerIdentities ?? null, minimum_heterologous: minimumHeterologous, review_mode: reviewMode, prompt, subject });
  return "wh-review-" + hash(JSON.stringify(identity));
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
  const models = Array.isArray(selection) ? undefined : (selection?.provider_models ?? selection?.providerModels);
  const rawEligible = Array.isArray(selection) ? undefined : (selection?.eligible_profiles ?? selection?.eligibleProfiles);
  const eligible = rawEligible === undefined || rawEligible === null ? [...providers] : [...rawEligible];
  if (!Array.isArray(eligible) || eligible.length === 0
      || eligible.some((provider) => typeof provider !== "string" || !providers.includes(provider))
      || new Set(eligible).size !== eligible.length) {
    throw new TypeError("PROVIDER_SELECTION_INVALID: eligible provider profiles are invalid");
  }
  const shaped = { providers, eligible_profiles: eligible };
  if (models !== undefined && models !== null) {
    if (!plainRecord(models)) throw new TypeError("PROVIDER_SELECTION_INVALID: provider models are invalid");
    const modelKeys = Object.keys(models).sort();
    if (modelKeys.join("\u0000") !== [...providers].sort().join("\u0000")) {
      throw new TypeError("PROVIDER_SELECTION_INVALID: provider models do not match providers");
    }
    shaped.provider_models = Object.fromEntries(providers.map((provider) => {
      const model = models[provider];
      if (model !== null && (typeof model !== "string" || model.trim() === "")) {
        throw new TypeError(`PROVIDER_SELECTION_INVALID: provider model ${provider} is invalid`);
      }
      return [provider, model];
    }));
  }
  if (identities === undefined || identities === null) return shaped;
  if (!plainRecord(identities)) {
    throw new TypeError("PROVIDER_SELECTION_INVALID: provider identities are invalid");
  }
  const identityKeys = Object.keys(identities).sort();
  if (identityKeys.join("\\u0000") !== [...providers].sort().join("\\u0000")) {
    throw new TypeError("PROVIDER_SELECTION_INVALID: provider identities do not match providers");
  }
  return {
    ...shaped,
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

function validateReviewThreshold(route, selection) {
  const minimum = route?.minimum_heterologous;
  if (!Number.isSafeInteger(minimum) || minimum < 1) {
    throw new TypeError("minimum_heterologous must be an explicit positive integer");
  }
  const models = selection?.provider_models;
  if (!models) throw new TypeError("provider selection is missing underlying model identities");
  const eligible = selection.eligible_profiles ?? selection.providers;
  const eligibleModels = eligible.map((provider) => models[provider]);
  if (eligibleModels.some((model) => typeof model !== "string" || model.trim() === "")) {
    throw new TypeError("provider selection contains a member without an underlying model identity");
  }
  const distinct = new Set(eligibleModels).size;
  if (distinct < minimum) {
    throw new TypeError(`minimum_heterologous ${minimum} exceeds ${distinct} distinct eligible underlying model identities`);
  }
  return minimum;
}

function providerSelectionOutput(selection) {
  return {
    providers: [...selection.providers],
    provider_identities: selection.provider_identities ?? null,
    ...(selection.eligible_profiles ? { eligible_profiles: [...selection.eligible_profiles] } : {}),
    ...(selection.provider_models ? { provider_models: { ...selection.provider_models } } : {}),
  };
}

/**
 * Validate the broker's provider facts against the trusted dispatch group.
 * The runner keeps partial groups observable, while this strict helper is
 * available to callers that require a complete provider set.
 */
export function validateProviderResultsAgainstSelection(providerResults, selection) {
  const selected = providerSelectionShape(selection);
  if (!Array.isArray(providerResults)) throw new TypeError("PROVIDER_RESULT_INVALID: provider_results must be an array");
  const expected = new Set(selected.providers);
  const seen = new Set();
  for (const item of providerResults) {
    const provider = item?.provider ?? item?.identity?.provider;
    if (!item || typeof item !== "object" || typeof provider !== "string" || provider.trim() === ""
        || !expected.has(provider) || seen.has(provider)) {
      throw new TypeError("PROVIDER_RESULT_INVALID: provider result is not uniquely bound to the selected providers");
    }
    const identity = item.identity;
    if (!identity || typeof identity !== "object" || Array.isArray(identity)
        || identity.provider !== provider || identity.adapter !== providerAdapter(provider)) {
      throw new TypeError(`PROVIDER_RESULT_INVALID: provider identity is missing or does not match ${provider}`);
    }
    const expectedIdentity = selected.provider_identities?.[provider];
    if (selected.provider_identities !== undefined) {
      if (!expectedIdentity || typeof expectedIdentity !== "object" || Array.isArray(expectedIdentity)
          || typeof expectedIdentity.source_id !== "string" || expectedIdentity.source_id.trim() === ""
          || typeof expectedIdentity.config_id !== "string" || expectedIdentity.config_id.trim() === "") {
        throw new TypeError(`PROVIDER_RESULT_INVALID: trusted identity is missing for ${provider}`);
      }
      if (identity.source_id !== expectedIdentity.source_id || identity.config_id !== expectedIdentity.config_id) {
        throw new TypeError(`PROVIDER_RESULT_INVALID: provider identity does not match trusted selection for ${provider}`);
      }
    }
    seen.add(provider);
  }
  if (seen.size !== expected.size) {
    const missing = selected.providers.filter((provider) => !seen.has(provider));
    throw new TypeError(`PROVIDER_RESULT_INVALID: missing provider result ${missing.join(", ")}`);
  }
  return selected;
}

// Caller fields never attest provider routing; this narrow read-only helper is
// shared by the task record route and the bare CLI.
export function resolveSimpleReviewRouteIdentity(input, dependencies = {}) {
  return resolveReviewRouteIdentity(input, {
    loadConfig: dependencies.loadConfig ?? loadTrustedThirdReviewConfig,
    resolveRoute: dependencies.resolveRoute ?? resolveTrustedReviewRoute,
    selectProviders: dependencies.selectProviders ?? selectTrustedReviewProviderSelection,
  });
}

export function reviewSubjectFields(input) {
  return Object.fromEntries([
    ["subject_kind", input.subject_kind], ["phase_id", input.phase_id],
    ["review_scope", input.review_scope ?? input.reviewScope],
  ].filter(([, value]) => value !== undefined));
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

function instructions(input) {
  let identity = null;
  try { identity = reviewIdentityFromInput(input); } catch { /* preserve a diagnostic identity for blocked requests */ }
  if (identity?.reviewKind === "build_prd") {
    return canonicalReviewInstructionsFor("build-prd", null, false, null, "build_prd");
  }
  // Never render a caller-authored instruction source. When the runner owns the
  // bundle this is enforced as a preflight rejection; when the host supplies an
  // already-built bundle the host's fixed template governs, so this helper only
  // needs to stay deterministic.
  const name = surface(input);
  const focus = identity?.stage === "make-decision"
    ? FOCUS[name]
    : identity?.stage === "build-code"
      ? FOCUS[`build-code/${identity.reviewScope ?? "phase"}`] ?? FOCUS["build-code"]
      : FOCUS[name] ?? FOCUS[identity?.stage];
  if (!focus) throw new TypeError(`MATERIAL_INCOMPLETE: review instructions are unavailable for ${name}`);
  return [
    `Review surface: ${name}.`,
    focus,
    ...(identity?.stage === "make-decision" ? [
      "Read and apply the governed make-decision review contract below; it is part of this review's instruction source.",
      "The provider protocol is findings-only: findings:[] is not checked_no_gap, completion, approval, or proof that every OI was covered. Do not invent checked_no_gap or a verdict.",
      "For make-decision, keep findings-only advice separate from stage completion: direction must preserve one reconstruct -> reveal -> challenge flow with current selection hidden until reveal; detail must not substitute for direction or invent OI answers.",
    ] : []),
    "This is heterologous advice only. Review only the submitted material; do not access Workspace, TaskHandle, Git, repository files, shell, network, or host paths.",
    "Report only concrete findings that could change delivery. Merge duplicate root causes. Findings may be empty, but empty findings do not mean completion or approval.",
  ].join("\n");
}

function materialBytes(value) {
  if (Buffer.isBuffer(value)) return value;
  if (typeof value === "string") return Buffer.from(value, "utf8");
  return Buffer.from(`${JSON.stringify(value)}\n`, "utf8");
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

const PROVIDER_INPUT_TOP_LEVEL_KEYS = Object.freeze([
  "schema_version", "packet", "host_provider", "providers", "provider_identities",
  "review_mode", "prompt", "subject_binding", "review_policy", "envelope_sha256",
]);
const SIMPLE_PACKET_KEYS = new Set([
  "schema_version", "stage", "review_track", "review_scope", "review_kind", "material_id",
  "materials", "activation_cohort", "authenticated_evidence", "authenticated_evidence_sha256",
]);
const SERIALIZED_MATERIAL_KEYS = new Set(["key", "value_kind", "content_base64", "sha256"]);
const REVIEW_MODES = new Set(["single_round", "adaptive", "full_only", "full_on_structural_rework", "legacy"]);

function plainRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    && Object.getPrototypeOf(value) === Object.prototype;
}

function exactKeys(value, expected, label) {
  if (!plainRecord(value) || Object.keys(value).sort().join("\\u0000") !== [...expected].sort().join("\\u0000")) {
    throw new TypeError(`${label} is invalid: unsupported fields`);
  }
}

function jsonClone(value, label) {
  if (value === null) return null;
  if (!plainRecord(value) && !Array.isArray(value)) throw new TypeError(`${label} is invalid`);
  try {
    const encoded = JSON.stringify(value);
    if (encoded === undefined) throw new TypeError();
    return JSON.parse(encoded);
  } catch {
    throw new TypeError(`${label} is invalid`);
  }
}

function canonicalProviderIdentities(providers, identities) {
  if (identities === null || identities === undefined) return null;
  if (!plainRecord(identities)) throw new TypeError("provider identities are invalid");
  const keys = Object.keys(identities).sort();
  if (keys.join("\\u0000") !== [...providers].sort().join("\\u0000")) {
    throw new TypeError("provider identities do not match providers");
  }
  return Object.fromEntries(providers.map((provider) => {
    const identity = identities[provider];
    exactKeys(identity, ["source_id", "config_id"], `provider identity ${provider}`);
    if (typeof identity.source_id !== "string" || identity.source_id.trim() === ""
        || typeof identity.config_id !== "string" || identity.config_id.trim() === "") {
      throw new TypeError(`provider identity ${provider} is invalid`);
    }
    return [provider, { source_id: identity.source_id, config_id: identity.config_id }];
  }));
}

function canonicalProviderEnvelopeFields(value) {
  if (typeof value.host_provider !== "string" || value.host_provider.trim() === "") throw new TypeError("provider input host_provider is invalid");
  if (!Array.isArray(value.providers) || value.providers.length === 0
      || value.providers.some((provider) => typeof provider !== "string" || provider.trim() === "")
      || new Set(value.providers).size !== value.providers.length) {
    throw new TypeError("provider input providers are invalid");
  }
  if (typeof value.review_mode !== "string" || !REVIEW_MODES.has(value.review_mode)) throw new TypeError("provider input review_mode is invalid");
  if (typeof value.prompt !== "string" || value.prompt.length === 0) throw new TypeError("provider input prompt is invalid");
  return {
    host_provider: value.host_provider,
    providers: [...value.providers],
    provider_identities: canonicalProviderIdentities(value.providers, value.provider_identities),
    review_mode: value.review_mode,
    prompt: value.prompt,
    subject_binding: jsonClone(value.subject_binding, "provider input subject_binding"),
    review_policy: jsonClone(value.review_policy, "provider input review_policy"),
  };
}

function providerEnvelopeDigest(value) {
  const unsigned = Object.fromEntries(Object.entries(value).filter(([key]) => key !== "envelope_sha256"));
  return hash(Buffer.from(`${canonicalJson(unsigned)}\\n`, "utf8"));
}

function decodeSerializedMaterials(packet) {
  const materials = {};
  for (const entry of packet.materials) {
    exactKeys(entry, SERIALIZED_MATERIAL_KEYS, "provider input material");
    if (typeof entry.key !== "string" || !new Set(["bytes", "text", "json"]).has(entry.value_kind)
        || typeof entry.content_base64 !== "string" || !SHA256_HEX.test(entry.sha256 ?? "")
        || Object.hasOwn(materials, entry.key)) throw new TypeError("provider input material is invalid");
    let content;
    try {
      content = Buffer.from(entry.content_base64, "base64");
      if (content.toString("base64") !== entry.content_base64) throw new TypeError();
    } catch { throw new TypeError("provider input material encoding is invalid"); }
    if (hash(content) !== entry.sha256) throw new TypeError("provider input material hash is invalid");
    if (entry.value_kind === "json") {
      try { materials[entry.key] = JSON.parse(content.toString("utf8")); }
      catch { throw new TypeError("provider input JSON material is invalid"); }
    } else materials[entry.key] = entry.value_kind === "text" ? content.toString("utf8") : content;
  }
  return materials;
}

function rebuildSerializedPacket(packet) {
  if (!plainRecord(packet) || packet.schema_version !== "wh-review-simple-packet.v1" || !Array.isArray(packet.materials)
      || !SHA256_HEX.test(packet.material_id ?? "")) throw new TypeError("provider packet is invalid");
  if (Object.keys(packet).some((key) => !SIMPLE_PACKET_KEYS.has(key))) throw new TypeError("provider packet has unsupported fields");
  const identity = reviewIdentityFromInput(packet);
  const materials = decodeSerializedMaterials(packet);
  const rebuilt = createSimpleReviewPacket({
    stage: identity.stage,
    review_track: identity.reviewTrack,
    review_scope: identity.reviewScope,
    review_kind: identity.reviewKind,
    ...(packet.activation_cohort === undefined ? {} : { activation_cohort: packet.activation_cohort }),
    materials,
    ...(packet.authenticated_evidence === undefined ? {} : { authenticated_evidence: packet.authenticated_evidence }),
  });
  if (rebuilt.material_id !== packet.material_id
      || canonicalJson(rebuilt.materials) !== canonicalJson(packet.materials)
      || (rebuilt.authenticated_evidence_sha256 ?? null) !== (packet.authenticated_evidence_sha256 ?? null)
      || (rebuilt.authenticated_evidence === undefined) !== (packet.authenticated_evidence === undefined)
      || (rebuilt.authenticated_evidence !== undefined && canonicalJson(rebuilt.authenticated_evidence) !== canonicalJson(packet.authenticated_evidence))) {
    throw new TypeError("provider input material identity is invalid");
  }
  return rebuilt;
}

// Authenticated evidence has exactly one canonical byte form for the whole
// review path (runtime packet identity, this runner, and the record route).
// Deriving it locally with a second redactor made a path-bearing evidence value
// hash differently from the value the recorder authenticated.
function authenticatedEvidenceFields(input) {
  if (input?.authenticated_evidence === undefined) return {};
  const bytes = canonicalAuthenticatedEvidenceBytes(input.authenticated_evidence);
  return {
    authenticated_evidence: JSON.parse(bytes.toString("utf8")),
    authenticated_evidence_sha256: hash(bytes),
  };
}

function authenticatedEvidenceBytes(value) {
  return canonicalAuthenticatedEvidenceBytes(value);
}

function buildBundle(attachmentRoot, input) {
  const packetRoot = join(attachmentRoot, ".wh-review-packets");
  mkdirSync(packetRoot, { recursive: true });
  const bundleRoot = mkdtempSync(join(packetRoot, "simple-"));
  const entries = [];
  const write = (path, bytes) => {
    const target = join(bundleRoot, ...path.split("/"));
    mkdirSync(join(target, ".."), { recursive: true });
    writeFileSync(target, bytes, { flag: "wx", mode: 0o600 });
    entries.push({ path, bytes: bytes.length, sha256: hash(bytes) });
  };
  // The provider-visible bundle is a derived view of caller materials. Host
  // absolute paths (from the original requirement text, review notes, or any
  // JSON material) must never reach the provider; keep the bundle bytes and
  // the material identity computed over the same redacted values.
  write("review-instructions.md", Buffer.from(`${redactProviderHostPaths(instructions(input))}\n`, "utf8"));
  let materialIndex = 0;
  assertRedactableMaterials(input.materials);
  providerMaterialEntries(input).forEach(([key, value]) => {
    if (key === "review_instructions") return;
    const redacted = redactProviderHostPaths(value);
    write(providerMaterialPath(key, materialIndex, redacted), materialBytes(redacted));
    materialIndex += 1;
  });
  if (input.authenticated_evidence !== undefined) {
    write(AUTHENTICATED_EVIDENCE_PATH, authenticatedEvidenceBytes(input.authenticated_evidence));
  }
  const manifest = Buffer.from(`${JSON.stringify({ version: 1, surface: surface(input), files: entries }, null, 2)}\n`, "utf8");
  write("manifest.json", manifest);
  // Single material identity over the delivered bundle. reviewPacketMaterialId and
  // deliveredMaterialId share one canonicalBundleEntries rule, so the declared
  // identity and the written bytes hash identically by construction. The self-check
  // below stays as a fail-closed guard: if a future redaction/path/omission rule ever
  // drifts, it must block dispatch BEFORE a provider is spawned (a drifted bundle would
  // only earn an opaque broker error after the provider had started).
  const materialId = materialIdForInput(input);
  const deliveredId = deliveredMaterialId(entries);
  if (deliveredId !== materialId) {
    rmSync(bundleRoot, { recursive: true, force: true });
    throw Object.assign(
      new Error(`MATERIAL_IDENTITY_MISMATCH: declared review material identity ${materialId} does not match the delivered bundle bytes ${deliveredId}`),
      {
        code: "MATERIAL_IDENTITY_MISMATCH",
        diagnostic: {
          declared_material_id: materialId,
          delivered_material_id: deliveredId,
          delivered_paths: entries.map((entry) => entry.path),
        },
      },
    );
  }
  return {
    bundleRoot,
    attachmentRoot,
    sourcePrefix: relative(attachmentRoot, bundleRoot).split(sep).join("/"),
    materialId,
    deliveryManifest: entries,
    dispose() { rmSync(bundleRoot, { recursive: true, force: true }); },
  };
}

async function waitForManagedTerminal({ lifecycle, client, requestId, hostProvider, providers, materials, minimumHeterologous, providerModels }, dependencies) {
  const signal = assertReviewAbortSignal(dependencies.signal ?? null);
  const maxWaitMs = dependencies.managedTerminalWaitMs ?? DEFAULT_MANAGED_TERMINAL_WAIT_MS;
  const pollMs = dependencies.managedStatusPollMs ?? DEFAULT_MANAGED_STATUS_POLL_MS;
  if (maxWaitMs !== null && (!Number.isSafeInteger(maxWaitMs) || maxWaitMs < 0)) {
    throw new TypeError("managedTerminalWaitMs must be null or a non-negative safe integer");
  }
  if (!Number.isSafeInteger(pollMs) || pollMs < 0) throw new TypeError("managedStatusPollMs must be a non-negative safe integer");
  const startedAt = Date.now();
  let current = lifecycle;
  let lastObservation = lifecycle;
  const context = { requestId, hostProvider, providers, materials, runtimeId: lifecycle.runtime_id };
  const consumeMemberFailure = (value) => {
    const source = value?.providers;
    if (!source || typeof source !== "object") return null;
    const entries = Array.isArray(source)
      ? source.map((item) => [item?.provider, item])
      : Object.entries(source);
    const members = entries
      .filter(([provider, item]) => typeof provider === "string" && item && typeof item === "object" && !Array.isArray(item))
      .map(([provider, item]) => ({ ...item, provider: item.provider ?? provider }));
    const failed = members.filter((item) => item.status === "failed" || item.status === "stalled"
      || (typeof item.error?.code === "string" && item.error.code.trim() !== ""));
    if (failed.length === 0 || members.length === 0) return null;
    const requiredModels = Number.isSafeInteger(minimumHeterologous) ? minimumHeterologous : 1;
    const possibleModels = new Set(members
      .filter((item) => !failed.includes(item) && item.status !== "cancelled")
      .map((item) => providerModels?.[item.provider] ?? item.provider));
    if (failed.length < members.length && possibleModels.size >= requiredModels) return null;
    // This is a local projection of an explicit broker member failure, not a
    // WorkflowHub wall-clock verdict. Keep the broker running and let the
    // normal result mapper preserve the member's failure facts.
    return {
      ...value,
      state: "terminal",
      group: {
        version: 4,
        host_provider: hostProvider,
        outcome: "unavailable",
        providers: members,
        round: Number.isSafeInteger(value.round) ? value.round : 0,
        runtime_id: value.runtime_id,
        selected_tier: Number.isSafeInteger(value.last_selected_tier) ? value.last_selected_tier : null,
      },
    };
  };
  // A zero-length test/override already uses its first status request as the
  // boundary poll. Positive waits get one extra status request after the
  // deadline is observed, preserving the existing immediate-zero semantics.
  let boundaryRecheckDone = maxWaitMs === null || maxWaitMs === 0;
  while (current.state !== "terminal") {
    throwIfReviewAborted(signal);
    try {
      current = await client.statusManaged({ ...context, ...(signal === null ? {} : { signal }) });
      lastObservation = current;
    } catch (error) {
      if (error && typeof error === "object") error.managed_observation = lastObservation;
      throw error;
    }
    if (current.state === "terminal") return current;
    const memberFailure = consumeMemberFailure(current);
    if (memberFailure) return memberFailure;
    if (maxWaitMs !== null && Date.now() - startedAt >= maxWaitMs) {
      if (!boundaryRecheckDone) {
        boundaryRecheckDone = true;
        continue;
      }
      // Stop WAITING, not the work: do not call cancelManaged here. 3rd-review
      // owns provider lifetime; killing it would be exactly the caller-side
      // wall-clock termination that D-030③ forbids. Record the fact instead.
      const error = new Error(`managed review did not reach a terminal state within ${maxWaitMs} ms; the broker was NOT cancelled and may still complete`);
      error.code = "REVIEW_WAIT_EXCEEDED";
      error.managed_observation = lastObservation;
      throw error;
    }
    await waitForManagedPoll(pollMs, signal);
  }
  return current;
}

function materialIdForInput(input) {
  return reviewPacketMaterialId(input, { instructionText: instructions, compactMaterials: compactVerifyCodeMaterials });
}

// The review record authenticates the exact provider bundle, while its frozen
// host record also retains execution evidence that is intentionally not sent
// to a provider. Keep this projection beside the dispatch path so both sides
// calculate the same material identity without widening the stage allowlist.
export function simpleReviewProviderMaterialId(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new TypeError("review request must be an object");
  const identity = reviewIdentityFromInput(input);
  let providerInput = {
    ...input,
    stage: identity.stage,
    review_track: identity.reviewTrack,
    review_scope: identity.reviewScope,
    review_kind: identity.reviewKind,
  };
  providerInput = projectRunnerMaterials(providerInput).input;
  if (providerInput.stage === "verify-code") {
    const projection = compactVerifyCodeMaterials(providerInput.materials);
    if (projection.diff !== null) providerInput = { ...providerInput, materials: projection.materials };
  }
  return materialIdForInput(providerInput);
}

// The host-path redaction boundary is text/JSON-only: redactProviderHostPaths
// returns Buffer values unchanged, while the bundle writer forwards their bytes
// verbatim. A binary material could therefore carry an absolute host path to
// the provider unredacted. Fail closed instead of shipping bytes the boundary
// cannot inspect.
function assertRedactableMaterials(materials) {
  if (!materials || typeof materials !== "object" || Array.isArray(materials)) return;
  for (const [key, value] of Object.entries(materials)) {
    if (key === "review_instructions") continue;
    if (Buffer.isBuffer(value) || value instanceof Uint8Array) {
      throw new TypeError(`MATERIAL_FORBIDDEN: binary material ${key} cannot cross the host-path redaction boundary`);
    }
  }
}

export function createSimpleReviewPacket(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new TypeError("review packet input must be an object");
  const identity = reviewIdentityFromInput(input);
  if (!input.materials || typeof input.materials !== "object" || Array.isArray(input.materials) || Object.keys(input.materials).length === 0) throw new TypeError("materials are required");
  validateDirectPacketMaterials(identity, input.materials);
  assertRedactableMaterials(input.materials);
  providerMaterialEntries(input);
  let packetMaterials = input.materials;
  if (input.stage === "verify-code") {
    try { packetMaterials = compactVerifyCodeMaterials(input.materials).materials; }
    catch { packetMaterials = input.materials; }
  }
  const materials = Object.entries(packetMaterials).map(([key, value]) => {
    const bytes = materialBytes(value);
    return { key, value_kind: Buffer.isBuffer(value) ? "bytes" : typeof value === "string" ? "text" : "json", content_base64: bytes.toString("base64"), sha256: hash(bytes) };
  });
  const evidence = authenticatedEvidenceFields(input);
  return Object.freeze({
    schema_version: "wh-review-simple-packet.v1",
    stage: identity.stage,
    review_track: identity.reviewTrack,
    review_scope: identity.reviewScope,
    review_kind: identity.reviewKind,
    material_id: materialIdForInput(input),
    ...(reviewActivationCohort(input) === "post" ? { activation_cohort: "post" } : {}),
    materials: Object.freeze(materials.map(Object.freeze)),
    ...evidence,
  });
}

export function serializeProviderInput(input) {
  const packet = rebuildSerializedPacket(input?.packet);
  const envelope = canonicalProviderEnvelopeFields({
    host_provider: input?.hostProvider ?? input?.host_provider,
    providers: input?.providers,
    provider_identities: input?.providerIdentities ?? input?.provider_identities ?? null,
    review_mode: input?.reviewMode ?? input?.review_mode,
    prompt: input?.prompt ?? RESULT_PROMPT,
    subject_binding: input?.subjectBinding ?? input?.subject_binding ?? null,
    review_policy: input?.reviewPolicy ?? input?.review_policy ?? null,
  });
  const value = { schema_version: "wh-review-provider-input.v1", packet, ...envelope };
  return Buffer.from(`${JSON.stringify({ ...value, envelope_sha256: providerEnvelopeDigest(value) })}\n`, "utf8");
}

export function rehydrateProviderInput(bytes, attachmentRoot) {
  let value;
  try { value = JSON.parse(Buffer.isBuffer(bytes) ? bytes.toString("utf8") : String(bytes)); }
  catch { throw new TypeError("provider input is invalid"); }
  exactKeys(value, PROVIDER_INPUT_TOP_LEVEL_KEYS, "provider input");
    if (value.schema_version !== "wh-review-provider-input.v1" || typeof value.envelope_sha256 !== "string"
        || !SHA256_HEX.test(value.envelope_sha256)) throw new TypeError("provider input is invalid");
    const packet = rebuildSerializedPacket(value.packet);
    const envelope = canonicalProviderEnvelopeFields(value);
    const unsigned = { schema_version: "wh-review-provider-input.v1", packet, ...envelope };
    if (providerEnvelopeDigest(unsigned) !== value.envelope_sha256) throw new TypeError("provider input envelope integrity is invalid");
    const materials = decodeSerializedMaterials(value.packet);
    const bundle = buildBundle(attachmentRoot, {
      stage: packet.stage,
      review_track: packet.review_track,
      review_scope: packet.review_scope,
      review_kind: packet.review_kind,
      ...(packet.activation_cohort === undefined ? {} : { activation_cohort: packet.activation_cohort }),
      materials,
      ...(packet.authenticated_evidence === undefined ? {} : { authenticated_evidence: packet.authenticated_evidence }),
    });
    if (bundle.materialId !== packet.material_id) { bundle.dispose(); throw new TypeError("provider input bundle identity is invalid"); }
  return Object.freeze({
    schema_version: "wh-review-provider-input.v1",
    packet,
    ...envelope,
    envelope_sha256: value.envelope_sha256,
    materials: bundle,
  });
}

export async function dispatchFrozenProviderInput({ bytes, attachmentRoot, client }) {
  if (!client || typeof client.runGroup !== "function") throw new TypeError("review provider client is required");
  const restored = rehydrateProviderInput(bytes, attachmentRoot);
  try {
    return await client.runGroup({
      hostProvider: restored.host_provider,
      providers: restored.providers,
      providerIdentities: restored.provider_identities,
      materials: restored.materials,
      prompt: restored.prompt,
      reviewMode: restored.review_mode,
      minimumHeterologous: restored.review_policy?.minimum_heterologous,
      strictProtocol: true,
    });
  } finally { restored.materials.dispose(); }
}

function pairFields(pair) {
  return pair ? { pair_id: pair.pair_id, role: pair.role } : {};
}

function unavailableResult(input, error, pair = null, extra = {}) {
  // An invalid identity cannot produce an authenticated packet id.  The
  // invalid-identity preflight passes material_id=null explicitly; all other
  // unavailable paths still compute the id and therefore fail closed on
  // malformed material or instruction inputs.
  let materialId = Object.hasOwn(extra, "material_id") ? extra.material_id : null;
  if (!Object.hasOwn(extra, "material_id")) {
    try { materialId = materialIdForInput(input); }
    catch { materialId = null; }
  }
  return {
    status: "unavailable",
    stage: input.stage,
    ...reviewSubjectFields(input),
    review_track: input.review_track ?? input.reviewTrack ?? null,
    review_kind: input.review_kind ?? input.reviewKind ?? null,
    material_id: materialId,
    ...authenticatedEvidenceFields(input),
    ...pairFields(pair),
    runtime_id: null,
    outcome: "unavailable",
    provider_results: [],
    findings: [],
    ...extra,
    error,
  };
}

function preflightMaterialPresent(value) {
  if (Buffer.isBuffer(value)) return value.length > 0;
  if (typeof value === "string") return value.trim() !== "";
  if (Array.isArray(value)) return value.length > 0;
  return value !== null && typeof value === "object" && Object.keys(value).length > 0;
}

function preflightDiagnostic({ field, expected, actual, nextAction }) {
  return {
    field,
    expected: redactHostPaths(String(expected)),
    actual: redactHostPaths(String(actual)),
    next_action: nextAction,
  };
}

function blockedPreflight(input, code, message, diagnostic, pair = null, extra = {}) {
  const error = { code, message: redactHostPaths(message), diagnostic };
  return unavailableResult(input, error, pair, {
    dispatch_state: "blocked_before_dispatch",
    provider_attempts: 0,
    provider_results: [],
    findings: [],
    ...extra,
  });
}

function runMaterialAllowlistPreflight(input, rule, pair = null, { rejectGenerated = false } = {}) {
  const materials = input.materials;
  const allowlist = materialAllowlistForRule(rule);
  const generated = new Set(allowlist.generated);
  const forbidden = new Set(allowlist.forbidden);
  const required = allowlist.required.filter((key) => !generated.has(key));
  const forbiddenMaterial = Object.keys(materials).find((key) =>
    !allowlist.known.includes(key) || forbidden.has(key) || (rejectGenerated && generated.has(key)));
  if (forbiddenMaterial) {
    const actual = !allowlist.known.includes(forbiddenMaterial) ? "unknown" : generated.has(forbiddenMaterial) ? "generated" : "forbidden";
    return blockedPreflight(input, "MATERIAL_FORBIDDEN", materialForbiddenMessage(forbiddenMaterial, rule), preflightDiagnostic({
      field: forbiddenMaterial,
      expected: rejectGenerated ? "caller-owned allowlisted material key" : "allowlisted material key",
      actual,
      nextAction: "remove the unknown, generated, or forbidden material and retry",
    }), pair);
  }
  const missing = required.find((key) => {
    // The task-bound integration bundle owns the honest fallback for missing
    // test evidence: buildReviewMaterials adds an unavailable, current-snapshot
    // fact so the provider can still review implementation behavior. The
    // static caller preflight must not reject that path before the bundle
    // builder gets a chance to publish the fallback. A caller-supplied but
    // malformed/empty test_evidence still fails closed below.
    const canDegradeMissingIntegrationTests = input.stage === "build-code"
      && (input.review_scope === "integration" || input.reviewScope === "integration")
      && key === "test_evidence"
      && !Object.hasOwn(materials, key);
    if (canDegradeMissingIntegrationTests) return false;
    return !Object.hasOwn(materials, key) || !preflightMaterialPresent(materials[key]);
  });
  if (missing) {
    return blockedPreflight(input, "MATERIAL_INCOMPLETE", `required material ${missing} is missing or empty`, preflightDiagnostic({
      field: missing,
      expected: "non-empty caller material",
      actual: Object.hasOwn(materials, missing) ? "empty" : "missing",
      nextAction: "supply current material and retry",
    }), pair, reviewActivationCohort(input) === "post" ? { material_id: null } : {});
  }
  if (reviewActivationCohort(input) === "post") {
    try { providerMaterialEntries(input); }
    catch (error) {
      return blockedPreflight(input, "MATERIAL_INCOMPLETE", error.message, preflightDiagnostic({
        field: "phase_authorities/phase_index", expected: "one physical Phase file per index row",
        actual: "missing or inconsistent", nextAction: "repair Phase files and retry",
      }), pair, { material_id: null });
    }
  }
  return null;
}

function validateDirectPacketMaterials(identity, materials) {
  if (identity.reviewKind !== "build_prd" && Object.prototype.hasOwnProperty.call(materials, "review_instructions")) {
    throw new TypeError("MATERIAL_FORBIDDEN: review_instructions is runner-generated");
  }
  if (identity.reviewKind !== "build_prd") return;
  const rule = reviewRuleFor("build-prd");
  const invalid = runMaterialAllowlistPreflight(
    { stage: identity.stage, review_kind: identity.reviewKind, materials },
    rule,
    null,
    { rejectGenerated: true },
  );
  if (invalid) throw new TypeError(`MATERIAL_${invalid.error.code === "MATERIAL_FORBIDDEN" ? "FORBIDDEN" : "INCOMPLETE"}: ${invalid.error.message}`);
}

function staticReviewRule(input) {
  const reviewKind = input.review_kind ?? input.reviewKind ?? null;
  const stage = reviewKind === "build_prd" ? "build-prd" : reviewKind ?? input.stage;
  const track = reviewKind === null ? (input.review_track ?? input.reviewTrack ?? null) : null;
  const scope = reviewKind === null ? (input.review_scope ?? input.reviewScope ?? null) : null;
  return stage === "build-plan" && reviewActivationCohort(input) === "post"
    ? stageMaterials.stages["build-plan"].profiles.post
    : reviewRuleFor(stage, track, scope);
}

function projectRunnerMaterials(input) {
  if (input.stage === "build-prd") return { input, discardedFacts: [] };
  const rule = staticReviewRule(input);
  const allowlist = materialAllowlistForRule(rule);
  const hasKnownMaterial = Object.keys(input.materials ?? {}).some((key) => allowlist.known.includes(key));
  const formalMaterialCheck = input.preflight === true
    || input.review_scope === "integration" || input.reviewScope === "integration";
  if (!hasKnownMaterial && !formalMaterialCheck) return { input, discardedFacts: [] };
  const projection = validateMaterialAllowlist(rule, input.materials ?? {});
  if (Object.keys(projection.materials).length === 0 && Object.keys(input.materials ?? {}).length > 0) {
    return { input, discardedFacts: projection.discarded_facts };
  }
  return { input: { ...input, materials: projection.materials }, discardedFacts: projection.discarded_facts };
}

function shouldRunMaterialPreflight(input, rule) {
  if (input.preflight === true) return true;
  // Integration review requests have a closed material contract. Run the
  // contract check even when a caller supplies only unknown keys so those
  // invocations cannot bypass required/forbidden material validation.
  if (input.review_scope === "integration" || input.reviewScope === "integration") return true;
  const materials = input.materials;
  if (!materials || typeof materials !== "object" || Array.isArray(materials)) return false;
  const allowlist = materialAllowlistForRule(rule);
  const hasKnownMaterial = Object.keys(materials).some((key) => allowlist.known.includes(key));
  return hasKnownMaterial;
}

// A caller may not author the provider instruction source for a formal stage.
// It is generated by the runner from the review identity; only the non-stage
// build-prd surface declares review_instructions as one of its own materials.
function rejectCallerInstructions(materials, { allowDeclaredInstructions = false } = {}) {
  if (allowDeclaredInstructions) return;
  if (materials && typeof materials === "object" && !Array.isArray(materials)
      && Object.prototype.hasOwnProperty.call(materials, "review_instructions")) {
    throw new TypeError("MATERIAL_FORBIDDEN: review_instructions is runner-generated");
  }
}

async function runStaticPreflight(input, {
  route,
  providerSelection,
  runnerOwnsBundle = true,
  providerPreflight = null,
}, pair = null) {
  let rule;
  try {
    rule = staticReviewRule(input);
  } catch (error) {
    return blockedPreflight(input, "MATERIAL_INCOMPLETE", error?.message ?? "review material contract is unavailable", preflightDiagnostic({
      field: "stage",
      expected: "supported review surface",
      actual: input.stage,
      nextAction: "use a configured review surface and retry",
    }), pair);
  }
  try {
    // Only the bundle-owning path may reject a caller-authored instruction
    // source: there the runner renders review-instructions.md itself. A
    // host-supplied bundle has already validated its fixed stage template
    // through buildReviewMaterials, so its material contract governs.
    rejectCallerInstructions(input.materials, {
      allowDeclaredInstructions: !runnerOwnsBundle
        || input.stage === "build-prd" || input.review_kind === "build_prd" || input.reviewKind === "build_prd",
    });
  } catch (error) {
    // The caller-supplied instruction source is exactly what a packet identity
    // would be computed from, so a rejected instruction field has no
    // authenticated material identity. Record that absence explicitly instead
    // of re-deriving an identity from rejected bytes.
    return blockedPreflight(input, "MATERIAL_FORBIDDEN", error.message, preflightDiagnostic({
      field: "review_instructions",
      expected: "runner-generated instruction source",
      actual: "caller-supplied",
      nextAction: "remove review_instructions and retry",
    }), pair, { material_id: null });
  }
  if (!route || !Array.isArray(route.initial) || route.initial.length === 0) {
    return blockedPreflight(input, "ROUTE_UNAVAILABLE", "review route has no initial provider", preflightDiagnostic({
      field: "route",
      expected: "non-empty initial provider list",
      actual: "empty",
      nextAction: "configure an enabled initial provider and retry",
    }), pair);
  }
  if (!providerSelection || !Array.isArray(providerSelection.providers) || providerSelection.providers.length === 0) {
    return blockedPreflight(input, "ROUTE_UNAVAILABLE", "review provider selection is empty", preflightDiagnostic({
      field: "provider_selection",
      expected: "at least one heterologous provider",
      actual: "empty",
      nextAction: "configure an enabled heterologous provider and retry",
    }), pair);
  }
  let minimum;
  try {
    minimum = validateReviewThreshold(route, providerSelection);
  } catch (error) {
    return blockedPreflight(input, "REVIEW_THRESHOLD_INVALID", error.message, preflightDiagnostic({
      field: "minimum_heterologous",
      expected: "explicit positive integer no greater than distinct eligible underlying model identities",
      actual: route?.minimum_heterologous ?? "missing",
      nextAction: "repair the trusted review route/model identities and retry",
    }), pair);
  }
  const materialPreflight = shouldRunMaterialPreflight(input, rule)
    || input.stage === "build-prd" || input.review_kind === "build_prd" || input.reviewKind === "build_prd";
  const materialResult = materialPreflight ? runMaterialAllowlistPreflight(input, rule, pair) : null;
  if (materialResult) return materialResult;
  if (typeof providerPreflight !== "function") return null;

  const providerResults = [];
  for (const provider of providerSelection.providers) {
    const result = await providerPreflight({
      provider,
      model: providerSelection.provider_models?.[provider] ?? null,
      identity: providerSelection.provider_identities?.[provider] ?? null,
    });
    if (!result || typeof result !== "object" || Array.isArray(result)
        || !["ready", "blocked"].includes(result.status)) {
      throw new TypeError(`provider preflight result for ${provider} is invalid`);
    }
    if (result.status === "blocked"
        && !["MODEL_ID_INVALID", "CLI_UNAVAILABLE", "AUTH_INVALID", "ACTIVE_PROBE_FAILED"].includes(result.error?.code)) {
      throw new TypeError(`provider preflight error for ${provider} is invalid`);
    }
    providerResults.push({ ...result, provider });
  }
  const blockedProviders = providerResults.filter((result) => result.status === "blocked");
  if (blockedProviders.length === 0) return null;
  if (blockedProviders.length === providerSelection.providers.length) {
    const first = blockedProviders[0];
    const error = first.error && typeof first.error === "object" ? first.error : {};
    return blockedPreflight(
      input,
      error.code,
      error.message ?? "provider static preflight failed",
      error.diagnostic ?? preflightDiagnostic({
        field: "provider_preflight",
        expected: "ready or structured blocked provider preflight result",
        actual: "blocked without diagnostic",
        nextAction: "repair provider preflight and retry",
      }),
      pair,
      { provider_attempts: 0 },
    );
  }
  return { blocked_provider_results: blockedProviders };
}

function callerOwnedPreflightInput(input) {
  if (input.stage !== "verify-code" || input.reviewed_execution === undefined) return input;
  // The host adds runtime_* materials after authenticating the execution
  // binding. They are frozen provider evidence, not caller-owned review
  // fields; validate the caller contract without dropping them from the
  // provider packet.
  return {
    ...input,
    materials: Object.fromEntries(Object.entries(input.materials).filter(([key]) => !key.startsWith("runtime_"))),
  };
}

function evidenceAnchorValidity(bundleRoot, findings, deliveryManifest) {
  const deliveredPaths = new Set(
    Array.isArray(deliveryManifest)
      ? deliveryManifest
        .map((entry) => entry?.path)
        .filter((path) => typeof path === "string")
      : [],
  );
  return findings.map((finding) => {
    if (!finding || typeof finding.path !== "string" || finding.path.startsWith("/")
        || finding.path.includes("\\") || finding.path.split("/").includes("..")
        || !deliveredPaths.has(finding.path)) return false;
    const target = join(bundleRoot, ...finding.path.split("/"));
    if (!existsSync(target)) return false;
    if (finding.line === undefined || finding.line === null) return true;
    if (!Number.isSafeInteger(finding.line) || finding.line < 1) return false;
    const content = readFileSync(target, "utf8");
    const lineCount = content.length === 0 ? 0 : content.split(/\r?\n/).length;
    return finding.line <= lineCount;
  });
}

function bindReviewSupplementToSelection(supplement, { selectedSet, selectedIdentities, selectedModels, bundleRoot, deliveryManifest }) {
  const provider = supplement?.provider;
  if (typeof provider !== "string" || !selectedSet.has(provider)) {
    const error = new Error("supplement provider is not part of the trusted review selection");
    error.code = "SUPPLEMENT_PROVIDER_INVALID";
    throw error;
  }
  let parsed;
  try {
    parsed = parseReviewerOutput(JSON.stringify({ findings: supplement.findings }), { requireEvidence: true });
  } catch (error) {
    const invalid = new Error(`supplement findings are invalid: ${error.message}`);
    invalid.code = "SUPPLEMENT_INVALID";
    throw invalid;
  }
  const evidenceAnchors = evidenceAnchorValidity(bundleRoot, parsed.findings, deliveryManifest);
  if (!evidenceAnchors.every(Boolean)) {
    const error = new Error("supplement finding evidence does not anchor to submitted material");
    error.code = "EVIDENCE_ANCHOR_INVALID";
    throw error;
  }
  const suppliedIdentity = supplement.identity;
  const trustedIdentity = selectedIdentities?.[provider] ?? null;
  if (suppliedIdentity !== undefined) {
    if (!suppliedIdentity || typeof suppliedIdentity !== "object"
        || suppliedIdentity.provider !== provider
        || suppliedIdentity.adapter !== providerAdapter(provider)
        || (trustedIdentity && (suppliedIdentity.source_id !== trustedIdentity.source_id
          || suppliedIdentity.config_id !== trustedIdentity.config_id))
        || (selectedModels && suppliedIdentity.model !== selectedModels[provider])) {
      const error = new Error("supplement identity does not match the trusted review selection");
      error.code = "SUPPLEMENT_PROVIDER_INVALID";
      throw error;
    }
  }
  const identity = suppliedIdentity ?? (trustedIdentity
    ? {
        provider,
        adapter: providerAdapter(provider),
        source_id: trustedIdentity.source_id,
        config_id: trustedIdentity.config_id,
        model: selectedModels?.[provider] ?? null,
      }
    : null);
  return {
    ...supplement,
    ...(identity ? { identity } : {}),
    findings: parsed.findings.map((finding) => ({ ...finding, provider })),
  };
}

function publicProviderResult(item, evidenceAnchors = undefined, pair = null) {
  return {
    provider: item.provider,
    status: item.status,
    identity: item.identity,
    ...pairFields(pair),
    session_id: item.session_id ?? null,
    ...(item.last_progress_at_ms === undefined ? {} : { last_progress_at_ms: item.last_progress_at_ms }),
    // Provider adapters are untrusted transport boundaries. Keep the
    // provider's machine-readable code, but never expose raw adapter errors or
    // host paths in the public review result.
    error: item.error === null || item.error === undefined ? null : normalizeProviderError(item.error, { preserveCode: true }),
    timing: item.timing,
    usage: item.usage,
    ...(item.execution ? { execution: item.execution } : {}),
    ...(item.unavailable_diagnostics ? { unavailable_diagnostics: item.unavailable_diagnostics } : {}),
    ...(evidenceAnchors === undefined ? {} : { evidence_anchor_valid: evidenceAnchors }),
  };
}

const PUBLIC_FAILURE_CODES = new Map([
  ["OUTPUT_INVALID", "REVIEW_PROVIDER_OUTPUT_INVALID"],
  ["PROVIDER_OUTPUT_INVALID", "REVIEW_PROVIDER_OUTPUT_INVALID"],
  ["PROCESS_TIMEOUT", "REVIEW_EXECUTION_TIMEOUT"],
  ["TIMEOUT", "REVIEW_EXECUTION_TIMEOUT"],
  ["PROCESS_CANCELLED", "REVIEW_CANCELLED"],
  ["CANCELLED", "REVIEW_CANCELLED"],
  ["PROCESS_START_FAILED", "REVIEW_BROKER_START_FAILED"],
  ["BROKER_SPAWN_FAILED", "REVIEW_BROKER_START_FAILED"],
  ["MATERIAL_TOO_LARGE", "REVIEW_INPUT_TOO_LARGE"],
  ["INPUT_TOKEN_LIMIT", "REVIEW_INPUT_TOO_LARGE"],
]);

function normalizeProviderError(error, { preserveCode = false } = {}) {
  const sourceCode = typeof error?.code === "string" && error.code.trim() !== "" ? error.code : null;
  const message = typeof error?.message === "string" && error.message.trim() !== "" ? error.message : "review broker did not produce a semantic result";
  const inferredCode = /prompt\s+too\s+long|input\s+token\s+limit|context\s+length|token\s+limit/i.test(message)
    ? "REVIEW_INPUT_TOO_LARGE"
    : /timeout\s+waiting\s+for\s+response|timeout|timed\s*out|deadline\s+exceeded/i.test(message)
      ? "REVIEW_EXECUTION_TIMEOUT"
      : null;
  const code = preserveCode
    ? (sourceCode ?? inferredCode ?? "REVIEW_BROKER_EXIT_NONZERO")
    : (inferredCode ?? (sourceCode === "REVIEW_PROVIDER_UNAVAILABLE"
      ? "REVIEW_NO_SEMANTIC_RESULT"
      : (PUBLIC_FAILURE_CODES.get(sourceCode) ?? sourceCode ?? "REVIEW_BROKER_EXIT_NONZERO")));
  return {
    code,
    message: redactHostPaths(message),
    ...((code !== sourceCode && sourceCode !== null)
      ? { cause_code: sourceCode }
      : (typeof error?.cause_code === "string" && error.cause_code.trim() !== "" ? { cause_code: error.cause_code } : {})),
  };
}

function unavailableReason(providers) {
  const error = providers.find((item) => item?.error && typeof item.error === "object")?.error;
  return error ? normalizeProviderError(error)
    : { code: "REVIEW_NO_SEMANTIC_RESULT", message: "no provider produced a semantic review result" };
}

function normalizeManagedGroup(lifecycle, selectedIdentities, selectedModels = null, pair = null) {
  const group = lifecycle?.group;
  if (!group || !Array.isArray(group.providers)) throw Object.assign(new Error("managed lifecycle did not return a terminal provider group"), { code: "PROTOCOL_INCOMPATIBLE" });
  const materialId = group.material_id ?? group.materialId ?? lifecycle.material_id ?? lifecycle.materialId;
  return {
    runtimeId: group.runtime_id,
    outcome: group.outcome,
    round: group.round,
    selectedTier: group.selected_tier,
    ...(materialId === undefined ? {} : { material_id: materialId }),
    ...(Object.hasOwn(group, "initial_result_ref") ? { initial_result_ref: group.initial_result_ref } : {}),
    ...(group.publication ? { publication: group.publication } : {}),
    ...(Array.isArray(group.supplements) ? { supplements: group.supplements } : {}),
    providers: group.providers.map((item) => {
      // Managed v2 omits source identity: only the trusted route selection may
      // supply it, and no identity-like field may be copied from the broker
      // member. A workflowhub-result.v3 member carries its own broker identity
      // (provider/adapter/source_id/config_id); the shared provider loop below
      // binds that identity to the trusted selection, so it must survive here
      // instead of being replaced by a selection lookup keyed on a field v3
      // members do not have. Provider is derived the same way the loop derives
      // it, so a v3 member is never degraded to PROVIDER_IDENTITY_INVALID.
      const provider = item?.provider ?? item?.identity?.provider ?? null;
      const brokerV3Identity = item?.result_protocol === "workflowhub-result.v3"
        && item?.identity && typeof item.identity === "object" ? item.identity : null;
      return {
        ...item,
        provider,
        // A managed member that is not a workflowhub-result.v3 envelope carries
        // no identity of its own, so the trusted route selection supplies
        // provider/source_id/config_id. The adapter is a pure function of the
        // provider name and is added here when the selection does not carry one,
        // so the normalized member satisfies the same adapter contract as every
        // other path instead of degrading to PROVIDER_IDENTITY_INVALID.
        identity: brokerV3Identity ?? (selectedIdentities?.[provider]
          ? { provider, adapter: providerAdapter(provider), ...selectedIdentities[provider], model: selectedModels?.[provider] ?? item.model ?? null }
          : null),
        ...(pair ? pairFields(pair) : {}),
      };
    }),
  };
}

async function runSimpleReviewSingle(input, dependencies = {}, pair = null) {
  const signal = assertReviewAbortSignal(dependencies.signal ?? null);
  throwIfReviewAborted(signal);
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new TypeError("review request must be an object");
  if (typeof input.stage !== "string" || input.stage.trim() === "") throw new TypeError("stage is required");
  const hostProvider = input.host_provider ?? input.hostProvider;
  if (typeof hostProvider !== "string" || hostProvider.trim() === "") throw new TypeError("host_provider is required");
  if (!input.materials || typeof input.materials !== "object" || Array.isArray(input.materials) || Object.keys(input.materials).length === 0) throw new TypeError("materials are required");
  let identity;
  try {
    identity = reviewIdentityFromInput(input);
  } catch (error) {
    const rawReviewKind = input.review_kind ?? input.reviewKind ?? null;
    if (rawReviewKind !== "build_prd" && input.stage !== "build-prd") throw error;
    return blockedPreflight(input, "NON_STAGE_IDENTITY_INVALID", error?.message ?? "invalid build_prd review identity", {
      field: "stage/review_kind/review_track/review_scope",
      expected: "stage=build-prd, review_kind=build_prd, review_track=null, review_scope=null",
      actual: JSON.stringify({
        stage: input.stage,
        review_kind: rawReviewKind,
        review_track: input.review_track ?? input.reviewTrack ?? null,
        review_scope: input.review_scope ?? input.reviewScope ?? null,
      }),
      next_action: "use the non-stage build-prd sentinel or a formal stage review kind",
    }, pair, { material_id: null });
  }
  let canonicalInput = {
    ...input,
    stage: identity.stage,
    review_track: identity.reviewTrack,
    review_scope: identity.reviewScope,
    review_kind: identity.reviewKind,
  };
  let materialDiscardedFacts = [];
  try {
    const projected = projectRunnerMaterials(canonicalInput);
    canonicalInput = projected.input;
    materialDiscardedFacts = projected.discardedFacts;
  } catch (error) {
    return blockedPreflight(canonicalInput, "MATERIAL_FORBIDDEN", error?.message ?? "review material is forbidden", preflightDiagnostic({
      field: "materials",
      expected: "current stage material allowlist",
      actual: "forbidden or retired material key",
      nextAction: "remove the forbidden material and retry",
    }), pair);
  }
  if (identity.stage === "build-prd") {
    let rule;
    try {
      rule = staticReviewRule(canonicalInput);
    } catch (error) {
      return blockedPreflight(canonicalInput, "MATERIAL_INCOMPLETE", error?.message ?? "review material contract is unavailable", preflightDiagnostic({
        field: "material_contract",
        expected: "configured build-prd material allowlist",
        actual: "unavailable",
        nextAction: "configure the build-prd material contract and retry",
      }), pair);
    }
    const preflight = runMaterialAllowlistPreflight(canonicalInput, rule, pair);
    if (preflight) return preflight;
  }
  try {
    // Reject binary materials before route resolution so a material set the
    // redaction boundary cannot inspect never reaches config, broker, or lock.
    assertRedactableMaterials(canonicalInput.materials);
  } catch (error) {
    return blockedPreflight(canonicalInput, "MATERIAL_FORBIDDEN", error.message, preflightDiagnostic({
      field: "materials",
      expected: "text or JSON provider material",
      actual: "binary",
      nextAction: "supply text or JSON materials and retry",
    }), pair, { material_id: null });
  }
  let reviewInput = canonicalInput;
  if (canonicalInput.stage === "verify-code") {
    const projection = compactVerifyCodeMaterials(canonicalInput.materials);
    reviewInput = projection.diff === null ? canonicalInput : { ...canonicalInput, materials: projection.materials };
  }

  const reviewTrack = identity.reviewTrack;
  const reviewScope = identity.reviewScope;
  const reviewKind = identity.reviewKind;
  const loadConfig = dependencies.loadConfig ?? loadTrustedThirdReviewConfig;
  const resolveRoute = dependencies.resolveRoute ?? resolveTrustedReviewRoute;
  const selectProviders = dependencies.selectProviders ?? selectTrustedReviewProviderSelection;
  let trusted;
  let route;
  try {
    trusted = loadConfig({ requestedStage: canonicalInput.stage, requestedTrack: reviewTrack, requestedReviewKind: reviewKind });
    route = resolveRoute(trusted.whReview, canonicalInput.stage, reviewTrack, reviewKind, reviewScope);
  } catch (error) {
    return blockedPreflight(input, "ROUTE_UNAVAILABLE", String(error?.message ?? error), preflightDiagnostic({
      field: "route_config",
      expected: "valid host configuration and route",
      actual: "unavailable",
      nextAction: "repair the trusted review route and retry",
    }), pair);
  }
  if (!route) return blockedPreflight(input, "ROUTE_UNAVAILABLE", "no heterologous review route is configured", preflightDiagnostic({
    field: "route",
    expected: "configured review route",
    actual: "missing",
    nextAction: "configure the review route and retry",
  }), pair);
  let selection;
  try {
    selection = selectProviders(trusted.config, input.host_provider ?? input.hostProvider, route);
  } catch (error) {
    const source = String(error?.message ?? error);
    return blockedPreflight(input, "ROUTE_UNAVAILABLE", source, preflightDiagnostic({
      field: /same.source|same source|host.*reviewer/i.test(source) ? "host_provider" : "provider_selection",
      expected: /same.source|same source|host.*reviewer/i.test(source) ? "heterologous provider" : "enabled provider selection",
      actual: "unavailable",
      nextAction: "repair the provider route and retry",
    }), pair);
  }
  let providerSelection;
  try { providerSelection = providerSelectionShape(selection); }
  catch (error) {
    return blockedPreflight(input, "ROUTE_UNAVAILABLE", error.message, preflightDiagnostic({
      field: "provider_selection",
      expected: "unique enabled provider selection",
      actual: "invalid",
      nextAction: "repair the provider route and retry",
    }), pair);
  }
  const preflight = await runStaticPreflight(
    callerOwnedPreflightInput(canonicalInput),
    {
      route,
      providerSelection,
      runnerOwnsBundle: typeof dependencies.buildBundle !== "function",
      providerPreflight: dependencies.providerPreflight,
    },
    pair,
  );
  if (preflight?.status) return preflight;
  const blockedProviderResults = preflight?.blocked_provider_results ?? [];
  const selectedProviders = providerSelection.providers;
  const blockedProviderSet = new Set(blockedProviderResults.map((item) => item.provider));
  const dispatchProviders = selectedProviders.filter((provider) => !blockedProviderSet.has(provider));
  const dispatchEligibleProfiles = (providerSelection.eligible_profiles ?? selectedProviders)
    .filter((provider) => !blockedProviderSet.has(provider));
  let minimum;
  try {
    // Preflight may remove providers after the initial route selection. The
    // broker must receive a quorum that is valid for the providers that can
    // actually be dispatched, not for the stale preflight selection.
    minimum = validateReviewThreshold(route, {
      ...providerSelection,
      providers: dispatchProviders,
      eligible_profiles: dispatchEligibleProfiles,
    });
  } catch (error) {
    const dispatchModels = dispatchEligibleProfiles.map((provider) => providerSelection.provider_models?.[provider]);
    return blockedPreflight(canonicalInput, "REVIEW_THRESHOLD_INVALID", error.message, preflightDiagnostic({
      field: "minimum_heterologous",
      expected: "explicit positive integer no greater than distinct eligible underlying model identities after provider preflight",
      actual: `${new Set(dispatchModels).size} distinct eligible underlying model identities remain after filtering blocked providers`,
      nextAction: "repair provider availability or review threshold and retry",
    }), pair, {
      minimum_heterologous: route?.minimum_heterologous ?? null,
      provider_selection: providerSelectionOutput(providerSelection),
    });
  }
  const selectedIdentities = providerSelection.provider_identities ?? null;
  const selectedModels = providerSelection.provider_models ?? null;
  const selectedSet = new Set(selectedProviders);
  const eligibleSet = new Set(providerSelection.eligible_profiles ?? selectedProviders);
  let bundle;
  try {
    bundle = typeof dependencies.buildBundle === "function"
      ? dependencies.buildBundle(trusted.attachmentRoot, reviewInput)
      : buildBundle(trusted.attachmentRoot, reviewInput);
    if (!bundle || typeof bundle !== "object" || typeof bundle.materialId !== "string"
        || typeof bundle.bundleRoot !== "string" || typeof bundle.dispose !== "function") {
      throw new TypeError("prepared review bundle is invalid");
    }
  } catch (error) {
    return unavailableResult(reviewInput, normalizeProviderError(error), pair, {
      minimum_heterologous: minimum,
      provider_selection: providerSelectionOutput(providerSelection),
    });
  }
  try {
    const client = dependencies.client ?? new ReviewProviderClient({ command: trusted.command, config: trusted.config });
    const hostProvider = input.host_provider ?? input.hostProvider;
    const prompt = promptForPair(pair);
    let group;
    if (typeof client.startManaged === "function") {
      const requestId = managedRequestId(input, {
        materialId: bundle.materialId,
        hostProvider,
        providers: dispatchProviders,
        providerIdentities: selectedIdentities,
        minimumHeterologous: minimum,
        reviewMode: route.mode,
        prompt,
      });
      let lifecycle = null;
      try {
        lifecycle = await client.startManaged({
          requestId, hostProvider, providers: dispatchProviders, materials: bundle, prompt,
          minimumHeterologous: minimum,
          reviewMode: route.mode,
          reviewFlow: input.review_flow ?? input.reviewFlow ?? null,
          ...(signal === null ? {} : { signal }),
        });
        if (lifecycle.state !== "terminal") {
          const consumeTerminal = dependencies.onManagedTerminal
            ?? ((value) => waitForManagedTerminal({
              ...value,
              minimumHeterologous: minimum,
              providerModels: selectedModels,
            }, dependencies));
          const terminal = await consumeTerminal({
            lifecycle, client, requestId, hostProvider, providers: dispatchProviders,
            materials: bundle, prompt, reviewMode: route.mode,
          });
          lifecycle = terminal?.state ? terminal : { ...lifecycle, state: "terminal", group: terminal };
        }
        if (lifecycle?.state !== "terminal") throw Object.assign(new Error("managed review terminal event is invalid"), { code: "PROTOCOL_INCOMPATIBLE" });
        group = normalizeManagedGroup(lifecycle, selectedIdentities, selectedModels, pair);
      } catch (error) {
        if (error?.code === "REVIEW_SOURCE_DRIFT"
            && lifecycle?.runtime_id
            && typeof client.cancelManaged === "function") {
          try {
            await client.cancelManaged({
              runtimeId: lifecycle.runtime_id,
              requestId,
              hostProvider,
              providers: dispatchProviders,
              materials: bundle,
            });
          } catch (cancelError) {
            if (error && typeof error === "object") {
            const normalizedCancelError = normalizeProviderError(cancelError);
            error.message = `${error.message}; broker cancellation failed: ${normalizedCancelError.code} (${normalizedCancelError.message})`;
            error.cause_code ??= normalizedCancelError.code;
            error.cancel_error = normalizedCancelError;
            }
          }
        }
        const observation = error?.managed_observation;
        const source = observation?.providers;
        const entries = Array.isArray(source)
          ? source.map((item) => [item?.provider ?? item?.identity?.provider, item])
          : source && typeof source === "object" ? Object.entries(source) : [];
        const providerResults = entries
          .filter(([provider, item]) => typeof provider === "string" && item && typeof item === "object" && !Array.isArray(item))
          .map(([provider, item]) => {
            const expectedIdentity = selectedIdentities?.[provider];
            const identity = expectedIdentity
              ? { provider, adapter: providerAdapter(provider), ...expectedIdentity, model: selectedModels?.[provider] ?? null }
              : item.identity;
            const semantic = item.status === "completed" && (item.error === null || item.error === undefined);
            return publicProviderResult({
              ...item,
              provider: item.provider ?? provider,
              ...(identity ? { identity } : {}),
              ...(semantic ? {
                status: "failed",
                error: {
                  code: "PROVIDER_RESULT_INVALID",
                  message: "managed review observation ended before a completed provider could be identity-authenticated",
                },
              } : {}),
            }, undefined, pair);
          });
        return unavailableResult(input, normalizeProviderError(error), pair, {
          // A transmitted request whose reply could not be parsed is neither
          // "dispatched" nor "blocked_before_dispatch"; keep the transport's own
          // classification when it reported one.
          dispatch_state: observation?.dispatch_state ?? (lifecycle ? "dispatched" : "blocked_before_dispatch"),
          request_id: requestId,
          runtime_id: observation?.runtime_id ?? lifecycle?.runtime_id ?? null,
          minimum_heterologous: minimum,
          provider_selection: providerSelectionOutput(providerSelection),
          provider_results: providerResults,
        });
      }
    } else {
      try {
        group = await client.runGroup({
          hostProvider,
          providers: dispatchProviders,
          materials: bundle,
          prompt,
          minimumHeterologous: minimum,
          reviewMode: route.mode,
          // The managed and unmanaged transports must expose the same provider
          // contract: a direction review is one request carrying its ordered
          // reconstruct -> reveal -> challenge flow. Omitting it here would let
          // the unmanaged path silently downgrade the governed flow.
          reviewFlow: input.review_flow ?? input.reviewFlow ?? null,
          strictProtocol: true,
          ...pairFields(pair),
          ...(signal === null ? {} : { signal }),
        });
      } catch (error) {
        return unavailableResult(input, normalizeProviderError(error), pair, {
          // The provider client was called. Preserve that transport boundary so
          // an external input-limit response cannot be mistaken for the
          // retired local byte-cap preflight.
          dispatch_state: "dispatched",
          minimum_heterologous: minimum,
          provider_selection: providerSelectionOutput(providerSelection),
        });
      }
    }
    const brokerMaterialIds = ["material_id", "materialId"]
      .filter((key) => Object.prototype.hasOwnProperty.call(group ?? {}, key))
      .map((key) => group[key]);
    if (brokerMaterialIds.some((materialId) => materialId !== bundle.materialId)) {
      return unavailableResult(canonicalInput, {
        code: "REVIEW_MATERIAL_IDENTITY_MISMATCH",
        message: "broker material identity does not match the submitted review bundle",
      }, pair, {
        runtime_id: group?.runtimeId ?? group?.runtime_id ?? null,
        outcome: group?.outcome ?? "unavailable",
        minimum_heterologous: minimum,
        provider_selection: providerSelectionOutput(providerSelection),
      });
    }
    const findings = [];
    const discardedFacts = [];
    const semanticModels = new Set();
    const receivedProviders = Array.isArray(group?.providers) ? group.providers : [];
    const seenProviders = new Set();
    const providers = receivedProviders.map((rawItem) => {
      const item = rawItem && typeof rawItem === "object"
        ? { ...rawItem, provider: rawItem.provider ?? rawItem.identity?.provider }
        : rawItem;
      const provider = item?.provider;
      const expectedIdentity = selectedIdentities && typeof selectedIdentities === "object"
        ? selectedIdentities[provider] : null;
      const expectedModel = selectedModels?.[provider];
      const identity = item?.identity;
      const identityValid = typeof provider === "string" && selectedSet.has(provider)
        && !seenProviders.has(provider)
        && identity && typeof identity === "object" && identity.provider === provider
        && (identity.adapter === undefined || identity.adapter === providerAdapter(provider))
        && (!selectedIdentities || (expectedIdentity && typeof expectedIdentity === "object"
          && typeof expectedIdentity.source_id === "string" && expectedIdentity.source_id.trim() !== ""
          && typeof expectedIdentity.config_id === "string" && expectedIdentity.config_id.trim() !== ""
          && identity.config_id === expectedIdentity.config_id
          && identity.source_id === expectedIdentity.source_id))
        && (!selectedModels || (item.status !== "completed"
          ? true
          : typeof identity.model === "string" && identity.model === expectedModel));
      seenProviders.add(provider);
      if (!identityValid) {
        // Identity degradation is a member-level fact, not a replacement for
        // the broker's failure reason. Keep the broker's original machine
        // code (e.g. PUBLIC_RESULT_INVALID when the provider output exposed a
        // private host path) and only annotate that the member identity was
        // degraded; do not hide the real cause behind PROVIDER_IDENTITY_INVALID.
        const degraded = publicProviderResult(item, undefined, pair);
        return {
          ...degraded,
          status: "failed",
          identity_degraded: true,
          error: {
            code: item.error?.code ?? "PROVIDER_IDENTITY_INVALID",
            message: "provider result is not bound to the trusted review selection; broker member identity was degraded: "
              + (degraded.error?.message ?? "identity mismatch"),
          },
        };
      }
      if (item.status === "completed" && typeof item.output === "string" && item.error === null) {
        let parsed;
        try {
          parsed = parseReviewerOutput(item.output, { requireEvidence: true });
        } catch (error) {
          const parseError = typeof error?.parse_error === "string" && error.parse_error.trim() !== ""
            ? error.parse_error
            : "provider output candidate is invalid";
          return {
            ...publicProviderResult(item, undefined, pair),
            status: "failed",
            error: {
              code: "OUTPUT_INVALID",
              message: "provider output is not valid findings JSON",
              parse_error: redactHostPaths(parseError),
            },
          };
        }
        const providerDiscardedFacts = [...(parsed.discarded_facts ?? [])];
        discardedFacts.push(...providerDiscardedFacts);
        const evidenceAnchors = evidenceAnchorValidity(bundle.bundleRoot, parsed.findings, bundle.deliveryManifest);
        const anchoredFindings = parsed.findings.filter((_finding, index) => evidenceAnchors[index]);
        const anchoredEvidence = evidenceAnchors.filter(Boolean);
        parsed.findings.forEach((finding, index) => {
          if (evidenceAnchors[index]) return;
          const discarded = {
            fact_kind: "unanchored_finding_dropped",
            finding_excerpt: JSON.stringify({ path: finding.path ?? null, line: finding.line ?? null, issue: finding.issue ?? null }),
            reason: "evidence_anchor_invalid",
          };
          providerDiscardedFacts.push(discarded);
          discardedFacts.push(discarded);
        });
        if (eligibleSet.has(item.provider)) semanticModels.add(item.identity.model);
        for (const finding of anchoredFindings) findings.push({ ...finding, provider: item.provider });
        const providerResult = publicProviderResult(item, anchoredEvidence, pair);
        return providerDiscardedFacts.length > 0
          ? { ...providerResult, discarded_facts: providerDiscardedFacts }
          : providerResult;
      }
      return publicProviderResult(item, undefined, pair);
    });
    // A broker may finish a partial group without emitting a member for every
    // selected provider. Make that omission an explicit failed provider fact;
    // never let a clean-looking result hide an unobserved selected route.
    for (const provider of dispatchProviders) {
      if (seenProviders.has(provider)) continue;
      const expectedIdentity = selectedIdentities && typeof selectedIdentities === "object"
        ? selectedIdentities[provider] : null;
      providers.push(publicProviderResult({
        provider,
        status: "failed",
        identity: { provider, ...(expectedIdentity && typeof expectedIdentity === "object" ? expectedIdentity : {}) },
        error: { code: "PROVIDER_RESULT_MISSING", message: "trusted review route omitted a selected provider result" },
      }, undefined, pair));
    }
    for (const item of blockedProviderResults) {
      const sourceError = item.error && typeof item.error === "object" ? item.error : {};
      const blocked = publicProviderResult({
        ...item,
        status: "failed",
        error: {
          code: "PROVIDER_HEALTH_FAILED",
          message: sourceError.message ?? "provider preflight failed",
          ...(typeof sourceError.code === "string" && sourceError.code.trim() !== ""
            ? { cause_code: sourceError.code }
            : {}),
        },
        identity: item.identity ?? null,
        timing: item.timing ?? null,
        usage: item.usage ?? null,
      }, undefined, pair);
      if (item.error?.diagnostic && blocked.error) {
        blocked.error = { ...blocked.error, diagnostic: item.error.diagnostic };
      }
      providers.push(blocked);
    }
    // A broker member without a provider identity cannot be bound to any
    // trusted selection. Do not expose an extra `unknown` member that the
    // canonical recorder must reject as a selection mismatch. Preserve the
    // route selection and the broker/runtime identity as an unavailable fact;
    // the recorder can then persist the failed round without inventing a
    // provider binding.
    const providerNames = providers.map((item) => item?.provider);
    if (providerNames.some((provider) => !selectedSet.has(provider))
        || new Set(providerNames).size !== providerNames.length
        || providerNames.length !== selectedProviders.length) {
      return unavailableResult(input, {
        code: "PROVIDER_RESULT_INVALID",
        message: "broker provider results could not be bound uniquely to the trusted review selection",
      }, pair, {
        minimum_heterologous: minimum,
        runtime_id: group.runtimeId,
        outcome: group.outcome,
        provider_selection: providerSelectionOutput(providerSelection),
      });
    }
    const available = semanticModels.size >= minimum;
    const observedMaterialId = brokerMaterialIds[0] ?? bundle.materialId;
    const baseResult = {
      status: available ? "available" : "unavailable",
      stage: input.stage,
      ...reviewSubjectFields(input),
      review_track: reviewTrack,
      review_kind: reviewKind,
      material_id: observedMaterialId,
      ...pairFields(pair),
      dispatch_state: "dispatched",
      provider_attempts: dispatchProviders.length,
      runtime_id: group.runtimeId,
      outcome: group.outcome,
      ...(group.transport_timeout ? { transport_timeout: group.transport_timeout } : {}),
      ...(Object.hasOwn(group, "initial_result_ref") ? { initial_result_ref: group.initial_result_ref } : {}),
      ...(group.publication ? { publication: group.publication } : {}),
      minimum_heterologous: minimum,
      provider_selection: providerSelectionOutput(providerSelection),
      provider_results: providers,
      findings,
      ...((materialDiscardedFacts.length > 0 || discardedFacts.length > 0)
        ? { discarded_facts: [...materialDiscardedFacts, ...discardedFacts] }
        : {}),
      ...(available ? {} : { error: unavailableReason(providers) }),
    };
    if (!Array.isArray(group.supplements) || group.supplements.length === 0) {
      return { ...baseResult, ...(Array.isArray(group.supplements) ? { supplements: group.supplements } : {}) };
    }
    try {
      const supplements = group.supplements.map((supplement) => bindReviewSupplementToSelection(supplement, {
        selectedSet, selectedIdentities, selectedModels, bundleRoot: bundle.bundleRoot,
        deliveryManifest: bundle.deliveryManifest,
      }));
      return supplements.reduce((current, supplement) => registerReviewSupplement(current, supplement), {
        ...baseResult,
        supplements: [],
      });
    } catch (error) {
      return unavailableResult(input, normalizeProviderError(error), pair, {
        dispatch_state: "dispatched",
        minimum_heterologous: minimum,
        runtime_id: group.runtimeId,
        outcome: group.outcome,
        provider_selection: providerSelectionOutput(providerSelection),
        provider_results: providers,
        findings,
      });
    }
  } finally {
    bundle.dispose();
  }
}

function isPairedMakeDecisionInput(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return false;
  const track = input.review_track ?? input.reviewTrack ?? null;
  const reviewKind = input.review_kind ?? input.reviewKind ?? null;
  return input.stage === "make-decision"
    && ["direction", "detail"].includes(track)
    && reviewKind === null
    && input.pair_id === undefined && input.pairId === undefined
    && input.role === undefined;
}

function pairResultIncomplete(result, materialId) {
  return result.status !== "available"
    || result.outcome !== "completed"
    || result.material_id !== materialId
    || result.provider_results.some((provider) => provider.status !== "completed");
}

function uniquePairFindings(roleResults) {
  const findings = new Map();
  for (const result of roleResults) {
    for (const finding of result.findings) {
      const key = `${finding.path}\u0000${finding.line ?? ""}\u0000${finding.issue}`;
      const existing = findings.get(key);
      if (existing) {
        existing.roles = [...new Set([...(existing.roles ?? [existing.role]), result.role])].sort();
        existing.providers = [...new Set([...(existing.providers ?? [existing.provider]), finding.provider])].sort();
      } else {
        findings.set(key, {
          ...finding, pair_id: result.pair_id, role: result.role, roles: [result.role], providers: [finding.provider],
        });
      }
    }
  }
  return [...findings.values()];
}

function combinePairedResults(input, pairId, roleResults) {
  if (roleResults.length === 0) throw new TypeError("paired review requires at least one role result");
  const byRole = Object.fromEntries(roleResults.map((result) => [result.role, result]));
  const red = byRole.red;
  const blue = byRole.blue;
  const materialIds = Object.fromEntries(roleResults.map((result) => [result.role, result.material_id]));
  const materialValues = roleResults.map((result) => result.material_id).filter((value) => typeof value === "string");
  const materialConsistent = materialValues.length === 2 && new Set(materialValues).size === 1;
  const expectedMaterialId = materialConsistent ? materialValues[0] : null;
  const incomplete = Object.fromEntries(roleResults.map((result) => [result.role, pairResultIncomplete(result, expectedMaterialId)]));
  const anyAvailable = roleResults.some((result) => result.status === "available");
  const anyIncomplete = Object.values(incomplete).some(Boolean);
  const allIncomplete = roleResults.every((result) => incomplete[result.role]);
  const status = !anyAvailable ? "unavailable" : (anyIncomplete || !materialConsistent ? "available-with-failures" : "available");
  const materialStatus = materialConsistent ? "consistent" : "partial";
  // FR-C4-004: the dispatch state belongs to the aggregate result itself, not
  // only to each role record. The pair was blocked before dispatch only when
  // every role was; otherwise at least one role reached the provider.
  const allReused = roleResults.every((result) => result?.dispatch_state === "reused");
  // Older managed group adapters omit dispatch_state after a provider call.
  // Their presence is still evidence that dispatch was attempted; only an
  // explicit blocked_before_dispatch state proves that no role reached a
  // provider.
  const anyDispatched = roleResults.some((result) => result?.dispatch_state === "dispatched"
    || result?.dispatch_state === undefined);
  const dispatchState = allReused
    ? "reused"
    : anyDispatched
      ? "dispatched"
      : "blocked_before_dispatch";
  return {
    status,
    dispatch_state: dispatchState,
    stage: input.stage,
    ...reviewSubjectFields(input),
    review_track: input.review_track ?? input.reviewTrack ?? null,
    review_kind: null,
    pair_id: pairId,
    material_id: expectedMaterialId,
    ...(red?.authenticated_evidence_sha256
      ? {
          authenticated_evidence: red.authenticated_evidence,
          authenticated_evidence_sha256: red.authenticated_evidence_sha256,
        }
      : {}),
    material_ids: materialIds,
    material_consistency: materialStatus,
    pair_status: status === "available" ? "complete" : "partial",
    runtime_id: null,
    outcome: status === "available" ? "completed" : "partial",
    // Policies and selections belong to each role_result; there is no
    // authenticated shared minimum or selection for a flattened pair.
    provider_results: roleResults.flatMap((result) => result.provider_results),
    findings: uniquePairFindings(roleResults),
    role_results: { red, blue },
    ...(incomplete.red ? { red_incomplete: true } : {}),
    ...(incomplete.blue ? { blue_incomplete: true } : {}),
    ...(materialConsistent ? {} : { error: { code: "PAIR_MATERIAL_MISMATCH", message: "red and blue review material_id values do not match" } }),
    ...(allIncomplete && materialConsistent ? { error: red.error ?? blue.error ?? { code: "REVIEW_NO_SEMANTIC_RESULT", message: "neither paired review produced a semantic result" } } : {}),
  };
}

export async function runSimpleReview(input, dependencies = {}) {
  if (!isPairedMakeDecisionInput(input)) {
    const pair = input?.pair_id && input?.role ? { pair_id: input.pair_id, role: input.role } : null;
    return runSimpleReviewSingle(input, dependencies, pair);
  }
  const pairId = dependencies.pairId ?? dependencies.pair_id ?? randomUUID();
  const roleResults = await Promise.all(["red", "blue"].map((role) => runSimpleReviewSingle(
    input,
    dependencies,
    { pair_id: pairId, role },
  )));
  return combinePairedResults(input, pairId, roleResults);
}

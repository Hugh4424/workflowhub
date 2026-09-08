import { createHash, randomUUID } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";

import { ReviewProviderClient } from "./review-provider-client.mjs";
import { parseReviewerOutput } from "./review-output.mjs";
import {
  loadTrustedThirdReviewConfig,
  resolveTrustedReviewRoute,
  selectTrustedReviewProviderSelection,
} from "./third-review-host-config.mjs";
import { redactProviderHostPaths } from "./review-materials.mjs";
import { providerAdapter } from "../../../runtime/review/canonical-review-result.mjs";
import { reviewRuleFor } from "../../../runtime/review/review-policy.mjs";
import { compactVerifyCodeMaterials } from "./review-input-bounds.mjs";

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

const RESULT_SAMPLE = `Example of a complete finding:\n{\n  "findings": [{\n    "severity": "major",\n    "path": "materials/02-approved_spec.md",\n    "line": 42,\n    "issue": "FR-REV-002 requires a constitution clause citation, but the evidence field only contains the decision id; acceptance cannot verify clause-level traceability.",\n    "recommendation": "Add the constitution clause (e.g., F9, F4) to the 'evidence' field of FR-REV-002.",\n    "root_cause": "New FR was copied without the existing template's evidence field.",\n    "evidence_kind": "direct",\n    "evidence": "FR-REV-002 evidence field reads 'D-007' but lacks any '宪法' clause reference, unlike other FRs which cite specific clauses."\n  }]\n}\nExample of an empty result (no findings):\n{\n  "findings": []\n}\nOutput rules:\n- Emit exactly one JSON object shaped like the example above.\n- severity must be one of: blocking, major, minor.\n- evidence_kind must be one of: direct, machine, inferred.\n- path must be the bundle-relative path shown in the manifest.\n- line must be an integer line number in that file, or omitted.\n- Do not output a verdict, summary, pass/fail, checklist, or a second JSON object.\n- Do not wrap the JSON in markdown code fences.\n`;

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
  "build-code": "Check the submitted implementation material for correctness, real consumers, failure paths, tests, and unnecessary code.",
  "verify-code": "Check only the submitted implementation and test code for correctness, real consumer seams, lifecycle/concurrency and security risks, failure boundaries, and test strength. Do not report T010 status, AC coverage, repository-wide gate status, review packet/material completeness, receipt or provenance availability, or release/close status as code findings; those are acceptance and quality facts outside this review.",
  "mini_task.design": "Check that the mini-task remains small, complete, testable, and reversible.",
  "mini_task.implementation": "Check implementation correctness, user result, tests, and scope boundaries.",
});

function hash(bytes) { return createHash("sha256").update(bytes).digest("hex"); }

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
  const track = input.review_track ?? input.reviewTrack ?? null;
  const kind = input.review_kind ?? input.reviewKind ?? null;
  const host = input.host_provider ?? input.hostProvider;
  if (typeof host !== "string" || !host.trim()) throw new TypeError("host_provider is required for trusted route identity");
  const trusted = (dependencies.loadConfig ?? loadTrustedThirdReviewConfig)({ requestedStage: input.stage, requestedTrack: track, requestedReviewKind: kind });
  const route = (dependencies.resolveRoute ?? resolveTrustedReviewRoute)(trusted.whReview, input.stage, track, kind);
  if (!route) throw new Error("ROUTE_UNAVAILABLE: no trusted review route");
  const selection = providerSelectionShape((dependencies.selectProviders ?? selectTrustedReviewProviderSelection)(trusted.config, host, route));
  const stable = (value) => Array.isArray(value) ? value.map(stable) : value && typeof value === "object"
    ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])])) : value;
  return Object.freeze({ route_identity: hash(JSON.stringify(stable({ stage: input.stage, review_track: track, review_kind: kind, host_provider: host, route, selection }))), provider_selection: selection });
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
  return stage === "make-decision" ? `${stage}/${track ?? "detail"}` : stage;
}

function instructions(input) {
  const name = surface(input);
  return [
    `Review surface: ${name}.`,
    FOCUS[name] ?? "Review the supplied current-stage material for concrete delivery risks.",
    "This is heterologous advice only. Review only the submitted material; do not access Workspace, TaskHandle, Git, repository files, shell, network, or host paths.",
    "Report only concrete findings that could change delivery. Merge duplicate root causes. Findings may be empty, but empty findings do not mean completion or approval.",
  ].join("\n");
}

function materialBytes(value) {
  if (Buffer.isBuffer(value)) return value;
  if (typeof value === "string") return Buffer.from(value, "utf8");
  return Buffer.from(`${JSON.stringify(value, null, 2)}\n`, "utf8");
}

const AUTHENTICATED_EVIDENCE_PATH = "authenticated-evidence.json";

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function authenticatedEvidenceFields(input) {
  if (input?.authenticated_evidence === undefined) return {};
  const value = input.authenticated_evidence;
  if (!value || typeof value !== "object" || Array.isArray(value) || Buffer.isBuffer(value)) {
    throw new TypeError("authenticated_evidence must be a non-empty JSON object");
  }
  const normalized = redactProviderHostPaths(value);
  const bytes = Buffer.from(`${canonicalJson(normalized)}\n`, "utf8");
  return {
    authenticated_evidence: normalized,
    authenticated_evidence_sha256: hash(bytes),
  };
}

function authenticatedEvidenceBytes(value) {
  return Buffer.from(`${canonicalJson(redactProviderHostPaths(value))}\n`, "utf8");
}

function safeName(key, index, value) {
  const stem = String(key).replace(/[^A-Za-z0-9._-]+/g, "_").replace(/^\.+/, "") || `material_${index + 1}`;
  return `materials/${String(index + 1).padStart(2, "0")}-${stem}${typeof value === "string" || Buffer.isBuffer(value) ? ".md" : ".json"}`;
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
  Object.entries(input.materials ?? {}).forEach(([key, value], index) => {
    const redacted = redactProviderHostPaths(value);
    write(safeName(key, index, redacted), materialBytes(redacted));
  });
  if (input.authenticated_evidence !== undefined) {
    write(AUTHENTICATED_EVIDENCE_PATH, authenticatedEvidenceBytes(input.authenticated_evidence));
  }
  const manifest = Buffer.from(`${JSON.stringify({ version: 1, surface: surface(input), files: entries }, null, 2)}\n`, "utf8");
  const deliveryBytes = entries.reduce((total, entry) => total + entry.bytes, 0) + manifest.length;
  if (deliveryBytes > 330 * 1024) {
    rmSync(bundleRoot, { recursive: true, force: true });
    throw Object.assign(new Error("MATERIAL_TOO_LARGE: review bundle exceeds the 330 KiB provider delivery budget"), { code: "MATERIAL_TOO_LARGE" });
  }
  write("manifest.json", manifest);
  // Keep the bundle identity identical to the frozen packet identity. The
  // packet hash covers the canonical manifest entry as well as its contents;
  // using a pre-manifest hash here would make a frozen input impossible to
  // rehydrate without changing its identity.
  const materialId = materialIdForInput(input);
  return {
    bundleRoot,
    attachmentRoot,
    sourcePrefix: relative(attachmentRoot, bundleRoot).split(sep).join("/"),
    materialId,
    deliveryManifest: entries,
    dispose() { rmSync(bundleRoot, { recursive: true, force: true }); },
  };
}

function materialIdForInput(input) {
  // Mirror buildBundle exactly: the provider-visible identity is computed over
  // host-path-redacted values, never over raw caller bytes.
  // verify-code may receive a large authenticated diff. The provider sees the
  // bounded projection, so every caller that derives material_id (including
  // the record route and unavailable results) must derive it from that same
  // projection. If projection cannot be formed, retain the raw identity so
  // the explicit MATERIAL_TOO_LARGE fact remains recordable against the
  // authenticated request.
  let packetMaterials = input.materials;
  if (input.stage === "verify-code") {
    try { packetMaterials = compactVerifyCodeMaterials(input.materials).materials; }
    catch { packetMaterials = input.materials; }
  }
  const instructionBytes = Buffer.from(`${redactProviderHostPaths(instructions(input))}\n`, "utf8");
  const entries = [{ path: "review-instructions.md", bytes: instructionBytes.length }];
  entries[0].sha256 = hash(instructionBytes);
  Object.entries(packetMaterials ?? {}).forEach(([key, value], index) => {
    const redacted = redactProviderHostPaths(value);
    const bytes = materialBytes(redacted);
    entries.push({ path: safeName(key, index, redacted), bytes: bytes.length, sha256: hash(bytes) });
  });
  if (input.authenticated_evidence !== undefined) {
    const bytes = authenticatedEvidenceBytes(input.authenticated_evidence);
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

export function createSimpleReviewPacket(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new TypeError("review packet input must be an object");
  if (typeof input.stage !== "string" || input.stage.trim() === "") throw new TypeError("stage is required");
  if (!input.materials || typeof input.materials !== "object" || Array.isArray(input.materials) || Object.keys(input.materials).length === 0) throw new TypeError("materials are required");
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
    stage: input.stage,
    review_track: input.review_track ?? input.reviewTrack ?? null,
    review_kind: input.review_kind ?? input.reviewKind ?? null,
    material_id: materialIdForInput(input),
    materials: Object.freeze(materials.map(Object.freeze)),
    ...evidence,
  });
}

export function serializeProviderInput(input) {
  const packet = input?.packet;
  if (packet?.schema_version !== "wh-review-simple-packet.v1" || !Array.isArray(packet.materials) || !/^[a-f0-9]{64}$/.test(packet.material_id ?? "")) throw new TypeError("provider packet is invalid");
  const packetEvidence = authenticatedEvidenceFields(packet);
  if (packetEvidence.authenticated_evidence_sha256 !== undefined
      && packet.authenticated_evidence_sha256 !== packetEvidence.authenticated_evidence_sha256) {
    throw new TypeError("provider packet authenticated evidence hash is invalid");
  }
  const value = {
    schema_version: "wh-review-provider-input.v1",
    packet,
    host_provider: input.hostProvider ?? input.host_provider,
    providers: input.providers,
    provider_identities: input.providerIdentities ?? input.provider_identities ?? null,
    review_mode: input.reviewMode ?? input.review_mode,
    prompt: input.prompt ?? RESULT_PROMPT,
    subject_binding: input.subjectBinding ?? input.subject_binding ?? null,
    review_policy: input.reviewPolicy ?? input.review_policy ?? null,
  };
  if (typeof value.host_provider !== "string" || !Array.isArray(value.providers) || value.providers.length === 0 || typeof value.review_mode !== "string" || typeof value.prompt !== "string") throw new TypeError("provider input is invalid");
  return Buffer.from(`${JSON.stringify(value)}\n`, "utf8");
}

export function rehydrateProviderInput(bytes, attachmentRoot) {
  let value;
  try { value = JSON.parse(Buffer.isBuffer(bytes) ? bytes.toString("utf8") : String(bytes)); }
  catch { throw new TypeError("provider input is invalid"); }
  if (value?.schema_version !== "wh-review-provider-input.v1" || value.packet?.schema_version !== "wh-review-simple-packet.v1" || !Array.isArray(value.packet.materials)) throw new TypeError("provider input is invalid");
  const materials = {};
  for (const entry of value.packet.materials) {
    if (typeof entry?.key !== "string" || !new Set(["bytes", "text", "json"]).has(entry.value_kind) || typeof entry.content_base64 !== "string" || !/^[a-f0-9]{64}$/.test(entry.sha256 ?? "") || Object.hasOwn(materials, entry.key)) throw new TypeError("provider input material is invalid");
    const content = Buffer.from(entry.content_base64, "base64");
    if (hash(content) !== entry.sha256) throw new TypeError("provider input material hash is invalid");
    if (entry.value_kind === "json") {
      try { materials[entry.key] = JSON.parse(content.toString("utf8")); }
      catch { throw new TypeError("provider input JSON material is invalid"); }
    } else materials[entry.key] = entry.value_kind === "text" ? content.toString("utf8") : content;
  }
  const rebuilt = createSimpleReviewPacket({
    stage: value.packet.stage,
    review_track: value.packet.review_track,
    review_kind: value.packet.review_kind,
    materials,
    ...(value.packet.authenticated_evidence === undefined ? {} : { authenticated_evidence: value.packet.authenticated_evidence }),
  });
  if (rebuilt.material_id !== value.packet.material_id) throw new TypeError("provider input material identity is invalid");
  if (rebuilt.authenticated_evidence_sha256 !== value.packet.authenticated_evidence_sha256) throw new TypeError("provider input authenticated evidence identity is invalid");
  const bundle = buildBundle(attachmentRoot, {
    stage: value.packet.stage,
    review_track: value.packet.review_track,
    review_kind: value.packet.review_kind,
    materials,
    ...(value.packet.authenticated_evidence === undefined ? {} : { authenticated_evidence: value.packet.authenticated_evidence }),
  });
  if (bundle.materialId !== value.packet.material_id) { bundle.dispose(); throw new TypeError("provider input bundle identity is invalid"); }
  return Object.freeze({ ...value, materials: bundle });
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
      strictProtocol: true,
    });
  } finally { restored.materials.dispose(); }
}

function pairFields(pair) {
  return pair ? { pair_id: pair.pair_id, role: pair.role } : {};
}

function unavailableResult(input, error, pair = null, extra = {}) {
  return {
    status: "unavailable",
    stage: input.stage,
    ...reviewSubjectFields(input),
    review_track: input.review_track ?? input.reviewTrack ?? null,
    review_kind: input.review_kind ?? input.reviewKind ?? null,
    material_id: materialIdForInput(input),
    ...authenticatedEvidenceFields(input),
    ...pairFields(pair),
    runtime_id: null,
    outcome: "unavailable",
    minimum_heterologous: 1,
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

function blockedPreflight(input, code, message, diagnostic, pair = null) {
  const error = { code, message: redactHostPaths(message), diagnostic };
  return unavailableResult(input, error, pair, {
    dispatch_state: "blocked_before_dispatch",
    provider_results: [],
    findings: [],
  });
}

function staticReviewRule(input) {
  const reviewKind = input.review_kind ?? input.reviewKind ?? null;
  const stage = reviewKind ?? input.stage;
  const track = reviewKind === null ? (input.review_track ?? input.reviewTrack ?? null) : null;
  const scope = reviewKind === null ? (input.review_scope ?? input.reviewScope ?? null) : null;
  return reviewRuleFor(stage, track, scope);
}

function shouldRunMaterialPreflight(input, rule) {
  if (input.preflight === true) return true;
  // Integration review requests have a closed material contract. Run the
  // contract check even when a caller supplies only unknown keys so those
  // invocations cannot bypass required/forbidden material validation.
  if (input.review_scope === "integration" || input.reviewScope === "integration") return true;
  const materials = input.materials;
  if (!materials || typeof materials !== "object" || Array.isArray(materials)) return false;
  const contractKeys = new Set([...(rule.required ?? []), ...(rule.optional ?? []), ...(rule.generated ?? []), ...(rule.forbidden ?? [])]);
  return Object.keys(materials).some((key) => contractKeys.has(key));
}

function runStaticPreflight(input, { route, providerSelection }, pair = null) {
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
  if (!shouldRunMaterialPreflight(input, rule)) return null;
  const materials = input.materials;
  const generated = new Set(rule.generated ?? []);
  const required = (rule.required ?? []).filter((key) => !generated.has(key));
  const missing = required.find((key) => !Object.hasOwn(materials, key) || !preflightMaterialPresent(materials[key]));
  if (missing) {
    return blockedPreflight(input, "MATERIAL_INCOMPLETE", `required material ${missing} is missing or empty`, preflightDiagnostic({
      field: missing,
      expected: "non-empty caller material",
      actual: Object.hasOwn(materials, missing) ? "empty" : "missing",
      nextAction: "supply current material and retry",
    }), pair);
  }
  // Generated fields are derived by the runner and may still be present in
  // compatibility callers; they are excluded from the required check but do
  // not make an otherwise valid request invalid. Only explicit forbidden
  // fields are rejected here.
  const forbidden = (rule.forbidden ?? []).find((key) => Object.hasOwn(materials, key));
  if (forbidden) {
    return blockedPreflight(input, "MATERIAL_FORBIDDEN", `material ${forbidden} is generated or forbidden for this review`, preflightDiagnostic({
      field: forbidden,
      expected: "caller-owned material only",
      actual: "present",
      nextAction: "remove the generated or forbidden material and retry",
    }), pair);
  }
  return null;
}

function evidenceAnchorValidity(bundleRoot, findings) {
  return findings.map((finding) => {
    if (!finding || typeof finding.path !== "string" || finding.path.startsWith("/")
        || finding.path.includes("\\") || finding.path.split("/").includes("..")) return false;
    const target = join(bundleRoot, ...finding.path.split("/"));
    if (!existsSync(target)) return false;
    if (finding.line === undefined || finding.line === null) return true;
    if (!Number.isSafeInteger(finding.line) || finding.line < 1) return false;
    const content = readFileSync(target, "utf8");
    const lineCount = content.length === 0 ? 0 : content.split(/\r?\n/).length;
    return finding.line <= lineCount;
  });
}

function publicProviderResult(item, evidenceAnchors = undefined, pair = null) {
  return {
    provider: item.provider,
    status: item.status,
    identity: item.identity,
    ...pairFields(pair),
    session_id: item.session_id ?? null,
    // Provider adapters are untrusted transport boundaries. Keep the
    // provider's machine-readable code, but never expose raw adapter errors or
    // host paths in the public review result.
    error: item.error === null || item.error === undefined ? null : normalizeProviderError(item.error, { preserveCode: true }),
    timing: item.timing,
    usage: item.usage,
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

async function runSimpleReviewSingle(input, dependencies = {}, pair = null) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new TypeError("review request must be an object");
  if (typeof input.stage !== "string" || input.stage.trim() === "") throw new TypeError("stage is required");
  const hostProvider = input.host_provider ?? input.hostProvider;
  if (typeof hostProvider !== "string" || hostProvider.trim() === "") throw new TypeError("host_provider is required");
  if (!input.materials || typeof input.materials !== "object" || Array.isArray(input.materials) || Object.keys(input.materials).length === 0) throw new TypeError("materials are required");
  let reviewInput = input;
  if (input.stage === "verify-code") {
    try {
      const projection = compactVerifyCodeMaterials(input.materials);
      reviewInput = projection.diff === null ? input : { ...input, materials: projection.materials };
    } catch (error) {
      return unavailableResult(input, normalizeProviderError(error), pair);
    }
  }

  const reviewTrack = input.review_track ?? input.reviewTrack ?? null;
  const reviewKind = input.review_kind ?? input.reviewKind ?? null;
  const loadConfig = dependencies.loadConfig ?? loadTrustedThirdReviewConfig;
  const resolveRoute = dependencies.resolveRoute ?? resolveTrustedReviewRoute;
  const selectProviders = dependencies.selectProviders ?? selectTrustedReviewProviderSelection;
  let trusted;
  let route;
  try {
    trusted = loadConfig({ requestedStage: input.stage, requestedTrack: reviewTrack, requestedReviewKind: reviewKind });
    route = resolveRoute(trusted.whReview, input.stage, reviewTrack, reviewKind);
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
  const preflight = runStaticPreflight(input, { route, providerSelection }, pair);
  if (preflight) return preflight;
  const selectedProviders = providerSelection.providers;
  const selectedIdentities = providerSelection.provider_identities ?? null;
  const selectedSet = new Set(selectedProviders);
  let bundle;
  try {
    bundle = buildBundle(trusted.attachmentRoot, reviewInput);
  } catch (error) {
    return unavailableResult(reviewInput, normalizeProviderError(error), pair, {
      provider_selection: {
        providers: [...selectedProviders],
        provider_identities: selectedIdentities,
      },
    });
  }
  try {
    const client = dependencies.client ?? new ReviewProviderClient({ command: trusted.command, config: trusted.config });
    let group;
    try {
      group = await client.runGroup({
        hostProvider: input.host_provider ?? input.hostProvider,
        providers: selectedProviders,
        materials: bundle,
        prompt: promptForPair(pair),
        reviewMode: route.mode,
        strictProtocol: false,
        ...pairFields(pair),
      });
    } catch (error) {
      return unavailableResult(input, normalizeProviderError(error), pair, {
        minimum_heterologous: route.minimum_heterologous,
        provider_selection: {
          providers: [...selectedProviders],
          provider_identities: selectedIdentities,
        },
      });
    }
    const findings = [];
    const semanticProviders = new Set();
    const receivedProviders = Array.isArray(group?.providers) ? group.providers : [];
    const seenProviders = new Set();
    const providers = receivedProviders.map((rawItem) => {
      const item = rawItem && typeof rawItem === "object"
        ? { ...rawItem, provider: rawItem.provider ?? rawItem.identity?.provider }
        : rawItem;
      const provider = item?.provider;
      const expectedIdentity = selectedIdentities && typeof selectedIdentities === "object"
        ? selectedIdentities[provider] : null;
      const identity = item?.identity;
      const identityValid = typeof provider === "string" && selectedSet.has(provider)
        && !seenProviders.has(provider)
        && identity && typeof identity === "object" && identity.provider === provider
        && (identity.adapter === undefined || identity.adapter === providerAdapter(provider))
        && (!selectedIdentities || (expectedIdentity && typeof expectedIdentity === "object"
          && typeof expectedIdentity.source_id === "string" && expectedIdentity.source_id.trim() !== ""
          && typeof expectedIdentity.config_id === "string" && expectedIdentity.config_id.trim() !== ""
          && identity.config_id === expectedIdentity.config_id
          && identity.source_id === expectedIdentity.source_id));
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
        try {
          const parsed = parseReviewerOutput(item.output, { requireEvidence: true });
          const evidenceAnchors = evidenceAnchorValidity(bundle.bundleRoot, parsed.findings);
          if (!evidenceAnchors.every(Boolean)) {
            return {
              ...publicProviderResult(item, evidenceAnchors, pair),
              status: "failed",
              error: { code: "EVIDENCE_ANCHOR_INVALID", message: "provider finding evidence does not anchor to submitted material" },
            };
          }
          semanticProviders.add(item.provider);
          for (const finding of parsed.findings) findings.push({ ...finding, provider: item.provider });
          return publicProviderResult(item, evidenceAnchors, pair);
        } catch {
          return { ...publicProviderResult(item, undefined, pair), status: "failed", error: { code: "OUTPUT_INVALID", message: "provider output is not valid findings JSON" } };
        }
      }
      return publicProviderResult(item, undefined, pair);
    });
    // A broker may finish a partial group without emitting a member for every
    // selected provider. Make that omission an explicit failed provider fact;
    // never let a clean-looking result hide an unobserved selected route.
    for (const provider of selectedProviders) {
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
        minimum_heterologous: route.minimum_heterologous,
        runtime_id: group.runtimeId,
        outcome: group.outcome,
        provider_selection: {
          providers: [...selectedProviders],
          provider_identities: selectedIdentities,
        },
      });
    }
    const minimum = Number.isSafeInteger(route.minimum_heterologous) && route.minimum_heterologous >= 1
      ? route.minimum_heterologous : 1;
    const available = semanticProviders.size >= minimum;
    const observedMaterialId = group?.material_id ?? group?.materialId ?? bundle.materialId;
    return {
      status: available ? "available" : "unavailable",
      stage: input.stage,
      ...reviewSubjectFields(input),
      review_track: reviewTrack,
      review_kind: reviewKind,
      material_id: observedMaterialId,
      ...pairFields(pair),
      runtime_id: group.runtimeId,
      outcome: group.outcome,
      ...(group.transport_timeout ? { transport_timeout: group.transport_timeout } : {}),
      minimum_heterologous: minimum,
      provider_selection: {
        providers: [...selectedProviders],
        provider_identities: selectedIdentities,
      },
      provider_results: providers,
      findings,
      ...(available ? {} : { error: unavailableReason(providers) }),
    };
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
  return {
    status,
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

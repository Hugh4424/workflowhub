import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";

import { ReviewProviderClient } from "./review-provider-client.mjs";
import { parseReviewerOutput } from "./review-output.mjs";
import {
  loadTrustedThirdReviewConfig,
  resolveTrustedReviewRoute,
  selectTrustedReviewProviderSelection,
} from "./third-review-host-config.mjs";

const RESULT_SAMPLE = `Example of a complete finding:\n{\n  "findings": [{\n    "severity": "major",\n    "path": "materials/02-approved_spec.md",\n    "line": 42,\n    "issue": "FR-REV-002 requires a constitution clause citation, but the evidence field only contains the decision id; acceptance cannot verify clause-level traceability.",\n    "recommendation": "Add the constitution clause (e.g., F9, F4) to the 'evidence' field of FR-REV-002.",\n    "root_cause": "New FR was copied without the existing template's evidence field.",\n    "evidence_kind": "direct",\n    "evidence": "FR-REV-002 evidence field reads 'D-007' but lacks any '宪法' clause reference, unlike other FRs which cite specific clauses."\n  }]\n}\nExample of an empty result (no findings):\n{\n  "findings": []\n}\nOutput rules:\n- Emit exactly one JSON object shaped like the example above.\n- severity must be one of: blocking, major, minor.\n- evidence_kind must be one of: direct, machine, inferred.\n- path must be the bundle-relative path shown in the manifest.\n- line must be an integer line number in that file, or omitted.\n- Do not output a verdict, summary, pass/fail, checklist, or a second JSON object.\n- Do not wrap the JSON in markdown code fences.\n`;

const RESULT_PROMPT = `Read bundle/review-instructions.md and bundle/manifest.json, then every submitted material listed in the manifest. Review only those bytes. Return exactly one JSON object shaped as shown in the sample below.\n\n${RESULT_SAMPLE}`;

const FOCUS = Object.freeze({
  "make-decision/direction": "Challenge whether the proposed direction solves the stated problem with the smallest useful scope. Check assumptions, constraints, failure consequences, and rejected alternatives.",
  "make-decision/detail": "Check scope, complete user flow, pages, data states, success and failure boundaries, acceptance, non-goals, deferred work, risks, and unnecessary complexity.",
  "build-spec": "Check requirement coverage, user journey, states, failure recovery, testable acceptance, and scope.",
  "build-plan": "Check dependencies, implementation order, real consumers, verification, recovery, and unnecessary work.",
  "build-code": "Check the submitted implementation material for correctness, real consumers, failure paths, tests, and unnecessary code.",
  "verify-code": "Check the submitted implementation and test material for correctness, lifecycle and security risks, failure boundaries, and test strength.",
  "mini_task.design": "Check that the mini-task remains small, complete, testable, and reversible.",
  "mini_task.implementation": "Check implementation correctness, user result, tests, and scope boundaries.",
});

function hash(bytes) { return createHash("sha256").update(bytes).digest("hex"); }

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
  write("review-instructions.md", Buffer.from(`${instructions(input)}\n`, "utf8"));
  Object.entries(input.materials ?? {}).forEach(([key, value], index) => write(safeName(key, index, value), materialBytes(value)));
  const manifest = Buffer.from(`${JSON.stringify({ version: 1, surface: surface(input), files: entries }, null, 2)}\n`, "utf8");
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
  const entries = [{ path: "review-instructions.md", bytes: Buffer.byteLength(`${instructions(input)}\n`, "utf8") }];
  entries[0].sha256 = hash(Buffer.from(`${instructions(input)}\n`, "utf8"));
  Object.entries(input.materials ?? {}).forEach(([key, value], index) => {
    const bytes = materialBytes(value);
    entries.push({ path: safeName(key, index, value), bytes: bytes.length, sha256: hash(bytes) });
  });
  const manifest = Buffer.from(`${JSON.stringify({ version: 1, surface: surface(input), files: entries }, null, 2)}\n`, "utf8");
  entries.push({ path: "manifest.json", bytes: manifest.length, sha256: hash(manifest) });
  return hash(Buffer.from(JSON.stringify(entries), "utf8"));
}

export function createSimpleReviewPacket(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new TypeError("review packet input must be an object");
  if (typeof input.stage !== "string" || input.stage.trim() === "") throw new TypeError("stage is required");
  if (!input.materials || typeof input.materials !== "object" || Array.isArray(input.materials) || Object.keys(input.materials).length === 0) throw new TypeError("materials are required");
  const materials = Object.entries(input.materials).map(([key, value]) => {
    const bytes = materialBytes(value);
    return { key, value_kind: Buffer.isBuffer(value) ? "bytes" : typeof value === "string" ? "text" : "json", content_base64: bytes.toString("base64"), sha256: hash(bytes) };
  });
  return Object.freeze({
    schema_version: "wh-review-simple-packet.v1",
    stage: input.stage,
    review_track: input.review_track ?? input.reviewTrack ?? null,
    review_kind: input.review_kind ?? input.reviewKind ?? null,
    material_id: materialIdForInput(input),
    materials: Object.freeze(materials.map(Object.freeze)),
  });
}

export function serializeProviderInput(input) {
  const packet = input?.packet;
  if (packet?.schema_version !== "wh-review-simple-packet.v1" || !Array.isArray(packet.materials) || !/^[a-f0-9]{64}$/.test(packet.material_id ?? "")) throw new TypeError("provider packet is invalid");
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
  const rebuilt = createSimpleReviewPacket({ stage: value.packet.stage, review_track: value.packet.review_track, review_kind: value.packet.review_kind, materials });
  if (rebuilt.material_id !== value.packet.material_id) throw new TypeError("provider input material identity is invalid");
  const bundle = buildBundle(attachmentRoot, { stage: value.packet.stage, review_track: value.packet.review_track, review_kind: value.packet.review_kind, materials });
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

function unavailableResult(input, error) {
  return {
    status: "unavailable",
    stage: input.stage,
    review_track: input.review_track ?? input.reviewTrack ?? null,
    review_kind: input.review_kind ?? input.reviewKind ?? null,
    material_id: materialIdForInput(input),
    runtime_id: null,
    outcome: "unavailable",
    minimum_heterologous: 1,
    provider_results: [],
    findings: [],
    error,
  };
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

function publicProviderResult(item, evidenceAnchors = undefined) {
  return {
    provider: item.provider,
    status: item.status,
    identity: item.identity,
    session_id: item.session_id ?? null,
    error: item.error,
    timing: item.timing,
    usage: item.usage,
    ...(evidenceAnchors === undefined ? {} : { evidence_anchor_valid: evidenceAnchors }),
  };
}

export async function runSimpleReview(input, dependencies = {}) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new TypeError("review request must be an object");
  if (typeof input.stage !== "string" || input.stage.trim() === "") throw new TypeError("stage is required");
  if (typeof (input.host_provider ?? input.hostProvider) !== "string") throw new TypeError("host_provider is required");
  if (!input.materials || typeof input.materials !== "object" || Array.isArray(input.materials) || Object.keys(input.materials).length === 0) throw new TypeError("materials are required");

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
    return unavailableResult(input, { code: "ROUTE_UNAVAILABLE", message: String(error?.message ?? error) });
  }
  if (!route) return unavailableResult(input, { code: "ROUTE_UNAVAILABLE", message: "no heterologous review route is configured" });
  const selection = selectProviders(trusted.config, input.host_provider ?? input.hostProvider, route);
  const bundle = buildBundle(trusted.attachmentRoot, input);
  try {
    const client = dependencies.client ?? new ReviewProviderClient({ command: trusted.command, config: trusted.config });
    const group = await client.runGroup({
      hostProvider: input.host_provider ?? input.hostProvider,
      providers: selection.providers,
      materials: bundle,
      prompt: RESULT_PROMPT,
      reviewMode: route.mode,
      strictProtocol: false,
    });
    const findings = [];
    const semanticProviders = new Set();
    const providers = group.providers.map((item) => {
      if (item.status === "completed" && typeof item.output === "string" && item.error === null) {
        try {
          const parsed = parseReviewerOutput(item.output, { requireEvidence: true });
          const evidenceAnchors = evidenceAnchorValidity(bundle.bundleRoot, parsed.findings);
          semanticProviders.add(item.provider);
          for (const finding of parsed.findings) findings.push({ ...finding, provider: item.provider });
          return publicProviderResult(item, evidenceAnchors);
        } catch {
          return { ...publicProviderResult(item), status: "failed", error: { code: "OUTPUT_INVALID", message: "provider output is not valid findings JSON" } };
        }
      }
      return publicProviderResult(item);
    });
    const minimum = Number.isSafeInteger(route.minimum_heterologous) && route.minimum_heterologous >= 1
      ? route.minimum_heterologous : 1;
    const available = semanticProviders.size >= minimum;
    return {
      status: available ? "available" : "unavailable",
      stage: input.stage,
      review_track: reviewTrack,
      review_kind: reviewKind,
      material_id: bundle.materialId,
      runtime_id: group.runtimeId,
      outcome: group.outcome,
      minimum_heterologous: minimum,
      provider_results: providers,
      findings,
    };
  } finally {
    bundle.dispose();
  }
}

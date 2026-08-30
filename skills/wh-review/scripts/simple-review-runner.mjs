import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";

import { ReviewProviderClient } from "./review-provider-client.mjs";
import { parseReviewerOutput } from "./review-output.mjs";
import {
  loadTrustedThirdReviewConfig,
  resolveTrustedReviewRoute,
  selectTrustedReviewProviderSelection,
} from "./third-review-host-config.mjs";

const RESULT_SAMPLE = `Example of a complete finding:\n{\n  "findings": [{\n    "severity": "major",\n    "path": "materials/02-approved_spec.md",\n    "line": 42,\n    "issue": "FR-REV-002 requires a constitution clause citation, but the evidence field only contains the decision id; acceptance cannot verify clause-level traceability.",\n    "recommendation": "Add the constitution clause (e.g., F9, F4) to the 'evidence' field of FR-REV-002.",\n    "root_cause": "New FR was copied without the existing template's evidence field.",\n    "evidence_kind": "direct",\n    "evidence": "FR-REV-002 evidence field reads 'D-007' but lacks any '宪法' clause reference, unlike other FRs which cite specific clauses."\n  }]\n}\nExample of an empty result (no findings):\n{\n  "findings": []\n}\nOutput rules:\n- Emit exactly one JSON object shaped like the example above.\n- severity must be one of: blocking, major, minor.\n- evidence_kind must be one of: direct, machine, inferred.\n- path must be the bundle-relative path shown in the manifest.\n- line must be an integer line number in that file, or omitted.\n- Do not output a verdict, summary, pass/fail, checklist, or a second JSON object.\n- Do not wrap the JSON in markdown code fences.\n`;

const RESULT_PROMPT = `Read bundle/review-instructions.md and bundle/manifest.json, then every submitted material listed in the manifest. Review only those bytes. Return exactly one JSON object shaped as shown in the sample below.\\n\\n${RESULT_SAMPLE}`;

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
  const materialId = hash(Buffer.from(JSON.stringify(entries), "utf8"));
  return {
    bundleRoot,
    attachmentRoot,
    sourcePrefix: relative(attachmentRoot, bundleRoot).split(sep).join("/"),
    materialId,
    deliveryManifest: entries,
    dispose() { rmSync(bundleRoot, { recursive: true, force: true }); },
  };
}

function publicProviderResult(item) {
  return {
    provider: item.provider,
    status: item.status,
    identity: item.identity,
    error: item.error,
    timing: item.timing,
    usage: item.usage,
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
    return { status: "unavailable", stage: input.stage, review_track: reviewTrack, error: { code: "ROUTE_UNAVAILABLE", message: String(error?.message ?? error) } };
  }
  if (!route) return { status: "unavailable", stage: input.stage, review_track: reviewTrack, error: { code: "ROUTE_UNAVAILABLE", message: "no heterologous review route is configured" } };
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
    const providers = group.providers.map((item) => {
      if (item.status === "completed" && typeof item.output === "string" && item.error === null) {
        try {
          for (const finding of parseReviewerOutput(item.output, { requireEvidence: true }).findings) findings.push({ ...finding, provider: item.provider });
        } catch {
          return { ...publicProviderResult(item), status: "failed", error: { code: "OUTPUT_INVALID", message: "provider output is not valid findings JSON" } };
        }
      }
      return publicProviderResult(item);
    });
    const available = providers.length > 0 && providers.every((item) => item.status === "completed");
    return {
      status: available ? "available" : "unavailable",
      stage: input.stage,
      review_track: reviewTrack,
      review_kind: reviewKind,
      material_id: bundle.materialId,
      runtime_id: group.runtimeId,
      outcome: group.outcome,
      provider_results: providers,
      findings,
    };
  } finally {
    bundle.dispose();
  }
}

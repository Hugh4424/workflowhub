import { FORMAL_DEVELOPMENT_STAGE_SET } from "../stage/stage-registry.mjs";
import matrix from "./stage-materials.json" with { type: "json" };

const FORMAL_STAGES = FORMAL_DEVELOPMENT_STAGE_SET;
const REVIEW_KINDS = new Set(["build_prd"]);
const REVIEW_TRACKS = new Set(["direction", "detail"]);
export const TERMINAL_REVIEW_SCOPE = "terminal";
const REVIEW_SCOPES = new Set(["phase", TERMINAL_REVIEW_SCOPE]);

export function requiredReviewMode(input) {
  const identity = reviewIdentityFromInput(input);
  return identity.stage === "verify-code" || identity.reviewScope === TERMINAL_REVIEW_SCOPE ? "single_round" : "full_only";
}

function coalesceReviewField(input, snake, camel) {
  const snakeValue = input?.[snake];
  const camelValue = input?.[camel];
  if (snakeValue !== undefined && camelValue !== undefined && snakeValue !== camelValue) {
    throw new TypeError(`review identity aliases ${snake}/${camel} disagree`);
  }
  return snakeValue ?? camelValue ?? null;
}

/**
 * Validate the identity boundary shared by packet, material, route, and
 * projection helpers. build_prd is a non-stage surface: it has one sentinel
 * stage and no formal track or scope.
 */
export function assertReviewIdentity(input = {}) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new TypeError("review identity input must be an object");
  const stage = input.stage;
  const reviewTrack = coalesceReviewField(input, "review_track", "reviewTrack");
  const reviewScope = coalesceReviewField(input, "review_scope", "reviewScope");
  const reviewKind = coalesceReviewField(input, "review_kind", "reviewKind");
  if (typeof stage !== "string" || stage.trim() === "") throw new TypeError("review identity stage is required");
  if (reviewKind !== null && reviewKind !== undefined && !REVIEW_KINDS.has(reviewKind)) throw new TypeError(`unknown review_kind ${reviewKind}`);
  if (stage === "build-prd") {
    if (reviewKind !== "build_prd") throw new TypeError("build-prd stage requires review_kind build_prd");
    if (reviewTrack !== null && reviewTrack !== undefined) throw new TypeError("build-prd review kind does not use review_track");
    if (reviewScope !== null && reviewScope !== undefined) throw new TypeError("build-prd review kind does not use review_scope");
    return Object.freeze({ stage, reviewTrack: null, reviewScope: null, reviewKind });
  }
  if (!FORMAL_STAGES.has(stage)) throw new TypeError(`unknown review stage ${stage}`);
  if (reviewKind === "build_prd") throw new TypeError("build_prd review_kind requires stage build-prd");
  if (stage === "make-decision") {
    if (!REVIEW_TRACKS.has(reviewTrack)) throw new TypeError("make-decision requires direction or detail review_track");
  } else if (reviewTrack !== null && reviewTrack !== undefined) {
    throw new TypeError(`${stage} does not use a review track`);
  }
  if (stage === "build-code") {
    if (reviewScope !== null && reviewScope !== undefined && !REVIEW_SCOPES.has(reviewScope)) throw new TypeError("build-code requires phase or terminal review_scope; integration review is retired");
  } else if (reviewScope !== null && reviewScope !== undefined) {
    throw new TypeError(`${stage} does not use review_scope`);
  }
  return Object.freeze({ stage, reviewTrack: reviewTrack ?? null, reviewScope: reviewScope ?? null, reviewKind: null });
}

export function reviewIdentityFromInput(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new TypeError("review identity input must be an object");
  return assertReviewIdentity({
    stage: input.stage,
    reviewTrack: coalesceReviewField(input, "review_track", "reviewTrack"),
    reviewScope: coalesceReviewField(input, "review_scope", "reviewScope"),
    reviewKind: coalesceReviewField(input, "review_kind", "reviewKind"),
  });
}

export function reviewRuleFor(stage, track = null, reviewScope = null) {
  if (stage === "build-prd") {
    if (track !== null && track !== undefined) throw new Error("MATERIAL_INCOMPLETE: build-prd review kind does not use review_track");
    if (reviewScope !== null && reviewScope !== undefined) throw new Error("MATERIAL_INCOMPLETE: build-prd review kind does not use review_scope");
    const rule = matrix.non_stage?.build_prd;
    if (!rule) throw new Error("MATERIAL_INCOMPLETE: build-prd review surface is unavailable");
    return rule;
  }
  const stageRule = matrix.stages[stage];
  if (!stageRule) throw new Error(`MATERIAL_INCOMPLETE: unknown stage ${stage}`);
  if (stage === "make-decision") {
    const rule = stageRule.tracks?.[track];
    if (!rule) throw new Error("MATERIAL_INCOMPLETE: make-decision requires direction or detail track");
    return rule;
  }
  if (stage === "build-code") {
    const scope = reviewScope ?? "phase";
    if (!REVIEW_SCOPES.has(scope)) throw new Error("MATERIAL_INCOMPLETE: ordinary integration review is retired; use the current phase review");
    const rule = stageRule.profiles?.[scope];
    if (!rule) throw new Error(`MATERIAL_INCOMPLETE: build-code has no ${scope} material profile`);
    return rule;
  }
  if (reviewScope !== null) throw new Error(`MATERIAL_INCOMPLETE: ${stage} does not use review_scope`);
  if (track !== null && track !== undefined) throw new Error(`MATERIAL_INCOMPLETE: ${stage} does not use a review track`);
  return stageRule;
}

// Human record labels only; this does not extend the persisted review schema.
export const REVIEW_EXECUTORS = Object.freeze({ independent: "独立子代理", external: "外部 OCR" });
const TIER_RISK_FACES = ["permissionsSecurity", "dataMigrationIrreversible", "sharedStateConcurrency", "publicContractCriticalPath", "realExternalDependency"];
const TIER_DIMENSIONS = ["paths", "impact", "size"];

function tierObject(value, name) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${name} must contain named facts, not a score`);
}
function tierText(value) { return typeof value === "string" && value.trim().length > 0; }
function tierDimensionReadable(value, dimension) {
  return value?.status === "read" && tierText(value.raw)
    && !(dimension === "size" && value.raw.split("\n").some(line => /^-\t|^\d+\t-\t/.test(line)));
}

/** Select the one Phase reviewer from explicit facts; never measure risk by counts. */
export function reviewTierFor(readings) {
  tierObject(readings, "review tier input");
  const identity = assertReviewIdentity(readings.identity);
  for (const key of Object.keys(readings)) {
    if (!['identity', 'risks', 'scope', 'readings'].includes(key)) throw new TypeError(`unknown review tier fact ${key}; scores and thresholds are not accepted`);
  }
  if (readings.risks !== undefined) {
    tierObject(readings.risks, "risk faces");
    for (const [key, value] of Object.entries(readings.risks)) {
      if (!TIER_RISK_FACES.includes(key) || !["none", "present", "undetermined"].includes(value)) throw new TypeError(`invalid named risk fact ${key}`);
    }
  }
  if (readings.scope !== undefined) {
    tierObject(readings.scope, "review scope facts");
    for (const [key, value] of Object.entries(readings.scope)) {
      if (!["singleModule", "knownDirectConsumers"].includes(key) || typeof value !== "boolean") throw new TypeError(`invalid scope fact ${key}`);
    }
  }
  if (readings.readings !== undefined) {
    tierObject(readings.readings, "three-dimensional readings");
    for (const [key, value] of Object.entries(readings.readings)) {
      if (!TIER_DIMENSIONS.includes(key)) throw new TypeError(`unknown reading dimension ${key}`);
      tierObject(value, `${key} reading`);
      for (const [field, fact] of Object.entries(value)) {
        if (!["status", "raw", "reason"].includes(field)) throw new TypeError(`${key} reading accepts named evidence only, not ${field}`);
        if (typeof fact !== "string") throw new TypeError(`${key}.${field} must be text, not a score`);
      }
      if (typeof value.status !== "string") throw new TypeError(`${key} status must be a named fact`);
    }
  }
  // Terminal full-delivery review always uses external OCR, even for a low-risk diff.
  if (identity.stage !== "build-code" || identity.reviewScope === TERMINAL_REVIEW_SCOPE) return REVIEW_EXECUTORS.external;
  const lowRisk = TIER_RISK_FACES.every(face => readings.risks?.[face] === "none")
    && readings.scope?.singleModule === true && readings.scope?.knownDirectConsumers === true
    && TIER_DIMENSIONS.every(dimension => tierDimensionReadable(readings.readings?.[dimension], dimension));
  return lowRisk ? REVIEW_EXECUTORS.independent : REVIEW_EXECUTORS.external;
}

/** Validate an ordinary review narrative; persistence remains with its existing owner. */
export function assertReviewTierRecord(record) {
  tierObject(record, "review tier record");
  const selected = reviewTierFor(record.input);
  if (record.executor !== selected) throw new TypeError("review executor disagrees with named risk facts");
  tierObject(record.source, "review source");
  for (const dimension of TIER_DIMENSIONS) {
    const reading = record.input.readings?.[dimension];
    if (!reading || !tierText(reading.raw) && !tierText(reading.reason)) throw new TypeError(`${dimension} reading requires raw evidence or a concrete reason`);
    if (!tierDimensionReadable(reading, dimension) && !tierText(reading.reason)) throw new TypeError(`${dimension} unavailable reading requires a reason`);
  }
  if (selected === REVIEW_EXECUTORS.independent) {
    if (!tierText(record.source.dispatch_identity) || record.source.context_isolation !== "none") throw new TypeError("independent review requires dispatch identity and isolated context");
    if (record.identity === "ocr" || record.source.identity === "ocr" || record.source.origin === "external" || record.source.route !== undefined || record.source.provider_refs !== undefined || record.provider_results !== undefined) throw new TypeError("independent review must not claim OCR identity or provider results");
  } else {
    if (!tierText(record.source.route)) throw new TypeError("external OCR requires its configured route");
    if (record.status === "unavailable") {
      if (!tierText(record.detection_output_ref) || !tierText(record.failure_ref) || !tierText(record.reason)) throw new TypeError("unavailable OCR requires original detection, failure and concrete reason");
      if (record.provider_results !== undefined && (!Array.isArray(record.provider_results) || record.provider_results.length)) throw new TypeError("undispatched OCR must not fabricate provider results");
    } else {
      if (!Array.isArray(record.source.provider_refs) || !record.source.provider_refs.length || !record.source.provider_refs.every(tierText)) throw new TypeError("external OCR requires provider references");
      if (!Array.isArray(record.provider_results) || !record.provider_results.length || record.provider_results.some(result => !tierText(result?.provider) || !["completed", "failed", "cancelled"].includes(result?.status))) throw new TypeError("external OCR requires actual provider terminal facts");
    }
  }
  return record;
}

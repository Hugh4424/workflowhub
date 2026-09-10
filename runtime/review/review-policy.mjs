import matrix from "./stage-materials.json" with { type: "json" };

const FORMAL_STAGES = new Set(["make-decision", "build-spec", "build-plan", "build-code", "verify-code"]);
const REVIEW_KINDS = new Set(["mini_task.design", "mini_task.implementation", "build_prd"]);
const REVIEW_TRACKS = new Set(["direction", "detail"]);
const REVIEW_SCOPES = new Set(["phase", "integration"]);

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
  if (reviewKind === "mini_task.design" || reviewKind === "mini_task.implementation") {
    if (stage !== "build-code") throw new TypeError(`${reviewKind} review kind requires stage build-code`);
    if (reviewTrack !== null && reviewTrack !== undefined) throw new TypeError(`${reviewKind} review kind does not use review_track`);
    if (reviewScope !== null && reviewScope !== undefined && !REVIEW_SCOPES.has(reviewScope)) throw new TypeError(`${reviewKind} review_scope is invalid`);
    return Object.freeze({ stage, reviewTrack: null, reviewScope: reviewScope ?? "phase", reviewKind });
  }
  if (stage === "make-decision") {
    if (!REVIEW_TRACKS.has(reviewTrack)) throw new TypeError("make-decision requires direction or detail review_track");
  } else if (reviewTrack !== null && reviewTrack !== undefined) {
    throw new TypeError(`${stage} does not use a review track`);
  }
  if (stage === "build-code") {
    if (reviewScope !== null && reviewScope !== undefined && !REVIEW_SCOPES.has(reviewScope)) throw new TypeError("build-code requires phase or integration review_scope");
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
  if (stage === "mini_task.design" || stage === "mini_task.implementation") {
    if (track !== null && track !== undefined) throw new Error("MATERIAL_INCOMPLETE: mini-task review kind does not use review_track");
    if (reviewScope !== null && reviewScope !== undefined) throw new Error("MATERIAL_INCOMPLETE: mini-task review kind does not use review_scope");
    const rule = matrix.mini_task?.[stage.split(".")[1]];
    if (!rule) throw new Error(`MATERIAL_INCOMPLETE: unknown mini-task review kind ${stage}`);
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
    if (!["phase", "integration"].includes(scope)) throw new Error("MATERIAL_INCOMPLETE: build-code requires phase or integration review_scope");
    const rule = stageRule.profiles?.[scope];
    if (!rule) throw new Error(`MATERIAL_INCOMPLETE: build-code has no ${scope} material profile`);
    return rule;
  }
  if (reviewScope !== null) throw new Error(`MATERIAL_INCOMPLETE: ${stage} does not use review_scope`);
  if (track !== null && track !== undefined) throw new Error(`MATERIAL_INCOMPLETE: ${stage} does not use a review track`);
  return stageRule;
}

export function minimumReviewersFor(stage, track = null, reviewScope = null) {
  return reviewRuleFor(stage, track, reviewScope).minimum_reviewers;
}

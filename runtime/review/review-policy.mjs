import matrix from "./stage-materials.json" with { type: "json" };

export function reviewRuleFor(stage, track = null, reviewScope = null) {
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

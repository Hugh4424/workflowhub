// One executable source for current stage identities; historical readers opt in explicitly.
export const STAGE = Object.freeze({
  MAKE_DECISION: 'make-decision',
  BUILD_PLAN: 'build-plan',
  BUILD_CODE: 'build-code',
  BUILD_PRD: 'build-prd',
});
export const FORMAL_DEVELOPMENT_STAGES = Object.freeze([
  STAGE.MAKE_DECISION, STAGE.BUILD_PLAN, STAGE.BUILD_CODE,
]);
export const WORKFLOW_STAGES = Object.freeze([...FORMAL_DEVELOPMENT_STAGES, STAGE.BUILD_PRD]);
// Consumers only query these Sets. They are not advertised as mutation-proof Set wrappers.
export const FORMAL_DEVELOPMENT_STAGE_SET = new Set(FORMAL_DEVELOPMENT_STAGES);
export const WORKFLOW_STAGE_SET = new Set(WORKFLOW_STAGES);
export const RETIRED_STAGE_BUILD_SPEC = 'build-spec';
// Known passive host-configuration identity; never part of a writable or callable stage set.
export const RETIRED_STAGE_VERIFY_CODE = 'verify-code';

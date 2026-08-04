
const STAGES = ["make-decision", "build-spec", "build-plan", "build-code", "verify-code"];
const DERIVED = new WeakSet();

export const STAGE_PREDICATES = Object.freeze({
  "make-decision": Object.freeze({
    decision_coverage: "acceptance_criterion", scope: "acceptance_criterion",
    non_goals: "acceptance_criterion", risks: "acceptance_criterion",
    research: "test", grill: "test", independent_review: "review",
    human_confirmation: "confirmation",
  }),
  "build-spec": Object.freeze({
    traceability: "acceptance_criterion", zero_major_ambiguities: "acceptance_criterion",
    independent_review: "review",
  }),
  "build-plan": Object.freeze({
    fr_coverage: "acceptance_criterion", ac_coverage: "acceptance_criterion",
    dependencies: "acceptance_criterion", deletion_proofs: "acceptance_criterion",
    executable_tasks: "acceptance_criterion", independent_review: "review",
    human_confirmation: "confirmation",
  }),
  "build-code": Object.freeze({
    tasks_complete: "acceptance_criterion", risk_tests_fresh: "test",
    acceptance_criteria: "acceptance_criterion", integration_review: "review",
  }),
  "verify-code": Object.freeze({
    full_tests_fresh: "test", same_build_integration_review: "review",
    independent_review: "review", acceptance_criteria: "acceptance_criterion",
    exceptions: "acceptance_criterion", human_confirmation: "confirmation",
  }),
});

export function deriveStageCompletion(stage, observations = []) {
  if (!STAGES.includes(stage)) throw new TypeError(`unsupported stage: ${stage}`);
  if (!Array.isArray(observations)) throw new TypeError("completion observations must be an array");
  const requirements = STAGE_PREDICATES[stage];
  const satisfied = new Map();
  for (const observation of observations) {
    const fact = observation?.fact?.value ?? observation?.fact;
    if (!fact || fact.stage !== stage || fact.status !== "passed"
        || observation.authenticated !== true || observation.freshness?.status !== "current") continue;
    if (requirements[fact.subject] === fact.kind) satisfied.set(fact.subject, observation);
  }
  const missing = Object.keys(requirements).filter((subject) => !satisfied.has(subject));
  const result = Object.freeze({
    stage,
    status: missing.length === 0 ? "completed" : "in_progress",
    predicates: Object.freeze(Object.fromEntries(Object.keys(requirements).map((subject) => [
      subject, Object.freeze({
        kind: requirements[subject],
        status: satisfied.has(subject) ? "satisfied" : "missing",
        fact_ref: satisfied.get(subject)?.fact?.ref ?? null,
      }),
    ]))),
    fact_refs: Object.freeze([...satisfied.values()].map((entry) => entry.fact.ref).sort()),
    missing: Object.freeze(missing),
  });
  DERIVED.add(result);
  return result;
}

// Stage progression is deliberately separate from quality completion.  A
// stage may have failed, stale, or unavailable quality facts and still move
// forward on the current four-material/task record.  The quality facts remain
// visible through deriveStageCompletion and never become a progression permit.
export function deriveStageProgress(stage, observations = [], materials = null) {
  if (!STAGES.includes(stage)) throw new TypeError(`unsupported stage: ${stage}`);
  if (!Array.isArray(observations)) throw new TypeError("progress observations must be an array");
  const requirements = STAGE_PREDICATES[stage];
  const materialNames = ["decision-log.md", "spec.md", "plan.md", "tasks.md"];
  const missingMaterials = materials === null
    ? materialNames
    : materialNames.filter((name) => typeof materials?.[name] !== "string" || materials[name].trim() === "");
  return Object.freeze({
    stage,
    status: missingMaterials.length === 0 ? "completed" : "in_progress",
    authority: "current-four-materials-and-plan-tasks",
    predicates: Object.freeze(Object.fromEntries(Object.keys(requirements).map((subject) => [
      subject, Object.freeze({
        kind: requirements[subject],
        status: missingMaterials.length === 0 ? "material_ready" : "waiting_for_materials",
        fact_ref: null,
      }),
    ]))),
    fact_refs: Object.freeze([]),
    missing: Object.freeze(missingMaterials.map((name) => `material:${name}`)),
  });
}

export function assertStageCompleted(stage, observations) {
  const result = deriveStageCompletion(stage, observations);
  if (result.status !== "completed") throw new Error(`${stage} incomplete: ${result.missing.join(", ")}`);
  return result;
}

export function assertDerivedCompletion(value, stage) {
  if (!value || typeof value !== "object" || !DERIVED.has(value) || value.stage !== stage) {
    throw new Error("runtime-derived stage completion required");
  }
  return value;
}

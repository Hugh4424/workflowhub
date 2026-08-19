
const STAGES = ["make-decision", "build-spec", "build-plan", "build-code", "verify-code"];
const DERIVED = new WeakSet();

// A stage may only depend on materials that exist at that point in the
// workflow. The four files remain the single authority once they exist; they
// are not a reason for make-decision/build-spec to read future artifacts.
export const STAGE_MATERIALS = Object.freeze({
  "make-decision": Object.freeze([]),
  "build-spec": Object.freeze(["decision-log.md"]),
  "build-plan": Object.freeze(["decision-log.md", "spec.md"]),
  "build-code": Object.freeze(["decision-log.md", "spec.md", "plan.md", "tasks.md"]),
  "verify-code": Object.freeze(["decision-log.md", "spec.md", "plan.md", "tasks.md"]),
});

export const STAGE_PREDICATES = Object.freeze({
  "make-decision": Object.freeze({
    scope: "acceptance_criterion",
    non_goals: "acceptance_criterion", risks: "acceptance_criterion",
    talk_clarify: "acceptance_criterion",
    finding_dispositions: "acceptance_criterion",
    human_confirmation: "confirmation",
  }),
  "build-spec": Object.freeze({
    zero_major_ambiguities: "acceptance_criterion",
    finding_dispositions: "acceptance_criterion",
  }),
  "build-plan": Object.freeze({
    fr_coverage: "acceptance_criterion", ac_coverage: "acceptance_criterion",
    dependencies: "acceptance_criterion", deletion_proofs: "acceptance_criterion",
    executable_tasks: "acceptance_criterion",
    finding_dispositions: "acceptance_criterion",
    human_confirmation: "confirmation",
  }),
  "build-code": Object.freeze({
    risk_tests_fresh: "test",
    acceptance_criteria: "acceptance_criterion", finding_dispositions: "acceptance_criterion", integration_review: "review",
  }),
  "verify-code": Object.freeze({
    code_review: "review",
  }),
});

// Review is useful advice for every stage except build-code. It must still be
// recorded and shown, but an unavailable or incomplete advice source must not
// turn a runnable stage into a fake quality gate. build-code keeps its final
// integration review in STAGE_PREDICATES because that is the one user-defined
// implementation gate.
export const STAGE_ADVISORY_PREDICATES = Object.freeze({
  "make-decision": Object.freeze({ direction_review: "review", detail_review: "review" }),
  "build-spec": Object.freeze({ independent_review: "review" }),
  "build-plan": Object.freeze({ independent_review: "review" }),
  "build-code": Object.freeze({}),
  "verify-code": Object.freeze({}),
});

export function qualityPredicateSatisfied(fact, kind) {
  if (kind === "review") {
    // A real unavailable attempt is a current quality fact, but it is not a
    // completed independent review. It remains visible to stage handlers and
    // never blocks same-task repair; it must not satisfy formal completion.
    return fact.status === "recorded";
  }
  return fact.status === "passed";
}

export function deriveStageCompletion(stage, observations = []) {
  if (!STAGES.includes(stage)) throw new TypeError(`unsupported stage: ${stage}`);
  if (!Array.isArray(observations)) throw new TypeError("completion observations must be an array");
  const requirements = STAGE_PREDICATES[stage];
  const satisfied = new Map();
  for (const observation of observations) {
    const fact = observation?.fact?.value ?? observation?.fact;
    if (!fact || fact.stage !== stage
        || observation.authenticated !== true || observation.freshness?.status !== "current") continue;
    if (requirements[fact.subject] === fact.kind && qualityPredicateSatisfied(fact, fact.kind)) {
      satisfied.set(fact.subject, observation);
    }
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

// Work readiness is deliberately separate from quality completion. A stage
// may have failed, stale, or unavailable quality facts and still be ready for
// more work on the current materials. This result must never claim that the
// stage itself is complete; deriveStageCompletion is the only quality
// completion derivation.
export function deriveStageProgress(stage, observations = [], materials = null) {
  if (!STAGES.includes(stage)) throw new TypeError(`unsupported stage: ${stage}`);
  if (!Array.isArray(observations)) throw new TypeError("progress observations must be an array");
  const materialNames = STAGE_MATERIALS[stage];
  const missingMaterials = materials === null
    ? materialNames
    : materialNames.filter((name) => typeof materials?.[name] !== "string" || materials[name].trim() === "");
  const ready = missingMaterials.length === 0;
  return Object.freeze({
    stage,
    work_status: ready ? "ready" : "blocked_by_missing_material",
    continuation_allowed: ready,
    work_authority: "current-four-materials-and-plan-tasks",
    readiness_source: "current-material-presence",
    required_materials: Object.freeze([...materialNames]),
    missing_materials: Object.freeze([...missingMaterials]),
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

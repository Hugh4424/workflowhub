
const STAGES = ["make-decision", "build-spec", "build-plan", "build-code", "verify-code"];
const DERIVED = new WeakSet();

// A stage may only depend on materials that exist at that point in the
// workflow. The four files remain the single authority once they exist; they
// are not a reason for make-decision/build-spec to read future artifacts.
export const STAGE_MATERIALS = Object.freeze({
  "make-decision": Object.freeze(["decision-log.md"]),
  "build-spec": Object.freeze(["decision-log.md", "spec.md"]),
  "build-plan": Object.freeze(["decision-log.md", "spec.md", "plan.md", "tasks.md"]),
  "build-code": Object.freeze(["decision-log.md", "spec.md", "plan.md", "tasks.md"]),
  "verify-code": Object.freeze(["decision-log.md", "spec.md", "plan.md", "tasks.md"]),
});

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
  const materialNames = STAGE_MATERIALS[stage];
  const missingMaterials = materials === null
    ? materialNames
    : materialNames.filter((name) => typeof materials?.[name] !== "string" || materials[name].trim() === "");
  const declared = parseDeclaredStageProgress(stage, materials);
  if (declared) {
    return Object.freeze({
      stage,
      status: declared.status,
      authority: "current-four-materials-and-plan-tasks",
      progress_source: "declared-markdown-stage-progress",
      declared_quality_status: declared.quality_status,
      required_materials: Object.freeze([...materialNames]),
      predicates: Object.freeze(Object.fromEntries(Object.keys(requirements).map((subject) => [
        subject, Object.freeze({
          kind: requirements[subject],
          status: declared.status === "completed" ? "material_ready" : "stage_declared_incomplete",
          fact_ref: null,
        }),
      ]))),
      fact_refs: Object.freeze([]),
      missing: Object.freeze(declared.status === "completed" ? [] : [`stage-progress:${declared.status}`]),
    });
  }
  return Object.freeze({
    stage,
    status: missingMaterials.length === 0 ? "completed" : "in_progress",
    authority: "current-four-materials-and-plan-tasks",
    required_materials: Object.freeze([...materialNames]),
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

const PROGRESS_STATUSES = new Set(["ready", "in_progress", "completed", "blocked", "unknown", "pending"]);

function parseDeclaredStageProgress(stage, materials) {
  if (!materials || typeof materials !== "object") return null;
  const sourceName = ["make-decision", "build-spec", "build-plan"].includes(stage) ? "plan.md" : "tasks.md";
  const text = materials[sourceName];
  if (typeof text !== "string") return null;
  const heading = /^##\s+WorkflowHub Stage Progress\s*$/mi.exec(text);
  if (!heading) return null;
  const bodyStart = heading.index + heading[0].length;
  const remainder = text.slice(bodyStart);
  const nextHeading = /^##\s+/m.exec(remainder);
  const body = nextHeading ? remainder.slice(0, nextHeading.index) : remainder;
  const escaped = stage.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const row = body.match(new RegExp(`^\\|\\s*${escaped}\\s*\\|([^\\n]*)`, "mi"));
  if (!row) return null;
  const statusCell = row[1].trim();
  const statusMatch = statusCell.match(/(?:^|[\/;\s])(?:status\s*[=:]\s*)?([a-z_]+)(?=$|[\/;\s])/i);
  const status = statusMatch?.[1]?.toLowerCase() ?? null;
  if (!PROGRESS_STATUSES.has(status)) return null;
  const qualityMatch = body.match(new RegExp(`^\\|\\s*${escaped}\\s*\\|[^\\n]*quality(?:_status)?\\s*[=:]\\s*([a-z_/-]+)`, "mi"));
  return { status, quality_status: qualityMatch?.[1]?.toLowerCase() ?? "unknown" };
}

export function validateWorkflowHubStageProgress({ plan, tasks } = {}) {
  const errors = [];
  const check = (name, text, stages) => {
    if (typeof text !== "string" || text.trim() === "") {
      errors.push(`${name} content is required`);
      return;
    }
    if (!/^##\s+WorkflowHub Stage Progress\s*$/mi.test(text)) {
      errors.push(`${name} is missing WorkflowHub Stage Progress`);
      return;
    }
    for (const stage of stages) {
      if (!new RegExp(`^\\|\\s*${stage.replace(/[.*+?^${}()|[\\]\\]/g, "\\\\$&")}\\s*\\|`, "mi").test(text)) {
        errors.push(`${name} is missing stage progress row: ${stage}`);
      }
    }
    const fields = name === "plan"
      ? ["Status", "Review / handoff", "Next / deferred risk"]
      : ["Status", "Execution / evidence", "Handoff / next"];
    for (const field of fields) {
      if (!new RegExp(`\\|\\s*${field.replace(/[.*+?^${}()|[\\]\\]/g, "\\\\$&")}\\s*\\|`, "i").test(text)) {
        errors.push(`${name} stage progress is missing column: ${field}`);
      }
    }
  };
  check("plan", plan, ["make-decision", "build-spec", "build-plan"]);
  check("tasks", tasks, ["build-code", "verify-code"]);
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors) });
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

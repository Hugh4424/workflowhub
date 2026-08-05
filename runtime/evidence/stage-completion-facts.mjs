import { isDeepStrictEqual } from "node:util";
export { assertStageCompleted, deriveStageCompletion } from "../stage/completion-predicates.mjs";

const SHA256 = /^[a-f0-9]{64}$/;
const CANONICAL = new WeakSet();
const INTERNAL_USER_TERMS = /(?:\bprovider\b|\btoken\b|\battempt\b|\brunner\b|receipts?\/|reviews?\/|[a-f0-9]{64})/i;

function object(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`);
  }
  return value;
}

function text(value, label) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(`${label} must be non-empty`);
  }
  return value;
}

function stringList(value, label) {
  if (!Array.isArray(value)) throw new TypeError(`${label} must be an array`);
  return value.map((entry, index) => text(entry, `${label}[${index}]`));
}

function ref(value, label) {
  const item = object(value, label);
  text(item.ref, `${label}.ref`);
  if (!SHA256.test(item.hash ?? "")) throw new TypeError(`${label} hash must be sha256`);
  return { ref: item.ref, hash: item.hash };
}

function artifact(value, index) {
  const item = object(value, `artifacts[${index}]`);
  text(item.label, `artifacts[${index}].label`);
  text(item.ref, `artifacts[${index}].ref`);
  if (!SHA256.test(item.hash ?? "")) throw new TypeError(`artifact hash must be sha256`);
  text(item.publication_lookup, `artifacts[${index}].publication_lookup`);
  return {
    label: item.label,
    ref: item.ref,
    hash: item.hash,
    publication_lookup: item.publication_lookup,
  };
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

function canonical(value) {
  if (!CANONICAL.has(value)) throw new TypeError("renderer requires canonical completion facts");
  return value;
}

function metric(value, label) {
  if (value === null || value === undefined) return null;
  if (!Number.isFinite(value) || value < 0) throw new TypeError(`${label} must be a non-negative runtime value`);
  return value;
}

function component(value, index) {
  const item = object(value, `components[${index}]`);
  const status = text(item.status, `components[${index}].status`);
  if (!["executed", "trigger=false"].includes(status)) {
    throw new TypeError("component status must be executed or trigger=false");
  }
  return {
    name: text(item.name, `components[${index}].name`),
    status,
    reason: text(item.reason, `components[${index}].reason`),
  };
}

function sourceCoverage(value) {
  const item = object(value, "source_coverage");
  return {
    source_keys: stringList(item.source_keys, "source_coverage.source_keys"),
    missing_sources: stringList(item.missing_sources, "source_coverage.missing_sources"),
    orphan_sources: stringList(item.orphan_sources, "source_coverage.orphan_sources"),
    reverse_missing: stringList(item.reverse_missing, "source_coverage.reverse_missing"),
  };
}

function confirmationSummary(value) {
  const item = object(value, "confirmation_summary");
  return {
    completed: text(item.completed, "confirmation_summary.completed"),
    specification: text(item.specification, "confirmation_summary.specification"),
    scope: stringList(item.scope, "confirmation_summary.scope"),
    non_goals: stringList(item.non_goals, "confirmation_summary.non_goals"),
    phases: stringList(item.phases, "confirmation_summary.phases"),
    dependencies: stringList(item.dependencies, "confirmation_summary.dependencies"),
    tests: stringList(item.tests, "confirmation_summary.tests"),
    review_advice: text(item.review_advice, "confirmation_summary.review_advice"),
    risks: stringList(item.risks, "confirmation_summary.risks"),
    deferred: stringList(item.deferred, "confirmation_summary.deferred"),
    next_stage_boundary: text(item.next_stage_boundary, "confirmation_summary.next_stage_boundary"),
    expected_impact: text(item.expected_impact, "confirmation_summary.expected_impact"),
  };
}

function riskVerification(value) {
  if (!Array.isArray(value)) throw new TypeError("risk_verification must be an array");
  return value.map((entry, index) => {
    const item = object(entry, `risk_verification[${index}]`);
    return {
      risk_id: text(item.risk_id, `risk_verification[${index}].risk_id`),
      red: structuredClone(object(item.red, `risk_verification[${index}].red`)),
      green: structuredClone(object(item.green, `risk_verification[${index}].green`)),
    };
  });
}

const VERIFY_ITEM_IDS = Object.freeze([
  "current_materials", "diff_scope", "risk_tests", "acceptance_criteria",
  "tasks_completion", "browser_qa", "independent_review_resolution", "core_gaps", "human_handoff",
]);

function verificationItems(value) {
  if (!Array.isArray(value)) throw new TypeError("verification_items must be an array");
  const seen = new Set();
  const items = value.map((entry, index) => {
    const item = object(entry, `verification_items[${index}]`);
    const id = text(item.id, `verification_items[${index}].id`);
    if (!VERIFY_ITEM_IDS.includes(id) || seen.has(id)) throw new TypeError(`verification item ${id} is unknown or duplicate`);
    seen.add(id);
    const status = text(item.status, `verification_items[${index}].status`);
    if (!new Set(["pass", "fail", "unknown", "not_applicable"]).has(status)) {
      throw new TypeError(`verification item ${id} status is invalid`);
    }
    if (!Array.isArray(item.evidence_refs)) throw new TypeError(`verification item ${id} evidence_refs must be an array`);
    return {
      id,
      status,
      evidence_refs: item.evidence_refs.map((binding, bindingIndex) => ref(binding, `verification_items[${index}].evidence_refs[${bindingIndex}]`)),
      reason: text(item.reason, `verification_items[${index}].reason`),
    };
  });
  for (const id of VERIFY_ITEM_IDS) if (!seen.has(id)) throw new Error(`missing verify item: ${id}`);
  return items;
}

export function reconcileStageCompletion({
  result,
  missingItems,
  businessFacts,
  declaredComponents,
  invocationFacts,
  auditGaps,
  verificationItems: itemizedVerification,
}) {
  const derivedMissing = [];
  const business = object(businessFacts, "business_facts");
  for (const [name, accepted] of Object.entries({
    content: new Set(["present", "not_applicable"]),
    code: new Set(["complete", "not_applicable"]),
    tests: new Set(["passed", "not_applicable"]),
    acceptance_criteria: new Set(["covered", "not_applicable"]),
  })) {
    if (!accepted.has(business[name])) derivedMissing.push(`business ${name} is incomplete`);
  }
  const declared = declaredComponents;
  const invocations = invocationFacts;
  if (!Array.isArray(declared) || !Array.isArray(invocations)) {
    throw new TypeError("declared_components and invocation_facts must be arrays");
  }
  for (const component of declared) {
    const name = text(component?.name, "declared_components[].name");
    const invocation = text(component?.invocation, "declared_components[].invocation");
    const requiredBinding = {
      task_id: text(component?.task_id, "declared_components[].task_id"),
      stage: text(component?.stage, "declared_components[].stage"),
      workflow_run_id: text(component?.workflow_run_id, "declared_components[].workflow_run_id"),
      name,
      invocation_key: text(component?.invocation_key, "declared_components[].invocation_key"),
      bundle_hash: text(component?.bundle_hash, "declared_components[].bundle_hash"),
      declared_trigger: text(component?.declared_trigger, "declared_components[].declared_trigger"),
    };
    const observed = invocations.find((fact) => Object.entries(requiredBinding)
      .every(([key, expected]) => fact?.[key] === expected));
    const satisfied = observed?.status === "executed"
      || (invocation === "conditional"
        && new Set(["not_invoked", "trigger=false"]).has(observed?.status)
        && typeof observed.reason === "string" && observed.reason.trim() !== "");
    if (!satisfied) derivedMissing.push(`${name} invocation is missing`);
  }
  const gaps = auditGaps;
  if (!Array.isArray(gaps)) throw new TypeError("audit_gaps must be an array");
  const normalizedGaps = gaps.map((gap, index) => ({
    kind: text(gap?.kind, `audit_gaps[${index}].kind`),
    status: text(gap?.status, `audit_gaps[${index}].status`),
    reason: text(gap?.reason, `audit_gaps[${index}].reason`),
  }));
  const normalizedVerification = itemizedVerification === undefined ? undefined : verificationItems(itemizedVerification);
  if (normalizedVerification !== undefined) {
    const businessCritical = new Set([
      "current_materials", "diff_scope", "risk_tests", "acceptance_criteria",
      "tasks_completion", "browser_qa", "core_gaps", "human_handoff",
    ]);
    for (const item of normalizedVerification) {
      if (businessCritical.has(item.id) && !new Set(["pass", "not_applicable"]).has(item.status)) {
        derivedMissing.push(`verify item ${item.id} is ${item.status}`);
      }
    }
  }
  const combinedMissing = [...missingItems, ...derivedMissing];
  return {
    result: derivedMissing.length > 0 ? "incomplete" : result,
    missing_items: combinedMissing,
    business_facts: structuredClone(businessFacts),
    declared_components: structuredClone(declared),
    invocation_facts: structuredClone(invocations),
    audit_gaps: normalizedGaps,
    completion_effect: "disclose_only",
    ...(normalizedVerification === undefined ? {} : { verification_items: normalizedVerification }),
  };
}

export function createStageCompletionFacts(input) {
  const value = object(input, "completion facts");
  const verification = object(value.verification, "verification");
  const review = object(value.review, "review");
  const result = text(value.result, "result");
  const missingItems = stringList(value.missing_items, "missing_items");
  if (result === "passed" && missingItems.length > 0) {
    throw new TypeError("passed completion evidence requires empty missing_items");
  }
  if (review.status === "unavailable" && /(?:\bpass(?:ed)?\b|通过)/i.test(review.conclusion ?? "")) {
    throw new TypeError("unavailable review cannot call its own review verdict pass");
  }
  const reconciled = reconcileStageCompletion({
    result,
    missingItems,
    businessFacts: value.business_facts,
    declaredComponents: value.declared_components,
    invocationFacts: value.invocation_facts,
    auditGaps: value.audit_gaps,
    verificationItems: value.verification_items,
  });
  const facts = {
    schema_version: "stage-completion-facts.v1",
    result: reconciled.result,
    objective: text(value.objective, "objective"),
    approach: text(value.approach, "approach"),
    effect: text(value.effect, "effect"),
    verification: {
      conclusion: text(verification.conclusion, "verification.conclusion"),
      limits: stringList(verification.limits, "verification.limits"),
    },
    artifacts: (value.artifacts ?? []).map(artifact),
    review: {
      conclusion: text(review.conclusion, "review.conclusion"),
      status: text(review.status, "review.status"),
      providers: stringList(review.providers ?? [], "review.providers"),
      duration_ms: metric(review.duration_ms, "review.duration_ms"),
      tokens: metric(review.tokens, "review.tokens"),
      findings: Array.isArray(review.findings) ? structuredClone(review.findings) : (() => { throw new TypeError("review.findings must be an array"); })(),
      refs: (review.refs ?? []).map(ref),
    },
    components: (value.components ?? []).map(component),
    ...(value.confirmation_summary === undefined ? {} : {
      confirmation_summary: confirmationSummary(value.confirmation_summary),
    }),
    ...(value.source_coverage === undefined ? {} : {
      source_coverage: sourceCoverage(value.source_coverage),
    }),
    ...(value.risk_verification === undefined ? {} : {
      risk_verification: riskVerification(value.risk_verification),
    }),
    missing_items: reconciled.missing_items,
    business_facts: reconciled.business_facts,
    declared_components: reconciled.declared_components,
    invocation_facts: reconciled.invocation_facts,
    audit_gaps: reconciled.audit_gaps,
    completion_effect: reconciled.completion_effect,
    ...(reconciled.verification_items === undefined ? {} : {
      verification_items: reconciled.verification_items,
    }),
    risks: stringList(value.risks, "risks"),
    dependencies: stringList(value.dependencies, "dependencies"),
    recovery_conditions: stringList(value.recovery_conditions, "recovery_conditions"),
    downstream_read_rule: text(value.downstream_read_rule, "downstream_read_rule"),
    next_owner: text(value.next_owner, "next_owner"),
    user_action: text(value.user_action, "user_action"),
  };
  deepFreeze(facts);
  CANONICAL.add(facts);
  return facts;
}

export function renderUserCompletion(value) {
  const facts = canonical(value);
  const view = {
    result: facts.result,
    objective: facts.objective,
    approach: facts.approach,
    effect: facts.effect,
    verification: structuredClone(facts.verification),
    artifacts: facts.artifacts.map(({ label }) => ({ label })),
    review: {
      conclusion: facts.review.conclusion,
      "耗时": facts.review.duration_ms === null ? "未提供" : `${facts.review.duration_ms} ms`,
      "用量": facts.review.tokens === null ? "未提供" : String(facts.review.tokens),
    },
    stage_summary: {
      completed: facts.confirmation_summary.completed,
      artifacts: facts.artifacts.map(({ label }) => label),
      scope: structuredClone(facts.confirmation_summary.scope),
      non_goals: structuredClone(facts.confirmation_summary.non_goals),
      risks: structuredClone(facts.confirmation_summary.risks),
      deferred: structuredClone(facts.confirmation_summary.deferred),
      next_stage_boundary: facts.confirmation_summary.next_stage_boundary,
    },
    risks: structuredClone(facts.risks),
    next_owner: facts.next_owner,
    user_action: facts.user_action,
  };
  if (INTERNAL_USER_TERMS.test(JSON.stringify(view))) {
    throw new Error("user completion view leaks internal workflow data");
  }
  return deepFreeze(view);
}

export function renderSystemCompletion(value) {
  const facts = canonical(value);
  return deepFreeze(structuredClone(facts));
}

export function assertCompletionViewsConsistent(value, userView, systemView) {
  const facts = canonical(value);
  const user = object(userView, "user completion view");
  const system = object(systemView, "system completion view");
  const shared = ["result", "risks", "next_owner", "user_action"];
  for (const field of shared) {
    if (!isDeepStrictEqual(user[field], facts[field]) || !isDeepStrictEqual(system[field], facts[field])) {
      throw new Error(`completion view drift: ${field}`);
    }
  }
  const labels = facts.artifacts.map(({ label }) => label);
  if (!isDeepStrictEqual(user.artifacts?.map(({ label }) => label), labels)
      || !isDeepStrictEqual(system.artifacts?.map(({ label }) => label), labels)) {
    throw new Error("completion view drift: artifact labels");
  }
  const summary = facts.confirmation_summary;
  if (!summary
      || !isDeepStrictEqual(user.stage_summary?.completed, summary.completed)
      || !isDeepStrictEqual(user.stage_summary?.artifacts, facts.artifacts.map(({ label }) => label))
      || !isDeepStrictEqual(user.stage_summary?.scope, summary.scope)
      || !isDeepStrictEqual(user.stage_summary?.non_goals, summary.non_goals)
      || !isDeepStrictEqual(user.stage_summary?.risks, summary.risks)
      || !isDeepStrictEqual(user.stage_summary?.deferred, summary.deferred)
      || !isDeepStrictEqual(user.stage_summary?.next_stage_boundary, summary.next_stage_boundary)
      || !isDeepStrictEqual(system.confirmation_summary, summary)) {
    throw new Error("completion view drift: stage summary");
  }
  return true;
}

export function buildStageCompletion(stage, input) {
  const value = object(input, "stage completion input");
  const facts = createStageCompletionFacts(value);
  const user = renderUserCompletion(facts);
  const system = renderSystemCompletion(facts);
  assertCompletionViewsConsistent(facts, user, system);
  return deepFreeze({ facts, user, system });
}

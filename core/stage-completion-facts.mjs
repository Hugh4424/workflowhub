import { isDeepStrictEqual } from "node:util";

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
  text(item.accepted_lookup, `artifacts[${index}].accepted_lookup`);
  return {
    label: item.label,
    ref: item.ref,
    hash: item.hash,
    accepted_lookup: item.accepted_lookup,
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

export function createStageCompletionFacts(input) {
  const value = object(input, "completion facts");
  const verification = object(value.verification, "verification");
  const review = object(value.review, "review");
  const facts = {
    schema_version: "stage-completion-facts.v1",
    result: text(value.result, "result"),
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
    missing_items: stringList(value.missing_items, "missing_items"),
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

import { createHash } from "node:crypto";
import { isMaterialOnlySnapshotDelta, materialRevisionFromValues } from "../task/git-worktree-snapshot.mjs";
import { validateVerifyLeaves } from "../evidence/quality-store.mjs";
import { validateAcceptanceEvidence } from "../evidence/acceptance-evidence-validator.mjs";

const STAGES = ["make-decision", "build-spec", "build-plan", "build-code", "verify-code"];
const DERIVED = new WeakSet();
const SHA256 = /^[a-f0-9]{64}$/;
const OID = /^[a-f0-9]{40,64}$/;
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

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

// Quality facts are produced after a stage has written its own material. Keep
// the four current materials as the only authority, but bind each fact to the
// smallest fixed scope that can affect that stage. This prevents a later
// stage's new output from invalidating an already-completed upstream stage,
// while still invalidating every downstream fact when an upstream material
// changes. Callers cannot provide or shrink this scope.
export const STAGE_FACT_MATERIALS = Object.freeze({
  "make-decision": Object.freeze(["decision-log.md"]),
  "build-spec": Object.freeze(["decision-log.md", "spec.md"]),
  "build-plan": Object.freeze(["decision-log.md", "spec.md", "plan.md", "tasks.md"]),
  "build-code": Object.freeze(["decision-log.md", "spec.md", "plan.md", "tasks.md"]),
  "verify-code": Object.freeze(["decision-log.md", "spec.md", "plan.md", "tasks.md"]),
});

export function stageMaterialScopeRevision(stage, materials = {}) {
  const files = STAGE_FACT_MATERIALS[stage];
  if (!files) throw new TypeError(`unsupported stage: ${stage}`);
  if (!materials || typeof materials !== "object" || Array.isArray(materials)) {
    throw new TypeError("stage material scope requires a material map");
  }
  return materialRevisionFromValues(files.map((file) => [file, materials[file] ?? null]));
}

export function stageMaterialScopeRevisions(materials = {}) {
  return Object.freeze(Object.fromEntries(Object.keys(STAGE_FACT_MATERIALS).map((stage) => [
    stage,
    stageMaterialScopeRevision(stage, materials),
  ])));
}

export const STAGE_PREDICATES = Object.freeze({
  "make-decision": Object.freeze({
    scope: "acceptance_criterion",
    non_goals: "acceptance_criterion", risks: "acceptance_criterion",
    talk_clarify: "acceptance_criterion",
    stage_end_spec_analyze: "acceptance_criterion",
    human_confirmation: "confirmation",
  }),
  "build-spec": Object.freeze({
    zero_major_ambiguities: "acceptance_criterion",
    stage_end_spec_analyze: "acceptance_criterion",
  }),
  "build-plan": Object.freeze({
    fr_coverage: "acceptance_criterion", ac_coverage: "acceptance_criterion",
    dependencies: "acceptance_criterion", deletion_proofs: "acceptance_criterion",
    executable_tasks: "acceptance_criterion",
    stage_end_spec_analyze: "acceptance_criterion",
    human_confirmation: "confirmation",
  }),
  "build-code": Object.freeze({
    risk_tests_fresh: "test",
    acceptance_criteria: "acceptance_criterion", stage_end_spec_analyze: "acceptance_criterion",
    finding_dispositions: "acceptance_criterion", integration_review: "review",
  }),
  "verify-code": Object.freeze({
    code_review: "review",
    human_confirmation: "confirmation",
  }),
});

// Review and its dispositions are useful advice in the three authoring
// stages. They stay recorded and visible without becoming completion gates.
// build-code keeps both dispositions and its final integration review in
// STAGE_PREDICATES because that is the one user-defined implementation gate.
export const STAGE_ADVISORY_PREDICATES = Object.freeze({
  "make-decision": Object.freeze({ direction_review: "review", detail_review: "review", finding_dispositions: "acceptance_criterion" }),
  "build-spec": Object.freeze({ independent_review: "review", finding_dispositions: "acceptance_criterion" }),
  "build-plan": Object.freeze({ independent_review: "review", finding_dispositions: "acceptance_criterion" }),
  "build-code": Object.freeze({}),
  // wh-review's verify-code result is advice only. The required code_review
  // remains owned by the dsh stage outcome and its bound quality_review ref.
  "verify-code": Object.freeze({ independent_review: "review" }),
});

export function qualityPredicateSatisfied(fact, kind, { stage = fact?.stage, subject = fact?.subject, review_status: reviewStatus, review_source: reviewSource } = {}) {
  if (kind === "review") {
    // A real unavailable attempt is a current quality fact, but it is not a
    // completed independent review. It remains visible to stage handlers and
    // never blocks same-task repair; it must not satisfy formal completion.
    if (stage === "verify-code" && subject === "code_review") {
      if (reviewSource !== undefined && reviewSource !== "wh_review.v2") return false;
      // A review may finish with findings that were fixed in the same task.
      // `resolved` is a current disposition, not a claim that the old review
      // snapshot was clean.  Keep accepting the legacy `clean` value for
      // findings-free reviews, but never require it as a separate loop.
      return fact.status === "recorded" && new Set(["clean", "resolved"]).has(reviewStatus);
    }
    if (stage === "build-code" && subject === "integration_review") {
      if (reviewSource !== undefined && reviewSource !== "wh_review.v2") return false;
      // build-code already has the required finding-disposition predicate;
      // the review fact only needs to be authentic and recorded.  Requiring a
      // second "clean" label duplicated that disposition check and created a
      // needless review loop.
      return fact.status === "recorded";
    }
    return fact.status === "recorded";
  }
  return fact.status === "passed";
}

// Quality facts are immutable history.  A repeated attempt for the same
// current predicate must therefore project its latest terminal observation,
// rather than treating an earlier `missing` fact as permanently concurrent
// with a later repair.  File-name order is content-hash order, not event
// order, so it is deliberately never used as a tie-breaker.
function selectLatestTerminalObservation(observations) {
  if (observations.length === 0) return { status: "missing", observation: null };
  if (observations.length === 1) return { status: "selected", observation: observations[0] };

  const ranked = observations.map((observation) => ({
    observation,
    recordedAt: Date.parse((observation.fact?.value ?? observation.fact)?.recorded_at ?? ""),
  }));
  if (ranked.some(({ recordedAt }) => !Number.isFinite(recordedAt))) {
    return { status: "conflict", observation: null };
  }
  const latestRecordedAt = Math.max(...ranked.map(({ recordedAt }) => recordedAt));
  const latest = ranked.filter(({ recordedAt }) => recordedAt === latestRecordedAt);
  return latest.length === 1
    ? { status: "selected", observation: latest[0].observation }
    : { status: "conflict", observation: null };
}

export function deriveStageCompletion(stage, observations = []) {
  if (!STAGES.includes(stage)) throw new TypeError(`unsupported stage: ${stage}`);
  if (!Array.isArray(observations)) throw new TypeError("completion observations must be an array");
  const requirements = STAGE_PREDICATES[stage];
  const satisfied = new Map();
  const conflicts = new Set();
  const candidates = new Map();
  for (const observation of observations) {
    const fact = observation?.fact?.value ?? observation?.fact;
    if (!fact || fact.stage !== stage
        || observation.authenticated !== true || observation.freshness?.status !== "current") continue;
    if (requirements[fact.subject] !== fact.kind) continue;
    const subjectCandidates = candidates.get(fact.subject) ?? [];
    subjectCandidates.push(observation);
    candidates.set(fact.subject, subjectCandidates);
  }
  for (const [subject, subjectCandidates] of candidates.entries()) {
    const selected = selectLatestTerminalObservation(subjectCandidates);
    if (selected.status === "conflict") {
      // A missing/failed fact remains immutable history, but two equally new
      // terminals (or an invalid terminal order) have no truthful current
      // projection. Keep that failure explicit instead of guessing from ref
      // order or filtering one status away.
      conflicts.add(subject);
      continue;
    }
    const observation = selected.observation;
    const fact = observation.fact?.value ?? observation.fact;
    const reviewStatus = observation.review_status ?? observation.freshness?.review_status;
    const reviewSource = observation.review_source ?? observation.freshness?.review_source ?? fact.review_source ?? fact.source;
    if (qualityPredicateSatisfied(fact, fact.kind, { stage, subject, review_status: reviewStatus, review_source: reviewSource })) {
      satisfied.set(subject, observation);
    }
  }
  const missing = Object.keys(requirements).filter((subject) => !satisfied.has(subject));
  const result = Object.freeze({
    stage,
    status: missing.length === 0 ? "completed" : "in_progress",
    predicates: Object.freeze(Object.fromEntries(Object.keys(requirements).map((subject) => [
      subject, Object.freeze({
        kind: requirements[subject],
        status: conflicts.has(subject) ? "conflict" : satisfied.has(subject) ? "satisfied" : "missing",
        fact_ref: satisfied.get(subject)?.fact?.ref ?? null,
      }),
    ]))),
    fact_refs: Object.freeze([...satisfied.values()].map((entry) => entry.fact.ref).sort()),
    missing: Object.freeze(missing),
  });
  DERIVED.add(result);
  return result;
}

function authenticatedVerifySummary({ read, value, taskId, materialRevision, snapshotTree, snapshotRoot }) {
  if (value?.schema_version !== "quality-verify.v1"
      || value.task_id !== taskId
      || value.stage !== "verify-code"
      || value.status !== "passed"
      || value.material_revision !== materialRevision
      || value.material_digest !== materialRevision?.slice("revision-".length)
      || !(value.snapshot_tree === snapshotTree
        || (snapshotRoot && isMaterialOnlySnapshotDelta(snapshotRoot, value.snapshot_tree, snapshotTree, taskId)))
      || !SHA256.test(value.source_digest ?? "")
      || typeof value.evidence_ref !== "string"
      || !SHA256.test(value.evidence_hash ?? "")) return null;

  // `quality/verify.json` is the existing per-AC authority, not a status
  // pointer. Authenticate its own current source binding and every leaf/hash
  // before allowing it to contribute product acceptance results. This keeps
  // the release projection on the same current evidence chain as quality
  // facts without adding another persisted fact or control plane.
  try {
    if (value.evidence_ref === "quality/verify.json") return null;
    const sourceRaw = read(value.evidence_ref);
    if (sha256(sourceRaw) !== value.evidence_hash) return null;
    const criteria = validateVerifyLeaves(value.criteria, { sourceDigest: value.source_digest });
    for (const criterion of criteria) {
      const leafRaw = read(criterion.acceptance_leaf.ref);
      if (sha256(leafRaw) !== criterion.acceptance_leaf.sha256) return null;
      const leaf = validateAcceptanceEvidence(JSON.parse(leafRaw));
      if (leaf.acceptance_criterion_id !== criterion.acceptance_criterion_id
          || leaf.result !== criterion.result
          || leaf.source_digest !== criterion.source_digest
          || (leaf.snapshot_tree !== undefined && leaf.snapshot_tree !== value.snapshot_tree)
          || leaf.refs.length !== criterion.nested_evidence.length
          || leaf.refs.some((binding, index) => binding.ref !== criterion.nested_evidence[index].ref
            || binding.sha256 !== criterion.nested_evidence[index].sha256)) return null;
      for (const binding of criterion.nested_evidence) {
        const evidenceRaw = read(binding.ref);
        if (sha256(evidenceRaw) !== binding.sha256) return null;
      }
    }
    return criteria;
  } catch {
    return null;
  }
}

function productObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`);
  }
  return value;
}

function productEntries(value, label) {
  if (Array.isArray(value)) return value.map((entry) => productObject(entry, label));
  if (value && typeof value === "object") {
    return Object.entries(value).map(([key, entry]) => ({
      ...productObject(entry, `${label}.${key}`),
      ...(entry.stage === undefined && label === "stage_completions" ? { stage: key } : {}),
      ...(entry.acceptance_criterion_id === undefined && label === "acceptance_results"
        ? { acceptance_criterion_id: key }
        : {}),
    }));
  }
  throw new TypeError(`${label} must be an array or object`);
}

function productBinding(value) {
  const candidates = [value, value?.evidence, value?.input, value?.binding];
  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== "object") continue;
    const ref = candidate.ref
      ?? candidate.evidence_ref
      ?? candidate.fact_ref
      ?? candidate.result_ref
      ?? candidate.confirmation_ref;
    const hash = candidate.hash
      ?? candidate.sha256
      ?? candidate.evidence_hash
      ?? candidate.fact_hash
      ?? candidate.result_hash
      ?? candidate.confirmation_hash;
    if (typeof ref === "string" && ref.trim() !== "" && SHA256.test(hash ?? "")) {
      return Object.freeze({ ref, hash });
    }
  }
  for (const key of ["input_refs", "evidence_refs", "fact_refs", "refs"]) {
    if (!Array.isArray(value?.[key])) continue;
    for (const entry of value[key]) {
      const binding = productBinding(entry);
      if (binding) return binding;
    }
  }
  for (const key of ["fact_refs", "evidence_refs", "refs"]) {
    const refs = value?.[key];
    if (!Array.isArray(refs) || !value?.[`${key.replace(/_refs$/, "_hashes")}`]) continue;
    for (const ref of refs) {
      const hash = value[`${key.replace(/_refs$/, "_hashes")}`][ref];
      if (typeof ref === "string" && SHA256.test(hash ?? "")) return Object.freeze({ ref, hash });
    }
  }
  return null;
}

function productCurrent(value) {
  if (value?.current === false) return false;
  if (value?.freshness && value.freshness.status !== "current") return false;
  if (value?.freshness_status && value.freshness_status !== "current") return false;
  return value?.current === true
    || value?.freshness?.status === "current"
    || value?.freshness_status === "current";
}

function productReason(reasons, value) {
  if (!reasons.includes(value)) reasons.push(value);
}

function productIdentity(value, label, expected, reasons) {
  const fields = ["task_id", "material_revision", "snapshot_tree"];
  const identity = Object.fromEntries(fields.map((field) => [field, value?.[field]]));
  for (const field of fields) {
    if (typeof identity[field] !== "string" || identity[field].trim() === "") {
      productReason(reasons, `${label}_identity_invalid`);
      return expected;
    }
  }
  if (expected === null) return identity;
  for (const field of fields) if (expected[field] !== identity[field]) productReason(reasons, `${label}_identity_conflict:${field}`);
  return expected;
}

/**
 * Derive product release from the current facts already produced by the
 * five-stage workflow. This is deliberately a read-only view: it does not
 * publish a fact, create a schema, or persist a second release state.
 *
 * `stage_completions` may be an array or a stage-keyed object. Each entry must
 * carry a current completed result and one explicit ref/hash binding.
 * `acceptance_results` follows the same shape and accepts the existing
 * acceptance result vocabulary. An explicitly non-applicable/deferred item
 * is excluded only when the input says it is non-applicable; no omission is
 * inferred. `verify_confirmation` must be the current accepted confirmation.
 */
export function deriveProductRelease({
  stage_completions: stageCompletionsInput,
  stageCompletions,
  acceptance_results: acceptanceResultsInput,
  acceptanceResults,
  product_results: productResultsInput,
  productResults,
  expected_acceptance_ids: expectedAcceptanceIdsInput,
  expectedAcceptanceIds,
  verify_confirmation: verifyConfirmationInput,
  verifyConfirmation,
} = {}) {
  const stageInput = stageCompletionsInput ?? stageCompletions;
  const acceptanceInput = acceptanceResultsInput ?? acceptanceResults ?? productResultsInput ?? productResults;
  const hasAcceptanceResults = acceptanceResultsInput !== undefined || acceptanceResults !== undefined;
  const hasProductResults = productResultsInput !== undefined || productResults !== undefined;
  const expectedIdsInput = expectedAcceptanceIdsInput ?? expectedAcceptanceIds;
  const reasons = [];
  const inputRefs = [];
  const seenRefs = new Map();
  let productIdentityExpected = null;
  const addInputBinding = (binding, label) => {
    const previousHash = seenRefs.get(binding.ref);
    if (previousHash !== undefined && previousHash !== binding.hash) {
      productReason(reasons, `${label}_binding_conflict:${binding.ref}`);
      return;
    }
    if (previousHash === undefined) {
      seenRefs.set(binding.ref, binding.hash);
      inputRefs.push(binding);
    }
  };

  if (stageInput === undefined) {
    productReason(reasons, "stage_completions_missing");
  }
  if (acceptanceInput === undefined) {
    productReason(reasons, "acceptance_results_missing");
  }
  if (hasAcceptanceResults && hasProductResults) {
    productReason(reasons, "acceptance_results_product_results_conflict");
  }
  if (!Array.isArray(expectedIdsInput) || expectedIdsInput.length === 0) {
    productReason(reasons, "expected_acceptance_ids_missing");
  } else if (expectedIdsInput.some((id) => typeof id !== "string" || id.trim() === "")) {
    productReason(reasons, "expected_acceptance_ids_invalid");
  } else if (new Set(expectedIdsInput).size !== expectedIdsInput.length) {
    productReason(reasons, "expected_acceptance_ids_conflicting");
  }

  const currentStageCompletions = stageInput === undefined ? [] : productEntries(stageInput, "stage_completions");
  const stageByName = new Map();
  for (const completion of currentStageCompletions) {
    const stage = completion.stage;
    if (!STAGES.includes(stage)) {
      productReason(reasons, `stage_completion_unsupported:${String(stage)}`);
      continue;
    }
    if (stageByName.has(stage)) {
      productReason(reasons, `stage_completion_conflicting:${stage}`);
      continue;
    }
    stageByName.set(stage, completion);
    productIdentityExpected = productIdentity(completion, `stage_completion:${stage}`, productIdentityExpected, reasons);
    if (completion.status !== "completed") {
      productReason(reasons, `stage_not_completed:${stage}`);
      for (const subject of completion.missing ?? []) productReason(reasons, `stage_predicate_missing:${stage}:${subject}`);
    }
    if (!productCurrent(completion)) productReason(reasons, `stage_completion_not_current:${stage}`);
    const binding = productBinding(completion);
    if (!binding) productReason(reasons, `stage_completion_unbound:${stage}`);
    else addInputBinding(binding, "stage_completion");
  }
  for (const stage of STAGES) {
    if (!stageByName.has(stage)) productReason(reasons, `stage_completion_missing:${stage}`);
  }

  const currentAcceptanceResults = acceptanceInput === undefined
    ? []
    : productEntries(acceptanceInput, "acceptance_results");
  const acceptanceById = new Map();
  let applicableAcceptanceCount = 0;
  for (const acceptance of currentAcceptanceResults) {
    const id = acceptance.acceptance_criterion_id;
    if (typeof id !== "string" || id.trim() === "") {
      productReason(reasons, "acceptance_result_unidentified");
      continue;
    }
    if (acceptanceById.has(id)) {
      productReason(reasons, `acceptance_result_conflicting:${id}`);
      continue;
    }
    acceptanceById.set(id, acceptance);
    productIdentityExpected = productIdentity(acceptance, `acceptance_result:${id}`, productIdentityExpected, reasons);
    const explicitlyNotApplicable = acceptance.applicable === false
      || acceptance.not_applicable === true
      || acceptance.status === "not_applicable"
      || acceptance.result === "not_applicable"
      || acceptance.deferred === true
      || acceptance.status === "deferred"
      || acceptance.result === "deferred";
    if (explicitlyNotApplicable) {
      const disposition = acceptance.deferred_disposition ?? acceptance.disposition ?? acceptance;
      for (const field of ["reason", "owner", "trigger", "handoff", "close_condition"]) {
        if (typeof disposition?.[field] !== "string" || disposition[field].trim() === "") {
          productReason(reasons, `acceptance_result_disposition_incomplete:${id}:${field}`);
        }
      }
      if (!productCurrent(acceptance)) productReason(reasons, `acceptance_result_not_current:${id}`);
      const binding = productBinding(acceptance);
      if (!binding) productReason(reasons, `acceptance_result_unbound:${id}`);
      else addInputBinding(binding, "acceptance_result");
      continue;
    }
    applicableAcceptanceCount += 1;
    const result = acceptance.result ?? acceptance.status;
    if (!productCurrent(acceptance)) productReason(reasons, `acceptance_result_not_current:${id}`);
    if (!["pass", "passed", "satisfied", "completed"].includes(result)
        || (acceptance.status !== undefined && acceptance.status !== "passed")) {
      productReason(reasons, `acceptance_result_not_pass:${id}:${String(result ?? "missing")}`);
    }
    const binding = productBinding(acceptance);
    if (!binding) productReason(reasons, `acceptance_result_unbound:${id}`);
    else addInputBinding(binding, "acceptance_result");
  }
  if (acceptanceInput !== undefined && applicableAcceptanceCount === 0) {
    productReason(reasons, "no_applicable_acceptance_results");
  }
  if (Array.isArray(expectedIdsInput) && expectedIdsInput.length > 0
      && expectedIdsInput.every((id) => typeof id === "string" && id.trim() !== "")
      && new Set(expectedIdsInput).size === expectedIdsInput.length) {
    for (const id of expectedIdsInput) {
      if (!acceptanceById.has(id)) productReason(reasons, `acceptance_result_missing:${id}`);
    }
    for (const [id, acceptance] of acceptanceById.entries()) {
      const explicitlyDeferred = acceptance.applicable === false
        || acceptance.not_applicable === true
        || acceptance.status === "not_applicable"
        || acceptance.result === "not_applicable"
        || acceptance.deferred === true
        || acceptance.status === "deferred"
        || acceptance.result === "deferred";
      if (!expectedIdsInput.includes(id) && !explicitlyDeferred) {
        productReason(reasons, `acceptance_result_unexpected:${id}`);
      }
    }
  }

  const confirmation = verifyConfirmationInput ?? verifyConfirmation;
  if (confirmation === undefined || confirmation === null) {
    productReason(reasons, "verify_confirmation_missing");
  } else {
    productObject(confirmation, "verify_confirmation");
    if (!productCurrent(confirmation)) productReason(reasons, "verify_confirmation_not_current");
    if (confirmation.schema_version !== "human-confirmation.v2"
        || typeof confirmation.task_id !== "string" || confirmation.task_id.trim() === ""
        || confirmation.stage !== "verify-code"
        || !/^revision-[a-f0-9]{64}$/.test(confirmation.material_revision ?? "")
        || !OID.test(confirmation.snapshot_tree ?? "")
        || !Number.isFinite(Date.parse(confirmation.confirmed_at))) {
      productReason(reasons, "verify_confirmation_identity_invalid");
    }
    productIdentityExpected = productIdentity(confirmation, "verify_confirmation", productIdentityExpected, reasons);
    const decision = confirmation.decision ?? confirmation.status;
    if (decision !== "accepted") productReason(reasons, `verify_confirmation_not_accepted:${String(decision ?? "missing")}`);
    const binding = productBinding(confirmation);
    if (!binding) productReason(reasons, "verify_confirmation_unbound");
    else addInputBinding(binding, "verify_confirmation");
  }

  const result = Object.freeze({
    producer: "deriveProductRelease",
    status: reasons.length === 0 ? "released" : "not_released",
    input_refs: Object.freeze(inputRefs.map((entry) => Object.freeze({ ...entry }))),
    reasons: Object.freeze([...reasons]),
  });
  DERIVED.add(result);
  return result;
}

/**
 * Build the read-only product-release input from the existing current quality
 * facts. Both status and close use this projection so neither invents a
 * second release state or a second completion algorithm.
 */
export function deriveCurrentProductRelease({
  task_id: taskId,
  read,
  refs = [],
  snapshot_tree: snapshotTree,
  material_revision: materialRevision,
  material_scope_revisions: materialScopeRevisions = {},
  snapshot_root: snapshotRoot = null,
  expected_acceptance_ids: expectedAcceptanceIds = [],
  evaluate_freshness: evaluateFreshness = null,
} = {}) {
  if (typeof read !== "function") throw new TypeError("product-release quality fact reader is required");
  const stageObservations = new Map(STAGES.map((stage) => [stage, []]));
  const acceptanceCandidates = new Map();
  let confirmation = null;
  for (const ref of refs) {
    if (typeof ref !== "string" || ref.trim() === "") continue;
    let raw;
    let value;
    try {
      raw = read(ref);
      value = JSON.parse(raw);
    } catch {
      continue;
    }
    const snapshotCurrent = value?.snapshot_tree === snapshotTree
      || (snapshotRoot && isMaterialOnlySnapshotDelta(snapshotRoot, value?.snapshot_tree, snapshotTree, taskId));
    const scopeMatchesStage = value?.material_scope === undefined
      || JSON.stringify(value.material_scope) === JSON.stringify(STAGE_FACT_MATERIALS[value.stage]);
    const factMaterialCurrent = !scopeMatchesStage
      ? false
      : value?.material_scope_revision !== undefined
        ? value.material_scope_revision === materialScopeRevisions[value.stage]
        : value?.material_revision === materialRevision;
    if (value?.schema_version !== "quality-fact.v1"
        || value.task_id !== taskId
        || !stageObservations.has(value.stage)
        || !factMaterialCurrent
        || !snapshotCurrent) continue;
    const hash = sha256(raw);
    let freshness = { status: "unknown", authenticated: false };
    if (typeof evaluateFreshness === "function") {
      try {
        freshness = evaluateFreshness({ ...value, ref, sha256: hash }, {
          material_revision: materialRevision,
          material_scope_revisions: materialScopeRevisions,
          snapshot_tree: snapshotTree,
        }, {
          read,
          workspaceRoot: snapshotRoot,
          taskId,
        });
      } catch {
        freshness = { status: "stale", authenticated: false };
      }
    }
    stageObservations.get(value.stage).push({
      fact: { ref, value },
      authenticated: freshness.authenticated === true,
      freshness,
      ...(freshness.review_status ? { review_status: freshness.review_status } : {}),
    });
    // Stage completion predicates use semantic subjects such as
    // `acceptance_criteria` and `fr_coverage`; those are not product AC IDs.
    // Only a directly named AC fact can be used as a fallback product result.
    if (freshness.authenticated === true
        && freshness.status === "current"
        && value.kind === "acceptance_criterion"
        && (value.stage === "build-code" || value.stage === "verify-code")
        && /^AC-[A-Za-z0-9_-]+$/.test(value.subject ?? "")) {
      const candidates = acceptanceCandidates.get(value.subject) ?? [];
      candidates.push({ source: "stage-fact", value, ref, hash });
      acceptanceCandidates.set(value.subject, candidates);
    }
    if (freshness.authenticated === true
        && freshness.status === "current"
        && value.kind === "confirmation" && value.stage === "verify-code"
        && value.subject === "human_confirmation" && value.status === "passed") {
      const binding = value.evidence?.[0];
      if (!binding) continue;
      try {
        const human = JSON.parse(read(binding.ref));
        if (human?.schema_version === "human-confirmation.v2"
            && (human.snapshot_tree === snapshotTree
              || (snapshotRoot && isMaterialOnlySnapshotDelta(snapshotRoot, human.snapshot_tree, snapshotTree, taskId)))) {
          confirmation = {
            ...human,
            material_revision: materialRevision,
            snapshot_tree: snapshotTree,
            current: true,
            ref: binding.ref,
            hash: binding.sha256,
          };
        }
      } catch {
        confirmation = null;
      }
    }
  }
  const stageCompletions = STAGES.map((stage) => {
    const observations = stageObservations.get(stage) ?? [];
    const completion = deriveStageCompletion(stage, observations);
    const first = observations.find(({ fact }) => completion.fact_refs.includes(fact.ref));
    return {
      stage,
      status: completion.status === "completed" ? "completed" : "incomplete",
      missing: completion.missing,
      current: true,
      task_id: taskId,
      material_revision: materialRevision,
      snapshot_tree: snapshotTree,
      ...(first ? { ref: first.fact.ref, hash: sha256(read(first.fact.ref)) } : {}),
    };
  });
  // The verify summary is the existing per-AC product-result authority. It is
  // not a new store or a second status machine; it is the canonical record
  // already written by verify-code. Bind every criterion to the summary bytes
  // and refuse to treat a summary from another material/snapshot as current.
  try {
    const verifyRef = "quality/verify.json";
    const verifyRaw = read(verifyRef);
    const verify = JSON.parse(verifyRaw);
    const verifyIdentityCurrent = verify?.schema_version === "quality-verify.v1"
      && verify.task_id === taskId
      && verify.stage === "verify-code"
      && verify.material_revision === materialRevision
      && (verify.snapshot_tree === snapshotTree
        || (snapshotRoot && isMaterialOnlySnapshotDelta(snapshotRoot, verify.snapshot_tree, snapshotTree, taskId)));
    const verifiedCriteria = verifyIdentityCurrent
      ? authenticatedVerifySummary({
        read,
        value: verify,
        taskId,
        materialRevision,
        snapshotTree,
        snapshotRoot,
      })
      : null;
    if (Array.isArray(verifiedCriteria)) {
      const verifyHash = sha256(verifyRaw);
      for (const criterion of verifiedCriteria) {
        const id = criterion?.acceptance_criterion_id;
        if (typeof id !== "string" || !/^AC-[A-Za-z0-9_-]+$/.test(id)) continue;
        const candidates = acceptanceCandidates.get(id) ?? [];
        candidates.push({
          source: "verify-summary",
          value: {
            acceptance_criterion_id: id,
            result: criterion.result,
            status: criterion.status,
            current: true,
            task_id: taskId,
            material_revision: materialRevision,
            snapshot_tree: snapshotTree,
            ref: verifyRef,
            hash: verifyHash,
            ...(criterion.reason === undefined ? {} : { reason: criterion.reason }),
            ...(criterion.owner === undefined ? {} : { owner: criterion.owner }),
            ...(criterion.trigger === undefined ? {} : { trigger: criterion.trigger }),
            ...(criterion.handoff === undefined ? {} : { handoff: criterion.handoff }),
            ...(criterion.close_condition === undefined ? {} : { close_condition: criterion.close_condition }),
          },
          ref: verifyRef,
          hash: verifyHash,
        });
        acceptanceCandidates.set(id, candidates);
      }
    }
  } catch {
    // Missing or malformed verify summary remains represented by the missing
    // expected AC reasons below; no guessed product result is created.
  }
  const acceptanceResults = [...acceptanceCandidates.values()].flatMap((candidates) => {
    const verifyCandidates = candidates.filter(({ source }) => source === "verify-summary");
    const stageCandidates = candidates.filter(({ source }) => source === "stage-fact");
    if (verifyCandidates.length === 0) return stageCandidates;
    // The verify summary is the final product AC authority. A matching
    // stage leaf is only a fallback and must not become a duplicate
    // candidate; a disagreement remains visible as an explicit conflict.
    const outcome = (candidate) => {
      const value = candidate.value;
      const result = value.result ?? (value.status === "passed" ? "pass" : value.status);
      const status = value.status ?? (result === "pass" ? "passed" : result);
      return `${result}:${status}`;
    };
    const verifyOutcome = outcome(verifyCandidates[0]);
    const conflictingStageFact = stageCandidates.find((candidate) => outcome(candidate) !== verifyOutcome);
    return conflictingStageFact === undefined
      ? verifyCandidates
      : [...verifyCandidates, conflictingStageFact];
  }).map(({ value, ref, hash }) => ({
    acceptance_criterion_id: value.acceptance_criterion_id ?? value.subject,
    result: value.result ?? (value.status === "passed" ? "pass" : value.status),
    status: value.status,
    current: value.current ?? true,
    task_id: value.task_id ?? taskId,
    material_revision: value.material_revision ?? materialRevision,
    snapshot_tree: value.snapshot_tree ?? snapshotTree,
    ref,
    hash,
    ...(["reason", "owner", "trigger", "handoff", "close_condition"].reduce((fields, field) => {
      if (typeof value[field] === "string" && value[field].trim() !== "") fields[field] = value[field];
      return fields;
    }, {})),
  }));
  return deriveProductRelease({
    stage_completions: stageCompletions,
    acceptance_results: acceptanceResults,
    expected_acceptance_ids: expectedAcceptanceIds,
    verify_confirmation: confirmation,
  });
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

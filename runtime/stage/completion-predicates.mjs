import { createHash } from "node:crypto";
import { isMaterialOnlySnapshotDelta, isStageMaterialOnlySnapshotDelta, materialRevisionFromValues } from "../task/git-worktree-snapshot.mjs";
import { CURRENT_MATERIAL_FILES } from "../task/material-workspace.mjs";
import { validateVerifyLeaves } from "../evidence/quality-store.mjs";
import { validateAcceptanceEvidence } from "../evidence/acceptance-evidence-validator.mjs";

const STAGES = ["make-decision", "build-spec", "build-plan", "build-code", "verify-code"];
const DERIVED = new WeakSet();
const SHA256 = /^[a-f0-9]{64}$/;
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

/**
 * A prior stage owns only the material it could have seen.  Later material
 * files may therefore be added without invalidating that stage, while any
 * source change or edit to an owned material still makes its facts stale.
 */
export function isStageSnapshotCurrent(stage, expectedTree, actualTree, { snapshotRoot = null, taskId = null } = {}) {
  if (expectedTree === actualTree) return true;
  if (!snapshotRoot || typeof taskId !== "string" || taskId.trim() === "") return false;
  const downstreamMaterials = CURRENT_MATERIAL_FILES.filter((file) => !STAGE_FACT_MATERIALS[stage]?.includes(file));
  return isStageMaterialOnlySnapshotDelta(snapshotRoot, expectedTree, actualTree, {
    taskId,
    downstreamMaterials,
    allowNonMaterialChanges: !new Set(["build-code", "verify-code"]).has(stage),
  });
}

export const STAGE_PREDICATES = Object.freeze({
  "make-decision": Object.freeze({
    scope: "acceptance_criterion",
    non_goals: "acceptance_criterion", risks: "acceptance_criterion",
    ui_applicability: "acceptance_criterion",
    requirement_coverage: "acceptance_criterion",
    goal_achievement: "acceptance_criterion",
    acceptance_clarity: "acceptance_criterion",
    solution_convergence: "acceptance_criterion",
    plain_language_card: "acceptance_criterion",
    outline_closed: "acceptance_criterion",
    stage_end_spec_analyze: "acceptance_criterion",
    human_confirmation: "confirmation",
  }),
  "build-spec": Object.freeze({
    zero_major_ambiguities: "acceptance_criterion",
    clarify: "acceptance_criterion",
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

const FINDING_TERMINAL_STATUSES = new Set(["fixed", "rejected_invalid", "user_decided", "accepted_risk"]);
const FINDING_NEXT_ACTIONS = new Set(["ask_user", "return_to_make_decision", "return_to_spec"]);
const ATTEMPT_STATUSES = new Set(["executed", "failed", "unavailable"]);

/**
 * Validate the finding-level state machine without creating a new persisted
 * state machine. `needs_human` is observable pause state only; completion can
 * be reached through the four explicitly bound terminal routes.
 */
export function validateFindingDispositionState(disposition = {}, { authorizedRiskFindingIds = [] } = {}) {
  const value = disposition && typeof disposition === "object" && !Array.isArray(disposition) ? disposition : {};
  const errors = [];
  const status = value.status;
  if (status === "needs_human") {
    if (!FINDING_NEXT_ACTIONS.has(value.next_action)) errors.push("needs_human_requires_next_action");
    if (value.completion_status === "completed" || value.formally_complete === true) errors.push("needs_human_cannot_be_formally_complete");
  } else if (!FINDING_TERMINAL_STATUSES.has(status)) {
    errors.push("finding_disposition_status_is_not_terminal");
  }
  if (status === "accepted_risk") {
    if (!new Set(authorizedRiskFindingIds).has(value.finding_id)) errors.push("accepted_risk_requires_authorized_finding");
    if (typeof value.risk_acceptance_ref !== "string" || value.risk_acceptance_ref.trim() === "") errors.push("accepted_risk_requires_authorization_receipt");
    if (typeof value.risk_ref !== "string" || value.risk_ref.trim() === "") errors.push("accepted_risk_requires_risk_record");
  }
  if (status === "user_decided") {
    if (typeof value.finding_id !== "string" || value.finding_id.trim() === "") errors.push("user_decided_requires_finding_id");
    if (!/^[a-f0-9]{64}$/.test(value.card_hash ?? "")) errors.push("user_decided_requires_card_hash");
    if (typeof value.reply_ref !== "string" || value.reply_ref.trim() === "") errors.push("user_decided_requires_reply_ref");
  }
  const uniqueErrors = [...new Set(errors)];
  return Object.freeze({
    ok: uniqueErrors.length === 0,
    status: uniqueErrors.length > 0 ? "incomplete" : status === "needs_human" ? "paused" : "terminal",
    completion_status: uniqueErrors.length > 0 || status === "needs_human" ? "incomplete" : "completed",
    errors: Object.freeze(uniqueErrors),
  });
}

/** Keep provider/attempt availability separate from finding disposition facts. */
export function separateAttemptFindingFacts({ attempt_status, attempt_error = null, findings = [] } = {}) {
  const errors = [];
  const status = ATTEMPT_STATUSES.has(attempt_status) ? attempt_status : "unavailable";
  if (!ATTEMPT_STATUSES.has(attempt_status)) errors.push("attempt_status_is_invalid");
  const safeFindings = Array.isArray(findings) ? findings : [];
  if (status === "unavailable" && safeFindings.length > 0) errors.push("attempt_unavailable_does_not_create_findings");
  return Object.freeze({
    attempt: Object.freeze({ status, ...(attempt_error ? { error: attempt_error } : {}) }),
    findings: Object.freeze(status === "unavailable" ? [] : [...safeFindings]),
    errors: Object.freeze(errors),
  });
}

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

// Acceptance facts are append-only too. A single build-code/verify attempt
// may first record an unavailable/missing leaf and then record its repaired
// result for the same current material. Product release must project the
// latest uniquely ordered terminal, just like stage completion does; keeping
// every historical leaf here would turn a repaired criterion into a false
// conflict. Facts without a recorded_at remain ambiguous and are deliberately
// left as-is so legacy duplicate inputs still fail closed.
function selectLatestAcceptanceCandidates(candidates) {
  if (candidates.length <= 1) return { status: "selected", candidates };
  const ranked = candidates.map((candidate) => ({
    candidate,
    recordedAt: Date.parse(candidate?.value?.recorded_at ?? ""),
  }));
  if (ranked.some(({ recordedAt }) => !Number.isFinite(recordedAt))) {
    return { status: "conflict", candidates };
  }
  const latestRecordedAt = Math.max(...ranked.map(({ recordedAt }) => recordedAt));
  const latest = ranked.filter(({ recordedAt }) => recordedAt === latestRecordedAt).map(({ candidate }) => candidate);
  return latest.length === 1
    ? { status: "selected", candidates: latest }
    : { status: "conflict", candidates };
}

export function deriveStageCompletion(stage, observations = [], {
  requireStageOutcome = false,
  stageOutcomeStatus = null,
  // vNext current tasks opt into the outline contract explicitly at the
  // caller boundary.  Leaving this unset keeps immutable legacy projections
  // readable while avoiding a marker-string bypass for current tasks.
  requireOutline = null,
} = {}) {
  if (!STAGES.includes(stage)) throw new TypeError(`unsupported stage: ${stage}`);
  if (!Array.isArray(observations)) throw new TypeError("completion observations must be an array");
  const outlineObserved = observations.some((observation) => {
    const fact = observation?.fact?.value ?? observation?.fact;
    return fact?.stage === stage
      && fact.kind === "acceptance_criterion"
      && fact.subject === "outline_closed";
  });
  const outlineRequired = stage === "make-decision" && (requireOutline === true || (requireOutline === null && outlineObserved));
  const requirements = {
    ...STAGE_PREDICATES[stage],
    // UI applicability is a new conditional subject. Current make-decision
    // handler runs always publish it (including an explicit missing fact),
    // while historical observations that predate the fact remain readable.
    ...(stage === "make-decision" && !observations.some((observation) => {
      const fact = observation?.fact?.value ?? observation?.fact;
      return fact?.stage === stage
        && fact.kind === "acceptance_criterion"
        && fact.subject === "ui_applicability";
    }) ? { ui_applicability: undefined } : {}),
    // Pre-outline historical tasks have no `outline_closed` fact at all. Do
    // not reinterpret those immutable records as a failed current attempt;
    // once the current OI authority is present the handler always publishes
    // the subject and it becomes a mandatory predicate, including a current
    // missing fact with an explicit stage-quality-missing evidence leaf.
    ...(stage === "make-decision" && !outlineRequired ? { outline_closed: undefined } : {}),
    // UI design is conditional. The official build-spec handler reads the
    // current decision-log UI fact and only publishes this subject for that
    // logged UI branch; quality facts do not duplicate applicability data.
    ...(stage === "build-spec" && observations.some((observation) => {
      const fact = observation?.fact?.value ?? observation?.fact;
      return fact?.stage === stage
        && fact.kind === "acceptance_criterion"
        && fact.subject === "ui_design";
    }) ? { ui_design: "acceptance_criterion" } : {}),
    // E2E acceptance is conditional on a current build-code execution fact.
    // The verify handler emits this subject only after private canonical
    // readers have authenticated its execution/review/confirmation chain.
    ...(stage === "verify-code" && observations.some((observation) => {
      // Historical or stale E2E facts must not turn on a current verify-code
      // requirement.  The fact is only a conditional predicate when the
      // current authenticated projection actually published it.
      if (observation?.authenticated !== true || observation?.freshness?.status !== "current") return false;
      const fact = observation?.fact?.value ?? observation?.fact;
      return fact?.stage === stage
        && fact.kind === "acceptance_criterion"
        && fact.subject === "e2e_acceptance";
    }) ? { e2e_acceptance: "acceptance_criterion" } : {}),
  };
  if (requirements.ui_applicability === undefined) delete requirements.ui_applicability;
  if (requirements.outline_closed === undefined) delete requirements.outline_closed;
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
  const stageOutcomeMissing = requireStageOutcome && !["completed", "conflict"].includes(stageOutcomeStatus);
  const stageOutcomeConflict = requireStageOutcome && stageOutcomeStatus === "conflict";
  if (stageOutcomeMissing) missing.push("stage_outcome");
  const predicates = Object.fromEntries(Object.keys(requirements).map((subject) => [
    subject, Object.freeze({
      kind: requirements[subject],
      status: conflicts.has(subject) ? "conflict" : satisfied.has(subject) ? "satisfied" : "missing",
      fact_ref: satisfied.get(subject)?.fact?.ref ?? null,
    }),
  ]));
  if (requireStageOutcome) {
    predicates.stage_outcome = Object.freeze({
      kind: "stage_outcome",
      status: stageOutcomeConflict ? "conflict" : stageOutcomeMissing ? "missing" : "satisfied",
      fact_ref: null,
    });
  }
  const result = Object.freeze({
    stage,
    status: missing.length === 0 && conflicts.size === 0 && !stageOutcomeConflict ? "completed" : "in_progress",
    predicates: Object.freeze(predicates),
    fact_refs: Object.freeze([...satisfied.values()].map((entry) => entry.fact.ref).sort()),
    missing: Object.freeze(missing),
    ...(stageOutcomeConflict ? { conflicts: Object.freeze(["stage_outcome"]) } : {}),
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

function canonicalStageOutcomeRef(ref) {
  return typeof ref === "string" && /^quality\/evidence\/stage-outcomes\/(?:make-decision|build-spec|build-plan|build-code|verify-code)\/[a-f0-9]{64}\.json$/.test(ref);
}

/**
 * Resolve stage-outcome refs through the already authenticated current
 * quality-fact chain.  A quality fact is not allowed to point at an outcome
 * merely by caller input: acceptance facts use their stage-quality evidence
 * chain, while verify-code's existing code_review fact binds the nested
 * dsh-review ref/hash carried by the outcome.  This is read-only and creates
 * no additional ledger.
 */
export function deriveFactBoundStageOutcomeRefs({
  observations = [],
  read,
  stage_outcome_refs: stageOutcomeRefs = {},
  task_id: taskId,
  snapshot_tree: snapshotTree,
  material_revision: materialRevision,
} = {}) {
  if (!Array.isArray(observations)) throw new TypeError("quality fact observations must be an array");
  if (typeof read !== "function") throw new TypeError("quality fact chain reader is required");
  const allowed = new Map(Object.entries(stageOutcomeRefs).map(([stage, refs]) => [stage, new Set(Array.isArray(refs) ? refs : [])]));
  const bound = new Map([...allowed.keys()].map((stage) => [stage, new Map()]));
  const invalid = new Set();
  const add = (stage, ref, hash) => {
    if (!allowed.has(stage) || !canonicalStageOutcomeRef(ref) || !allowed.get(stage).has(ref) || !SHA256.test(hash ?? "")) return;
    const prior = bound.get(stage).get(ref);
    if (prior !== undefined && prior !== hash) invalid.add(stage);
    bound.get(stage).set(ref, hash);
  };
  const readJson = (ref, hash) => {
    const raw = read(ref);
    if (hash && sha256(raw) !== hash) throw new Error("quality evidence hash mismatch");
    return { raw, value: JSON.parse(raw) };
  };
  const bindVerifyCodeReviewOutcome = (fact, evidenceEntries) => {
    if (fact.stage !== "verify-code" || fact.kind !== "review" || fact.subject !== "code_review") return;
    for (const evidence of evidenceEntries) {
      if (evidence?.evidence_type !== "review_result"
          || typeof evidence.ref !== "string"
          || !SHA256.test(evidence.sha256 ?? "")) continue;
      for (const ref of allowed.get("verify-code") ?? []) {
        try {
          const { raw, value } = readJson(ref);
          const refHash = ref.slice(ref.lastIndexOf("/") + 1, -5);
          if (sha256(raw) !== refHash
              || value?.task_id !== taskId
              || value?.stage !== "verify-code"
              || value?.snapshot_tree !== snapshotTree
              || value?.material_revision !== materialRevision) continue;
          const nestedReview = value.code_review ?? value.value?.code_review;
          if (nestedReview?.quality_review_ref === evidence.ref
              && nestedReview?.quality_review_hash === evidence.sha256) {
            add("verify-code", ref, refHash);
          }
        } catch {
          // The full outcome authenticator remains the final integrity
          // boundary; malformed candidates simply cannot establish a bind.
        }
      }
    }
  };
  for (const observation of observations) {
    if (observation?.authenticated !== true || observation?.freshness?.status !== "current") continue;
    const fact = observation.fact?.value ?? observation.fact;
    if (!fact || fact.task_id !== taskId || fact.snapshot_tree !== snapshotTree || fact.material_revision !== materialRevision) continue;
    const evidenceEntries = Array.isArray(fact.evidence) ? fact.evidence : [];
    bindVerifyCodeReviewOutcome(fact, evidenceEntries);
    for (const evidence of evidenceEntries) {
      if (evidence?.evidence_type !== "acceptance_evidence" || typeof evidence.ref !== "string" || !SHA256.test(evidence.sha256 ?? "")) continue;
      try {
        const wrapper = readJson(evidence.ref, evidence.sha256).value;
        if (wrapper?.schema_version !== "acceptance-evidence.v1" || wrapper.snapshot_tree !== snapshotTree || wrapper.freshness?.status !== "current" || wrapper.freshness.snapshot_tree !== snapshotTree || wrapper.freshness.material_revision !== materialRevision) continue;
        const stageQualityRefs = Array.isArray(wrapper.refs) ? wrapper.refs : [];
        for (const stageQuality of stageQualityRefs) {
          if (typeof stageQuality?.ref !== "string" || !SHA256.test(stageQuality.sha256 ?? "") || !/^quality\/evidence\/stage-quality\//.test(stageQuality.ref)) continue;
          const stageQualityValue = readJson(stageQuality.ref, stageQuality.sha256).value;
          const stage = stageQualityValue?.stage;
          if (!allowed.has(stage) || stageQualityValue.schema_version !== "stage-quality-evidence.v1"
              || stageQualityValue.task_id !== taskId || stageQualityValue.snapshot_tree !== snapshotTree
              || stageQualityValue.material_revision !== materialRevision) continue;
          const candidates = [];
          const subjectFact = stageQualityValue.subject_fact;
          for (const entry of subjectFact?.evidence_refs ?? []) candidates.push(entry);
          const executionBinding = subjectFact?.execution_binding;
          if (executionBinding) candidates.push({ ref: executionBinding.stage_outcome_ref, sha256: executionBinding.stage_outcome_hash });
          for (const entry of candidates) add(stage, entry?.ref, entry?.sha256 ?? entry?.hash);
        }
      } catch {
        // A malformed chain is not a current binding. Keep it unavailable;
        // the full outcome authenticator remains the final integrity boundary.
      }
    }
  }
  const selected = {};
  const conflicts = {};
  for (const [stage, refs] of allowed.entries()) {
    const entries = [...(bound.get(stage)?.entries() ?? [])];
    if (invalid.has(stage) || entries.length > 1) {
      selected[stage] = [];
      conflicts[stage] = true;
    } else {
      selected[stage] = entries.map(([ref]) => ref);
      conflicts[stage] = false;
    }
  }
  return Object.freeze({ refs: Object.freeze(selected), conflicts: Object.freeze(conflicts) });
}

function executionSemanticSignature(value) {
  const stepOutcomes = (Array.isArray(value?.step_outcomes) ? value.step_outcomes : [])
    .map((entry) => ({
      step_id: entry?.step_id ?? null,
      step_slug: entry?.step_slug ?? null,
      status: entry?.status ?? null,
    }))
    .sort((left, right) => `${left.step_id}\0${left.step_slug}`.localeCompare(`${right.step_id}\0${right.step_slug}`));
  const skillOutcomes = (Array.isArray(value?.skill_outcomes) ? value.skill_outcomes : [])
    .map((entry) => ({
      skill_id: entry?.skill_id ?? null,
      status: entry?.status ?? null,
      trigger: entry?.trigger ?? null,
      executed: entry?.executed ?? null,
    }))
    .sort((left, right) => String(left.skill_id).localeCompare(String(right.skill_id)));
  return JSON.stringify({
    task_id: value?.task_id ?? null,
    stage: value?.stage ?? null,
    run_id: value?.run_id ?? null,
    snapshot_tree: value?.snapshot_tree ?? null,
    material_revision: value?.material_revision ?? null,
    material_scope_revision: value?.material_scope_revision ?? null,
    steps_manifest_hash: value?.steps_manifest_hash ?? null,
    skills_manifest_hash: value?.skills_manifest_hash ?? null,
    status: value?.status ?? null,
    step_outcomes: stepOutcomes,
    skill_outcomes: skillOutcomes,
  });
}

/**
 * Project current authenticated stage outcomes by semantic content. Retry
 * identity, producer/session, timing, cost and evidence refs are deliberately
 * excluded from the comparison signature. Result summaries, prose,
 * analyzer/review details, coordination text and evidence refs belong to
 * quality consumers, not execution identity. This is a read-only projection
 * and never becomes a completion predicate by itself.
 */
export function deriveExecutionOutcomes({
  task_id: taskId,
  read,
  stage_outcome_refs: stageOutcomeRefs = {},
  snapshot_tree: snapshotTree,
  material_revision: materialRevision,
  material_scope_revisions: materialScopeRevisions = {},
  snapshot_root: snapshotRoot = null,
  authenticate,
} = {}) {
  if (typeof read !== "function") throw new TypeError("stage-outcome reader is required");
  if (typeof authenticate !== "function") throw new TypeError("stage-outcome authenticator is required");
  return Object.freeze(Object.fromEntries(STAGES.map((stage) => {
    const refs = Array.isArray(stageOutcomeRefs[stage]) ? stageOutcomeRefs[stage] : [];
    const current = [];
    const seenAttempts = new Map();
    let replayConflict = false;
    let invalidCurrent = false;
    const invalidRefs = [];
    const currentRunId = `vnext-${sha256(`${taskId}\0${stage}`).slice(0, 32)}`;
    for (const ref of refs) {
      if (typeof ref !== "string" || !new RegExp(`^quality/evidence/stage-outcomes/${stage}/[a-f0-9]{64}\\.json$`).test(ref)) continue;
      let raw;
      let value;
      try {
        raw = read(ref);
        value = JSON.parse(raw);
      } catch {
        invalidCurrent = true;
        invalidRefs.push(ref);
        continue;
      }
      const refHash = ref.slice(ref.lastIndexOf("/") + 1, -5);
      const sameTaskStage = value?.task_id === taskId && value?.stage === stage;
      const currentRun = sameTaskStage && value?.run_id === currentRunId;
      const currentSnapshot = sameTaskStage && isStageSnapshotCurrent(stage, value?.snapshot_tree, snapshotTree, {
        snapshotRoot,
        taskId,
      });
      const hasCurrentScopeRevision = Object.prototype.hasOwnProperty.call(materialScopeRevisions, stage)
        && materialScopeRevisions[stage] !== undefined;
      const hasCurrentMaterialRevision = materialRevision !== undefined && materialRevision !== null;
      const currentMaterial = sameTaskStage
        && (hasCurrentScopeRevision
          ? value?.material_scope_revision === materialScopeRevisions[stage]
          : hasCurrentMaterialRevision
            ? value?.material_revision === materialRevision
            : true);
      if (sha256(raw) !== refHash) {
        if (currentRun && currentSnapshot && currentMaterial) {
          invalidCurrent = true;
          invalidRefs.push(ref);
        }
        continue;
      }
      if (!sameTaskStage || !currentRun || !currentSnapshot || !currentMaterial) continue;
      try {
        const authenticated = authenticate({ stage, ref, raw, value });
        if (authenticated === null || authenticated === undefined) continue;
        const normalized = authenticated.value ?? authenticated;
        if (!normalized || typeof normalized !== "object" || Array.isArray(normalized)) throw new Error("authenticated stage outcome is not an object");
        if (typeof normalized.attempt_id === "string" && normalized.attempt_id.trim() !== "") {
          const rawHash = sha256(raw);
          const previous = seenAttempts.get(normalized.attempt_id);
          if (previous !== undefined && previous !== rawHash) replayConflict = true;
          seenAttempts.set(normalized.attempt_id, rawHash);
        }
        current.push({ ref, value: normalized, signature: executionSemanticSignature(normalized) });
      } catch {
        invalidCurrent = true;
        invalidRefs.push(ref);
      }
    }
    const refsForOutput = [...new Set([...current.map(({ ref }) => ref), ...invalidRefs])].sort();
    const completed = current.filter(({ value }) => value.status === "completed");
    const completedSignatures = new Set(completed.map(({ signature }) => signature));
    const base = {
      blocking: false,
      attempt_count: current.length,
      completed_attempt_count: completed.length,
      refs: refsForOutput,
    };
    if (invalidCurrent) return [stage, Object.freeze({ ...base, status: "failed", diagnostic: { kind: "conflict", code: "execution_outcome_integrity_failed", reason: "current authenticated outcome bytes or binding are invalid", refs: refsForOutput } })];
    if (replayConflict) return [stage, Object.freeze({ ...base, status: "failed", diagnostic: { kind: "conflict", code: "execution_replay_conflict", reason: "one attempt id is bound to different immutable outcome bytes", refs: refsForOutput } })];
    if (completedSignatures.size > 1) {
      return [stage, Object.freeze({ ...base, status: "failed", diagnostic: { kind: "ambiguous", code: "execution_outcome_ambiguous", reason: "current completed outcomes have different semantic signatures", refs: refsForOutput } })];
    }
    if (completed.length > 0) return [stage, Object.freeze({ ...base, status: "completed" })];
    if (current.some(({ value }) => value.status === "failed")) return [stage, Object.freeze({ ...base, status: "failed" })];
    if (current.some(({ value }) => value.status === "incomplete")) return [stage, Object.freeze({ ...base, status: "incomplete" })];
    return [stage, Object.freeze({ ...base, status: "unavailable" })];
  })));
}

/**
 * Project the current authenticated stage-outcome envelope without creating
 * another persisted ledger.  A stage outcome is current when its content
 * hash, task/stage identity, stage-owned material scope, and stage snapshot
 * all match the current task.  Multiple current completed envelopes are a
 * conflict; an unavailable/incomplete envelope never satisfies completion.
 */
export function deriveStageOutcomeStatuses({
  task_id: taskId,
  read,
  stage_outcome_refs: stageOutcomeRefs = {},
  snapshot_tree: snapshotTree,
  material_revision: materialRevision,
  material_scope_revisions: materialScopeRevisions = {},
  snapshot_root: snapshotRoot = null,
  authenticate,
  quality_fact_observations: qualityFactObservationsAlias,
  qualityFactObservations: directQualityFactObservations,
} = {}) {
  if (typeof read !== "function") throw new TypeError("stage-outcome reader is required");
  if (typeof authenticate !== "function") throw new TypeError("stage-outcome authenticator is required");
  let projectedRefs = stageOutcomeRefs;
  let factBindingConflicts = {};
  const qualityFactObservations = qualityFactObservationsAlias ?? directQualityFactObservations;
  if (qualityFactObservations !== undefined) {
    const bound = deriveFactBoundStageOutcomeRefs({
      observations: qualityFactObservations ?? [],
      read,
      stage_outcome_refs: stageOutcomeRefs,
      task_id: taskId,
      snapshot_tree: snapshotTree,
      material_revision: materialRevision,
    });
    projectedRefs = bound.refs;
    factBindingConflicts = bound.conflicts;
    // No quality-fact binding means no current outcome selection.  Immutable
    // retry siblings remain readable, but a sole unbound ref is not promoted
    // by array cardinality, mtime, hash order, or caller choice.
  }
  return Object.freeze(Object.fromEntries(STAGES.map((stage) => {
    if (factBindingConflicts[stage]) return [stage, "conflict"];
    const refs = Array.isArray(projectedRefs[stage]) ? projectedRefs[stage] : [];
    const candidates = [];
    let invalidCurrent = false;
    const currentRunId = `vnext-${sha256(`${taskId}\0${stage}`).slice(0, 32)}`;
    for (const ref of refs) {
      if (typeof ref !== "string" || !new RegExp(`^quality/evidence/stage-outcomes/${stage}/[a-f0-9]{64}\\.json$`).test(ref)) continue;
      let raw;
      let value;
      try {
        raw = read(ref);
        value = JSON.parse(raw);
      } catch {
        continue;
      }
      const refHash = ref.slice(ref.lastIndexOf("/") + 1, -5);
      const sameTaskStage = value?.task_id === taskId && value?.stage === stage;
      const currentRun = sameTaskStage && value?.run_id === currentRunId;
      const currentSnapshot = sameTaskStage && isStageSnapshotCurrent(stage, value?.snapshot_tree, snapshotTree, {
        snapshotRoot,
        taskId,
      });
      const hasCurrentScopeRevision = Object.prototype.hasOwnProperty.call(materialScopeRevisions, stage)
        && materialScopeRevisions[stage] !== undefined;
      const hasCurrentMaterialRevision = materialRevision !== undefined && materialRevision !== null;
      const currentMaterial = sameTaskStage
        && (hasCurrentScopeRevision
          ? value?.material_scope_revision === materialScopeRevisions[stage]
          : hasCurrentMaterialRevision
            ? value?.material_revision === materialRevision
            : true);
      if (sha256(raw) !== refHash) {
        // A content-addressed ref that declares the current run but whose
        // bytes no longer match is a current integrity failure only when the
        // envelope also claims the current snapshot. A deterministic
        // workflow run id is reused across retries, so an older valid
        // snapshot from that run is historical, not a second current
        // candidate. Foreign or historical siblings remain non-authoritative
        // and are ignored.
        if (currentRun && currentSnapshot && currentMaterial) invalidCurrent = true;
        continue;
      }
      // The stage run id is deterministic for the task/stage, while each
      // retry gets a new immutable envelope. Select only the envelope bound
      // to both the derived run and a stage-current worktree snapshot; otherwise
      // a previous retry would make status report stage_outcome missing even
      // though the latest authenticated outcome exists.
      if (!sameTaskStage || !currentRun || !currentSnapshot || !currentMaterial) continue;
      try {
        // The callback is the single full authentication boundary.  This
        // projector must never turn a shallow JSON shape check into close or
        // release authority. A null result means the authenticator classified
        // the ref as foreign/stale; an exception means the current candidate
        // was malformed and must remain incomplete.
        const authenticated = authenticate({ stage, ref, raw, value });
        if (authenticated === null || authenticated === undefined) continue;
        const normalized = authenticated.value ?? authenticated;
        if (!normalized || typeof normalized !== "object" || Array.isArray(normalized)) throw new Error("authenticated stage outcome is not an object");
        candidates.push(normalized.status === "completed" ? "completed" : normalized.status ?? "incomplete");
      } catch {
        invalidCurrent = true;
      }
    }
    if (invalidCurrent) return [stage, "incomplete"];
    if (candidates.filter((status) => status === "completed").length > 1) return [stage, "conflict"];
    if (candidates.includes("completed")) return [stage, "completed"];
    return [stage, candidates[0] ?? "unavailable"];
  })));
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
 * inferred. Verify-code does not require a second human confirmation of the
 * code-review result; irreversible close authorization is handled by the
 * close-plan path instead.
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
  stage_outcome_statuses: stageOutcomeStatuses = null,
  require_outline: requireOutline = null,
} = {}) {
  if (typeof read !== "function") throw new TypeError("product-release quality fact reader is required");
  const stageObservations = new Map(STAGES.map((stage) => [stage, []]));
  const acceptanceCandidates = new Map();
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
    const snapshotCurrent = isStageSnapshotCurrent(value?.stage, value?.snapshot_tree, snapshotTree, { snapshotRoot, taskId });
    const scopeMatchesStage = value?.material_scope === undefined
      || JSON.stringify(value.material_scope) === JSON.stringify(STAGE_FACT_MATERIALS[value.stage]);
    const acMaterialOnlyRevision = value?.kind === "acceptance_criterion"
      && value.material_scope === undefined
      && value.material_scope_revision === undefined
      && value.material_revision !== materialRevision
      && value.snapshot_tree === snapshotTree;
    const factMaterialCurrent = !scopeMatchesStage
      ? false
      : value?.material_scope_revision !== undefined
        ? value.material_scope_revision === materialScopeRevisions[value.stage]
        : value?.material_revision === materialRevision || acMaterialOnlyRevision;
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
  }
  const stageCompletions = STAGES.map((stage) => {
    const observations = stageObservations.get(stage) ?? [];
    const completion = deriveStageCompletion(stage, observations, {
      requireStageOutcome: stageOutcomeStatuses !== null,
      stageOutcomeStatus: stageOutcomeStatuses?.[stage] ?? "unavailable",
      requireOutline: stage === "make-decision" ? requireOutline : null,
    });
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
    const stageSelection = selectLatestAcceptanceCandidates(candidates.filter(({ source }) => source === "stage-fact"));
    const stageCandidates = stageSelection.candidates;
    // Verify summary candidates are already a single authenticated summary in
    // the canonical store. Keep that authority even though its synthetic
    // product leaf has no event timestamp; only stage facts need historical
    // ordering here.
    const orderedVerifyCandidates = verifyCandidates;
    if (stageSelection.status === "conflict") return [...orderedVerifyCandidates, ...stageCandidates];
    if (orderedVerifyCandidates.length === 0) return stageCandidates;
    // The verify summary is the final product AC authority. A matching
    // stage leaf is only a fallback and must not become a duplicate
    // candidate; a disagreement remains visible as an explicit conflict.
    const outcome = (candidate) => {
      const value = candidate.value;
      const result = value.result ?? (value.status === "passed" ? "pass" : value.status);
      const status = value.status ?? (result === "pass" ? "passed" : result);
      return `${result}:${status}`;
    };
    const verifyOutcome = outcome(orderedVerifyCandidates[0]);
    const conflictingStageFact = stageCandidates.find((candidate) => outcome(candidate) !== verifyOutcome);
    return conflictingStageFact === undefined
      ? orderedVerifyCandidates
      : [...orderedVerifyCandidates, conflictingStageFact];
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

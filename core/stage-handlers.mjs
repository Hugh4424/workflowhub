import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import { validateAcceptanceEvidence } from "./canonical-receipt-writer.mjs";
import { minimumReviewersFor } from "../skills/wh-review/scripts/review-materials.mjs";
import { parseReviewerOutput } from "../skills/wh-review/scripts/review-output.mjs";
import { aggregateProviderResults } from "../skills/wh-review/scripts/review-result.mjs";
import { validateSchema } from "../skills/wh-review/scripts/schema-validator.mjs";

const HANDLERS = new Map();
const hashText = (value) => createHash("sha256").update(value).digest("hex");
const RECEIPT_SCHEMA = "workflowhub-receipt.v1";
const NAMESPACE = Object.freeze({
  decision: "receipts/", spec: "receipts/", plan: "receipts/", tasks: "receipts/",
  implementation: "receipts/", tests: "receipts/", review: "reviews/results/",
  direction_review: "reviews/results/", detail_review: "reviews/results/", evidence: "evidence/",
});
const EXPECTED_COMPONENT = Object.freeze({ decision: "decision", spec: "spec", plan: "plan", tasks: "tasks", implementation: "implementation", evidence: "evidence" });
const REVIEW_RESULT_REF = /^reviews\/results\/[a-zA-Z0-9._-]+\.json$/;
const REVIEW_ATTEMPT_REF = /^reviews\/attempts\/([a-zA-Z0-9._-]+)\/attempt\.json$/;
const SHA256 = /^[a-f0-9]{64}$/;
const REVIEW_NAMES = new Set(["review", "direction_review", "detail_review"]);
const object = (value, label) => { if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${label} must be an object`); return value; };
const text = (value, label) => { if (typeof value !== "string" || value.trim() === "") throw new TypeError(`${label} must be non-empty`); return value; };
const reviewName = (name) => REVIEW_NAMES.has(name);
function validReceiptRef(name, ref) {
  if (typeof ref !== "string" || ref.includes("..") || !ref.endsWith(".json")) return false;
  if (reviewName(name)) return REVIEW_RESULT_REF.test(ref) || REVIEW_ATTEMPT_REF.test(ref);
  return Boolean(NAMESPACE[name] && ref.startsWith(NAMESPACE[name]));
}
function receipt(worker, invocation, name, producerStage = worker.stage) {
  const ref = text(object(invocation.receipts, "receipts")[name], `${name} receipt ref`);
  const namespace = NAMESPACE[name];
  if (!validReceiptRef(name, ref)) {
    throw new Error(`${name} receipt ref is outside its canonical ${namespace ?? "unknown"} namespace`);
  }
  const record = object(worker.readReceipt(ref), `${name} receipt record`);
  const value = object(record.value, `${name} receipt`);
  text(record.sha256, `${name} receipt hash`);
  if (reviewName(name)) {
    validateSchema(REVIEW_ATTEMPT_REF.test(ref) ? "attempt" : "result", value);
  } else {
    if (value.schema_version !== RECEIPT_SCHEMA) throw new Error(`${name} receipt schema_version must be ${RECEIPT_SCHEMA}`);
    const producer = object(value.producer, `${name} receipt producer provenance`);
    text(producer.component, `${name} receipt producer.component`);
    text(producer.version, `${name} receipt producer.version`);
    if (producer.stage !== producerStage) throw new Error(`${name} receipt producer stage mismatch`);
    if (producer.component !== EXPECTED_COMPONENT[name] && name !== "tests") throw new Error(`${name} receipt producer component is not official`);
  }
  if (value.task_id !== worker.identity.taskId) throw new Error(`${name} receipt task mismatch`);
  if (value.stage !== producerStage) throw new Error(`${name} receipt stage mismatch`);
  return { ref, value, evidence: { ref, sha256: record.sha256 } };
}
function testFacts(worker, invocation) { const item = receipt(worker, invocation, "tests"); text(item.value.command, "tests.command"); if (!Number.isInteger(item.value.exit_code)) throw new TypeError("tests.exit_code must be integer"); for (const key of ["command_hash", "snapshot_head", "snapshot_tree", "snapshot_commit", "started_at", "completed_at", "output_ref", "output_hash"]) text(item.value[key], `tests.${key}`); if (!item.value.output_ref.startsWith("evidence/") || item.value.output_ref.includes("..")) throw new Error("tests.output_ref must use canonical evidence namespace"); return { facts: { command: item.value.command, exit_code: item.value.exit_code, command_hash: item.value.command_hash, snapshot_head: item.value.snapshot_head, snapshot_tree: item.value.snapshot_tree, snapshot_commit: item.value.snapshot_commit, started_at: item.value.started_at, completed_at: item.value.completed_at, receipt_ref: item.ref, receipt_hash: item.evidence.sha256, output_ref: item.value.output_ref, output_hash: item.value.output_hash }, evidence: item.evidence }; }
function reviewMinimumForAttempt(attempt, producerStage, expectedTrack) {
  const policy = attempt.review_policy;
  if (policy?.source !== "wh_review.v2") return minimumReviewersFor(producerStage, expectedTrack ?? null);
  if (!Number.isSafeInteger(policy.minimum_heterologous) || policy.minimum_heterologous < 1) {
    throw new Error("wh_review.v2 attempt has an invalid minimum_heterologous");
  }
  return policy.minimum_heterologous;
}
function verifyReviewChain(worker, result, expectedTrack, producerStage = worker.stage) {
  const attemptRecord = object(worker.readReceipt(result.attempt_ref), "review attempt record");
  const attempt = object(attemptRecord.value, "review attempt");
  validateSchema("attempt", attempt);
  const attemptId = result.attempt_ref.match(/^reviews\/attempts\/([a-zA-Z0-9._-]+)\/attempt\.json$/)?.[1];
  if (!attemptId || attempt.attempt_id !== attemptId) throw new Error("review attempt_ref identity mismatch");
  for (const key of ["task_id", "stage", "review_track", "snapshot_tree", "material_id", "subject_kind", "phase_id", "review_scope", "base_tree", "candidate_tree"]) {
    if (attempt[key] !== result[key]) throw new Error(`review attempt/result ${key} mismatch`);
  }
  if (attempt.terminal_status !== "semantic" || attempt.error !== null) throw new Error("review attempt did not produce a semantic result");
  const minimumReviewers = reviewMinimumForAttempt(attempt, producerStage, expectedTrack);
  if (result.provider_results.length < minimumReviewers) throw new Error("review result has too few independent providers");
  const providers = new Set();
  const parsedResults = [];
  for (const providerResult of result.provider_results) {
    if (providers.has(providerResult.provider)) throw new Error(`duplicate review provider: ${providerResult.provider}`);
    providers.add(providerResult.provider);
    const providerAttempt = [...attempt.provider_attempts].reverse().find((entry) => entry.provider === providerResult.provider && entry.status === "completed" && typeof entry.output_ref === "string");
    if (!providerAttempt) throw new Error(`review provider ${providerResult.provider} has no completed attempt evidence`);
    const outputRecord = object(worker.readReceipt(providerAttempt.output_ref), `review provider ${providerResult.provider} output record`);
    const output = object(outputRecord.value, `review provider ${providerResult.provider} output`);
    if (output.schema_version !== "wh-review-provider-output.v1" || output.task_id !== worker.identity.taskId || output.stage !== producerStage || output.attempt_id !== attemptId || output.provider !== providerResult.provider || typeof output.content !== "string" || output.content_hash !== hashText(output.content)) {
      throw new Error(`review provider ${providerResult.provider} output provenance mismatch`);
    }
    const parsed = parseReviewerOutput(output.content, { requireEvidence: result.adjudication !== undefined });
    if (!isDeepStrictEqual(parsed, providerResult.output)) throw new Error(`review provider ${providerResult.provider} semantic output mismatch`);
    parsedResults.push({ provider: providerResult.provider, review: parsed });
  }
  const expectedProviderResults = parsedResults.sort((left, right) => left.provider.localeCompare(right.provider)).map((item) => ({ provider: item.provider, output: item.review }));
  if (!isDeepStrictEqual(result.provider_results, expectedProviderResults)) throw new Error("review result provider outputs do not match evidence");
  if (result.adjudication !== undefined) {
    const clusters = result.adjudication.clusters;
    for (const cluster of clusters) {
      if (!cluster.providers.every((provider) => providers.has(provider)) || !cluster.provider_findings.every(({ provider }) => providers.has(provider))) {
        throw new Error("review adjudication references an unknown provider");
      }
    }
    const expectedFindings = clusters.filter(({ disposition, severity }) => disposition === "actionable" || severity === "minor")
      .map((finding) => ({ provider: finding.providers[0], ...finding }));
    const expectedVerdict = clusters.some(({ disposition }) => disposition === "actionable") ? "revise_required" : "pass";
    if (result.verdict !== expectedVerdict || !isDeepStrictEqual(result.findings, expectedFindings)) throw new Error("review adjudication does not match its semantic verdict");
    return;
  }
  const aggregation = aggregateProviderResults(parsedResults, minimumReviewers);
  const legacyVerdict = expectedProviderResults.some(({ output }) => output.verdict === "revise_required") ? "revise_required" : "pass";
  const legacyFindings = expectedProviderResults.flatMap((item) => item.output.findings.map((finding) => ({ provider: item.provider, ...finding })));
  if (aggregation.status !== "semantic" || result.verdict !== legacyVerdict || !isDeepStrictEqual(result.findings, legacyFindings)) {
    throw new Error("review result aggregation does not match provider outputs");
  }
}
function verifyUnavailableReview(worker, item, expectedTrack, producerStage = worker.stage) {
  const attempt = item.value;
  const attemptId = item.ref.match(REVIEW_ATTEMPT_REF)?.[1];
  if (!attemptId || attempt.attempt_id !== attemptId) throw new Error("review attempt_ref identity mismatch");
  if (attempt.terminal_status !== "unavailable" || !attempt.error) throw new Error("review attempt ref must describe an unavailable review");
  if (!SHA256.test(item.evidence.sha256)) throw new Error("review unavailable attempt hash must be sha256");
  if (expectedTrack !== undefined && attempt.review_track !== expectedTrack) throw new Error(`review must use wh-review ${expectedTrack} track`);
  if (attempt.provider_attempts.length === 0) throw new Error("review unavailable attempt must contain provider attempts");
  const latestByProvider = new Map();
  for (const providerAttempt of attempt.provider_attempts) {
    let output = null;
    if (providerAttempt.output_ref !== null) {
      const providerPrefix = `reviews/attempts/${attemptId}/providers/`;
      const providerOutputName = providerAttempt.output_ref.slice(providerPrefix.length);
      if (!providerAttempt.output_ref.startsWith(providerPrefix) || !/^[a-zA-Z0-9._-]+\.output\.json$/.test(providerOutputName)) throw new Error(`review provider ${providerAttempt.provider} output ref provenance mismatch`);
      const outputRecord = object(worker.readReceipt(providerAttempt.output_ref), `review provider ${providerAttempt.provider} output record`);
      output = object(outputRecord.value, `review provider ${providerAttempt.provider} output`);
      if (!SHA256.test(outputRecord.sha256 ?? "")) throw new Error(`review provider ${providerAttempt.provider} output hash must be sha256`);
      if (output.schema_version !== "wh-review-provider-output.v1" || output.task_id !== worker.identity.taskId || output.stage !== producerStage || output.attempt_id !== attemptId || output.provider !== providerAttempt.provider || typeof output.content !== "string" || output.content_hash !== hashText(output.content)) {
        throw new Error(`review provider ${providerAttempt.provider} output provenance mismatch`);
      }
    }
    latestByProvider.set(providerAttempt.provider, { providerAttempt, output });
  }
  const recomputed = [...latestByProvider.entries()].map(([provider, latest]) => {
    if (latest.providerAttempt.status !== "completed" || latest.output === null) return { provider, review: null };
    try { return { provider, review: parseReviewerOutput(latest.output.content) }; }
    catch { return { provider, review: null }; }
  });
  const aggregation = aggregateProviderResults(recomputed, reviewMinimumForAttempt(attempt, producerStage, expectedTrack));
  if (aggregation.status !== "unavailable") throw new Error("review attempt claims unavailable but provider outputs produce a semantic result");
}

function reviewScope(value) {
  return {
    subject_kind: value.subject_kind,
    phase_id: value.phase_id,
    review_scope: value.review_scope,
    candidate_tree: value.candidate_tree,
  };
}
function scopeFacts(scope) {
  if (scope.review_scope === undefined || scope.review_scope === null) return {};
  return {
    subject_kind: scope.subject_kind,
    phase_id: scope.phase_id,
    review_scope: scope.review_scope,
  };
}
function requireFinalIntegrationReview(review, label) {
  const scope = review.scope;
  if (review.facts.status === "unavailable" || scope.subject_kind !== "worktree" || scope.review_scope !== "integration" || scope.phase_id !== null || scope.candidate_tree !== review.facts.snapshot_tree) {
    throw new Error(`MATERIAL_INCOMPLETE: ${label} must be a full-worktree result and a same-snapshot formal integration review (subject_kind=worktree, review_scope=integration, phase_id=null); return to build-code`);
  }
  return scope;
}
function requireStoredFinalIntegrationReview(review, label) {
  if (!review || review.status === "unavailable" || review.subject_kind !== "worktree" || review.review_scope !== "integration" || review.phase_id !== null) {
    throw new Error(`MATERIAL_INCOMPLETE: ${label} is missing the required build-code integration review scope; return to build-code`);
  }
  return review;
}
function reviewFacts(worker, invocation, name = "review", expectedTrack, producerStage = worker.stage) {
  const item = receipt(worker, invocation, name, producerStage);
  if (expectedTrack !== undefined && item.value.review_track !== expectedTrack) throw new Error(`${name} must use wh-review ${expectedTrack} track`);
  if (REVIEW_ATTEMPT_REF.test(item.ref)) {
    verifyUnavailableReview(worker, item, expectedTrack, producerStage);
    const code = text(item.value.error.code, `${name} unavailable error code`);
    const message = text(item.value.error.message, `${name} unavailable error message`);
    const scope = reviewScope(item.value);
    return {
      facts: {
        status: "unavailable", attempt_ref: item.ref, attempt_hash: item.evidence.sha256,
        snapshot_tree: item.value.snapshot_tree, material_id: item.value.material_id,
        error: { code, message }, ...(expectedTrack === undefined ? {} : { review_track: expectedTrack }), ...scopeFacts(scope),
      },
      evidence: item.evidence,
      scope,
      missing_items: [`review unavailable: ${code}: ${message}`],
    };
  }
  verifyReviewChain(worker, item.value, expectedTrack, producerStage);
  const scope = reviewScope(item.value);
  return {
    facts: { verdict: item.value.verdict, result_ref: item.ref, result_hash: item.evidence.sha256, snapshot_tree: item.value.snapshot_tree, ...(expectedTrack === undefined ? {} : { review_track: expectedTrack }), ...scopeFacts(scope) },
    evidence: item.evidence,
    scope,
    missing_items: item.value.verdict === "revise_required" ? ["review findings recorded; response evidence: unknown/unverified"] : [],
  };
}

/**
 * Audit notices intentionally stay out of `facts` and `evidence_refs`: an
 * optional response ledger cannot become a hidden acceptance contract. They
 * only make recorded accepted risk visible where a human already confirms.
 */
function acceptedRiskAuditNotices(worker, stage) {
  if (!new Set(["build-plan", "verify-code"]).has(stage) || typeof worker.listReviewAuditRefs !== "function" || typeof worker.readReviewAudit !== "function") return [];
  const notices = [];
  for (const ref of worker.listReviewAuditRefs()) {
    try {
      const audit = object(worker.readReviewAudit(ref).value, "review audit");
      if (audit.version !== "wh-review-resolution.v1" || audit.task_id !== worker.identity.taskId || audit.stage !== stage || audit.outcome !== "recorded_non_gate_response") continue;
      if (!Number.isSafeInteger(audit.accepted_risk_count) || audit.accepted_risk_count < 1) continue;
      notices.push(`accepted risk recorded in external wh-review audit: ${ref}; present it to the human confirmer`);
    } catch {
      notices.push(`review audit unreadable: ${ref}; response evidence: unknown/unverified`);
    }
  }
  return notices;
}

HANDLERS.set("make-decision", async (worker, input) => { const item = receipt(worker, input, "decision"), direction = reviewFacts(worker, input, "direction_review", "direction"), detail = reviewFacts(worker, input, "detail_review", "detail"); if (typeof item.value.decision_log !== "string" || item.value.decision_log.trim() === "" || item.value.content_hash !== hashText(item.value.decision_log)) throw new Error("decision-log content hash mismatch"); if (!worker.candidateWorkspace) throw new Error("verified CandidateWorkspace required"); const snapshot = worker.candidateWorkspace.captureSnapshot(); if (detail.facts.snapshot_tree !== snapshot.tree) throw new Error("detail review and CandidateWorkspace must bind the same snapshot tree"); return { facts: { worktree_root: worker.candidateWorkspace.worktreeRoot, baseline_commit: worker.candidateWorkspace.baselineCommit, snapshot_tree: snapshot.tree, decision_ref: item.ref, decision_hash: item.evidence.sha256, reviews: { direction: direction.facts, detail: detail.facts } }, evidence_refs: [item.evidence, direction.evidence, detail.evidence], missing_items: [...direction.missing_items, ...detail.missing_items] }; });
HANDLERS.set("build-spec", async (worker, input) => { const item = receipt(worker, input, "spec"), review = reviewFacts(worker, input); text(item.value.content, "spec content"); if (item.value.content_hash !== hashText(item.value.content)) throw new Error("spec content hash mismatch"); if (worker.readArtifact("spec.md") !== item.value.content) throw new Error("spec artifact differs from final receipt"); const checkpoint = worker.createCheckpoint("build-spec"); return { facts: { spec_ref: worker.artifactRef("spec.md"), checkpoint, review: review.facts }, evidence_refs: [item.evidence, review.evidence], missing_items: review.missing_items }; });
HANDLERS.set("build-plan", async (worker, input) => { const plan = receipt(worker, input, "plan"), tasks = receipt(worker, input, "tasks"), review = reviewFacts(worker, input); text(plan.value.content, "plan content"); text(tasks.value.content, "tasks content"); if (plan.value.content_hash !== hashText(plan.value.content) || tasks.value.content_hash !== hashText(tasks.value.content)) throw new Error("plan/tasks content hash mismatch"); if (worker.readArtifact("plan.md") !== plan.value.content || worker.readArtifact("tasks.md") !== tasks.value.content) throw new Error("plan/tasks artifacts differ from final receipts"); const checkpoint = worker.createCheckpoint("build-plan"); return { facts: { plan_ref: worker.artifactRef("plan.md"), tasks_ref: worker.artifactRef("tasks.md"), checkpoint, review: review.facts }, evidence_refs: [plan.evidence, review.evidence], missing_items: [...review.missing_items, ...acceptedRiskAuditNotices(worker, "build-plan")] }; });
HANDLERS.set("build-code", async (worker, input) => { const impl = receipt(worker, input, "implementation"), tests = testFacts(worker, input), review = reviewFacts(worker, input); if (!Array.isArray(impl.value.changed)) throw new TypeError("implementation.changed must be array"); for (const key of ["snapshot_head", "snapshot_tree", "snapshot_commit", "diff_ref", "diff_hash"]) text(impl.value[key], `implementation.${key}`); requireFinalIntegrationReview(review, "build-code final review"); if (impl.value.snapshot_tree !== tests.facts.snapshot_tree || review.facts.snapshot_tree !== tests.facts.snapshot_tree) throw new Error("implementation, tests, and review must bind the same Workspace snapshot tree"); const phase = impl.value.phase_completion; if (typeof phase !== "boolean" && (!phase || typeof phase !== "object" || Array.isArray(phase))) throw new TypeError("invalid phase_completion"); return { facts: { changed: impl.value.changed, tests: tests.facts, review: review.facts, phase_completion: phase }, evidence_refs: [impl.evidence, { ref: impl.value.diff_ref, sha256: impl.value.diff_hash }, tests.evidence, review.evidence], missing_items: review.missing_items }; });
HANDLERS.set("verify-code", async (worker, input) => { const tests = testFacts(worker, input), acceptedBuild = worker.readAcceptedBuildCode(), review = reviewFacts(worker, input, "review", undefined, "build-code"), evidence = receipt(worker, input, "evidence"); const current = worker.snapshotWorkspace(); const acceptedReview = requireStoredFinalIntegrationReview(acceptedBuild.facts.review, "verify-code active accepted build"); requireFinalIntegrationReview(review, "verify-code review"); const acceptedRef = acceptedReview.result_ref ?? acceptedReview.attempt_ref, acceptedHash = acceptedReview.result_hash ?? acceptedReview.attempt_hash; const reviewRef = review.facts.result_ref ?? review.facts.attempt_ref, reviewHash = review.facts.result_hash ?? review.facts.attempt_hash; if (acceptedRef !== reviewRef || acceptedHash !== reviewHash) throw new Error("verify-code review must reuse the active accepted build-code final review"); if (acceptedBuild.facts.tests?.snapshot_tree !== tests.facts.snapshot_tree || acceptedReview.snapshot_tree !== tests.facts.snapshot_tree) throw new Error("verify-code active accepted build tests, review, and current Workspace snapshot must match"); if (tests.facts.snapshot_tree !== review.facts.snapshot_tree || current.tree !== tests.facts.snapshot_tree) throw new Error("tests, review, and current Workspace snapshot must match"); if (!Array.isArray(evidence.value.refs)) throw new TypeError("evidence.refs must be array"); const criterionIds = new Set(), nestedEvidence = []; for (const [index, ref] of evidence.value.refs.entries()) { object(ref, `evidence.refs[${index}]`); text(ref.ref, `evidence.refs[${index}].ref`); text(ref.sha256, `evidence.refs[${index}].sha256`); if (!ref.ref.startsWith("evidence/") || ref.ref.includes("..")) throw new Error("evidence ref must use canonical evidence namespace"); const entity = object(worker.readReceipt(ref.ref), `evidence.refs[${index}] record`); if (entity.sha256 !== ref.sha256) throw new Error(`evidence.refs[${index}] hash mismatch`); const acceptance = validateAcceptanceEvidence(entity.value, `acceptance evidence schema at evidence.refs[${index}]`); if (criterionIds.has(acceptance.acceptance_criterion_id)) throw new Error(`duplicate acceptance_criterion_id: ${acceptance.acceptance_criterion_id}`); criterionIds.add(acceptance.acceptance_criterion_id); for (const [nestedIndex, nested] of acceptance.refs.entries()) { if (typeof worker.readEvidence !== "function") throw new Error("acceptance evidence schema requires authenticated evidence reader"); const nestedRecord = object(worker.readEvidence(nested.ref), `${ref.ref} refs[${nestedIndex}] record`); if (nestedRecord.sha256 !== nested.sha256) throw new Error(`${ref.ref} refs[${nestedIndex}] hash mismatch`); nestedEvidence.push(nested); } } return { facts: { tests: tests.facts, review: review.facts, evidence_refs: evidence.value.refs }, evidence_refs: [tests.evidence, review.evidence, evidence.evidence, ...evidence.value.refs, ...nestedEvidence], missing_items: [...review.missing_items, ...acceptedRiskAuditNotices(worker, "verify-code")] }; });

export function officialStageHandler(stage) { const handler = HANDLERS.get(stage); if (!handler) throw new TypeError(`no official handler for stage: ${stage}`); return async (worker, invocation) => { const refs = object(invocation?.receipts, "receipts"); for (const [name, ref] of Object.entries(refs)) { if (!validReceiptRef(name, ref)) throw new Error(`${name} receipt ref is outside its canonical namespace`); } return handler(worker, invocation); }; }

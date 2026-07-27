import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import { validateAcceptanceEvidence } from "./canonical-receipt-writer.mjs";
import { minimumReviewersFor } from "../skills/wh-review/scripts/review-materials.mjs";
import { parseReviewerOutput } from "../skills/wh-review/scripts/review-output.mjs";
import { aggregateProviderResults } from "../skills/wh-review/scripts/review-result.mjs";
import { validateSchema } from "../skills/wh-review/scripts/schema-validator.mjs";
import { buildNonGateReviewResponseRecord } from "../skills/wh-review/scripts/review-controller.mjs";
import { equivalentWorkspaceTrees } from "./git-worktree-snapshot.mjs";
import { assertAuthenticatedReviewAttempt, assertAuthenticatedReviewHead } from "./review-flow-authority.mjs";
import { authenticateCanonicalReviewResult } from "./canonical-review-result.mjs";
import {
  deriveSeriousReviewPause,
  validateRiskAcceptanceSet,
} from "./stage-review-disposition.mjs";
import { buildStageCompletion } from "./stage-completion-facts.mjs";

const HANDLERS = new Map();
const hashText = (value) => createHash("sha256").update(value).digest("hex");
const RECEIPT_SCHEMA = "workflowhub-receipt.v1";
const NAMESPACE = Object.freeze({
  decision: "receipts/", spec: "receipts/", plan: "receipts/", tasks: "receipts/",
  implementation: "receipts/", tests: "receipts/", review: "reviews/results/",
  direction_review: "reviews/results/", detail_review: "reviews/results/",
  quality_review: "reviews/results/", evidence: "evidence/",
  audit: "evidence/audits/", risk_acceptance: "evidence/risk-acceptances/",
  direction_risk_acceptance: "evidence/risk-acceptances/",
  detail_risk_acceptance: "evidence/risk-acceptances/",
  quality_risk_acceptance: "evidence/risk-acceptances/",
});
const EXPECTED_COMPONENT = Object.freeze({ decision: "decision", spec: "spec", plan: "plan", tasks: "tasks", implementation: "implementation", evidence: "evidence" });
const REVIEW_RESULT_REF = /^reviews\/results\/[a-zA-Z0-9._-]+\.json$/;
const REVIEW_ATTEMPT_REF = /^reviews\/attempts\/([a-zA-Z0-9._-]+)\/attempt\.json$/;
const REVIEW_RESOLUTION_REF = /^reviews\/resolutions\/[a-f0-9]{64}\.json$/;
const SHA256 = /^[a-f0-9]{64}$/;
const REVIEW_NAMES = new Set(["review", "direction_review", "detail_review", "quality_review"]);
const REVIEW_RESOLUTION_NAMES = new Set(["review_resolution", "direction_review_resolution", "detail_review_resolution"]);
const COMPLETION_COPY = Object.freeze({
  "make-decision": { objective: "把方向和取舍整理成可执行的最终决定", approach: "核对真实交互、文档拷问和正式审查后发布最终决定", effect: "下一阶段只需读取已接受的最终决定", next_owner: "build-spec" },
  "build-spec": { objective: "把已接受的决定写成完整需求规格", approach: "解决重大歧义并用正式审查验证最终规格", effect: "实施计划可以从稳定规格继续", next_owner: "build-plan" },
  "build-plan": { objective: "把需求规格拆成可验证的实施计划", approach: "生成计划和任务清单并完成工程审查", effect: "实现阶段获得明确顺序、边界和验收方法", next_owner: "build-code" },
  "build-code": { objective: "按已接受计划完成实现", approach: "分阶段实现、测试并完成最终集成审查", effect: "验证阶段可以检查同一份最终实现", next_owner: "verify-code" },
  "verify-code": { objective: "独立验证最终实现是否满足验收条件", approach: "复用正式实现证据并执行独立质量检查", effect: "任务获得可关闭或返回修复的明确结论", next_owner: "task owner" },
});
const RECEIPT_KEYS = Object.freeze({
  "make-decision": new Set(["decision", "direction_review", "detail_review", "direction_review_resolution", "detail_review_resolution", "direction_risk_acceptance", "detail_risk_acceptance", "audit"]),
  "build-spec": new Set(["spec", "review", "review_resolution", "risk_acceptance", "audit"]),
  "build-plan": new Set(["plan", "tasks", "review", "review_resolution", "risk_acceptance", "audit"]),
  "build-code": new Set(["implementation", "tests", "review", "risk_acceptance", "audit"]),
  "verify-code": new Set(["tests", "review", "quality_review", "quality_risk_acceptance", "evidence", "risk_acceptance", "audit"]),
});
const object = (value, label) => { if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${label} must be an object`); return value; };
const text = (value, label) => { if (typeof value !== "string" || value.trim() === "") throw new TypeError(`${label} must be non-empty`); return value; };
function completionReview(records) {
  const reviews = records.filter(Boolean);
  const statuses = reviews.map((entry) => entry.facts.verdict ?? entry.facts.status);
  return {
    conclusion: statuses.every((status) => status === "pass") ? "正式审查通过" : statuses.join(", "),
    status: statuses.join("+"),
    providers: [...new Set(reviews.flatMap((entry) => entry.value.provider_results?.map(({ provider }) => provider) ?? []))],
    duration_ms: null,
    tokens: null,
    findings: reviews.flatMap((entry) => entry.value.findings ?? []),
    refs: reviews.map((entry) => ({ ref: entry.ref, hash: entry.evidence.sha256 })),
  };
}
function addCompletion(stage, result, { artifacts, reviews, verification }) {
  const copy = COMPLETION_COPY[stage];
  const missing = result.missing_items ?? [];
  // Keep the canonical attempt's exact diagnostic in the stage result, but do
  // not expose provider/attempt/receipt internals through the user completion
  // view when an external review is unavailable.
  const userSafeMissing = missing.map((item) => /(?:\bprovider\b|\btoken\b|\battempt\b|\breviews?\/|receipts?\/|[a-f0-9]{64})/i.test(item)
    ? "正式审查结果暂不可用，原始原因已保留在系统记录"
    : item);
  const completion = buildStageCompletion(stage, {
    result: missing.length ? "completed_with_open_items" : "passed",
    ...copy,
    verification: { conclusion: verification, limits: missing.length ? ["仍有未完成项，不能当作无条件通过"] : [] },
    artifacts,
    review: completionReview(reviews),
    missing_items: userSafeMissing,
    risks: userSafeMissing,
    dependencies: stage === "make-decision" ? [] : ["读取上一阶段的 accepted 结果"],
    recovery_conditions: ["若下游证明输入无效，返回当前阶段修复后重新发布"],
    downstream_read_rule: `只读取 results/${stage}/accepted.json 中的正式事实`,
    next_owner: copy.next_owner,
    user_action: missing.length ? "需要处理未完成项" : "无需操作",
  });
  return { ...result, completion };
}
const reviewName = (name) => REVIEW_NAMES.has(name);
function validReceiptRef(name, ref) {
  if (typeof ref !== "string" || ref.includes("..") || !ref.endsWith(".json")) return false;
  if (name === "audit") return /^evidence\/audits\/(?:make-decision|build-spec|build-plan|build-code|verify-code)\/[a-f0-9]{64}\.json$/.test(ref);
  if (name.endsWith("risk_acceptance")) return /^evidence\/risk-acceptances\/[a-f0-9]{64}\.json$/.test(ref);
  if (reviewName(name)) return REVIEW_RESULT_REF.test(ref) || REVIEW_ATTEMPT_REF.test(ref);
  if (REVIEW_RESOLUTION_NAMES.has(name)) return REVIEW_RESOLUTION_REF.test(ref);
  return Boolean(NAMESPACE[name] && ref.startsWith(NAMESPACE[name]));
}
function auditFacts(worker, invocation) {
  const ref = text(object(invocation.receipts, "receipts").audit, "audit summary ref");
  if (!validReceiptRef("audit", ref)) throw new Error("audit summary ref is outside its canonical namespace");
  const record = object(worker.readReceipt(ref), "audit summary record");
  const value = object(record.value, "audit summary");
  if (value.schema_version !== "v1" || value.task_id !== worker.identity.taskId
      || value.stage_slug !== worker.stage || value.verdict !== "pass"
      || !SHA256.test(value.summary_hash ?? "") || !Array.isArray(value.content_evidence_refs)
      ) {
    throw new Error("audit summary is not an authenticated passing summary for this stage");
  }
  return {
    value,
    facts: {
      audit_contract_version: "v1",
      audit_summary_ref: ref,
      audit_summary_hash: value.summary_hash,
      audit_verdict: value.verdict,
      content_evidence_refs: value.content_evidence_refs,
    },
    evidence: { ref, sha256: record.sha256 },
  };
}

function makeDecisionInteractionAggregate(worker, audit, decision, snapshotTree) {
  const refs = audit.value.content_evidence_refs.filter(({ kind }) => kind === "interaction-completion.v1");
  if (refs.length !== 1) {
    throw new Error("make-decision audit must bind exactly one interaction aggregate");
  }
  const binding = refs[0];
  if (typeof binding.ref !== "string" || typeof binding.hash !== "string" || !SHA256.test(binding.hash)) {
    throw new Error("make-decision interaction aggregate audit binding is invalid");
  }
  const record = object(worker.readReceipt(binding.ref), "make-decision interaction aggregate");
  const value = object(record.value, "make-decision interaction aggregate value");
  const payload = object(value.payload, "make-decision interaction aggregate payload");
  if (record.sha256 !== binding.hash
      || value.schema_version !== "stage-content-evidence.v1"
      || value.kind !== "interaction-completion.v1"
      || value.task_id !== worker.identity.taskId
      || value.stage !== "make-decision"
      || value.workflow_run_id !== worker.workflowRunId
      || value.workflow_run_id !== audit.value.workflow_run_id
      || value.snapshot_tree !== snapshotTree
      || value.snapshot_tree !== audit.value.snapshot_tree
      || payload.interaction_type !== "aggregate"
      || payload.workspace_tree !== snapshotTree
      || value.content_hash !== hashText(JSON.stringify(payload))) {
    throw new Error("make-decision interaction aggregate task/stage/run/tree/ref/hash binding mismatch");
  }
  if (payload.decision_ref !== decision.value.decision_ref
      || payload.decision_hash !== decision.value.decision_hash) {
    throw new Error("make-decision interaction aggregate decision binding differs from the official decision receipt");
  }
  return { ref: binding.ref, hash: binding.hash, value };
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
function acceptanceCoverageFacts(worker, invocation, snapshotTree) {
  const coverage = object(invocation.acceptance_coverage, "build-code acceptance_coverage");
  if (coverage.snapshot_tree !== snapshotTree) throw new Error("build-code acceptance_coverage must bind the tests snapshot tree");
  if (!Array.isArray(coverage.accepted_criterion_ids) || coverage.accepted_criterion_ids.length === 0) throw new Error("build-code acceptance_coverage.accepted_criterion_ids is required");
  const declared = new Set();
  for (const [index, id] of coverage.accepted_criterion_ids.entries()) {
    text(id, `build-code acceptance_coverage.accepted_criterion_ids[${index}]`);
    if (declared.has(id)) throw new Error(`duplicate accepted criterion id: ${id}`);
    declared.add(id);
  }
  if (!Array.isArray(coverage.items) || coverage.items.length !== declared.size) throw new Error("build-code acceptance_coverage must contain exactly one row per accepted criterion");
  const items = coverage.items.map((item, index) => {
    const value = object(item, `build-code acceptance_coverage.items[${index}]`);
    const id = text(value.acceptance_criterion_id, `build-code acceptance_coverage.items[${index}].acceptance_criterion_id`);
    if (!declared.has(id)) throw new Error(`acceptance_coverage item is not an accepted criterion: ${id}`);
    declared.delete(id);
    if (!new Set(["covered", "missing", "unknown"]).has(value.status)) throw new Error(`acceptance_coverage ${id} status must be covered, missing, or unknown`);
    if (!Array.isArray(value.evidence_refs)) throw new TypeError(`acceptance_coverage ${id} evidence_refs must be an array`);
    if (value.status === "covered" && value.evidence_refs.length === 0) throw new Error(`covered acceptance criterion requires evidence: ${id}`);
    if (value.status !== "covered" && value.evidence_refs.length !== 0) throw new Error(`non-covered acceptance criterion must not claim evidence: ${id}`);
    const refs = value.evidence_refs.map((entry, refIndex) => {
      const ref = object(entry, `acceptance_coverage ${id} evidence_refs[${refIndex}]`);
      text(ref.ref, `acceptance_coverage ${id} evidence_refs[${refIndex}].ref`);
      if (!ref.ref.startsWith("evidence/") || ref.ref.includes("..") || !SHA256.test(ref.sha256 ?? "")) throw new Error(`acceptance_coverage ${id} evidence reference is invalid`);
      const record = worker.readReceipt(ref.ref);
      if (record.sha256 !== ref.sha256) throw new Error(`acceptance_coverage ${id} evidence hash mismatch`);
      return { ref: ref.ref, sha256: ref.sha256 };
    });
    return { acceptance_criterion_id: id, status: value.status, evidence_refs: refs };
  });
  if (declared.size) throw new Error("acceptance_coverage is missing an accepted criterion");
  return { snapshot_tree: snapshotTree, accepted_criterion_ids: coverage.accepted_criterion_ids, items };
}
function reviewMinimumForAttempt(attempt, producerStage, expectedTrack) {
  const policy = attempt.review_policy;
  if (policy?.source !== "wh_review.v2") return minimumReviewersFor(producerStage, expectedTrack ?? null);
  if (!Number.isSafeInteger(policy.minimum_heterologous) || policy.minimum_heterologous < 1) {
    throw new Error("wh_review.v2 attempt has an invalid minimum_heterologous");
  }
  return policy.minimum_heterologous;
}
function normalizedReviewIssue(value) {
  return String(value ?? "").toLocaleLowerCase("en").replace(/[^\p{L}\p{N}]+/gu, " ").trim().split(/\s+/).filter(Boolean);
}
function reviewIssueMatches(left, right) {
  if (left.path !== right.path) return false;
  if (left.line !== undefined && right.line !== undefined && left.line !== right.line) return false;
  const leftTerms = normalizedReviewIssue(left.issue); const rightTerms = normalizedReviewIssue(right.issue);
  if (leftTerms.join(" ") === rightTerms.join(" ")) return true;
  const rightSet = new Set(rightTerms); const leftSet = new Set(leftTerms);
  if (!leftSet.size || !rightSet.size) return false;
  let shared = 0;
  for (const term of leftSet) if (rightSet.has(term)) shared += 1;
  return shared / Math.min(leftSet.size, rightSet.size) >= 0.7;
}
function evidenceAnchorsFromAdjudication(result, provider, review) {
  const clusters = result?.adjudication?.clusters;
  if (!Array.isArray(clusters)) return review.findings.map(() => true);
  const used = new Set();
  return review.findings.map((finding) => {
    const clusterIndex = clusters.findIndex((cluster, index) => {
      if (used.has(index) || !reviewIssueMatches(cluster, finding)) return false;
      return cluster.provider_findings?.some((item) => item.provider === provider);
    });
    if (clusterIndex < 0) return true;
    used.add(clusterIndex);
    return clusters[clusterIndex].provider_findings.find((item) => item.provider === provider)?.evidence_anchor_valid ?? true;
  });
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
  if (!isDeepStrictEqual(attempt.review_chain ?? null, result.review_chain ?? null)) throw new Error("review attempt/result review_chain mismatch");
  if (attempt.terminal_status !== "semantic" || attempt.error !== null) throw new Error("review attempt did not produce a semantic result");
  const minimumReviewers = reviewMinimumForAttempt(attempt, producerStage, expectedTrack);
  const providerOutputs = [];
  for (const providerAttempt of attempt.provider_attempts) {
    if (providerAttempt.status !== "completed" || typeof providerAttempt.output_ref !== "string") continue;
    const outputRecord = object(worker.readReceipt(providerAttempt.output_ref), `review provider ${providerAttempt.provider} output record`);
    const output = object(outputRecord.value, `review provider ${providerAttempt.provider} output`);
    if (output.schema_version !== "wh-review-provider-output.v1" || output.task_id !== worker.identity.taskId
        || output.stage !== producerStage || output.attempt_id !== attemptId
        || output.provider !== providerAttempt.provider || typeof output.content !== "string"
        || output.content_hash !== hashText(output.content)) {
      throw new Error(`review provider ${providerAttempt.provider} output provenance mismatch`);
    }
    providerOutputs.push({
      ref: providerAttempt.output_ref,
      provider: providerAttempt.provider,
      review: parseReviewerOutput(output.content, { requireEvidence: result.adjudication !== undefined }),
    });
  }
  try {
    authenticateCanonicalReviewResult({
      attempt, result, providerOutputs, fallbackMinimumReviewers: minimumReviewers,
      assess: (items) => items.map((item) => ({
        ...item,
        evidenceAnchors: evidenceAnchorsFromAdjudication(result, item.provider, item.review),
      })),
    });
  } catch (error) {
    throw new Error(`review result canonical authentication failed: ${error.message}`);
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
      const providerFromRef = providerOutputName.replace(/\.output\.json$/, "").replace(/-[0-9]+$/, "");
      if (providerFromRef !== providerAttempt.provider) throw new Error(`review provider ${providerAttempt.provider} output ref identity mismatch`);
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
      ref: item.ref,
      evidence: item.evidence,
      value: item.value,
      scope,
      missing_items: [`review unavailable: ${code}: ${message}`],
    };
  }
  verifyReviewChain(worker, item.value, expectedTrack, producerStage);
  const scope = reviewScope(item.value);
  const authenticatedFlow = worker.readAuthenticatedReviewFlow({
    stage: producerStage,
    review_track: item.value.review_track ?? null,
    subject_kind: scope.subject_kind,
    phase_id: scope.phase_id ?? null,
    review_scope: scope.review_scope ?? null,
  });
  if (!authenticatedFlow || authenticatedFlow.head_result_ref !== item.ref
      || authenticatedFlow.result_sha256 !== item.evidence.sha256) {
    throw new Error(`${name} is not the authenticated review-flow head`);
  }
  const pause = deriveSeriousReviewPause({
    taskId: worker.identity.taskId,
    stage: producerStage,
    reviewRef: item.ref,
    reviewHash: item.evidence.sha256,
    result: item.value,
    workflowRunId: authenticatedFlow.identity.workflow_run_id,
  });
  let riskEvidence = [];
  if (pause.status === "paused") {
    const receiptName = name === "review" ? "risk_acceptance" : `${name.replace(/_review$/, "")}_risk_acceptance`;
    const suppliedRiskRefs = invocation.receipts?.[receiptName];
    if (suppliedRiskRefs === undefined) {
      throw new Error(`SERIOUS_REVIEW_PAUSE: ${JSON.stringify(pause)}`);
    }
    const riskRefs = Array.isArray(suppliedRiskRefs) ? suppliedRiskRefs : [suppliedRiskRefs];
    const records = riskRefs.map((riskRef) => {
      if (!validReceiptRef(receiptName, riskRef)) throw new Error(`${receiptName} is outside the canonical risk acceptance namespace`);
      const record = object(worker.readReceipt(riskRef), `${receiptName} record`);
      return { riskRef, record, acceptance: object(record.value, `${receiptName} value`) };
    });
    validateRiskAcceptanceSet({ acceptances: records.map(({ acceptance }) => acceptance), pause });
    riskEvidence = records.map(({ riskRef, record }) => ({ ref: riskRef, sha256: record.sha256 }));
  }
  return {
    facts: { verdict: item.value.verdict, result_ref: item.ref, result_hash: item.evidence.sha256, snapshot_tree: item.value.snapshot_tree, ...(expectedTrack === undefined ? {} : { review_track: expectedTrack }), ...scopeFacts(scope) },
    ref: item.ref,
    evidence: item.evidence,
    value: item.value,
    scope,
    risk_evidence: riskEvidence,
    missing_items: item.value.verdict === "revise_required"
      ? [pause.status === "paused" ? "serious review finding accepted as explicit risk; verdict remains revise_required" : "review findings recorded; response evidence: unknown/unverified"]
      : [],
  };
}

function reviewResolution(worker, invocation, { stage = worker.stage, reviewTrack = null, receiptName = "review_resolution" } = {}) {
  const ref = text(object(invocation.receipts, "receipts")[receiptName], `${receiptName} receipt ref`);
  if (!REVIEW_RESOLUTION_REF.test(ref)) throw new Error("review_resolution receipt ref is outside its canonical reviews/resolutions namespace");
  const record = object(worker.readReceipt(ref), "review_resolution record");
  const value = object(record.value, "review_resolution");
  validateSchema("resolution", value);
  if (value.task_id !== worker.identity.taskId || value.stage !== stage || (value.review_track ?? null) !== reviewTrack) {
    throw new Error("review_resolution task/stage/track provenance mismatch");
  }
  if (!SHA256.test(record.sha256 ?? "")) throw new Error("review_resolution hash must be sha256");
  return { ref, value, evidence: { ref, sha256: record.sha256 } };
}

function verifiedReviewParent(worker, result) {
  const chain = object(result.review_chain, "structural full review_chain");
  if (chain.round !== "full") throw new Error("changed build-spec requires a verified delta resolution or structural full review");
  const parentRef = text(chain.parent_result_ref, "structural full review parent_result_ref");
  if (!REVIEW_RESULT_REF.test(parentRef)) throw new Error("structural full review parent_result_ref must be canonical");
  const parentRecord = object(worker.readReceipt(parentRef), "structural full review parent record");
  const parent = object(parentRecord.value, "structural full review parent");
  validateSchema("result", parent);
  if (parent.task_id !== worker.identity.taskId || parent.stage !== "build-spec" || parent.review_track !== null) {
    throw new Error("structural full review parent provenance mismatch");
  }
  verifyReviewChain(worker, parent, undefined, "build-spec");
  if (chain.prior_snapshot_tree !== parent.snapshot_tree) throw new Error("structural full review prior snapshot does not match its parent result");
  if (!SHA256.test(parentRecord.sha256 ?? "")) throw new Error("structural full review parent hash must be sha256");
  return { ref: parentRef, sha256: parentRecord.sha256 };
}

function authenticateReviewHead(worker, review, expected, latestResolution) {
  if (!review.facts.result_ref) {
    return assertAuthenticatedReviewAttempt({
      readFlow: worker.readAuthenticatedReviewFlow,
      attemptRef: review.ref,
      attemptHash: review.evidence.sha256,
      attempt: review.value,
      expected,
    });
  }
  return assertAuthenticatedReviewHead({
    readFlow: worker.readAuthenticatedReviewFlow,
    reviewRef: review.ref,
    reviewHash: review.evidence.sha256,
    result: review.value,
    expected,
    ...(latestResolution === undefined ? {} : { latestResolution }),
  });
}

function bindFinalReview(worker, invocation, review, currentTree, {
  stage,
  reviewTrack = null,
  resolutionName = "review_resolution",
} = {}) {
  if (typeof currentTree !== "string" || !/^[a-f0-9]{40,64}$/.test(currentTree)) throw new Error(`${stage} current Workspace snapshot is required`);
  const hasResolution = Object.prototype.hasOwnProperty.call(invocation.receipts, resolutionName);
  const resolution = hasResolution ? reviewResolution(worker, invocation, {
    stage, reviewTrack, receiptName: resolutionName,
  }) : null;
  authenticateReviewHead(worker, review, {
    stage, review_track: reviewTrack, subject_kind: "worktree", phase_id: null, review_scope: null,
  }, resolution?.evidence);
  if (resolution === null) {
    if (review.value.snapshot_tree !== currentTree) {
      throw new Error(`${stage} review does not bind the final current snapshot; latest verified resolution required`);
    }
    return { resolution: null, evidence: [] };
  }
  const value = resolution.value;
  if (value.outcome !== "recorded_non_gate_response" || value.evidence_state !== "verified") {
    throw new Error(`${stage} delta resolution must be verified`);
  }
  if (value.previous_result_ref !== review.ref || value.previous_result_sha256 !== review.evidence.sha256
      || value.previous_snapshot_tree !== review.value.snapshot_tree) {
    throw new Error(`${stage} delta resolution does not bind the prior review ref/hash/snapshot`);
  }
  if (value.snapshot_tree !== currentTree) throw new Error(`${stage} delta resolution does not bind the final current snapshot`);
  const expected = buildNonGateReviewResponseRecord({
    taskId: worker.identity.taskId,
    stage,
    reviewTrack,
    previousResult: { ...review.value, result_ref: review.ref },
    previousResultSha256: review.evidence.sha256,
    ledger: value.response_ledger,
    currentSnapshotTree: currentTree,
  });
  if (expected.evidence_state !== "verified" || !isDeepStrictEqual(value, expected)) {
    throw new Error(`${stage} delta resolution is not reproducible from its canonical prior result and response ledger`);
  }
  return { resolution, evidence: [resolution.evidence] };
}

function bindBuildSpecReview(worker, invocation, review, currentTree) {
  const binding = bindFinalReview(worker, invocation, review, currentTree, { stage: "build-spec" });
  if (binding.resolution === null) {
    const chain = review.value.review_chain;
    if (chain !== undefined && chain.current_snapshot_tree !== currentTree) throw new Error("build-spec review_chain does not bind the current snapshot");
    if (chain?.round === "closure") throw new Error("build-spec closure review cannot replace a delta resolution or structural full review");
    if (chain?.round === "initial" && (chain.parent_result_ref !== null || chain.root_result_ref !== null || chain.prior_snapshot_tree !== null)) {
      throw new Error("build-spec initial review_chain cannot claim a prior review");
    }
    return [...binding.evidence, ...(chain?.round === "full" ? [verifiedReviewParent(worker, review.value)] : [])];
  }
  return binding.evidence;
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

HANDLERS.set("make-decision", async (worker, input) => {
  const audit = auditFacts(worker, input);
  const item = receipt(worker, input, "decision");
  const direction = reviewFacts(worker, input, "direction_review", "direction");
  const detail = reviewFacts(worker, input, "detail_review", "detail");
  if (typeof item.value.decision_ref !== "string" || !/^receipts\/decision-log\/[a-f0-9]{64}\.md$/.test(item.value.decision_ref)
      || typeof item.value.decision_hash !== "string" || item.value.content_hash !== item.value.decision_hash) {
    throw new Error("decision-log receipt must point to the final human-readable artifact");
  }
  const decisionLog = worker.readEvidence(item.value.decision_ref);
  if (decisionLog.sha256 !== item.value.decision_hash || decisionLog.bytes.trim() === "") throw new Error("decision-log content hash mismatch");
  if (!Array.isArray(item.value.contract_refs)) throw new Error("decision-log contract refs must be an array");
  if (!worker.candidateWorkspace) throw new Error("verified CandidateWorkspace required");
  const snapshot = worker.candidateWorkspace.captureSnapshot();
  const interactionAggregate = makeDecisionInteractionAggregate(worker, audit, item, snapshot.tree);
  const directionBinding = bindFinalReview(worker, input, direction, snapshot.tree, {
    stage: "make-decision", reviewTrack: "direction", resolutionName: "direction_review_resolution",
  });
  const detailBinding = bindFinalReview(worker, input, detail, snapshot.tree, {
    stage: "make-decision", reviewTrack: "detail", resolutionName: "detail_review_resolution",
  });
  if (worker.candidateWorkspace.captureSnapshot().tree !== snapshot.tree) throw new Error("make-decision CandidateWorkspace changed while binding final reviews");
  return addCompletion("make-decision", {
    facts: {
      worktree_root: worker.candidateWorkspace.worktreeRoot,
      baseline_commit: worker.candidateWorkspace.baselineCommit,
      snapshot_tree: snapshot.tree,
      decision_ref: item.value.decision_ref,
      decision_hash: item.value.decision_hash,
      reviews: { direction: direction.facts, detail: detail.facts },
      ...audit.facts,
    },
    evidence_refs: [
      item.evidence,
      { ref: item.value.decision_ref, sha256: item.value.decision_hash },
      ...item.value.contract_refs.map(({ ref, hash }) => ({ ref, sha256: hash })),
      { ref: interactionAggregate.ref, sha256: interactionAggregate.hash },
      direction.evidence, detail.evidence, audit.evidence, ...direction.risk_evidence, ...detail.risk_evidence, ...directionBinding.evidence, ...detailBinding.evidence,
    ],
    missing_items: [...direction.missing_items, ...detail.missing_items],
  }, {
    artifacts: [{ label: "最终决策文档", ref: item.value.decision_ref, hash: item.value.decision_hash, accepted_lookup: "results/make-decision/accepted.json#facts.decision_ref" }],
    reviews: [direction, detail],
    verification: "真实交互、最终决策和两轮正式审查已完成绑定检查",
  });
});
HANDLERS.set("build-spec", async (worker, input) => {
  const audit = auditFacts(worker, input);
  const item = receipt(worker, input, "spec"), review = reviewFacts(worker, input);
  text(item.value.content, "spec content");
  if (item.value.content_hash !== hashText(item.value.content)) throw new Error("spec content hash mismatch");
  if (worker.readArtifact("spec.md") !== item.value.content) throw new Error("spec artifact differs from final receipt");
  if (typeof worker.snapshotWorkspace !== "function") throw new Error("build-spec Workspace snapshot capability required");
  const before = object(worker.snapshotWorkspace(), "build-spec current Workspace snapshot");
  const bindingEvidence = bindBuildSpecReview(worker, input, review, before.tree);
  const checkpoint = worker.createCheckpoint("build-spec");
  const after = object(worker.snapshotWorkspace(), "build-spec post-checkpoint Workspace snapshot");
  if (after.tree !== before.tree) throw new Error("build-spec Workspace changed while binding final spec review");
  return addCompletion("build-spec", {
    facts: { spec_ref: worker.artifactRef("spec.md"), checkpoint, review: review.facts, ...audit.facts },
    evidence_refs: [item.evidence, review.evidence, audit.evidence, ...review.risk_evidence, ...bindingEvidence],
    missing_items: review.missing_items,
  }, {
    artifacts: [{ label: "需求规格", ref: item.ref, hash: item.evidence.sha256, accepted_lookup: "results/build-spec/accepted.json#facts.spec_ref" }],
    reviews: [review],
    verification: "最终规格、工作区快照和正式审查已完成绑定检查",
  });
});
HANDLERS.set("build-plan", async (worker, input) => {
  const audit = auditFacts(worker, input);
  const plan = receipt(worker, input, "plan"), tasks = receipt(worker, input, "tasks"), review = reviewFacts(worker, input);
  text(plan.value.content, "plan content");
  text(tasks.value.content, "tasks content");
  if (plan.value.content_hash !== hashText(plan.value.content) || tasks.value.content_hash !== hashText(tasks.value.content)) throw new Error("plan/tasks content hash mismatch");
  if (worker.readArtifact("plan.md") !== plan.value.content || worker.readArtifact("tasks.md") !== tasks.value.content) throw new Error("plan/tasks artifacts differ from final receipts");
  if (typeof worker.snapshotWorkspace !== "function") throw new Error("build-plan Workspace snapshot capability required");
  const before = object(worker.snapshotWorkspace(), "build-plan current Workspace snapshot");
  const binding = bindFinalReview(worker, input, review, before.tree, { stage: "build-plan" });
  const checkpoint = worker.createCheckpoint("build-plan");
  const after = object(worker.snapshotWorkspace(), "build-plan post-checkpoint Workspace snapshot");
  if (after.tree !== before.tree) throw new Error("build-plan Workspace changed while binding final review");
  return addCompletion("build-plan", {
    facts: { plan_ref: worker.artifactRef("plan.md"), tasks_ref: worker.artifactRef("tasks.md"), checkpoint, review: review.facts, ...audit.facts },
    evidence_refs: [plan.evidence, tasks.evidence, review.evidence, audit.evidence, ...(review.risk_evidence ?? []), ...binding.evidence],
    missing_items: [...review.missing_items, ...acceptedRiskAuditNotices(worker, "build-plan")],
  }, {
    artifacts: [
      { label: "实施计划", ref: plan.ref, hash: plan.evidence.sha256, accepted_lookup: "results/build-plan/accepted.json#facts.plan_ref" },
      { label: "任务清单", ref: tasks.ref, hash: tasks.evidence.sha256, accepted_lookup: "results/build-plan/accepted.json#facts.tasks_ref" },
    ],
    reviews: [review],
    verification: "计划、任务清单、工作区快照和正式工程审查已完成绑定检查",
  });
});
HANDLERS.set("build-code", async (worker, input) => {
  const audit = auditFacts(worker, input);
  const impl = receipt(worker, input, "implementation"), tests = testFacts(worker, input), review = reviewFacts(worker, input);
  requireFinalIntegrationReview(review, "build-code final review");
  authenticateReviewHead(worker, review, {
    stage: "build-code", review_track: null, subject_kind: "worktree", phase_id: null, review_scope: "integration",
  });
  if (!Array.isArray(impl.value.changed)) throw new TypeError("implementation.changed must be array");
  for (const key of ["snapshot_head", "snapshot_tree", "snapshot_commit", "diff_ref", "diff_hash"]) text(impl.value[key], `implementation.${key}`);
  if (impl.value.snapshot_tree !== tests.facts.snapshot_tree || review.facts.snapshot_tree !== tests.facts.snapshot_tree) throw new Error("implementation, tests, and review must bind the same Workspace snapshot tree");
  const coverage = acceptanceCoverageFacts(worker, input, tests.facts.snapshot_tree);
  const phase = impl.value.phase_completion;
  if (typeof phase !== "boolean" && (!phase || typeof phase !== "object" || Array.isArray(phase))) throw new TypeError("invalid phase_completion");
  return addCompletion("build-code", {
    facts: { changed: impl.value.changed, tests: tests.facts, review: review.facts, phase_completion: phase, acceptance_coverage: coverage, ...audit.facts },
    evidence_refs: [impl.evidence, { ref: impl.value.diff_ref, sha256: impl.value.diff_hash }, tests.evidence, review.evidence, audit.evidence, ...review.risk_evidence, ...coverage.items.flatMap((item) => item.evidence_refs)],
    missing_items: review.missing_items,
  }, {
    artifacts: [{ label: "实现结果", ref: impl.ref, hash: impl.evidence.sha256, accepted_lookup: "results/build-code/accepted.json#facts.changed" }],
    reviews: [review],
    verification: tests.facts.exit_code === 0 ? "正式测试通过，最终实现与集成审查绑定同一快照" : "正式测试未通过",
  });
});

HANDLERS.set("verify-code", async (worker, input) => {
  const audit = auditFacts(worker, input);
  const tests = testFacts(worker, input);
  const acceptedBuild = worker.readAcceptedBuildCode({ allowLegacyBuildCode: true });
  const review = reviewFacts(worker, input, "review", undefined, "build-code");
  const qualityReview = reviewFacts(worker, input, "quality_review", undefined, "verify-code");
  authenticateReviewHead(worker, review, {
    stage: "build-code", review_track: null, subject_kind: "worktree", phase_id: null, review_scope: "integration",
  });
  authenticateReviewHead(worker, qualityReview, {
    stage: "verify-code", review_track: null, subject_kind: "worktree", phase_id: null, review_scope: null,
  });
  const evidence = receipt(worker, input, "evidence");
  const current = worker.snapshotWorkspace();
  if (qualityReview.facts.snapshot_tree !== current.tree) {
    throw new Error("verify-code quality review does not bind the current verification snapshot");
  }
  const acceptedReview = acceptedBuild.facts.review;
  const acceptedRef = acceptedReview.result_ref ?? acceptedReview.attempt_ref;
  const acceptedHash = acceptedReview.result_hash ?? acceptedReview.attempt_hash;
  const reviewRef = review.facts.result_ref ?? review.facts.attempt_ref;
  const reviewHash = review.facts.result_hash ?? review.facts.attempt_hash;
  if (!Array.isArray(evidence.value.refs)) throw new TypeError("evidence.refs must be array");
  const criterionIds = new Set();
  const nestedEvidence = [];
  const failedEvidence = [];
  for (const [index, ref] of evidence.value.refs.entries()) {
    object(ref, `evidence.refs[${index}]`);
    text(ref.ref, `evidence.refs[${index}].ref`);
    text(ref.sha256, `evidence.refs[${index}].sha256`);
    if (!ref.ref.startsWith("evidence/") || ref.ref.includes("..")) throw new Error("verify evidence ref must use canonical evidence namespace");
    const entity = object(worker.readReceipt(ref.ref), `evidence.refs[${index}] record`);
    if (entity.sha256 !== ref.sha256) throw new Error(`evidence.refs[${index}] hash mismatch`);
    const acceptance = validateAcceptanceEvidence(entity.value, `acceptance evidence schema at evidence.refs[${index}]`);
    if (criterionIds.has(acceptance.acceptance_criterion_id)) throw new Error(`duplicate acceptance_criterion_id: ${acceptance.acceptance_criterion_id}`);
    criterionIds.add(acceptance.acceptance_criterion_id);
    if (acceptance.result === "fail") failedEvidence.push(ref);
    for (const [nestedIndex, nested] of acceptance.refs.entries()) {
      if (typeof worker.readEvidence !== "function") throw new Error("acceptance evidence schema requires authenticated evidence reader");
      const nestedRecord = object(worker.readEvidence(nested.ref), `${ref.ref} refs[${nestedIndex}] record`);
      if (nestedRecord.sha256 !== nested.sha256) throw new Error(`${ref.ref} refs[${nestedIndex}] hash mismatch`);
      nestedEvidence.push(nested);
    }
  }
  const mismatches = [];
  if (!acceptedBuild.facts.acceptance_coverage) mismatches.push("accepted build-code lacks acceptance_coverage; controlled reopen required");
  if (acceptedReview.review_scope !== "integration" || acceptedReview.subject_kind !== "worktree" || acceptedReview.phase_id !== null) mismatches.push("accepted build-code lacks the required full-worktree integration review; controlled reopen required");
  if (acceptedRef !== reviewRef || acceptedHash !== reviewHash) mismatches.push("verify-code review must reuse the active accepted build-code final review");
  if (review.facts.review_scope !== "integration" || review.facts.subject_kind !== "worktree" || review.facts.phase_id !== null) mismatches.push("verify-code requires the accepted build-code final full-worktree review");
  const workspaceRoot = worker.workspace?.worktreeRoot;
  const snapshotsMatch = workspaceRoot
    && equivalentWorkspaceTrees(workspaceRoot, tests.facts.snapshot_tree, review.facts.snapshot_tree)
    && equivalentWorkspaceTrees(workspaceRoot, tests.facts.snapshot_tree, current.tree);
  if (!snapshotsMatch) mismatches.push("tests, review, and current Workspace snapshot must match");
  const result = addCompletion("verify-code", {
    facts: { tests: tests.facts, review: review.facts, quality_note: qualityReview.facts, evidence_refs: evidence.value.refs, ...audit.facts },
    evidence_refs: [tests.evidence, review.evidence, qualityReview.evidence, evidence.evidence, audit.evidence, ...review.risk_evidence, ...qualityReview.risk_evidence, ...evidence.value.refs, ...nestedEvidence],
    missing_items: [...review.missing_items, ...qualityReview.missing_items, ...mismatches, ...(failedEvidence.length ? failedEvidence.map((entry) => `failed acceptance evidence: ${entry.ref}`) : []), ...acceptedRiskAuditNotices(worker, "verify-code")],
  }, {
    artifacts: [{ label: "验证结果", ref: evidence.ref, hash: evidence.evidence.sha256, accepted_lookup: "results/verify-code/accepted.json#facts.evidence_refs" }],
    reviews: [review, qualityReview],
    verification: mismatches.length || failedEvidence.length ? "独立验证发现未满足项" : "正式测试和独立质量审查通过",
  });
  if (mismatches.length || failedEvidence.length) {
    return { ...result, verification_failure: true, reason: "verify-code verification failed: " + [...mismatches, ...(failedEvidence.length ? [`${failedEvidence.length} acceptance criterion(s) failed`] : [])].join("; ") };
  }
  return result;
});

export function officialStageHandler(stage) { const handler = HANDLERS.get(stage); if (!handler) throw new TypeError(`no official handler for stage: ${stage}`); return async (worker, invocation) => { const value = object(invocation, "official stage input"); const allowedTopLevel = new Set(stage === "build-code" ? ["receipts", "acceptance_coverage"] : ["receipts"]); const unknownTopLevel = Object.keys(value).filter((key) => !allowedTopLevel.has(key)); if (unknownTopLevel.length) throw new Error(`${stage} official run input must contain only ${[...allowedTopLevel].join(" and ")}; unknown fields: ${unknownTopLevel.join(", ")}`); const refs = object(value.receipts, "receipts"); const unexpectedReceiptKeys = Object.keys(refs).filter((key) => !RECEIPT_KEYS[stage].has(key)); if (unexpectedReceiptKeys.length) throw new Error(`${stage} official run has unexpected receipt fields: ${unexpectedReceiptKeys.join(", ")}`); for (const [name, ref] of Object.entries(refs)) { const candidateRefs = name.endsWith("risk_acceptance") && Array.isArray(ref) ? ref : [ref]; if (candidateRefs.length === 0 || candidateRefs.some((candidateRef) => !validReceiptRef(name, candidateRef))) throw new Error(`${name} receipt ref is outside its canonical namespace`); } return handler(worker, value); }; }

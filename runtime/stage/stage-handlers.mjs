import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { validateAcceptanceEvidence } from "../evidence/canonical-receipt-writer.mjs";
import { validateHumanConfirmation } from "../evidence/canonical-evidence-validators.mjs";
import { normalizeRuntimeOnlyPaths } from "../evidence/canonical-utils.mjs";
import { minimumReviewersFor } from "../review/review-policy.mjs";
import { parseReviewerOutput } from "../review/review-output.mjs";
import { aggregateCanonicalProviderResults } from "../review/canonical-review-result.mjs";
import { validateSchema } from "../review/schema-validator.mjs";
import { equivalentWorkspaceTrees, isMaterialOnlySnapshotDelta } from "../task/git-worktree-snapshot.mjs";
import { authenticateCanonicalReviewResult } from "../review/canonical-review-result.mjs";
import { buildStageCompletion } from "../evidence/stage-completion-facts.mjs";
import { validateAcceptanceDesignMinimum, validateExecutablePlanTaskMinimum, validatePlanTaskContract } from "../stage/stage-content-contracts.mjs";
import { canonicalReviewFindings, deriveSeriousReviewPause, validateRiskAcceptance } from "../review/stage-review-disposition.mjs";

const HANDLERS = new Map();
const hashText = (value) => createHash("sha256").update(value).digest("hex");
function materialIncomplete(message) {
  const error = new Error(`MATERIAL_INCOMPLETE: ${message}`);
  error.code = "MATERIAL_INCOMPLETE";
  return error;
}
const RECEIPT_SCHEMA = "workflowhub-receipt.v1";
const NAMESPACE = Object.freeze({
  decision: "quality/evidence/", spec: "quality/evidence/", plan: "quality/evidence/", tasks: "quality/evidence/",
  decision_revision: "quality/evidence/", implementation: "quality/evidence/", tests: "quality/tests/", research: "quality/tests/", grill: "quality/tests/", confirmation: "quality/confirmations/", review: "quality/reviews/results/",
  direction_review: "quality/reviews/results/", detail_review: "quality/reviews/results/",
  quality_review: "quality/reviews/results/", evidence: "quality/evidence/", verification: "quality/evidence/",
  audit: "evidence/audits/", risk_acceptance: "evidence/risk-acceptances/",
  direction_risk_acceptance: "evidence/risk-acceptances/",
  detail_risk_acceptance: "evidence/risk-acceptances/",
  quality_risk_acceptance: "evidence/risk-acceptances/",
});
const EXPECTED_COMPONENT = Object.freeze({ decision: "decision", spec: "spec", plan: "plan", tasks: "tasks", implementation: "implementation", evidence: "evidence", verification: "verification" });
const REVIEW_RESULT_REF = /^quality\/reviews\/results\/[a-zA-Z0-9._-]+\.json$/;
const REVIEW_ATTEMPT_REF = /^quality\/reviews\/attempts\/([a-zA-Z0-9._-]+)\/attempt\.json$/;
const SHA256 = /^[a-f0-9]{64}$/;
const REVIEW_NAMES = new Set(["review", "direction_review", "detail_review", "quality_review"]);
const COMPLETION_COPY = Object.freeze({
  "make-decision": { objective: "把方向和取舍整理成可执行的最终决定", approach: "核对真实交互、文档拷问和正式审查后发布最终决定", effect: "下一阶段只需读取已接受的最终决定", next_owner: "build-spec" },
  "build-spec": { objective: "把已接受的决定写成完整需求规格", approach: "解决重大歧义并用正式审查验证最终规格", effect: "实施计划可以从稳定规格继续", next_owner: "build-plan" },
  "build-plan": { objective: "把需求规格拆成可验证的实施计划", approach: "生成计划和任务清单并完成工程审查", effect: "实现阶段获得明确顺序、边界和验收方法", next_owner: "build-code" },
  "build-code": { objective: "按已接受计划完成实现", approach: "分阶段实现、测试并完成最终集成审查", effect: "验证阶段可以检查同一份最终实现", next_owner: "verify-code" },
  "verify-code": { objective: "独立验证最终实现是否满足验收条件", approach: "复用正式实现证据并执行独立质量检查", effect: "任务获得可关闭或返回修复的明确结论", next_owner: "task owner" },
});
const RECEIPT_KEYS = Object.freeze({
  "make-decision": new Set(["decision", "direction_review", "detail_review", "detail_risk_acceptance", "direction_risk_acceptance", "research", "grill", "confirmation", "audit"]),
  "build-spec": new Set(["spec", "review", "risk_acceptance", "audit"]),
  "build-plan": new Set(["plan", "tasks", "review", "risk_acceptance", "audit"]),
  "build-code": new Set(["implementation", "tests", "review", "risk_acceptance", "audit"]),
  "verify-code": new Set(["tests", "review", "quality_review", "quality_risk_acceptance", "evidence", "verification", "risk_acceptance", "audit"]),
});
const object = (value, label) => { if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${label} must be an object`); return value; };
const text = (value, label) => { if (typeof value !== "string" || value.trim() === "") throw new TypeError(`${label} must be non-empty`); return value; };
function semanticAnchor(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    && typeof value.id === "string" && value.id.trim() !== ""
    && typeof value.path === "string" && value.path.trim() !== "" && !value.path.includes("..") && !value.path.startsWith("/")
    && Number.isSafeInteger(value.start_line) && value.start_line >= 1
    && Number.isSafeInteger(value.end_line) && value.end_line >= value.start_line
    && typeof value.role === "string" && value.role.trim() !== "";
}
function completionReview(records) {
  const reviews = records.filter(Boolean);
  const statuses = reviews.map((entry) => entry.facts.verdict ?? entry.facts.status);
  return {
    conclusion: statuses.length
      ? `异源质量建议已记录：${statuses.join(", ")}`
      : "异源质量建议暂不可用",
    status: statuses.length ? statuses.join("+") : "unavailable",
    providers: [...new Set(reviews.flatMap((entry) => entry.value?.provider_results?.map(({ provider }) => provider) ?? []))],
    duration_ms: null,
    tokens: null,
    findings: reviews.flatMap((entry) => entry.value?.findings ?? []),
    refs: reviews.filter((entry) => entry.ref && entry.evidence).map((entry) => ({ ref: entry.ref, hash: entry.evidence.sha256 })),
  };
}
function boundReviewQualityFacts(entries) {
  return entries.filter(([, record]) => Boolean(record)).map(([label, entry]) => {
    const fact = entry.facts.status === "unavailable"
      ? "unavailable（认证质量事实）"
      : `${entry.facts.verdict}（认证质量事实）`;
    return `${label}=${fact}`;
  }).join("；");
}
function addCompletion(stage, result, { worker, artifacts, reviews, verification, businessFacts, audit, completionResult }) {
  const copy = COMPLETION_COPY[stage];
  const missing = result.missing_items ?? [];
  if (typeof worker?.readCompletionInvocationFacts !== "function") {
    throw new Error(`${stage} completion requires authenticated invocation facts`);
  }
  const { declaredComponents, invocationFacts } = worker.readCompletionInvocationFacts();
  const auditGaps = audit?.value?.completion_effect === "disclose_only" && audit.value.verdict !== "pass"
    ? [{ kind: "audit_summary", status: "incomplete", reason: "canonical audit reports structural gaps" }]
    : [];
  // Keep the canonical attempt's exact diagnostic in the stage result, but do
  // not expose provider/attempt/receipt internals through the user completion
  // view when an external review is unavailable.
  const userSafeMissing = missing.map((item) => /(?:\bprovider\b|\btoken\b|\battempt\b|\breviews?\/|receipts?\/|[a-f0-9]{64})/i.test(item)
    ? "正式审查结果暂不可用，原始原因已保留在系统记录"
    : item);
  const completion = buildStageCompletion(stage, {
    result: completionResult ?? (missing.length ? "completed_with_open_items" : "passed"),
    ...copy,
    verification: { conclusion: verification, limits: missing.length ? ["仍有未完成项，不能当作无条件通过"] : [] },
    artifacts,
    review: completionReview(reviews),
    confirmation_summary: {
      completed: `${copy.objective}；${copy.effect}`,
      specification: `${copy.objective}；${copy.effect}`,
      scope: [`当前 ${stage} 的已声明范围`],
      non_goals: ["不扩大当前阶段范围，也不把质量事实当成交付许可"],
      phases: [stage],
      dependencies: stage === "make-decision" ? [] : ["读取上一阶段的正式事实"],
      tests: [verification],
      review_advice: "异源 review 是建议事实；真实 unavailable、revise_required 或 finding 必须继续保留",
      risks: userSafeMissing.length ? userSafeMissing : ["当前验证只覆盖已声明范围"],
      deferred: missing.length ? userSafeMissing : ["未在本阶段声明的工作留给后续阶段"],
      next_stage_boundary: `下一阶段 ${copy.next_owner} 只能读取当前正式事实，不能猜测缺失需求`,
      expected_impact: copy.effect,
    },
    business_facts: businessFacts,
    declared_components: declaredComponents,
    invocation_facts: invocationFacts,
    audit_gaps: auditGaps,
    ...(stage === "verify-code" && Array.isArray(result.facts?.verification_items) && result.facts.verification_items.length > 0
      ? { verification_items: result.facts.verification_items.map((item) => ({
          ...item,
          evidence_refs: item.evidence_refs.map(({ ref, sha256 }) => ({ ref, hash: sha256 })),
        })) }
      : {}),
    missing_items: userSafeMissing,
    risks: userSafeMissing,
    dependencies: stage === "make-decision" ? [] : ["读取上一阶段的 publication"],
    recovery_conditions: ["若下游证明输入无效，返回当前阶段修复后重新发布"],
    downstream_read_rule: `只读取 publications/${stage}/ 中的正式事实`,
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
  return Boolean(NAMESPACE[name] && ref.startsWith(NAMESPACE[name]));
}
function assertCurrentNamespace(worker, ref) {
  if (/^(?:receipts|reviews)\//.test(ref)) {
    throw new Error(`vNext record must use quality namespace; legacy projection is retired: ${ref}`);
  }
}
function auditFacts(worker, invocation) {
  const ref = text(object(invocation.receipts, "receipts").audit, "audit summary ref");
  if (!validReceiptRef("audit", ref)) throw new Error("audit summary ref is outside its canonical namespace");
  const record = object(worker.readReceipt(ref), "audit summary record");
  const value = object(record.value, "audit summary");
  if (value.schema_version !== "v1" || value.task_id !== worker.identity.taskId
      || value.stage_slug !== worker.stage || !new Set(["pass", "fail"]).has(value.verdict)
      || !SHA256.test(value.summary_hash ?? "") || !Array.isArray(value.content_evidence_refs)
      ) {
    throw new Error("audit summary is not an authenticated summary for this stage");
  }
  return {
    value,
    facts: {
      audit_contract_version: "v1",
      audit_summary_ref: ref,
      audit_summary_hash: value.summary_hash,
      audit_verdict: value.verdict,
      ...(worker.stage === "make-decision" ? { audit_through_step_id: value.through_step_id } : {}),
      content_evidence_refs: value.content_evidence_refs,
    },
    evidence: { ref, sha256: record.sha256 },
  };
}

function makeDecisionInteractionAggregate(worker, audit, decision, snapshotTree) {
  const refs = audit?.value?.content_evidence_refs?.filter(({ kind }) => kind === "interaction-completion.v1") ?? [];
  let binding = refs.length === 1 ? refs[0] : null;
  if (!binding && typeof worker.readInteractionAggregate === "function") {
    const aggregate = worker.readInteractionAggregate();
    binding = aggregate ? { ref: aggregate.ref, hash: aggregate.hash } : null;
  }
  if (!binding) throw materialIncomplete("make-decision interaction aggregate is missing");
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
      || value.snapshot_tree !== snapshotTree
      || (audit && value.workflow_run_id !== audit.value.workflow_run_id)
      || (audit && value.snapshot_tree !== audit.value.snapshot_tree)
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
  const refs = object(invocation.receipts, "receipts");
  if (typeof refs[name] !== "string" || refs[name].trim() === "") {
    throw materialIncomplete(`${worker.stage} ${name} receipt ref is missing; expected ${NAMESPACE[name] ?? "canonical"} namespace`);
  }
  let ref = text(refs[name], `${name} receipt ref`);
  if (name === "decision") {
    if (refs.decision_revision !== undefined) {
      throw new Error("decision replacement refs are retired; use the current decision-log.md");
    } else if (ref !== "quality/evidence/decision.json") {
      throw new Error("make-decision run must bind the current canonical decision receipt");
    }
  }
  const namespace = NAMESPACE[name];
  if (!validReceiptRef(name, ref)) {
    throw new Error(`${name} receipt ref is outside its canonical ${namespace ?? "unknown"} namespace`);
  }
  assertCurrentNamespace(worker, ref);
  let record;
  try { record = object(worker.readReceipt(ref), `${name} receipt record`); }
  catch (error) {
    if (error?.code === "ENOENT") throw materialIncomplete(`${worker.stage} ${name} receipt missing: ${ref}`);
    throw error;
  }
  const value = object(record.value, `${name} receipt`);
  const allowedProducerStages = new Set(Array.isArray(producerStage) ? producerStage : [producerStage]);
  text(record.sha256, `${name} receipt hash`);
  if (reviewName(name)) {
    validateSchema(REVIEW_ATTEMPT_REF.test(ref) ? "attempt" : "result", value);
  } else {
    if (value.schema_version !== RECEIPT_SCHEMA) throw new Error(`${name} receipt schema_version must be ${RECEIPT_SCHEMA}`);
    const producer = object(value.producer, `${name} receipt producer provenance`);
    text(producer.component, `${name} receipt producer.component`);
    text(producer.version, `${name} receipt producer.version`);
    if (!allowedProducerStages.has(producer.stage)) throw new Error(`${name} receipt producer stage mismatch`);
    if (producer.component !== EXPECTED_COMPONENT[name] && !new Set(["tests", "research", "grill"]).has(name)) throw new Error(`${name} receipt producer component is not official`);
  }
  if (value.task_id !== worker.identity.taskId) throw new Error(`${name} receipt task mismatch`);
  if (!allowedProducerStages.has(value.stage)) throw new Error(`${name} receipt stage mismatch`);
  return { ref, value, evidence: { ref, sha256: record.sha256 } };
}
function testFacts(worker, invocation, name = "tests", producerStage = worker.stage) {
  const item = receipt(worker, invocation, name, producerStage);
  text(item.value.command, `${name}.command`);
  if (!Number.isInteger(item.value.exit_code)) throw new TypeError(`${name}.exit_code must be integer`);
  for (const key of ["command_hash", "snapshot_head", "snapshot_tree", "snapshot_commit", "started_at", "completed_at", "output_ref", "output_hash"]) text(item.value[key], `${name}.${key}`);
  if (item.value.command_hash !== hashText(item.value.command)) throw new Error(`${name}.command_hash does not match command`);
  if (item.value.source_digest !== undefined && !SHA256.test(item.value.source_digest)) throw new Error(`${name}.source_digest must be sha256`);
  if (!/^quality\/tests\/output\//.test(item.value.output_ref) || item.value.output_ref.includes("..")) throw new Error(`${name}.output_ref must use canonical test-output namespace`);
  return {
    facts: {
      command: item.value.command,
      exit_code: item.value.exit_code,
      command_hash: item.value.command_hash,
      snapshot_head: item.value.snapshot_head,
      snapshot_commit: item.value.snapshot_commit,
      snapshot_tree: item.value.snapshot_tree,
      ...(item.value.source_digest === undefined ? {} : { source_digest: item.value.source_digest }),
      test_scope: item.value.command.trim() === "npm test" ? "full" : "focused",
      started_at: item.value.started_at,
      completed_at: item.value.completed_at,
      receipt_ref: item.ref,
      receipt_hash: item.evidence.sha256,
      output_ref: item.value.output_ref,
      output_hash: item.value.output_hash,
    },
    evidence: item.evidence,
  };
}

function confirmationFacts(worker, invocation) {
  const ref = text(object(invocation.receipts, "receipts").confirmation, "confirmation receipt ref");
  if (!validReceiptRef("confirmation", ref)) throw new Error("confirmation receipt ref is outside its canonical namespace");
  const record = object(worker.readReceipt(ref), "human confirmation record");
  const value = validateHumanConfirmation(record.value, { taskId: worker.identity.taskId, stage: worker.stage, requireAccepted: false });
  return { facts: { decision: value.decision, confirmation_ref: ref, confirmation_hash: record.sha256, snapshot_tree: value.snapshot_tree }, evidence: { ref, sha256: record.sha256 } };
}
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
    const semanticFields = ["scenario", "oracle", "actual_outcome", "coverage_limits"];
    const semanticMissing = semanticFields.filter((field) => typeof value[field] !== "string" || value[field].trim() === "");
    const anchorsValid = semanticAnchor(value.implementation_anchor) && semanticAnchor(value.verification_anchor);
    if (value.status === "covered" && (semanticMissing.length > 0 || !anchorsValid)) {
      // Do not let a caller's covered label become a green quality fact. Keep
      // the run inspectable, but downgrade the row until it has a concrete
      // scenario/oracle/outcome and two independent proof anchors.
      return {
        acceptance_criterion_id: id,
        status: "unknown",
        evidence_refs: [],
        semantic_gap: `covered claim lacks semantic proof: ${[...semanticMissing, ...(anchorsValid ? [] : ["implementation_anchor/verification_anchor"])].join(", ")}`,
      };
    }
    return {
      acceptance_criterion_id: id,
      status: value.status,
      evidence_refs: refs,
      ...(value.status === "covered" ? {
        scenario: value.scenario,
        oracle: value.oracle,
        actual_outcome: value.actual_outcome,
        coverage_limits: value.coverage_limits,
        implementation_anchor: value.implementation_anchor,
        verification_anchor: value.verification_anchor,
      } : {}),
    };
  });
  if (declared.size) throw new Error("acceptance_coverage is missing an accepted criterion");
  const proofOwners = new Map();
  const normalizedItems = items.map((item) => {
    if (item.status !== "covered") return item;
    for (const anchor of [item.implementation_anchor, item.verification_anchor]) {
      const signature = JSON.stringify([anchor.path, anchor.start_line, anchor.end_line, anchor.role]);
      const previous = proofOwners.get(signature);
      if (previous !== undefined && previous !== item.acceptance_criterion_id) {
        return {
          acceptance_criterion_id: item.acceptance_criterion_id,
          status: "unknown",
          evidence_refs: [],
          semantic_gap: `covered claim shares proving anchor with ${previous}`,
        };
      }
      proofOwners.set(signature, item.acceptance_criterion_id);
    }
    return item;
  });
  return { snapshot_tree: snapshotTree, accepted_criterion_ids: coverage.accepted_criterion_ids, items: normalizedItems };
}

function sameStringSet(left, right) {
  return left.length === right.length && [...left].sort().every((value, index) => value === [...right].sort()[index]);
}

function differsOnlyByTasksCompletion(worker, expectedTree, actualTree) {
  if (expectedTree === actualTree) return true;
  const root = worker.workspace?.worktreeRoot;
  if (!root) return false;
  return isMaterialOnlySnapshotDelta(root, expectedTree, actualTree);
}

function unavailableFormalRecordStatus(reason = "canonical Phase history is unavailable; current quality facts remain authoritative") {
  return Object.freeze({ status: "unavailable", reason });
}

function authenticateTaskCompletionEvidence(worker, entry) {
  if (entry?.kind === "git_commit") {
    return { ok: false, reason: "git_commit completion evidence needs an authenticated task record" };
  }
  try {
    const evidence = worker.readEvidence(entry.ref);
    return { ok: true, sha256: evidence.sha256 ?? hashText(evidence.bytes) };
  } catch (error) {
    if (error?.code === "ENOENT") {
      return { ok: false, reason: "historical evidence unavailable" };
    }
    throw error;
  }
}

export function certifyBuildCodeQualityBasis({
  changedFiles,
  plannedChanges,
  tests,
  review,
  expectedAc,
  coveredAc,
  formalRecordStatus = unavailableFormalRecordStatus(),
} = {}) {
  if (!Array.isArray(changedFiles) || !Array.isArray(plannedChanges)) {
    throw new TypeError("build-code changedFiles and plannedChanges must be arrays");
  }
  // Task completion prose and declared file boundaries are historical audit
  // context. They must remain inspectable, but stale or incomplete task rows
  // must not become a permit that blocks the current implementation facts.
  const planned = new Set(plannedChanges);
  const outside = [...new Set(changedFiles)].filter((path) => !planned.has(path));
  const qualityGaps = [];
  if (tests?.exit_code !== 0) qualityGaps.push("current risk tests are not passing");
  if (review?.status !== "unavailable" && review?.verdict !== "pass") qualityGaps.push("integration review is not passing");
  const reviewRef = review?.result_ref ?? review?.attempt_ref;
  const reviewHash = review?.result_hash ?? review?.attempt_hash;
  if (typeof reviewRef !== "string" || !SHA256.test(reviewHash ?? "")) {
    qualityGaps.push("authenticated independent review fact is unavailable");
  }
  if (!Array.isArray(expectedAc) || !Array.isArray(coveredAc) || !sameStringSet(coveredAc, expectedAc)) {
    qualityGaps.push("current acceptance coverage differs from the current spec AC set");
  }
  if (!formalRecordStatus || !["available", "unavailable"].includes(formalRecordStatus.status)
      || (formalRecordStatus.status === "unavailable" && typeof formalRecordStatus.reason !== "string")) {
    throw new TypeError("formal_record_status must be available or unavailable with a reason");
  }
  return Object.freeze({
    changed: Object.freeze([...new Set(changedFiles)]),
    audit_gaps: Object.freeze(outside.length ? [`current diff includes files outside historical task boundaries: ${outside.join(", ")}`] : []),
    review: Object.freeze({ ref: reviewRef ?? null, sha256: reviewHash ?? null, verdict: review.verdict ?? null, status: review.status ?? null }),
    quality_gaps: Object.freeze(qualityGaps),
    formal_record_status: Object.freeze({ ...formalRecordStatus }),
  });
}

function authenticatedImplementationChanged(worker, implementation) {
  const evidence = worker.readEvidence(implementation.diff_ref);
  if ((evidence.sha256 ?? hashText(evidence.bytes)) !== implementation.diff_hash) {
    throw new Error("implementation diff evidence hash mismatch");
  }
  let record;
  try { record = JSON.parse(evidence.bytes); }
  catch { throw new Error("implementation diff evidence must be JSON"); }
  if (record?.schema_version !== "workflowhub-diff-evidence.v1"
      || typeof record.baseline_commit !== "string"
      || record.snapshot_tree !== implementation.snapshot_tree) {
    throw new Error("implementation diff evidence does not bind the current execution baseline and snapshot");
  }
  const tracked = execFileSync(
    "git",
    ["diff", "--no-renames", "--name-only", record.baseline_commit, implementation.snapshot_commit, "--"],
    { cwd: worker.workspace.worktreeRoot, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
  ).trim().split("\n").filter(Boolean);
  const untracked = (Array.isArray(record.untracked) ? record.untracked : []).map((entry) => {
    if (!entry || typeof entry.path !== "string" || !/^[a-f0-9]{40}$/.test(entry.blob_oid ?? "")) {
      throw new Error("implementation diff evidence contains an invalid untracked entry");
    }
    const blob = execFileSync("git", ["hash-object", "--", entry.path], {
      cwd: worker.workspace.worktreeRoot, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
    }).trim();
    if (blob !== entry.blob_oid) throw new Error(`implementation untracked evidence hash mismatch: ${entry.path}`);
    return entry.path;
  });
  const actual = normalizeRuntimeOnlyPaths([...tracked, ...untracked]);
  if (!sameStringSet(actual, normalizeRuntimeOnlyPaths(implementation.changed))) {
    throw new Error(`implementation.changed differs from the authenticated execution-baseline diff: receipt=${JSON.stringify(implementation.changed)} actual=${JSON.stringify(actual)}`);
  }
  return actual;
}

export function certifyCurrentTaskCompletion(worker, {
  changedFiles,
  tests,
  review,
  acceptanceCoverage,
  formalRecordStatus = unavailableFormalRecordStatus(),
} = {}) {
  const validation = validatePlanTaskContract({
    spec: worker.readArtifact("spec.md"),
    plan: worker.readArtifact("plan.md"),
    tasks: worker.readArtifact("tasks.md"),
    // Task completion fields are a human-readable historical audit. Their
    // current reachability is not a permit to progress or finish; global
    // implementation, test, AC and review facts are authenticated below.
    completionEvidence: (entry) => authenticateTaskCompletionEvidence(worker, entry),
  });
  const taskCompletion = validation.facts?.task_completion;
  const taskRows = new Map((validation.facts?.task_rows ?? []).map((row) => [row.id, row]));
  const tasksPath = `specs/${worker.identity.taskId}/tasks.md`;
  const expectedChanges = [...new Set((changedFiles ?? []).filter((path) => path !== tasksPath && path !== "AGENTS.md"))];
  const completionGaps = [];
  if (!taskCompletion || taskCompletion.total_count === 0) {
    completionGaps.push("tasks.md has no certifiable Task completion rows; current implementation, tests, AC coverage, and review facts are authoritative");
  } else if (taskCompletion.completed_count !== taskCompletion.total_count) {
    const details = taskCompletion.tasks
      .filter(({ complete }) => !complete)
      .map(({ id, errors }) => `${id}: ${errors.join(", ") || "not completed"}`);
    completionGaps.push(`tasks.md completion history is incomplete: ${details.join("; ")}`);
  }
  const plannedChangesFromRows = [...new Set([...taskRows.values()].flatMap((task) => [
      ...(task.fields?.["精确文件"]?.match(/`([^`]+)`/g) ?? []).map((path) => path.slice(1, -1)),
      ...(task.fields?.boundary?.match(/`([^`]+)`/g) ?? []).map((path) => path.slice(1, -1)),
  ]))];
  const reviewRef = review.result_ref ?? review.attempt_ref;
  const reviewHash = review.result_hash ?? review.attempt_hash;
  if (!acceptanceCoverage || !Array.isArray(acceptanceCoverage.accepted_criterion_ids)
      || acceptanceCoverage.accepted_criterion_ids.length === 0) {
    completionGaps.push("build-code acceptance coverage is unavailable; quality warning only");
  }
  const declaredAc = validation.facts?.ac_coverage?.accepted_ids;
  if (!Array.isArray(declaredAc) || declaredAc.length === 0) {
    completionGaps.push("build-code current spec acceptance criteria are unavailable; quality warning only");
  }
  const expectedAc = Array.isArray(declaredAc) ? declaredAc : [];
  if (Array.isArray(acceptanceCoverage?.accepted_criterion_ids)
      && !sameStringSet(acceptanceCoverage.accepted_criterion_ids, expectedAc)) {
    completionGaps.push("build-code acceptance coverage differs from the current spec AC set; quality warning only");
  }
  if (!validation.ok) completionGaps.push("plan/task structural diagnostics are incomplete; current implementation, tests, AC coverage, and review facts remain authoritative");
  const coveredItems = (acceptanceCoverage?.items ?? []).filter(({ status }) => status === "covered");
  if (coveredItems.length !== expectedAc.length) completionGaps.push("build-code does not have covered evidence for every accepted AC; quality warning only");
  const quality = certifyBuildCodeQualityBasis({
    changedFiles: expectedChanges,
    plannedChanges: plannedChangesFromRows,
    tests,
    review,
    expectedAc,
    coveredAc: coveredItems.map(({ acceptance_criterion_id: id }) => id),
    formalRecordStatus,
  });
  const formal = quality.formal_record_status?.status === "unavailable" || completionGaps.length
    ? Object.freeze({
      status: "unavailable",
      reason: [quality.formal_record_status?.reason, ...completionGaps].filter(Boolean).join("; "),
    })
    : Object.freeze({ ...quality.formal_record_status });
  const completion = {
    status: "completed",
    evidence_ref: worker.artifactRef("tasks.md"),
    evidence_hash: hashText(worker.readArtifact("tasks.md")),
    integration_review: { ref: reviewRef, sha256: reviewHash },
    formal_record_status: formal,
    quality_gaps: Object.freeze([...(quality.quality_gaps ?? []), ...completionGaps]),
  };
  // Audit gaps are diagnostic context for the caller, not part of the
  // canonical phase-completion receipt schema.  Keep the compatibility
  // accessor non-enumerable so tests and summaries can report it without
  // leaking an unknown field into task-kernel publication.
  Object.defineProperty(completion, "audit_gaps", {
    value: Object.freeze([...completionGaps, ...(quality.audit_gaps ?? []), ...(quality.quality_gaps ?? [])]),
    enumerable: false,
  });
  return Object.freeze(completion);
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
  const attemptId = result.attempt_ref.match(REVIEW_ATTEMPT_REF)?.[1];
  if (!attemptId || attempt.attempt_id !== attemptId) throw new Error("review attempt_ref identity mismatch");
  for (const key of ["task_id", "stage", "review_track", "snapshot_tree", "material_id", "subject_kind", "phase_id", "review_scope", "base_tree", "candidate_tree"]) {
    if (attempt[key] !== result[key]) throw new Error(`review attempt/result ${key} mismatch`);
  }
  if (attempt.terminal_status !== "semantic" || attempt.error !== null) throw new Error("review attempt did not produce a semantic result");
  const minimumReviewers = reviewMinimumForAttempt(attempt, producerStage, expectedTrack);
  const terminalAttempts = new Map();
  for (const providerAttempt of attempt.provider_attempts) terminalAttempts.set(providerAttempt.provider, providerAttempt);
  const providerOutputs = [];
  for (const providerAttempt of terminalAttempts.values()) {
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
  if (attempt.provider_attempts.length === 0
      && !["MATERIAL_INCOMPLETE", "MATERIAL_FORBIDDEN"].includes(attempt.error.code)) {
    throw new Error("review unavailable attempt must contain provider attempts");
  }
  const latestByProvider = new Map();
  for (const providerAttempt of attempt.provider_attempts) {
    let output = null;
    if (providerAttempt.output_ref !== null) {
      const providerRoot = "quality/reviews";
      const providerPrefix = `${providerRoot}/attempts/${attemptId}/providers/`;
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
  const aggregation = aggregateCanonicalProviderResults(recomputed, reviewMinimumForAttempt(attempt, producerStage, expectedTrack));
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
  if (!review || !review.scope) return `${label} is missing an authenticated integration review fact`;
  if (review.facts?.status !== "unavailable" && review.facts?.verdict !== "pass") {
    return `${label} verdict is ${review.facts?.verdict ?? "missing"}; quality remains visible but does not block stage progression`;
  }
  const scope = review.scope;
  if (scope.subject_kind !== "worktree" || scope.review_scope !== "integration" || scope.phase_id !== null || scope.candidate_tree !== review.facts.snapshot_tree) {
    return `${label} is not a same-snapshot full-worktree integration review; quality remains visible but does not block stage progression`;
  }
  return null;
}
function requireStoredFinalIntegrationReview(review, label) {
  if (!review || review.status === "unavailable" || review.subject_kind !== "worktree" || review.review_scope !== "integration" || review.phase_id !== null) {
    throw new Error(`MATERIAL_INCOMPLETE: ${label} is missing the required build-code integration review scope; return to build-code`);
  }
  return review;
}

function riskAcceptanceForReview(worker, invocation, review, expectedTrack, receiptName, stage = worker.stage) {
  const supplied = invocation.receipts?.[receiptName];
  if (supplied === undefined) return { verified: false, evidence: [] };
  const refs = Array.isArray(supplied) ? supplied : [supplied];
  const pause = deriveSeriousReviewPause({
    taskId: worker.identity.taskId,
    stage,
    reviewRef: review.ref,
    reviewHash: review.evidence.sha256,
    result: review.value,
    workflowRunId: typeof worker.deriveStageWorkflowRunId === "function"
      ? worker.deriveStageWorkflowRunId(stage)
      : worker.workflowRunId,
  });
  if (pause.status !== "paused") throw new Error(`${receiptName} is supplied but the review has no serious actionable findings`);
  const accepted = refs.map((ref) => {
    const record = object(worker.readReceipt(ref), `${receiptName} record`);
    validateRiskAcceptance({ acceptance: record.value, pause });
    return { ref, sha256: record.sha256, finding_id: record.value.finding_id };
  });
  const acceptedIds = new Set(accepted.map((entry) => entry.finding_id));
  const missing = pause.findings.map(({ finding_id: id }) => id).filter((id) => !acceptedIds.has(id));
  if (missing.length) throw new Error(`${receiptName} must cover every serious review finding: ${missing.join(", ")}`);
  return { verified: true, evidence: accepted.map(({ ref, sha256 }) => ({ ref, sha256 })) };
}

function reviewDispositionWarnings(worker, review, riskAcceptance, producerStage) {
  if (review?.facts?.status === "unavailable") return [];
  // A passing review has already classified its findings in the authenticated
  // result. Only a revise_required result needs a separate handoff
  // disposition; otherwise an advisory pass can incorrectly make the stage
  // incomplete.
  if (review?.value?.verdict === "pass") return [];
  const clusters = canonicalReviewFindings(review.value);
  if (clusters.length === 0) return [];

  const findingIds = clusters.map((cluster) => cluster.id).filter(Boolean);
  const warnings = [
    `review findings require per-finding analysis and disposition before handoff: ${findingIds.join(", ") || "unresolved findings"}`,
  ];
  const pause = deriveSeriousReviewPause({
    taskId: worker.identity.taskId,
    stage: producerStage,
    reviewRef: review.ref,
    reviewHash: review.evidence.sha256,
    result: review.value,
    workflowRunId: typeof worker.deriveStageWorkflowRunId === "function"
      ? worker.deriveStageWorkflowRunId(producerStage)
      : worker.workflowRunId,
  });
  if (pause.status === "paused") {
    const seriousIds = pause.findings.map(({ finding_id }) => finding_id);
    warnings.push(riskAcceptance.verified
      ? `serious review findings remain revise_required; explicit risk acceptance is recorded but does not make the review pass: ${seriousIds.join(", ")}`
      : `serious review findings require repair or explicit risk acceptance before formal completion: ${seriousIds.join(", ")}`);
  } else if (review.value.verdict === "revise_required" && !riskAcceptance.verified) {
    warnings.push("review findings recorded; response evidence: unknown/unverified");
  }
  return warnings;
}

const FINDING_DISPOSITION_STATUSES = new Set(["fixed", "rejected_invalid", "accepted_risk", "needs_human"]);
const FINDING_DISPOSITION_FIELDS = new Set([
  "finding_id", "original_fact", "source", "consequence", "status", "next_action",
  "evidence_ref", "owner", "consumer", "retain_or_delete",
]);

function findingDispositions(reviews, invocation) {
  const findings = reviews.flatMap((review) => review?.value?.findings ?? [])
    .filter((finding) => typeof finding?.id === "string");
  const ids = [...new Set(findings.map(({ id }) => id))];
  if (ids.length === 0) {
    return { facts: { status: "not_applicable", items: [] }, missing_items: [] };
  }
  const supplied = invocation.finding_dispositions;
  if (supplied === undefined) {
    return {
      facts: { status: "incomplete", items: [] },
      missing_items: [`finding disposition is missing for: ${ids.join(", ")}`],
    };
  }
  if (!Array.isArray(supplied)) throw new TypeError("finding_dispositions must be an array");
  const seen = new Set();
  const items = supplied.map((entry, index) => {
    const value = object(entry, `finding_dispositions[${index}]`);
    for (const key of Object.keys(value)) {
      if (!FINDING_DISPOSITION_FIELDS.has(key)) throw new Error(`finding_dispositions[${index}] has unknown field ${key}`);
    }
    for (const key of FINDING_DISPOSITION_FIELDS) text(value[key], `finding_dispositions[${index}].${key}`);
    if (!FINDING_DISPOSITION_STATUSES.has(value.status)) throw new Error(`finding_dispositions[${index}].status is invalid`);
    if (seen.has(value.finding_id)) throw new Error(`duplicate finding disposition: ${value.finding_id}`);
    seen.add(value.finding_id);
    return Object.freeze({ ...value });
  });
  const missing = ids.filter((id) => !seen.has(id));
  const extra = [...seen].filter((id) => !ids.includes(id));
  if (extra.length) throw new Error(`finding_dispositions contains unknown finding: ${extra.join(", ")}`);
  return {
    facts: { status: missing.length ? "incomplete" : "recorded", items },
    missing_items: missing.length ? [`finding disposition is missing for: ${missing.join(", ")}`] : [],
  };
}

function requirementReplayFacts(worker, verification, currentTree) {
  const decisionLog = worker.readArtifact("decision-log.md");
  const expected = [...new Set([
    ...[...String(decisionLog).matchAll(/\bR\d+\b/g)].map(([id]) => id),
    ...[...String(decisionLog).matchAll(/\b(?:F15|F47|KD|F8|M08)-\d+\b/g)].map(([id]) => id),
    ...[...String(decisionLog).matchAll(/\bINC-\d+\b/g)].map(([id]) => id),
    ...[...String(decisionLog).matchAll(/\bD\d+\b/g)].map(([id]) => id),
  ])];
  if (expected.length === 0) return { facts: { status: "not_applicable", items: [] }, missing_items: [] };
  const replay = verification?.value?.requirement_replay;
  if (!Array.isArray(replay)) {
    return {
      facts: { status: "incomplete", items: [] },
      missing_items: ["verify-code requirement replay is missing for the current decision-log sources"],
    };
  }
  const seen = new Set();
  const replayProofOwners = new Map();
  const items = replay.map((entry, index) => {
    const value = object(entry, `requirement_replay[${index}]`);
    const allowed = new Set(["source_id", "status", "snapshot_tree", "linked_ids", "evidence_refs", "reason", "scenario", "oracle", "actual_outcome", "coverage_limits", "implementation_anchor", "verification_anchor"]);
    if (Object.keys(value).some((key) => !allowed.has(key))) throw new Error(`requirement_replay[${index}] has unknown field`);
    text(value.source_id, `requirement_replay[${index}].source_id`);
    if (seen.has(value.source_id)) throw new Error(`duplicate requirement replay source: ${value.source_id}`);
    if (!new Set(["pass", "fail", "unknown", "deferred", "unavailable"]).has(value.status)) throw new Error(`requirement_replay[${index}].status is invalid`);
    const replaySnapshotMatches = value.snapshot_tree === currentTree
      || (worker.workspace?.worktreeRoot
        && isMaterialOnlySnapshotDelta(worker.workspace.worktreeRoot, value.snapshot_tree, currentTree));
    if (!replaySnapshotMatches) throw new Error(`requirement_replay ${value.source_id} does not bind the current snapshot`);
    if (!Array.isArray(value.linked_ids) || value.linked_ids.length === 0 || value.linked_ids.some((id) => typeof id !== "string" || id.trim() === "")) throw new Error(`requirement_replay ${value.source_id}.linked_ids is invalid`);
    if (!Array.isArray(value.evidence_refs)) throw new Error(`requirement_replay ${value.source_id}.evidence_refs is invalid`);
    if (value.status === "pass" && value.evidence_refs.length === 0) throw new Error(`requirement_replay ${value.source_id} pass requires evidence`);
    const evidenceRefs = value.evidence_refs.map((binding, bindingIndex) => {
      const ref = object(binding, `requirement_replay ${value.source_id}.evidence_refs[${bindingIndex}]`);
      if (typeof ref.ref !== "string" || !/^(?:evidence|quality\/evidence|quality\/tests)\//.test(ref.ref) || ref.ref.includes("..") || !SHA256.test(ref.sha256 ?? "")) throw new Error(`requirement_replay ${value.source_id} evidence reference is invalid`);
      const record = worker.readReceipt(ref.ref);
      if (record.sha256 !== ref.sha256) throw new Error(`requirement_replay ${value.source_id} evidence hash mismatch`);
      return { ref: ref.ref, sha256: ref.sha256 };
    });
    const reason = text(value.reason, `requirement_replay[${index}].reason`);
    const semanticFields = ["scenario", "oracle", "actual_outcome", "coverage_limits"];
    const semanticMissing = value.status === "pass"
      ? semanticFields.filter((field) => typeof value[field] !== "string" || value[field].trim() === "")
      : [];
    let anchorCollision = null;
    if (value.status === "pass" && semanticAnchor(value.implementation_anchor) && semanticAnchor(value.verification_anchor)) {
      for (const anchor of [value.implementation_anchor, value.verification_anchor]) {
        const signature = JSON.stringify([anchor.path, anchor.start_line, anchor.end_line, anchor.role]);
        const previous = replayProofOwners.get(signature);
        if (previous !== undefined && previous !== value.source_id) anchorCollision = previous;
        replayProofOwners.set(signature, value.source_id);
      }
    }
    const anchorsValid = value.status !== "pass"
      || (semanticAnchor(value.implementation_anchor) && semanticAnchor(value.verification_anchor) && anchorCollision === null);
    const status = semanticMissing.length || !anchorsValid ? "unknown" : value.status;
    const semanticReason = semanticMissing.length || !anchorsValid
      ? `${reason}; semantic proof is incomplete: ${[...semanticMissing, ...(anchorsValid ? [] : [anchorCollision ? `shared proving anchor with ${anchorCollision}` : "implementation_anchor/verification_anchor"])].join(", ")}`
      : reason;
    seen.add(value.source_id);
    return {
      source_id: value.source_id,
      status,
      snapshot_tree: value.snapshot_tree,
      linked_ids: [...value.linked_ids],
      evidence_refs: evidenceRefs,
      reason: semanticReason,
      ...(status === "pass" ? {
        scenario: value.scenario,
        oracle: value.oracle,
        actual_outcome: value.actual_outcome,
        coverage_limits: value.coverage_limits,
        implementation_anchor: value.implementation_anchor,
        verification_anchor: value.verification_anchor,
      } : {}),
    };
  });
  const missing = expected.filter((id) => !seen.has(id));
  const extra = [...seen].filter((id) => !expected.includes(id));
  if (extra.length) throw new Error(`requirement_replay contains unknown source: ${extra.join(", ")}`);
  const unresolved = items.filter((item) => ["fail", "unknown", "unavailable"].includes(item.status));
  return {
    facts: { status: missing.length || unresolved.length ? "incomplete" : "recorded", items },
    missing_items: [
      ...(missing.length ? [`verify-code requirement replay is missing: ${missing.join(", ")}`] : []),
      ...(unresolved.length ? [`verify-code requirement replay remains unresolved: ${unresolved.map(({ source_id, status }) => `${source_id}=${status}`).join(", ")}`] : []),
    ],
  };
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
      risk_evidence: [],
      missing_items: [`review unavailable: ${code}: ${message}`],
    };
  }
  verifyReviewChain(worker, item.value, expectedTrack, producerStage);
  const scope = reviewScope(item.value);
  const riskAcceptanceName = expectedTrack !== undefined
    ? `${expectedTrack}_risk_acceptance`
    : (name === "quality_review" ? "quality_risk_acceptance" : "risk_acceptance");
  const riskAcceptance = item.value.verdict === "revise_required"
    ? riskAcceptanceForReview(worker, invocation, { ref: item.ref, evidence: item.evidence, value: item.value }, expectedTrack, riskAcceptanceName, producerStage)
    : { verified: false, evidence: [] };
  const riskEvidence = riskAcceptance.evidence;
  const dispositionWarnings = reviewDispositionWarnings(
    worker,
    { ref: item.ref, evidence: item.evidence, value: item.value },
    riskAcceptance,
    producerStage,
  );
  return {
    facts: { verdict: item.value.verdict, result_ref: item.ref, result_hash: item.evidence.sha256, snapshot_tree: item.value.snapshot_tree, ...(expectedTrack === undefined ? {} : { review_track: expectedTrack }), ...scopeFacts(scope) },
    ref: item.ref,
    evidence: item.evidence,
    value: item.value,
    scope,
    risk_evidence: riskEvidence,
    missing_items: dispositionWarnings,
  };
}

function unavailableReviewFacts(worker, invocation, name, expectedTrack, producerStage, error) {
  let item = null;
  try { item = receipt(worker, invocation, name, producerStage); }
  catch { /* The missing receipt is itself the disclosed quality warning. */ }
  const snapshot = item?.value?.snapshot_tree ?? worker.snapshotWorkspace?.().tree ?? null;
  return {
    facts: {
      status: "unavailable",
      ...(item?.ref ? { attempt_ref: item.ref, attempt_hash: item.evidence.sha256 } : {}),
      ...(snapshot ? { snapshot_tree: snapshot } : {}),
      ...(expectedTrack === undefined ? {} : { review_track: expectedTrack }),
      error: { code: "REVIEW_UNAVAILABLE", message: String(error?.message ?? error) },
    },
    ...(item ? { ref: item.ref, evidence: item.evidence, value: item.value } : {}),
    scope: null,
    risk_evidence: [],
    missing_items: [`${name} unavailable: ${error?.message ?? error}`],
  };
}

function safeReviewFacts(worker, invocation, name = "review", expectedTrack, producerStage = worker.stage) {
  try { return reviewFacts(worker, invocation, name, expectedTrack, producerStage); }
  catch (error) {
    // A missing/material-incomplete review is an honest quality fact and may
    // be disclosed without becoming a progression gate.  A malformed,
    // detached, or semantically contradictory review is an integrity failure:
    // converting it into "unavailable" would hide forged evidence.
    if (error?.code !== "MATERIAL_INCOMPLETE" && error?.code !== "ENOENT") throw error;
    return unavailableReviewFacts(worker, invocation, name, expectedTrack, producerStage, error);
  }
}

function authenticateReviewHead(review, expected) {
  if (review.facts?.status === "unavailable") return review;
  if (expected?.snapshot_tree !== undefined && review.value.snapshot_tree !== expected.snapshot_tree) {
    throw new Error("review result does not bind the expected snapshot");
  }
  return review;
}

function bindFinalReview(worker, invocation, review, currentTree, {
  stage,
  reviewTrack = null,
} = {}) {
  if (typeof currentTree !== "string" || !/^[a-f0-9]{40,64}$/.test(currentTree)) throw new Error(`${stage} current Workspace snapshot is required`);
  // An unavailable quality review is a disclosed, non-gating fact. It has no
  // semantic result to authenticate and must not make verify-code fail before
  // the verifier can publish its incomplete conclusion.
  if (review.facts?.status !== "unavailable") {
    authenticateReviewHead(review, {
      stage, review_track: reviewTrack, subject_kind: "worktree", phase_id: null,
      review_scope: stage === "build-code" ? "integration" : null,
    });
  }
  if (review.facts?.status === "unavailable") return { evidence: [] };
  if (review.value.snapshot_tree !== currentTree) {
    throw new Error(`${stage} review does not bind the final current snapshot`);
  }
  return { evidence: [] };
}

function bindBuildSpecReview(worker, invocation, review, currentTree) {
  const binding = bindFinalReview(worker, invocation, review, currentTree, { stage: "build-spec" });
  return binding.evidence;
}

/**
 * Audit notices intentionally stay out of `facts` and `evidence_refs`: an
 * optional response ledger cannot become a hidden acceptance contract. They
 * only make recorded accepted risk visible where a human already confirms.
 */
HANDLERS.set("make-decision", async (worker, input) => {
  let audit;
  try { audit = auditFacts(worker, input); } catch { audit = null; }
  const item = receipt(worker, input, "decision");
  const direction = reviewFacts(worker, input, "direction_review", "direction");
  const detail = reviewFacts(worker, input, "detail_review", "detail");
  const research = input.receipts.research === undefined ? null : testFacts(worker, input, "research");
  const grill = input.receipts.grill === undefined ? null : testFacts(worker, input, "grill");
  const confirmation = input.receipts.confirmation === undefined ? null : confirmationFacts(worker, input);
  const dispositions = findingDispositions([direction, detail], input);
  const auditMissingItems = audit
    ? []
    : ["audit unavailable/unverified/mismatch: decision coverage audit is missing", "support:audit"];
  const decisionRefPattern = /^quality\/evidence\/[a-f0-9]{64}\.md$/;
  if (typeof item.value.decision_ref !== "string" || !decisionRefPattern.test(item.value.decision_ref)
      || typeof item.value.decision_hash !== "string" || item.value.content_hash !== item.value.decision_hash) {
    throw new Error("decision-log receipt must point to the final human-readable artifact");
  }
  const decisionLog = worker.readEvidence(item.value.decision_ref);
  if (decisionLog.sha256 !== item.value.decision_hash || decisionLog.bytes.trim() === "") throw new Error("decision-log content hash mismatch");
  if (!Array.isArray(item.value.contract_refs)) throw new Error("decision-log contract refs must be an array");
  if (!worker.candidateWorkspace) throw new Error("verified CandidateWorkspace required");
  const snapshot = worker.candidateWorkspace.captureSnapshot();
  const interactionAggregate = makeDecisionInteractionAggregate(worker, audit, item, snapshot.tree);
  const directionBinding = bindFinalReview(worker, input, direction, snapshot.tree, { stage: "make-decision" });
  const detailBinding = bindFinalReview(worker, input, detail, snapshot.tree, { stage: "make-decision" });
  if (worker.candidateWorkspace.captureSnapshot().tree !== snapshot.tree) throw new Error("make-decision CandidateWorkspace changed while binding final reviews");
  return addCompletion("make-decision", {
    facts: {
      worktree_root: worker.candidateWorkspace.worktreeRoot,
      baseline_commit: worker.candidateWorkspace.baselineCommit,
      snapshot_tree: snapshot.tree,
      decision_ref: item.value.decision_ref,
      decision_hash: item.value.decision_hash,
      reviews: { direction: direction.facts, detail: detail.facts },
      ...(research ? { research: research.facts } : {}),
      ...(grill ? { grill: grill.facts } : {}),
      ...(confirmation ? { human_confirmation: confirmation.facts } : {}),
      finding_dispositions: dispositions.facts,
      ...(audit?.facts ?? {}),
    },
    evidence_refs: [
      item.evidence,
      { ref: item.value.decision_ref, sha256: item.value.decision_hash },
      ...item.value.contract_refs.map(({ ref, hash }) => ({ ref, sha256: hash })),
      { ref: interactionAggregate.ref, sha256: interactionAggregate.hash },
      direction.evidence, detail.evidence, ...(research ? [research.evidence] : []), ...(grill ? [grill.evidence] : []), ...(confirmation ? [confirmation.evidence] : []), ...(audit ? [audit.evidence] : []), ...direction.risk_evidence, ...detail.risk_evidence, ...directionBinding.evidence, ...detailBinding.evidence,
    ],
    missing_items: [...auditMissingItems, ...direction.missing_items, ...detail.missing_items, ...dispositions.missing_items],
  }, {
    worker,
    artifacts: [{ label: "最终决策文档", ref: item.value.decision_ref, hash: item.value.decision_hash, publication_lookup: "publications/make-decision/" }],
    reviews: [direction, detail],
    businessFacts: { content: "present", code: "not_applicable", tests: "not_applicable", acceptance_criteria: "covered" },
    audit,
    verification: "真实交互、最终决策和两轮正式审查已完成绑定检查",
  });
});
HANDLERS.set("build-spec", async (worker, input) => {
  let audit;
  let auditUnavailableReason;
  try {
    audit = auditFacts(worker, input);
  } catch (error) {
    audit = null;
    auditUnavailableReason = error.message;
  }
  const item = receipt(worker, input, "spec"), review = reviewFacts(worker, input);
  const dispositions = findingDispositions([review], input);
  text(item.value.content, "spec content");
  if (item.value.content_hash !== hashText(item.value.content)) throw new Error("spec content hash mismatch");
  if (worker.readArtifact("spec.md") !== item.value.content) throw new Error("spec artifact differs from final receipt");
  if (typeof worker.snapshotWorkspace !== "function") throw new Error("build-spec Workspace snapshot capability required");
  const before = object(worker.snapshotWorkspace(), "build-spec current Workspace snapshot");
  const bindingEvidence = bindBuildSpecReview(worker, input, review, before.tree);
  const after = object(worker.snapshotWorkspace(), "build-spec post-review Workspace snapshot");
  if (after.tree !== before.tree) throw new Error("build-spec Workspace changed while binding final spec review");
  const acceptanceDesign = validateAcceptanceDesignMinimum(item.value.content);
  return addCompletion("build-spec", {
    facts: { spec_ref: worker.artifactRef("spec.md"), snapshot_tree: before.tree, source_digest: before.source_digest, review: review.facts, finding_dispositions: dispositions.facts, ...(audit?.facts ?? {}) },
    evidence_refs: [item.evidence, review.evidence, ...(audit ? [audit.evidence] : []), ...review.risk_evidence, ...bindingEvidence],
    missing_items: [
      ...review.missing_items,
      ...dispositions.missing_items,
      ...(acceptanceDesign.ok ? [] : acceptanceDesign.errors.map((error) => `acceptance design incomplete: ${error}`)),
      ...(audit ? [] : [`audit unavailable/unverified/mismatch: ${auditUnavailableReason}`, "support:audit"]),
    ],
  }, {
    worker,
    artifacts: [{ label: "需求规格", ref: item.ref, hash: item.evidence.sha256, publication_lookup: "publications/build-spec/" }],
    reviews: [review],
    businessFacts: { content: "present", code: "not_applicable", tests: "not_applicable", acceptance_criteria: "covered" },
    audit,
    verification: "最终规格、工作区快照和正式审查已完成绑定检查",
  });
});
HANDLERS.set("build-plan", async (worker, input) => {
  const materials = Object.fromEntries(["decision-log.md", "spec.md", "plan.md", "tasks.md"].map((name) => {
    const content = text(worker.readArtifact(name), `${name} content`);
    return [name, content];
  }));
  const executable = validateExecutablePlanTaskMinimum({
    spec: materials["spec.md"],
    plan: materials["plan.md"],
    tasks: materials["tasks.md"],
  });
  if (!executable.ok) {
    throw new Error(`build-plan minimum executable contract failed: ${executable.errors.join("; ")}`);
  }
  const structural = validatePlanTaskContract({
    spec: materials["spec.md"],
    plan: materials["plan.md"],
    tasks: materials["tasks.md"],
    completionEvidence: (entry) => authenticateTaskCompletionEvidence(worker, entry),
  });
  if (typeof worker.snapshotWorkspace !== "function") throw new Error("build-plan Workspace snapshot capability required");
  const before = object(worker.snapshotWorkspace(), "build-plan current Workspace snapshot");
  const missingItems = structural.ok
    ? []
    : structural.errors.map((error) => `plan-task contract incomplete: ${error}`);
  const evidenceRefs = [];
  const optional = (label, operation) => {
    try { return operation(); }
    catch (error) {
      missingItems.push(`${label}: ${error.message}`);
      return null;
    }
  };
  optional("plan receipt missing/unverified/mismatch", () => {
    const item = receipt(worker, input, "plan");
    text(item.value.content, "plan content");
    if (item.value.content_hash !== hashText(item.value.content)
        || materials["plan.md"] !== item.value.content) {
      throw new Error("receipt hash/content differs from live plan.md");
    }
    evidenceRefs.push(item.evidence);
    return item;
  });
  optional("tasks receipt missing/unverified/mismatch", () => {
    const item = receipt(worker, input, "tasks");
    text(item.value.content, "tasks content");
    if (item.value.content_hash !== hashText(item.value.content)
        || materials["tasks.md"] !== item.value.content) {
      throw new Error("receipt hash/content differs from live tasks.md");
    }
    evidenceRefs.push(item.evidence);
    return item;
  });
  const audit = optional("audit unavailable/unverified/mismatch", () => auditFacts(worker, input));
  if (!audit) missingItems.push("support:audit");
  let review = null;
  optional("review unavailable/unverified/mismatch", () => {
    const candidate = reviewFacts(worker, input);
    const result = bindFinalReview(worker, input, candidate, before.tree, { stage: "build-plan" });
    review = candidate;
    evidenceRefs.push(candidate.evidence, ...(candidate.risk_evidence ?? []), ...result.evidence);
    missingItems.push(...candidate.missing_items);
    return result;
  });
  const dispositions = findingDispositions(review ? [review] : [], input);
  missingItems.push(...dispositions.missing_items);
  const after = object(worker.snapshotWorkspace(), "build-plan post-review Workspace snapshot");
  if (after.tree !== before.tree) throw new Error("build-plan Workspace changed while binding final plan review");
  const planRef = worker.artifactRef("plan.md");
  const tasksRef = worker.artifactRef("tasks.md");
  return addCompletion("build-plan", {
    facts: {
      plan_ref: planRef,
      tasks_ref: tasksRef,
      snapshot_tree: before.tree,
      source_digest: before.source_digest,
      ...(review ? { review: review.facts } : {}),
      finding_dispositions: dispositions.facts,
      ...(audit ? audit.facts : {}),
    },
    evidence_refs: evidenceRefs,
    missing_items: missingItems,
  }, {
    worker,
    artifacts: [
      { label: "实施计划", ref: planRef, hash: hashText(materials["plan.md"]), publication_lookup: "publications/build-plan/" },
      { label: "任务清单", ref: tasksRef, hash: hashText(materials["tasks.md"]), publication_lookup: "publications/build-plan/" },
    ],
    reviews: review ? [review] : [],
    businessFacts: { content: "present", code: "not_applicable", tests: "not_applicable", acceptance_criteria: "covered" },
    audit,
    verification: `四份当前材料可读，plan-task 最小可执行性检查通过；审计支持状态：${audit ? "recorded, pending publication verification" : "unavailable/unverified"}；审查状态：${review ? review.facts.status ?? review.facts.verdict : "unavailable/unverified"}`,
  });
});
HANDLERS.set("build-code", async (worker, input) => {
  const missingItems = [];
  const audit = (() => {
    try { return auditFacts(worker, input); }
    catch (error) {
      // Audit summaries are diagnostic publication support.  A stale or
      // unavailable summary must be disclosed, but cannot block current
      // implementation, tests, AC coverage, or integration review facts.
      missingItems.push(`audit unavailable/unverified/mismatch: ${error.message}`, "support:audit");
      return null;
    }
  })();
  const impl = receipt(worker, input, "implementation"), tests = testFacts(worker, input), review = safeReviewFacts(worker, input, "review");
  if (!Array.isArray(impl.value.changed)) throw new TypeError("implementation.changed must be array");
  for (const key of ["snapshot_head", "snapshot_tree", "snapshot_commit", "diff_ref", "diff_hash"]) text(impl.value[key], `implementation.${key}`);
  if (impl.value.snapshot_tree !== tests.facts.snapshot_tree || review.facts.snapshot_tree !== tests.facts.snapshot_tree) {
    missingItems.push("implementation, tests, and review use different snapshots; quality warning only");
  }
  const reviewWarning = requireFinalIntegrationReview(review, "build-code final review");
  if (reviewWarning) missingItems.push(reviewWarning);
  const dispositions = findingDispositions([review], input);
  missingItems.push(...dispositions.missing_items);
  let coverage;
  try { coverage = acceptanceCoverageFacts(worker, input, tests.facts.snapshot_tree); }
  catch (error) {
    if (error.message !== "build-code acceptance_coverage must be an object") throw error;
    missingItems.push(`acceptance coverage unavailable: ${error.message}`);
    coverage = { snapshot_tree: tests.facts.snapshot_tree, accepted_criterion_ids: [], items: [] };
  }
  let reviewBinding = { evidence: [] };
  try { reviewBinding = bindFinalReview(worker, input, review, tests.facts.snapshot_tree, { stage: "build-code" }); }
  catch (error) { missingItems.push(`build-code review binding unavailable: ${error.message}`); }
  if (tests.facts.exit_code !== 0) missingItems.push("build-code final tests are not passing; quality warning only");
  const actualChangedFiles = authenticatedImplementationChanged(worker, impl.value);
  const integrationAudit = typeof worker.inspectIntegrationReviewSubject === "function"
    ? worker.inspectIntegrationReviewSubject(tests.facts.snapshot_tree, { implementation_ref: impl.ref, green_ref: tests.ref })
    : { formal_record_status: unavailableFormalRecordStatus() };
  const phase = certifyCurrentTaskCompletion(worker, {
    changedFiles: actualChangedFiles,
    tests: tests.facts,
    review: review.facts,
    acceptanceCoverage: coverage,
    formalRecordStatus: integrationAudit.formal_record_status,
  });
  const current = worker.snapshotWorkspace();
  if (!differsOnlyByTasksCompletion(worker, tests.facts.snapshot_tree, current.tree)) {
    missingItems.push("current Workspace snapshot differs from the reviewed implementation; quality warning only");
  }
  return addCompletion("build-code", {
    facts: {
      changed: actualChangedFiles,
      tests: tests.facts,
      review: review.facts,
      finding_dispositions: dispositions.facts,
      phase_completion: phase,
      task_boundary_audit_gaps: phase.audit_gaps ?? [],
      acceptance_coverage: coverage,
      ...(audit?.facts ?? {}),
    },
    evidence_refs: [impl.evidence, { ref: impl.value.diff_ref, sha256: impl.value.diff_hash }, tests.evidence, ...(review.evidence ? [review.evidence] : []), ...(audit?.evidence ? [audit.evidence] : []), ...review.risk_evidence, ...reviewBinding.evidence, ...coverage.items.flatMap((item) => item.evidence_refs)],
    missing_items: [
      ...missingItems,
      ...review.missing_items,
    ],
  }, {
    worker,
    artifacts: [{ label: "实现结果", ref: impl.ref, hash: impl.evidence.sha256, publication_lookup: "publications/build-code/" }],
    reviews: [review],
    businessFacts: {
      content: "present",
      code: "complete",
      tests: tests.facts.exit_code === 0 ? "passed" : "failed",
      acceptance_criteria: coverage.items.every((item) => item.status === "covered") ? "covered" : "unknown",
    },
    audit,
    verification: review.facts.status === "unavailable"
      ? "正式测试通过；独立审查暂不可用，已保留为质量事实，verify-code 必须如实显示不完整"
      : (tests.facts.exit_code === 0 ? "正式测试通过，最终实现与集成审查绑定同一快照" : "正式测试未通过"),
  });
});

HANDLERS.set("verify-code", async (worker, input) => {
  const audit = (() => {
    try {
      const candidate = auditFacts(worker, input);
      const currentTree = worker.snapshotWorkspace?.().tree;
      if (candidate.value.snapshot_tree !== currentTree) return null;
      return candidate;
    }
    catch { return null; }
  })();
  const auditMissingItems = audit ? [] : ["audit summary unavailable/unverified; disclosed as audit-only"];
  // A complete same-snapshot suite is reusable across build-code and
  // verify-code. The verify-only focused check remains a separate receipt.
  const tests = testFacts(worker, input, "tests", ["build-code", "verify-code"]);
  const review = safeReviewFacts(worker, input, "review", undefined, "build-code");
  const qualityReview = safeReviewFacts(worker, input, "quality_review", undefined, "verify-code");
  const dispositions = findingDispositions([review, qualityReview], input);
  // The build-code integration review is historical audit context for verify-code.
  // It must not be re-authenticated as the current verify review flow: doing so
  // turns a missing/stale flow record into an unnecessary ordinary-work blocker.
  const evidence = receipt(worker, input, "evidence");
  const verification = input.receipts.verification === undefined ? null : receipt(worker, input, "verification");
  if (verification !== null && !Array.isArray(verification.value.items)) throw new TypeError("verification.items must be array");
  const current = worker.snapshotWorkspace();
  const replay = requirementReplayFacts(worker, verification, current.tree);
  const reviewBindingWarnings = [];
  let qualityReviewBinding = { evidence: [] };
  try { qualityReviewBinding = bindFinalReview(worker, input, qualityReview, current.tree, { stage: "verify-code" }); }
  catch (error) { reviewBindingWarnings.push(`verify-code review binding unavailable: ${error.message}`); }
  if (!Array.isArray(evidence.value.refs)) throw new TypeError("evidence.refs must be array");
  const criterionIds = new Set();
  const nestedEvidence = [];
  const failedEvidence = [];
  for (const [index, ref] of evidence.value.refs.entries()) {
    object(ref, `evidence.refs[${index}]`);
    text(ref.ref, `evidence.refs[${index}].ref`);
    text(ref.sha256, `evidence.refs[${index}].sha256`);
    if (!(ref.ref.startsWith("evidence/") || ref.ref.startsWith("quality/evidence/")) || ref.ref.includes("..")) throw new Error("verify evidence ref must use canonical evidence namespace");
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
  const taskContract = validatePlanTaskContract({
    spec: worker.readArtifact("spec.md"),
    plan: worker.readArtifact("plan.md"),
    tasks: worker.readArtifact("tasks.md"),
    completionEvidence: (entry) => authenticateTaskCompletionEvidence(worker, entry),
  });
  const completion = taskContract.facts?.task_completion;
  const auditGaps = [...auditMissingItems, ...reviewBindingWarnings];
  if (review.facts.status === "unavailable") auditGaps.push("build-code integration review is unavailable; verification remains quality-incomplete");
  if (qualityReview.facts.status === "unavailable") auditGaps.push("verify-code independent review is unavailable; verification remains quality-incomplete");
  if (!completion || completion.total_count === 0 || completion.completed_count !== completion.total_count) {
    auditGaps.push("tasks.md completion history is incomplete; current implementation, tests, and AC facts remain authoritative");
  }
  if (tests.facts.exit_code !== 0) mismatches.push("verify-code tests must pass");
  mismatches.push(...replay.missing_items);
  const expectedCriterionIds = taskContract.facts?.ac_coverage?.accepted_ids;
  if (!Array.isArray(expectedCriterionIds) || expectedCriterionIds.length === 0) {
    mismatches.push("verify-code current spec acceptance criteria are unavailable");
  } else if (!sameStringSet([...criterionIds], expectedCriterionIds)) {
    mismatches.push("verify-code acceptance evidence criterion set differs from the current spec AC set");
  }
  if (tests.facts.test_scope !== "full") mismatches.push("verify-code requires a complete npm test receipt");
  if (review.facts.status !== "unavailable"
      && (review.facts.review_scope !== "integration" || review.facts.subject_kind !== "worktree" || review.facts.phase_id !== null)) {
    mismatches.push("verify-code requires the accepted build-code final full-worktree review");
  }
  const workspaceRoot = worker.workspace?.worktreeRoot;
  const qualitySnapshotTree = qualityReview.facts.snapshot_tree;
  const qualitySnapshotMatches = qualityReview.facts.status === "unavailable"
    || equivalentWorkspaceTrees(workspaceRoot, qualitySnapshotTree, current.tree);
  const testSnapshotMatches = workspaceRoot
    && (equivalentWorkspaceTrees(workspaceRoot, tests.facts.snapshot_tree, current.tree)
      || isMaterialOnlySnapshotDelta(workspaceRoot, tests.facts.snapshot_tree, current.tree))
    && (tests.facts.source_digest === undefined
      || current.source_digest === undefined
      || tests.facts.source_digest === current.source_digest);
  // Reviews are quality facts, not delivery gates. A historical or unavailable
  // review remains visible in audit_gaps; only the current full test receipt
  // must bind the current implementation snapshot for verification.
  if (!qualitySnapshotMatches) auditGaps.push("verify-code independent review is historical/stale; retained as audit-only quality fact");
  if (!testSnapshotMatches) mismatches.push("tests and current Workspace snapshot must match");
  const verificationItems = verification?.value.items ?? [];
  if (verification === null) mismatches.push("canonical verification receipt is missing");
  const businessCriticalVerification = new Set([
    "current_materials", "diff_scope", "risk_tests", "acceptance_criteria",
    "browser_qa", "core_gaps", "human_handoff",
  ]);
  for (const item of verificationItems) {
    if (businessCriticalVerification.has(item.id)
        && !new Set(["pass", "not_applicable"]).has(item.status)) {
      mismatches.push(`verify item ${item.id} is ${item.status}: ${item.reason}`);
    }
  }
  const result = addCompletion("verify-code", {
    facts: { tests: tests.facts, review: review.facts, quality_note: qualityReview.facts, finding_dispositions: dispositions.facts, requirement_replay: replay.facts, evidence_refs: evidence.value.refs, ...(verification ? { verification_items: verificationItems } : {}), audit_gaps: auditGaps, ...(audit?.facts ?? {}) },
    evidence_refs: [tests.evidence, ...(review.evidence ? [review.evidence] : []), ...(qualityReview.evidence ? [qualityReview.evidence] : []), ...qualityReviewBinding.evidence, evidence.evidence, ...(verification ? [verification.evidence] : []), ...(audit?.evidence ? [audit.evidence] : []), ...review.risk_evidence, ...qualityReview.risk_evidence, ...evidence.value.refs, ...nestedEvidence],
    missing_items: [
      ...mismatches,
      ...review.missing_items,
      ...qualityReview.missing_items,
      ...(review.facts.status === "unavailable" ? ["build-code integration review is unavailable; verification remains quality-incomplete"] : []),
      ...(qualityReview.facts.status === "unavailable" ? ["verify-code independent review is unavailable; verification remains quality-incomplete"] : []),
      ...dispositions.missing_items,
      ...(failedEvidence.length ? failedEvidence.map((entry) => `failed acceptance evidence: ${entry.ref}`) : []),
    ],
  }, {
    worker,
    artifacts: [{ label: "验证结果", ref: evidence.ref, hash: evidence.evidence.sha256, publication_lookup: "publications/verify-code/" }],
    reviews: [review, qualityReview],
    businessFacts: {
      content: "present",
      code: "complete",
      tests: tests.facts.exit_code === 0 ? "passed" : "failed",
      acceptance_criteria: failedEvidence.length
        ? "missing"
        : (verificationItems.find((item) => item.id === "acceptance_criteria")?.status === "pass" ? "covered" : "unknown"),
    },
    audit,
    verification: `${mismatches.length || failedEvidence.length ? "独立验证发现未满足项" : "正式测试已完成"}；已绑定审查质量事实：${boundReviewQualityFacts([["build-code final", review], ["verify-code independent", qualityReview]])}`,
  });
  if (mismatches.length || failedEvidence.length) {
    return { ...result, verification_failure: true, reason: "verify-code verification failed: " + [...mismatches, ...(failedEvidence.length ? [`${failedEvidence.length} acceptance criterion(s) failed`] : [])].join("; ") };
  }
  return result;
});

export function officialStageHandler(stage) { const handler = HANDLERS.get(stage); if (!handler) throw new TypeError(`no official handler for stage: ${stage}`); return async (worker, invocation) => { const value = object(invocation, "official stage input"); const allowedTopLevel = new Set(stage === "build-code" ? ["receipts", "acceptance_coverage", "finding_dispositions"] : ["receipts", "finding_dispositions"]); const unknownTopLevel = Object.keys(value).filter((key) => !allowedTopLevel.has(key)); if (unknownTopLevel.length) throw new Error(`${stage} official run input must contain only ${[...allowedTopLevel].join(" and ")}; unknown fields: ${unknownTopLevel.join(", ")}`); const refs = object(value.receipts, "receipts"); const unexpectedReceiptKeys = Object.keys(refs).filter((key) => !RECEIPT_KEYS[stage].has(key)); if (unexpectedReceiptKeys.length) throw new Error(`${stage} official run has unexpected receipt fields: ${unexpectedReceiptKeys.join(", ")}`); if (stage !== "build-plan") { for (const [name, ref] of Object.entries(refs)) { const candidateRefs = name.endsWith("risk_acceptance") && Array.isArray(ref) ? ref : [ref]; if (candidateRefs.length === 0 || candidateRefs.some((candidateRef) => !validReceiptRef(name, candidateRef))) throw new Error(`${name} receipt ref is outside its canonical namespace`); } } return handler(worker, value); }; }

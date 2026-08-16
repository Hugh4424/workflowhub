import { createHash } from "node:crypto";

const STAGES = new Set(["make-decision", "build-spec", "build-plan", "build-code", "verify-code"]);
const HASH = /^[a-f0-9]{64}$/;
const TREE = /^[a-f0-9]{40,64}$/;
const FINDING_ID = /^F-[a-f0-9]{12,16}$/;
const FINDING_DISPOSITION_STATUSES = new Set(["fixed", "rejected_invalid", "accepted_risk", "needs_human"]);
const FINDING_DISPOSITION_FIELDS = new Set([
  "finding_id", "original_fact", "source", "consequence", "status", "next_action",
  "evidence_ref", "owner", "consumer", "retain_or_delete",
]);

function object(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${label} must be an object`);
  return value;
}
function text(value, label) {
  if (typeof value !== "string" || value.trim() === "") throw new TypeError(`${label} must be non-empty`);
  return value;
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function hashValue(value) {
  return createHash("sha256").update(canonicalJson(value), "utf8").digest("hex");
}

export function isActionableSeriousFinding(cluster) {
  return cluster?.disposition === "actionable"
    && new Set(["major", "blocking"]).has(cluster.severity)
    && new Set(["direct", "corroborated_inference"]).has(cluster.evidence_status);
}

/**
 * The result's reportable findings are the active semantic review facts.
 * `adjudication.clusters` is retained provenance and may contain provider
 * disagreements that were not adopted into the canonical result.  Fall back
 * to clusters for legacy fixtures that predate the reportable `findings` field.
 */
export function canonicalReviewFindings(result) {
  const findings = Array.isArray(result?.findings)
    ? result.findings.filter((finding) => finding && typeof finding.id === "string")
    : [];
  // An explicit empty `findings` array is the canonical statement that no
  // reportable finding was adopted.  Only records predating the field may
  // fall back to adjudication clusters.
  if (Object.prototype.hasOwnProperty.call(result ?? {}, "findings")) return findings;
  return Array.isArray(result?.adjudication?.clusters) ? result.adjudication.clusters : [];
}

function requiredText(value, label) {
  if (typeof value !== "string" || value.trim() === "") throw new TypeError(`${label} must be non-empty`);
  return value;
}

/**
 * Every canonical/reportable finding needs an explicit disposition. Serious
 * findings have an extra risk-acceptance requirement, but minor findings are
 * not silently dropped from the disposition contract.
 */
export function validateReportableFindingDispositions({ result, dispositions, authorizedRiskFindingIds = [] } = {}) {
  const findings = canonicalReviewFindings(result).filter((finding) => typeof finding?.id === "string");
  const ids = [...new Set(findings.map(({ id }) => id))];
  if (ids.length === 0) return Object.freeze({ facts: { status: "not_applicable", items: [] }, missing_items: [] });
  if (dispositions === undefined) {
    return Object.freeze({
      facts: { status: "incomplete", items: [] },
      missing_items: [`finding disposition is missing for: ${ids.join(", ")}`],
    });
  }
  if (!Array.isArray(dispositions)) throw new TypeError("finding_dispositions must be an array");
  const seen = new Set();
  const items = dispositions.map((entry, index) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) throw new TypeError(`finding_dispositions[${index}] must be an object`);
    for (const key of Object.keys(entry)) {
      if (!FINDING_DISPOSITION_FIELDS.has(key)) throw new Error(`finding_dispositions[${index}] has unknown field ${key}`);
    }
    for (const key of FINDING_DISPOSITION_FIELDS) requiredText(entry[key], `finding_dispositions[${index}].${key}`);
    if (!FINDING_DISPOSITION_STATUSES.has(entry.status)) throw new Error(`finding_dispositions[${index}].status is invalid`);
    if (seen.has(entry.finding_id)) throw new Error(`duplicate finding disposition: ${entry.finding_id}`);
    seen.add(entry.finding_id);
    return Object.freeze({ ...entry });
  });
  const missing = ids.filter((id) => !seen.has(id));
  const extra = [...seen].filter((id) => !ids.includes(id));
  if (extra.length) throw new Error(`finding_dispositions contains unknown finding: ${extra.join(", ")}`);
  const authorized = new Set(authorizedRiskFindingIds);
  const unauthorizedRisk = items
    .filter((item) => item.status === "accepted_risk" && !authorized.has(item.finding_id))
    .map((item) => item.finding_id);
  const unresolved = [...new Set([...missing, ...unauthorizedRisk])];
  return Object.freeze({
    facts: Object.freeze({ status: unresolved.length ? "incomplete" : "recorded", items }),
    missing_items: Object.freeze([
      ...(missing.length ? [`finding disposition is missing for: ${missing.join(", ")}`] : []),
      ...(unauthorizedRisk.length ? [`accepted_risk requires an authenticated user risk receipt for: ${unauthorizedRisk.join(", ")}`] : []),
    ]),
  });
}

function cardFor(cluster, reviewRef, reviewHash, snapshotTree) {
  const clusterFingerprint = {
    id: cluster.id,
    severity: cluster.severity,
    path: cluster.path,
    line: cluster.line ?? null,
    issue: cluster.issue,
    root_cause: cluster.root_cause,
    recommendation: cluster.recommendation,
    providers: cluster.providers,
    disposition: cluster.disposition,
    evidence_status: cluster.evidence_status,
  };
  const finding = {
    finding_id: text(cluster.id, "serious finding id"),
    finding_hash: hashValue(clusterFingerprint),
    severity: cluster.severity,
    issue: text(cluster.issue, "serious finding issue"),
    evidence: `正式审查 ${reviewRef}（${reviewHash}）在 ${cluster.path ?? "未标明文件"} 记录了该问题。`,
    consequences: [
      `如果继续，该问题会保留在快照 ${snapshotTree} 中，并可能影响 ${cluster.path ?? "本阶段交付范围"}。`,
    ],
    impact_scope: [cluster.path ?? "本阶段交付范围"],
    options: [
      {
        id: "repair",
        label: "先修复再继续",
        recommended: true,
        reason: "先消除已经证实的严重问题，后续风险最低。",
        consequence: "当前阶段暂停，修复后重新审查。",
        risk: "需要额外修改和审查时间。",
      },
      {
        id: "accept-risk",
        label: "明确承担风险继续",
        recommended: false,
        reason: "仅在暂时无法修复且后果可承担时使用。",
        consequence: "保留问题并继续，但只对当前问题和快照有效。",
        risk: "问题可能在后续阶段造成返工或错误。",
      },
    ],
  };
  return Object.freeze({ ...finding, card_hash: hashValue(finding) });
}

export function deriveSeriousReviewPause({
  taskId,
  stage,
  reviewRef,
  reviewHash,
  result,
  reviewAttempt,
  workflowRunId,
} = {}) {
  text(taskId, "taskId");
  if (!STAGES.has(stage)) throw new TypeError("unsupported Stage");
  if (result === undefined) {
    object(reviewAttempt, "unavailable review attempt");
    return Object.freeze({ status: "unavailable", task_id: taskId, stage, findings: [] });
  }
  const review = object(result, "review result");
  if (review.task_id !== taskId || review.stage !== stage || !TREE.test(review.snapshot_tree ?? "")) {
    throw new Error("review result identity/snapshot mismatch");
  }
  text(reviewRef, "reviewRef");
  if (!HASH.test(reviewHash ?? "")) throw new TypeError("reviewHash must be sha256");
  const clusters = canonicalReviewFindings(review);
  const findings = clusters.filter(isActionableSeriousFinding).map((cluster) => cardFor(
    cluster,
    reviewRef,
    reviewHash,
    review.snapshot_tree,
  ));
  return Object.freeze({
    schema_version: "stage-serious-review-pause.v1",
    status: findings.length ? "paused" : "continue",
    task_id: taskId,
    stage,
    ...(workflowRunId === undefined ? {} : { workflow_run_id: text(workflowRunId, "workflowRunId") }),
    review_ref: reviewRef,
    review_hash: reviewHash,
    snapshot_tree: review.snapshot_tree,
    findings,
  });
}

export function buildRiskAcceptance({
  pause,
  findingId,
  cardRef,
  cardHash,
  selectedOption,
  replyRef,
  replyHash,
  acceptedAt,
} = {}) {
  const state = object(pause, "serious review pause");
  if (state.status !== "paused") throw new Error("risk acceptance requires a serious review pause");
  const finding = state.findings?.find(({ finding_id: id }) => id === findingId);
  if (!finding || !FINDING_ID.test(findingId ?? "")) throw new Error("risk acceptance finding is not in the pause");
  if (cardHash !== finding.card_hash) throw new Error("risk acceptance card hash mismatch");
  if (selectedOption !== "accept-risk") throw new Error("risk acceptance requires the exact accept-risk option");
  text(cardRef, "risk card ref");
  text(replyRef, "risk reply ref");
  if (!HASH.test(replyHash ?? "")) throw new Error("risk reply hash must be sha256");
  if (!Number.isFinite(Date.parse(acceptedAt))) throw new Error("risk acceptance time is invalid");
  return Object.freeze({
    schema_version: "risk-acceptance.v1",
    task_id: state.task_id,
    stage: state.stage,
    workflow_run_id: text(state.workflow_run_id, "risk pause workflow_run_id"),
    snapshot_tree: state.snapshot_tree,
    review_ref: state.review_ref,
    review_hash: state.review_hash,
    finding_ref: `${state.review_ref}#${finding.finding_id}`,
    finding_id: finding.finding_id,
    finding_hash: finding.finding_hash,
    evidence_ref: state.review_ref,
    evidence_hash: state.review_hash,
    issue: finding.issue,
    impact_scope: [...finding.impact_scope],
    consequences: [...finding.consequences],
    card_ref: cardRef,
    card_hash: cardHash,
    selected_option: selectedOption,
    reply_ref: replyRef,
    reply_hash: replyHash,
    accepted_at: acceptedAt,
  });
}

export function validateRiskAcceptance({ acceptance, pause } = {}) {
  const value = object(acceptance, "risk acceptance");
  const state = object(pause, "serious review pause");
  const expected = buildRiskAcceptance({
    pause: state,
    findingId: value.finding_id,
    cardRef: value.card_ref,
    cardHash: value.card_hash,
    selectedOption: value.selected_option,
    replyRef: value.reply_ref,
    replyHash: value.reply_hash,
    acceptedAt: value.accepted_at,
  });
  if (canonicalJson(value) !== canonicalJson(expected)) {
    const mismatched = [...new Set([...Object.keys(value), ...Object.keys(expected)])]
      .filter((key) => canonicalJson(value[key]) !== canonicalJson(expected[key]));
    throw new Error(`risk acceptance does not bind the exact finding, review, snapshot, card and reply: ${mismatched.join(", ")}`);
  }
  return value;
}

export function validateRiskAcceptanceSet({ acceptances, pause } = {}) {
  const state = object(pause, "serious review pause");
  if (state.status !== "paused") throw new Error("risk acceptance set requires a serious review pause");
  if (!Array.isArray(acceptances) || acceptances.length === 0) {
    throw new Error("risk acceptance set must contain one acceptance for every serious finding");
  }
  const acceptedFindingIds = new Set();
  for (const acceptance of acceptances) {
    const value = validateRiskAcceptance({ acceptance, pause: state });
    if (acceptedFindingIds.has(value.finding_id)) {
      throw new Error(`risk acceptance set contains duplicate finding: ${value.finding_id}`);
    }
    acceptedFindingIds.add(value.finding_id);
  }
  const missingFindingIds = state.findings
    .map(({ finding_id: findingId }) => findingId)
    .filter((findingId) => !acceptedFindingIds.has(findingId));
  if (missingFindingIds.length) {
    throw new Error(`risk acceptance set does not cover every serious finding: ${missingFindingIds.join(", ")}`);
  }
  return acceptances;
}

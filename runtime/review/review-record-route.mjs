import { createHash, randomUUID } from "node:crypto";
import { aggregateCanonicalProviderResults, providerAdapter } from "./canonical-review-result.mjs";

const SHA256_HEX = /^[a-f0-9]{64}$/;

function textHash(text) {
  return createHash("sha256").update(text).digest("hex");
}

function stableFindingId(finding) {
  const canonical = JSON.stringify({
    path: finding.path ?? null,
    line: finding.line ?? null,
    issue: finding.issue ?? "",
    root_cause: finding.root_cause ?? "",
  }, Object.keys({ path: 1, line: 1, issue: 1, root_cause: 1 }).sort());
  return `F-${textHash(canonical).slice(0, 12)}`;
}

function providerFileName(provider, index) {
  const encoded = Buffer.from(provider, "utf8").toString("base64url");
  return `p-${encoded}.output.json`;
}

function assertTaskHandle(task) {
  if (!task || typeof task.writeRecordAtomic !== "function" || typeof task.readRecord !== "function") {
    throw new TypeError("recordSimpleReviewResult requires a TaskHandle with writeRecordAtomic/readRecord");
  }
  return task;
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}
function policyHash(policy) {
  return createHash("sha256").update(canonicalJson(policy)).digest("hex");
}

function buildPolicy(result) {
  const providers = result.provider_results?.map((item) => item.provider) ?? [];
  const effectiveProfiles = providers.map((provider) => ({
    provider,
    adapter: providerAdapter(provider),
    model: result.provider_results.find((item) => item.provider === provider)?.identity?.model ?? null,
    effort: null,
    thinking: null,
  }));
  const specs = providers.map((provider, index) => {
    const item = result.provider_results[index];
    return {
      provider,
      model: item?.identity?.model ?? null,
      effort: null,
      thinking: null,
      priority: 0,
    };
  });
  const policy = {
    source: "wh_review.v2",
    mode: "single_round",
    minimum_heterologous: 1,
    requested_profiles: providers,
    eligible_profiles: providers,
    same_source_exclusions: [],
    effective_profiles: effectiveProfiles,
    requested_profile_specs: specs,
  };
  return { policy, policy_snapshot_hash: policyHash(policy) };
}
function normalizeIdentity(item, provider) {
  if (!item || typeof item !== "object") return null;
  return {
    provider,
    adapter: providerAdapter(provider),
    source_id: typeof item.source_id === "string" && item.source_id.trim() !== "" ? item.source_id : provider,
    config_id: typeof item.config_id === "string" && item.config_id.trim() !== "" ? item.config_id : provider,
    model: item.model ?? "unknown",
  };
}

export function recordSimpleReviewResult({ task, result }) {
  const taskHandle = assertTaskHandle(task);
  if (!result || typeof result !== "object" || Array.isArray(result)) {
    throw new TypeError("review result must be an object");
  }
  if (!new Set(["available", "unavailable"]).has(result.status)) {
    throw new TypeError("review result status must be available or unavailable");
  }
  if (typeof result.stage !== "string" || !new Set(["make-decision", "build-spec", "build-plan", "build-code", "verify-code"]).has(result.stage)) {
    throw new TypeError("review result stage is required");
  }
  if (typeof result.material_id !== "string" || !SHA256_HEX.test(result.material_id)) {
    throw new TypeError("review result material_id must be a sha256 hex string");
  }
  if (!Array.isArray(result.provider_results)) {
    throw new TypeError("review result provider_results must be an array");
  }

  const attemptId = randomUUID();
  const taskId = taskHandle.identity.taskId;
  const stage = result.stage;
  const reviewTrack = result.review_track ?? null;
  const reviewKind = result.review_kind ?? null;
  const materialId = result.material_id;
  const tree = materialId;

  const attemptRef = `quality/reviews/attempts/${attemptId}/attempt.json`;
  const providerDirRef = `quality/reviews/attempts/${attemptId}/providers`;
  const resultId = randomUUID();
  const resultRef = `quality/reviews/results/${stage}-simple-${resultId}.json`;

  const source = {
    target_commit: tree,
    base_commit: tree,
    base_tree: tree,
    captured_head: tree,
  };

  const commonSubject = {
    subject_kind: "worktree",
    phase_id: null,
    review_scope: stage === "build-code" ? "integration" : null,
  };

  if (result.status === "unavailable") {
    const error = result.error ?? { code: "ROUTE_UNAVAILABLE", message: "review unavailable" };
    const policyResult = buildPolicy(result);
    const attempt = {
      version: "wh-review-attempt.v1",
      attempt_id: attemptId,
      task_id: taskId,
      stage,
      review_track: reviewTrack,
      review_kind: reviewKind,
      ...commonSubject,
      base_tree: tree,
      candidate_tree: tree,
      source,
      snapshot_tree: tree,
      material_id: materialId,
      provider_attempts: [],
      terminal_status: "unavailable",
      error,
      review_policy: policyResult.policy,
      policy_snapshot_hash: policyResult.policy_snapshot_hash,
    };
    taskHandle.writeRecordAtomic(attemptRef, JSON.stringify(attempt));
    return { attempt_ref: attemptRef, result_ref: null };
  }

  // available: canonicalize provider outputs and run aggregation
  const providerOutputContents = new Map();
  const providerOutputRefs = new Map();

  for (let index = 0; index < result.provider_results.length; index += 1) {
    const item = result.provider_results[index];
    const providerFindings = (result.findings ?? []).filter((f) => f.provider === item.provider);
    const outputContent = JSON.stringify({ findings: providerFindings.map(({ provider, ...rest }) => rest) });
    providerOutputContents.set(item.provider, outputContent);

    const outputRef = `${providerDirRef}/${providerFileName(item.provider, index)}`;
    providerOutputRefs.set(item.provider, outputRef);
    const outputRecord = {
      schema_version: "wh-review-provider-output.v1",
      task_id: taskId,
      stage,
      attempt_id: attemptId,
      provider: item.provider,
      content: outputContent,
      content_hash: textHash(outputContent),
      evidence_anchor_valid: providerFindings.map(() => true),
    };
    taskHandle.writeRecordAtomic(outputRef, JSON.stringify(outputRecord));
  }

  const providerOutputs = result.provider_results.map((item) => {
    const content = providerOutputContents.get(item.provider);
    return {
      provider: item.provider,
      ...(item.identity ? { identity: normalizeIdentity(item.identity, item.provider) } : {}),
      review: JSON.parse(content ?? "{\"findings\":[]}"),
    };
  });

  const aggregation = aggregateCanonicalProviderResults(providerOutputs, 1, {
    profilePriority: result.provider_results.map((item) => item.provider),
    requireIdentity: false,
    requireSourceId: false,
  });
  if (aggregation.status !== "available") {
    throw new Error(`simple-review provider outputs could not be aggregated: ${JSON.stringify(aggregation.invalid_members ?? "quorum not satisfied")}`);
  }

  const providerAttemptRecords = result.provider_results.map((item, index) => ({
    provider: item.provider,
    status: item.status === "completed" ? "completed" : "failed",
    identity: normalizeIdentity(item.identity, item.provider),
    session_id: null,
    runtime_id: result.runtime_id ?? null,
    output_ref: providerOutputRefs.get(item.provider),
    raw_output_ref: null,
    error: item.error ?? null,
    execution: {
      adapter: providerAdapter(item.provider),
      model: item.identity?.model ?? "unknown",
      effort: null,
      thinking: null,
      timing: item.timing ?? { started_at_ms: null, completed_at_ms: null, duration_ms: null },
      usage: item.usage ?? null,
      retry: { count: 0, progress_events: 0 },
      runtime_id: result.runtime_id ?? "unknown",
      session_file_path: null,
    },
  }));

  const resultFindings = aggregation.findings.map((finding) => ({ provider: finding.providers[0], ...finding }));

  const policyResult = buildPolicy(result);

  const attempt = {
    version: "wh-review-attempt.v1",
    attempt_id: attemptId,
    task_id: taskId,
    stage,
    review_track: reviewTrack,
    review_kind: reviewKind,
    ...commonSubject,
    base_tree: tree,
    candidate_tree: tree,
    source,
    snapshot_tree: tree,
    material_id: materialId,
    provider_attempts: providerAttemptRecords,
    terminal_status: "semantic",
    error: null,
    review_policy: policyResult.policy,
    policy_snapshot_hash: policyResult.policy_snapshot_hash,
  };

  const resultRecord = {
    version: "wh-review-result.v1",
    task_id: taskId,
    stage,
    review_track: reviewTrack,
    review_kind: reviewKind,
    ...commonSubject,
    base_tree: tree,
    candidate_tree: tree,
    source,
    snapshot_tree: tree,
    material_id: materialId,
    attempt_ref: attemptRef,
    provider_results: aggregation.valid.map((item) => ({ provider: item.provider, output: item.review })),
    findings: resultFindings,
    adjudication: { version: aggregation.adjudication.version, clusters: aggregation.adjudication.clusters },
  };

  taskHandle.writeRecordAtomic(attemptRef, JSON.stringify(attempt));
  taskHandle.writeRecordAtomic(resultRef, JSON.stringify(resultRecord));

  return { attempt_ref: attemptRef, result_ref: resultRef };
}

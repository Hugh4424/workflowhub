import { createHash, randomUUID } from "node:crypto";
import { assertTaskKernel } from "../../core/task-capability.mjs";
import { aggregateCanonicalProviderResults, providerAdapter } from "./canonical-review-result.mjs";

const SHA256_HEX = /^[a-f0-9]{64}$/;
const GIT_OID = /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/;
const MATERIAL_REVISION = /^revision-[a-f0-9]{64}$/;

function textHash(text) {
  return createHash("sha256").update(text).digest("hex");
}

function providerFileName(provider, index) {
  const encoded = Buffer.from(provider, "utf8").toString("base64url");
  return `p-${encoded}-${index}.output.json`;
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
  const minimum = Number.isSafeInteger(result.minimum_heterologous) && result.minimum_heterologous >= 1
    ? result.minimum_heterologous : 1;
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
    minimum_heterologous: minimum,
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

function providerAttemptRecord(item, runtimeId, outputRef = null) {
  const completed = item?.status === "completed" && item?.error === null;
  const status = completed ? "completed" : item?.status === "cancelled" ? "cancelled" : "failed";
  return {
    provider: item.provider,
    status,
    identity: normalizeIdentity(item.identity, item.provider),
    session_id: item.session_id ?? null,
    runtime_id: runtimeId ?? null,
    output_ref: outputRef,
    raw_output_ref: null,
    error: status === "completed" ? null : item.error ?? { code: "PROVIDER_RESULT_UNAVAILABLE", message: "provider result unavailable" },
    execution: {
      adapter: providerAdapter(item.provider),
      model: item.identity?.model ?? "unknown",
      effort: null,
      thinking: null,
      timing: item.timing ?? { started_at_ms: null, completed_at_ms: null, duration_ms: null },
      usage: item.usage ?? null,
      retry: { count: 0, progress_events: 0 },
      runtime_id: runtimeId ?? "unknown",
      session_file_path: null,
    },
  };
}

function assertAuthenticatedReviewIdentity(task, kernel) {
  const taskKernel = assertTaskKernel(kernel);
  if (taskKernel.task !== task
      || typeof taskKernel.currentVNextSnapshot !== "function"
      || typeof taskKernel.currentVNextMaterialRevision !== "function") {
    throw new TypeError("review record requires the authenticated TaskKernel for this task");
  }
  const snapshot = taskKernel.currentVNextSnapshot();
  const materialRevision = taskKernel.currentVNextMaterialRevision();
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) {
    throw new TypeError("review record requires an authenticated current snapshot");
  }
  for (const [name, value] of [["head", snapshot.head], ["tree", snapshot.tree], ["commit", snapshot.commit]]) {
    if (typeof value !== "string" || !GIT_OID.test(value)) {
      throw new TypeError(`review record current snapshot.${name} must be a Git object id`);
    }
  }
  if (typeof materialRevision !== "string" || !MATERIAL_REVISION.test(materialRevision)) {
    throw new TypeError("review record current material revision must match revision-<sha256>");
  }
  return Object.freeze({
    tree: snapshot.tree,
    source: {
      target_commit: snapshot.head,
      base_commit: snapshot.commit,
      base_tree: snapshot.tree,
      captured_head: snapshot.head,
    },
    materialRevision,
  });
}

export function recordSimpleReviewResult({ task, result, kernel }) {
  const taskHandle = assertTaskHandle(task);
  const currentIdentity = assertAuthenticatedReviewIdentity(taskHandle, kernel);
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
  const providers = new Set();
  for (const [index, item] of result.provider_results.entries()) {
    if (!item || typeof item !== "object" || Array.isArray(item)
        || typeof item.provider !== "string" || item.provider.trim() === "") {
      throw new TypeError(`review result provider_results[${index}].provider must be a non-empty string`);
    }
    if (providers.has(item.provider)) throw new TypeError(`review result provider is duplicated: ${item.provider}`);
    providers.add(item.provider);
  }
  const callerIdentityFields = ["source", "base_tree", "candidate_tree", "snapshot_tree", "material_revision"]
    .filter((key) => Object.prototype.hasOwnProperty.call(result, key));
  if (callerIdentityFields.length > 0) {
    throw new TypeError(`review result identity fields must come from the authenticated current context: ${callerIdentityFields.join(", ")}`);
  }

  const attemptId = randomUUID();
  const taskId = taskHandle.identity.taskId;
  const stage = result.stage;
  const reviewTrack = result.review_track ?? null;
  const reviewKind = result.review_kind ?? null;
  const materialId = result.material_id;
  const tree = currentIdentity.tree;

  const attemptRef = `quality/reviews/attempts/${attemptId}/attempt.json`;
  const providerDirRef = `quality/reviews/attempts/${attemptId}/providers`;
  const resultId = randomUUID();
  const resultRef = `quality/reviews/results/${stage}-simple-${resultId}.json`;

  const source = currentIdentity.source;

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
      material_revision: currentIdentity.materialRevision,
      provider_attempts: result.provider_results.map((item) => providerAttemptRecord(item, result.runtime_id)),
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
  const providerOutputRecords = new Map();

  const semanticResults = result.provider_results.filter((item) => item.status === "completed" && item.error === null);
  for (let index = 0; index < semanticResults.length; index += 1) {
    const item = semanticResults[index];
    const providerFindings = (result.findings ?? []).filter((f) => f.provider === item.provider);
    const evidenceAnchors = item.evidence_anchor_valid;
    if (!Array.isArray(evidenceAnchors)
        || evidenceAnchors.length !== providerFindings.length
        || evidenceAnchors.some((value) => typeof value !== "boolean")) {
      throw new TypeError(`review result provider_results[${index}].evidence_anchor_valid must match provider findings`);
    }
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
      evidence_anchor_valid: evidenceAnchors,
    };
    providerOutputRecords.set(outputRef, outputRecord);
  }

  const providerOutputs = semanticResults.map((item) => {
    const content = providerOutputContents.get(item.provider);
    return {
      provider: item.provider,
      ...(item.identity ? { identity: normalizeIdentity(item.identity, item.provider) } : {}),
      evidenceAnchors: item.evidence_anchor_valid,
      review: JSON.parse(content ?? "{\"findings\":[]}"),
    };
  });

  const aggregation = aggregateCanonicalProviderResults(providerOutputs, Number.isSafeInteger(result.minimum_heterologous) ? result.minimum_heterologous : 1, {
    profilePriority: semanticResults.map((item) => item.provider),
    requireIdentity: false,
    requireSourceId: false,
  });
  if (aggregation.status !== "available") {
    throw new Error(`simple-review provider outputs could not be aggregated: ${JSON.stringify(aggregation.invalid_members ?? "quorum not satisfied")}`);
  }

  for (const [outputRef, outputRecord] of providerOutputRecords) {
    taskHandle.writeRecordAtomic(outputRef, JSON.stringify(outputRecord));
  }

  const providerAttemptRecords = result.provider_results.map((item) => providerAttemptRecord(item, result.runtime_id, providerOutputRefs.get(item.provider) ?? null));

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
    material_revision: currentIdentity.materialRevision,
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
    material_revision: currentIdentity.materialRevision,
    attempt_ref: attemptRef,
    provider_results: aggregation.valid.map((item) => ({ provider: item.provider, output: item.review })),
    findings: resultFindings,
    adjudication: { version: aggregation.adjudication.version, clusters: aggregation.adjudication.clusters },
  };

  taskHandle.writeRecordAtomic(attemptRef, JSON.stringify(attempt));
  taskHandle.writeRecordAtomic(resultRef, JSON.stringify(resultRecord));

  return { attempt_ref: attemptRef, result_ref: resultRef };
}

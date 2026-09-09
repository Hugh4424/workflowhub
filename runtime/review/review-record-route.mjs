import { createHash, randomUUID } from "node:crypto";
import { createSimpleReviewPacket, resolveSimpleReviewRouteIdentity } from "../../skills/wh-review/scripts/simple-review-runner.mjs";
import { assertTaskKernel } from "../task/task-capability.mjs";
import { validateReviewBudget } from "../evidence/stage-content-evidence.mjs";
import { validateSchema } from "./schema-validator.mjs";
import { aggregateCanonicalProviderResults, authenticateCanonicalReviewResult, providerAdapter } from "./canonical-review-result.mjs";
import { ArtifactDir } from "../../core/artifact-dir.mjs";
import { openCurrentTaskWorkspace } from "../task/workspace.mjs";
import { runWorkspaceCommand } from "../task/workspace-runner.mjs";
import { freezeReviewMaterial, readFrozenReviewMaterial } from "../evidence/canonical-receipt-writer.mjs";
import { createQualityFact, qualityFactDigest } from "../evidence/quality-fact.mjs";
import { evaluateFactFreshness } from "../evidence/freshness.mjs";
import { stageMaterialScopeRevision } from "../stage/completion-predicates.mjs";
import { validateStageOutcomeProducerIdentity, validateCanonicalQualityFact } from "../evidence/canonical-evidence-validators.mjs";

const SHA256_HEX = /^[a-f0-9]{64}$/;
const GIT_OID = /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/;
const MATERIAL_REVISION = /^revision-[a-f0-9]{64}$/;
const IN_PROCESS_REQUEST_LOCKS = new Map();
const EXECUTION_CONTEXTS = new WeakSet();

function readExecutionSource(task, selection, identity, materials) {
  if (!selection || typeof selection !== "object" || Array.isArray(selection)
      || Object.keys(selection).sort().join(",") !== "quality_fact_ref,ref,sha256"
      || !SHA256_HEX.test(selection.sha256 ?? "")
      || selection.ref !== `quality/evidence/stage-quality/build-code/acceptance_execution-${selection.sha256}.json`
      || !/^quality\/facts\/[a-f0-9]{64}\.json$/.test(selection.quality_fact_ref ?? "")) throw new Error("reviewed_execution must select an explicit acceptance_execution ref/hash and quality fact");
  const raw = task.readRecord(selection.quality_fact_ref);
  const fact = validateCanonicalQualityFact(JSON.parse(raw));
  if (fact.schema_version !== "quality-fact.v1" || fact.task_id !== task.identity.taskId || fact.stage !== "build-code"
      || fact.kind !== "acceptance_criterion" || fact.subject !== "acceptance_execution" || fact.status !== "passed"
      || fact.snapshot_tree !== identity.tree || fact.material_revision !== identity.materialRevision
      || selection.quality_fact_ref !== `quality/facts/${qualityFactDigest(fact)}.json`
      || fact.fact_id !== `quality-${qualityFactDigest(fact)}`) throw new Error("reviewed_execution quality fact binding is invalid");
  createQualityFact({ taskId: fact.task_id, stage: fact.stage, materialRevision: fact.material_revision,
    materialScope: fact.material_scope, materialScopeRevision: fact.material_scope_revision, snapshotTree: fact.snapshot_tree,
    kind: fact.kind, subject: fact.subject, status: fact.status, evidence: fact.evidence, recordedAt: fact.recorded_at });
  const read = (ref) => /^quality\/evidence\/stage-quality\/build-code\/acceptance-(?:stdout|stderr)-[a-f0-9]{64}\.bin$/.test(ref) ? task.readRecordBytes(ref) : task.readRecord(ref);
  const freshness = evaluateFactFreshness({ ...fact, ref: selection.quality_fact_ref, sha256: textHash(raw) }, {
    snapshot_tree: identity.tree, material_revision: identity.materialRevision,
    material_scope_revisions: { "build-code": stageMaterialScopeRevision("build-code", materials) },
  }, { read });
  if (!freshness.authenticated) throw new Error(`reviewed_execution authentication is ${freshness.status}`);
  if (fact.evidence.length !== 1) throw new Error("reviewed_execution requires one exact acceptance wrapper");
  const wrapper = JSON.parse(task.readRecord(fact.evidence[0].ref));
  if (wrapper.refs.length !== 1 || wrapper.refs[0].ref !== selection.ref || wrapper.refs[0].sha256 !== selection.sha256) throw new Error("reviewed_execution wrapper binds another aggregate");
  const aggregateRaw = task.readRecord(selection.ref);
  if (textHash(aggregateRaw) !== selection.sha256) throw new Error("reviewed_execution aggregate hash mismatch");
  const aggregate = JSON.parse(aggregateRaw);
  const outcome = JSON.parse(task.readRecord(aggregate.subject_fact.execution_binding.stage_outcome_ref));
  const producer = validateStageOutcomeProducerIdentity(outcome, "build-code", { requireSource: true });
  const actor = { source_kind: producer.kind, source_id: producer.sourceId, run_id: producer.agentRunId };
  return { aggregate, aggregateRaw, actor, fact, wrapper, wrapperReference: fact.evidence[0] };
}

function prepareExecutionReviewRequest(task, request, identity) {
  if (request.reviewed_execution === undefined) return { request, executionContext: null };
  if (request.stage !== "verify-code" || (request.review_kind ?? request.reviewKind ?? null) !== null) throw new Error("reviewed_execution is only supported by ordinary verify-code review");
  const workspace = openCurrentTaskWorkspace(task);
  const artifacts = ArtifactDir.open(workspace.worktreeRoot, task);
  const materials = Object.fromEntries(["decision-log.md", "spec.md", "plan.md", "tasks.md"].map((name) => [name, artifacts.read(name)]));
  const execution = readExecutionSource(task, request.reviewed_execution, identity, materials);
  const diff = runWorkspaceCommand(workspace, "git", ["diff", "--no-ext-diff", "--binary", identity.source.target_commit, identity.tree, "--"]);
  if (diff.error || diff.status !== 0) throw new Error(`reviewed_execution implementation diff unavailable: ${diff.error?.message ?? diff.stderr}`);
  const records = execution.aggregate.subject_fact.execution_items.flatMap((item) => item.evidence_refs).map((reference) => ({ ...reference, raw: task.readRecord(reference.ref) }));
  const outputs = records.flatMap(({ raw }) => {
    const value = JSON.parse(raw);
    return value.subject_fact?.execution ? ["stdout", "stderr"].map((stream) => {
      const ref = value.subject_fact.execution[`${stream}_ref`], sha256 = value.subject_fact.execution[`${stream}_hash`];
      const bytes = task.readRecordBytes(ref);
      let text;
      try { text = new TextDecoder("utf-8", { fatal: true }).decode(bytes); } catch { /* non-text bytes remain exact base64 */ }
      return { ref, sha256, content_base64: bytes.toString("base64"), ...(text === undefined ? {} : { text }) };
    }) : [];
  });
  const prepared = { ...request, materials: { ...request.materials,
    runtime_current_materials: materials, runtime_implementation_diff: diff.stdout,
    runtime_execution: { ...request.reviewed_execution, raw: execution.aggregateRaw, actor: execution.actor },
    runtime_execution_records: records, runtime_execution_outputs: outputs,
  } };
  const frozenMaterial = freezeReviewMaterial({ task, bytes: JSON.stringify(prepared) });
  const frozen = readFrozenReviewMaterial({ task, ...frozenMaterial });
  const frozenRequest = JSON.parse(frozen.bytes.toString("utf8"));
  const executionContext = Object.freeze({ frozen_material: frozenMaterial,
    reviewed_execution: { ref: request.reviewed_execution.ref, sha256: request.reviewed_execution.sha256, actor: execution.actor } });
  EXECUTION_CONTEXTS.add(executionContext);
  return { request: frozenRequest, executionContext };
}

function executionBindingForResult(task, result, identity, context) {
  if (context === null) return null;
  if (result.stage !== "verify-code") throw new Error("execution review context is restricted to verify-code");
  const frozen = readFrozenReviewMaterial({ task, ...context.frozen_material });
  if (frozen.provider_input_sha256 !== context.frozen_material.provider_input_sha256) throw new Error("frozen review original bytes hash mismatch");
  const request = JSON.parse(frozen.bytes.toString("utf8"));
  if (createSimpleReviewPacket(request).material_id !== result.material_id) throw new Error("execution review result does not match the frozen provider bundle");
  const execution = readExecutionSource(task, request.reviewed_execution, identity, request.materials.runtime_current_materials);
  if (canonicalJson(context.reviewed_execution) !== canonicalJson({ ref: request.reviewed_execution.ref, sha256: request.reviewed_execution.sha256, actor: execution.actor })
      || request.materials.runtime_execution.raw !== execution.aggregateRaw) throw new Error("frozen execution review binding mismatch");
  const provider = result.provider_results.find((item) => item.status === "completed" && item.error === null
    && normalizeIdentity(item.identity, item.provider)?.source_id.split("/")[0] !== execution.actor.source_id.split("/")[0]);
  if (!provider) return null;
  const identityValue = normalizeIdentity(provider.identity, provider.provider);
  if (!identityValue || typeof result.runtime_id !== "string" || !result.runtime_id.trim()) return null;
  return { ...context, reviewer_actor: { source_kind: "review_provider", source_id: identityValue.source_id, run_id: result.runtime_id } };
}

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

function createCanonicalRecord(task, relativePath, data) {
  try {
    const current = task.readRecord(relativePath);
    if (current !== data) throw new Error(`immutable review record conflict: ${relativePath}`);
    return { idempotent: true };
  } catch (error) { if (error?.code !== "ENOENT") throw error; }
  try {
    if (typeof task.createRecordAtomic === "function") return task.createRecordAtomic(relativePath, data);
    return task.writeRecordAtomic(relativePath, data);
  } catch (error) {
    if (error?.code !== "EEXIST") throw error;
    if (task.readRecord(relativePath) !== data) throw new Error(`immutable review record conflict: ${relativePath}`);
    return { idempotent: true };
  }
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

function authenticatedEvidenceHash(value) {
  if (value === undefined) return null;
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError("authenticated_evidence must be a non-empty JSON object");
  }
  return textHash(`${canonicalJson(value)}\n`);
}

function reviewRequestMaterialId(request, materialIdForRequest = null) {
  if (typeof materialIdForRequest === "function") {
    const value = materialIdForRequest(request);
    if (typeof value !== "string" || !SHA256_HEX.test(value)) throw new TypeError("materialIdForRequest must return a sha256 hex string");
    return value;
  }
  if (request?.materials && typeof request.materials === "object" && !Array.isArray(request.materials)) return createSimpleReviewPacket(request).material_id;
  for (const value of [request?.material_id, request?.materialId]) {
    if (typeof value === "string" && SHA256_HEX.test(value)) return value;
  }
  return textHash(canonicalJson({
    stage: request?.stage ?? null,
    review_track: request?.review_track ?? request?.reviewTrack ?? null,
    review_kind: request?.review_kind ?? request?.reviewKind ?? null,
    materials: request?.materials ?? null,
  }));
}

function requestLockHash(request, materialId, routeIdentity) {
  const stable = {
    stage: request.stage,
    review_track: request.review_track ?? request.reviewTrack ?? null,
    review_kind: request.review_kind ?? request.reviewKind ?? null,
    review_scope: request.review_scope ?? request.reviewScope ?? null,
    subject: request.subject ?? null,
    subject_kind: request.subject_kind ?? null,
    phase_id: request.phase_id ?? null,
    route_identity: routeIdentity,
    host_provider: request.host_provider ?? request.hostProvider ?? null,
    material_id: materialId,
    authenticated_evidence_sha256: authenticatedEvidenceHash(request.authenticated_evidence),
  };
  return textHash(canonicalJson(stable));
}

function findReusableReview({ history, request, identity, materialId, requestKey }) {
  for (const entry of history) {
    const attempt = entry.attempt;
    if (attempt.stage !== request.stage
        || (attempt.review_track ?? null) !== (request.review_track ?? request.reviewTrack ?? null)
        || (attempt.review_kind ?? null) !== (request.review_kind ?? request.reviewKind ?? null)
        || (attempt.phase_id ?? null) !== (request.phase_id ?? null)
        || (attempt.subject_kind ?? "worktree") !== (request.subject_kind ?? "worktree")
        || attempt.request_key !== requestKey) continue;
    const semantic = (entry.pairSummary?.semantic_status ?? entry.prepared.semantic_status) === "available";
    const sameSource = attempt.snapshot_tree === identity.tree && attempt.material_revision === identity.materialRevision;
    // Semantic refs retain their original source identity; freshness remains a
    // separate consumer decision. Cross-revision reuse requires actual inputs.
    if (!sameSource && (!semantic || materialId === null || attempt.material_id !== materialId)) continue;
    return entry.pairSummary ?? entry.prepared.refs;
  }
  return null;
}

function reviewReportRef(stage, resultId) {
  return `quality/reviews/reports/${stage}-simple-${resultId}.md`;
}

function reviewReportBody({ attempt, result = null, requestKey = null }) {
  const status = attempt.terminal_status === "semantic" ? "available" : "unavailable";
  return [
    "# WorkflowHub review record",
    "",
    `status: ${status}`,
    `terminal_status: ${attempt.terminal_status}`,
    `task_id: ${attempt.task_id}`,
    `stage: ${attempt.stage}`,
    `subject_kind: ${attempt.subject_kind ?? "worktree"}`,
    `phase_id: ${attempt.phase_id ?? "none"}`,
    `review_scope: ${attempt.review_scope ?? "none"}`,
    `attempt_id: ${attempt.attempt_id}`,
    `snapshot_tree: ${attempt.snapshot_tree}`,
    `material_id: ${attempt.material_id}`,
    `dispatch_state: ${attempt.dispatch_state ?? "legacy_unclassified"}`,
    ...(requestKey ? [`request_key: ${requestKey}`] : []),
    `error: ${attempt.error ? JSON.stringify(attempt.error) : "null"}`,
    ...(result ? ["", "```json", JSON.stringify({ findings: result.findings, provider_results: result.provider_results }), "```"] : []),
    "",
  ].join("\n");
}

function reviewRequestError(error) {
  const code = typeof error?.code === "string" && error.code.trim() !== "" ? error.code : "REVIEW_EXECUTION_FAILED";
  const message = typeof error?.message === "string" && error.message.trim() !== "" ? error.message : "review request failed before a semantic result";
  return { code, message };
}

function reviewClosure(request, identity, materialId, requestKey, routeIdentity = null) {
  return {
    version: "wh-review-closure.v1",
    request_key: requestKey,
    source: identity.source,
    material_scope: request.review_scope ?? request.reviewScope ?? null,
    subject_kind: request.subject_kind ?? "worktree",
    subject_sha256: textHash(canonicalJson(request.subject ?? null)),
    snapshot_tree: identity.tree,
    material_revision: identity.materialRevision,
    material_id: materialId,
    authenticated_evidence_sha256: authenticatedEvidenceHash(request.authenticated_evidence),
    packet_sha256: materialId,
    prompt_sha256: textHash(String(request.prompt ?? "")),
    route_identity: routeIdentity,
    policy_snapshot_hash: request.policy_snapshot_hash ?? null,
  };
}

function routeRepairClosureIdentity(closure) {
  if (!closure || closure.version !== "wh-review-closure.v1") return null;
  const { request_key: _requestKey, route_identity: _routeIdentity, ...stable } = closure;
  return textHash(canonicalJson(stable));
}

function closureMatches(closure, identity, materialId, request) {
  if (!closure || closure.version !== "wh-review-closure.v1") return false;
  const expected = reviewClosure(request, identity, materialId, closure.request_key, closure.route_identity);
  return canonicalJson(closure) === canonicalJson(expected)
    && closure.snapshot_tree === identity.tree
    && closure.material_revision === identity.materialRevision
    && closure.material_id === materialId
    && closure.authenticated_evidence_sha256 === authenticatedEvidenceHash(request.authenticated_evidence);
}

function recordError(error, fallback) {
  const value = error ?? fallback;
  if (!value || typeof value !== "object" || Array.isArray(value)
      || typeof value.code !== "string" || value.code.trim() === ""
      || typeof value.message !== "string" || value.message.trim() === "") {
    throw new TypeError("review error must contain a non-empty code and message");
  }
  // Public diagnostics may retain cause_code; attempt/provider records use
  // the existing two-field schema. Transport detail remains on provider facts.
  return { code: value.code, message: value.message };
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
  if (!item || typeof item !== "object" || item.provider !== provider || item.adapter !== providerAdapter(provider)
      || typeof item.source_id !== "string" || !item.source_id.trim()
      || typeof item.config_id !== "string" || !item.config_id.trim()) return null;
  return { provider: item.provider, adapter: item.adapter, source_id: item.source_id, config_id: item.config_id, model: item.model ?? "unknown" };
}

function providerAttemptRecord(item, runtimeId, outputRef = null) {
  const completed = item?.status === "completed" && item?.error === null;
  const status = completed ? "completed" : item?.status === "cancelled" ? "cancelled" : "failed";
  const execution = item?.execution && typeof item.execution === "object" ? item.execution : {};
  const retry = execution.retry ?? item?.retry ?? { count: 0, progress_events: 0 };
  return {
    provider: item.provider,
    status,
    identity: normalizeIdentity(item.identity, item.provider),
    session_id: item.session_id ?? null,
    runtime_id: runtimeId ?? null,
    output_ref: outputRef,
    raw_output_ref: null,
    error: status === "completed" ? null : recordError(item.error, { code: "PROVIDER_RESULT_UNAVAILABLE", message: "provider result unavailable" }),
    ...(item?.unavailable_diagnostics ? { unavailable_diagnostics: item.unavailable_diagnostics } : {}),
    execution: {
      adapter: execution.adapter ?? providerAdapter(item.provider),
      model: Object.hasOwn(execution, "model") ? execution.model : (item.identity?.model ?? "unknown"),
      effort: Object.hasOwn(execution, "effort") ? execution.effort : null,
      thinking: Object.hasOwn(execution, "thinking") ? execution.thinking : null,
      timing: execution.timing ?? item.timing ?? { started_at_ms: null, completed_at_ms: null, duration_ms: null },
      usage: execution.usage ?? item.usage ?? null,
      retry: { count: retry.count ?? 0, progress_events: retry.progress_events ?? 0 },
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
  const context = typeof taskKernel.currentVNextContext === "function"
    ? taskKernel.currentVNextContext()
    : { snapshot: taskKernel.currentVNextSnapshot(), materialRevision: taskKernel.currentVNextMaterialRevision() };
  const snapshot = context.snapshot;
  const materialRevision = context.materialRevision;
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

// Budget metadata belongs to the host writer, never to the public request or
// provider result. Its complete value participates in the immutable attempt ID.
function authenticateBudgetContext(context, identity, requestKey, result) {
  if (context === null) return null;
  if (!context || typeof context !== "object" || Array.isArray(context)
      || Object.keys(context).sort().join(",") !== "kind,material_revision,phase_id,route_identity,snapshot_tree"
      || !["initial", "focused", "phase", "route_repair"].includes(context.kind)
      || context.material_revision !== identity.materialRevision || context.snapshot_tree !== identity.tree
      || !SHA256_HEX.test(context.route_identity ?? "") || !SHA256_HEX.test(requestKey ?? "")
      || context.phase_id !== (result?.phase_id ?? null)
      || (context.kind === "phase") !== (result?.review_scope === "phase")
      || (context.kind === "phase" && (typeof context.phase_id !== "string" || !context.phase_id.trim()))) {
    throw new TypeError("review budget context is not bound to its authenticated source and scope");
  }
  return { kind: context.kind, phase_id: context.phase_id, material_revision: context.material_revision,
    snapshot_tree: context.snapshot_tree, route_identity: context.route_identity };
}

// Read the existing pre-coverage-block writer format. This is verification of
// immutable facts, not conversion or a new legacy writer. New deterministic
// records cannot downgrade to this format by deleting their provenance block.
function readLegacyBudgetAttempt(task, ref, raw, attempt, report) {
  validateSchema("attempt", attempt);
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(attempt.attempt_id)
      || attempt.pair_id || !attempt.source
      || attempt.base_tree !== attempt.snapshot_tree || attempt.candidate_tree !== attempt.snapshot_tree
      || attempt.source.base_tree !== attempt.snapshot_tree
      || !["target_commit", "base_commit", "captured_head"].every((key) => GIT_OID.test(attempt.source[key] ?? ""))
      || !attempt.review_policy || policyHash(attempt.review_policy) !== attempt.policy_snapshot_hash
      || !["dispatched", "blocked_before_dispatch"].includes(attempt.dispatch_state)) throw new Error("old canonical budget source or policy is invalid");
  const attempted = attempt.provider_attempts.map((item) => item.provider);
  if (new Set(attempted).size !== attempted.length
      || canonicalJson([...attempted].sort()) !== canonicalJson([...(attempt.review_policy.requested_profiles ?? [])].sort())
      || (attempt.dispatch_state === "blocked_before_dispatch" && attempted.length > 0)) throw new Error("old canonical provider inventory is invalid");
  let canonical = null, resultRef = null;
  if (attempt.terminal_status === "semantic") {
    if (typeof task.listCanonicalReviewResultRefs !== "function") throw new Error("canonical result inventory is unavailable");
    const matches = task.listCanonicalReviewResultRefs().map((path) => ({ path, value: JSON.parse(task.readRecord(path)) }))
      .filter((entry) => entry.value.attempt_ref === ref);
    if (matches.length !== 1) throw new Error("old canonical semantic result is incomplete");
    canonical = matches[0].value; resultRef = matches[0].path;
    validateSchema("result", canonical);
    for (const key of ["task_id", "stage", "review_track", "review_kind", "subject_kind", "phase_id", "review_scope", "base_tree", "candidate_tree", "source", "snapshot_tree", "material_id", "material_revision", "report_ref"]) {
      if (canonicalJson(canonical[key] ?? null) !== canonicalJson(attempt[key] ?? null)) throw new Error("old canonical result identity mismatch");
    }
    const providerOutputs = attempt.provider_attempts.filter((item) => item.status === "completed").map((item) => {
      if (typeof item.output_ref !== "string") throw new Error("old canonical provider output is missing");
      const output = JSON.parse(task.readRecord(item.output_ref));
      if (output.schema_version !== "wh-review-provider-output.v1" || output.task_id !== attempt.task_id
          || output.stage !== attempt.stage || output.attempt_id !== attempt.attempt_id || output.provider !== item.provider
          || typeof output.content !== "string" || textHash(output.content) !== output.content_hash) throw new Error("old canonical provider output binding is invalid");
      return { ref: item.output_ref, provider: item.provider, review: JSON.parse(output.content), evidenceAnchors: output.evidence_anchor_valid };
    });
    authenticateCanonicalReviewResult({ attempt, result: canonical, providerOutputs });
  } else if (attempt.provider_attempts.some((item) => item.status === "completed" || item.output_ref)) {
    throw new Error("old unavailable record contains unverified semantic output");
  }
  const expected = reviewReportBody({ attempt, result: canonical, requestKey: attempt.request_key ?? null })
    .split("\n").filter((line) => !/^(subject_kind|phase_id|review_scope): /.test(line)).join("\n");
  if (report !== expected) throw new Error("old canonical report provenance is incomplete or changed");
  const kind = attempt.review_scope === "phase" ? "phase" : "initial";
  return { attempt, identity: { tree: attempt.snapshot_tree, materialRevision: attempt.material_revision, source: attempt.source },
    saved: { budget_context: null }, consumesRound: attempt.dispatch_state !== "blocked_before_dispatch",
    prepared: { refs: { attempt_ref: ref, result_ref: resultRef, report_ref: attempt.report_ref },
      semantic_status: canonical ? "available" : "unavailable", coverage: canonical ? "satisfied" : "incomplete" },
    fact: { attempt_id: attempt.attempt_id, attempt_ref: ref, attempt_hash: textHash(raw), material_revision: attempt.material_revision,
      kind, ...(attempt.phase_id ? { phase_id: attempt.phase_id } : {}), status: canonical ? "completed" : attempt.terminal_status,
      terminal_status: attempt.terminal_status, dispatch_state: attempt.dispatch_state,
      route_identity: null, error_code: attempt.error?.code ?? null,
      closure_identity: null,
      has_semantic_output: Boolean(canonical),
      provider_attempts: attempt.provider_attempts.map((item) => ({ status: item.status,
        output_ref: item.output_ref ?? null, error_code: item.error?.code ?? null })), } };
}

function readCanonicalBudgetHistory(task) {
  if (typeof task.listCanonicalReviewAttemptRefs !== "function") throw new Error("canonical attempt inventory is unavailable");
  const refs = task.listCanonicalReviewAttemptRefs();
  if (!Array.isArray(refs) || new Set(refs).size !== refs.length) throw new Error("canonical attempt inventory is invalid");
  const entries = refs.map((ref) => {
    try {
    const raw = task.readRecord(ref);
    const attempt = JSON.parse(raw);
    if (attempt.task_id !== task.identity.taskId || typeof attempt.attempt_id !== "string"
        || ref !== `quality/reviews/attempts/${attempt.attempt_id}/attempt.json`
        || !MATERIAL_REVISION.test(attempt.material_revision ?? "") || !GIT_OID.test(attempt.snapshot_tree ?? "")
        || !["semantic", "failed", "unavailable"].includes(attempt.terminal_status)) throw new Error("canonical budget attempt identity is invalid");
    const report = task.readRecord(attempt.report_ref);
    const saved = JSON.parse(report.match(/## Public result and coverage\n\n```json\n([\s\S]*?)\n```/)?.[1] ?? "null");
    if (!saved?.public_result) return readLegacyBudgetAttempt(task, ref, raw, attempt, report);
    const identity = { tree: attempt.snapshot_tree, materialRevision: attempt.material_revision, source: attempt.source };
    const context = saved.budget_context ?? null;
    const prepared = prepareSimpleReviewRecord(task, saved.public_result, identity, attempt.request_key ?? null,
      { paired: Boolean(attempt.pair_id), budgetContext: context, executionContext: saved.execution_context ?? null, closureManifest: attempt.closure_manifest ?? null });
    if (prepared.refs.attempt_ref !== ref || prepared.refs.report_ref !== attempt.report_ref
        || prepared.semantic_status !== saved.semantic_status || prepared.coverage !== saved.coverage) throw new Error("canonical budget report binding is invalid");
    for (const [recordRef, expected] of prepared.records) {
      if (task.readRecord(recordRef) !== expected) throw new Error("canonical budget evidence is incomplete or changed");
    }
    if (attempt.dispatch_state === "blocked_before_dispatch" && attempt.provider_attempts.length !== 0) throw new Error("blocked review contains provider attempts");
    return { attempt, saved, prepared, identity, consumesRound: attempt.dispatch_state !== "blocked_before_dispatch", fact: {
      attempt_id: attempt.attempt_id, attempt_ref: ref, attempt_hash: textHash(raw),
      material_revision: attempt.material_revision,
      kind: context?.kind ?? (attempt.review_scope === "phase" ? "phase" : "initial"),
      ...(attempt.phase_id ? { phase_id: attempt.phase_id } : {}),
      status: attempt.terminal_status === "semantic" ? "completed" : attempt.terminal_status,
      terminal_status: attempt.terminal_status, dispatch_state: attempt.dispatch_state,
      route_identity: context?.route_identity ?? null, error_code: attempt.error?.code ?? null,
      closure_identity: routeRepairClosureIdentity(attempt.closure_manifest),
      has_semantic_output: prepared.semantic_status === "available",
      provider_attempts: attempt.provider_attempts.map((item) => ({ status: item.status,
        output_ref: item.output_ref ?? null, error_code: item.error?.code ?? null })),
    } };
    } catch (error) { error.review_attempt_ref = ref; throw error; }
  });
  const byRef = new Map(entries.map((entry) => [entry.fact.attempt_ref, entry]));
  const seenPairs = new Set();
  return entries.filter((entry) => {
    try {
    if (!entry.attempt.pair_id) return true;
    const attempt = entry.attempt;
    const pairRef = pairedReportRef(attempt.stage, task.identity.taskId, entry.identity, attempt.pair_id, attempt.request_key ?? null);
    if (seenPairs.has(pairRef)) return false;
    const report = task.readRecord(pairRef);
    const summary = JSON.parse(report.match(/```json\n([\s\S]*?)\n```/)?.[1] ?? "null");
    if (!summary || summary.pair_id !== attempt.pair_id || summary.report_ref !== pairRef
        || Object.keys(summary.role_results ?? {}).sort().join(",") !== "blue,red") throw new Error("canonical budget pair is incomplete");
    const members = ["red", "blue"].map((role) => {
      const roleRefs = summary.role_results[role];
      const member = byRef.get(roleRefs?.attempt_ref);
      if (!member || member.attempt.role !== role || member.attempt.pair_id !== attempt.pair_id
          || member.attempt.stage !== attempt.stage || member.attempt.request_key !== attempt.request_key
          || member.attempt.material_id !== attempt.material_id || member.attempt.material_revision !== attempt.material_revision
          || member.attempt.snapshot_tree !== attempt.snapshot_tree
          || canonicalJson(member.saved.budget_context ?? null) !== canonicalJson(entry.saved.budget_context ?? null)
          || canonicalJson(roleRefs) !== canonicalJson({ ...member.prepared.refs,
            semantic_status: member.prepared.semantic_status, coverage: member.prepared.coverage })) throw new Error("canonical budget pair member binding is invalid");
      return member;
    });
    const semanticStatus = members.some((member) => member.prepared.semantic_status === "available") ? "available" : "unavailable";
    const partial = members.some((member) => member.prepared.coverage !== "satisfied"
      || member.saved.public_result.provider_results.some((item) => item.status !== "completed" || item.error !== null));
    if (summary.status !== "recorded" || summary.semantic_status !== semanticStatus || summary.partial !== partial) throw new Error("canonical budget pair summary is invalid");
    entry.pairSummary = summary;
    entry.consumesRound = members.some((member) => member.consumesRound);
    seenPairs.add(pairRef);
    // A complete pair is one round even when both role attempts failed.
    entry.fact.status = members.every((member) => member.fact.status === "completed") ? "completed" : "unavailable";
    entry.fact.terminal_status = entry.fact.status === "completed" ? "semantic" : "unavailable";
    entry.fact.has_semantic_output = members.some((member) => member.fact.has_semantic_output);
    entry.fact.provider_attempts = members.flatMap((member) => member.fact.provider_attempts);
    entry.fact.error_code = entry.fact.has_semantic_output ? "REVIEW_QUORUM_INCOMPLETE" : "REVIEW_ALL_PROVIDERS_FAILED";
    return true;
    } catch (error) { error.review_attempt_ref = entry.fact.attempt_ref; throw error; }
  });
}

/**
 * Authenticated host request path. The request is dispatched and persisted
 * under one task lock; a second identical current request reuses the
 * immutable canonical refs instead of dispatching a second provider call.
 */
export async function recordSimpleReviewRequest({ task, kernel, request, runRound, materialIdForRequest = null, resolveRouteIdentity = resolveSimpleReviewRouteIdentity } = {}) {
  const taskHandle = assertTaskHandle(task);
  if (!request || typeof request !== "object" || Array.isArray(request)) throw new TypeError("review request must be an object");
  if (Object.hasOwn(request, "result")) throw new TypeError("review request cannot contain a result field");
  for (const field of ["snapshot_tree", "material_revision", "task_id", "task_path", "project_name"]) {
    if (Object.hasOwn(request, field)) throw new TypeError(`review request identity field is host-owned: ${field}`);
  }
  if (typeof request.stage !== "string" || request.stage.trim() === "") throw new TypeError("review request stage is required");
  if (typeof runRound !== "function") throw new TypeError("runRound must be a function");
  if (["e2e_binding", "confirmation", "confirmation_ref", "user_confirmation"].some((key) => Object.hasOwn(request, key))) throw new TypeError("execution review binding and future confirmation are host-owned");
  const before = assertAuthenticatedReviewIdentity(taskHandle, kernel);
  const executionPrepared = prepareExecutionReviewRequest(taskHandle, request, before);
  request = executionPrepared.request;
  const executionContext = executionPrepared.executionContext;
  const materialId = reviewRequestMaterialId(request, materialIdForRequest);
  const authenticatedMaterialId = typeof materialIdForRequest === "function"
    || (request.materials && typeof request.materials === "object" && !Array.isArray(request.materials))
    ? materialId : null;
  let routeIdentity, routeError;
  try {
    const trustedRoute = await resolveRouteIdentity(request);
    routeIdentity = trustedRoute?.route_identity;
    if (!SHA256_HEX.test(routeIdentity ?? "")) throw new TypeError("trusted route identity is missing or invalid");
    if (executionContext) {
      const selection = trustedRoute.provider_selection;
      const executorFamily = executionContext.reviewed_execution.actor.source_id.split("/")[0];
      if (!Array.isArray(selection?.providers) || !selection.providers.some((provider) => {
        const sourceId = selection.provider_identities?.[provider]?.source_id;
        return typeof sourceId === "string" && sourceId.trim() && sourceId.split("/")[0] !== executorFamily;
      })) {
        const error = new Error("execution review has no independent source candidate for the authenticated executor actor");
        error.code = "REVIEW_EXECUTOR_SOURCE_NOT_INDEPENDENT";
        throw error;
      }
    }
  } catch (error) { routeError = reviewRequestError(error); }
  const requestKey = requestLockHash(request, materialId, routeIdentity ?? "unavailable");
  const closure = reviewClosure(request, before, materialId, requestKey, routeIdentity ?? null);
  const currentClosureIdentity = routeRepairClosureIdentity(closure);
  // Serialize the shared round allowance across different request keys as well.
  const lockRef = "quality/reviews/request-locks/current-round.lock";
  const operation = async () => {
    let history;
    try { history = readCanonicalBudgetHistory(taskHandle); }
    catch (error) {
      if (error.review_attempt_ref) {
        let damaged;
        try { damaged = JSON.parse(taskHandle.readRecord(error.review_attempt_ref)); } catch { /* unavailable history stays unknown */ }
        if (damaged?.stage === request.stage && damaged?.snapshot_tree === before.tree
            && damaged?.material_revision === before.materialRevision
            && (damaged?.phase_id ?? null) === (request.phase_id ?? null)) {
          error.code = "REVIEW_RECORD_INCOMPLETE";
          error.attempt_ref = error.review_attempt_ref;
          throw error;
        }
      }
      return { status: "unavailable", reused: false, dispatch_state: "blocked_before_dispatch",
        error: { code: "REVIEW_RETRY_BUDGET_UNKNOWN", message: `complete review budget history is unavailable: ${error.message}` },
        review_budget: { ok: false, reason: "budget_unknown", counts: null } };
    }
    const reusable = findReusableReview({ history, request, identity: before, materialId: authenticatedMaterialId, requestKey });
    const sameSubject = (prior) => prior.stage === request.stage
      && (prior.review_track ?? null) === (request.review_track ?? request.reviewTrack ?? null)
      && (prior.review_kind ?? null) === (request.review_kind ?? request.reviewKind ?? null)
      && (prior.subject_kind ?? "worktree") === (request.subject_kind ?? "worktree")
      && (prior.phase_id ?? null) === (request.phase_id ?? null);
    const priorSubject = history.filter((entry) => entry.consumesRound && sameSubject(entry.attempt));
    const changed = priorSubject.some((entry) => entry.attempt.material_revision !== before.materialRevision);
    const latestCurrent = priorSubject.filter((entry) => entry.attempt.material_revision === before.materialRevision).at(-1) ?? null;
    const routeRepaired = routeIdentity && latestCurrent
      && latestCurrent.fact.dispatch_state === "dispatched"
      && latestCurrent.fact.route_identity && latestCurrent.fact.route_identity !== routeIdentity
      && latestCurrent.fact.closure_identity === currentClosureIdentity;
    // A previously assigned focused round remains focused on the same revision.
    // Neither request bytes nor a code-only snapshot change reset its allowance.
    const kind = request.review_scope === "phase" ? "phase"
      : routeRepaired ? "route_repair"
        : changed || priorSubject.some((entry) => entry.fact.kind === "focused") ? "focused" : "initial";
    const attempts = history.filter((entry) => entry.consumesRound).map((entry) => entry.fact).filter((entry) => entry.material_revision === before.materialRevision);
    const reviewBudget = validateReviewBudget({ material_revision: before.materialRevision,
      attempts, canonical_attempts: attempts, request: { kind, changed, phase_id: request.phase_id,
        route_identity: routeIdentity, closure_identity: currentClosureIdentity,
        repair_attempt_ref: routeRepaired ? latestCurrent.fact.attempt_ref : null } });
    if (reusable) return { status: "recorded", reused: true, dispatch_state: "reused", ...reusable, review_budget: reviewBudget };
    if (!reviewBudget.ok) return { status: "unavailable", reused: false, dispatch_state: "blocked_before_dispatch",
      error: { code: "REVIEW_RETRY_BUDGET_EXHAUSTED", message: `review round budget unavailable: ${reviewBudget.reason}` }, review_budget: reviewBudget };
    const budgetContext = routeIdentity ? { kind, phase_id: request.phase_id ?? null,
      material_revision: before.materialRevision, snapshot_tree: before.tree, route_identity: routeIdentity } : null;
    let result;
    try {
      if (routeError) {
        result = {
          status: "unavailable", stage: request.stage,
          review_track: request.review_track ?? request.reviewTrack ?? null,
          review_kind: request.review_kind ?? request.reviewKind ?? null,
          material_id: materialId, provider_results: [], findings: [], runtime_id: null,
          ...(request.authenticated_evidence === undefined ? {} : {
            authenticated_evidence: request.authenticated_evidence,
            authenticated_evidence_sha256: authenticatedEvidenceHash(request.authenticated_evidence),
          }),
          dispatch_state: "blocked_before_dispatch",
          error: routeError,
        };
      } else result = await runRound(structuredClone(request));
    } catch (error) {
      result = {
        status: "unavailable",
        stage: request.stage,
        review_track: request.review_track ?? request.reviewTrack ?? null,
        review_kind: request.review_kind ?? request.reviewKind ?? null,
        material_id: materialId ?? textHash(canonicalJson(request)),
        runtime_id: null,
        outcome: "unavailable",
        provider_results: [],
        findings: [],
        error: reviewRequestError(error),
      };
    }
    if (!result || typeof result !== "object" || Array.isArray(result)) throw new TypeError("review runner must return a result object");
    for (const field of ["subject_kind", "phase_id", "review_scope"]) {
      if (request[field] === undefined) continue;
      if (result[field] !== undefined && result[field] !== request[field]) throw new TypeError(`review result ${field} does not match its request`);
      result = { ...result, [field]: request[field] };
    }
    const after = assertAuthenticatedReviewIdentity(taskHandle, kernel);
    const closureCurrent = closureMatches(closure, after, materialId, request);
    if (!closureCurrent) {
      result = {
        ...result,
        status: "unavailable",
        outcome: "unavailable",
        dispatch_state: result.dispatch_state === "blocked_before_dispatch" ? "blocked_before_dispatch" : "dispatched",
        error: { code: "REVIEW_SOURCE_DRIFT", message: "review source changed while dispatching; completed provider facts were retained without publishing a result" },
      };
    }
    if (authenticatedMaterialId !== null && result.material_id !== materialId) {
      const error = new Error("review result material_id does not match the authenticated request material");
      error.code = "REVIEW_MATERIAL_MISMATCH";
      throw error;
    }
    const expectedEvidenceHash = authenticatedEvidenceHash(request.authenticated_evidence);
    if ((result.authenticated_evidence_sha256 ?? null) !== expectedEvidenceHash) {
      const error = new Error("review result authenticated evidence does not match the authenticated request evidence");
      error.code = "REVIEW_AUTHENTICATED_EVIDENCE_MISMATCH";
      throw error;
    }
    const recordIdentity = closureCurrent ? after : before;
    const refs = recordSimpleReviewResult({ task: taskHandle, result, kernel, requestKey,
      budgetContext: budgetContext ? { ...budgetContext, snapshot_tree: recordIdentity.tree, material_revision: recordIdentity.materialRevision } : null,
      executionContext, closureManifest: closure, identityOverride: closureCurrent ? null : before });
    return {
      status: "recorded",
      reused: false,
      dispatch_state: result.dispatch_state === "blocked_before_dispatch" ? "blocked_before_dispatch" : "dispatched",
      ...refs,
      review_budget: reviewBudget,
      ...(result.dispatch_state === "blocked_before_dispatch" ? { error: result.error } : {}),
    };
  };
  const lockKey = `${taskHandle.identity.taskId}:${lockRef}`;
  const previous = IN_PROCESS_REQUEST_LOCKS.get(lockKey) ?? Promise.resolve();
  const current = previous.then(() => typeof taskHandle.withRecordLock === "function"
    ? taskHandle.withRecordLock(lockRef, operation)
    : operation());
  const tracked = current.catch(() => undefined);
  IN_PROCESS_REQUEST_LOCKS.set(lockKey, tracked);
  try { return await current; }
  finally {
    if (IN_PROCESS_REQUEST_LOCKS.get(lockKey) === tracked) IN_PROCESS_REQUEST_LOCKS.delete(lockKey);
  }
}

function stableReviewId(value) {
  const digest = textHash(canonicalJson(JSON.parse(JSON.stringify(value))));
  return `${digest.slice(0, 8)}-${digest.slice(8, 12)}-5${digest.slice(13, 16)}-a${digest.slice(17, 20)}-${digest.slice(20, 32)}`;
}

function pairedReportRef(stage, taskId, identity, pairId, requestKey) {
  return reviewReportRef(stage, stableReviewId([taskId, identity.tree, identity.materialRevision, requestKey, pairId]));
}

function prepareSimpleReviewRecord(task, result, identity, requestKey, { paired = false, budgetContext = null, executionContext = null, closureManifest = null } = {}) {
  const context = authenticateBudgetContext(budgetContext, identity, requestKey, result);
  if (!result || typeof result !== "object" || Array.isArray(result)) throw new TypeError("review result must be an object");
  if (!["available", "available-with-failures", "unavailable"].includes(result.status)) throw new TypeError("review result status must be available or unavailable (including available-with-failures)");
  if (!["make-decision", "build-spec", "build-plan", "build-code", "verify-code"].includes(result.stage)) throw new TypeError("review result stage is required");
  if (!SHA256_HEX.test(result.material_id ?? "")) throw new TypeError("review result material_id must be a sha256 hex string");
  const evidenceHash = authenticatedEvidenceHash(result.authenticated_evidence);
  if ((result.authenticated_evidence_sha256 ?? null) !== evidenceHash) throw new TypeError("review result authenticated evidence hash is invalid");
  if (!Array.isArray(result.provider_results)) throw new TypeError("review result provider_results must be an array");
  const callerIdentity = ["source", "base_tree", "candidate_tree", "snapshot_tree", "material_revision"].filter((key) => Object.hasOwn(result, key));
  if (callerIdentity.length) throw new TypeError(`review result identity fields must come from the authenticated current context: ${callerIdentity.join(", ")}`);
  if (result.minimum_heterologous !== undefined && (!Number.isSafeInteger(result.minimum_heterologous) || result.minimum_heterologous < 1)) throw new TypeError("review policy minimum is invalid");
  const noDispatch = result.status === "unavailable" && result.provider_results.length === 0 && result.dispatch_state === "blocked_before_dispatch";
  if (paired && !noDispatch && (!Number.isSafeInteger(result.minimum_heterologous) || result.minimum_heterologous < 1)) throw new TypeError("role review policy minimum is required");
  const providers = new Set();
  const completed = [];
  const selection = result.provider_selection;
  if (paired && !noDispatch && (!selection || !Array.isArray(selection.providers) || !selection.provider_identities)) throw new TypeError("role provider selection identity is required");
  for (const [index, item] of result.provider_results.entries()) {
    if (!item || typeof item !== "object" || typeof item.provider !== "string" || !providerAdapter(item.provider)) throw new TypeError(`review result provider_results[${index}].provider is invalid`);
    if (providers.has(item.provider)) throw new TypeError(`review result provider is duplicated: ${item.provider}`);
    providers.add(item.provider);
    const semantic = item.status === "completed" && item.error === null;
    const id = item.identity;
    // Failed/cancelled members are transport facts, not identity attestations.
    // Preserve their actual identity in the public report; only completed
    // semantic members must satisfy the trusted selection before aggregation.
    const failedMember = ["failed", "cancelled"].includes(item.status);
    if (semantic || !failedMember) {
      if (!id || id.provider !== item.provider || id.adapter !== providerAdapter(item.provider)
          || typeof id.source_id !== "string" || !id.source_id.trim()
          || typeof id.config_id !== "string" || !id.config_id.trim()) throw new TypeError(`review provider source identity is missing or invalid: ${item.provider}`);
    }
    if (selection) {
      const expected = selection.provider_identities?.[item.provider];
      if (!Array.isArray(selection.providers) || !selection.providers.includes(item.provider) || !expected) throw new TypeError(`review role provider selection identity is missing: ${item.provider}`);
      for (const field of ["provider", "adapter", "source_id", "config_id", "model"]) {
        if ((semantic || !failedMember) && expected[field] !== undefined && id?.[field] !== expected[field]) throw new TypeError(`review provider source identity ${field} mismatch: ${item.provider}`);
      }
    }
    if (semantic) completed.push(item);
  }
  // A dispatched round may terminate before the broker returns any member
  // result. Keep the trusted route selection as provenance, but do not reject
  // the unavailable round merely because there is no provider output to bind.
  // Any non-empty provider result set still has to match the selection exactly.
  if (selection && providers.size > 0
      && (new Set(selection.providers).size !== selection.providers.length || selection.providers.length !== providers.size)) {
    throw new TypeError("review role provider selection does not match attempted providers");
  }
  if (!Array.isArray(result.findings ?? [])) throw new TypeError("review findings must be an array");
  if ((result.findings ?? []).some((finding) => !completed.some((item) => item.provider === finding.provider))) throw new TypeError("review finding provider has no completed semantic output");
  const e2eBinding = executionBindingForResult(task, result, identity, executionContext);
  const taskId = task.identity.taskId, stage = result.stage;
  const attemptId = stableReviewId([taskId, identity, requestKey, result, ...(context ? [context] : []), ...(executionContext ? [executionContext] : []), ...(closureManifest ? [closureManifest] : [])]);
  const attemptRef = `quality/reviews/attempts/${attemptId}/attempt.json`;
  const resultRef = `quality/reviews/results/${stage}-simple-${attemptId}.json`;
  const reportRef = reviewReportRef(stage, attemptId);
  const records = [];
  const outputRefs = new Map();
  const outputs = completed.map((item, index) => {
    const findings = (result.findings ?? []).filter((finding) => finding.provider === item.provider);
    if (!Array.isArray(item.evidence_anchor_valid) || item.evidence_anchor_valid.length !== findings.length || item.evidence_anchor_valid.some((entry) => typeof entry !== "boolean")) throw new TypeError(`review result provider_results[${index}].evidence_anchor_valid must match provider findings`);
    const content = JSON.stringify({ findings: findings.map(({ provider, ...rest }) => rest) });
    const outputRef = `quality/reviews/attempts/${attemptId}/providers/${providerFileName(item.provider, index)}`;
    outputRefs.set(item.provider, outputRef);
    records.push([outputRef, JSON.stringify({ schema_version: "wh-review-provider-output.v1", task_id: taskId, stage, attempt_id: attemptId, provider: item.provider, content, content_hash: textHash(content), evidence_anchor_valid: item.evidence_anchor_valid })]);
    return { provider: item.provider, identity: item.identity, evidenceAnchors: item.evidence_anchor_valid, review: JSON.parse(content) };
  });
  const policy = buildPolicy(result);
  const aggregation = aggregateCanonicalProviderResults(outputs, policy.policy.minimum_heterologous, { profilePriority: completed.map((item) => item.provider), requireIdentity: true, requireSourceId: true });
  // Invalid semantic output is an input error. Insufficient independent sources
  // is a coverage fact: keep every valid member and its immutable output.
  if (aggregation.invalid_members?.length || aggregation.valid.length !== completed.length) throw new TypeError("simple-review provider output or source identity is invalid");
  const allIdentified = result.provider_results.every((item) => item.identity?.provider === item.provider
    && item.identity?.adapter === providerAdapter(item.provider) && typeof item.identity?.source_id === "string" && item.identity.source_id.trim()
    && typeof item.identity?.config_id === "string" && item.identity.config_id.trim());
  const covered = result.status !== "unavailable" && aggregation.status === "available" && allIdentified;
  const semanticStatus = result.status !== "unavailable" && completed.length ? "available" : "unavailable";
  const subject = {
    subject_kind: result.subject_kind ?? "worktree", phase_id: result.phase_id ?? null,
    review_scope: result.review_scope ?? (stage === "build-code" ? "integration" : null),
    ...(paired ? { pair_id: result.pair_id, role: result.role } : {}),
  };
  const binding = {
    task_id: taskId, stage, review_track: result.review_track ?? null, review_kind: result.review_kind ?? null,
    ...subject, base_tree: identity.tree, candidate_tree: identity.tree, source: identity.source,
    snapshot_tree: identity.tree, material_id: result.material_id,
    ...(evidenceHash === null ? {} : { authenticated_evidence_sha256: evidenceHash }),
    material_revision: identity.materialRevision,
    ...(e2eBinding ? { e2e_binding: e2eBinding } : {}),
  };
  const attempt = {
    version: "wh-review-attempt.v1", attempt_id: attemptId, ...binding,
    ...(requestKey ? { request_key: requestKey } : {}),
    ...(closureManifest ? { closure_manifest: closureManifest } : {}),
    provider_attempts: result.provider_results.map((item) => providerAttemptRecord(item, result.runtime_id, outputRefs.get(item.provider) ?? null)),
    terminal_status: covered ? "semantic" : "unavailable",
    dispatch_state: result.dispatch_state === "blocked_before_dispatch" ? "blocked_before_dispatch" : "dispatched",
    error: covered ? null : recordError(result.error, { code: completed.length ? "REVIEW_QUORUM_INCOMPLETE" : "REVIEW_ALL_PROVIDERS_FAILED", message: completed.length ? "semantic member outputs retained; independent review coverage is incomplete" : "all provider results failed" }),
    ...(!noDispatch ? { review_policy: policy.policy, policy_snapshot_hash: policy.policy_snapshot_hash } : {}), report_ref: reportRef,
  };
  const canonical = covered ? {
    version: "wh-review-result.v1", ...binding, attempt_ref: attemptRef,
    provider_results: aggregation.valid.map((item) => ({ provider: item.provider, output: item.review })),
    findings: aggregation.findings.map((finding) => ({ provider: finding.providers[0], ...finding })),
    adjudication: { version: aggregation.adjudication.version, clusters: aggregation.adjudication.clusters }, report_ref: reportRef,
  } : null;
  if (canonical) authenticateCanonicalReviewResult({
    attempt, result: canonical,
    providerOutputs: outputs.map((item) => ({ ref: outputRefs.get(item.provider), provider: item.provider, review: item.review, evidenceAnchors: item.evidenceAnchors })),
  });
  const refs = { attempt_ref: attemptRef, result_ref: covered ? resultRef : null, report_ref: reportRef };
  records.push([attemptRef, JSON.stringify(attempt)]);
  if (canonical) records.push([resultRef, JSON.stringify(canonical)]);
  records.push([reportRef, reviewReportBody({ attempt, result: canonical, requestKey }) + "\n## Public result and coverage\n\n```json\n" + JSON.stringify({ semantic_status: semanticStatus, coverage: covered ? "satisfied" : "incomplete", public_result: result, ...(context ? { budget_context: context } : {}), ...(executionContext ? { execution_context: executionContext } : {}) }, null, 2) + "\n```\n"]);
  return { records, refs, semantic_status: semanticStatus, coverage: covered ? "satisfied" : "incomplete" };
}

export function recordSimpleReviewResult({ task, result, kernel, requestKey = null, budgetContext = null, executionContext = null, closureManifest = null, identityOverride = null }) {
  const handle = assertTaskHandle(task);
  if (executionContext !== null && !EXECUTION_CONTEXTS.has(executionContext)) throw new TypeError("execution binding requires the same authenticated public request");
  if (Object.hasOwn(result ?? {}, "e2e_binding")) throw new TypeError("result-only review cannot claim execution binding");
  const currentIdentity = assertAuthenticatedReviewIdentity(handle, kernel);
  const identity = identityOverride ?? currentIdentity;
  if (identityOverride !== null && (!closureManifest || closureManifest.snapshot_tree !== identity.tree
      || closureManifest.material_revision !== identity.materialRevision)) {
    throw new TypeError("historical review identity requires a matching closure manifest");
  }
  if (!result || !["available", "available-with-failures", "unavailable"].includes(result.status)) throw new TypeError("review result status is invalid");
  if (["source", "base_tree", "candidate_tree", "snapshot_tree", "material_revision"].some((key) => Object.hasOwn(result, key))) throw new TypeError("review result identity fields must come from the authenticated current context");
  if (!result?.role_results) {
    const prepared = prepareSimpleReviewRecord(handle, result, identity, requestKey, { budgetContext, executionContext, closureManifest });
    for (const [ref, raw] of prepared.records) createCanonicalRecord(handle, ref, raw);
    return prepared.refs;
  }
  if (typeof result.pair_id !== "string" || !result.pair_id.trim() || !SHA256_HEX.test(result.material_id ?? "")) throw new TypeError("paired review pair_id and material identity are required");
  if (!result.role_results || Array.isArray(result.role_results) || Object.keys(result.role_results).sort().join(",") !== "blue,red") throw new TypeError("paired review requires exactly red and blue roles");
  const prepared = {};
  for (const role of ["red", "blue"]) {
    const member = result.role_results[role];
    if (member?.role !== role || member.pair_id !== result.pair_id) throw new TypeError(`paired review ${role} role identity mismatch`);
    if (member.stage !== result.stage || (member.review_track ?? null) !== (result.review_track ?? null)
        || (member.review_kind ?? null) !== (result.review_kind ?? null) || member.material_id !== result.material_id) throw new TypeError(`paired review ${role} material/stage identity mismatch`);
    prepared[role] = prepareSimpleReviewRecord(handle, { ...member,
      ...(result.subject_kind === undefined ? {} : { subject_kind: result.subject_kind }),
      ...(result.phase_id === undefined ? {} : { phase_id: result.phase_id }),
      ...(result.review_scope === undefined ? {} : { review_scope: result.review_scope }),
    }, identity, requestKey, { paired: true, budgetContext, executionContext, closureManifest });
  }
  const reportRef = pairedReportRef(result.stage, handle.identity.taskId, identity, result.pair_id, requestKey);
  const summary = {
    status: "recorded", pair_id: result.pair_id,
    semantic_status: Object.values(prepared).some((entry) => entry.semantic_status === "available") ? "available" : "unavailable",
    partial: Object.values(prepared).some((entry) => entry.coverage !== "satisfied") || Object.values(result.role_results).some((entry) => entry.provider_results.some((item) => item.status !== "completed" || item.error !== null)),
    role_results: Object.fromEntries(Object.entries(prepared).map(([role, entry]) => [role, { ...entry.refs, semantic_status: entry.semantic_status, coverage: entry.coverage }])), report_ref: reportRef,
  };
  // Validate both roles before any writes. Stable refs make a retry after a
  // partial filesystem write complete the same records without redispatch.
  for (const entry of Object.values(prepared)) for (const [ref, raw] of entry.records) createCanonicalRecord(handle, ref, raw);
  createCanonicalRecord(handle, reportRef, "# Paired review\n\nrequest_key: " + (requestKey ?? "none") + "\n\n```json\n" + JSON.stringify(summary, null, 2) + "\n```\n");
  return summary;
}

function taskBoundIdentity({ task, result, snapshot_tree: snapshotTree, material_revision: materialRevision }) {
  const taskHandle = assertTaskHandle(task);
  if (!result || typeof result !== "object" || Array.isArray(result) || !new Set(["available", "unavailable"]).has(result.status)) throw new TypeError("task-bound review result is invalid");
  if (result.stage !== "verify-code" || !SHA256_HEX.test(result.material_id ?? "") || !Array.isArray(result.provider_results)) throw new TypeError("task-bound verify-code result identity is invalid");
  if (!GIT_OID.test(snapshotTree ?? "") || !MATERIAL_REVISION.test(materialRevision ?? "")) throw new TypeError("task-bound review current identity is invalid");
  return { taskHandle, taskId: taskHandle.identity.taskId, snapshotTree, materialRevision };
}

function taskBoundSource(tree) {
  return { target_commit: tree, base_commit: tree, base_tree: tree, captured_head: tree };
}

function taskBoundAttempt({ identity, result, attemptId, terminalStatus, error, providerAttempts, binding = undefined }) {
  return {
    version: "wh-review-attempt.v1", attempt_id: attemptId, task_id: identity.taskId, stage: "verify-code",
    review_track: result.review_track ?? null, review_kind: result.review_kind ?? null,
    subject_kind: "worktree", phase_id: null, review_scope: null,
    source: taskBoundSource(identity.snapshotTree), snapshot_tree: identity.snapshotTree,
    material_id: result.material_id, material_revision: identity.materialRevision,
    ...(binding ? { e2e_binding: binding } : {}),
    ...(result.review_policy ? { review_policy: result.review_policy, policy_snapshot_hash: policyHash(result.review_policy) } : {}),
    provider_attempts: providerAttempts, terminal_status: terminalStatus, error,
  };
}

export function recordTaskBoundE2eReviewUnavailable(input = {}) {
  const identity = taskBoundIdentity(input);
  const attemptId = randomUUID();
  const attemptRef = `quality/reviews/attempts/${attemptId}/attempt.json`;
  const attempt = taskBoundAttempt({ identity, result: input.result, attemptId, terminalStatus: "unavailable", error: input.result.error ?? { code: "E2E_REVIEWER_UNAVAILABLE", message: "task-bound review unavailable" }, providerAttempts: [] });
  identity.taskHandle.writeRecordAtomic(attemptRef, JSON.stringify(attempt));
  return Object.freeze({ attempt_ref: attemptRef, result_ref: null });
}

export function recordTaskBoundE2eReviewResult(input = {}) {
  const { binding, result } = input;
  const identity = taskBoundIdentity({ ...input, snapshot_tree: binding?.snapshot_tree, material_revision: binding?.material_revision });
  if (!binding || typeof binding !== "object" || Array.isArray(binding)) throw new TypeError("task-bound review binding is required");
  const frozen = binding.frozen_material;
  const execution = binding.reviewed_execution;
  const reviewer = binding.reviewer_actor;
  if (!frozen || !execution || !reviewer || !SHA256_HEX.test(frozen.sha256 ?? "") || !SHA256_HEX.test(frozen.provider_input_sha256 ?? "")
      || frozen.provider_input_sha256 !== result.material_id || !SHA256_HEX.test(execution.sha256 ?? "")
      || !execution.actor || typeof reviewer.source_id !== "string" || typeof reviewer.run_id !== "string") throw new TypeError("task-bound review E2E binding is invalid");
  const e2eBinding = {
    frozen_material: { ref: frozen.ref, sha256: frozen.sha256, provider_input_sha256: frozen.provider_input_sha256 },
    reviewed_execution: { ref: execution.ref, sha256: execution.sha256, actor: { ...execution.actor } },
    reviewer_actor: { ...reviewer },
  };
  if (result.provider_results.length !== 1) throw new TypeError("task-bound review requires exactly one provider result");
  const provider = result.provider_results[0];
  if (provider.status !== "completed" || provider.error !== null || provider.identity?.source_id !== reviewer.source_id) throw new TypeError("task-bound provider result identity is invalid");
  const providerFindings = (result.findings ?? []).filter((finding) => finding.provider === provider.provider);
  const outputContent = JSON.stringify({ findings: providerFindings.map(({ provider: _provider, ...finding }) => finding) });
  const attemptId = randomUUID();
  const attemptRef = `quality/reviews/attempts/${attemptId}/attempt.json`;
  const outputRef = `quality/reviews/attempts/${attemptId}/providers/${providerFileName(provider.provider, 0)}`;
  const outputRecord = { schema_version: "wh-review-provider-output.v1", task_id: identity.taskId, stage: "verify-code", attempt_id: attemptId, provider: provider.provider, content: outputContent, content_hash: textHash(outputContent), evidence_anchor_valid: providerFindings.map(() => true) };
  const aggregation = aggregateCanonicalProviderResults([{ provider: provider.provider, identity: normalizeIdentity(provider.identity, provider.provider), evidenceAnchors: outputRecord.evidence_anchor_valid, review: JSON.parse(outputContent) }], 1, { profilePriority: [provider.provider], requireIdentity: true, requireSourceId: true });
  if (aggregation.status !== "available") throw new Error("task-bound provider output could not be aggregated");
  const attempt = taskBoundAttempt({ identity, result, attemptId, terminalStatus: "semantic", error: null, binding: e2eBinding, providerAttempts: [providerAttemptRecord(provider, result.runtime_id, outputRef)] });
  const resultRef = `quality/reviews/results/verify-code-e2e-${randomUUID()}.json`;
  const resultRecord = {
    version: "wh-review-result.v1", task_id: identity.taskId, stage: "verify-code", review_track: result.review_track ?? null, review_kind: result.review_kind ?? null,
    subject_kind: "worktree", phase_id: null, review_scope: null,
    source: taskBoundSource(identity.snapshotTree), snapshot_tree: identity.snapshotTree, material_id: result.material_id, material_revision: identity.materialRevision,
    e2e_binding: e2eBinding, ...(result.review_policy ? { review_policy: result.review_policy } : {}), attempt_ref: attemptRef,
    provider_results: aggregation.valid.map((item) => ({ provider: item.provider, output: item.review })),
    findings: aggregation.findings.map((finding) => ({ provider: finding.providers[0], ...finding })),
    adjudication: { version: aggregation.adjudication.version, clusters: aggregation.adjudication.clusters },
  };
  identity.taskHandle.writeRecordAtomic(outputRef, JSON.stringify(outputRecord));
  identity.taskHandle.writeRecordAtomic(attemptRef, JSON.stringify(attempt));
  identity.taskHandle.writeRecordAtomic(resultRef, JSON.stringify(resultRecord));
  return Object.freeze({ attempt_ref: attemptRef, result_ref: resultRef });
}

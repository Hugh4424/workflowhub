import { createHash, randomUUID } from "node:crypto";
import { SHA256_HEX } from "../evidence/canonical-utils.mjs";
import { reviewPacketMaterialId, authenticatedEvidenceDigest } from "./review-packet-identity.mjs";
import { resolveReviewRouteIdentity } from "./review-route-identity.mjs";
import { assertTaskKernel } from "../task/task-capability.mjs";
import { validateSchema } from "./schema-validator.mjs";
import { aggregateCanonicalProviderResults, authenticateCanonicalReviewResult, parseCanonicalReviewerOutput, providerAdapter } from "./canonical-review-result.mjs";
import { ArtifactDir } from "../../core/artifact-dir.mjs";
import { openCurrentTaskWorkspace } from "../task/workspace.mjs";
import { materialFilesForCohort } from "../task/material-workspace.mjs";
import { runWorkspaceCommand } from "../task/workspace-runner.mjs";
import { freezeReviewMaterial, readFrozenReviewMaterial } from "../evidence/canonical-receipt-writer.mjs";
import { createQualityFact, qualityFactDigest } from "../evidence/quality-fact.mjs";
import { WORKFLOWHUB_CURRENT_SESSION_SOURCE_ID, WORKFLOWHUB_CURRENT_SESSION_BINDING_KIND, validateStageOutcomeProducerIdentity, validateCanonicalQualityFact } from "../evidence/canonical-evidence-validators.mjs";
import { authenticateAcceptanceExecutionAggregate } from "../evidence/freshness.mjs";
import { validateAcceptanceEvidence } from "../evidence/acceptance-evidence-validator.mjs";
import { reviewIdentityFromInput } from "./review-policy.mjs";

const GIT_OID = /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/;
const MATERIAL_REVISION = /^revision-[a-f0-9]{64}$/;
const REVIEW_ATTEMPT_REF = /^quality\/reviews\/attempts\/([A-Za-z0-9][A-Za-z0-9._-]*)\/attempt\.json$/;
const REVIEW_RESULT_REF = /^quality\/reviews\/results\/[A-Za-z0-9][A-Za-z0-9._-]*\.json$/;
const REVIEW_REPORT_REF = /^quality\/reviews\/reports\/[A-Za-z0-9][A-Za-z0-9._-]*\.md$/;
const REVIEW_PROVIDER_OUTPUT_REF = /^quality\/reviews\/attempts\/[A-Za-z0-9][A-Za-z0-9._-]*\/providers\/[A-Za-z0-9][A-Za-z0-9._-]*\.output\.json$/;
const IN_PROCESS_REQUEST_LOCKS = new Map();
const EXECUTION_CONTEXTS = new WeakSet();
const DEFAULT_REVIEW_ROUND_TIMEOUT_MS = 65_000;
// A dispatch that accepted AbortSignal must settle (and, for the bundled
// provider client, reap its process group) before this task can admit another
// request. A non-cooperating injected runner is recorded as sent_unparsed
// after this bound rather than silently treated as stopped.
const REVIEW_DISPATCH_CLEANUP_TIMEOUT_MS = 2_000;

function assertReviewAbortSignal(signal) {
  if (signal === null || signal === undefined) return null;
  if (typeof signal !== "object" || typeof signal.aborted !== "boolean"
      || typeof signal.addEventListener !== "function" || typeof signal.removeEventListener !== "function") {
    throw new TypeError("review signal must be an AbortSignal");
  }
  return signal;
}

function reviewCancelledError(signal) {
  const reason = signal?.reason;
  const message = typeof reason?.message === "string" && reason.message.trim() !== ""
    ? reason.message
    : "review record was interrupted before a terminal review result";
  const error = new Error(message);
  // Preserve one public cancellation fact across the CLI, route, and provider
  // seams. The provider client may use PROCESS_CANCELLED internally, but a
  // canonical review attempt must never expose a host-process-only verdict.
  error.code = "REVIEW_CANCELLED";
  return error;
}

function executionPreparationError(error) {
  const cause = typeof error?.code === "string" && error.code.trim() !== ""
    ? error.code
    : "UNKNOWN";
  // This happens before a provider is contacted. Keep the causal message in
  // the task-owned unavailable fact so a valid current execution can be
  // repaired; collapsing every untyped error to UNKNOWN made the failure
  // non-actionable. The error remains bounded to this authenticated
  // pre-dispatch boundary and does not expose provider output.
  const detail = typeof error?.message === "string" && error.message.trim() !== ""
    ? error.message.trim()
    : "preparation failed without a diagnostic message";
  const typed = new Error(`reviewed execution could not be prepared from current authenticated records (${cause}): ${detail}`);
  typed.code = "REVIEW_EXECUTION_PREPARATION_FAILED";
  return typed;
}

function awaitReviewOperation(value, timeoutMs, code, message, signal = null, onTimeout = null) {
  if (timeoutMs !== null && (!Number.isSafeInteger(timeoutMs) || timeoutMs < 0)) {
    throw new TypeError("review timeout must be null or a non-negative safe integer");
  }
  signal = assertReviewAbortSignal(signal);
  if (onTimeout !== null && typeof onTimeout !== "function") throw new TypeError("review timeout handler must be a function");
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (callback, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
      callback(value);
    };
    const timer = timeoutMs === null ? null : setTimeout(() => {
      const error = new Error(message);
      error.code = code;
      // A timeout must stop the local dispatch work before its task lock is
      // released. Otherwise a broker CLI can survive the canonical timeout
      // attempt and race a later request for the same material.
      // The abort hook is defensive cleanup only. Even an unexpected cleanup
      // failure must not throw out of the timer callback and strand this
      // promise (and its task lock) without the canonical unavailable attempt.
      try { onTimeout?.(error); } catch { /* the terminal timeout fact still wins */ }
      finish(reject, error);
    }, timeoutMs);
    const onAbort = () => finish(reject, reviewCancelledError(signal));
    if (signal?.aborted) {
      onAbort();
      return;
    }
    signal?.addEventListener("abort", onAbort, { once: true });
    Promise.resolve(value).then(
      (result) => finish(resolve, result),
      (error) => finish(reject, error),
    );
  });
}

function createReviewDispatchSignal(signal) {
  signal = assertReviewAbortSignal(signal);
  const controller = new AbortController();
  const abortFromCaller = () => controller.abort(signal.reason);
  if (signal?.aborted) abortFromCaller();
  else signal?.addEventListener("abort", abortFromCaller, { once: true });
  return {
    signal: controller.signal,
    abort(error) {
      if (!controller.signal.aborted) controller.abort(error);
    },
    dispose() { signal?.removeEventListener("abort", abortFromCaller); },
  };
}

function readExecutionSource(task, selection, identity, materials, { allowLegacy = false } = {}) {
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
  if (fact.evidence.length !== 1) throw new Error("reviewed_execution requires one exact acceptance wrapper");
  for (const evidence of fact.evidence) {
    const evidenceRaw = read(evidence.ref);
    if (textHash(evidenceRaw) !== evidence.sha256) throw new Error("reviewed_execution evidence hash mismatch");
  }
  const wrapper = JSON.parse(task.readRecord(fact.evidence[0].ref));
  try { validateAcceptanceEvidence(wrapper); } catch (error) { throw new Error(`reviewed_execution acceptance wrapper is invalid: ${error.message}`); }
  if (wrapper.acceptance_criterion_id !== "acceptance_execution"
      || wrapper.result !== "pass"
      || wrapper.snapshot_tree !== identity.tree
      || wrapper.refs.length !== 1
      || wrapper.refs[0].ref !== selection.ref
      || wrapper.refs[0].sha256 !== selection.sha256
      || wrapper.freshness?.status !== "current"
      || wrapper.freshness.snapshot_tree !== identity.tree
      || wrapper.freshness.material_revision !== identity.materialRevision
      || wrapper.freshness.evidence_freshness?.length !== 1
      || wrapper.freshness.evidence_freshness[0]?.ref !== wrapper.refs[0].ref
      || wrapper.freshness.evidence_freshness[0]?.sha256 !== wrapper.refs[0].sha256
      || wrapper.freshness.evidence_freshness[0]?.status !== "current") {
    throw new Error("reviewed_execution wrapper is not current or binds another aggregate");
  }
  const aggregateRaw = task.readRecord(selection.ref);
  if (textHash(aggregateRaw) !== selection.sha256) throw new Error("reviewed_execution aggregate hash mismatch");
  const aggregate = JSON.parse(aggregateRaw);
  const binding = aggregate.subject_fact?.execution_binding;
  const actor = authenticateAcceptanceExecutionAggregate(aggregate, fact, read, {}, "reviewed-execution");
  if (binding?.kind === WORKFLOWHUB_CURRENT_SESSION_BINDING_KIND) {
    const expectedRunId = `vnext-${textHash(`${aggregate.task_id}\0build-code`).slice(0, 32)}`;
    if (binding.task_id !== aggregate.task_id || binding.stage !== "build-code"
        || binding.snapshot_tree !== aggregate.snapshot_tree
        || binding.material_revision !== aggregate.material_revision
        || typeof binding.attempt_id !== "string" || !binding.attempt_id.trim()
        || binding.run_id !== expectedRunId) throw new Error("reviewed_execution current-session binding is invalid");
  } else {
    if (!allowLegacy) throw new Error("reviewed_execution must bind a current WorkflowHub session execution");
    if (!binding || typeof binding.stage_outcome_ref !== "string" || !binding.stage_outcome_ref.trim()) {
      throw new Error("reviewed_execution binding is missing");
    }
    const outcome = JSON.parse(task.readRecord(binding?.stage_outcome_ref));
    const producer = validateStageOutcomeProducerIdentity(outcome, "build-code", { requireSource: true });
    if (actor.source_kind !== producer.kind || actor.source_id !== producer.sourceId || actor.run_id !== producer.agentRunId) {
      throw new Error("reviewed_execution aggregate actor does not match its historical producer proof");
    }
  }
  return { aggregate, aggregateRaw, actor, fact, wrapper, wrapperReference: fact.evidence[0] };
}

// Read-only authenticated consumer seam for current execution evidence.  The
// route keeps legacy stage-outcome provenance readable internally, but current
// callers must select the TaskKernel-published acceptance aggregate and its
// quality fact; no host/bridge outcome is manufactured here.
export function readAuthenticatedExecutionSource(task, selection, identity, materials = {}) {
  const source = readExecutionSource(task, selection, identity, materials);
  if (source.aggregate.subject_fact?.execution_binding?.kind !== WORKFLOWHUB_CURRENT_SESSION_BINDING_KIND
      || source.actor.source_kind !== "workflowhub-session"
      || source.actor.source_id !== WORKFLOWHUB_CURRENT_SESSION_SOURCE_ID) {
    throw new Error("current execution source must be published by the WorkflowHub session");
  }
  return source;
}

function prepareExecutionReviewRequest(task, request, identity, materialIdForRequest = null) {
  if (request.reviewed_execution === undefined) return { request, executionContext: null };
  if (request.stage !== "verify-code" || (request.review_kind ?? request.reviewKind ?? null) !== null) throw new Error("reviewed_execution is only supported by ordinary verify-code review");
  const workspace = openCurrentTaskWorkspace(task);
  const artifacts = ArtifactDir.open(workspace.worktreeRoot, task);
  const activationCohort = task.manifest?.activation_cohort ?? "pre";
  const phaseIndex = activationCohort === "post" ? artifacts.read("phases/index.md") : null;
  const materialNames = materialFilesForCohort(activationCohort, phaseIndex === null ? {} : { "phases/index.md": phaseIndex });
  const materials = Object.fromEntries(materialNames.map((name) => [name, name === "phases/index.md" ? phaseIndex : artifacts.read(name)]));
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
  const prepared = {
    ...request,
    authenticated_evidence: {
      runtime_current_materials: materials,
      runtime_implementation_diff: diff.stdout,
      runtime_execution: { ...request.reviewed_execution, raw: execution.aggregateRaw, actor: execution.actor },
      runtime_execution_records: records,
      runtime_execution_outputs: outputs,
    },
  };
  const frozenMaterial = freezeReviewMaterial({ task, bytes: JSON.stringify(prepared) });
  const frozen = readFrozenReviewMaterial({ task, ...frozenMaterial });
  if (frozen.status !== "recorded") throw new Error(`frozen review material is unavailable: ${frozen.diagnostic.reason}`);
  const frozenRequest = JSON.parse(frozen.bytes.toString("utf8"));
  const providerMaterialId = reviewRequestMaterialId(frozenRequest, materialIdForRequest);
  const executionContext = Object.freeze({ frozen_material: frozenMaterial,
    reviewed_execution: { ref: request.reviewed_execution.ref, sha256: request.reviewed_execution.sha256, actor: execution.actor },
    provider_material_id: providerMaterialId });
  EXECUTION_CONTEXTS.add(executionContext);
  return { request: frozenRequest, executionContext };
}

function executionBindingForResult(task, result, identity, context, { allowHistoricalPreDispatchMaterialFailure = false } = {}) {
  if (context === null) return null;
  if (result.stage !== "verify-code") throw new Error("execution review context is restricted to verify-code");
  const frozen = readFrozenReviewMaterial({ task, ...context.frozen_material });
  if (frozen.status !== "recorded") throw new Error(`frozen review material is unavailable: ${frozen.diagnostic.reason}`);
  if (frozen.provider_input_sha256 !== context.frozen_material.provider_input_sha256) throw new Error("frozen review original bytes hash mismatch");
  const request = JSON.parse(frozen.bytes.toString("utf8"));
  const materialIdMatches = context.provider_material_id === result.material_id;
  const preDispatchMaterialFailure = result.status === "unavailable"
    && result.error?.code === "REVIEW_INPUT_TOO_LARGE"
    && Array.isArray(result.provider_results) && result.provider_results.length === 0
    && Array.isArray(result.findings) && result.findings.length === 0;
  // This attempt predates the bounded verify-code projection. It failed before
  // a provider bundle was dispatched, so its recorded material_id is a
  // historical diagnostic, not a provider-result attestation. Keep the
  // immutable attempt readable after the projection algorithm changes.
  if (!materialIdMatches && !(allowHistoricalPreDispatchMaterialFailure && preDispatchMaterialFailure)) {
    throw new Error("execution review result does not match the frozen provider bundle");
  }
  const authenticatedEvidence = request.authenticated_evidence;
  const execution = readExecutionSource(task, request.reviewed_execution, identity, authenticatedEvidence?.runtime_current_materials);
  if (canonicalJson(context.reviewed_execution) !== canonicalJson({ ref: request.reviewed_execution.ref, sha256: request.reviewed_execution.sha256, actor: execution.actor })
      || authenticatedEvidence?.runtime_execution?.raw !== execution.aggregateRaw) throw new Error("frozen execution review binding mismatch");
  const provider = result.provider_results.find((item) => item.status === "completed" && item.error === null
    && normalizeIdentity(item.identity, item.provider)?.source_id.split("/")[0] !== execution.actor.source_id.split("/")[0]);
  if (!provider) return null;
  const identityValue = normalizeIdentity(provider.identity, provider.provider);
  if (!identityValue || typeof result.runtime_id !== "string" || !result.runtime_id.trim()) return null;
  const { provider_material_id: _providerMaterialId, ...binding } = context;
  return { ...binding, reviewer_actor: { source_kind: "review_provider", source_id: identityValue.source_id, run_id: result.runtime_id } };
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

function rejectBuildPrdCanonicalPersistence(result, label = "review result") {
  const snake = result?.review_kind;
  const camel = result?.reviewKind;
  if (snake !== undefined && camel !== undefined && snake !== camel) {
    throw new TypeError("review identity aliases review_kind/reviewKind disagree");
  }
  if (snake === "build_prd" || camel === "build_prd") {
    throw new TypeError(`BUILD_PRD_REPORT_ONLY_NOT_PERSISTED: ${label} cannot use canonical formal-stage attempt/result records`);
  }
}

function normalizeReviewIdentity(input, label = "review") {
  const identity = reviewIdentityFromInput(input);
  const {
    review_track: _reviewTrack,
    reviewTrack: _reviewTrackAlias,
    review_scope: _reviewScope,
    reviewScope: _reviewScopeAlias,
    review_kind: _reviewKind,
    reviewKind: _reviewKindAlias,
    ...rest
  } = input;
  return {
    ...rest,
    stage: identity.stage,
    ...(Object.hasOwn(input, "review_track") || Object.hasOwn(input, "reviewTrack") ? { review_track: identity.reviewTrack } : {}),
    ...(identity.reviewKind === "mini_task.design" || identity.reviewKind === "mini_task.implementation"
      || Object.hasOwn(input, "review_scope") || Object.hasOwn(input, "reviewScope")
      ? { review_scope: identity.reviewScope } : {}),
    ...(Object.hasOwn(input, "review_kind") || Object.hasOwn(input, "reviewKind") ? { review_kind: identity.reviewKind } : {}),
  };
}

function normalizeCanonicalReviewResult(result, label = "review result") {
  rejectBuildPrdCanonicalPersistence(result, label);
  return normalizeReviewIdentity(result, label);
}

function mergeRequestResultIdentity(request, result) {
  for (const field of ["subject_kind", "phase_id", "review_scope"]) {
    if (request[field] === undefined) continue;
    if (Object.hasOwn(result, field) && result[field] !== request[field]) {
      throw new TypeError(`review result ${field} does not match its request`);
    }
    if (!Object.hasOwn(result, field)) result = { ...result, [field]: request[field] };
  }
  return result;
}

const SHARED_REVIEW_TUPLE_FIELDS = ["subject_kind", "phase_id", "review_scope"];

function defaultSharedReviewTuple(stage) {
  return stage === "build-code"
    ? { subject_kind: "worktree", phase_id: null, review_scope: "integration" }
    : { subject_kind: "worktree", phase_id: null, review_scope: null };
}

function assertSharedReviewTuple(stage, tuple, label = "review") {
  if (!["worktree", "phase"].includes(tuple.subject_kind)) throw new TypeError(`${label} subject_kind is invalid`);
  if (tuple.phase_id !== null && (typeof tuple.phase_id !== "string" || !tuple.phase_id.trim())) {
    throw new TypeError(`${label} phase_id is invalid`);
  }
  if (![null, "phase", "integration"].includes(tuple.review_scope)) throw new TypeError(`${label} review_scope is invalid`);
  if (tuple.review_scope === "phase"
      && (stage !== "build-code" || tuple.subject_kind !== "phase" || typeof tuple.phase_id !== "string" || !tuple.phase_id.trim())) {
    throw new TypeError(`${label} review identity tuple is invalid for phase scope`);
  }
  if (tuple.review_scope === "integration"
      && (stage !== "build-code" || tuple.subject_kind !== "worktree" || tuple.phase_id !== null)) {
    throw new TypeError(`${label} review identity tuple is invalid for integration scope`);
  }
  if (tuple.subject_kind === "phase"
      && (stage !== "build-code" || typeof tuple.phase_id !== "string" || !tuple.phase_id.trim())) {
    throw new TypeError(`${label} phase subject requires a non-empty phase_id and build-code stage`);
  }
  if (tuple.subject_kind !== "phase" && tuple.phase_id !== null) {
    throw new TypeError(`${label} non-phase subject requires phase_id null`);
  }
  if (stage !== "build-code" && tuple.review_scope !== null) {
    throw new TypeError(`${label} does not use review_scope`);
  }
  return tuple;
}

function sharedTupleMismatch(role, field) {
  if (field === "review_scope") return new TypeError(`paired review ${role} material/stage identity mismatch`);
  return new TypeError(`paired review ${role} ${field} identity mismatch`);
}

function normalizePairedSharedIdentity(result, members) {
  const sides = [
    { label: "outer", value: result },
    { label: "red", value: members.red },
    { label: "blue", value: members.blue },
  ];
  const tuple = defaultSharedReviewTuple(result.stage);
  let reviewScopeProvided = false;
  for (const field of SHARED_REVIEW_TUPLE_FIELDS) {
    const provided = sides.filter(({ value }) => value[field] !== undefined);
    if (field === "review_scope") reviewScopeProvided = provided.length > 0;
    for (let index = 1; index < provided.length; index += 1) {
      if (provided[index].value[field] !== provided[0].value[field]) {
        const role = provided[index].label === "outer" ? "outer" : provided[index].label;
        throw sharedTupleMismatch(role, field);
      }
    }
    if (provided.length) tuple[field] = provided[0].value[field];
  }
  if (!reviewScopeProvided) {
    const hasPhaseSubject = tuple.subject_kind === "phase"
      || (typeof tuple.phase_id === "string" && tuple.phase_id.trim() !== "");
    tuple.review_scope = result.stage === "build-code"
      ? (hasPhaseSubject ? "phase" : "integration")
      : null;
  }
  assertSharedReviewTuple(result.stage, tuple, "paired review");
  const completed = Object.fromEntries(sides.map(({ label, value }) => [label, { ...value, ...tuple }]));
  return { result: completed.outer, members: { red: completed.red, blue: completed.blue } };
}

function createCanonicalRecord(task, relativePath, data, kernel = null) {
  if (kernel && typeof kernel.publishCanonicalRecord === "function") {
    try {
      const current = task.readRecord(relativePath);
      if (current !== data) throw new Error(`immutable review record conflict: ${relativePath}`);
      return { idempotent: true };
    } catch (error) { if (error?.code !== "ENOENT") throw error; }
    return kernel.publishCanonicalRecord(relativePath, data);
  }
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

// One canonical evidence identity shared with the packet identity helper and
// the skill runner. Hashing the raw value here while the provider projection is
// host-path redacted made a path-bearing evidence value unrecordable.
function authenticatedEvidenceHash(value) {
  return authenticatedEvidenceDigest(value);
}

function reviewRequestMaterialId(request, materialIdForRequest = null) {
  if (typeof materialIdForRequest === "function") {
    const value = materialIdForRequest(request);
    if (typeof value !== "string" || !SHA256_HEX.test(value)) throw new TypeError("materialIdForRequest must return a sha256 hex string");
    return value;
  }
  if (request?.materials && typeof request.materials === "object" && !Array.isArray(request.materials)) return reviewPacketMaterialId(request);
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
  const retry = request.retry && typeof request.retry === "object" && !Array.isArray(request.retry)
    ? {
        requested: request.retry.requested === true,
        basis: typeof request.retry.basis === "string" ? request.retry.basis : null,
      }
    : null;
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
    // Free-form retry explanations are provenance, not request identity. A
    // changing sentence must not manufacture another dispatch for the same
    // authenticated material/route change.
    retry,
  };
  return textHash(canonicalJson(stable));
}

// The C4 semantic origin is a finite host classification reconstructed from
// existing normalized scope/subject fields. It is intentionally separate from
// request_key (operational locking/provenance), K2 review_origin (lifecycle),
// and route/provider/material evidence bindings. Its whole domain is the three
// values returned below; every other field combination fails closed.
function semanticOriginFromRecord(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const stage = value.stage;
  // An absent build-code scope takes the canonical integration default, while an
  // explicitly declared null is its own record and stays a distinct class.
  const scopeDeclared = value.review_scope !== undefined || value.reviewScope !== undefined;
  const declaredScope = value.review_scope ?? value.reviewScope ?? null;
  const reviewScope = scopeDeclared ? declaredScope : (stage === "build-code" ? "integration" : null);
  const subjectKind = value.subject_kind ?? (reviewScope === "phase" ? "phase" : "worktree");
  if (!["worktree", "phase"].includes(subjectKind)) return null;
  if (reviewScope === "phase" && (stage !== "build-code" || subjectKind !== "phase")) return null;
  if (reviewScope === "integration" && (stage !== "build-code" || subjectKind !== "worktree")) return null;
  if (![null, "phase", "integration"].includes(reviewScope)) return null;
  // A null scope only ever classifies a worktree subject; a phase subject there
  // is not a reconstructable classification.
  if (reviewScope === null && subjectKind !== "worktree") return null;
  return `${reviewScope ?? "stage"}:${subjectKind}`;
}

// A retry is a caller-owned judgment, not a counter or a material-derived
// trigger. The basis values are deliberately narrow so an arbitrary changed
// request cannot silently become a second provider call.
const REVIEW_RETRY_BASES = new Set(["material_changed", "provider_changed", "source_recovered"]);

function retryDecision(request) {
  const value = request?.retry;
  if (value === undefined || value === null
      || (value && typeof value === "object" && !Array.isArray(value)
        && (!Object.hasOwn(value, "requested") || value.requested === false))) {
    return Object.freeze({ requested: false, admitted: false, basis: null, reason: null });
  }
  if (!value || typeof value !== "object" || Array.isArray(value) || value.requested !== true
      || typeof value.reason !== "string" || value.reason.trim() === "") {
    return Object.freeze({
      requested: true,
      admitted: false,
      basis: null,
      reason: null,
      invalid: true,
      error: "review retry requires requested=true and a non-empty reason",
    });
  }
  const basis = typeof value.basis === "string" ? value.basis : null;
  return Object.freeze({
    requested: true,
    admitted: REVIEW_RETRY_BASES.has(basis),
    basis,
    reason: value.reason.trim(),
  });
}

function attemptRouteIdentity(attempt) {
  const value = attempt?.closure_manifest?.route_identity ?? attempt?.route_identity ?? null;
  return SHA256_HEX.test(value ?? "") ? value : null;
}

function sameReviewLineage(attempt, request) {
  const requestScope = request.review_scope ?? request.reviewScope ?? (request.stage === "build-code" ? "integration" : null);
  const attemptScope = attempt.review_scope ?? (attempt.stage === "build-code" ? "integration" : null);
  return attempt.stage === request.stage
    && (attempt.phase_id ?? null) === (request.phase_id ?? null)
    && (attempt.review_track ?? null) === (request.review_track ?? request.reviewTrack ?? null)
    && (attempt.review_kind ?? null) === (request.review_kind ?? request.reviewKind ?? null)
    && (attempt.subject_kind ?? "worktree") === (request.subject_kind ?? "worktree")
    && attemptScope === requestScope
    && semanticOriginFromRecord(attempt) === semanticOriginFromRecord(request)
    && subjectMatchesAttempt(attempt, request.subject)
    && (attempt.authenticated_evidence_sha256 ?? null) === authenticatedEvidenceHash(request.authenticated_evidence);
}

function authenticateRetryDecision(retry, { history, request, materialId, routeIdentity, requestKey }) {
  if (!retry?.admitted) return retry;
  const currentRoute = SHA256_HEX.test(routeIdentity ?? "") ? routeIdentity : null;
  const lineage = history.filter(({ attempt }) => sameReviewLineage(attempt, request));
  // A canonical attempt with the current request key is the current lineage
  // head for this exact material/route input. A prior attempt must not keep
  // admitting another dispatch after that head has already consumed the
  // judged change (A -> B -> repeated B, including unavailable B).
  const currentHead = lineage.find(({ attempt }) => attempt.request_key === requestKey);
  if (currentHead) {
    // The exact retry request was already recorded. Treat the request as
    // idempotently admitted so findReusableReview can return that immutable
    // semantic or unavailable fact without dispatching a second provider call.
    return Object.freeze({ ...retry, admitted: true });
  }
  const authenticated = lineage.some(({ attempt }) => {
    if (retry.basis === "material_changed") return attempt.material_id !== materialId;
    const previousRoute = attemptRouteIdentity(attempt);
    if (retry.basis === "provider_changed") {
      return currentRoute !== null && previousRoute !== null && previousRoute !== currentRoute;
    }
    if (retry.basis === "source_recovered") {
      // Only a review that provably never reached the broker may be recovered this
      // way. `sent_unparsed` means the request WAS transmitted and a remote runtime
      // may exist, so it is deliberately not auto-recoverable here.
      return currentRoute !== null && previousRoute === null && attempt.dispatch_state === "blocked_before_dispatch";
    }
    return false;
  });
  return Object.freeze({ ...retry, admitted: authenticated });
}

function reviewSubjectHash(subject) {
  return textHash(canonicalJson(subject ?? null));
}

function attemptSubjectHash(attempt) {
  const value = attempt?.closure_manifest?.subject_sha256 ?? attempt?.subject_sha256;
  return typeof value === "string" && SHA256_HEX.test(value) ? value : null;
}

function subjectMatchesAttempt(attempt, subject) {
  const actual = attemptSubjectHash(attempt);
  // Older canonical attempts predate the closure subject hash. They can only
  // remain in the default null-subject namespace; a non-null subject cannot
  // be proven equivalent and must stay fail-closed.
  return actual === null
    ? (subject === undefined || subject === null)
    : actual === reviewSubjectHash(subject);
}

function findReusableReview({ history, request, routeIdentity = null, snapshotTree = null, requestKey = null, retry = null, materialId = null }) {
  const requestOrigin = semanticOriginFromRecord(request);
  // An origin that cannot be reconstructed from the record fails closed: the
  // request is dispatched only when no authenticated reusable attempt exists
  // whose canonical identity is unprovable.
  if (requestOrigin === null) return null;
  // Reuse is an authenticated transport decision. If the current route could
  // not be resolved, a legacy attempt with a null route identity must not be
  // mistaken for an equivalent reusable result.
  if (!SHA256_HEX.test(routeIdentity ?? "")) return null;
  const requestTrack = request.review_track ?? request.reviewTrack ?? null;
  const requestKind = request.review_kind ?? request.reviewKind ?? null;
  const requestPhaseId = request.phase_id ?? null;
  for (const entry of history) {
    const attempt = entry.attempt;
    // Canonical dedup identity, exactly as spec FR-C4-001 fixes it:
    // (stage, phase_id, track, review_kind, origin). `origin` is the
    // host-classified scope/subject category of the authorized C4 definition;
    // it is never a material id, route identity, provider identity or evidence
    // hash, and it is not the K2 review_origin lifecycle value.
    //
    // The tuple names *which* canonical review this is. It deliberately does
    // not name what was reviewed, so it is not by itself a sufficient reuse
    // key: D-007 requires that a change to the submitted material must never
    // read back the earlier review (CONTEXT.md:412, "大纲变更后旧方向审查结果
    // 作废" -- after the outline changes the earlier direction review result is
    // void). The recorded material identity is therefore a mandatory
    // currentness precondition below, not a sixth dedup dimension.
    if (attempt.stage !== request.stage
        || (attempt.phase_id ?? null) !== requestPhaseId
        || (attempt.review_track ?? null) !== requestTrack
        || (attempt.review_kind ?? null) !== requestKind
        || semanticOriginFromRecord(attempt) !== requestOrigin) continue;
    // D-007 material identity guard. The canonical attempt envelope persists
    // `material_id`, so the submitted material of the current request must be
    // byte-identical to the material of the recorded attempt before that
    // attempt may be reused. Both sides must be provable: an unauthenticated
    // current material id or a legacy attempt that predates material
    // persistence stays fail-closed and is never reused.
    if (!SHA256_HEX.test(materialId ?? "") || attempt.material_id !== materialId) continue;
    // The identity matched, so this entry is the same canonical review of the
    // same material. The checks below are transport and integrity
    // preconditions on the recorded attempt as a reuse target; they are
    // deliberately not part of the key.
    // The recorded route identity remains provenance. A route change does not
    // silently invalidate a historical review; an explicit judged retry gets
    // a distinct request key and is handled below.
    if (!subjectMatchesAttempt(attempt, request.subject)) continue;
    if ((attempt.authenticated_evidence_sha256 ?? null) !== authenticatedEvidenceHash(request.authenticated_evidence)) continue;
    // `material_revision` (the specification bundle revision) stays provenance
    // rather than a reuse-key dimension: the authenticated material identity
    // above already decides whether the reviewed bytes are the same, and the
    // remaining currentness guard is the verify-code terminal review's
    // authenticated code snapshot.
    if (request.stage === "verify-code" && snapshotTree !== null && attempt.snapshot_tree !== snapshotTree) continue;
    // Legacy REVIEW_WAIT_EXCEEDED attempts are historical non-terminal facts;
    // they do not prove the managed broker/runtime stopped. Reuse their
    // exact-material attempt so a later request cannot create a second live
    // review merely because an earlier status observation had no provider inventory.
    if (retry?.admitted && attempt.request_key !== requestKey) continue;
    return entry.pairSummary ?? entry.prepared.refs;
  }
  return null;
}

function hasPriorVerifySnapshot(request, history, snapshotTree) {
  if (request.stage !== "verify-code") return false;
  const requestTrack = request.review_track ?? request.reviewTrack ?? null;
  const requestKind = request.review_kind ?? request.reviewKind ?? null;
  const requestPhaseId = request.phase_id ?? null;
  const requestOrigin = semanticOriginFromRecord(request);
  return history.some(({ attempt }) => attempt.stage === request.stage
    && (attempt.phase_id ?? null) === requestPhaseId
    && (attempt.review_track ?? null) === requestTrack
    && (attempt.review_kind ?? null) === requestKind
    && semanticOriginFromRecord(attempt) === requestOrigin
    && subjectMatchesAttempt(attempt, request.subject)
    && attempt.snapshot_tree !== snapshotTree);
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

function safeTerminalHealth(health, provider) {
  if (!health || typeof health !== "object" || Array.isArray(health)
      || Object.keys(health).sort().join(",") !== "last_liveness_at_ms,last_output_at_ms,liveness,progress_events,provider,status,stderr_bytes,stdout_bytes"
      || health.provider !== provider || !["completed", "failed", "cancelled"].includes(health.status)
      || health.liveness !== false) return false;
  return ["last_liveness_at_ms", "last_output_at_ms"].every((key) =>
    health[key] === null || (Number.isSafeInteger(health[key]) && health[key] >= 0))
    && ["progress_events", "stdout_bytes", "stderr_bytes"].every((key) =>
      Number.isSafeInteger(health[key]) && health[key] >= 0);
}

function unavailableAfterDispatch({ request, result, materialId, error } = {}) {
  const providerResults = Array.isArray(result?.provider_results)
    ? result.provider_results.flatMap((item) => {
      const provider = item?.provider;
      if (typeof provider !== "string" || provider.trim() === "") return [];
      try { providerAdapter(provider); } catch { return []; }
      const status = new Set(["completed", "running", "failed", "cancelled"]).has(item?.status)
        ? item.status
        : "failed";
      const originalError = item?.error && typeof item.error === "object" && !Array.isArray(item.error)
        && typeof item.error.code === "string" && item.error.code.trim() !== ""
        && typeof item.error.message === "string" && item.error.message.trim() !== ""
        ? { code: item.error.code, message: item.error.message }
        : null;
      return [{
        provider,
        status,
        ...(item.identity && typeof item.identity === "object" && !Array.isArray(item.identity) ? { identity: item.identity } : {}),
        session_id: item.session_id ?? null,
        error: ["completed", "running"].includes(status)
          ? null
          : (originalError ?? { code: "REVIEW_POST_DISPATCH_VALIDATION_FAILED", message: "provider result was retained as unavailable after review record validation failed" }),
        // The fallback deliberately drops semantic findings, so the retained
        // provider lifecycle must carry an empty anchor list rather than the
        // original finding anchors.
        evidence_anchor_valid: [],
        ...(item.timing === undefined ? {} : { timing: item.timing }),
        ...(item.usage === undefined ? {} : { usage: item.usage }),
        ...(status !== "running" && safeTerminalHealth(item.execution?.health, provider)
          ? { execution: { health: item.execution.health } } : {}),
      }];
    })
    : [];
  return {
    status: "unavailable",
    stage: request.stage,
    ...(request.review_track === undefined ? {} : { review_track: request.review_track }),
    ...(request.review_kind === undefined ? {} : { review_kind: request.review_kind }),
    ...(request.subject_kind === undefined ? {} : { subject_kind: request.subject_kind }),
    ...(request.phase_id === undefined ? {} : { phase_id: request.phase_id }),
    ...(request.review_scope === undefined ? {} : { review_scope: request.review_scope }),
    material_id: materialId,
    runtime_id: result?.runtime_id ?? null,
    outcome: "unavailable",
    dispatch_state: ["blocked_before_dispatch", "sent_unparsed"].includes(result?.dispatch_state) ? result.dispatch_state : "dispatched",
    provider_results: providerResults,
    findings: [],
    ...(request.authenticated_evidence === undefined ? {} : {
      authenticated_evidence: request.authenticated_evidence,
      authenticated_evidence_sha256: authenticatedEvidenceHash(request.authenticated_evidence),
    }),
    error: reviewRequestError(error),
  };
}

/**
 * Every failure after the request identity and a task identity are known gets
 * the same immutable unavailable attempt.  This deliberately covers route,
 * retry, history, and source-drift failures before provider dispatch; only an
 * inability to authenticate any task identity at all may return without an
 * attempt.
 */
function recordUnavailableRequest({ task, kernel, request, identity, materialId, requestKey = null, closureManifest = null,
  executionContext = null, error, dispatchState = "blocked_before_dispatch", retry = null } = {}) {
  const result = unavailableAfterDispatch({
    request,
    materialId,
    result: { dispatch_state: dispatchState },
    error,
  });
  const refs = recordSimpleReviewResult({
    task,
    kernel,
    request,
    requestKey,
    executionContext,
    closureManifest,
    identityOverride: identity,
    result,
  });
  return {
    // The attempt was persisted, but the requested semantic review remains
    // unavailable. Keep the public outcome compatible with other
    // blocked-before-dispatch replies while exposing its canonical refs.
    status: "unavailable",
    reused: false,
    dispatch_state: result.dispatch_state,
    ...refs,
    ...(retry ? { retry } : {}),
    error: result.error,
  };
}

async function resolveReviewRouteState({ request, executionContext, resolveRouteIdentity, routeDependencies } = {}) {
  let routeIdentity;
  let routeError;
  try {
    const trustedRoute = await resolveRouteIdentity(request, routeDependencies ?? undefined);
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
  return Object.freeze({ routeIdentity: routeIdentity ?? null, routeError });
}

function sameAuthenticatedReviewIdentity(left, right) {
  return left?.tree === right?.tree
    && left?.materialRevision === right?.materialRevision
    && canonicalJson(left?.source ?? null) === canonicalJson(right?.source ?? null);
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
  const status = completed ? "completed" : item?.status === "running" ? "running" : item?.status === "cancelled" ? "cancelled" : "failed";
  const execution = item?.execution && typeof item.execution === "object" ? item.execution : {};
  const retry = execution.retry ?? item?.retry ?? { count: 0, progress_events: 0 };
  const rawOutputRef = item?.raw_output_ref ?? execution.raw_output_ref ?? null;
  const identity = normalizeIdentity(item.identity, item.provider);
  const processOutcome = Object.hasOwn(execution, "process_outcome") ? execution.process_outcome : item?.process_outcome;
  const parseOutcome = Object.hasOwn(execution, "parse_outcome") ? execution.parse_outcome : item?.parse_outcome;
  if (Object.hasOwn(execution, "health")
      && (status === "running" || execution.health?.provider !== item.provider)) {
    throw new TypeError("review provider health does not match its provider attempt");
  }
  return {
    provider: item.provider,
    status,
    // The attempt schema treats identity as optional: a failed/cancelled
    // provider with no authenticated identity must retain that absence rather
    // than serializing an invalid `identity: null` property.
    ...(identity === null ? {} : { identity }),
    session_id: item.session_id ?? null,
    runtime_id: runtimeId ?? null,
    output_ref: outputRef,
    raw_output_ref: rawOutputRef,
    error: ["completed", "running"].includes(status) ? null : recordError(item.error, { code: "PROVIDER_RESULT_UNAVAILABLE", message: "provider result unavailable" }),
    ...(processOutcome === undefined ? {} : { process_outcome: processOutcome }),
    ...(parseOutcome === undefined ? {} : { parse_outcome: parseOutcome }),
    ...(item?.unavailable_diagnostics ? { unavailable_diagnostics: item.unavailable_diagnostics } : {}),
    execution: {
      adapter: execution.adapter ?? providerAdapter(item.provider),
      model: Object.hasOwn(execution, "model") ? execution.model : (item.identity?.model ?? "unknown"),
      effort: Object.hasOwn(execution, "effort") ? execution.effort : null,
      thinking: Object.hasOwn(execution, "thinking") ? execution.thinking : null,
      timing: execution.timing ?? item.timing ?? { started_at_ms: null, completed_at_ms: null, duration_ms: null },
      usage: execution.usage ?? item.usage ?? null,
      ...(Object.hasOwn(execution, "health") ? { health: execution.health } : {}),
      ...(rawOutputRef === null ? {} : { raw_output_ref: rawOutputRef }),
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

// Older records carried a host-owned context block in their report. Read it
// only to authenticate immutable history; new records do not write this block.
function authenticateHistoricalReviewContext(context, identity, requestKey, result) {
  if (context === null) return null;
  if (!context || typeof context !== "object" || Array.isArray(context)
      || Object.keys(context).sort().join(",") !== "kind,material_revision,phase_id,route_identity,snapshot_tree"
      || !["initial", "focused", "phase", "route_repair"].includes(context.kind)
      || context.material_revision !== identity.materialRevision || context.snapshot_tree !== identity.tree
      || !SHA256_HEX.test(context.route_identity ?? "") || !SHA256_HEX.test(requestKey ?? "")
      || context.phase_id !== (result?.phase_id ?? null)
      || (context.kind === "phase") !== (result?.review_scope === "phase")
      || (context.kind === "phase" && (typeof context.phase_id !== "string" || !context.phase_id.trim()))) {
    throw new TypeError("historical review context is not bound to its authenticated source and scope");
  }
  return { kind: context.kind, phase_id: context.phase_id, material_revision: context.material_revision,
    snapshot_tree: context.snapshot_tree, route_identity: context.route_identity };
}

// Read the existing pre-coverage-block writer format. This is verification of
// immutable facts, not conversion or a retired writer. New deterministic
// records cannot downgrade to this format by deleting their provenance block.
function readLegacyReviewAttempt(task, ref, raw, attempt, report) {
  validateSchema("attempt", attempt);
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(attempt.attempt_id)
      || attempt.pair_id || !attempt.source
      || attempt.base_tree !== attempt.snapshot_tree || attempt.candidate_tree !== attempt.snapshot_tree
      || attempt.source.base_tree !== attempt.snapshot_tree
      || !["target_commit", "base_commit", "captured_head"].every((key) => GIT_OID.test(attempt.source[key] ?? ""))
      || !attempt.review_policy || policyHash(attempt.review_policy) !== attempt.policy_snapshot_hash
      || !["dispatched", "blocked_before_dispatch", "sent_unparsed"].includes(attempt.dispatch_state)) throw new Error("old canonical review source or policy is invalid");
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
    saved: {},
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

/**
 * `result_ref` is a pointer to the paired record. Records written before that
 * binding existed are still authentic immutable history: the freshness reader
 * tolerates the missing field, so history reconstruction must not fail closed
 * only because the pointer was added later.
 */
function reviewRecordProjection(raw) {
  let value;
  try { value = JSON.parse(raw); } catch { return null; }
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  if (Object.prototype.hasOwnProperty.call(value, "result_ref")) delete value.result_ref;
  return JSON.stringify(value);
}

function matchesReviewRecord(stored, expected) {
  if (stored === expected) return true;
  let storedValue;
  try { storedValue = JSON.parse(stored); } catch { return false; }
  if (!storedValue || typeof storedValue !== "object" || Array.isArray(storedValue)
      || Object.prototype.hasOwnProperty.call(storedValue, "result_ref")) return false;
  const storedProjection = reviewRecordProjection(stored);
  return storedProjection !== null && storedProjection === reviewRecordProjection(expected);
}

function readCanonicalReviewHistory(task, scope = null) {
  if (typeof task.listCanonicalReviewAttemptRefs !== "function") throw new Error("canonical attempt inventory is unavailable");
  const refs = task.listCanonicalReviewAttemptRefs();
  if (!Array.isArray(refs) || new Set(refs).size !== refs.length) throw new Error("canonical attempt inventory is invalid");
  const classifyScope = (attempt) => {
    // A malformed historical record can still carry a trustworthy namespace
    // discriminator. An explicit different stage is provably foreign even
    // when a legacy record omitted task_id/material identity. Do not let that
    // unrelated debris block the current stage; same-stage records remain
    // unknown/fail-closed below.
    if (scope !== null && typeof attempt?.stage === "string" && attempt.stage !== scope.stage) return "foreign";
    if (scope === null || !attempt || typeof attempt !== "object"
        || attempt.task_id !== task.identity.taskId
        || typeof attempt.stage !== "string"
        || typeof attempt.snapshot_tree !== "string"
        || typeof attempt.material_revision !== "string") return "unknown";
    const required = [
      [attempt.stage, scope.stage],
      [attempt.review_track ?? null, scope.reviewTrack],
      [attempt.review_kind ?? null, scope.reviewKind],
      [attempt.subject_kind ?? "worktree", scope.subjectKind],
      [attempt.review_scope ?? (attempt.stage === "build-code" ? "integration" : null), scope.reviewScope],
    ];
    if (required.some(([actual, expected]) => actual !== expected)) return "foreign";
    // The caller's currentness dimensions are part of the same namespace
    // decision (D-007). A damaged record from another code snapshot or another
    // material revision is provably not this request's namespace and must not
    // block the current request, exactly like a foreign stage; CONTEXT.md:412
    // makes a material change void the earlier review. The comparison is only
    // applied when the caller supplied the dimension, so a missing scope value
    // keeps the record unknown/fail-closed instead of silently foreign.
    if (typeof scope.snapshotTree === "string" && attempt.snapshot_tree !== scope.snapshotTree) return "foreign";
    if (typeof scope.materialRevision === "string" && attempt.material_revision !== scope.materialRevision) return "foreign";
    const actualSubjectHash = attemptSubjectHash(attempt);
    if (actualSubjectHash !== null && actualSubjectHash !== scope.subjectSha256) return "foreign";
    if (actualSubjectHash === null && scope.subjectSha256 !== reviewSubjectHash(null)) return "unknown";
    if ((attempt.phase_id ?? null) !== scope.phaseId) return "foreign";
    return "current";
  };
  const entries = refs.map((ref) => {
    let parsedAttempt = null;
    try {
    const raw = task.readRecord(ref);
    const attempt = JSON.parse(raw);
    parsedAttempt = attempt;
    if (attempt.task_id !== task.identity.taskId || typeof attempt.attempt_id !== "string"
        || ref !== `quality/reviews/attempts/${attempt.attempt_id}/attempt.json`
        || !MATERIAL_REVISION.test(attempt.material_revision ?? "") || !GIT_OID.test(attempt.snapshot_tree ?? "")
        || !["semantic", "failed", "unavailable"].includes(attempt.terminal_status)) throw new Error("canonical review attempt identity is invalid");
    const report = task.readRecord(attempt.report_ref);
    const saved = JSON.parse(report.match(/## Public result and coverage\n\n```json\n([\s\S]*?)\n```/)?.[1] ?? "null");
    if (!saved?.public_result) return readLegacyReviewAttempt(task, ref, raw, attempt, report);
    const identity = { tree: attempt.snapshot_tree, materialRevision: attempt.material_revision, source: attempt.source };
    const context = saved.budget_context ?? null;
    const prepared = prepareSimpleReviewRecord(task, saved.public_result, identity, attempt.request_key ?? null,
      { paired: Boolean(attempt.pair_id), legacyReviewContext: context, executionContext: saved.execution_context ?? null,
        allowHistoricalPreDispatchMaterialFailure: true,
        allowHistoricalPartialCoverage: scope !== null && attempt.snapshot_tree !== scope.snapshotTree,
        closureManifest: attempt.closure_manifest ?? null });
    if (prepared.refs.attempt_ref !== ref || prepared.refs.report_ref !== attempt.report_ref
        || prepared.semantic_status !== saved.semantic_status || prepared.coverage !== saved.coverage) throw new Error("canonical review report binding is invalid");
    for (const [recordRef, expected] of prepared.records) {
      if (!matchesReviewRecord(task.readRecord(recordRef), expected)) throw new Error("canonical review evidence is incomplete or changed");
    }
    if (attempt.dispatch_state === "blocked_before_dispatch" && attempt.provider_attempts.length !== 0) throw new Error("blocked review contains provider attempts");
    return { attempt, saved, prepared, identity, fact: {
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
    } catch (error) {
      // A damaged record from another stage in the same task is historical
      // noise and must not block this request. A damaged record in the
      // requested namespace remains a canonical integrity failure.
      const classification = classifyScope(parsedAttempt);
      if (classification === "foreign") return null;
      if (classification === "current") error.review_attempt_ref = ref;
      throw error;
    }
  }).filter(Boolean);
  const byRef = new Map(entries.map((entry) => [entry.fact.attempt_ref, entry]));
  const seenPairs = new Set();
  return entries.filter((entry) => {
    // A foreign pair can have one member omitted above after its old report
    // fails reconstruction under the current snapshot's rules. Do not let
    // that unrelated pair block this request; current pairs remain strict.
    if (entry.attempt.pair_id && classifyScope(entry.attempt) === "foreign") return false;
    try {
    if (!entry.attempt.pair_id) return true;
    const attempt = entry.attempt;
    const pairRef = pairedReportRef(attempt.stage, task.identity.taskId, entry.identity, attempt.pair_id, attempt.request_key ?? null);
    if (seenPairs.has(pairRef)) return false;
    const report = task.readRecord(pairRef);
    const summary = JSON.parse(report.match(/```json\n([\s\S]*?)\n```/)?.[1] ?? "null");
    if (!summary || summary.pair_id !== attempt.pair_id || summary.report_ref !== pairRef
        || Object.keys(summary.role_results ?? {}).sort().join(",") !== "blue,red") throw new Error("canonical review pair is incomplete");
    const members = ["red", "blue"].map((role) => {
      const roleRefs = summary.role_results[role];
      const member = byRef.get(roleRefs?.attempt_ref);
      if (!member || member.attempt.role !== role || member.attempt.pair_id !== attempt.pair_id
          || member.attempt.stage !== attempt.stage || member.attempt.request_key !== attempt.request_key
          || member.attempt.material_id !== attempt.material_id || member.attempt.material_revision !== attempt.material_revision
          || member.attempt.snapshot_tree !== attempt.snapshot_tree
          || canonicalJson(member.saved.budget_context ?? null) !== canonicalJson(entry.saved.budget_context ?? null)
          || canonicalJson(roleRefs) !== canonicalJson({ ...member.prepared.refs,
            semantic_status: member.prepared.semantic_status, coverage: member.prepared.coverage })) throw new Error("canonical review pair member binding is invalid");
      return member;
    });
    const semanticStatus = members.some((member) => member.prepared.semantic_status === "available") ? "available" : "unavailable";
    const partial = members.some((member) => member.prepared.coverage !== "satisfied"
      || member.saved.public_result.provider_results.some((item) => item.status !== "completed" || item.error !== null));
    if (summary.status !== "recorded" || summary.semantic_status !== semanticStatus || summary.partial !== partial) throw new Error("canonical review pair summary is invalid");
    entry.pairSummary = summary;
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
 *
 * `resolveRouteIdentity` defaults to the runtime resolver, which needs the
 * host's trusted route dependencies. Pass them as `routeDependencies`
 * (`loadConfig`, `resolveRoute`, `selectProviders`) when using the default;
 * without them the request fails closed with
 * `REVIEW_ROUTE_DEPENDENCIES_REQUIRED`. The host composition root may instead
 * inject a production-backed resolver directly.
 */
export function bindBuildPlanReviewCohort(request, taskManifest) {
  if (request?.stage !== "build-plan") return request;
  const authenticatedCohort = taskManifest?.activation_cohort ?? "pre";
  for (const key of ["activation_cohort", "activationCohort"]) {
    if (request[key] !== undefined && request[key] !== authenticatedCohort) {
      throw new TypeError(`build-plan review ${key} differs from authenticated task cohort`);
    }
  }
  return { ...request, activation_cohort: authenticatedCohort };
}

export async function recordSimpleReviewRequest({ task, kernel, request, runRound, materialIdForRequest = null,
  resolveRouteIdentity = resolveReviewRouteIdentity, routeDependencies = null,
  reviewRoundTimeoutMs = DEFAULT_REVIEW_ROUND_TIMEOUT_MS, signal = null } = {}) {
  const taskHandle = assertTaskHandle(task);
  if (!request || typeof request !== "object" || Array.isArray(request)) throw new TypeError("review request must be an object");
  if (Object.hasOwn(request, "result")) throw new TypeError("review request cannot contain a result field");
  rejectBuildPrdCanonicalPersistence(request, "review request");
  request = normalizeReviewIdentity(request, "review request");
  request = bindBuildPlanReviewCohort(request, taskHandle.manifest);
  for (const field of ["snapshot_tree", "material_revision", "task_id", "task_path", "project_name"]) {
    if (Object.hasOwn(request, field)) throw new TypeError(`review request identity field is host-owned: ${field}`);
  }
  if (typeof request.stage !== "string" || request.stage.trim() === "") throw new TypeError("review request stage is required");
  if (typeof runRound !== "function") throw new TypeError("runRound must be a function");
  if (reviewRoundTimeoutMs !== null && (!Number.isSafeInteger(reviewRoundTimeoutMs) || reviewRoundTimeoutMs < 0)) {
    throw new TypeError("reviewRoundTimeoutMs must be null or a non-negative safe integer");
  }
  signal = assertReviewAbortSignal(signal);
  if (["e2e_binding", "confirmation", "confirmation_ref", "user_confirmation"].some((key) => Object.hasOwn(request, key))) throw new TypeError("execution review binding and future confirmation are host-owned");
  const before = assertAuthenticatedReviewIdentity(taskHandle, kernel);
  let executionContext = null;
  let executionPreparationFailure = null;
  try {
    const executionPrepared = prepareExecutionReviewRequest(taskHandle, request, before, materialIdForRequest);
    request = executionPrepared.request;
    executionContext = executionPrepared.executionContext;
  } catch (error) {
    // A reviewed-execution projection is pre-dispatch work, but its failure is
    // still a review fact. Keep the original request so the normal locked
    // recorder can publish one canonical unavailable attempt rather than
    // throwing after a route has been accepted with no original record.
    executionPreparationFailure = executionPreparationError(error);
  }
  const retryRequest = retryDecision(request);
  let materialId;
  let materialPreparationError = null;
  try {
    materialId = reviewRequestMaterialId(request, materialIdForRequest);
  } catch (error) {
    materialPreparationError = error;
    // The provider cannot be called without its authenticated material id, but
    // the failed preflight itself must still become an immutable attempt.
    materialId = textHash(canonicalJson({ request, material_preparation: "failed" }));
  }
  const authenticatedMaterialId = executionPreparationFailure === null && materialPreparationError === null && (typeof materialIdForRequest === "function"
    || (request.materials && typeof request.materials === "object" && !Array.isArray(request.materials))
    ? materialId : null);
  // Serialize concurrent reads and writes for the same authenticated task.
  const lockRef = "quality/reviews/request-locks/current-request.lock";
  const operation = async () => {
    let lockedIdentity;
    try { lockedIdentity = assertAuthenticatedReviewIdentity(taskHandle, kernel); }
    catch (error) {
      const requestKey = requestLockHash(request, materialId, "unavailable");
      return recordUnavailableRequest({
        task: taskHandle, kernel, request, identity: before, materialId, requestKey,
        closureManifest: reviewClosure(request, before, materialId, requestKey, null), executionContext,
        error: { code: error?.code ?? "REVIEW_SOURCE_UNAVAILABLE", message: error?.message ?? "current review source is unavailable" },
      });
    }
    let requestKey = requestLockHash(request, materialId, "unavailable");
    let closure = reviewClosure(request, lockedIdentity, materialId, requestKey, null);
    if (!sameAuthenticatedReviewIdentity(before, lockedIdentity)) {
      return recordUnavailableRequest({
        task: taskHandle, kernel, request, identity: lockedIdentity, materialId, requestKey, closureManifest: closure, executionContext,
        error: { code: "REVIEW_SOURCE_DRIFT", message: "review source changed before the review lock was acquired" },
      });
    }
    if (retryRequest.invalid) {
      return recordUnavailableRequest({
        task: taskHandle, kernel, request, identity: lockedIdentity, materialId, requestKey, closureManifest: closure, executionContext,
        error: { code: "REVIEW_RETRY_INVALID", message: retryRequest.error },
        retry: { requested: true, admitted: false },
      });
    }
    // Resolve the trusted route again while the task lock is held. Route
    // resolution is allowed to observe configuration/provider state, and a
    // source edit during that await must be caught before any provider call.
    let routeState;
    if (executionPreparationFailure !== null || materialPreparationError !== null) {
      routeState = Object.freeze({ routeIdentity: null, routeError: reviewRequestError(executionPreparationFailure ?? materialPreparationError) });
    } else {
      try {
        routeState = await awaitReviewOperation(resolveReviewRouteState({
          request, executionContext, resolveRouteIdentity, routeDependencies,
        }), reviewRoundTimeoutMs, "REVIEW_ROUTE_RESOLUTION_TIMEOUT", `review route resolution exceeded ${reviewRoundTimeoutMs} ms`, signal);
      } catch (error) {
        routeState = Object.freeze({ routeIdentity: null, routeError: reviewRequestError(error) });
      }
    }
    const routeIdentity = routeState.routeIdentity;
    const routeError = routeState.routeError;
    let preDispatchIdentity;
    try { preDispatchIdentity = assertAuthenticatedReviewIdentity(taskHandle, kernel); }
    catch (error) {
      return recordUnavailableRequest({
        task: taskHandle, kernel, request, identity: lockedIdentity, materialId, requestKey, closureManifest: closure, executionContext,
        error: { code: error?.code ?? "REVIEW_SOURCE_UNAVAILABLE", message: error?.message ?? "current review source is unavailable" },
      });
    }
    if (!sameAuthenticatedReviewIdentity(lockedIdentity, preDispatchIdentity)) {
      lockedIdentity = preDispatchIdentity;
      requestKey = requestLockHash(request, materialId, routeIdentity ?? "unavailable");
      closure = reviewClosure(request, lockedIdentity, materialId, requestKey, routeIdentity ?? null);
      return recordUnavailableRequest({
        task: taskHandle, kernel, request, identity: lockedIdentity, materialId, requestKey, closureManifest: closure, executionContext,
        error: { code: "REVIEW_SOURCE_DRIFT", message: "review source changed while resolving the trusted review route" },
      });
    }
    lockedIdentity = preDispatchIdentity;
    requestKey = requestLockHash(request, materialId, routeIdentity ?? "unavailable");
    closure = reviewClosure(request, lockedIdentity, materialId, requestKey, routeIdentity ?? null);
    let history;
    try {
      history = readCanonicalReviewHistory(taskHandle, {
        stage: request.stage,
        snapshotTree: lockedIdentity.tree,
        materialRevision: lockedIdentity.materialRevision,
        phaseId: request.phase_id ?? null,
        reviewTrack: request.review_track ?? request.reviewTrack ?? null,
        reviewKind: request.review_kind ?? request.reviewKind ?? null,
        subjectKind: request.subject_kind ?? "worktree",
        reviewScope: request.review_scope ?? request.reviewScope ?? (request.stage === "build-code" ? "integration" : null),
        subjectSha256: reviewSubjectHash(request.subject),
      });
    }
    catch (error) {
      if (error.review_attempt_ref) {
        let damaged;
        try { damaged = JSON.parse(taskHandle.readRecord(error.review_attempt_ref)); } catch { /* unavailable history stays unknown */ }
        if (damaged?.stage === request.stage && damaged?.snapshot_tree === lockedIdentity.tree
            && damaged?.material_revision === lockedIdentity.materialRevision
            && (damaged?.review_track ?? null) === (request.review_track ?? request.reviewTrack ?? null)
            && (damaged?.review_kind ?? null) === (request.review_kind ?? request.reviewKind ?? null)
            && (damaged?.subject_kind ?? "worktree") === (request.subject_kind ?? "worktree")
            && (damaged?.phase_id ?? null) === (request.phase_id ?? null)
            && (damaged?.review_scope ?? (damaged?.stage === "build-code" ? "integration" : null)) === (request.review_scope ?? request.reviewScope ?? (request.stage === "build-code" ? "integration" : null))
            && subjectMatchesAttempt(damaged, request.subject)) {
          error.code = "REVIEW_RECORD_INCOMPLETE";
          error.attempt_ref = error.review_attempt_ref;
          throw error;
        }
      }
      return recordUnavailableRequest({
        task: taskHandle, kernel, request, identity: lockedIdentity, materialId, requestKey, closureManifest: closure, executionContext,
        error: { code: "REVIEW_HISTORY_UNAVAILABLE", message: `canonical review history is unavailable: ${error.message}` },
      });
    }
    const retry = authenticateRetryDecision(retryRequest, {
      history, request, materialId, routeIdentity: routeIdentity ?? null, requestKey,
    });
    const reusable = findReusableReview({ history, request, routeIdentity: routeIdentity ?? null, snapshotTree: lockedIdentity.tree, requestKey, retry, materialId });
    const retryResult = retry.requested ? {
      requested: true,
      admitted: retry.admitted,
      ...(retry.basis === null ? {} : { basis: retry.basis }),
      ...(retry.admitted ? {} : { explanation: "no accepted material/provider/source-change basis; retry declined" }),
    } : null;
    if (retry.requested && !retry.admitted) {
      return recordUnavailableRequest({
        task: taskHandle, kernel, request, identity: lockedIdentity, materialId, requestKey, closureManifest: closure, executionContext,
        error: {
          code: "REVIEW_RETRY_NOT_ADMITTED",
          message: "explicit review retry has no authenticated material, provider, or recovered-source change basis",
        },
        retry: retryResult,
      });
    }
    if (reusable) {
      // Reuse is a read-only fast path, but it still crosses the same
      // authenticated worktree boundary as dispatch. The route resolver and
      // history scan may yield to a caller that edits the current Workspace;
      // never return a result bound to the earlier `before` identity after
      // that source has changed.
      let current;
      try { current = assertAuthenticatedReviewIdentity(taskHandle, kernel); }
      catch (error) {
        return recordUnavailableRequest({
          task: taskHandle, kernel, request, identity: lockedIdentity, materialId, requestKey, closureManifest: closure, executionContext,
          error: { code: error?.code ?? "REVIEW_SOURCE_UNAVAILABLE", message: error?.message ?? "current review source is unavailable" },
          retry: retryResult,
        });
      }
      if (!closureMatches(closure, current, materialId, request)) {
        return recordUnavailableRequest({
          task: taskHandle, kernel, request, identity: current, materialId, requestKey,
          closureManifest: reviewClosure(request, current, materialId, requestKey, routeIdentity ?? null), executionContext,
          error: { code: "REVIEW_SOURCE_DRIFT", message: "review source changed before reusing the recorded result" },
          retry: retryResult,
        });
      }
      return {
        status: "recorded", reused: true, dispatch_state: "reused", ...reusable,
        ...(retryResult ? { retry: retryResult } : {}),
      };
    }
    // A current-session reviewed_execution already authenticates this exact
    // snapshot and its acceptance source. Historical verify reviews must not
    // turn that first current OCR dispatch into a legacy judged retry.
    if (executionContext === null && hasPriorVerifySnapshot(request, history, lockedIdentity.tree) && !retry.admitted) {
      return recordUnavailableRequest({
        task: taskHandle, kernel, request, identity: lockedIdentity, materialId, requestKey, closureManifest: closure, executionContext,
        error: {
          code: "REVIEW_CURRENT_SNAPSHOT_RETRY_REQUIRED",
          message: "verify-code review belongs to an older code snapshot; an explicit judged retry is required",
        },
        retry: retryResult,
      });
    }
    const dispatchRequest = { ...request };
    delete dispatchRequest.retry;
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
      } else {
        const dispatch = createReviewDispatchSignal(signal);
        let settled = null;
        try {
          if (dispatch.signal.aborted) throw reviewCancelledError(dispatch.signal);
          const round = Promise.resolve(runRound(structuredClone(dispatchRequest), { signal: dispatch.signal }));
          // Handle both outcomes so a non-cooperating runner that settles
          // after the timeout cannot produce an unhandled rejection.
          settled = round.then(() => undefined, () => undefined);
          // Managed 3rd-review is observed through broker status/health and has
          // no elapsed-time cutoff: keep polling until a real terminal state or
          // explicit caller cancellation. Generic/injected runners retain the
          // separate bounded recorder behavior below.
          result = await awaitReviewOperation(
            round,
            reviewRoundTimeoutMs,
            "REVIEW_EXECUTION_TIMEOUT",
            `review round exceeded ${reviewRoundTimeoutMs} ms`,
            signal,
            (error) => dispatch.abort(error),
          );
        } catch (error) {
          if (settled !== null && (error?.code === "REVIEW_EXECUTION_TIMEOUT" || error?.code === "REVIEW_CANCELLED")) {
            try {
              await awaitReviewOperation(
                settled,
                REVIEW_DISPATCH_CLEANUP_TIMEOUT_MS,
                "REVIEW_DISPATCH_CLEANUP_TIMEOUT",
                `review dispatch did not settle within ${REVIEW_DISPATCH_CLEANUP_TIMEOUT_MS} ms after cancellation`,
              );
            } catch (cleanupError) {
              if (cleanupError?.code === "REVIEW_DISPATCH_CLEANUP_TIMEOUT") {
                // Preserve the actual terminal cause (timeout/cancellation),
                // but make the unacknowledged cleanup explicit. The immutable
                // sent_unparsed attempt will be reused for this exact material
                // so a second request cannot race the old dispatch.
                error.dispatch_state = "sent_unparsed";
                throw error;
              }
              throw cleanupError;
            }
          }
          throw error;
        } finally {
          dispatch.dispose();
        }
      }
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
        ...(error?.dispatch_state === "sent_unparsed" ? { dispatch_state: "sent_unparsed" } : {}),
      };
    }
    let closureCurrent = false;
    let recordIdentity = lockedIdentity;
    try {
      if (!result || typeof result !== "object" || Array.isArray(result)) throw new TypeError("review runner must return a result object");
      const normalizedResult = normalizeCanonicalReviewResult(result, "review request result");
      if (normalizedResult.stage !== request.stage
          || (normalizedResult.review_track ?? null) !== (request.review_track ?? request.reviewTrack ?? null)
          || (normalizedResult.review_kind ?? null) !== (request.review_kind ?? request.reviewKind ?? null)) {
        throw new TypeError("review result stage/track/kind does not match its request");
      }
      result = normalizedResult;
      result = mergeRequestResultIdentity(request, result);
      result = normalizeCanonicalReviewResult(result, "review request result");
      const after = assertAuthenticatedReviewIdentity(taskHandle, kernel);
      closureCurrent = closureMatches(closure, after, materialId, request);
      if (!closureCurrent) {
        result = {
          ...result,
          status: "unavailable",
          outcome: "unavailable",
          dispatch_state: ["blocked_before_dispatch", "sent_unparsed"].includes(result.dispatch_state) ? result.dispatch_state : "dispatched",
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
      recordIdentity = closureCurrent ? after : lockedIdentity;
    } catch (error) {
      result = unavailableAfterDispatch({ request, result, materialId, error });
      closureCurrent = false;
      recordIdentity = lockedIdentity;
    }
    const refs = recordSimpleReviewResult({ task: taskHandle, result, kernel, requestKey,
      executionContext, closureManifest: closure, identityOverride: closureCurrent ? null : recordIdentity });
    return {
      status: "recorded",
      reused: false,
      dispatch_state: ["blocked_before_dispatch", "sent_unparsed"].includes(result.dispatch_state) ? result.dispatch_state : "dispatched",
      ...refs,
      ...(retryResult ? { retry: retryResult } : {}),
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

function prepareSimpleReviewRecord(task, result, identity, requestKey, {
  paired = false,
  legacyReviewContext = null,
  executionContext = null,
  allowHistoricalPreDispatchMaterialFailure = false,
  allowHistoricalPartialCoverage = false,
  closureManifest = null,
} = {}) {
  rejectBuildPrdCanonicalPersistence(result, "review result");
  const context = authenticateHistoricalReviewContext(legacyReviewContext, identity, requestKey, result);
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
    // Any non-semantic member is a transport fact. Providers can report a
    // completed lifecycle with a broker error (for example an invalid finding
    // anchor), so keying this exception only on the canonical failed/cancelled
    // labels would reject a real unavailable result before it is recorded.
    if (semantic) {
      if (!id || id.provider !== item.provider || id.adapter !== providerAdapter(item.provider)
          || typeof id.source_id !== "string" || !id.source_id.trim()
          || typeof id.config_id !== "string" || !id.config_id.trim()) throw new TypeError(`review provider source identity is missing or invalid: ${item.provider}`);
    }
    if (selection) {
      const expected = selection.provider_identities?.[item.provider];
      if (!Array.isArray(selection.providers) || !selection.providers.includes(item.provider) || !expected) throw new TypeError(`review role provider selection identity is missing: ${item.provider}`);
      for (const field of ["provider", "adapter", "source_id", "config_id", "model"]) {
        if (semantic && expected[field] !== undefined && id?.[field] !== expected[field]) throw new TypeError(`review provider source identity ${field} mismatch: ${item.provider}`);
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
  if (!Array.isArray(result.findings)) throw new TypeError("review findings must be an array");
  if (result.findings.some((finding) => !completed.some((item) => item.provider === finding.provider))) throw new TypeError("review finding provider has no completed semantic output");
  const e2eBinding = executionBindingForResult(task, result, identity, executionContext, { allowHistoricalPreDispatchMaterialFailure });
  const taskId = task.identity.taskId, stage = result.stage;
  const attemptId = stableReviewId([taskId, identity, requestKey, result, ...(context ? [context] : []), ...(executionContext ? [executionContext] : []), ...(closureManifest ? [closureManifest] : [])]);
  const attemptRef = `quality/reviews/attempts/${attemptId}/attempt.json`;
  const resultRef = `quality/reviews/results/${stage}-simple-${attemptId}.json`;
  const reportRef = reviewReportRef(stage, attemptId);
  const records = [];
  const outputRefs = new Map();
  const outputs = completed.map((item, index) => {
    const findings = result.findings.filter((finding) => finding.provider === item.provider);
    if (!Array.isArray(item.evidence_anchor_valid) || item.evidence_anchor_valid.length !== findings.length || item.evidence_anchor_valid.some((entry) => typeof entry !== "boolean")) throw new TypeError(`review result provider_results[${index}].evidence_anchor_valid must match provider findings`);
    const discardedFacts = Array.isArray(item.discarded_facts) ? item.discarded_facts : [];
    const content = JSON.stringify({
      findings: findings.map(({ provider, ...rest }) => rest),
      ...(discardedFacts.length > 0 ? { discarded_facts: discardedFacts } : {}),
    });
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
  const allIdentified = completed.every((item) => item.identity?.provider === item.provider
    && item.identity?.adapter === providerAdapter(item.provider) && typeof item.identity?.source_id === "string" && item.identity.source_id.trim()
    && typeof item.identity?.config_id === "string" && item.identity.config_id.trim());
  // A quorum of completed members is not enough while another dispatched
  // member is still running. Keep the transport/progress fact, but do not
  // publish a canonical semantic result until the whole round is terminal.
  const hasRunningProvider = result.provider_results.some((item) => item.status === "running");
  // A partial producer result must carry the quorum it claims to have met.
  // The policy helper defaults missing minimum_heterologous to one for legacy
  // parsing, but that fallback is not an attestation of partial coverage.
  // Historical readback may explicitly opt into the old projection after the
  // current snapshot changed; a live result may not silently do so.
  const hasDeclaredQuorum = Number.isSafeInteger(result.minimum_heterologous) && result.minimum_heterologous >= 1;
  const covered = result.status !== "unavailable"
    && (result.outcome === "completed" || (result.outcome === "partial" && (hasDeclaredQuorum || allowHistoricalPartialCoverage)))
    && !hasRunningProvider
    && aggregation.status === "available"
    && allIdentified;
  // A failed OCR independence quorum does not erase completed members. Keep
  // their canonical findings, but leave the attempt unavailable and the
  // coverage incomplete so stage/quality consumers cannot treat it as clean.
  const partial = !covered && result.status === "unavailable" && result.outcome === "failed"
    && ["build-code", "verify-code"].includes(stage)
    && (result.review_kind ?? null) === null && (result.review_track ?? null) === null
    && result.error?.code === "OCR_INDEPENDENCE_INCOMPLETE" && hasDeclaredQuorum
    && !hasRunningProvider && aggregation.status === "unavailable"
    && aggregation.valid.length > 0 && allIdentified
    && !["blocked_before_dispatch", "sent_unparsed"].includes(result.dispatch_state);
  const published = covered || partial;
  const semanticStatus = partial ? "partial" : result.status !== "unavailable" && completed.length ? "available" : "unavailable";
  const hostDiscardedFacts = Array.isArray(result.discarded_facts) ? result.discarded_facts : [];
  const phaseId = result.phase_id ?? null;
  const expectedReviewScope = stage === "build-code"
    ? (phaseId === null ? "integration" : "phase")
    : null;
  const suppliedReviewScope = Object.hasOwn(result, "review_scope") ? result.review_scope : undefined;
  if (phaseId !== null && suppliedReviewScope !== undefined && suppliedReviewScope !== expectedReviewScope) {
    throw new TypeError("review result review_scope does not match phase_id");
  }
  const sharedTuple = assertSharedReviewTuple(stage, {
    subject_kind: result.subject_kind ?? "worktree",
    phase_id: phaseId,
    review_scope: expectedReviewScope,
  });
  const subject = {
    subject_kind: sharedTuple.subject_kind, phase_id: sharedTuple.phase_id,
    review_scope: sharedTuple.review_scope,
    ...(paired ? { pair_id: result.pair_id, role: result.role } : {}),
  };
  const binding = {
    task_id: taskId, stage, review_track: result.review_track ?? null, review_kind: result.review_kind ?? null,
    ...subject, base_tree: identity.tree, candidate_tree: identity.tree, source: identity.source,
    snapshot_tree: identity.tree, material_id: result.material_id,
    ...(evidenceHash === null ? {} : { authenticated_evidence_sha256: evidenceHash }),
    material_revision: identity.materialRevision,
    ...(published ? { result_ref: resultRef } : {}),
    ...(e2eBinding ? { e2e_binding: e2eBinding } : {}),
  };
  const attempt = {
    version: "wh-review-attempt.v1", attempt_id: attemptId, ...binding,
    ...(hostDiscardedFacts.length > 0 ? { discarded_facts: hostDiscardedFacts } : {}),
    ...(requestKey ? { request_key: requestKey } : {}),
    ...(closureManifest ? { closure_manifest: closureManifest } : {}),
    ...(partial ? { coverage: { mode: result.provider_results.length > 1 ? "parallel_external" : "single_external",
      selected_profiles: result.provider_results.map((item) => item.provider), selected_count: result.provider_results.length,
      valid_provider_count: aggregation.valid.length, minimum_required: policy.policy.minimum_heterologous,
      group_outcome: "partial" } } : {}),
    provider_attempts: result.provider_results.map((item) => providerAttemptRecord(item, result.runtime_id, outputRefs.get(item.provider) ?? null)),
    terminal_status: covered ? "semantic" : "unavailable",
    dispatch_state: ["blocked_before_dispatch", "sent_unparsed"].includes(result.dispatch_state) ? result.dispatch_state : "dispatched",
    error: covered ? null : recordError(result.error, { code: completed.length ? "REVIEW_QUORUM_INCOMPLETE" : "REVIEW_ALL_PROVIDERS_FAILED", message: completed.length ? "semantic member outputs retained; independent review coverage is incomplete" : "all provider results failed" }),
    ...(!noDispatch ? { review_policy: policy.policy, policy_snapshot_hash: policy.policy_snapshot_hash } : {}), report_ref: reportRef,
  };
  const canonical = published ? {
    version: "wh-review-result.v1", ...binding, attempt_ref: attemptRef,
    ...(hostDiscardedFacts.length > 0 ? { discarded_facts: hostDiscardedFacts } : {}),
    provider_results: aggregation.valid.map((item) => ({ provider: item.provider, output: item.review })),
    findings: aggregation.findings.map((finding) => ({ provider: finding.providers[0], ...finding })),
    adjudication: { version: aggregation.adjudication.version, clusters: aggregation.adjudication.clusters }, report_ref: reportRef,
  } : null;
  if (canonical) authenticateCanonicalReviewResult({
    attempt, result: canonical,
    providerOutputs: outputs.map((item) => ({ ref: outputRefs.get(item.provider), provider: item.provider, review: item.review, evidenceAnchors: item.evidenceAnchors })),
    allowPartial: partial,
  });
  const refs = { attempt_ref: attemptRef, result_ref: published ? resultRef : null, report_ref: reportRef };
  records.push([attemptRef, JSON.stringify(attempt)]);
  if (canonical) records.push([resultRef, JSON.stringify(canonical)]);
  records.push([reportRef, reviewReportBody({ attempt, result: canonical, requestKey }) + "\n## Public result and coverage\n\n```json\n" + JSON.stringify({ semantic_status: semanticStatus, coverage: covered ? "satisfied" : "incomplete", public_result: result, ...(context ? { budget_context: context } : {}), ...(executionContext ? { execution_context: executionContext } : {}) }, null, 2) + "\n```\n"]);
  return { records, refs, semantic_status: semanticStatus, coverage: covered ? "satisfied" : "incomplete" };
}

function importFailure(error) {
  const message = String(error?.message ?? error ?? "result-only review provenance is unavailable")
    .replace(/(?:\/(?:Users|home|private|tmp|var|etc|opt|mnt|Volumes|root|usr|bin|sbin|dev|proc|sys|Library)\/[^\s"'`<>()[\]{}]+|[A-Za-z]:[\\/][^\s"'`<>()[\]{}]+)/g, "<host-path-redacted>");
  return Object.freeze({
    status: "unavailable",
    imported: false,
    authoritative: false,
    reused: false,
    attempt_ref: null,
    result_ref: null,
    report_ref: null,
    reason: Object.freeze({ code: "REVIEW_IMPORT_UNAUTHENTICATED", message }),
  });
}

function importRawHash(value, label, { nullable = false } = {}) {
  if (nullable && value === null) return null;
  if (typeof value !== "string" || !SHA256_HEX.test(value)) throw new TypeError(`${label} must be a sha256 hex string${nullable ? " or null" : ""}`);
  return value;
}

function importScalar(provenance, field, { nullable = false } = {}) {
  if (!Object.hasOwn(provenance, field)) throw new TypeError(`result-only provenance is missing ${field}`);
  const value = provenance[field];
  if (nullable && value === null) return null;
  if (typeof value !== "string" || value.trim() === "") throw new TypeError(`result-only provenance ${field} is invalid`);
  return value;
}

function importIdentityValue(record, field) {
  if (field === "phase_id") return record.phase_id ?? null;
  if (field === "subject_kind") return record.subject_kind ?? "worktree";
  if (field === "review_scope") return record.review_scope ?? null;
  if (field === "review_track") return record.review_track ?? null;
  if (field === "review_kind") return record.review_kind ?? null;
  return record[field];
}

function importResultProjection(result, canonical) {
  if (!result || typeof result !== "object" || Array.isArray(result)) throw new TypeError("result-only review result must be an object");
  const identityFields = ["task_id", "stage", "review_track", "review_kind", "subject_kind", "phase_id", "review_scope", "snapshot_tree", "material_id", "material_revision", "attempt_ref", "report_ref"];
  for (const field of identityFields) {
    if (Object.hasOwn(result, field) && canonicalJson(result[field] ?? null) !== canonicalJson(canonical[field] ?? null)) {
      throw new TypeError(`result-only review result ${field} does not match the immutable result`);
    }
  }
  if (result.version === "wh-review-result.v1") return result;
  if (!Array.isArray(result.provider_results) || !Array.isArray(result.findings) || !result.adjudication) {
    throw new TypeError("result-only review result must carry the canonical semantic projection");
  }
  return {
    provider_results: result.provider_results.map((item) => {
      if (!item || typeof item !== "object" || typeof item.provider !== "string" || !item.output || typeof item.output !== "object") {
        throw new TypeError("result-only provider semantic projection is invalid");
      }
      return { provider: item.provider, output: item.output };
    }),
    findings: result.findings,
    adjudication: result.adjudication,
  };
}

function validateImportedReport(report, attempt, canonicalResult, requestKey) {
  if (typeof report !== "string" || report.trim() === "") throw new TypeError("result-only review report is empty");
  const requiredLines = [
    `task_id: ${attempt.task_id}`,
    `stage: ${attempt.stage}`,
    `attempt_id: ${attempt.attempt_id}`,
    `snapshot_tree: ${attempt.snapshot_tree}`,
    `material_id: ${attempt.material_id}`,
    ...(requestKey ? [`request_key: ${requestKey}`] : []),
  ];
  if (requiredLines.some((line) => !report.includes(line))) throw new TypeError("result-only review report provenance is incomplete");
  const match = report.match(/## Public result and coverage\n\n```json\n([\s\S]*?)\n```/);
  if (!match) throw new TypeError("result-only review report has no public result provenance");
  let saved;
  try { saved = JSON.parse(match[1]); } catch { throw new TypeError("result-only review report public result is invalid JSON"); }
  if (!saved?.public_result || typeof saved.public_result !== "object" || Array.isArray(saved.public_result)) {
    throw new TypeError("result-only review report public result is missing");
  }
  if (saved.public_result.stage !== attempt.stage || saved.public_result.material_id !== attempt.material_id) {
    throw new TypeError("result-only review report public result identity is invalid");
  }
  if (saved.coverage !== "satisfied" || saved.semantic_status !== "available") {
    throw new TypeError("result-only review report does not attest a semantic result");
  }
  if (canonicalResult.report_ref !== attempt.report_ref) throw new TypeError("result-only review report reference is inconsistent");
}

function validateImportedProviderOutputs(task, attempt, canonicalResult, providerOutputs) {
  if (!Array.isArray(providerOutputs) || providerOutputs.length !== attempt.provider_attempts.length) {
    throw new TypeError("result-only provenance must enumerate every provider attempt");
  }
  const byProvider = new Map();
  for (const entry of providerOutputs) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry) || typeof entry.provider !== "string") {
      throw new TypeError("result-only provider provenance entry is invalid");
    }
    if (byProvider.has(entry.provider)) throw new TypeError(`result-only provider provenance is duplicated: ${entry.provider}`);
    byProvider.set(entry.provider, entry);
  }
  const authenticatedOutputs = [];
  for (const member of attempt.provider_attempts) {
    const entry = byProvider.get(member.provider);
    if (!entry) throw new TypeError(`result-only provider provenance is missing: ${member.provider}`);
    for (const field of ["status", "identity", "output_ref", "output_sha256", "raw_output_ref", "raw_output_sha256"]) {
      if (!Object.hasOwn(entry, field)) throw new TypeError(`result-only provider provenance is missing ${member.provider}.${field}`);
    }
    if (entry.status !== member.status || canonicalJson(entry.identity ?? null) !== canonicalJson(member.identity ?? null)) {
      throw new TypeError(`result-only provider identity does not match the immutable attempt: ${member.provider}`);
    }
    const expectedRawRef = member.raw_output_ref ?? member.execution?.raw_output_ref ?? null;
    if (canonicalJson(entry.raw_output_ref ?? null) !== canonicalJson(expectedRawRef)) {
      throw new TypeError(`result-only provider raw output reference does not match: ${member.provider}`);
    }
    const expectedRawHash = expectedRawRef === null ? null : textHash(canonicalJson(expectedRawRef));
    if ((entry.raw_output_sha256 ?? null) !== expectedRawHash) {
      throw new TypeError(`result-only provider raw output hash does not match: ${member.provider}`);
    }
    if (member.status === "completed") {
      if (typeof member.output_ref !== "string" || !REVIEW_PROVIDER_OUTPUT_REF.test(member.output_ref)) throw new TypeError(`result-only provider output reference is invalid: ${member.provider}`);
      if (entry.output_ref !== member.output_ref) throw new TypeError(`result-only provider output reference does not match: ${member.provider}`);
      const outputRaw = task.readRecord(member.output_ref);
      if (importRawHash(entry.output_sha256, `${member.provider}.output_sha256`) !== textHash(outputRaw)) throw new TypeError(`result-only provider output hash does not match: ${member.provider}`);
      let output;
      try { output = JSON.parse(outputRaw); } catch { throw new TypeError(`result-only provider output is invalid JSON: ${member.provider}`); }
      if (output?.schema_version !== "wh-review-provider-output.v1"
          || output.task_id !== attempt.task_id || output.stage !== attempt.stage
          || output.attempt_id !== attempt.attempt_id || output.provider !== member.provider
          || typeof output.content !== "string" || output.content_hash !== textHash(output.content)
          || !Array.isArray(output.evidence_anchor_valid)
          || output.evidence_anchor_valid.some((value) => typeof value !== "boolean")) {
        throw new TypeError(`result-only provider output provenance is invalid: ${member.provider}`);
      }
      let review;
      try { review = JSON.parse(output.content); } catch { throw new TypeError(`result-only provider semantic output is invalid: ${member.provider}`); }
      const canonicalMember = canonicalResult.provider_results.find((item) => item.provider === member.provider);
      if (!canonicalMember || canonicalJson(canonicalMember.output) !== canonicalJson(review)) {
        throw new TypeError(`result-only provider semantic output does not match the result: ${member.provider}`);
      }
      authenticatedOutputs.push({ ref: member.output_ref, provider: member.provider, review, evidenceAnchors: output.evidence_anchor_valid });
    } else if (entry.output_ref !== null || entry.output_sha256 !== null || member.output_ref !== null) {
      throw new TypeError(`result-only failed provider must not carry a semantic output: ${member.provider}`);
    }
  }
  const completedProviders = attempt.provider_attempts.filter((member) => member.status === "completed").map((member) => member.provider).sort();
  const resultProviders = canonicalResult.provider_results.map((member) => member.provider).sort();
  if (canonicalJson(completedProviders) !== canonicalJson(resultProviders)) throw new TypeError("result-only result/provider provenance inventory is inconsistent");
  return authenticatedOutputs;
}

/**
 * Import an already-created canonical result without creating a new attempt or
 * treating caller-supplied result bytes as a writer.
 * Every accepted reference is re-read from the authenticated TaskHandle and
 * bound to the current task/snapshot/material identity.
 */
export function importCanonicalReviewResult({ task, kernel, result, provenance } = {}) {
  try {
    const handle = assertTaskHandle(task);
    const identity = assertAuthenticatedReviewIdentity(handle, kernel);
    if (!provenance || typeof provenance !== "object" || Array.isArray(provenance)) throw new TypeError("result-only review provenance is required");
    const attemptRef = importScalar(provenance, "attempt_ref");
    const resultRef = importScalar(provenance, "result_ref");
    const reportRef = importScalar(provenance, "report_ref");
    if (!REVIEW_ATTEMPT_REF.test(attemptRef) || !REVIEW_RESULT_REF.test(resultRef) || !REVIEW_REPORT_REF.test(reportRef)) throw new TypeError("result-only review provenance reference is invalid");
    const attemptHash = importRawHash(importScalar(provenance, "attempt_sha256"), "attempt_sha256");
    const resultHash = importRawHash(importScalar(provenance, "result_sha256"), "result_sha256");
    const reportHash = importRawHash(importScalar(provenance, "report_sha256"), "report_sha256");
    const requestKey = importRawHash(importScalar(provenance, "request_key"), "request_key");
    const listedAttempts = handle.listCanonicalReviewAttemptRefs();
    const listedResults = handle.listCanonicalReviewResultRefs();
    if (!listedAttempts.includes(attemptRef) || !listedResults.includes(resultRef)) throw new TypeError("result-only review reference is not a canonical record");
    const attemptRaw = handle.readRecord(attemptRef);
    const resultRaw = handle.readRecord(resultRef);
    const reportRaw = handle.readRecord(reportRef);
    if (textHash(attemptRaw) !== attemptHash || textHash(resultRaw) !== resultHash || textHash(reportRaw) !== reportHash) throw new TypeError("result-only review provenance hash mismatch");
    const attempt = JSON.parse(attemptRaw);
    const canonicalResult = JSON.parse(resultRaw);
    validateSchema("attempt", attempt);
    validateSchema("result", canonicalResult);
    const attemptId = REVIEW_ATTEMPT_REF.exec(attemptRef)?.[1];
    if (attempt.attempt_id !== attemptId || canonicalResult.attempt_ref !== attemptRef
        || attempt.report_ref !== reportRef || canonicalResult.report_ref !== reportRef
        || attempt.request_key !== requestKey || attempt.terminal_status !== "semantic" || attempt.error !== null) {
      throw new TypeError("result-only review attempt/result/report binding is invalid");
    }
    const identityFields = ["task_id", "stage", "review_track", "review_kind", "subject_kind", "phase_id", "review_scope", "base_tree", "candidate_tree", "material_id", "material_revision", "snapshot_tree"];
    for (const field of identityFields) {
      const expected = importScalar(provenance, field, { nullable: ["review_track", "review_kind", "phase_id", "review_scope"].includes(field) });
      const actual = importIdentityValue(attempt, field);
      if (canonicalJson(expected) !== canonicalJson(actual) || canonicalJson(importIdentityValue(canonicalResult, field)) !== canonicalJson(actual)) throw new TypeError(`result-only review identity mismatch: ${field}`);
    }
    if (provenance.source === undefined || canonicalJson(provenance.source) !== canonicalJson(attempt.source)
        || canonicalJson(attempt.source) !== canonicalJson(identity.source)
        || attempt.snapshot_tree !== identity.tree || attempt.material_revision !== identity.materialRevision) throw new TypeError("result-only review source or current identity mismatch");
    const evidenceHash = Object.hasOwn(attempt, "authenticated_evidence_sha256") ? (attempt.authenticated_evidence_sha256 ?? null) : null;
    if (!Object.hasOwn(provenance, "authenticated_evidence_sha256") || (provenance.authenticated_evidence_sha256 ?? null) !== evidenceHash
        || (canonicalResult.authenticated_evidence_sha256 ?? null) !== evidenceHash) throw new TypeError("result-only authenticated evidence identity mismatch");
    const routeIdentity = attempt.closure_manifest?.route_identity ?? null;
    if (!Object.hasOwn(provenance, "route_identity") || (provenance.route_identity ?? null) !== routeIdentity) throw new TypeError("result-only route identity is missing or mismatched");
    if (!Object.hasOwn(provenance, "policy_snapshot_hash") || (provenance.policy_snapshot_hash ?? null) !== (attempt.policy_snapshot_hash ?? null)) throw new TypeError("result-only policy identity is missing or mismatched");
    const authenticatedOutputs = validateImportedProviderOutputs(handle, attempt, canonicalResult, provenance.provider_outputs);
    authenticateCanonicalReviewResult({ attempt, result: canonicalResult, providerOutputs: authenticatedOutputs });
    validateImportedReport(reportRaw, attempt, canonicalResult, requestKey);
    const projection = importResultProjection(result, canonicalResult);
    const expectedProjection = result.version === "wh-review-result.v1"
      ? canonicalResult
      : { provider_results: canonicalResult.provider_results, findings: canonicalResult.findings, adjudication: canonicalResult.adjudication };
    if (canonicalJson(projection) !== canonicalJson(expectedProjection)) throw new TypeError("result-only supplied result does not match the immutable canonical result");
    return Object.freeze({ status: "recorded", imported: true, authoritative: true, reused: true,
      attempt_ref: attemptRef, result_ref: resultRef, report_ref: reportRef });
  } catch (error) {
    return importFailure(error);
  }
}

export function recordSimpleReviewResult({ task, result, kernel, requestKey = null, executionContext = null, closureManifest = null, identityOverride = null, expectedIdentity = null }) {
  result = normalizeCanonicalReviewResult(result, "review result");
  const handle = assertTaskHandle(task);
  if (executionContext !== null && !EXECUTION_CONTEXTS.has(executionContext)) throw new TypeError("execution binding requires the same authenticated public request");
  if (Object.hasOwn(result ?? {}, "e2e_binding")) throw new TypeError("result-only review cannot claim execution binding");
  const currentIdentity = assertAuthenticatedReviewIdentity(handle, kernel);
  if (expectedIdentity !== null && identityOverride !== null) {
    throw new TypeError("review publication cannot combine an expected identity with an identity override");
  }
  // DSH anchors were checked against this captured identity; never rebind them to a later tree.
  if (expectedIdentity !== null
      && canonicalJson({ tree: expectedIdentity.tree, source: expectedIdentity.source, materialRevision: expectedIdentity.materialRevision })
        !== canonicalJson({ tree: currentIdentity.tree, source: currentIdentity.source, materialRevision: currentIdentity.materialRevision })) {
    const error = new Error("REVIEW_SOURCE_CHANGED: reviewed source changed before the review could be published");
    error.code = "REVIEW_SOURCE_CHANGED";
    throw error;
  }
  const identity = identityOverride ?? expectedIdentity ?? currentIdentity;
  if (identityOverride !== null && (!closureManifest || closureManifest.snapshot_tree !== identity.tree
      || closureManifest.material_revision !== identity.materialRevision)) {
    throw new TypeError("historical review identity requires a matching closure manifest");
  }
  if (!result || !["available", "available-with-failures", "unavailable"].includes(result.status)) throw new TypeError("review result status is invalid");
  if (["source", "base_tree", "candidate_tree", "snapshot_tree", "material_revision"].some((key) => Object.hasOwn(result, key))) throw new TypeError("review result identity fields must come from the authenticated current context");
  if (!result?.role_results) {
    const prepared = prepareSimpleReviewRecord(handle, result, identity, requestKey, { executionContext, closureManifest });
    for (const [ref, raw] of prepared.records) createCanonicalRecord(handle, ref, raw, kernel);
    return prepared.refs;
  }
  if (typeof result.pair_id !== "string" || !result.pair_id.trim() || !SHA256_HEX.test(result.material_id ?? "")) throw new TypeError("paired review pair_id and material identity are required");
  if (!result.role_results || Array.isArray(result.role_results) || Object.keys(result.role_results).sort().join(",") !== "blue,red") throw new TypeError("paired review requires exactly red and blue roles");
  let members = {
    red: normalizeCanonicalReviewResult(result.role_results.red, "paired review red result"),
    blue: normalizeCanonicalReviewResult(result.role_results.blue, "paired review blue result"),
  };
  ({ result, members } = normalizePairedSharedIdentity(result, members));
  const prepared = {};
  for (const role of ["red", "blue"]) {
    const member = members[role];
    if (member?.role !== role || member.pair_id !== result.pair_id) throw new TypeError(`paired review ${role} role identity mismatch`);
    if (member.stage !== result.stage || (member.review_track ?? null) !== (result.review_track ?? null)
        || (member.review_kind ?? null) !== (result.review_kind ?? null)
        || (member.review_scope ?? null) !== (result.review_scope ?? null)
        || member.material_id !== result.material_id) throw new TypeError(`paired review ${role} material/stage identity mismatch`);
    prepared[role] = prepareSimpleReviewRecord(handle, { ...member,
      ...(result.subject_kind === undefined ? {} : { subject_kind: result.subject_kind }),
      ...(result.phase_id === undefined ? {} : { phase_id: result.phase_id }),
      ...(result.review_scope === undefined ? {} : { review_scope: result.review_scope }),
    }, identity, requestKey, { paired: true, executionContext, closureManifest });
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
  for (const entry of Object.values(prepared)) for (const [ref, raw] of entry.records) createCanonicalRecord(handle, ref, raw, kernel);
  createCanonicalRecord(handle, reportRef, "# Paired review\n\nrequest_key: " + (requestKey ?? "none") + "\n\n```json\n" + JSON.stringify(summary, null, 2) + "\n```\n", kernel);
  return summary;
}

const DSH_CODE_REVIEW_IDENTITY_FIELDS = new Set([
  "task_id", "task_path", "project_name", "stage", "review_track", "review_kind", "review_scope",
  "subject_kind", "phase_id", "source", "base_tree", "candidate_tree", "snapshot_tree",
  "material_revision", "material_id", "provider", "adapter", "source_id", "config_id",
  "runtime_id", "attempt_id", "identity", "reviewer", "actor",
]);
const DSH_CODE_REVIEW_FINDING_FIELDS = new Set([
  "severity", "path", "line", "issue", "root_cause", "recommendation", "evidence_kind", "evidence",
]);

function isConcreteRepoRelativeReviewPath(value) {
  return typeof value === "string" && value.trim() === value && value.length > 0
    && !value.startsWith("/") && !value.includes("\\") && !/[\x00-\x1f\x7f]/.test(value)
    && !/^[a-z][a-z\d+.-]*:/i.test(value)
    && value.split("/").every((segment) => segment !== "" && segment !== "." && segment !== "..");
}

function invalidDshReviewerOutput(message) {
  const error = new TypeError(`OUTPUT_INVALID: ${message}`);
  error.code = "OUTPUT_INVALID";
  throw error;
}

function readCandidateSnapshotFile(workspace, snapshotTree, repoPath) {
  const listed = runWorkspaceCommand(workspace, "git", [
    "ls-tree", "-r", "-z", "--full-tree", snapshotTree, "--", `:(literal)${repoPath}`,
  ]);
  if (listed.error || listed.status !== 0) {
    throw new Error(`DSH code-review candidate snapshot lookup failed: ${listed.error?.message ?? listed.stderr}`);
  }
  const entries = listed.stdout.split("\0").filter(Boolean);
  if (entries.length !== 1) return null;
  const separator = entries[0].indexOf("\t");
  if (separator < 0 || entries[0].slice(separator + 1) !== repoPath) return null;
  const [mode, type, objectId, ...extra] = entries[0].slice(0, separator).split(" ");
  // A snapshot symlink is a blob with mode 120000. Never follow it: only
  // regular Git files are valid review anchors.
  if (extra.length !== 0 || !["100644", "100755"].includes(mode) || type !== "blob" || !GIT_OID.test(objectId ?? "")) {
    return null;
  }
  const source = runWorkspaceCommand(workspace, "git", ["cat-file", "blob", objectId]);
  if (source.error || source.status !== 0) {
    throw new Error(`DSH code-review candidate snapshot content read failed: ${source.error?.message ?? source.stderr}`);
  }
  return source.stdout;
}

function candidateFileLines(content) {
  if (content === "") return [];
  const lines = content.split(/\r\n|\r|\n/);
  if (lines.at(-1) === "") lines.pop();
  return lines;
}

/**
 * Publish Architect-Code-Review findings through the existing canonical review
 * writer. The caller supplies only the review output and, for build-code, its
 * existing phase/integration tuple; task and current identity come from runtime.
 */
export function recordDshCodeReviewResult(input = {}) {
  if (!input || typeof input !== "object" || Array.isArray(input)
      || canonicalJson(Reflect.ownKeys(input).sort()) !== canonicalJson(["kernel", "result", "task"])
        && canonicalJson(Reflect.ownKeys(input).sort()) !== canonicalJson(["kernel", "result", "stage", "task"])
        && canonicalJson(Reflect.ownKeys(input).sort()) !== canonicalJson(["kernel", "phase_id", "result", "review_scope", "stage", "task"])) {
    throw new TypeError("Architect-Code-Review publication requires task, kernel, stage, result, and optional build-code phase identity");
  }
  const { task, kernel, result } = input;
  const stage = input.stage ?? "verify-code";
  const reviewScope = input.review_scope ?? null;
  const phaseId = input.phase_id ?? null;
  if (stage !== "verify-code" && stage !== "build-code") throw new TypeError("Architect-Code-Review stage must be build-code or verify-code");
  const subject = stage === "build-code"
    ? assertSharedReviewTuple(stage, {
      subject_kind: reviewScope === "phase" ? "phase" : "worktree",
      phase_id: phaseId,
      review_scope: reviewScope,
    }, "Architect-Code-Review")
    : assertSharedReviewTuple(stage, { subject_kind: "worktree", phase_id: null, review_scope: null }, "Architect-Code-Review");
  const handle = assertTaskHandle(task);
  const identity = assertAuthenticatedReviewIdentity(handle, kernel);
  if (!result || typeof result !== "object" || Array.isArray(result)
      || canonicalJson(Reflect.ownKeys(result).sort()) !== canonicalJson(["findings"])) {
    throw new TypeError("DSH code-review output must contain exactly findings");
  }
  if (!Array.isArray(result.findings)) throw new TypeError("DSH code-review findings must be an array");
  for (const [index, finding] of result.findings.entries()) {
    if (!finding || typeof finding !== "object" || Array.isArray(finding)) {
      throw new TypeError(`DSH code-review finding ${index} must be an object`);
    }
    const identityOverride = Reflect.ownKeys(finding).find((key) => DSH_CODE_REVIEW_IDENTITY_FIELDS.has(key));
    if (identityOverride !== undefined) throw new TypeError(`DSH code-review finding ${index} cannot override ${identityOverride}`);
    const undeclaredKey = Reflect.ownKeys(finding).find((key) => typeof key !== "string" || !DSH_CODE_REVIEW_FINDING_FIELDS.has(key));
    if (undeclaredKey !== undefined) {
      throw new TypeError(`DSH code-review finding ${index} has undeclared finding key ${typeof undeclaredKey === "string" ? undeclaredKey : "<symbol>"}`);
    }
  }
  const parsed = parseCanonicalReviewerOutput(JSON.stringify(result), { requireEvidence: true });
  if (parsed.discarded_facts?.length || parsed.findings.length !== result.findings.length) {
    throw new TypeError("DSH code-review output contains findings outside the canonical reviewer-output contract");
  }
  const workspace = openCurrentTaskWorkspace(handle);
  const evidenceAnchors = [];
  for (const [index, finding] of parsed.findings.entries()) {
    if (!isConcreteRepoRelativeReviewPath(finding.path)) {
      invalidDshReviewerOutput(`finding ${index} path must be a concrete repository-relative path`);
    }
    const source = readCandidateSnapshotFile(workspace, identity.tree, finding.path);
    if (source === null) {
      invalidDshReviewerOutput(`finding ${index} path must name a regular file in the current candidate snapshot`);
    }
    const hasLine = Number.isSafeInteger(finding.line);
    const hasEvidence = typeof finding.evidence === "string" && finding.evidence.trim() !== "";
    if (finding.severity === "minor" && !hasLine && !hasEvidence) {
      // The skill permits unanchored minor findings; preserve that as a false anchor fact.
      evidenceAnchors.push(false);
      continue;
    }
    if (!hasLine || finding.line <= 0) {
      invalidDshReviewerOutput(`finding ${index} requires a positive source line for its evidence anchor`);
    }
    if (!hasEvidence) {
      invalidDshReviewerOutput(`finding ${index} requires non-empty evidence for its source anchor`);
    }
    const lines = candidateFileLines(source);
    if (finding.line > lines.length) {
      invalidDshReviewerOutput(`finding ${index} line ${finding.line} is outside the current candidate file range 1-${lines.length}`);
    }
    if (finding.evidence.trim() !== lines[finding.line - 1].trim()) {
      invalidDshReviewerOutput(`finding ${index} evidence must exactly match its current candidate source line`);
    }
    evidenceAnchors.push(true);
  }
  const provider = "dsh-code-review";
  const materialIdentity = {
    findings: parsed.findings,
    material_revision: identity.materialRevision,
    snapshot_tree: identity.tree,
    task_id: handle.identity.taskId,
    ...(stage === "build-code" ? {
      phase_id: subject.phase_id,
      review_scope: subject.review_scope,
      stage,
    } : {}),
  };
  const materialId = createHash("sha256").update(canonicalJson(materialIdentity)).digest("hex");
  return recordSimpleReviewResult({
    task: handle,
    kernel,
    expectedIdentity: identity,
    result: {
      status: "available",
      stage,
      review_track: null,
      review_kind: null,
      subject_kind: subject.subject_kind,
      phase_id: subject.phase_id,
      review_scope: subject.review_scope,
      material_id: materialId,
      outcome: "completed",
      minimum_heterologous: 1,
      provider_results: [{
        provider,
        status: "completed",
        identity: { provider, adapter: "dsh", source_id: provider, config_id: "dsh-code-review/v1", model: null },
        error: null,
        timing: { started_at_ms: null, completed_at_ms: null, duration_ms: null },
        usage: null,
        evidence_anchor_valid: evidenceAnchors,
      }],
      findings: parsed.findings.map((finding) => ({ ...finding, provider })),
    },
  });
}

function taskBoundIdentity({ task, result, snapshot_tree: snapshotTree, material_revision: materialRevision }) {
  result = normalizeCanonicalReviewResult(result, "task-bound review result");
  const identity = reviewIdentityFromInput(result);
  const taskHandle = assertTaskHandle(task);
  if (!result || typeof result !== "object" || Array.isArray(result) || !new Set(["available", "unavailable"]).has(result.status)) throw new TypeError("task-bound review result is invalid");
  if (identity.stage !== "verify-code" || identity.reviewTrack !== null || identity.reviewKind !== null || identity.reviewScope !== null
      || !SHA256_HEX.test(result.material_id ?? "") || !Array.isArray(result.provider_results)) throw new TypeError("task-bound verify-code result identity is invalid");
  if (!GIT_OID.test(snapshotTree ?? "") || !MATERIAL_REVISION.test(materialRevision ?? "")) throw new TypeError("task-bound review current identity is invalid");
  return { taskHandle, taskId: taskHandle.identity.taskId, snapshotTree, materialRevision, result: { ...result, review_track: null, review_kind: null, review_scope: null } };
}

function taskBoundSource(tree) {
  return { target_commit: tree, base_commit: tree, base_tree: tree, captured_head: tree };
}

function taskBoundAttempt({ identity, result, attemptId, terminalStatus, error, providerAttempts, binding = undefined, resultRef = undefined }) {
  return {
    version: "wh-review-attempt.v1", attempt_id: attemptId, task_id: identity.taskId, stage: "verify-code",
    review_track: result.review_track ?? null, review_kind: result.review_kind ?? null,
    subject_kind: "worktree", phase_id: null, review_scope: null,
    source: taskBoundSource(identity.snapshotTree), snapshot_tree: identity.snapshotTree,
    material_id: result.material_id, material_revision: identity.materialRevision,
    ...(resultRef ? { result_ref: resultRef } : {}),
    ...(binding ? { e2e_binding: binding } : {}),
    ...(result.review_policy ? { review_policy: result.review_policy, policy_snapshot_hash: policyHash(result.review_policy) } : {}),
    provider_attempts: providerAttempts, terminal_status: terminalStatus, error,
  };
}

export function recordTaskBoundE2eReviewUnavailable(input = {}) {
  rejectBuildPrdCanonicalPersistence(input.result, "task-bound unavailable review");
  const identity = taskBoundIdentity(input);
  const result = identity.result;
  const attemptId = randomUUID();
  const attemptRef = `quality/reviews/attempts/${attemptId}/attempt.json`;
  const attempt = taskBoundAttempt({ identity, result, attemptId, terminalStatus: "unavailable", error: result.error ?? { code: "E2E_REVIEWER_UNAVAILABLE", message: "task-bound review unavailable" }, providerAttempts: [] });
  identity.taskHandle.writeRecordAtomic(attemptRef, JSON.stringify(attempt));
  return Object.freeze({ attempt_ref: attemptRef, result_ref: null });
}

export function recordTaskBoundE2eReviewResult(input = {}) {
  const { binding } = input;
  const identity = taskBoundIdentity({ ...input, snapshot_tree: binding?.snapshot_tree, material_revision: binding?.material_revision });
  const result = identity.result;
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
  const providerAnchors = Array.isArray(provider.evidence_anchor_valid)
    && provider.evidence_anchor_valid.length === providerFindings.length
    && provider.evidence_anchor_valid.every((value) => typeof value === "boolean")
    ? provider.evidence_anchor_valid
    : providerFindings.map(() => false);
  const outputContent = JSON.stringify({ findings: providerFindings.map(({ provider: _provider, ...finding }) => finding) });
  const attemptId = randomUUID();
  const attemptRef = `quality/reviews/attempts/${attemptId}/attempt.json`;
  const resultRef = `quality/reviews/results/verify-code-e2e-${randomUUID()}.json`;
  const outputRef = `quality/reviews/attempts/${attemptId}/providers/${providerFileName(provider.provider, 0)}`;
  const outputRecord = { schema_version: "wh-review-provider-output.v1", task_id: identity.taskId, stage: "verify-code", attempt_id: attemptId, provider: provider.provider, content: outputContent, content_hash: textHash(outputContent), evidence_anchor_valid: providerAnchors };
  const aggregation = aggregateCanonicalProviderResults([{ provider: provider.provider, identity: normalizeIdentity(provider.identity, provider.provider), evidenceAnchors: outputRecord.evidence_anchor_valid, review: JSON.parse(outputContent) }], 1, { profilePriority: [provider.provider], requireIdentity: true, requireSourceId: true });
  if (aggregation.status !== "available") throw new Error("task-bound provider output could not be aggregated");
  const attempt = taskBoundAttempt({ identity, result, attemptId, terminalStatus: "semantic", error: null, binding: e2eBinding, resultRef, providerAttempts: [providerAttemptRecord(provider, result.runtime_id, outputRef)] });
  const resultRecord = {
    version: "wh-review-result.v1", task_id: identity.taskId, stage: "verify-code", review_track: result.review_track ?? null, review_kind: result.review_kind ?? null,
    subject_kind: "worktree", phase_id: null, review_scope: null,
    source: taskBoundSource(identity.snapshotTree), snapshot_tree: identity.snapshotTree, material_id: result.material_id, material_revision: identity.materialRevision,
    result_ref: resultRef, e2e_binding: e2eBinding, ...(result.review_policy ? { review_policy: result.review_policy } : {}), attempt_ref: attemptRef,
    provider_results: aggregation.valid.map((item) => ({ provider: item.provider, output: item.review })),
    findings: aggregation.findings.map((finding) => ({ provider: finding.providers[0], ...finding })),
    adjudication: { version: aggregation.adjudication.version, clusters: aggregation.adjudication.clusters },
  };
  identity.taskHandle.writeRecordAtomic(outputRef, JSON.stringify(outputRecord));
  identity.taskHandle.writeRecordAtomic(attemptRef, JSON.stringify(attempt));
  identity.taskHandle.writeRecordAtomic(resultRef, JSON.stringify(resultRecord));
  return Object.freeze({ attempt_ref: attemptRef, result_ref: resultRef });
}

// ---------------------------------------------------------------------------
// Focused re-review input (FR-C4-014 / AC-C4-017).
// ---------------------------------------------------------------------------

const FOCUS_REVIEW_INPUT_KEYS = Object.freeze([
  "finding_ref", "minimal_diff", "tests", "source_tree", "delta_verification",
]);

/**
 * Assemble the one-shot minimal input of a focused re-review. The object is
 * built once, in memory, and is exactly the five declared items; it is never
 * written to the task store, so a focused re-review creates no path card, no
 * packet and no receipt. The caller passes the returned object straight to the
 * provider round; anything besides the five named items is rejected instead of
 * being forwarded to the provider.
 */
export function assembleFocusReviewInput(input = {}) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new TypeError("focus review input must be an object");
  const unknown = Object.keys(input).filter((key) => !FOCUS_REVIEW_INPUT_KEYS.includes(key));
  if (unknown.length) throw new TypeError(`focus review input carries undeclared items: ${unknown.join(", ")}`);
  const focus = {};
  for (const key of FOCUS_REVIEW_INPUT_KEYS) {
    const value = input[key];
    if (value === undefined || value === null) throw new TypeError(`focus review input requires ${key}`);
    focus[key] = value;
  }
  return Object.freeze(focus);
}

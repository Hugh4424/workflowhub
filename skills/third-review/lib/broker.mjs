import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { isDeepStrictEqual } from "node:util";
import { adapter } from "./adapters/index.mjs";
import { execute } from "./process.mjs";
import { cancellationRequested, cancellationSource, claimProvider, createRuntime, cleanup, currentOwnerIdentity, ensureRuntimeGuardian, INVALID_CANCELLATION_SOURCE, ownerConfirmedDead, processIdentity, readRuntime, reapRuntimeIfOwnerDead, releaseProviderClaim, removeRuntimeDirectory, requestCancellation, runtimeDirectory, terminateProcessTree, terminateProcessTreeWithEscalation, updateRunningProvider, updateRuntime, workerIdentityMatches } from "./runtime.mjs";
import { ReviewError, fail, publicError } from "./errors.mjs";
import { adapterForProviderId, parseProviderId, providerRuntimeKey } from "./provider-ids.mjs";
import { canonicalDeliveryManifestHash, canonicalJson, canonicalMaterialManifestHash, discardManagedAttachments, freezeManagedAttachments, planDelivery, prepareCheckedAttachments, prepareWritableAttachmentView, probeAttachmentWorkspace, refreshWritableAttachmentView, renderProviderPrompt, validateAttachmentRoot, validateAttachments, validateContinuationTriad, validateFileOnlyTriad, verifyFrozenAttachments, verifyWritableAttachmentView } from "./attachments.mjs";
import { lastProviderMaterial, providerHasContinuationPredecessor, recordContinuationMaterial, releaseContinuationMaterial, reserveContinuationMaterial } from "./continuation-materials.mjs";
import { decideRecovery } from "./recovery-policy.mjs";
import { assertWorkflowHubResultV3, createWorkflowHubResultV3, projectWorkflowHubMemberV3, WORKFLOWHUB_RESULT_PROTOCOL_V3 } from "./workflowhub-result-v3.mjs";

const fallbackEligibleCodes = new Set(["PROCESS_START_FAILED"]);
const retryableTerminationCodes = new Set(["PROCESS_DEAD", "PROCESS_TIMEOUT"]);
const MATERIAL_PROTOCOL_VERSION = 5;
const MATERIAL_PROTOCOL = Object.freeze({ version: MATERIAL_PROTOCOL_VERSION, delivery_attestation: "sealed-exact-copy.v1" });
const WORKFLOWHUB_RESULT_PROTOCOL_V1 = "workflowhub-result.v1";
const WORKFLOWHUB_RESULT_PROTOCOL_V2 = "workflowhub-result.v2";
const WORKFLOWHUB_RESULT_PROTOCOLS = new Set([WORKFLOWHUB_RESULT_PROTOCOL_V1, WORKFLOWHUB_RESULT_PROTOCOL_V2, WORKFLOWHUB_RESULT_PROTOCOL_V3]);
const MANAGED_HEALTH_STATUSES = new Set(["pending", "running", "completed", "failed", "cancelled"]);
const managedManagerProgram = fileURLToPath(new URL("./managed-session-manager.mjs", import.meta.url));
const timeoutMaterialFields = ["sequence", "bundle_id", "manifest_hash", "delivery_manifest_hash", "initial_material_manifest_hash", "previous_delivery_manifest_hash"];
function hasSession(item) { return typeof item?.session_id === "string" && item.session_id.length > 0; }
function rawCaptureFailure(code) {
  return code === "RAW_OUTPUT_LIMIT"
    ? { code: "PROVIDER_OUTPUT_LIMIT", message: "provider raw output exceeded the configured limit" }
    : { code: "RAW_OUTPUT_WRITE_FAILED", message: "broker could not persist provider raw output" };
}
function noSemanticResult(item) { return item?.output === undefined && item?.semantic_verdict === undefined && item?.verdict === undefined && item?.published_verdict === undefined; }
function timeoutRetryCandidate(item) {
  return item?.status === "failed" && retryableTerminationCodes.has(item.error?.code) && hasSession(item)
    && !item.cancellation_source && !item.error?.source && noSemanticResult(item) && item.timeout_retry?.version === 1;
}
function sameTimeoutMaterial(left, right) { return timeoutMaterialFields.every((field) => left?.[field] === right?.[field]); }
function timeoutRetryEligible(item, material) {
  if (!timeoutRetryCandidate(item)) return false;
  return material ? sameTimeoutMaterial(item.timeout_retry.material, material) : item.timeout_retry.attachment_free === true;
}
function continuationEligible(item, material, candidateOnly = false) { return item?.status === "completed" || (item?.status === "running" && workerIdentityMatches(item.worker)) || (candidateOnly ? timeoutRetryCandidate(item) : timeoutRetryEligible(item, material)); }
function frozenDescriptor(runtime, key, binding, deliveryMode, visible = null) {
  const runtimeKey = providerRuntimeKey(key) ?? key;
  let stored; try { stored = JSON.parse(fs.readFileSync(path.join(runtime, "workspace", runtimeKey, "attachments-manifest.json"), "utf8")); }
  catch { fail("ATTACHMENT_IMMUTABLE", "frozen attachment manifest is unavailable"); }
  if (stored.bundle_id !== binding.bundle_id || stored.manifest_hash !== binding.manifest_hash || canonicalMaterialManifestHash(stored.bundle_id, stored.files) !== binding.manifest_hash || canonicalDeliveryManifestHash(stored.bundle_id, stored.files, deliveryMode) !== binding.delivery_manifest_hash) fail("MATERIAL_INCOMPLETE", "frozen attachment workspace does not match its material chain");
  if (visible) {
    const files = stored.files.map(({ target: destination, sha256, size }) => ({ destination, sha256, size }));
    if (!isDeepStrictEqual(files, visible)) fail("MATERIAL_INCOMPLETE", "frozen provider workspace does not match its delivery receipt");
  }
  return stored;
}
function isWorkflowHubResultProtocol(value) { return WORKFLOWHUB_RESULT_PROTOCOLS.has(value); }
function workflowHubResultV1(value, checked) {
  const result = {
    provider: value.provider ?? null,
    status: value.status === "skipped" ? "failed" : value.status,
    result_protocol: WORKFLOWHUB_RESULT_PROTOCOL_V1,
    material_id: checked?.material_id,
    session_id: value.session_id ?? null,
    output: value.output ?? null,
    error: value.error ?? null,
  };
  return containsPrivatePathDeep(result) ? publicInvalidV1Result(value, checked) : result;
}
function integerOrNull(value) { return Number.isSafeInteger(value) && value >= 0 ? value : null; }
/**
 * Public timing must stay internally consistent: consumers reject a triple whose
 * `duration_ms` does not equal `completed_at_ms - started_at_ms`. Provider
 * adapters report their own duration while the attempt facts are stamped from
 * the broker's clock, so mixing the two sources produced triples that differed
 * by a few milliseconds. The public projection therefore derives the duration
 * from the two published timestamps whenever both are present, and only falls
 * back to a reported duration when the window is unknown.
 */
function publicTiming(facts, value) {
  const startedAtMs = integerOrNull(facts?.started_at_ms);
  const completedAtMs = integerOrNull(facts?.completed_at_ms);
  const reportedDurationMs = integerOrNull(value?.duration_ms ?? facts?.duration_ms);
  const durationMs = startedAtMs !== null && completedAtMs !== null && completedAtMs >= startedAtMs
    ? completedAtMs - startedAtMs
    : reportedDurationMs;
  return {
    started_at_ms: startedAtMs,
    completed_at_ms: completedAtMs,
    duration_ms: durationMs,
  };
}
const workflowHubV2ProviderFields = Object.freeze([
  "adapter", "continuable", "effort", "error", "material_id", "model", "output", "provider",
  "raw_output_ref", "result_protocol", "retry", "runtime_id", "session_file_path", "session_id",
  "status", "thinking", "timing", "unavailable_diagnostics", "usage",
].sort());
const workflowHubV2GroupFields = Object.freeze(["host_provider", "outcome", "providers", "round", "runtime_id", "selected_tier", "version"].sort());
const workflowHubV2Outcomes = new Set(["completed", "unavailable", "cancelled", "stalled", "unverifiable", "invalid_output"]);
const workflowHubV2TimingFields = Object.freeze(["completed_at_ms", "duration_ms", "started_at_ms"].sort());
const workflowHubV2RetryFields = Object.freeze(["count", "progress_events"].sort());
const workflowHubV2OutputRefFields = Object.freeze(["provider", "runtime_id", "stderr_sha256", "stdout_sha256", "version"].sort());
const workflowHubV2DiagnosticFields = Object.freeze(["code", "message"].sort());
// Reject host filesystem roots, not ordinary slash-separated review terms
// such as `map/AC`.  The previous generic slash matcher turned valid Kimi
// findings into PUBLIC_RESULT_INVALID whenever prose contained `word/word`.
const absolutePathPattern = /(?:^|[^A-Za-z0-9._~/%-])(?:\/(?:Users|home|private|workspace|srv|tmp|var|etc|opt|mnt|Volumes|root|usr|bin|sbin|dev|proc|sys|Library|data|run)(?:\/|$)|[A-Za-z]:[\\/])/;
const fileUriPathPattern = /\bfile:\/\//i;
function containsPrivatePath(value) { return typeof value === "string" && (absolutePathPattern.test(value) || fileUriPathPattern.test(value)); }
function containsPrivatePathDeep(value) {
  if (containsPrivatePath(value)) return true;
  if (!value || typeof value !== "object") return false;
  if (Array.isArray(value)) return value.some((item) => containsPrivatePathDeep(item));
  return Object.values(value).some(containsPrivatePathDeep);
}
// Provider-private workspace paths are delivery artifacts, not review facts:
// file_only tool delivery echoes this run's workdir to the model, and a final
// answer may quote those paths back (e.g. `/tmp/.../work/<key>/bundle/x.md`,
// which macOS realpath renders as `/private/tmp/...`). Strip only the exact
// workspace prefix so the remainder stays relative; every other absolute host
// path (`/Users`, `/home`, `/var`, `file://`, ...) is deliberately untouched
// and still fails closed in the public validation gates.
export function sanitizeProviderWorkspacePaths(output, workspacePaths) {
  if (typeof output !== "string" || output.length === 0) return output;
  const variants = [...new Set(workspacePaths ?? [])]
    .filter((entry) => typeof entry === "string" && entry.length > 0)
    .sort((left, right) => right.length - left.length);
  let text = output;
  for (const workspace of variants) {
    const literal = workspace.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // Exact-prefix only: the workspace path must start at a string boundary or
    // right after whitespace/quote/separator, and end at a path separator
    // (`/bundle/...`, `/materials/...` become their relative form) or at the
    // end of the text (a bare workspace directory becomes `.`). A longer
    // sibling path is never rewritten, and no generic "private root" list is
    // consulted, so `/Users/...` and friends are preserved for hasPrivatePath.
    const pattern = new RegExp("(^|[\\s\"'`([{<>=,:;/])" + literal + "(/|$)", "g");
    text = text.replace(pattern, (_match, boundary, followed) => `${boundary}${followed === "/" ? "" : "."}`);
  }
  return text;
}
function managedPublicPath(root, runtime_id) { return path.join(root, runtime_id, "managed", "public.json"); }
function managedJobPath(root, runtime_id, operation_id) { return path.join(root, runtime_id, "managed", "operations", `${operation_id}.json`); }
function managedRequestPath(root, request_id) { return path.join(root, "managed-requests", createHash("sha256").update(request_id, "utf8").digest("hex"), "binding.json"); }
function writePrivateJson(target, value) {
  fs.mkdirSync(path.dirname(target), { recursive: true, mode: 0o700 });
  const temporary = `${target}.${process.pid}.${randomUUID()}.tmp`;
  let fd = null, owned = null;
  try {
    fd = fs.openSync(temporary, "wx", 0o600); owned = fs.fstatSync(fd);
    fs.writeFileSync(fd, `${JSON.stringify(value)}\n`);
    fs.closeSync(fd); fd = null;
    fs.renameSync(temporary, target);
  } catch (error) {
    const cleanupErrors = [];
    if (fd !== null) { try { fs.closeSync(fd); } catch (cleanupError) { cleanupErrors.push(cleanupError); } }
    try {
      let named;
      try { named = fs.lstatSync(temporary); } catch (cleanupError) { if (cleanupError.code !== "ENOENT") throw cleanupError; }
      if (named && owned) {
        if (named.dev !== owned.dev || named.ino !== owned.ino) throw new Error("private temporary file identity changed before cleanup");
        fs.unlinkSync(temporary);
      } else if (named && fd !== null) throw new Error("private temporary file ownership could not be verified for cleanup");
    } catch (cleanupError) { cleanupErrors.push(cleanupError); }
    if (cleanupErrors.length) throw new AggregateError([error, ...cleanupErrors], `${error.message}; private write cleanup failed: ${cleanupErrors.map(item => item.message).join("; ")}`, { cause: error });
    throw error;
  }
}
function readPrivateJson(target, code, message) {
  try { return JSON.parse(fs.readFileSync(target, "utf8")); }
  catch { fail(code, message); }
}
function managedJobRecord(root, runtime_id, operation_id) {
  const target = managedJobPath(root, runtime_id, operation_id);
  let raw;
  try { raw = fs.readFileSync(target, "utf8"); }
  catch (error) {
    if (error?.code === "ENOENT") {
      const missing = new ReviewError("MANAGED_JOB_UNAVAILABLE", "managed operation identity snapshot is missing");
      missing.jobRecordMissing = true;
      missing.cause = error;
      throw missing;
    }
    fail("MANAGED_JOB_READ_FAILED", "managed operation identity snapshot could not be read");
  }
  let job;
  try { job = JSON.parse(raw); }
  catch { fail("MANAGED_JOB_INVALID", "managed operation identity snapshot is invalid JSON"); }
  if (!job || typeof job !== "object" || Array.isArray(job)) {
    fail("MANAGED_JOB_INVALID", "managed operation identity snapshot is incomplete");
  }
  if (job.runtime_id !== runtime_id || job.operation_id !== operation_id) {
    fail("MANAGED_JOB_IDENTITY_MISMATCH", "managed operation identity snapshot does not match the requested operation");
  }
  if (job.version !== 1 || !job.request || !job.config_snapshot?.providers) {
    fail("MANAGED_JOB_INVALID", "managed operation identity snapshot is incomplete");
  }
  return job;
}
function managedJobRecordForTerminal(root, runtime_id, operation_id) {
  try { return { record: managedJobRecord(root, runtime_id, operation_id), diagnostic: null }; }
  catch (error) {
    if (!["MANAGED_JOB_UNAVAILABLE", "MANAGED_JOB_INVALID", "MANAGED_JOB_IDENTITY_MISMATCH", "MANAGED_JOB_READ_FAILED"].includes(error?.code)) throw error;
    // The operation retains provider identity and result protocol. A damaged
    // private execution snapshot must not leave a conclusively dead manager
    // projected as running forever; publish a terminal failure and name the
    // rejected snapshot category without exposing its path or contents.
    return { record: null, diagnostic: error.code };
  }
}
function opaqueRequestId(value) {
  if (typeof value !== "string" || value.length === 0 || containsPrivatePath(value) || /[\u0000-\u001f]/.test(value)) fail("REQUEST_INVALID", "request_id must be a non-empty opaque public identifier");
  return value;
}
function managedHealthProvider(item) {
  const status = item?.status ?? "pending";
  if (!MANAGED_HEALTH_STATUSES.has(status)) return null;
  const candidateCode = item?.error?.code ?? item?.last_health_diagnostic?.code;
  const errorCode = typeof candidateCode === "string" && candidateCode.trim().length > 0 ? safePublicString(candidateCode) : null;
  const lastProgressAt = Number.isSafeInteger(item?.last_progress_at_ms) && item.last_progress_at_ms >= 0 ? item.last_progress_at_ms : null;
  return {
    status,
    ...(errorCode ? { error: { code: errorCode } } : {}),
    last_progress_at_ms: lastProgressAt,
  };
}
function managedPublic(operation, runtime_id, runtimeState) {
  // Status is projected from the current operation, rather than the last
  // published snapshot.  A snapshot written by `start` is necessarily
  // `starting`; reusing it after the manager advanced to `running` (or
  // `terminal`) makes a healthy managed review appear permanently stuck.
  const state = operation.state === "terminal" ? "terminal" : operation.state === "running" ? "running" : "starting";
  const value = { version: "workflowhub-run.v1", request_id: operation.request_id, runtime_id, state, material_id: operation.material_id };
  if (state === "terminal") return { ...value, group: operation.group };
  const providers = Object.fromEntries(operation.providers.flatMap(({ id }) => {
    const health = managedHealthProvider(runtimeState.providers?.[id]);
    return health ? [[id, health]] : [];
  }));
  return { ...value, providers };
}
function assertManagedPublic(value) {
  assertNoPrivatePaths(value, "managed public result");
  if (!value || value.version !== "workflowhub-run.v1" || typeof value.request_id !== "string" || typeof value.runtime_id !== "string" || !["starting", "running", "terminal"].includes(value.state) || typeof value.material_id !== "string") fail("PUBLIC_RESULT_INVALID", "managed result has an invalid public schema");
  if (value.state === "terminal") {
    exactKeys(value, ["group", "material_id", "request_id", "runtime_id", "state", "version"], "managed terminal result");
    assertManagedTerminalGroup(value.group, value.runtime_id, value.material_id);
    return value;
  }
  exactKeys(value, ["material_id", "providers", "request_id", "runtime_id", "state", "version"], "managed non-terminal result");
  if (!value.providers || typeof value.providers !== "object" || Array.isArray(value.providers)) fail("PUBLIC_RESULT_INVALID", "managed health providers must be an object");
  for (const [provider, item] of Object.entries(value.providers)) {
    if (safeProviderId(provider) !== provider || !item || typeof item !== "object" || Array.isArray(item)) {
      fail("PUBLIC_RESULT_INVALID", "managed result has an invalid provider health map");
    }
    const fields = ["last_progress_at_ms", "status", ...(Object.hasOwn(item, "error") ? ["error"] : [])].sort();
    exactKeys(item, fields, "managed non-terminal provider");
    if (!MANAGED_HEALTH_STATUSES.has(item.status)
      || !(item.last_progress_at_ms === null || (Number.isSafeInteger(item.last_progress_at_ms) && item.last_progress_at_ms >= 0))) {
      fail("PUBLIC_RESULT_INVALID", "managed result has an invalid provider health map");
    }
    if (item.error !== undefined && item.error !== null) {
      if (typeof item.error !== "object" || Array.isArray(item.error)) fail("PUBLIC_RESULT_INVALID", "managed result has an invalid provider health error");
      exactKeys(item.error, ["code"], "managed non-terminal provider error");
      if (typeof item.error.code !== "string" || !safePublicString(item.error.code)) fail("PUBLIC_RESULT_INVALID", "managed result has an invalid provider health error");
    }
  }
  return value;
}
// A managed operation publishes the group its request protocol produced.  A v3
// operation must not be validated (or rebuilt) as a v2 group: the two carry
// different group and member schemas, and the mismatch used to abort the
// detached manager before it could publish any terminal group.
function managedGroupProtocol(value) {
  return value?.version === WORKFLOWHUB_RESULT_PROTOCOL_V3 ? WORKFLOWHUB_RESULT_PROTOCOL_V3 : WORKFLOWHUB_RESULT_PROTOCOL_V2;
}
function assertManagedTerminalGroup(value, expectedRuntimeId, expectedMaterialId) {
  return managedGroupProtocol(value) === WORKFLOWHUB_RESULT_PROTOCOL_V3
    ? assertWorkflowHubV3Group(value, expectedRuntimeId, expectedMaterialId)
    : assertWorkflowHubV2Group(value, expectedRuntimeId, expectedMaterialId);
}
function assertWorkflowHubV3Group(value, expectedRuntimeId = null, expectedMaterialId = null) {
  assertWorkflowHubResultV3(value);
  if (expectedRuntimeId !== null && value.runtime_id !== expectedRuntimeId) fail("PUBLIC_RESULT_INVALID", "managed terminal group runtime does not match its operation");
  if (expectedMaterialId !== null && value.material_id !== expectedMaterialId) fail("PUBLIC_RESULT_INVALID", "managed terminal group material does not match its operation");
  return value;
}
function assertWorkflowHubV2Group(value, expectedRuntimeId = null, expectedMaterialId = null) {
  exactKeys(value, workflowHubV2GroupFields, "managed terminal group");
  if (value.version !== 4 || !workflowHubV2Outcomes.has(value.outcome) || typeof value.runtime_id !== "string" || !Number.isSafeInteger(value.round) || value.round < 0 || typeof value.host_provider !== "string" || !(value.selected_tier === null || (Number.isSafeInteger(value.selected_tier) && value.selected_tier >= 0)) || !Array.isArray(value.providers) || value.providers.length === 0) {
    fail("PUBLIC_RESULT_INVALID", "managed terminal result has invalid workflowhub-result.v2 group facts");
  }
  if (expectedRuntimeId !== null && value.runtime_id !== expectedRuntimeId) fail("PUBLIC_RESULT_INVALID", "managed terminal group runtime does not match its operation");
  value.providers.forEach((provider) => {
    assertWorkflowHubV2ProviderSchema(provider);
    if (expectedRuntimeId !== null && provider.runtime_id !== expectedRuntimeId) fail("PUBLIC_RESULT_INVALID", "managed terminal provider runtime does not match its operation");
    if (expectedMaterialId !== null && provider.material_id !== expectedMaterialId) fail("PUBLIC_RESULT_INVALID", "managed terminal provider material does not match its operation");
  });
  assertNoPrivatePaths(value, "managed terminal group"); return value;
}
function managedTerminalGroup(value, expectedRuntimeId, expectedMaterialId) {
  const group = structuredClone(value);
  // A managed status is a polling protocol, not a raw transcript lookup.
  // Keep the semantic V2 output while withholding even logical raw-output
  // references so callers never acquire an artifact-discovery side channel.
  // A v3 group has no raw-output or session-file field at all: it publishes
  // only typed provenance digests, so there is nothing to withhold here.
  if (managedGroupProtocol(group) === WORKFLOWHUB_RESULT_PROTOCOL_V2) {
    group.providers = group.providers.map((provider) => ({ ...provider, raw_output_ref: null, session_file_path: null }));
  }
  return assertManagedTerminalGroup(group, expectedRuntimeId, expectedMaterialId);
}
function managedFailureError(code, jobRecordDiagnostic = null) {
  const diagnostic = safePublicString(jobRecordDiagnostic);
  return {
    code,
    message: code === "CANCELLED"
      ? "managed review was cancelled"
      : diagnostic
        ? `managed session manager is unavailable; private job snapshot rejected (${diagnostic})`
        : "managed session manager is unavailable",
  };
}
function managedFailureProvider(profile, material_id, runtime_id, code, status = "failed", jobRecordDiagnostic = null) {
  const error = managedFailureError(code, jobRecordDiagnostic);
  const result = {
    provider: safeProviderId(profile?.id) ?? "unknown", adapter: safePublicString(profile?.adapter) ?? "unknown", model: safePublicString(profile?.model), effort: safePublicString(profile?.effort), thinking: typeof profile?.thinking === "boolean" ? profile.thinking : null,
    status, result_protocol: WORKFLOWHUB_RESULT_PROTOCOL_V2, material_id: safePublicString(material_id), runtime_id, session_id: null, session_file_path: null, continuable: false,
    timing: { started_at_ms: null, completed_at_ms: Date.now(), duration_ms: null }, usage: null, retry: { count: 0, progress_events: 0 }, raw_output_ref: null,
    unavailable_diagnostics: error, output: null, error,
  };
  assertWorkflowHubV2ProviderSchema(result); return result;
}
function managedFailureMemberV3(profile, material_id, runtime_id, code, status, jobRecordDiagnostic = null) {
  const error = managedFailureError(code, jobRecordDiagnostic);
  return projectWorkflowHubMemberV3({
    provider: safeProviderId(profile?.id) ?? "unknown",
    adapter: safePublicString(profile?.adapter) ?? "unknown",
    model: safePublicString(profile?.model),
    status, output: null, error, continuable: false, session_id: null, usage: null,
    timing: { started_at_ms: null, completed_at_ms: Date.now(), duration_ms: null },
  }, {
    runtime_id, material_id, contract_id: "unavailable", contract_hash: "unavailable", semantic_hash: "unavailable",
    raw_output_sha256: null, raw_stderr_sha256: null, attempts: [],
  });
}
function managedFailureGroup(state, operation, code, config = null, input = null, jobRecordDiagnostic = null) {
  const status = code === "CANCELLED" ? "cancelled" : "failed";
  if (operation?.result_protocol === WORKFLOWHUB_RESULT_PROTOCOL_V3) {
    const providers = operation.providers.map((listedProfile) => {
      const profile = config?.providers?.[listedProfile.id] ?? listedProfile;
      if (!profile) fail("MANAGED_JOB_UNAVAILABLE", `original provider identity is unavailable for ${listedProfile.id}`);
      const persisted = state.providers?.[listedProfile.id];
      if (persisted?.status === "completed") {
        return projectWorkflowHubMemberV3({
          provider: listedProfile.id, adapter: profile.adapter, model: profile.model ?? null,
          status: "completed", output: persisted.output ?? null, error: null,
          session_id: persisted.session_id ?? null, continuable: hasSession(persisted), usage: persisted.usage ?? null,
        }, {
          runtime_id: state.runtime_id, material_id: operation.material_id,
          contract_id: input?.contract_id ?? "unavailable", contract_hash: input?.contract_hash ?? "unavailable",
          semantic_hash: input?.semantic_hash ?? "unavailable", source_id: profile.source_id ?? listedProfile.id,
          config_id: profile.config_id ?? listedProfile.id, adapter: profile.adapter, model: profile.model ?? null,
          deadline_ms: null, attempts: persisted.attempts ?? [],
          raw_output_sha256: persisted.raw_stdout_sha256 ?? null, raw_stderr_sha256: persisted.raw_stderr_sha256 ?? null,
        });
      }
      return managedFailureMemberV3(profile, operation.material_id, state.runtime_id, code, status, jobRecordDiagnostic);
    });
    return createWorkflowHubResultV3({ runtime_id: state.runtime_id, round: state.round, host_provider: state.host_provider, selected_tier: null, material_id: operation.material_id, providers });
  }
  const providers = operation.providers.map((listedProfile) => {
    const profile = config?.providers?.[listedProfile.id] ?? listedProfile;
    if (!profile) fail("MANAGED_JOB_UNAVAILABLE", `original provider identity is unavailable for ${listedProfile.id}`);
    const persisted = state.providers?.[listedProfile.id];
    if (persisted?.status === "completed") return workflowHubResultV2(persisted, { material_id: operation.material_id }, profile, state.runtime_id, persisted);
    return managedFailureProvider(profile, operation.material_id, state.runtime_id, code, status, jobRecordDiagnostic);
  });
  const completed = providers.filter((item) => item.status === "completed").length;
  const outcome = completed > 0 ? "completed" : code === "CANCELLED" ? "cancelled" : "unavailable";
  const group = { version: 4, outcome, runtime_id: state.runtime_id, round: state.round, host_provider: state.host_provider, selected_tier: null, providers };
  return assertWorkflowHubV2Group(group, state.runtime_id, operation.material_id);
}
function managedBinding(input, checked, config) {
  // `source` is only a host-side staging location. WorkflowHub can rebuild an
  // identical sealed packet in a new temporary directory while reconnecting.
  // Bind the provider-visible destinations and exact bytes instead.
  const manifest = {
    version: 1,
    bundle_id: checked.bundle_id,
    entries: checked.files.map(({ target: destination, size, sha256, embed }) => ({ destination, size, sha256, embed })),
  };
  const requestValue = structuredClone(input); requestValue.attachments = { delivery: checked.requested_delivery, manifest };
  const route = input.provider_allowlist.map((id) => {
    const provider = config.providers[id]; return { id, adapter: provider.adapter, enabled: provider.enabled, model: provider.model, effort: provider.effort, thinking: provider.thinking };
  });
  return createHash("sha256").update(canonicalJson({ request: requestValue, material: { bundle_id: checked.bundle_id, manifest_hash: checked.manifest_hash, material_id: checked.material_id, delivery: checked.requested_delivery, files: checked.files }, route }), "utf8").digest("hex");
}
function publicInvalidError() { return { code: "PUBLIC_RESULT_INVALID", message: "provider result omitted because it contained a private absolute path" }; }
function safePublicString(value, fallback = null) { return typeof value === "string" && !containsPrivatePath(value) ? value : fallback; }
function safeProviderId(value) { return parseProviderId(value)?.id ?? null; }
function publicInvalidV1Result(value, checked) {
  return {
    provider: safeProviderId(value.provider),
    status: "failed",
    result_protocol: WORKFLOWHUB_RESULT_PROTOCOL_V1,
    material_id: safePublicString(checked?.material_id),
    session_id: null,
    output: null,
    error: publicInvalidError(),
  };
}
function exactKeys(value, fields, label) {
  if (!value || typeof value !== "object" || Array.isArray(value) || !isDeepStrictEqual(Object.keys(value).sort(), fields)) {
    fail("PUBLIC_RESULT_INVALID", `${label} does not match the workflowhub-result.v2 public schema`);
  }
}
function assertNoPrivatePaths(value, label = "result") {
  if (typeof value === "string") {
    if (containsPrivatePath(value)) fail("PUBLIC_RESULT_INVALID", `${label} contains a private absolute path`);
    return;
  }
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) { value.forEach((item, index) => assertNoPrivatePaths(item, `${label}[${index}]`)); return; }
  for (const [key, child] of Object.entries(value)) assertNoPrivatePaths(child, `${label}.${key}`);
}
export function publicV2Error(value) {
  const code = typeof value?.code === "string" && value.code.length > 0 ? value.code : "RESULT_UNAVAILABLE";
  const message = typeof value?.message === "string" && value.message.trim().length > 0
    ? value.message
    : "provider error message is unavailable";
  // Spawn and adapter errors can carry a host path. Preserve the stable code,
  // but never export that path through the public protocol.
  return containsPrivatePath(message) ? { code, message: "provider error message omitted because it contained a private absolute path" } : { code, message };
}
function assertPublicV2Diagnostic(value, label) {
  exactKeys(value, workflowHubV2DiagnosticFields, label);
  if (typeof value.code !== "string" || value.code.trim().length === 0 || typeof value.message !== "string" || value.message.trim().length === 0) {
    fail("PUBLIC_RESULT_INVALID", `${label} must contain non-empty public code and message strings`);
  }
}
function assertWorkflowHubV2ProviderSchema(value) {
  exactKeys(value, workflowHubV2ProviderFields, "provider result");
  if (value.result_protocol !== WORKFLOWHUB_RESULT_PROTOCOL_V2 || typeof value.provider !== "string" || typeof value.adapter !== "string" || typeof value.runtime_id !== "string" || typeof value.continuable !== "boolean" || value.session_file_path !== null) {
    fail("PUBLIC_RESULT_INVALID", "provider result has invalid required workflowhub-result.v2 facts");
  }
  exactKeys(value.timing, workflowHubV2TimingFields, "provider timing");
  exactKeys(value.retry, workflowHubV2RetryFields, "provider retry");
  if (![value.timing.started_at_ms, value.timing.completed_at_ms, value.timing.duration_ms].every((item) => item === null || (Number.isSafeInteger(item) && item >= 0)) || ![value.retry.count, value.retry.progress_events].every((item) => Number.isSafeInteger(item) && item >= 0)) {
    fail("PUBLIC_RESULT_INVALID", "provider result has invalid timing or retry facts");
  }
  if (value.raw_output_ref !== null) exactKeys(value.raw_output_ref, workflowHubV2OutputRefFields, "provider raw output reference");
  if (!["completed", "failed", "cancelled"].includes(value.status)) fail("PUBLIC_RESULT_INVALID", "provider result has an invalid status");
  if (value.unavailable_diagnostics !== null) assertPublicV2Diagnostic(value.unavailable_diagnostics, "provider unavailable diagnostics");
  if (value.error !== null) assertPublicV2Diagnostic(value.error, "provider error");
  if (value.status === "completed" && (value.unavailable_diagnostics !== null || value.error !== null)) {
    fail("PUBLIC_RESULT_INVALID", "completed provider result must not contain public error diagnostics");
  }
  if (value.status !== "completed") {
    if (value.unavailable_diagnostics === null || value.error === null) {
      fail("PUBLIC_RESULT_INVALID", "non-completed provider result requires public error diagnostics");
    }
    if (value.unavailable_diagnostics.code !== value.error.code || value.unavailable_diagnostics.message !== value.error.message) {
      fail("PUBLIC_RESULT_INVALID", "non-completed provider diagnostics must match the public error");
    }
  }
  assertNoPrivatePaths(value);
}
function publicOutputRef(value, runtime_id, provider) {
  if (!value?.raw_stdout_sha256 && !value?.raw_stderr_sha256) return null;
  return {
    version: "broker-output-ref.v1",
    runtime_id,
    provider: provider ?? null,
    stdout_sha256: value.raw_stdout_sha256 ?? null,
    stderr_sha256: value.raw_stderr_sha256 ?? null,
  };
}
function workflowHubResultV2(value, checked, profile, runtime_id, persisted = null) {
  const facts = persisted ?? value;
  const provider = value.provider ?? profile?.id ?? null;
  const status = value.status === "skipped" ? "failed" : value.status;
  const sourceError = value.error ?? facts.error ?? null;
  const error = status === "completed" && sourceError === null ? null : publicV2Error(sourceError);
  const result = {
    provider,
    adapter: profile?.adapter ?? adapterForProviderId(provider),
    model: profile?.model ?? null,
    effort: profile?.effort ?? null,
    thinking: profile?.thinking ?? null,
    status,
    result_protocol: WORKFLOWHUB_RESULT_PROTOCOL_V2,
    material_id: checked?.material_id,
    runtime_id,
    session_id: value.session_id ?? facts.session_id ?? null,
    session_file_path: null,
    continuable: value.continuable === false ? false : hasSession(value) || hasSession(facts),
    timing: publicTiming(facts, value),
    usage: value.usage ?? facts.usage ?? null,
    retry: {
      count: integerOrNull(value.retry_count ?? facts.retry_count) ?? 0,
      progress_events: integerOrNull(value.progress_events ?? facts.progress_events) ?? 0,
    },
    raw_output_ref: publicOutputRef(value, runtime_id, provider),
    unavailable_diagnostics: status === "completed" ? null : { code: error.code, message: error.message },
    output: value.output ?? null,
    error,
  };
  assertWorkflowHubV2ProviderSchema(result);
  return result;
}
function publicInvalidV2Result(value, checked, providerId, runtime_id, persisted = null) {
  const facts = persisted ?? value;
  const provider = safeProviderId(providerId) ?? safeProviderId(value.provider) ?? "unknown";
  const result = {
    provider,
    adapter: adapterForProviderId(provider) ?? "unknown",
    model: null,
    effort: null,
    thinking: null,
    status: "failed",
    result_protocol: WORKFLOWHUB_RESULT_PROTOCOL_V2,
    material_id: safePublicString(checked?.material_id),
    runtime_id: safePublicString(runtime_id, "invalid-runtime"),
    session_id: null,
    session_file_path: null,
    continuable: false,
    timing: publicTiming(facts, value),
    usage: null,
    retry: {
      count: integerOrNull(value?.retry_count ?? facts?.retry_count) ?? 0,
      progress_events: integerOrNull(value?.progress_events ?? facts?.progress_events) ?? 0,
    },
    raw_output_ref: null,
    unavailable_diagnostics: publicInvalidError(),
    output: null,
    error: publicInvalidError(),
  };
  assertWorkflowHubV2ProviderSchema(result);
  return result;
}
function safeNonEmptyPublicString(value, fallback) {
  const safe = safePublicString(value);
  return typeof safe === "string" && safe.trim().length > 0 ? safe : fallback;
}
function safeV3ProvenanceHash(value) {
  return typeof value === "string" && /^[a-f0-9]{64}$/i.test(value) ? value : null;
}
function publicInvalidV3Error(value) {
  const original = value?.error;
  const code = safeNonEmptyPublicString(original?.code, "PUBLIC_RESULT_INVALID");
  const message = typeof original?.message === "string" && original.message.trim().length > 0 && !containsPrivatePath(original.message)
    ? original.message
    : "provider output did not satisfy public contract";
  return { code, message, cause_code: "PUBLIC_RESULT_INVALID" };
}
function publicInvalidV3Result(value, checked, providerId, runtime_id, persisted = null, input = null) {
  const provider = safeProviderId(providerId) ?? safeProviderId(value?.provider) ?? "unknown";
  const adapter = adapterForProviderId(provider) ?? "unknown";
  const context = {
    runtime_id: safeNonEmptyPublicString(runtime_id, "invalid-runtime"),
    material_id: safeNonEmptyPublicString(checked?.material_id ?? persisted?.material_id, "unavailable"),
    contract_id: safeNonEmptyPublicString(input?.contract_id, "unavailable"),
    contract_hash: safeNonEmptyPublicString(input?.contract_hash, "unavailable"),
    semantic_hash: safeNonEmptyPublicString(input?.semantic_hash, "unavailable"),
    source_id: provider,
    config_id: provider,
    adapter,
    model: null,
    deadline_ms: null,
    raw_output_sha256: safeV3ProvenanceHash(persisted?.raw_stdout_sha256),
    raw_stderr_sha256: safeV3ProvenanceHash(persisted?.raw_stderr_sha256),
  };
  const result = {
    provider,
    adapter,
    status: "failed",
    output: null,
    error: publicInvalidV3Error(value),
    session_id: null,
    continuable: false,
    usage: null,
  };
  try {
    return projectWorkflowHubMemberV3(result, { ...context, attempts: persisted?.attempts ?? [] });
  } catch (error) {
    if (error?.code !== "PUBLIC_RESULT_INVALID") throw error;
    return projectWorkflowHubMemberV3(result, { ...context, attempts: [], raw_output_sha256: null, raw_stderr_sha256: null });
  }
}
function workflowHubResult(protocol, value, checked, profile, runtime_id, persisted = null) {
  if (protocol === WORKFLOWHUB_RESULT_PROTOCOL_V1) return workflowHubResultV1(value, checked);
  return workflowHubResultV2(value, checked, profile, runtime_id, persisted);
}
function projectWorkflowHubResult(protocol, value, checked, profile, runtime_id, persisted = null, providerId = null, input = null) {
  if (protocol === WORKFLOWHUB_RESULT_PROTOCOL_V3) {
    try {
      return projectWorkflowHubMemberV3(value, {
        runtime_id,
        material_id: checked?.material_id ?? persisted?.material_id ?? "unavailable",
        contract_id: input?.contract_id ?? "unavailable",
        contract_hash: input?.contract_hash ?? "unavailable",
        semantic_hash: input?.semantic_hash ?? "unavailable",
        source_id: profile?.source_id ?? providerId ?? value.provider,
        config_id: profile?.config_id ?? providerId ?? value.provider,
        adapter: profile?.adapter ?? adapterForProviderId(providerId ?? value.provider),
        model: profile?.model ?? null,
        deadline_ms: profile?.deadline_ms ?? null,
        attempts: persisted?.attempts ?? [],
        raw_output_sha256: persisted?.raw_stdout_sha256 ?? null,
        raw_stderr_sha256: persisted?.raw_stderr_sha256 ?? null,
      });
    } catch (error) {
      if (error?.code !== "PUBLIC_RESULT_INVALID") throw error;
      return publicInvalidV3Result(value, checked, providerId, runtime_id, persisted, input);
    }
  }
  try { return workflowHubResult(protocol, value, checked, profile, runtime_id, persisted); }
  catch (error) {
    if (error?.code !== "PUBLIC_RESULT_INVALID") throw error;
    return protocol === WORKFLOWHUB_RESULT_PROTOCOL_V1
      ? publicInvalidV1Result(value, checked)
      : publicInvalidV2Result(value, checked, providerId, runtime_id, persisted);
  }
}
function sourceAdapter(value, config) { return config.providers[value]?.adapter ?? adapterForProviderId(value); }
function sameSource(left, right, config) { return sourceAdapter(left, config) === sourceAdapter(right, config); }
function sameConfiguredSource(left, right, config) {
  if (left === right) return true;
  const leftProfile = config.providers[left] ?? null;
  const rightProfile = config.providers[right] ?? null;
  // An adapter-only host value such as `codex` is not proof that a configured
  // model profile such as `codex/luna` is the same source. Only an exact
  // provider id or two explicitly equal source_id values can exclude it.
  if (!leftProfile || !rightProfile) return false;
  return typeof leftProfile.source_id === "string" && leftProfile.source_id.length > 0
    && typeof rightProfile.source_id === "string" && rightProfile.source_id.length > 0
    && leftProfile.source_id === rightProfile.source_id;
}
function sameV3Source(left, right, config) {
  return sameConfiguredSource(left, right, config);
}
function workflowHubV2GroupEntries(providerIds, host, config, selected = null) {
  return providerIds.map((id) => {
    if (sameConfiguredSource(id, host, config)) return { id, tier: null, skip: "SAME_SOURCE", skip_message: "provider shares the configured source identity with the host" };
    if (selected && !selected.includes(id)) return { id, tier: null, unavailable: "NO_CONTINUABLE_SESSION" };
    return { id, tier: null, ...(selected ? { continuation: true } : {}) };
  });
}
function workflowHubV3GroupEntries(providerIds, host, config, selected = null) {
  return providerIds.map((id) => {
    if (sameV3Source(id, host, config)) return { id, tier: null, skip: "SAME_SOURCE", skip_message: "provider shares the configured source identity with the host" };
    if (selected && !selected.includes(id)) return { id, tier: null, unavailable: "NO_CONTINUABLE_SESSION" };
    return { id, tier: null, ...(selected ? { continuation: true } : {}) };
  });
}
const REVIEW_MODES = new Set(["single_round", "adaptive", "full_only", "full_on_structural_rework", "legacy"]);
const DIRECTION_FLOW_STEPS = Object.freeze([
  Object.freeze({ id: "reconstruct", visible: Object.freeze(["raw_requirement", "objective_facts"]), hidden_until: "reveal" }),
  Object.freeze({ id: "reveal", after: Object.freeze(["reconstruct"]), visible: Object.freeze(["current_selection", "alternatives", "selection_rationale", "key_assumptions", "independent_reconstruction"]) }),
  Object.freeze({ id: "challenge", after: Object.freeze(["reveal"]), visible: Object.freeze(["revealed_choice", "independent_reconstruction"]), output: "findings" }),
]);
function validateDirectionReviewFlow(value) {
  const keys = (candidate) => candidate && typeof candidate === "object" && !Array.isArray(candidate) ? Object.keys(candidate).sort() : null;
  const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
  const expectedStepKeys = DIRECTION_FLOW_STEPS.map((step) => Object.keys(step).sort().join("\u0000"));
  const validSteps = Array.isArray(value?.steps) && value.steps.length === DIRECTION_FLOW_STEPS.length && value.steps.every((step, index) =>
    keys(step)?.join("\u0000") === expectedStepKeys[index]
      && step.id === DIRECTION_FLOW_STEPS[index].id
      && same(step.visible, DIRECTION_FLOW_STEPS[index].visible)
      && (!DIRECTION_FLOW_STEPS[index].after || same(step.after, DIRECTION_FLOW_STEPS[index].after))
      && (!DIRECTION_FLOW_STEPS[index].hidden_until || step.hidden_until === DIRECTION_FLOW_STEPS[index].hidden_until)
      && (!DIRECTION_FLOW_STEPS[index].output || step.output === DIRECTION_FLOW_STEPS[index].output));
  const outputKeys = keys(value?.output);
  if (!value || typeof value !== "object" || Array.isArray(value)
      || keys(value)?.join("\u0000") !== ["output", "public_request_count", "steps", "version"].join("\u0000")
      || value.version !== "direction-review.v1"
      || value.public_request_count !== 1
      || !validSteps
      || outputKeys?.join("\u0000") !== ["one_logical_fact", "one_provider_result"].join("\u0000")
      || value.output.one_logical_fact !== true
      || value.output.one_provider_result !== true) {
    fail("PROTOCOL_INCOMPATIBLE", "direction-review.v1 flow is invalid");
  }
  return structuredClone(value);
}
function validateDirectionReviewMaterial(input, checked) {
  const entry = checked?.content_entries?.find((item) => item.target === "direction_flow.json" || item.target.endsWith("/direction_flow.json"));
  if (!input.review_flow) {
    if (entry) fail("MATERIAL_INCOMPLETE", "direction-review.v1 material requires matching review_flow");
    return;
  }
  if (!entry) fail("MATERIAL_INCOMPLETE", "direction-review.v1 material is missing direction_flow.json");
  let material;
  try { material = JSON.parse(entry.contents.toString("utf8")); }
  catch { fail("MATERIAL_INCOMPLETE", "direction_flow.json is not valid JSON"); }
  if (canonicalJson(material) !== canonicalJson(input.review_flow)) fail("MATERIAL_INCOMPLETE", "direction_flow.json does not match the broker request flow");
}
function request(value, config) {
  if (!value || value.version !== 4 || typeof value.prompt !== "string" || value.prompt.length === 0 || !sourceAdapter(value.host_provider, config)) fail("REQUEST_INVALID", "request needs version:4, a non-empty prompt, and a supported host_provider");
  if (value.required_result_protocol !== undefined && !isWorkflowHubResultProtocol(value.required_result_protocol)) fail("PROTOCOL_INCOMPATIBLE", "required result protocol is not supported");
  if (isWorkflowHubResultProtocol(value.required_result_protocol) && !value.attachments) fail("REQUEST_INVALID", "workflowhub result protocols require complete attachments on every round");
  if ([WORKFLOWHUB_RESULT_PROTOCOL_V2, WORKFLOWHUB_RESULT_PROTOCOL_V3].includes(value.required_result_protocol) && (!Array.isArray(value.provider_allowlist) || value.provider_allowlist.length === 0)) fail("REQUEST_INVALID", `${value.required_result_protocol} requires a non-empty configured provider_allowlist candidate group`);
  if (value.continuation !== null && value.continuation !== undefined && (typeof value.continuation !== "object" || typeof value.continuation.runtime_id !== "string")) fail("REQUEST_INVALID", "continuation must be null or contain runtime_id");
  if (value.attachments?.delivery === "negotiated" && value.required_result_protocol !== WORKFLOWHUB_RESULT_PROTOCOL_V3) fail("PROTOCOL_INCOMPATIBLE", "negotiated attachment delivery is only supported by workflowhub-result.v3");
  if (value.deadline_ms !== undefined && value.deadline_ms !== null) fail("PROTOCOL_INCOMPATIBLE", "WorkflowHub requests must not set a provider wall-clock deadline");
  if (value.review_mode !== undefined && (typeof value.review_mode !== "string" || !REVIEW_MODES.has(value.review_mode))) fail("REQUEST_INVALID", "review_mode is unsupported");
  if (value.review_flow !== undefined) {
    if (value.required_result_protocol !== WORKFLOWHUB_RESULT_PROTOCOL_V3) fail("PROTOCOL_INCOMPATIBLE", "direction-review.v1 requires workflowhub-result.v3");
    validateDirectionReviewFlow(value.review_flow);
    if (value.review_mode !== "single_round") fail("PROTOCOL_INCOMPATIBLE", "direction-review.v1 requires single_round review mode");
  }
  if (value.provider_allowlist !== undefined) {
    if (!Array.isArray(value.provider_allowlist) || value.provider_allowlist.length === 0 || new Set(value.provider_allowlist).size !== value.provider_allowlist.length) fail("REQUEST_INVALID", "provider_allowlist must contain unique provider ids");
    if (value.provider_allowlist.some((provider) => typeof provider !== "string" || !config.providers[provider])) fail("PROTOCOL_INCOMPATIBLE", "provider_allowlist contains an unconfigured provider");
    if (value.required_result_protocol !== WORKFLOWHUB_RESULT_PROTOCOL_V2 && value.required_result_protocol !== WORKFLOWHUB_RESULT_PROTOCOL_V3 && value.provider_allowlist.some((provider) => sameSource(provider, value.host_provider, config))) fail("REQUEST_INVALID", "provider_allowlist must contain unique configured heterologous providers");
  }
  const reuseFrozenMaterial = value.continuation?.reuse_frozen_material;
  if (reuseFrozenMaterial !== undefined && reuseFrozenMaterial !== true) fail("REQUEST_INVALID", "continuation.reuse_frozen_material must be true when present");
  if (reuseFrozenMaterial === true && (value.attachments || value.provider_allowlist?.length !== 1)) fail("REQUEST_INVALID", "reuse_frozen_material requires no attachments and exactly one provider_allowlist entry");
  return value;
}
function publicDiagnostic(result, error) {
  return result?.stdout_truncated || result?.stderr_truncated
    ? "provider diagnostic summary truncated; inspect private raw output"
    : error?.message ?? "provider execution failed";
}
function privateAttemptError(error) {
  const code = typeof error?.code === "string" && error.code.length > 0 ? error.code : "INTERNAL_ERROR";
  const message = typeof error?.message === "string" && error.message.length > 0 ? error.message : "provider recovery failed";
  return { code, message: containsPrivatePath(message) ? "provider recovery diagnostic omitted because it contained a private absolute path" : message };
}
export function sumUsage(left, right) {
  if (left === null && right === null) return null;
  if (!left || !right || typeof left !== "object" || typeof right !== "object" || Array.isArray(left) || Array.isArray(right)) return null;
  const leftKeys = Object.keys(left).sort(); const rightKeys = Object.keys(right).sort();
  if (!isDeepStrictEqual(leftKeys, rightKeys)) return null;
  const merge = (leftValue, rightValue, pathParts = []) => {
    const decimalAllowed = pathParts[0] === "cost";
    if (Number.isSafeInteger(leftValue) && leftValue >= 0 && Number.isSafeInteger(rightValue) && rightValue >= 0) {
      const total = leftValue + rightValue;
      return Number.isSafeInteger(total) ? total : null;
    }
    if (decimalAllowed && typeof leftValue === "number" && Number.isFinite(leftValue) && leftValue >= 0
      && typeof rightValue === "number" && Number.isFinite(rightValue) && rightValue >= 0) {
      const total = leftValue + rightValue;
      return Number.isFinite(total) && total >= 0 && total <= Number.MAX_SAFE_INTEGER ? total : null;
    }
    if (!leftValue || !rightValue || typeof leftValue !== "object" || typeof rightValue !== "object" || Array.isArray(leftValue) || Array.isArray(rightValue)) return null;
    const keys = Object.keys(leftValue).sort(); const otherKeys = Object.keys(rightValue).sort();
    if (!isDeepStrictEqual(keys, otherKeys)) return null;
    const result = {};
    for (const key of keys) {
      const value = merge(leftValue[key], rightValue[key], [...pathParts, key]);
      if (value === null) return null;
      result[key] = value;
    }
    return result;
  };
  return merge(left, right);
}
function projectStatus(state) {
  const providerStates = Object.fromEntries(Object.entries(state.providers ?? {}).map(([id, item]) => [id, {
    provider: item.provider, tier: item.tier, status: item.status, started_at_ms: item.started_at_ms, completed_at_ms: item.completed_at_ms,
    process_alive_at_ms: item.process_alive_at_ms, last_progress_at_ms: item.last_progress_at_ms, duration_ms: item.duration_ms,
    retry_count: item.retry_count, progress_events: item.progress_events,
    ...(item.error ? { error: { code: item.error.code, ...(item.error.source ? { source: item.error.source } : {}) } } : {}),
  }]));
  return { version: state.version, runtime_id: state.runtime_id, host_provider: state.host_provider, created_at_ms: state.created_at_ms, expires_at_ms: state.expires_at_ms, round: state.round, last_selected_tier: state.last_selected_tier ?? null, last_completed_at_ms: state.last_completed_at_ms, providers: providerStates };
}

export class Broker {
  constructor(config, options = {}) {
    this.config = config; this.processOptions = { ...options, executionTimeoutMs: null };
    delete this.processOptions.providerExecutionTimeoutMs;
    delete this.processOptions.terminalRecoveryTimeoutMs;
    delete this.processOptions.cancelConfirmationWindowMs;
    this.active = new Map(); this.shuttingDown = false; cleanup(config.runtime.root, config.runtime.ttl_hours);
  }

  async doctor({ attachmentRoot = null } = {}) {
    let attachmentRootStatus = this.#attachmentRootStatus(attachmentRoot);
    const attachmentProbe = new Map();
    if (attachmentRootStatus.status === "ready") {
      for (const provider of Object.values(this.config.providers)) {
        if (!provider.enabled) continue;
        try { probeAttachmentWorkspace(this.config.runtime.root, provider.id, Infinity); attachmentProbe.set(provider.id, true); }
        catch { attachmentProbe.set(provider.id, false); }
      }
      if ([...attachmentProbe.values()].some((ready) => !ready)) attachmentRootStatus = { status: "unavailable", error: { code: "ATTACHMENT_PROBE_FAILED" } };
    }
    const orderedProviderIds = [...new Set(this.config.tiers.flat())];
    const output = await Promise.all(orderedProviderIds.map(async (id) => { const provider = this.config.providers[id];
      const capabilities = adapter(provider.adapter).capabilities;
      const probeFailed = attachmentProbe.get(provider.id) === false;
      const readyCapabilities = probeFailed ? { ...capabilities, attachment_delivery: [] } : capabilities;
      if (!provider.enabled) return { provider: provider.id, status: "disabled", capabilities: readyCapabilities };
      const missing = provider.auth.type === "env" ? provider.auth.env.filter((name) => !process.env[name]) : [];
      if (missing.length) return { provider: provider.id, status: "unavailable", capabilities: readyCapabilities, error: { code: "AUTH_ENV_MISSING", message: missing.join(", ") } };
      if (probeFailed) return { provider: provider.id, status: "unavailable", capabilities: readyCapabilities, error: { code: "ATTACHMENT_PROBE_FAILED", message: "attachment workspace probe failed" } };
      const work = fs.mkdtempSync(path.join(this.config.runtime.root, "doctor-"));
      try { const result = await execute(adapter(provider.adapter).doctor(provider, work), { maxOutputBytes: 65536 }); return result.ok ? { provider: provider.id, status: "ready", verification: "executable_only", capabilities: readyCapabilities } : { provider: provider.id, status: "unavailable", capabilities: readyCapabilities, error: result.error }; }
      finally { fs.rmSync(work, { recursive: true, force: true }); }
    }));
    const attachmentVerification = attachmentRoot ? "workspace_copy_only" : "unverified";
    return { version: 4, material_protocol: MATERIAL_PROTOCOL, result_protocols: [...WORKFLOWHUB_RESULT_PROTOCOLS], capabilities: { attachments: attachmentRootStatus.status !== "unavailable", cancel_source: true }, attachment_root: attachmentRootStatus, verification: attachmentVerification, note: "doctor does not verify model authentication or a real review", providers: output };
  }

  #attachmentRootStatus(attachmentRoot) {
    if (this.config.attachment_roots.length === 0) return { status: "unavailable", error: { code: "ATTACHMENT_ROOT_UNCONFIGURED" } };
    if (!attachmentRoot) return { status: "unverified" };
    try { validateAttachmentRoot(attachmentRoot, this.config.attachment_roots); return { status: "ready" }; }
    catch (error) { return { status: "unavailable", error: { code: publicError(error).code } }; }
  }

  status(runtime_id) { cleanup(this.config.runtime.root, this.config.runtime.ttl_hours); return projectStatus(readRuntime(this.config.runtime.root, runtime_id)); }

  startManaged(raw, request_id) {
    const input = request(raw, this.config); const requestId = opaqueRequestId(request_id);
    // Managed sessions accept v2 AND v3 (2026-09-11). The previous v2-only pin
    // predates negotiated attachment delivery, which is legal only under v3:
    // a provider whose capabilities are ["always_embed"] (codex) could never
    // satisfy file_only, so it failed closed with
    // ATTACHMENT_DELIVERY_UNSUPPORTED before a single review byte was sent.
    // Everything downstream is already protocol-generic: #finish selects the v3
    // result shape, projectWorkflowHubResult projects v3 members, route/sameV3Source
    // handle v3, and v3 groups reject mixed-version members on their own.
    if (![WORKFLOWHUB_RESULT_PROTOCOL_V2, WORKFLOWHUB_RESULT_PROTOCOL_V3].includes(input.required_result_protocol)) {
      fail("PROTOCOL_INCOMPATIBLE", "managed sessions require workflowhub-result.v2 or workflowhub-result.v3");
    }
    const checked = validateAttachments(input.attachments, this.config.runtime.max_attachment_bytes, this.config.attachment_roots);
    validateDirectionReviewMaterial(input, checked);
    const binding_sha256 = managedBinding(input, checked, this.config); const bindingPath = managedRequestPath(this.config.runtime.root, requestId);
    if (fs.existsSync(bindingPath)) {
      const binding = readPrivateJson(bindingPath, "REQUEST_ID_CONFLICT", "request_id binding is unavailable");
      if (binding.request_id !== requestId || binding.binding_sha256 !== binding_sha256) fail("REQUEST_ID_CONFLICT", "request_id is already bound to a different immutable review request");
      return this.managedStatus(binding.runtime_id, binding.operation_id);
    }
    const continuing = input.continuation?.runtime_id; const createdRuntime = !continuing;
    let state = continuing ? readRuntime(this.config.runtime.root, continuing) : createRuntime(this.config.runtime.root, this.config.runtime.ttl_hours, input.host_provider, this.config.runtime.orphan_timeout_ms);
    if (state.host_provider !== input.host_provider) fail("HOST_MISMATCH", "continuation host_provider must match its first round");
    if (continuing && (!state.managed || state.managed.version !== 1)) fail("RUNTIME_INVALID", "managed continuation requires a managed runtime");
    const operation_id = randomUUID(); const runtime = runtimeDirectory(this.config.runtime.root, state.runtime_id);
    const frozen = freezeManagedAttachments(checked, runtime, operation_id);
    const privateRequest = structuredClone(input); privateRequest.attachments = frozen;
    const config_snapshot = structuredClone(this.config);
    config_snapshot.attachment_roots = [...config_snapshot.attachment_roots, { root: frozen.root, sources: frozen.manifest.entries.map((entry) => entry.source) }];
    const providers = input.provider_allowlist.map((id) => {
      const profile = this.config.providers[id]; return { id, adapter: profile.adapter, model: profile.model, effort: profile.effort, thinking: profile.thinking };
    });
    const operation = { version: 1, operation_id, request_id: requestId, binding_sha256, material_id: checked.material_id, result_protocol: input.required_result_protocol, state: "starting", providers, cancel_requested: false, manager: null, group: null, created_at_ms: Date.now() };
    let existingOperation = null;
    try {
      state = updateRuntime(this.config.runtime.root, state.runtime_id, (next) => {
        const active = next.managed?.operations?.find((item) => item.state !== "terminal");
        if (active) {
          if (active.request_id === requestId && active.binding_sha256 === binding_sha256) { existingOperation = active; return next; }
          if (active.request_id === requestId) fail("REQUEST_ID_CONFLICT", "request_id is already bound to a different immutable review request");
          fail("OPERATION_ACTIVE", "a managed operation is already active for this runtime");
        }
        return { ...next, managed: { version: 1, operations: [...(next.managed?.operations ?? []), operation] } };
      });
    } catch (error) {
      discardManagedAttachments(runtime, operation_id); if (createdRuntime) removeRuntimeDirectory(this.config.runtime.root, state.runtime_id); throw error;
    }
    if (existingOperation) { discardManagedAttachments(runtime, operation_id); return this.managedStatus(state.runtime_id, existingOperation.operation_id); }
    let bindingFd = null, bindingIdentity = null, bindingOpenAttempted = false;
    try {
      writePrivateJson(managedJobPath(this.config.runtime.root, state.runtime_id, operation_id), { version: 1, runtime_id: state.runtime_id, operation_id, request: privateRequest, config_snapshot });
      fs.mkdirSync(path.dirname(bindingPath), { recursive: true, mode: 0o700 });
      bindingOpenAttempted = true;
      bindingFd = fs.openSync(bindingPath, "wx", 0o600); bindingIdentity = fs.fstatSync(bindingFd);
      fs.writeFileSync(bindingFd, `${JSON.stringify({ version: 1, request_id: requestId, binding_sha256, runtime_id: state.runtime_id, operation_id })}\n`);
      fs.closeSync(bindingFd); bindingFd = null;
    } catch (error) {
      const bindingWinner = bindingOpenAttempted && bindingFd === null && bindingIdentity === null && error?.code === "EEXIST";
      const cleanupErrors = [];
      if (bindingFd !== null) { try { fs.closeSync(bindingFd); } catch (cleanupError) { cleanupErrors.push(cleanupError); } }
      try {
        // Nothing in this section has launched a manager. Release only this
        // exact operation; prior results/materials and a competing binding
        // winner remain authoritative and must not be removed.
        if (fs.existsSync(runtime)) {
          const current = readRuntime(this.config.runtime.root, state.runtime_id).managed?.operations?.find(item => item.operation_id === operation_id);
          if (current && (current.manager || current.state !== "starting")) throw new Error("managed startup operation advanced before rollback");
          if (createdRuntime) removeRuntimeDirectory(this.config.runtime.root, state.runtime_id);
          else {
            updateRuntime(this.config.runtime.root, state.runtime_id, next => {
              const owned = next.managed.operations.find(item => item.operation_id === operation_id);
              if (owned && (owned.manager || owned.state !== "starting")) throw new Error("managed startup operation advanced before rollback");
              return { ...next, managed: { ...next.managed, operations: next.managed.operations.filter(item => item.operation_id !== operation_id) } };
            });
            discardManagedAttachments(runtime, operation_id);
            fs.rmSync(managedJobPath(this.config.runtime.root, state.runtime_id, operation_id), { force: true });
          }
        }
      } catch (cleanupError) { cleanupErrors.push(cleanupError); }
      try {
        if (bindingIdentity) {
          let named;
          try { named = fs.lstatSync(bindingPath); } catch (cleanupError) { if (cleanupError.code !== "ENOENT") throw cleanupError; }
          if (named) {
            if (named.dev !== bindingIdentity.dev || named.ino !== bindingIdentity.ino) throw new Error("managed binding identity changed before rollback");
            fs.unlinkSync(bindingPath);
          }
        } else if (bindingFd !== null) throw new Error("managed binding ownership could not be verified for rollback");
      } catch (cleanupError) { cleanupErrors.push(cleanupError); }
      if (cleanupErrors.length) throw new AggregateError([error, ...cleanupErrors], `${error.message}; managed startup rollback failed: ${cleanupErrors.map(item => item.message).join("; ")}`, { cause: error });
      if (bindingWinner) {
        const binding = readPrivateJson(bindingPath, "REQUEST_ID_CONFLICT", "request_id binding is unavailable");
        if (binding.request_id === requestId && binding.binding_sha256 === binding_sha256) return this.managedStatus(binding.runtime_id, binding.operation_id);
        fail("REQUEST_ID_CONFLICT", "request_id is already bound to a different immutable review request");
      }
      throw error;
    }
    let manager;
    try { manager = spawn(process.execPath, [managedManagerProgram, this.config.runtime.root, state.runtime_id, operation_id], { detached: true, stdio: "ignore" }); }
    catch { manager = null; }
    const managerIdentity = manager ? processIdentity(manager.pid) : null;
    let latest = readRuntime(this.config.runtime.root, state.runtime_id); let latestOperation = latest.managed.operations.find((item) => item.operation_id === operation_id);
    if (latestOperation?.state === "terminal") {
      manager?.unref();
      const snapshot = assertManagedPublic(managedPublic(latestOperation, latest.runtime_id, latest)); writePrivateJson(managedPublicPath(this.config.runtime.root, latest.runtime_id), snapshot); return snapshot;
    }
    if (!managerIdentity && manager) {
      // `processIdentity` can briefly be unavailable immediately after spawn.
      // The detached manager may already have persisted its own identity or
      // started a provider by the time this parent reads the runtime. Never
      // signal an unverified PID or publish a terminal failure on that basis;
      // return the current nonterminal projection and let managed status plus
      // the runtime guardian confirm a real manager/worker terminal state.
      manager.unref();
      const snapshot = assertManagedPublic(managedPublic(latestOperation, latest.runtime_id, latest));
      writePrivateJson(managedPublicPath(this.config.runtime.root, latest.runtime_id), snapshot);
      return snapshot;
    }
    if (!managerIdentity) {
      // No child was created, so dispatch cannot have started. This is a real
      // start failure rather than a provider-lifetime or PID-reuse inference.
      const group = managedFailureGroup(latest, latestOperation, "SESSION_MANAGER_LOST", config_snapshot, input);
      state = updateRuntime(this.config.runtime.root, latest.runtime_id, (next) => ({ ...next, managed: { ...next.managed, operations: next.managed.operations.map((item) => item.operation_id === operation_id && item.state !== "terminal" ? { ...item, state: "terminal", group, completed_at_ms: Date.now() } : item) } }));
    } else {
      manager.unref(); state = updateRuntime(this.config.runtime.root, latest.runtime_id, (next) => ({ ...next, managed: { ...next.managed, operations: next.managed.operations.map((item) => item.operation_id === operation_id && item.state !== "terminal" ? { ...item, manager: managerIdentity } : item) } }));
    }
    const published = state.managed.operations.find((item) => item.operation_id === operation_id); const snapshot = assertManagedPublic(managedPublic(published, state.runtime_id, state)); writePrivateJson(managedPublicPath(this.config.runtime.root, state.runtime_id), snapshot); return snapshot;
  }

  managedStatus(runtime_id, operation_id = null) {
    const state = readRuntime(this.config.runtime.root, runtime_id); const operations = state.managed?.operations;
    if (!Array.isArray(operations) || operations.length === 0) fail("RUNTIME_NOT_MANAGED", "runtime is not a managed session");
    const operation = operation_id ? operations.find((item) => item.operation_id === operation_id) : operations.at(-1);
    if (!operation) fail("RUNTIME_INVALID", "managed operation is unavailable");
    if (operation.state !== "terminal" && operation.manager && ownerConfirmedDead(operation.manager)) {
      const cleanup = reapRuntimeIfOwnerDead(this.config.runtime.root, runtime_id, { allowManaged: true });
      const refreshed = readRuntime(this.config.runtime.root, runtime_id);
      if (cleanup.running) return assertManagedPublic(managedPublic(operation, runtime_id, refreshed));
      const job = managedJobRecordForTerminal(this.config.runtime.root, runtime_id, operation.operation_id);
      const group = managedFailureGroup(refreshed, operation, operation.cancel_requested ? "CANCELLED" : "SESSION_MANAGER_LOST", job.record?.config_snapshot, job.record?.request, job.diagnostic);
      const updated = updateRuntime(this.config.runtime.root, runtime_id, (next) => ({ ...next, managed: { ...next.managed, operations: next.managed.operations.map((item) => item.operation_id === operation.operation_id && item.state !== "terminal" ? { ...item, state: "terminal", group, completed_at_ms: Date.now() } : item) } }));
      const terminal = updated.managed.operations.find((item) => item.operation_id === operation.operation_id); const snapshot = assertManagedPublic(managedPublic(terminal, runtime_id, updated)); writePrivateJson(managedPublicPath(this.config.runtime.root, runtime_id), snapshot); return snapshot;
    }
    return assertManagedPublic(managedPublic(operation, runtime_id, state));
  }

  cancelManaged(runtime_id) {
    const state = readRuntime(this.config.runtime.root, runtime_id); const operation = state.managed?.operations?.at(-1);
    if (!operation) fail("RUNTIME_NOT_MANAGED", "runtime is not a managed session");
    if (operation.state === "terminal") {
      if (operation.group?.providers?.some((item) => item.error?.code === "SESSION_MANAGER_LOST")) {
        for (const [provider, item] of Object.entries(state.providers ?? {})) if (item.status === "running" && workerIdentityMatches(item.worker)) this.cancel(runtime_id, provider, "user", { managed: true });
        const job = managedJobRecordForTerminal(this.config.runtime.root, runtime_id, operation.operation_id);
        const group = managedFailureGroup(state, operation, "CANCELLED", job.record?.config_snapshot, job.record?.request, job.diagnostic);
        const updated = updateRuntime(this.config.runtime.root, runtime_id, (next) => ({ ...next, managed: { ...next.managed, operations: next.managed.operations.map((item) => item.operation_id === operation.operation_id ? { ...item, group } : item) } }));
        const terminal = updated.managed.operations.find((item) => item.operation_id === operation.operation_id); const snapshot = assertManagedPublic(managedPublic(terminal, runtime_id, updated)); writePrivateJson(managedPublicPath(this.config.runtime.root, runtime_id), snapshot); return snapshot;
      }
      return this.managedStatus(runtime_id, operation.operation_id);
    }
    const updated = updateRuntime(this.config.runtime.root, runtime_id, (next) => ({ ...next, managed: { ...next.managed, operations: next.managed.operations.map((item) => item.operation_id === operation.operation_id ? { ...item, cancel_requested: true } : item) } }));
    for (const profile of operation.providers) requestCancellation(this.config.runtime.root, runtime_id, profile.id, "user");
    for (const [provider, item] of Object.entries(updated.providers ?? {})) if (item.status === "running" && workerIdentityMatches(item.worker)) this.cancel(runtime_id, provider, "user", { managed: true });
    return this.managedStatus(runtime_id, operation.operation_id);
  }

  async runManagedOperation(runtime_id, operation_id, job) {
    const state = readRuntime(this.config.runtime.root, runtime_id); const operation = state.managed?.operations?.find((item) => item.operation_id === operation_id);
    if (!operation) fail("RUNTIME_INVALID", "managed operation is unavailable");
    if (operation.state === "terminal") return operation.group;
    const manager = { ...currentOwnerIdentity(), started_at_ms: Date.now() };
    updateRuntime(this.config.runtime.root, runtime_id, (next) => ({ ...next, owner: manager, managed: { ...next.managed, operations: next.managed.operations.map((item) => item.operation_id === operation_id ? { ...item, state: "running", manager } : item) } }));
    const current = readRuntime(this.config.runtime.root, runtime_id).managed.operations.find((item) => item.operation_id === operation_id);
    let group;
    try {
      if (current.cancel_requested) group = managedFailureGroup(readRuntime(this.config.runtime.root, runtime_id), current, "CANCELLED", job.config_snapshot, job.request);
      else group = await this.run(job.request, { managed_runtime_id: runtime_id });
    } catch { group = managedFailureGroup(readRuntime(this.config.runtime.root, runtime_id), current, "SESSION_MANAGER_LOST", job.config_snapshot, job.request); }
    group = managedTerminalGroup(group, runtime_id, current.material_id);
    const completed = updateRuntime(this.config.runtime.root, runtime_id, (next) => ({ ...next, managed: { ...next.managed, operations: next.managed.operations.map((item) => item.operation_id === operation_id ? { ...item, state: "terminal", group, completed_at_ms: Date.now() } : item) } }));
    const terminal = completed.managed.operations.find((item) => item.operation_id === operation_id); const snapshot = assertManagedPublic(managedPublic(terminal, runtime_id, completed)); writePrivateJson(managedPublicPath(this.config.runtime.root, runtime_id), snapshot); return group;
  }

  shutdown() {
    this.shuttingDown = true;
    const cancelled = [];
    for (const { runtime_id, provider, pid } of this.active.values()) {
      requestCancellation(this.config.runtime.root, runtime_id, provider, "workflow_shutdown");
      if (terminateProcessTree(pid, "SIGTERM")) cancelled.push({ runtime_id, provider });
    }
    return cancelled;
  }

  cancel(runtime_id, provider, source = "user", { managed = false } = {}) {
    const exposeSource = arguments.length >= 3;
    const state = readRuntime(this.config.runtime.root, runtime_id); const item = state.providers?.[provider];
    if (!managed && state.managed?.version === 1) fail("MANAGED_CANCEL_REQUIRED", "managed runtimes may be cancelled only without --provider");
    if (!item || item.status !== "running") return { cancelled: false, reason: "NOT_ACTIVE" };
    // A provider can be between two broker-controlled same-session turns.
    // Preserve an explicit cancel intent even after its first native process
    // exited, so the next turn observes the marker before it is started.
    if (!workerIdentityMatches(item.worker)) {
      requestCancellation(this.config.runtime.root, runtime_id, provider, source);
      return { cancelled: true, ...(exposeSource ? { source } : {}) };
    }
    // Keep cancellation separate from heartbeat state, so another broker
    // process cannot erase this intent with a read-modify-write race.
    requestCancellation(this.config.runtime.root, runtime_id, provider, source);
    const cancelled = terminateProcessTreeWithEscalation(item.pid, item.worker);
    return { cancelled, ...(exposeSource ? { source } : {}) };
  }

  async run(raw, { managed_runtime_id = null } = {}) {
    const input = request(raw, this.config);
    const continuing = input.continuation?.runtime_id; const reuseFrozenMaterial = input.continuation?.reuse_frozen_material === true;
    let state = continuing ? readRuntime(this.config.runtime.root, continuing) : null;
    if (continuing && state.attachments && state.attachments.protocol_version !== MATERIAL_PROTOCOL_VERSION) fail("MATERIAL_PROTOCOL_MISMATCH", "attachment runtime uses an incompatible material protocol");
    const initialChecked = !continuing && input.attachments ? validateAttachments(input.attachments, this.config.runtime.max_attachment_bytes, this.config.attachment_roots) : null;
    if (initialChecked && !isWorkflowHubResultProtocol(input.required_result_protocol) && input.attachments.delivery !== "negotiated") validateFileOnlyTriad(initialChecked);
    // Direction flow is a material/request pair. Validate it before creating
    // a runtime or claiming a provider so a missing request-side flow cannot
    // spend provider work and then fail inside the provider worker.
    if (initialChecked) validateDirectionReviewMaterial(input, initialChecked);
    let deliveryChecked = initialChecked;
    state ??= managed_runtime_id ? readRuntime(this.config.runtime.root, managed_runtime_id) : createRuntime(this.config.runtime.root, this.config.runtime.ttl_hours, input.host_provider, this.config.runtime.orphan_timeout_ms);
    if (managed_runtime_id && continuing && continuing !== managed_runtime_id) fail("RUNTIME_INVALID", "managed continuation runtime does not match its operation runtime");
    if (continuing && state.expires_at_ms <= Date.now()) fail("RUNTIME_EXPIRED", "runtime has expired and cannot be continued");
    if (state.host_provider !== input.host_provider) fail("HOST_MISMATCH", "continuation host_provider must match its first round");
    let continuationMaterial = null;
    if (continuing) {
      const hasContinuableSession = Object.values(state.providers ?? {}).some((item) => continuationEligible(item, null, true) && hasSession(item));
      if (reuseFrozenMaterial && !state.attachments) fail("MATERIAL_INCOMPLETE", "reuse_frozen_material requires frozen initial material");
      if (state.attachments && !input.attachments && hasContinuableSession && !reuseFrozenMaterial) fail("MATERIAL_INCOMPLETE", "continuation requires an independent delta attachment triad");
      if (!state.attachments && input.attachments) fail("MATERIAL_INCOMPLETE", "continuation cannot add attachments to an attachment-free initial round");
      if (state.attachments && input.attachments) {
        if (input.attachments.delivery !== state.attachments.requested_delivery) fail("MATERIAL_INCOMPLETE", "continuation attachment delivery must match the initial delivery mode");
        const checked = validateAttachments(input.attachments, this.config.runtime.max_attachment_bytes, this.config.attachment_roots);
        const binding = isWorkflowHubResultProtocol(input.required_result_protocol)
          ? { sequence: (state.continuation_materials ?? []).length + 1, delivery_manifest_hash: canonicalDeliveryManifestHash(checked.bundle_id, checked.files, checked.requested_delivery) }
          : validateContinuationTriad(checked, state);
        deliveryChecked = checked;
        const previous = state.continuation_materials ?? [];
        continuationMaterial = { sequence: binding.sequence, workspace_round: state.round + 1, bundle_id: checked.bundle_id, manifest_hash: checked.manifest_hash, material_id: checked.material_id, delivery_manifest_hash: binding.delivery_manifest_hash, initial_material_manifest_hash: state.attachments.manifest_hash,
          previous_delivery_manifest_hash: previous.length ? previous.at(-1).delivery_manifest_hash : null };
      }
    } else if (input.attachments) {
      const checked = initialChecked;
      state = updateRuntime(this.config.runtime.root, state.runtime_id, (next) => ({ ...next, attachments: { protocol_version: MATERIAL_PROTOCOL_VERSION, requested_delivery: checked.requested_delivery, bundle_id: checked.bundle_id, manifest_hash: checked.manifest_hash, files: checked.files } }));
    }
    const allowlist = input.provider_allowlist ? new Set(input.provider_allowlist) : null;
    const selected = continuing ? Object.keys(state.providers).filter((id) => this.config.providers[id] && !(input.required_result_protocol === WORKFLOWHUB_RESULT_PROTOCOL_V3 ? sameV3Source(id, input.host_provider, this.config) : sameSource(id, input.host_provider, this.config)) && (!allowlist || allowlist.has(id)) && continuationEligible(state.providers[id], continuationMaterial) && hasSession(state.providers[id]) && (!continuationMaterial || providerHasContinuationPredecessor(state, id, state.providers[id].session_id, continuationMaterial.sequence))) : null;
    const entries = continuing
      ? input.required_result_protocol === WORKFLOWHUB_RESULT_PROTOCOL_V2
        ? workflowHubV2GroupEntries(input.provider_allowlist, input.host_provider, this.config, selected)
        : input.required_result_protocol === WORKFLOWHUB_RESULT_PROTOCOL_V3
          ? workflowHubV3GroupEntries(input.provider_allowlist, input.host_provider, this.config, selected)
        : selected.map((id) => ({ id, tier: null, continuation: true }))
      : this.#route(input.host_provider, allowlist, input.required_result_protocol);
    const output = []; if (continuing && entries.length === 0) { const unavailableProvider = [WORKFLOWHUB_RESULT_PROTOCOL_V2, WORKFLOWHUB_RESULT_PROTOCOL_V3].includes(input.required_result_protocol) ? input.provider_allowlist[0] : input.required_result_protocol === WORKFLOWHUB_RESULT_PROTOCOL_V1 && input.provider_allowlist?.length === 1 ? input.provider_allowlist[0] : null; const result = { provider: unavailableProvider, status: "failed", error: { code: "NO_CONTINUABLE_SESSION", message: "no successful provider session is available" } }; return this.#finish(state.runtime_id, input, [isWorkflowHubResultProtocol(input.required_result_protocol) ? projectWorkflowHubResult(input.required_result_protocol, result, deliveryChecked, this.config.providers[unavailableProvider], state.runtime_id, null, unavailableProvider, input) : result], null); }
    if (continuing) output.push(...await Promise.all(entries.map((entry) => this.#runProvider(state.runtime_id, input, entry, continuationMaterial, deliveryChecked))));
    else {
      for (const tier of entries) {
        const results = await Promise.all(tier.map((entry) => this.#runProvider(state.runtime_id, input, entry, null, deliveryChecked))); output.push(...results);
        if (results.some((result) => result.status === "completed")) return this.#finish(state.runtime_id, input, output, tier[0]?.tier ?? null);
        if (results.some((result) => result.status === "cancelled")) return this.#finish(state.runtime_id, input, output, null);
      }
    }
    return this.#finish(state.runtime_id, input, output, null);
  }

  #route(host, allowlist = null, protocol = null) {
    // WorkflowHub v2 sends an explicit candidate group. Retain caller order,
    // but execute at most one profile per CLI adapter. A same-host candidate
    // and each later duplicate adapter remain public SAME_SOURCE results.
    if (protocol === WORKFLOWHUB_RESULT_PROTOCOL_V2 && allowlist) return [workflowHubV2GroupEntries([...allowlist], host, this.config)];
    if (protocol === WORKFLOWHUB_RESULT_PROTOCOL_V3 && allowlist) return [workflowHubV3GroupEntries([...allowlist], host, this.config)];
    return this.config.tiers.map((tier, index) => {
      const entries = tier.filter((id) => !allowlist || allowlist.has(id)).map((id) => sameSource(id, host, this.config) ? { id, tier: index, skip: "SAME_SOURCE" } : { id, tier: index });
      return allowlist ? entries : entries.filter((entry) => !entry.skip);
    });
  }
  async #runProvider(runtime_id, input, entry, continuationMaterial, deliveryChecked) {
    const profile = this.config.providers[entry.id] ?? null;
    const project = (value) => {
      if (!isWorkflowHubResultProtocol(input.required_result_protocol)) return value;
      const persisted = value.provider ? readRuntime(this.config.runtime.root, runtime_id).providers?.[value.provider] ?? null : null;
      return projectWorkflowHubResult(input.required_result_protocol, value, deliveryChecked, profile, runtime_id, persisted, entry.id, input);
    };
    if (cancellationRequested(this.config.runtime.root, runtime_id, entry.id)) {
      const source = cancellationSource(this.config.runtime.root, runtime_id, entry.id);
      return project({ provider: entry.id, tier: entry.tier, status: "cancelled", cancellation_source: source, error: { code: "CANCELLED", message: "cancel was requested before provider dispatch", source } });
    }
    if (this.shuttingDown) return project({ provider: entry.id, tier: entry.tier, status: "cancelled", cancellation_source: "workflow_shutdown", error: { code: "CANCELLED", message: "broker is shutting down", source: "workflow_shutdown" } });
    if (entry.skip) return project({ provider: entry.id, tier: entry.tier, status: "skipped", error: { code: entry.skip, message: entry.skip_message ?? "host provider cannot review itself" } });
    if (entry.unavailable) return project({ provider: entry.id, tier: entry.tier, status: "failed", error: { code: entry.unavailable, message: "no successful provider session is available" } });
    const provider = this.config.providers[entry.id];
    if (!provider) return project({ provider: entry.id, tier: entry.tier, status: "failed", error: { code: "PROVIDER_NOT_CONFIGURED", message: "provider is absent from the current config" } });
    if (!provider.enabled) return project({ provider: entry.id, tier: entry.tier, status: "skipped", error: { code: "PROVIDER_DISABLED", message: "disabled in config" } });
    const missing = provider.auth.type === "env" ? provider.auth.env.filter((name) => !process.env[name]) : [];
    if (missing.length) return project({ provider: entry.id, tier: entry.tier, status: "failed", error: { code: "AUTH_ENV_MISSING", message: missing.join(", ") } });
    const claim = claimProvider(this.config.runtime.root, runtime_id, entry.id, this.config.runtime.orphan_timeout_ms);
    if (!claim) return project({ provider: entry.id, tier: entry.tier, status: "failed", error: { code: "PROVIDER_BUSY", message: "provider is claimed by another broker" } });
    try { return project(await this.#runClaimedProvider(runtime_id, input, entry, provider, continuationMaterial, deliveryChecked)); }
    finally { releaseProviderClaim(claim); }
  }
  async #runClaimedProvider(runtime_id, input, entry, provider, continuationMaterial, deliveryChecked) {
    const prompt = input.prompt;
    const state = readRuntime(this.config.runtime.root, runtime_id); const prior = state.providers[entry.id]; if (prior?.status === "running" && workerIdentityMatches(prior.worker)) return { provider: entry.id, tier: entry.tier, status: "failed", error: { code: "PROVIDER_BUSY", message: "provider has an active process" } };
    const runtime = runtimeDirectory(this.config.runtime.root, runtime_id); const worker = adapter(provider.adapter); let cwd; let providerPrompt = renderProviderPrompt(worker, prompt); let deliveryUsed = prior?.delivery_used ?? null; let delivery = prior?.delivery ?? null; let attachmentKey = entry.id; let attachmentStored = null;
    try {
      if (input.attachments) {
        // Decide delivery before a provider workspace or prompt is rendered.
        // file_only never materializes the packet into a request string.
        if (!deliveryChecked) fail("MATERIAL_INCOMPLETE", "validated sealed material is unavailable");
        const checked = deliveryChecked;
        attachmentKey = entry.continuation ? `${entry.id}-delta-${state.round + 1}` : entry.id;
        deliveryUsed = input.attachments.delivery;
        if (deliveryUsed === "file_only" && !isWorkflowHubResultProtocol(input.required_result_protocol)) validateFileOnlyTriad(checked);
        validateDirectionReviewMaterial(input, checked);
        const planned = planDelivery(worker, checked, prompt, this.config.runtime.max_prompt_bytes, { requireTriad: !isWorkflowHubResultProtocol(input.required_result_protocol) });
        deliveryUsed = planned.delivery_mode;
        delivery = { delivery_mode: planned.delivery_mode, sealed_manifest_hash: checked.manifest_hash, provider_visible_manifest_hash: planned.material_manifest_hash, material_total_bytes: planned.material_total_bytes, ...(planned.rendered_prompt_bytes !== undefined ? { rendered_prompt_bytes: planned.rendered_prompt_bytes } : {}), provider_visible_attachment_manifest: planned.provider_visible_attachment_manifest };
        if (entry.continuation) {
          verifyFrozenAttachments(runtime, entry.id, state.attachments);
          if (timeoutRetryEligible(prior, continuationMaterial)) {
            if (prior.delivery?.delivery_mode !== delivery.delivery_mode || prior.delivery?.sealed_manifest_hash !== delivery.sealed_manifest_hash || prior.delivery?.provider_visible_manifest_hash !== delivery.provider_visible_manifest_hash) fail("MATERIAL_INCOMPLETE", "timeout retry delivery does not match its unpublished material");
          } else {
            const priorMaterial = lastProviderMaterial(state, entry.id, prior?.session_id);
            const expectedMaterialHash = priorMaterial?.manifest_hash ?? state.attachments.manifest_hash;
            if (prior?.delivery?.provider_visible_manifest_hash !== expectedMaterialHash) fail("MATERIAL_INCOMPLETE", "continuation delivery record does not match its provider/session material chain");
          }
          this.#reserveContinuationMaterial(runtime_id, continuationMaterial, entry.id, prior?.session_id);
        }
        const prepared = prepareCheckedAttachments(checked, runtime, attachmentKey);
        verifyFrozenAttachments(runtime, attachmentKey, prepared);
        attachmentStored = prepared; delivery = { ...delivery, byte_identity: "verified" };
        providerPrompt = planned.provider_prompt;
        if (deliveryUsed === "always_embed") { cwd = path.join(runtime, "embed", provider.runtime_key); fs.mkdirSync(cwd, { recursive: true, mode: 0o700 }); }
        else cwd = prepared.cwd;
      } else if (entry.continuation && state.attachments) {
        deliveryUsed = prior?.delivery_used; delivery = prior?.delivery ?? null; let frozenKey = entry.id; let providerStored = state.attachments;
        if (input.continuation?.reuse_frozen_material) {
          const latest = lastProviderMaterial(state, entry.id, prior?.session_id);
          if (latest) {
            if (delivery?.sealed_manifest_hash !== latest.manifest_hash || delivery?.provider_visible_manifest_hash !== latest.manifest_hash) fail("MATERIAL_INCOMPLETE", "continuation delivery record does not match the latest provider/session material");
            frozenKey = `${entry.id}-delta-${latest.workspace_round ?? latest.sequence + 1}`;
            providerStored = frozenDescriptor(runtime, frozenKey, latest, deliveryUsed, delivery.provider_visible_attachment_manifest);
          } else if (delivery?.sealed_manifest_hash !== state.attachments.manifest_hash || delivery?.provider_visible_manifest_hash !== state.attachments.manifest_hash) fail("MATERIAL_INCOMPLETE", "continuation delivery record does not match initial material");
        }
        const frozen = verifyFrozenAttachments(runtime, frozenKey, providerStored); attachmentKey = frozenKey; attachmentStored = providerStored;
        if (!worker.capabilities?.attachment_delivery?.includes(deliveryUsed)) fail("ATTACHMENT_DELIVERY_UNSUPPORTED", "provider attachment capability changed since the first round");
        if (!delivery || delivery.delivery_mode !== deliveryUsed || delivery.provider_visible_manifest_hash !== providerStored.manifest_hash || delivery.byte_identity !== "verified" || !Array.isArray(delivery.provider_visible_attachment_manifest)) fail("MATERIAL_INCOMPLETE", "continuation delivery record does not match frozen material");
        if (deliveryUsed === "always_embed") { cwd = path.join(runtime, "embed", provider.runtime_key); if (!fs.existsSync(cwd)) fail("ATTACHMENT_IMMUTABLE", "embedded provider workspace is unavailable"); }
        else cwd = frozen.cwd;
      } else { cwd = path.join(runtime, "workspace", provider.runtime_key); fs.mkdirSync(path.join(cwd, "skills"), { recursive: true, mode: 0o700 }); }
      if (worker.requiresWritableCwd && worker.stableContinuationCwd && attachmentStored) cwd = refreshWritableAttachmentView(runtime, entry.id, attachmentKey, attachmentStored).cwd;
      else if (worker.requiresWritableCwd && attachmentStored) cwd = prepareWritableAttachmentView(runtime, attachmentKey, attachmentStored).cwd;
      else if (worker.requiresWritableCwd && worker.stableContinuationCwd && state.attachments) cwd = refreshWritableAttachmentView(runtime, entry.id, attachmentKey, attachmentStored ?? state.attachments).cwd;
      else if (worker.requiresWritableCwd && state.attachments) cwd = prepareWritableAttachmentView(runtime, entry.id, state.attachments).cwd;
    } catch (error) { return this.#setupFailure(runtime_id, entry, deliveryUsed, delivery, error, entry.continuation && prior?.status === "completed", continuationMaterial, prior?.session_id); }
    let plan; let providerCwd;
    try {
      const bundle = deliveryUsed === "file_only" ? (fs.existsSync(path.join(cwd, "bundle")) ? path.join(cwd, "bundle") : cwd) : null;
      // file_only has no provider-visible file except the frozen bundle. The
      // prompt is delivered by stdin; legacy review-input.md stays host-only.
      if (!worker.promptViaStdin && deliveryUsed !== "file_only") fs.writeFileSync(path.join(cwd, "review-input.md"), providerPrompt, { mode: 0o600 });
      providerCwd = worker.runFromWritableRoot ? cwd : worker.requiresWritableCwd && worker.stableContinuationCwd ? (bundle ?? cwd) : worker.requiresWritableCwd ? cwd : (bundle ?? cwd);
      plan = entry.continuation ? worker.resume(provider, providerCwd, prior.session_id, providerPrompt, runtime) : worker.start(provider, providerCwd, providerPrompt, runtime);
      if (typeof worker.probeSession === "function") plan = { ...plan, probeSession: (ctx) => worker.probeSession({ ...ctx, provider, cwd: providerCwd, runtime }) };
      if (bundle && worker.requiresWritableCwd) verifyWritableAttachmentView(runtime, worker.stableContinuationCwd ? entry.id : attachmentKey, attachmentStored ?? state.attachments);
      else if (bundle) verifyFrozenAttachments(runtime, attachmentKey, attachmentStored ?? state.attachments);
    }
    catch (error) { return this.#setupFailure(runtime_id, entry, deliveryUsed, delivery, error, entry.continuation && prior?.status === "completed", continuationMaterial, prior?.session_id); }
    const touch = (patch) => updateRunningProvider(this.config.runtime.root, runtime_id, entry.id, patch);
    let attemptSequence = state.providers?.[entry.id]?.attempts?.length ?? 0;
    const processOutcome = (attempt) => attempt.ok ? "ok" : attempt.error?.code === "PROCESS_TIMEOUT" ? "timeout" : attempt.error?.code === "PROCESS_START_FAILED" ? "launch_failure" : "exit_nonzero";
    const parseOutcome = (parsed) => {
      if (!parsed || typeof parsed !== "object") return null;
      if (parsed.ok === true) return "ok";
      return ["empty_output", "invalid"].includes(parsed.parse_outcome) ? parsed.parse_outcome : null;
    };
    const finalizeAttempt = (attempt, parsed = null, override = null) => {
      if (!attempt?.attempt_id) return;
      const processError = attempt.ok ? null : attempt.error ?? { code: "PROCESS_EXIT_NONZERO", message: "provider attempt failed" };
      const processStatus = attempt.ok ? "completed" : attempt.error?.code === "CANCELLED" ? "cancelled" : "failed";
      const parseValue = parsed && typeof parsed === "object" ? parsed : null;
      const status = override?.status ?? (attempt.ok ? parseValue?.ok === false ? "failed" : "completed" : processStatus);
      const error = override && Object.hasOwn(override, "error")
        ? override.error
        : attempt.ok ? parseValue?.ok === false ? parseValue.error ?? { code: "PROVIDER_OUTPUT_INVALID", message: "provider output was invalid" } : null : processError;
      updateRuntime(this.config.runtime.root, runtime_id, (next) => {
        const provider = next.providers?.[entry.id];
        const attempts = provider?.attempts ?? [];
        const attemptIndex = attempts.reduce((found, item, index) => item.attempt_id === attempt.attempt_id ? index : found, -1);
        return {
          ...next,
          providers: {
            ...next.providers,
            [entry.id]: {
              ...provider,
              attempts: attempts.map((item, index) => index === attemptIndex
                ? { ...item, status, error, process_outcome: processOutcome(attempt), parse_outcome: parseOutcome(parseValue) }
                : item),
            },
          },
        };
      });
    };
    const runAttempt = async (attemptPlan, capture, { session_id = null, provider_started_at_ms = null, kind = "initial" } = {}) => {
      // The process runner measures duration from its own start/finish clock,
      // while the old record used a later Date.now() for completed_at_ms.
      // Those two clocks can differ by a few milliseconds and make the v3
      // public contract reject an otherwise valid provider result. Keep one
      // canonical start for the attempt and derive completion from duration.
      let effectiveStartedAtMs = null;
      const options = {
        ...this.processOptions,
        maxOutputBytes: this.config.runtime.max_output_bytes,
        // A single JSONL protocol event may legitimately be as large as the
        // whole output budget: a review response (or a provider echoing a
        // large material) is one line. Leaving this at the 1 MiB default
        // killed providers whose answer exceeded it (observed: pi emitted
        // "an event larger than 1048576 bytes" -> process exit 1 ->
        // PROVIDER_OUTPUT_INVALID). Bound it by the same declared budget.
        maxPendingLineBytes: this.config.runtime.max_output_bytes,
        // Health/liveness are observation signals; wall-clock duration is
        // never a provider stop condition. Only explicit cancel or confirmed
        // owner loss may terminate a live review.
        acceptSemanticOutputAfterStdinClose: true,
        executionTimeoutMs: null,
        livenessIntervalMs: this.config.runtime.liveness_interval_ms,
        isCancelled: () => cancellationRequested(this.config.runtime.root, runtime_id, entry.id),
        validateCompleted: (raw) => (attemptPlan.parseLive?.() ?? worker.parse(raw.stdout, raw.stderr, attemptPlan.expectedSession)).ok,
        onStart: (pid) => {
          this.processOptions.onStart?.(pid); const current = Date.now();
          if (effectiveStartedAtMs === null) effectiveStartedAtMs = current;
          const providerStartedAtMs = provider_started_at_ms ?? current;
          this.active.set(`${runtime_id}:${entry.id}`, { runtime_id, provider: entry.id, pid });
          updateRuntime(this.config.runtime.root, runtime_id, (next) => ({
            ...next,
            owner: { ...currentOwnerIdentity(), started_at_ms: current },
            providers: {
              ...next.providers,
              [entry.id]: {
                ...(provider_started_at_ms === null ? {} : next.providers?.[entry.id] ?? {}),
                provider: entry.id, tier: entry.tier, status: "running", pid, worker: processIdentity(pid), started_at_ms: providerStartedAtMs,
                process_alive_at_ms: current, last_progress_at_ms: null, session_id,
                ...(deliveryUsed ? { delivery_used: deliveryUsed } : {}), ...(delivery ? { delivery } : {}),
              },
            },
          }));
          ensureRuntimeGuardian(this.config.runtime.root, runtime_id);
          if (this.shuttingDown || cancellationRequested(this.config.runtime.root, runtime_id, entry.id)) {
            if (this.shuttingDown) requestCancellation(this.config.runtime.root, runtime_id, entry.id, "workflow_shutdown");
            terminateProcessTree(pid, "SIGTERM");
          }
        },
        onLiveness: () => touch({ process_alive_at_ms: Date.now() }),
        onProgress: ({ at_ms, session_id: observedSession }) => touch({ last_progress_at_ms: at_ms, ...(observedSession ? { session_id: observedSession } : {}) }),
      };
      const attempt = await execute({ ...attemptPlan, onOutput: capture.write, onHealthDiagnostic: (diagnostic) => touch({ last_health_diagnostic: diagnostic }) }, options);
      this.active.delete(`${runtime_id}:${entry.id}`);
      const durationMs = attempt.duration_ms ?? null;
      const canonicalStartedAtMs = effectiveStartedAtMs ?? (durationMs === null ? null : Math.max(0, Date.now() - durationMs));
      const canonicalCompletedAtMs = canonicalStartedAtMs === null
        ? Date.now()
        : durationMs === null
          ? Math.max(canonicalStartedAtMs, Date.now())
          : canonicalStartedAtMs + durationMs;
      const attempt_id = `${entry.id}-attempt-${++attemptSequence}`;
      const processError = attempt.ok ? null : attempt.error ?? { code: "PROCESS_EXIT_NONZERO", message: "provider attempt failed" };
      updateRuntime(this.config.runtime.root, runtime_id, (next) => ({
        ...next,
        providers: {
          ...next.providers,
          [entry.id]: {
            ...next.providers?.[entry.id],
            attempts: [...(next.providers?.[entry.id]?.attempts ?? []), {
              attempt_id,
              kind,
              status: attempt.ok ? "completed" : attempt.error?.code === "CANCELLED" ? "cancelled" : "failed",
              process_outcome: processOutcome(attempt),
              parse_outcome: null,
              started_at_ms: canonicalStartedAtMs,
              completed_at_ms: canonicalCompletedAtMs,
              duration_ms: durationMs,
              session_id: attempt.session_id ?? session_id ?? null,
              error: processError,
              provider_retry_count: Number.isSafeInteger(attempt.retry_count) && attempt.retry_count >= 0 ? attempt.retry_count : 0,
            }],
          },
        },
      }));
      return { ...attempt, attempt_id };
    };
    let rawCapture = this.#openRawCapture(runtime, provider.runtime_key);
    let parseOutput = (stdout, stderr) => plan.parseLive?.() ?? worker.parse(stdout, stderr, plan.expectedSession);
    let result = await runAttempt(plan, rawCapture, { session_id: entry.continuation ? prior?.session_id ?? null : null, kind: entry.continuation ? "continuation" : "initial" });
    let { refs: rawRefs, error: rawCaptureError } = rawCapture.finish();
    let cancelled = cancellationRequested(this.config.runtime.root, runtime_id, entry.id);
    let telemetry = { retry_count: result.retry_count, api_empty_response_count: result.retry_count, progress_events: result.progress_events, last_progress_at_ms: result.last_progress_at_ms };
    let privateRewrite = null;
    let terminalRecovery = null;
    const privateRecovery = () => terminalRecovery ? { terminal_recovery: terminalRecovery } : {};
    const deliveryOutcome = deliveryUsed ? { delivery_used: deliveryUsed, ...(delivery ? { delivery } : {}) } : {};
    const recoveryCounts = () => {
      const attempts = readRuntime(this.config.runtime.root, runtime_id).providers?.[entry.id]?.attempts ?? [];
      return {
        fresh_execution_retry_count: attempts.filter((attempt) => attempt.kind === "fresh_execution").length,
        same_session_repair_count: attempts.filter((attempt) => attempt.kind === "same_session_repair").length,
      };
    };
    const recoveryDecision = (code, resume_available = true) => decideRecovery({ code, resume_available, ...recoveryCounts() });
    const attachProbe = (nextPlan) => typeof worker.probeSession === "function"
      ? { ...nextPlan, probeSession: (ctx) => worker.probeSession({ ...ctx, provider, cwd: providerCwd, runtime }) }
      : nextPlan;
    const runFreshExecution = async (baseResult) => {
      let retryPlan = null;
      try { retryPlan = attachProbe(worker.start(provider, providerCwd, providerPrompt, runtime)); } catch { retryPlan = null; }
      if (!retryPlan) return null;
      const retryCapture = this.#openRawCapture(runtime, provider.runtime_key);
      const baseDuration = Number.isSafeInteger(baseResult?.duration_ms) ? baseResult.duration_ms : 0;
      const providerStartedAt = readRuntime(this.config.runtime.root, runtime_id).providers?.[entry.id]?.started_at_ms ?? Date.now() - baseDuration;
      const retried = await runAttempt(retryPlan, retryCapture, { provider_started_at_ms: providerStartedAt, kind: "fresh_execution" });
      const { refs, error: captureError } = retryCapture.finish();
      return {
        plan: retryPlan,
        capture: retryCapture,
        refs,
        captureError,
        result: { ...retried, duration_ms: baseDuration + (retried.duration_ms ?? 0), usage: sumUsage(baseResult?.usage ?? null, retried.usage ?? null) },
      };
    };
    const runSameSessionRepair = async (baseResult, session_id) => {
      if (typeof session_id !== "string" || session_id.length === 0 || worker.capabilities?.continuation !== true || typeof worker.resume !== "function") return null;
      let recoveryPlan = null;
      try { recoveryPlan = attachProbe(worker.resume(provider, providerCwd, session_id, providerPrompt, runtime)); } catch { recoveryPlan = null; }
      if (!recoveryPlan) return null;
      const recoveryCapture = this.#openRawCapture(runtime, provider.runtime_key);
      const baseDuration = Number.isSafeInteger(baseResult?.duration_ms) ? baseResult.duration_ms : 0;
      const providerStartedAt = readRuntime(this.config.runtime.root, runtime_id).providers?.[entry.id]?.started_at_ms ?? Date.now() - baseDuration;
      const recovered = await runAttempt(recoveryPlan, recoveryCapture, { session_id, provider_started_at_ms: providerStartedAt, kind: "same_session_repair" });
      const { refs, error: captureError } = recoveryCapture.finish();
      return {
        plan: recoveryPlan,
        capture: recoveryCapture,
        refs,
        captureError,
        result: { ...recovered, duration_ms: baseDuration + (recovered.duration_ms ?? 0), usage: sumUsage(baseResult?.usage ?? null, recovered.usage ?? null), session_id: recovered.session_id ?? session_id },
      };
    };
    if (rawCaptureError) {
      const error = rawCaptureFailure(rawCaptureError); finalizeAttempt(result, { ok: false, error });
      return this.#store(runtime_id, entry, { status: "failed", duration_ms: result.duration_ms, ...telemetry, ...rawRefs, ...deliveryOutcome, error });
    }
    if (cancelled) {
      this.#releaseContinuationReservation(runtime_id, continuationMaterial, entry.id, prior?.session_id);
      const source = cancellationSource(this.config.runtime.root, runtime_id, entry.id); const invalidSource = source === INVALID_CANCELLATION_SOURCE;
      const error = invalidSource ? { code: "CANCEL_SOURCE_INVALID", message: "cancel marker source is invalid", source } : { code: "CANCELLED", message: `cancel was requested by ${source}`, source };
      finalizeAttempt(result, null, { status: "cancelled", error });
      return this.#store(runtime_id, entry, { status: "cancelled", duration_ms: result.duration_ms, ...telemetry, ...rawRefs, ...deliveryOutcome, cancellation_source: source, error });
    }
    // A prompt-only Cursor review carries no bundle, so any tool call the agent
    // attempts is denied by supervision and kills the turn. The adapter marks
    // exactly those runs retryable and re-renders the prompt with a hardened
    // no-tools constraint. This never relaxes a permission boundary: the retry
    // is a fresh denied-by-default turn, and only a run that shipped no
    // attachments can request it, so file_only stays terminal on denial.
    if (!result.ok && result.error?.code === "PROVIDER_PERMISSION_DENIED" && plan.promptOnlyRetry === true
      && !input.attachments && !deliveryUsed && typeof worker.retryPromptOnly === "function"
      && !cancellationRequested(this.config.runtime.root, runtime_id, entry.id)) {
      let retryPlan = null;
      try { retryPlan = worker.retryPromptOnly(provider, providerCwd, providerPrompt, runtime); } catch { retryPlan = null; }
      if (retryPlan) {
        const retryCapture = this.#openRawCapture(runtime, provider.runtime_key);
        const retried = await runAttempt(retryPlan, retryCapture, { kind: "fresh_execution" });
        const { refs: retryRefs, error: retryCaptureError } = retryCapture.finish();
        // The first attempt's transcript stays sealed in the private raw store.
        // Telemetry accumulates across both attempts so the extra turn is a
        // recorded fact rather than a hidden one.
        telemetry = {
          retry_count: telemetry.retry_count + retried.retry_count + 1,
          api_empty_response_count: telemetry.api_empty_response_count + retried.retry_count,
          progress_events: telemetry.progress_events + retried.progress_events,
          last_progress_at_ms: retried.last_progress_at_ms ?? telemetry.last_progress_at_ms,
        };
        result = { ...retried, duration_ms: result.duration_ms + retried.duration_ms };
        rawCapture = retryCapture; rawRefs = retryRefs;
        if (retryCaptureError) {
          const error = rawCaptureFailure(retryCaptureError); finalizeAttempt(retried, { ok: false, error });
          return this.#store(runtime_id, entry, { status: "failed", duration_ms: result.duration_ms, ...telemetry, ...rawRefs, ...deliveryOutcome, error });
        }
        if (retried.ok) {
          plan = retryPlan;
          parseOutput = (stdout, stderr) => retryPlan.parseLive?.() ?? worker.parse(stdout, stderr, retryPlan.expectedSession);
        }
      }
    }
    if (input.required_result_protocol === WORKFLOWHUB_RESULT_PROTOCOL_V3 && !result.ok
      && (!["single_round", "full_only"].includes(input.review_mode) || result.error?.code === "PROCESS_TIMEOUT")
      && !cancellationRequested(this.config.runtime.root, runtime_id, entry.id)) {
      const recoverySession = result.session_id ?? null;
      const resumeAvailable = typeof recoverySession === "string" && recoverySession.length > 0
        && worker.capabilities?.continuation === true && typeof worker.resume === "function";
      const terminalRecoveryAvailable = result.error?.code === "PROVIDER_NO_TERMINAL_RESULT"
        && typeof recoverySession === "string" && recoverySession.length > 0
        && input.review_mode !== "full_only" && worker.capabilities?.terminal_recovery === true
        && typeof worker.terminalRecoveryPrompt === "string" && typeof worker.resume === "function"
        && (!entry.continuation || recoverySession === prior?.session_id);
      const decision = recoveryDecision(result.error?.code, resumeAvailable);
      let retry = null;
      if (decision.action === "fresh_execution" && decision.allowed) {
        retry = await runFreshExecution(result);
      } else if (decision.action === "same_session_repair" && decision.allowed && !terminalRecoveryAvailable) {
        retry = await runSameSessionRepair(result, recoverySession);
        if (!retry) {
          const freshFallback = recoveryDecision(result.error?.code, false);
          if (freshFallback.action === "fresh_execution" && freshFallback.allowed) retry = await runFreshExecution(result);
        }
      }
      if (retry) {
        telemetry = {
          retry_count: telemetry.retry_count + retry.result.retry_count + 1,
          api_empty_response_count: telemetry.api_empty_response_count + retry.result.retry_count,
          progress_events: telemetry.progress_events + retry.result.progress_events,
          last_progress_at_ms: retry.result.last_progress_at_ms ?? telemetry.last_progress_at_ms,
        };
        result = retry.result; rawCapture = retry.capture; rawRefs = retry.refs;
        if (retry.captureError) {
          const error = rawCaptureFailure(retry.captureError); finalizeAttempt(result, { ok: false, error });
          result = { ...result, ok: false, error };
        } else if (retry.result.ok) {
          plan = retry.plan;
          parseOutput = (stdout, stderr) => retry.plan.parseLive?.() ?? worker.parse(stdout, stderr, retry.plan.expectedSession);
        }
      }
    }
    if (!result.ok && result.error?.code === "PROVIDER_NO_TERMINAL_RESULT" && typeof result.session_id === "string" && result.session_id.length > 0
      && input.review_mode !== "full_only"
      && worker.capabilities?.terminal_recovery === true && typeof worker.terminalRecoveryPrompt === "string" && typeof worker.resume === "function"
      && (!entry.continuation || result.session_id === prior?.session_id)
      && !cancellationRequested(this.config.runtime.root, runtime_id, entry.id)) {
      const initialError = result.error;
      const initialSession = result.session_id;
      const initialRawRefs = rawRefs;
      const providerStartedAt = readRuntime(this.config.runtime.root, runtime_id).providers?.[entry.id]?.started_at_ms ?? Date.now() - result.duration_ms;
      terminalRecovery = {
        version: 1, attempted: true, count: 1, reason: initialError.code, session_id: initialSession,
        initial_error: privateAttemptError(initialError), recovery_error: null, initial_raw_output_refs: initialRawRefs, recovery_raw_output_refs: null,
      };
      let recoveryPlan = null;
      try {
        const recoveryPrompt = renderProviderPrompt(worker, worker.terminalRecoveryPrompt);
        recoveryPlan = worker.resume(provider, providerCwd, initialSession, recoveryPrompt, runtime);
        if (typeof worker.probeSession === "function") recoveryPlan = { ...recoveryPlan, probeSession: (ctx) => worker.probeSession({ ...ctx, provider, cwd: providerCwd, runtime }) };
      } catch (error) {
        terminalRecovery.recovery_error = privateAttemptError({ code: "PROVIDER_TERMINAL_RECOVERY_SETUP_FAILED", message: error.message });
      }
      if (recoveryPlan && !cancellationRequested(this.config.runtime.root, runtime_id, entry.id)) {
        const recoveryCapture = this.#openRawCapture(runtime, provider.runtime_key);
        const recovered = await runAttempt(recoveryPlan, recoveryCapture, { session_id: initialSession, provider_started_at_ms: providerStartedAt, kind: "same_session_repair" });
        const { refs: recoveryRefs, error: recoveryCaptureError } = recoveryCapture.finish();
        terminalRecovery.recovery_raw_output_refs = recoveryRefs;
        terminalRecovery.recovery_error = recovered.ok ? null : privateAttemptError(recovered.error);
        telemetry = {
          retry_count: telemetry.retry_count + recovered.retry_count + 1,
          api_empty_response_count: telemetry.api_empty_response_count + recovered.retry_count,
          progress_events: telemetry.progress_events + recovered.progress_events,
          last_progress_at_ms: recovered.last_progress_at_ms ?? telemetry.last_progress_at_ms,
        };
        result = {
          ...recovered,
          duration_ms: result.duration_ms + recovered.duration_ms,
          usage: sumUsage(result.usage ?? null, recovered.usage ?? null),
          session_id: recovered.session_id ?? null,
        };
        rawCapture = recoveryCapture;
        rawRefs = recoveryRefs;
        parseOutput = (stdout, stderr) => recoveryPlan.parseLive?.() ?? worker.parse(stdout, stderr, recoveryPlan.expectedSession);
        if (recoveryCaptureError) {
          const error = rawCaptureFailure(recoveryCaptureError); finalizeAttempt(recovered, { ok: false, error });
          result = { ...result, ok: false, error };
          terminalRecovery.recovery_error = privateAttemptError(result.error);
        } else if (recovered.ok && recovered.session_id !== initialSession) {
          const error = { code: "PROVIDER_SESSION_MISMATCH", message: "provider session identity changed during terminal recovery" };
          finalizeAttempt(recovered, { ok: false, error });
          result = { ...result, ok: false, error };
          terminalRecovery.recovery_error = privateAttemptError(result.error);
        } else if (!recovered.ok) {
          // Keep the original no-terminal classification public. The second
          // attempt is private evidence, never a reason to claim success.
          result = { ...result, ok: false, error: initialError, session_id: initialSession };
        } else {
          terminalRecovery.recovered = true;
        }
      } else if (recoveryPlan) {
        terminalRecovery.recovery_error = privateAttemptError({ code: "CANCELLED", message: "OpenCode terminal recovery was skipped after cancellation" });
      }
      cancelled = cancellationRequested(this.config.runtime.root, runtime_id, entry.id);
    }
    if (cancelled) {
      this.#releaseContinuationReservation(runtime_id, continuationMaterial, entry.id, prior?.session_id);
      const source = cancellationSource(this.config.runtime.root, runtime_id, entry.id); const invalidSource = source === INVALID_CANCELLATION_SOURCE;
      const error = invalidSource ? { code: "CANCEL_SOURCE_INVALID", message: "cancel marker source is invalid", source } : { code: "CANCELLED", message: `cancel was requested by ${source}`, source };
      finalizeAttempt(result, null, { status: "cancelled", error });
      return this.#store(runtime_id, entry, { status: "cancelled", duration_ms: result.duration_ms, ...telemetry, ...rawRefs, ...deliveryOutcome, cancellation_source: source, error }, terminalRecovery ? { terminal_recovery: terminalRecovery } : null);
    }
    if (!result.ok) {
      this.#releaseContinuationReservation(runtime_id, continuationMaterial, entry.id, prior?.session_id);
      const timeout_retry = retryableTerminationCodes.has(result.error?.code) && entry.continuation ? { version: 1, ...(continuationMaterial ? { material: continuationMaterial } : { attachment_free: true }) } : null;
      return this.#store(runtime_id, entry, { status: "failed", duration_ms: result.duration_ms, ...telemetry, ...rawRefs, ...deliveryOutcome, ...(result.session_id ? { session_id: result.session_id } : {}), error: result.error, diagnostic: publicDiagnostic(result, result.error) }, { ...(timeout_retry ? { timeout_retry } : {}), ...privateRecovery() });
    }
    // The in-memory streams are a bounded, redacted diagnostic summary only,
    // so they are the wrong source for the semantic review: redaction would
    // turn a provider answer that quotes a private host path into a
    // publishable "[REDACTED]" success instead of a fail-closed provider
    // failure. Parse the sealed private transcript instead, which also keeps an
    // oversized JSONL terminal record whole instead of cutting it at
    // max_output_bytes. An adapter-supplied health harvest stays authoritative,
    // because a provider that reports only through its health channel (for
    // example OpenCode) has no equivalent process transcript.
    const parseCurrent = () => {
      const captured = rawCapture.read();
      if ((result.stdout_truncated || result.stderr_truncated) && !captured) return { ok: false, error: { code: "RAW_OUTPUT_READ_FAILED", message: "broker could not read provider raw output for parsing" } };
      const parseStdout = result.health_harvested === true ? result.stdout : captured?.stdout ?? result.stdout;
      const parseStderr = result.health_harvested === true ? result.stderr : captured?.stderr ?? result.stderr;
      const value = terminalRecovery?.recovered && typeof worker.parseTerminalRecovery === "function"
        ? worker.parseTerminalRecovery(parseStdout, parseStderr, terminalRecovery.session_id)
        : parseOutput(parseStdout, parseStderr);
      return value && typeof value === "object" && typeof value.ok === "boolean"
        ? value
        : { ok: false, error: { code: "PROVIDER_OUTPUT_INVALID", message: "provider parser returned an invalid outcome" } };
    };
    const parseFailureError = (parsedValue) => {
      const error = result.stdin_error ?? parsedValue?.error ?? { code: "PROVIDER_OUTPUT_INVALID", message: "provider output was invalid" };
      return error.code === "PROVIDER_PRINT_TIMEOUT" ? { ...error, code: "PROCESS_TIMEOUT" } : error;
    };
    let parsed = parseCurrent();
    if (!parsed.ok) {
      const error = parseFailureError(parsed);
      const parseFailure = { ...parsed, error };
      if (terminalRecovery?.recovered) terminalRecovery.recovery_error = privateAttemptError(error);
      finalizeAttempt(result, parseFailure);
      if (input.required_result_protocol === WORKFLOWHUB_RESULT_PROTOCOL_V3
        && !terminalRecovery?.recovered && !cancellationRequested(this.config.runtime.root, runtime_id, entry.id)) {
        const recoverySession = parsed.session_id ?? result.session_id ?? null;
        const resumeAvailable = typeof recoverySession === "string" && recoverySession.length > 0
          && worker.capabilities?.continuation === true && typeof worker.resume === "function";
        const decision = recoveryDecision(error.code, resumeAvailable);
        let retry = null;
        if (decision.action === "same_session_repair" && decision.allowed) {
          retry = await runSameSessionRepair(result, recoverySession);
          if (!retry) {
            const freshFallback = recoveryDecision(error.code, false);
            if (freshFallback.action === "fresh_execution" && freshFallback.allowed) retry = await runFreshExecution(result);
          }
        } else if (decision.action === "fresh_execution" && decision.allowed) {
          retry = await runFreshExecution(result);
        }
        if (retry) {
          telemetry = {
            retry_count: telemetry.retry_count + retry.result.retry_count + 1,
            api_empty_response_count: telemetry.api_empty_response_count + retry.result.retry_count,
            progress_events: telemetry.progress_events + retry.result.progress_events,
            last_progress_at_ms: retry.result.last_progress_at_ms ?? telemetry.last_progress_at_ms,
          };
          result = retry.result; rawCapture = retry.capture; rawRefs = retry.refs;
          if (retry.captureError) {
            const retryError = rawCaptureFailure(retry.captureError); finalizeAttempt(result, { ok: false, error: retryError });
            result = { ...result, ok: false, error: retryError };
          } else if (retry.result.ok) {
            plan = retry.plan;
            parseOutput = (stdout, stderr) => retry.plan.parseLive?.() ?? worker.parse(stdout, stderr, retry.plan.expectedSession);
            parsed = parseCurrent();
            if (!parsed.ok) {
              const retryError = parseFailureError(parsed); finalizeAttempt(result, { ...parsed, error: retryError });
              if (terminalRecovery?.recovered) terminalRecovery.recovery_error = privateAttemptError(retryError);
              this.#releaseContinuationReservation(runtime_id, continuationMaterial, entry.id, prior?.session_id);
              return this.#store(runtime_id, entry, { status: "failed", duration_ms: result.duration_ms, ...telemetry, ...rawRefs, ...deliveryOutcome, ...(result.session_id ? { session_id: result.session_id } : {}), error: retryError, diagnostic: publicDiagnostic(result, retryError) }, terminalRecovery ? { terminal_recovery: terminalRecovery } : null);
            }
          }
        }
      }
      if (!result.ok || !parsed.ok) {
        this.#releaseContinuationReservation(runtime_id, continuationMaterial, entry.id, prior?.session_id);
        return this.#store(runtime_id, entry, { status: "failed", duration_ms: result.duration_ms, ...telemetry, ...rawRefs, ...deliveryOutcome, ...(result.session_id ? { session_id: result.session_id } : {}), error: result.ok ? error : result.error, diagnostic: publicDiagnostic(result, result.ok ? error : result.error) }, terminalRecovery ? { terminal_recovery: terminalRecovery } : null);
      }
    }
    finalizeAttempt(result, parsed);
    if (entry.continuation && (input.attachments || input.continuation?.reuse_frozen_material) && parsed.session_id !== prior.session_id) { this.#releaseContinuationReservation(runtime_id, continuationMaterial, entry.id, prior?.session_id); return this.#store(runtime_id, entry, { status: "failed", duration_ms: result.duration_ms, ...telemetry, ...rawRefs, ...deliveryOutcome, error: { code: "MATERIAL_INCOMPLETE", message: "continuation provider did not preserve its native session" } }, privateRecovery()); }
    // The raw transcript remains in the broker-private raw store. Adapters
    // that support native continuation may expose the same explicit rewrite
    // contract. This is not a text sanitizer: it asks for a complete new
    // review without supplying the rejected text or its path, then validates
    // that new response exactly as it validates the original response.
    if (containsPrivatePath(parsed.text) && typeof worker.publicOutputRewritePrompt === "string" && worker.publicOutputRewritePrompt.length > 0 && typeof worker.resume === "function") {
      let rewritePlan;
      try {
        rewritePlan = worker.resume(provider, providerCwd, parsed.session_id, worker.publicOutputRewritePrompt, runtime);
      } catch {
        this.#releaseContinuationReservation(runtime_id, continuationMaterial, entry.id, prior?.session_id);
        return this.#store(runtime_id, entry, { status: "failed", duration_ms: result.duration_ms, ...telemetry, ...rawRefs, ...deliveryOutcome, error: { code: "PROVIDER_OUTPUT_REWRITE_SETUP_FAILED", message: "broker could not prepare a provider output rewrite" } }, { ...privateRewrite ?? {}, ...privateRecovery() });
      }
      if (cancellationRequested(this.config.runtime.root, runtime_id, entry.id)) {
        this.#releaseContinuationReservation(runtime_id, continuationMaterial, entry.id, prior?.session_id);
        const source = cancellationSource(this.config.runtime.root, runtime_id, entry.id); const invalidSource = source === INVALID_CANCELLATION_SOURCE;
        return this.#store(runtime_id, entry, { status: "cancelled", duration_ms: result.duration_ms, ...telemetry, ...rawRefs, ...deliveryOutcome, cancellation_source: source, error: invalidSource ? { code: "CANCEL_SOURCE_INVALID", message: "cancel marker source is invalid", source } : { code: "CANCELLED", message: `cancel was requested by ${source}`, source } }, { ...privateRewrite ?? {}, ...privateRecovery() });
      }
      const rewriteCapture = this.#openRawCapture(runtime, provider.runtime_key);
      const rewrite = await runAttempt(rewritePlan, rewriteCapture, { session_id: parsed.session_id, kind: "public_output_rewrite" });
      const { refs: rewriteRefs, error: rewriteCaptureError } = rewriteCapture.finish();
      const rewriteTelemetry = { retry_count: rewrite.retry_count, progress_events: rewrite.progress_events, last_progress_at_ms: rewrite.last_progress_at_ms };
      const mergedDuration = result.duration_ms + rewrite.duration_ms;
      telemetry = {
        retry_count: telemetry.retry_count + rewriteTelemetry.retry_count,
        api_empty_response_count: telemetry.api_empty_response_count + rewriteTelemetry.retry_count,
        progress_events: telemetry.progress_events + rewriteTelemetry.progress_events,
        last_progress_at_ms: rewriteTelemetry.last_progress_at_ms ?? telemetry.last_progress_at_ms,
      };
      privateRewrite = { public_output_rewrite_count: 1, initial_raw_output_refs: rawRefs, initial_usage: parsed.usage ?? null, rewrite_usage: null };
      rawRefs = rewriteRefs;
      if (rewriteCaptureError) {
        this.#releaseContinuationReservation(runtime_id, continuationMaterial, entry.id, prior?.session_id);
        return this.#store(runtime_id, entry, { status: "failed", duration_ms: mergedDuration, ...telemetry, ...rawRefs, ...deliveryOutcome, error: rawCaptureFailure(rewriteCaptureError) }, { ...privateRewrite, ...privateRecovery() });
      }
      if (cancellationRequested(this.config.runtime.root, runtime_id, entry.id)) {
        this.#releaseContinuationReservation(runtime_id, continuationMaterial, entry.id, prior?.session_id);
        const source = cancellationSource(this.config.runtime.root, runtime_id, entry.id); const invalidSource = source === INVALID_CANCELLATION_SOURCE;
        return this.#store(runtime_id, entry, { status: "cancelled", duration_ms: mergedDuration, ...telemetry, ...rawRefs, ...deliveryOutcome, cancellation_source: source, error: invalidSource ? { code: "CANCEL_SOURCE_INVALID", message: "cancel marker source is invalid", source } : { code: "CANCELLED", message: `cancel was requested by ${source}`, source } }, { ...privateRewrite, ...privateRecovery() });
      }
      if (!rewrite.ok) {
        this.#releaseContinuationReservation(runtime_id, continuationMaterial, entry.id, prior?.session_id);
        return this.#store(runtime_id, entry, { status: "failed", duration_ms: mergedDuration, ...telemetry, ...rawRefs, ...deliveryOutcome, ...(rewrite.session_id ? { session_id: rewrite.session_id } : {}), error: rewrite.error, diagnostic: publicDiagnostic(rewrite, rewrite.error) }, { ...privateRewrite, ...privateRecovery() });
      }
      const rewriteCaptured = rewriteCapture.read();
      if ((rewrite.stdout_truncated || rewrite.stderr_truncated) && !rewriteCaptured) {
        this.#releaseContinuationReservation(runtime_id, continuationMaterial, entry.id, prior?.session_id);
        return this.#store(runtime_id, entry, { status: "failed", duration_ms: mergedDuration, ...telemetry, ...rawRefs, ...deliveryOutcome, error: { code: "RAW_OUTPUT_READ_FAILED", message: "broker could not read provider raw output for parsing" } }, { ...privateRewrite, ...privateRecovery() });
      }
      const rewritten = rewritePlan.parseLive?.() ?? worker.parse(
        rewrite.health_harvested === true ? rewrite.stdout : rewriteCaptured?.stdout ?? rewrite.stdout,
        rewrite.health_harvested === true ? rewrite.stderr : rewriteCaptured?.stderr ?? rewrite.stderr,
        rewritePlan.expectedSession,
      );
      if (!rewritten.ok) {
        this.#releaseContinuationReservation(runtime_id, continuationMaterial, entry.id, prior?.session_id);
        const error = rewrite.stdin_error ?? rewritten.error;
        return this.#store(runtime_id, entry, { status: "failed", duration_ms: mergedDuration, ...telemetry, ...rawRefs, ...deliveryOutcome, ...(rewrite.session_id ? { session_id: rewrite.session_id } : {}), error, diagnostic: publicDiagnostic(rewrite, error) }, { ...privateRewrite, ...privateRecovery() });
      }
      privateRewrite.rewrite_usage = rewritten.usage ?? null;
      result = { ...rewrite, duration_ms: mergedDuration };
      parsed = { ...rewritten, usage: sumUsage(parsed.usage ?? null, rewritten.usage ?? null) };
    }
    // file_only tool delivery echoes this run's private workdir to the model
    // (the workspace prefix plus its `/private/tmp` realpath alias). Strip
    // exactly that prefix so a valid review is not rejected as
    // PUBLIC_RESULT_INVALID; any other absolute host path is left untouched
    // and still fails closed below.
    if (typeof cwd === "string" && cwd.length > 0) {
      const workspacePaths = new Set([cwd]);
      try { workspacePaths.add(fs.realpathSync(cwd)); } catch { /* the workdir may already be removed */ }
      if (cwd.startsWith("/tmp/")) workspacePaths.add(`/private/tmp/${cwd.slice("/tmp/".length)}`);
      else if (cwd.startsWith("/private/tmp/")) workspacePaths.add(`/tmp/${cwd.slice("/private/tmp".length)}`);
      parsed = { ...parsed, text: sanitizeProviderWorkspacePaths(parsed.text, [...workspacePaths]) };
    }
    // A second invalid Pi response, or an invalid response from any other
    // adapter, remains a failed provider. No arbitrary host path is rewritten
    // just to obtain a semantic review result.
    if (containsPrivatePath(parsed.text)) {
      this.#releaseContinuationReservation(runtime_id, continuationMaterial, entry.id, prior?.session_id);
      return this.#store(runtime_id, entry, { status: "failed", duration_ms: result.duration_ms, ...telemetry, ...rawRefs, ...deliveryOutcome, continuable: false, error: { code: "PUBLIC_RESULT_INVALID", message: "provider output omitted because it contained a private absolute path" } }, { ...privateRewrite ?? {}, ...privateRecovery() });
    }
    if (entry.continuation && input.attachments) this.#recordContinuationMaterial(runtime_id, continuationMaterial, entry.id, prior.session_id);
    return this.#store(runtime_id, entry, { status: "completed", duration_ms: result.duration_ms, ...telemetry, ...rawRefs, ...deliveryOutcome, session_id: parsed.session_id, usage: parsed.usage, output: parsed.text }, { timeout_retry: undefined, ...(privateRewrite ?? {}), ...privateRecovery() });
  }
  #openRawCapture(runtime, provider) {
    const directory = path.join(runtime, "raw", provider); fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
    const suffix = `${Date.now()}-${process.pid}-${process.hrtime.bigint()}`;
    const files = Object.fromEntries(["stdout", "stderr"].map((stream) => {
      const target = path.join(directory, `round-${suffix}.${stream}`);
      return [stream, { target, fd: fs.openSync(target, "wx", 0o600), hash: createHash("sha256") }];
    }));
    const maxBytes = this.config.runtime.max_output_bytes;
    let finished = false; let writeError = null; let bytes = 0;
    return {
      write: ({ stream, chunk }) => {
        const file = files[stream]; if (!file || finished || typeof chunk !== "string" || writeError) return;
        const chunkBytes = Buffer.byteLength(chunk, "utf8");
        if (bytes + chunkBytes > maxBytes) { writeError = "RAW_OUTPUT_LIMIT"; return false; }
        try { fs.writeSync(file.fd, chunk, null, "utf8"); file.hash.update(chunk, "utf8"); bytes += chunkBytes; return true; }
        catch { writeError = "RAW_OUTPUT_WRITE_FAILED"; }
      },
      finish: () => {
        if (finished) return { refs: {}, error: writeError };
        finished = true; const refs = {};
        for (const [stream, file] of Object.entries(files)) {
          try { fs.closeSync(file.fd); fs.chmodSync(file.target, 0o400); }
          catch { writeError ??= "RAW_OUTPUT_WRITE_FAILED"; }
          refs[`raw_${stream}_ref`] = path.relative(runtime, file.target);
          refs[`raw_${stream}_sha256`] = file.hash.digest("hex");
        }
        return { refs, error: writeError };
      },
      read: () => {
        if (!finished || writeError) return null;
        try { return { stdout: fs.readFileSync(files.stdout.target, "utf8"), stderr: fs.readFileSync(files.stderr.target, "utf8") }; }
        catch { return null; }
      },
    };
  }
  #setupFailure(runtime_id, entry, deliveryUsed, delivery, error, preservePrior = false, material = null, session_id = null) {
    this.#releaseContinuationReservation(runtime_id, material, entry.id, session_id);
    const result = { status: "failed", ...(deliveryUsed ? { delivery_used: deliveryUsed } : {}), ...(delivery ? { delivery } : {}), error: publicError(error) };
    return deliveryUsed && !preservePrior ? this.#store(runtime_id, entry, result) : { provider: entry.id, tier: entry.tier, ...result };
  }
  #recordContinuationMaterial(runtime_id, material, provider, session_id) {
    updateRuntime(this.config.runtime.root, runtime_id, (next) => recordContinuationMaterial(next, material, provider, session_id));
  }
  #reserveContinuationMaterial(runtime_id, material, provider, session_id) {
    updateRuntime(this.config.runtime.root, runtime_id, (next) => reserveContinuationMaterial(next, material, provider, session_id));
  }
  #releaseContinuationReservation(runtime_id, material, provider, session_id) {
    updateRuntime(this.config.runtime.root, runtime_id, (next) => releaseContinuationMaterial(next, material, provider, session_id));
  }
  #store(runtime_id, entry, result, privateResult = null) {
    const state = updateRuntime(this.config.runtime.root, runtime_id, (next) => ({ ...next, providers: { ...next.providers, [entry.id]: { ...next.providers[entry.id], provider: entry.id, tier: entry.tier, ...result, ...(privateResult ?? {}), completed_at_ms: Date.now() } } }));
    const { raw_stdout_ref, raw_stderr_ref, ...publicResult } = result;
    const persistedSession = state.providers?.[entry.id]?.session_id;
    if (!Object.hasOwn(publicResult, "session_id") && persistedSession) publicResult.session_id = persistedSession;
    return { provider: entry.id, tier: entry.tier, ...publicResult };
  }
  #finish(runtime_id, input, providers, selected_tier) {
    const state = updateRuntime(this.config.runtime.root, runtime_id, (next) => ({ ...next, round: next.round + 1, last_prompt_bytes: Buffer.byteLength(input.prompt, "utf8"), last_selected_tier: selected_tier, last_completed_at_ms: Date.now() }));
    if (input.required_result_protocol === WORKFLOWHUB_RESULT_PROTOCOL_V3) {
      const material_id = providers[0]?.material?.material_id ?? "unavailable";
      return createWorkflowHubResultV3({ runtime_id, round: state.round, host_provider: state.host_provider, selected_tier, material_id, providers });
    }
    const codes = new Set(providers.map((item) => item.error?.code).filter(Boolean));
    const outcome = providers.some((item) => item.status === "completed") ? "completed"
      : providers.length > 0 && providers.every((item) => fallbackEligibleCodes.has(item.error?.code)) ? "unavailable"
        : providers.some((item) => item.status === "cancelled") ? "cancelled"
          : codes.has("PROCESS_STALLED") ? "stalled"
            : [...codes].some((code) => ["HEALTH_UNVERIFIABLE", "PROBE_DEADLINE", "PROBE_ABORT_FAILED", "PROBE_FAILED"].includes(code)) ? "unverifiable"
              : "invalid_output";
    return { version: 4, outcome, runtime_id, round: state.round, host_provider: state.host_provider, selected_tier, providers };
  }
}

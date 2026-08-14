#!/usr/bin/env node

import { existsSync, readFileSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { homedir } from "node:os";
import { basename, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";
import yaml from "js-yaml";

import {
  authenticateStageWriteBoundary,
  bootstrapStage,
  prepareMakeDecisionWorkspace,
} from "../../runtime/stage/stage-context.mjs";
import { runOfficialStage } from "../../runtime/stage/stage-runner.mjs";
import {
  validateAcceptanceEvidence,
} from "../../runtime/evidence/canonical-receipt-writer.mjs";
import { runCapture as captureBuildCodeTests } from "../../workflows/build-code/capture.mjs";
import { runCapture as captureVerifyCodeTests } from "../../workflows/verify-code/capture.mjs";
import { invokeRuntimeCommand, RUNTIME_BEHAVIORS } from "../../runtime/interface/runtime-facade.mjs";
import { LOCAL_RUNNER_CONTRACT, LOCAL_SKILL_BUNDLE_CONTRACT } from "../../runtime/interface/runner-contract.mjs";
import { deriveStageCompletion, deriveStageProgress } from "../../runtime/stage/completion-predicates.mjs";
import { evaluateFactFreshness } from "../../runtime/evidence/freshness.mjs";
import { CURRENT_MATERIAL_FILES } from "../../runtime/task/material-workspace.mjs";
import { appendMonitoringFacts, initializeTaskStore, readMonitoringFacts } from "../../runtime/task/task-store.mjs";
import { createMonitoringFact } from "../../runtime/evidence/monitoring-facts.mjs";
import { createRegisteredCodexSource, parseRegisteredCodexTranscript } from "../../runtime/evidence/codex-transcript-adapter.mjs";
import { createTranscriptSourceReader } from "../../runtime/evidence/fact-collector.mjs";
import { publishTaskMonitoringProjection, rebuildGlobalMonitoringSnapshot } from "../../runtime/evidence/monitoring-projector.mjs";
import { CANONICAL_STAGE_SLUGS, loadStageManifest } from "../../runtime/stage/step-manifest.mjs";

const DESIGN_ARTIFACTS = Object.freeze({
  "make-decision": new Set(["decision-log.md"]),
  "build-spec": new Set(["spec.md"]),
  "build-plan": new Set(["plan.md", "tasks.md"]),
});
const RUNNER_ROOT = fileURLToPath(new URL("../../", import.meta.url));
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const GIT_OID = /^[a-f0-9]{40,64}$/;
const MONITORING_STATUSES = new Set(["present", "missing", "skipped", "not_applicable", "unknown", "unavailable", "unsupported", "conflict", "incomplete"]);
const CODEX_THREAD_ID = /^[A-Za-z0-9._:-]{8,128}$/;
const CODEX_ROLLOUT_STARTED_AT = "WORKFLOWHUB_CODEX_ROLLOUT_STARTED_AT";

function safeRolloutId(value) {
  return String(value).replace(/[^A-Za-z0-9._:-]/g, "_");
}

function rolloutTimestamp(record) {
  const timestamp = record?.timestamp ?? record?.payload?.timestamp ?? record?.payload?.info?.timestamp;
  const parsed = Date.parse(typeof timestamp === "string" ? timestamp : "");
  return Number.isFinite(parsed) ? parsed : null;
}

function isSafeCodexRolloutPath(candidate, { home, threadId }) {
  const sessionsRoot = resolve(home, ".codex", "sessions");
  const target = resolve(candidate);
  return target.startsWith(`${sessionsRoot}/`)
    && basename(target).endsWith(`-${threadId}.jsonl`)
    && existsSync(target)
    && statSync(target).isFile()
    ? target
    : null;
}

function locateCodexRollout({ env = process.env, home = homedir() } = {}) {
  const threadId = env.CODEX_THREAD_ID;
  if (typeof threadId !== "string" || !CODEX_THREAD_ID.test(threadId)) return null;
  const explicit = env.CODEX_ROLLOUT_PATH ?? env.WORKFLOWHUB_CODEX_ROLLOUT_PATH;
  if (typeof explicit !== "string" || explicit.trim() === "") return null;
  const target = isSafeCodexRolloutPath(explicit, { home, threadId });
  if (!target) throw new Error("CODEX_ROLLOUT_PATH must point to the current .codex/sessions rollout for CODEX_THREAD_ID");
  return { threadId, target };
}

function resolveRolloutStartedAt(env = process.env, now = Date.now()) {
  const raw = env[CODEX_ROLLOUT_STARTED_AT];
  if (raw === undefined || raw === null || String(raw).trim() === "") return now;
  const text = String(raw).trim();
  const numeric = /^\d+$/.test(text) ? Number(text) : Date.parse(text);
  if (!Number.isSafeInteger(numeric) || numeric < 0) {
    throw new TypeError(`${CODEX_ROLLOUT_STARTED_AT} must be Unix milliseconds or an RFC3339 timestamp`);
  }
  return numeric;
}

function normalizeCodexRollout(raw, { taskId, runId, attemptId, stage, startedAtMs }) {
  const records = [];
  for (const [index, line] of String(raw).split(/\r?\n/).entries()) {
    if (!line.trim()) continue;
    let outer;
    try { outer = JSON.parse(line); } catch { continue; }
    if (!outer || typeof outer !== "object" || !outer.payload || typeof outer.payload !== "object") continue;
    const occurredAt = rolloutTimestamp(outer);
    if (occurredAt !== null && occurredAt < startedAtMs) continue;
    const payload = outer.payload;
    const payloadType = typeof payload.type === "string" ? payload.type : "unknown";
    const sourceEventId = safeRolloutId(payload.id ?? outer.id ?? `${index}-${payloadType}`);
    const common = {
      task_id: taskId,
      run_id: runId,
      stage,
      ...(attemptId ? { attempt_id: attemptId } : {}),
    };
    if (outer.type === "event_msg" && payloadType === "token_count") {
      // Codex records usage as event_msg/token_count rather than as a
      // response_item/message.  Keep the per-turn usage (not the cumulative
      // total) so the monitoring adapter can deduplicate and aggregate it as
      // an ordinary token fact without inventing step or skill attribution.
      const usage = payload.info?.last_token_usage ?? payload.info?.total_token_usage;
      const inputTokens = usage?.input_tokens;
      const outputTokens = usage?.output_tokens;
      const totalTokens = usage?.total_tokens;
      if (Number.isInteger(inputTokens) && inputTokens >= 0
          && Number.isInteger(outputTokens) && outputTokens >= 0
          && Number.isInteger(totalTokens) && totalTokens >= 0) {
        records.push(JSON.stringify({
          id: `message-${sourceEventId}`,
          type: "message",
          ...common,
          usage: { input_tokens: inputTokens, output_tokens: outputTokens, total_tokens: totalTokens },
          grain: "message",
        }));
      } else {
        records.push(JSON.stringify({
          id: `message-${sourceEventId}`,
          type: "message",
          ...common,
          usage: {},
          grain: "message",
        }));
      }
      continue;
    }
    if (outer.type === "response_item" && payloadType === "custom_tool_call") {
      const toolId = safeRolloutId(payload.id ?? `${index}-tool`);
      records.push(JSON.stringify({
        id: `tool-${toolId}`,
        type: "tool_use",
        ...common,
        tool_use: { id: `tool-${toolId}`, name: typeof payload.name === "string" ? payload.name : null },
        grain: "stage",
      }));
      continue;
    }
    const eventType = `${outer.type ?? "rollout"}/${payloadType}`;
    records.push(JSON.stringify({
      id: `event-${sourceEventId}`,
      type: "transcript_event",
      fact_type: "transcript_event",
      ...common,
      value: {
        event_id: `event-${sourceEventId}`,
        event_type: eventType,
        ...(occurredAt === null ? {} : { timestamp: new Date(occurredAt).toISOString() }),
      },
    }));
  }
  return records.join("\n");
}

/**
 * The launcher owns the host path and turns it into a private reader capability.
 * Runtime facts only receive the opaque thread reference and normalized events.
 */
export function resolveDefaultMonitoringSource({ context, task_id, run_id, attempt_id, startedAtMs = Date.now(), env = process.env, home = homedir() } = {}) {
  const located = locateCodexRollout({ env, home });
  if (!located) return null;
  const sourceRef = `codex-rollout-${safeRolloutId(located.threadId)}`;
  return createRegisteredCodexSource({
    source_id: `codex-thread-${safeRolloutId(located.threadId)}`,
    source_ref: sourceRef,
    registration_id: `launcher-${safeRolloutId(located.threadId)}`,
    required: true,
    task_id: task_id ?? context?.identity?.taskId,
    run_id: run_id ?? context?.workflowRunId,
    session_id: safeRolloutId(located.threadId),
    source_format: "jsonl",
    source_version: "v1",
    cli_version: env.CODEX_CLI_VERSION ?? "codex-host",
    adapter_version: "codex-rollout-adapter.v1",
    capabilities: ["transcript_event", "token", "tool_use"],
    reader: createTranscriptSourceReader(() => normalizeCodexRollout(readFileSync(located.target, "utf8"), {
      taskId: task_id ?? context?.identity?.taskId,
      runId: run_id ?? context?.workflowRunId,
      attemptId: attempt_id ?? context?.attempt_id ?? null,
      stage: context?.stage ?? null,
      startedAtMs,
    })),
  });
}

export function monitoringTopology(repoRoot = RUNNER_ROOT) {
  return {
    stages: CANONICAL_STAGE_SLUGS.map((stage) => {
      const manifest = loadStageManifest(stage, repoRoot);
      const skillManifest = yaml.load(readFileSync(`${repoRoot}/workflows/${stage}/skill-deps.yaml`, "utf8"));
      return {
        id: stage,
        steps: manifest.steps.map((step) => ({ id: String(step.step_id), slug: step.step_slug, order: step.order })),
        skills: (Array.isArray(skillManifest?.skills) ? skillManifest.skills : []).map((skill) => ({
          id: String(skill.name),
          trigger: null,
          trigger_condition: String(skill.trigger ?? "unknown"),
          execution: String(skill.execution ?? "unknown"),
        })),
      };
    }),
  };
}

function deriveMonitoringAttemptId(context, stageOutcome) {
  const explicitAttempt = context.attempt_id ?? stageOutcome?.attempt_id;
  const qualityRefs = Array.isArray(stageOutcome?.quality_fact_refs)
    ? stageOutcome.quality_fact_refs.filter((ref) => typeof ref === "string" && ref.trim())
    : [];
  return typeof explicitAttempt === "string" && explicitAttempt.trim()
    ? explicitAttempt
    : qualityRefs.length ? `attempt-${sha256(JSON.stringify(qualityRefs)).slice(0, 32)}` : null;
}

function bindStageOutcomeAttemptId(context, stageOutcome) {
  if (!stageOutcome || typeof stageOutcome !== "object" || stageOutcome.attempt_id || typeof stageOutcome.stage_outcome_ref !== "string") return stageOutcome;
  try {
    const record = JSON.parse(context.task.readRecord(stageOutcome.stage_outcome_ref));
    return typeof record?.attempt_id === "string" && record.attempt_id.trim()
      ? { ...stageOutcome, attempt_id: record.attempt_id }
      : stageOutcome;
  } catch {
    return stageOutcome;
  }
}

function normalizeOutcomeStatus(outcome, kind) {
  const semanticStatus = typeof outcome?.status === "string" ? outcome.status : null;
  if (semanticStatus === "completed" || semanticStatus === "failed") {
    const value = { outcome: semanticStatus };
    if (typeof outcome?.result_summary === "string" && outcome.result_summary.trim()) value.result_summary = outcome.result_summary.trim();
    return { status: "present", value, reason: null, error: null };
  }
  if (semanticStatus === "skipped" || semanticStatus === "not_applicable") {
    return { status: semanticStatus, value: null, reason: outcome.reason ?? `${kind}_outcome_${semanticStatus}`, error: outcome.error ?? null };
  }
  if (semanticStatus === "incomplete" || semanticStatus === "unavailable" || semanticStatus === "unknown") {
    return { status: semanticStatus, value: null, reason: outcome.reason ?? `${kind}_outcome_${semanticStatus}`, error: outcome.error ?? null };
  }
  return {
    status: semanticStatus === null ? "unavailable" : "unsupported",
    value: null,
    reason: `${kind}_outcome_${semanticStatus ?? "unavailable"}`,
    error: semanticStatus === null ? null : "UNSUPPORTED_OUTCOME_STATUS",
  };
}

function normalizeEvidenceRefs(value) {
  return Array.isArray(value)
    ? value.map((entry) => typeof entry === "string" ? entry : entry?.ref).filter((ref) => typeof ref === "string" && ref.trim())
    : [];
}

function outcomeCoverage(status) {
  return { observed: ["unknown", "unavailable"].includes(status) ? 0 : 1, expected: 1 };
}

function stageMonitoringFacts({ context, stageOutcome, topology, now }) {
  const stage = typeof context.stage === "string" ? context.stage : null;
  const attemptId = deriveMonitoringAttemptId(context, stageOutcome);
  const factIdentity = `${context.workflowRunId ?? "unknown"}:${attemptId ?? "default"}`;
  const source = {
    kind: "stage",
    ref: `stage:${stage ?? "unknown"}`,
    source_id: `stage:${stage ?? "unknown"}`,
    source_version: "stage-runtime.v1",
  };
  const task = {
    task_id: context.identity.taskId,
    project_name: context.identity.projectName,
    run_id: context.workflowRunId ?? null,
    attempt_id: attemptId,
    stage,
    source,
    observed_at: now().toISOString(),
  };
  const stageOutcomeStatus = typeof stageOutcome?.stage_outcome_status === "string"
    ? stageOutcome.stage_outcome_status
    : stageOutcome?.status;
  const stageState = normalizeOutcomeStatus(
    stageOutcomeStatus === undefined ? null : { status: stageOutcomeStatus },
    "stage",
  );
  const records = [createMonitoringFact({
    ...task,
    fact_id: `stage:${factIdentity}:${stage ?? "unknown"}`,
    fact_type: "stage",
    status: stageState.status,
    value: stageState.value,
    reason: stageState.reason,
    error: stageState.error,
    coverage: outcomeCoverage(stageState.status),
    evidence_refs: typeof stageOutcome?.stage_outcome_ref === "string" ? [stageOutcome.stage_outcome_ref] : [],
  })];
  if (!stage) return records;
  const stageTopology = (topology?.stages ?? []).find((entry) => entry.id === stage) ?? { steps: [], skills: [] };
  const declaredStepIds = new Set((stageTopology.steps ?? []).map((step) => String(step.id)));
  const stepOutcomes = Array.isArray(stageOutcome?.step_outcomes) ? stageOutcome.step_outcomes : [];
  for (const outcome of stepOutcomes) {
    if (!outcome || outcome.step_id === undefined || outcome.step_id === null) continue;
    const id = String(outcome.step_id);
    if (!declaredStepIds.has(id)) continue;
    const state = normalizeOutcomeStatus(outcome, "step");
    records.push(createMonitoringFact({
      ...task,
      fact_id: `step:${factIdentity}:${stage}:${id}`,
      fact_type: "step",
      step_id: id,
      step_slug: typeof outcome.step_slug === "string" ? outcome.step_slug : null,
      status: state.status,
      value: state.value,
      reason: state.reason,
      error: state.error,
      coverage: outcomeCoverage(state.status),
      evidence_refs: normalizeEvidenceRefs(outcome.evidence_refs),
    }));
  }
  const declaredSkillIds = new Set((stageTopology.skills ?? []).map((skill) => String(skill.id)));
  const skillOutcomes = Array.isArray(stageOutcome?.skill_outcomes) ? stageOutcome.skill_outcomes : [];
  for (const outcome of skillOutcomes) {
    if (!outcome || typeof outcome.skill_id !== "string" || !declaredSkillIds.has(outcome.skill_id)) continue;
    const id = outcome.skill_id;
    let state = normalizeOutcomeStatus(outcome, "skill");
    let value = state.value;
    if (state.status === "present") {
      value = {};
      if (typeof outcome.trigger === "boolean") value.trigger = outcome.trigger;
      if (typeof outcome.executed === "boolean") value.executed = outcome.executed;
      if (typeof outcome.reason === "string" && outcome.reason.trim()) value.reason = outcome.reason;
      if (typeof outcome.version === "string" && outcome.version.trim()) value.version = outcome.version;
      if (typeof outcome.result_summary === "string" && outcome.result_summary.trim()) value.result_summary = outcome.result_summary.trim();
      if (typeof value.trigger !== "boolean" || typeof value.executed !== "boolean") {
        state = { status: "unavailable", value: null, reason: "skill_outcome_unavailable", error: null };
        value = null;
      }
    }
    records.push(createMonitoringFact({
      ...task,
      fact_id: `skill:${factIdentity}:${stage}:${id}`,
      fact_type: "skill",
      skill_id: id,
      skill_version: typeof outcome.version === "string" ? outcome.version : null,
      status: state.status,
      value,
      reason: state.reason,
      error: state.error,
      coverage: outcomeCoverage(state.status),
      evidence_refs: normalizeEvidenceRefs(outcome.evidence_refs),
    }));
  }
  return records;
}

function qualityMonitoringFacts({ context, stageOutcome, now }) {
  const rawRefs = Array.isArray(stageOutcome?.quality_fact_refs)
    ? [...new Set(stageOutcome.quality_fact_refs.filter((ref) => typeof ref === "string"))]
    : [];
  const refs = rawRefs.filter((ref) => /^quality\/facts\/[A-Za-z0-9][A-Za-z0-9._-]*\.json$/.test(ref));
  const attemptId = deriveMonitoringAttemptId(context, stageOutcome);
  const records = [];
  const independentReviewSubjects = new Set(["independent_review", "direction_review", "detail_review", "same_build_integration_review"]);
  const qualitySource = (ref, sourceVersion = "quality-fact.v1") => ({
    kind: "quality",
    ref: `quality:${sha256(ref).slice(0, 24)}`,
    source_id: "quality-owner",
    source_version: sourceVersion,
  });
  const unavailableQualityFact = (ref, error, evidenceRef = ref) => {
    const code = error?.code;
    const missing = code === "ENOENT";
    const unsupported = ["INVALID_QUALITY_FACT_REF", "UNSUPPORTED_QUALITY_FACT_KIND"].includes(code);
    const bindingConflict = ["QUALITY_FACT_TASK_MISMATCH", "QUALITY_FACT_STAGE_MISMATCH"].includes(code);
    const status = missing ? "missing" : unsupported ? "unsupported" : bindingConflict ? "conflict" : "unavailable";
    return createMonitoringFact({
      task_id: context.identity.taskId,
      project_name: context.identity.projectName,
      stage: context.stage ?? null,
      run_id: context.workflowRunId ?? null,
      attempt_id: attemptId,
      fact_id: `quality:fact:${status}:${attemptId ?? "default"}:${sha256(ref).slice(0, 32)}`,
      fact_type: "source_status",
      status,
      value: null,
      reason: missing ? "quality_fact_record_missing" : unsupported ? "quality_fact_unsupported" : bindingConflict ? "quality_fact_binding_conflict" : "quality_fact_record_unavailable",
      error: missing ? null : (error?.code ? String(error.code) : "INVALID_QUALITY_FACT"),
      source: qualitySource(ref),
      observed_at: now().toISOString(),
      coverage: { observed: 0, expected: 1 },
      evidence_refs: [evidenceRef],
    });
  };
  for (const ref of rawRefs.filter((candidate) => !refs.includes(candidate))) {
    records.push(unavailableQualityFact(ref, Object.assign(new Error("invalid quality fact ref"), { code: "INVALID_QUALITY_FACT_REF" }), `quality-ref:${sha256(ref).slice(0, 24)}`));
  }
  for (const ref of refs) {
    let value;
    let raw;
    try {
      raw = context.task.readRecord(ref);
      value = JSON.parse(raw);
    } catch (error) {
      records.push(unavailableQualityFact(ref, error));
      continue;
    }
    const supportedKinds = new Set(["review", "test"]);
    const bindingError = !value || value.task_id !== context.identity.taskId
      ? "QUALITY_FACT_TASK_MISMATCH"
      : typeof value.kind !== "string" || !supportedKinds.has(value.kind)
        ? "UNSUPPORTED_QUALITY_FACT_KIND"
        : value.stage && context.stage && value.stage !== context.stage
          ? "QUALITY_FACT_STAGE_MISMATCH"
          : null;
    if (bindingError) {
      records.push(unavailableQualityFact(ref, Object.assign(new Error("invalid quality fact"), { code: bindingError })));
      continue;
    }
    const qualityStatus = (valueStatus, present) => {
      if (present) return "present";
      if (valueStatus === "missing") return "missing";
      if (valueStatus === "skipped") return "skipped";
      if (valueStatus === "not_applicable") return "not_applicable";
      if (valueStatus === "conflict") return "conflict";
      if (valueStatus === "unsupported") return "unsupported";
      if (valueStatus === "incomplete") return "incomplete";
      if (valueStatus === "unknown") return "unknown";
      return "unavailable";
    };
    const source = qualitySource(ref, value.schema_version ?? "quality-fact.v1");
    const common = {
      task_id: context.identity.taskId,
      project_name: context.identity.projectName,
      stage: value.stage ?? context.stage ?? null,
      run_id: context.workflowRunId ?? null,
      attempt_id: attemptId,
      source,
      observed_at: now().toISOString(),
      evidence_refs: [ref],
    };
    if (value.kind === "review") {
      const present = ["recorded", "passed", "failed"].includes(value.status);
      records.push(createMonitoringFact({
        ...common,
        fact_id: `quality:review:${attemptId ?? "default"}:${sha256(ref)}`,
        fact_type: "review",
        status: qualityStatus(value.status, present),
        value: present ? {
          invoked: true,
          independent: independentReviewSubjects.has(value.subject),
          outcome: value.status,
          freshness: "current",
          source_ref: ref,
        } : null,
        reason: present ? null : `quality_review_${value.status ?? "unavailable"}`,
        coverage: { observed: present ? 1 : 0, expected: 1 },
      }));
    } else if (value.kind === "test") {
      const present = value.status === "passed" || value.status === "failed";
      records.push(createMonitoringFact({
        ...common,
        fact_id: `quality:test:${attemptId ?? "default"}:${sha256(ref)}`,
        fact_type: "test",
        status: qualityStatus(value.status, present),
        value: present ? {
          invoked: true,
          outcome: value.status,
          freshness: "current",
          source_ref: ref,
        } : null,
        reason: present ? null : `quality_test_${value.status ?? "unavailable"}`,
        coverage: { observed: present ? 1 : 0, expected: 1 },
      }));
    }
  }
  if (context.stage === "verify-code" || stageOutcome?.stage === "verify-code") {
    const verifyRef = "quality/verify.json";
    const commonVerify = {
      task_id: context.identity.taskId,
      project_name: context.identity.projectName,
      stage: "verify-code",
      run_id: context.workflowRunId ?? null,
      attempt_id: attemptId,
      fact_type: "verify",
      source: { kind: "quality", ref: "quality:verify", source_id: "quality-owner", source_version: "quality-verify.v1" },
      observed_at: now().toISOString(),
      evidence_refs: [verifyRef],
      coverage: { observed: 0, expected: 1 },
    };
    try {
      const verifyRaw = context.task.readRecord(verifyRef);
      const verify = JSON.parse(verifyRaw);
      const verifyDigest = sha256(verifyRaw);
      const bindingConflict = verify.task_id !== context.identity.taskId || verify.stage !== "verify-code";
      const present = !bindingConflict && ["passed", "failed"].includes(verify.status);
      const incomplete = verify.status === "incomplete";
      const verifyValue = present ? {
        invoked: true,
        ...(typeof verify.fresh === "boolean" ? { fresh: verify.fresh } : {}),
        outcome: verify.status,
        source_ref: verifyRef,
      } : null;
      records.push(createMonitoringFact({
        task_id: context.identity.taskId,
        project_name: context.identity.projectName,
        stage: "verify-code",
        run_id: context.workflowRunId ?? null,
        attempt_id: attemptId,
        fact_id: `quality:verify:${attemptId ?? "default"}:${verifyDigest}`,
        fact_type: "verify",
        status: present ? "present" : bindingConflict ? "conflict" : verify.status === "missing" ? "missing" : incomplete ? "incomplete" : verify.status === "unknown" ? "unknown" : "unavailable",
        value: verifyValue,
        reason: present ? null : bindingConflict ? "verify_binding_conflict" : verify.status === "missing" ? "quality_verify_record_missing" : incomplete ? "verify_incomplete" : "verify_freshness_unavailable",
        error: bindingConflict ? "VERIFY_SOURCE_BINDING_MISMATCH" : null,
        source: { ...commonVerify.source, source_version: verify.schema_version ?? "quality-verify.v1" },
        observed_at: now().toISOString(),
        coverage: { observed: present ? 1 : 0, expected: 1 },
        evidence_refs: [verifyRef],
      }));
    } catch (error) {
      records.push(createMonitoringFact({
        ...commonVerify,
        fact_id: `quality:verify:unavailable:${attemptId ?? "default"}:${sha256(String(error?.code ?? error?.message ?? "read_error")).slice(0, 32)}`,
        status: error?.code === "ENOENT" ? "missing" : "unavailable",
        value: null,
        reason: error?.code === "ENOENT" ? "quality_verify_record_missing" : "quality_verify_record_unavailable",
        error: error?.code && error.code !== "ENOENT" ? String(error.code) : null,
      }));
    }
  }
  return records;
}

export function normalizeAcceptanceEvidencePublication(input, snapshotTree) {
  if (!input || typeof input !== "object" || Array.isArray(input)
      || typeof input.acceptance_criterion_id !== "string"
      || !new Set(["pass", "fail"]).has(input.result)
      || !Array.isArray(input.refs)) {
    throw new TypeError("acceptance evidence input requires acceptance_criterion_id, result, refs, and optional summary");
  }
  const allowed = new Set(["acceptance_criterion_id", "result", "refs", "summary", "source_digest"]);
  const unknown = Object.keys(input).filter((key) => !allowed.has(key));
  if (unknown.length) {
    throw new TypeError(`acceptance evidence input has caller-forbidden or unknown field: ${unknown.join(", ")}`);
  }
  if (!GIT_OID.test(snapshotTree ?? "")) throw new TypeError("acceptance evidence runtime snapshot_tree is required");
  return validateAcceptanceEvidence({
    schema_version: "acceptance-evidence.v1",
    acceptance_criterion_id: input.acceptance_criterion_id,
    result: input.result,
    refs: input.refs,
    ...(input.source_digest === undefined ? {} : { source_digest: input.source_digest }),
    ...(input.summary === undefined ? {} : { summary: input.summary }),
    snapshot_tree: snapshotTree,
  });
}

function parseArgs(argv) {
  const [command, ...raw] = argv;
  const values = {};
  for (const item of raw) {
    const split = item.indexOf("=");
    if (!item.startsWith("--") || split < 3) throw new TypeError(`invalid argument: ${item}`);
    values[item.slice(2, split)] = item.slice(split + 1);
  }
  if (!new Set(["doctor", "status", "artifact", "review-risk-pause", "capture-tests", "run", "confirm", "authorize-operation"]).has(command)) {
    throw new TypeError("usage: stage-runtime.mjs <doctor|status|run|review|verify|confirm|authorize> --stage=<stage> --project=<project> --task=<task> [...]");
  }
  return { command, values };
}

export async function runMonitoringSidecar({ context, services = {}, stageOutcome = null, now = () => new Date() } = {}) {
  if (!context?.task || !context?.storageRoot) throw new TypeError("launcher context with storageRoot is required for monitoring sidecar");
  const boundStageOutcome = bindStageOutcomeAttemptId(context, stageOutcome);
  const attemptId = deriveMonitoringAttemptId(context, boundStageOutcome);
  const monitoringContext = attemptId === (context.attempt_id ?? null) ? context : { ...context, attempt_id: attemptId };
  const binding = typeof services.resolveMonitoringSource === "function"
    ? await services.resolveMonitoringSource({ context: monitoringContext, taskPath: context.task.taskPath, task_id: context.identity.taskId, run_id: context.workflowRunId })
    : null;
  const parsed = parseRegisteredCodexTranscript(binding, {
    project_name: monitoringContext.identity.projectName,
    task_id: monitoringContext.identity.taskId,
    stage: monitoringContext.stage ?? null,
    run_id: monitoringContext.workflowRunId ?? null,
    attempt_id: attemptId,
    now,
  });
  const existing = new Set(readMonitoringFacts(monitoringContext.task.taskPath).map((record) => record?.fact_id).filter(Boolean));
  const topology = services.monitoringTopology ?? monitoringTopology(RUNNER_ROOT);
  const stageFacts = stageMonitoringFacts({ context: monitoringContext, stageOutcome: boundStageOutcome, topology, now });
  const qualityFacts = qualityMonitoringFacts({ context: monitoringContext, stageOutcome: boundStageOutcome, now });
  const freshRecords = [...parsed.records, ...qualityFacts, ...stageFacts].filter((record) => !existing.has(record.fact_id));
  if (freshRecords.length) appendMonitoringFacts(monitoringContext.task.taskPath, { task_id: monitoringContext.identity.taskId, records: freshRecords });
  const facts = readMonitoringFacts(monitoringContext.task.taskPath);
  const projectionStatus = { present: "current", missing: "partial", skipped: "partial", not_applicable: "partial", unknown: "partial", unavailable: "partial", unsupported: "partial", incomplete: "partial", conflict: "fatal" }[parsed.status] ?? "partial";
  const projectionErrors = parsed.status === "conflict"
    ? ["monitoring source binding conflict"]
    : parsed.status === "present" ? [] : [`monitoring source status: ${parsed.status}`];
  const projection = publishTaskMonitoringProjection({ storageRoot: monitoringContext.storageRoot, projectName: monitoringContext.identity.projectName, taskId: monitoringContext.identity.taskId, facts, topology, generatedAt: now().toISOString(), status: projectionStatus, errors: projectionErrors });
  const snapshot = rebuildGlobalMonitoringSnapshot({ storageRoot: monitoringContext.storageRoot, generatedAt: now().toISOString(), topology });
  return Object.freeze({ status: parsed.status, fact_refs: projection.value.source_refs, projection_ref: projection.path, global_snapshot: snapshot.outputData, diagnostics: projection.value.diagnostics });
}

export function publishStaleMonitoringSnapshot({ context, services = {}, message, now = () => new Date() } = {}) {
  if (!context?.task || !context.storageRoot || !context.identity) throw new TypeError('launcher context with task, identity, and storageRoot is required');
  if (typeof message !== 'string' || !message.trim()) throw new TypeError('monitoring stale message is required');
  const generatedAt = now().toISOString();
  const facts = readMonitoringFacts(context.task.taskPath);
  const topology = services.monitoringTopology ?? monitoringTopology(RUNNER_ROOT);
  const projection = publishTaskMonitoringProjection({
    storageRoot: context.storageRoot,
    projectName: context.identity.projectName,
    taskId: context.identity.taskId,
    facts,
    topology,
    generatedAt,
    status: 'stale',
    errors: [message],
  });
  const snapshot = rebuildGlobalMonitoringSnapshot({ storageRoot: context.storageRoot, generatedAt, topology, preferDerived: true });
  return Object.freeze({ projection, snapshot });
}

export async function stageRuntimeMain(argv = process.argv.slice(2), { services = {} } = {}) {
  const { command, values } = parseArgs(argv);
  if (Object.prototype.hasOwnProperty.call(values, "worktree-root") || Object.prototype.hasOwnProperty.call(values, "baseline-commit")) {
    throw new TypeError("--worktree-root/--baseline-commit are no longer supported; make-decision owns deterministic worktree preparation");
  }
  if (Object.prototype.hasOwnProperty.call(values, "runner-root")) throw new TypeError("--runner-root is forbidden; stage-runtime authenticates its own repository root");
  if (command === "review-risk-pause" && !values.input) {
    throw new TypeError(`${command} requires --input=<risk-input.json>`);
  }
  if (command === "capture-tests" && (!new Set(["build-code", "verify-code"]).has(values.stage) || !values.input)) {
    throw new TypeError("capture-tests requires --stage=build-code|verify-code --input=<test-capture.json>");
  }
  if (command === "artifact" && (!values.name || !values.input)) throw new TypeError("artifact requires --name=<artifact.md> --input=<content-file>");
  if (command === "authorize-operation") {
    if (!new Set(["commit", "push", "merge", "archive", "cleanup"]).has(values.operation)) throw new TypeError("authorize-operation requires --operation=commit|push|merge|archive|cleanup");
    if (typeof values["subject-ref"] !== "string" || values["subject-ref"].trim() === "") throw new TypeError("authorize-operation requires --subject-ref=<quality/confirmations/<sha256>.json>");
  }
  let context = bootstrapStage(values.stage, {
    mode: "launcher",
    projectName: values.project,
    taskId: values.task,
    runnerRoot: RUNNER_ROOT,
    readOnly: command === "status",
  });
  const input = new Set(["review-risk-pause", "capture-tests", "run"]).has(command)
      && values.input !== undefined
    ? JSON.parse(readFileSync(values.input, "utf8"))
    : undefined;
  if (values.stage === "make-decision" && command !== "status") {
    context = prepareMakeDecisionWorkspace(context);
  }
  if (command === "status") {
    const allowed = new Set(["stage", "project", "task", "reason"]);
    if (Object.keys(values).some((key) => !allowed.has(key))) throw new TypeError("status accepts only --stage, --project, --task, and optional --reason");
    let current = null;
    let materialRevision = null;
    const materials = {};
    for (const file of CURRENT_MATERIAL_FILES) {
      if (!context.artifacts) {
        materials[file] = null;
        continue;
      }
      try { materials[file] = context.artifacts.read(file); }
      catch (error) {
        if (error?.code === "ENOENT") materials[file] = null;
        else throw error;
      }
    }
    if (context.workspace) {
      current = context.kernel.currentVNextSnapshot();
      const materialValues = CURRENT_MATERIAL_FILES.map((file) => {
        try { return [file, context.artifacts.read(file)]; }
        catch (error) {
          if (error?.code === "ENOENT") return [file, null];
          throw error;
        }
      });
      materialRevision = `revision-${sha256(JSON.stringify(materialValues))}`;
    }
    const observations = [];
    for (const ref of context.task.listCanonicalQualityFactRefs()) {
      let value;
      let raw;
      try {
        raw = context.task.readRecord(ref);
        value = JSON.parse(raw);
      } catch { continue; }
      if (value?.task_id !== context.task.identity.taskId || value?.stage !== values.stage) continue;
      const freshness = current
        ? evaluateFactFreshness({ ...value, ref, sha256: sha256(raw) }, {
          material_revision: materialRevision,
          snapshot_tree: current.tree,
        }, { read: context.task.readRecord })
        : { status: "unknown", authenticated: false };
      observations.push({ fact: { ref, value }, authenticated: freshness.authenticated === true, recorded: true, freshness });
    }
    const quality = deriveStageCompletion(values.stage, observations);
    const progression = deriveStageProgress(values.stage, observations, materials);
    return Object.freeze({
      ...progression,
      quality_status: quality.status,
      quality_missing: quality.missing,
      quality_fact_refs: Object.freeze(observations.map(({ fact }) => fact.ref).sort()),
      quality_predicates: quality.predicates,
    });
  }
  authenticateStageWriteBoundary(context, {
    runnerRoot: RUNNER_ROOT,
    operation: command,
  });
  if (command === "doctor") {
    const allowed = new Set(["stage", "project", "task"]);
    if (Object.keys(values).some((key) => !allowed.has(key))) throw new TypeError("doctor accepts only --stage, --project, and --task");
    const activeWorkspace = context.candidateWorkspace ?? context.workspace;
    return {
      stage: values.stage,
      task_id: context.task.identity.taskId,
      worktree_root: activeWorkspace.worktreeRoot,
      baseline_commit: activeWorkspace.baselineCommit,
      materials: context.artifacts ? "working" : "not_applicable",
    };
  }
  if (command === "artifact") {
    if (!DESIGN_ARTIFACTS[values.stage]?.has(values.name)) throw new TypeError(`unsupported ${values.stage} artifact: ${values.name}`);
    context.artifacts.writeAtomic(values.name, readFileSync(values.input, "utf8"));
    return { artifact_ref: context.artifacts.reference(values.name) };
  }
  if (command === "capture-tests") {
    if (!input || typeof input !== "object" || Array.isArray(input)
        || typeof input.command !== "string"
        || typeof input.receipt_ref !== "string"
        || (input.output_ref !== undefined && typeof input.output_ref !== "string")
        || Object.keys(input).some((key) => !new Set(["command", "receipt_ref", "output_ref"]).has(key))) {
      throw new TypeError("test capture input requires command, receipt_ref, and optional output_ref only");
    }
    const capture = values.stage === "build-code" ? captureBuildCodeTests : captureVerifyCodeTests;
    return capture(input.command, input.receipt_ref, {
      task: context.task,
      workspace: context.workspace,
      ...(input.output_ref === undefined ? {} : { outputRef: input.output_ref }),
    });
  }
  if (command === "review-risk-pause") {
    const allowed = new Set(["review_result_ref"]);
    if (!input || typeof input !== "object" || Array.isArray(input)
        || typeof input.review_result_ref !== "string"
        || Object.keys(input).some((key) => !allowed.has(key))) {
      throw new TypeError("review-risk-pause input requires review_result_ref and optional authenticated revision ref");
    }
    return context.kernel.prepareReviewRiskPause({
      stage: values.stage,
      reviewResultRef: input.review_result_ref,
    });
  }
  if (command === "run") {
    if (input !== undefined && (typeof input !== "object" || Array.isArray(input))) {
      throw new TypeError("run input must be an object when supplied");
    }
    const allowedRunFields = new Set(values.stage === "build-code"
      ? ["receipts", "attempt_id", "acceptance_coverage", "finding_dispositions"]
      : ["receipts", "attempt_id", "finding_dispositions"]);
    const suppliedInput = input ?? {};
    const unknownRunFields = Object.keys(suppliedInput).filter((key) => !allowedRunFields.has(key));
    if (unknownRunFields.length) throw new TypeError(`run input has unknown fields: ${unknownRunFields.join(", ")}`);
    if (Object.prototype.hasOwnProperty.call(suppliedInput.receipts ?? {}, "audit")) throw new TypeError("run audit summary is runtime-derived and caller-forbidden");
    const controlledInput = {
      ...suppliedInput,
      receipts: { ...(suppliedInput.receipts ?? {}) },
    };
    // The Stage Agent runs before this public delivery command.  A plain
    // Date.now() here starts the window too late and drops the real agent's
    // transcript and token events.  The host records the agent start before
    // launching it and passes that boundary through this private env var.
    const monitoringStartedAt = resolveRolloutStartedAt(process.env);
    const monitoringServices = services.monitoring === false
      ? services
      : {
        ...services,
        resolveMonitoringSource: services.resolveMonitoringSource ?? ((sourceInput) => resolveDefaultMonitoringSource({
          ...sourceInput,
          startedAtMs: monitoringStartedAt,
        })),
      };
    let attempt;
    try {
      attempt = await runOfficialStage(values.stage, context, controlledInput);
    } catch (error) {
      // A missing or stale Stage Agent outcome is an execution fact, not a
      // reason to hide the gap. Preserve the fail-loud run error and publish
      // the existing monitoring facts as unknown so status cannot look green.
      if (error?.code === "MATERIAL_INCOMPLETE"
          && CANONICAL_STAGE_SLUGS.includes(values.stage)
          && services.monitoring !== false
          && context.storageRoot
          && context.task?.taskPath) {
        try {
          // Some hosts create the task handle before initializing the facts
          // store. Initialize the existing store only so this missing-outcome
          // fact can be recorded; the original run error remains authoritative.
          initializeTaskStore(context.task.taskPath, { taskId: context.identity.taskId });
          const runSidecar = services.runMonitoringSidecar ?? runMonitoringSidecar;
          await runSidecar({
            context,
            services: monitoringServices,
            stageOutcome: {
              attempt_id: `missing-stage-outcome-${values.stage}`,
              stage_outcome_status: "unavailable",
              step_outcomes: [],
              skill_outcomes: [],
              quality_fact_refs: [],
            },
          });
        } catch (monitoringError) {
          const message = `monitoring missing-outcome fact failed: ${monitoringError instanceof Error ? monitoringError.message : String(monitoringError)}`;
          try {
            if (typeof services.onMonitoringWarning === "function") await services.onMonitoringWarning({ context, error: monitoringError });
            else process.emitWarning(message, { code: "WORKFLOWHUB_MONITORING_MISSING_OUTCOME" });
          } catch (warningError) {
            process.emitWarning(`monitoring missing-outcome warning callback failed: ${warningError instanceof Error ? warningError.message : String(warningError)}`, { code: "WORKFLOWHUB_MONITORING_WARNING" });
          }
        }
      }
      throw error;
    }
    if (CANONICAL_STAGE_SLUGS.includes(values.stage) && services.monitoring !== false && context.storageRoot && context.task?.taskPath) {
      try {
        // A successful official run may be the first writer for this task.
        // Establish the canonical facts store before the single monitoring
        // sidecar reads or appends it; the sidecar must not depend on a prior
        // failed run having created the file.
        initializeTaskStore(context.task.taskPath, { taskId: context.identity.taskId });
        const runSidecar = services.runMonitoringSidecar ?? runMonitoringSidecar;
        await runSidecar({ context, services: monitoringServices, stageOutcome: bindStageOutcomeAttemptId(context, attempt) });
      }
      catch (error) {
        const message = `monitoring sidecar failed: ${error instanceof Error ? error.message : String(error)}`;
        try {
          if (typeof services.onMonitoringWarning === "function") await services.onMonitoringWarning({ context, error });
          else process.emitWarning(message, { code: "WORKFLOWHUB_MONITORING_SIDECAR" });
        } catch (warningError) {
          process.emitWarning(`monitoring warning callback failed: ${warningError instanceof Error ? warningError.message : String(warningError)}`, { code: "WORKFLOWHUB_MONITORING_WARNING" });
        }
        let fallbackError = null;
        try {
          const publishStale = services.publishStaleMonitoringSnapshot ?? publishStaleMonitoringSnapshot;
          publishStale({ context, services: monitoringServices, message });
        } catch (candidateError) {
          fallbackError = candidateError;
          try {
            if (typeof services.onMonitoringWarning === "function") await services.onMonitoringWarning({ context, error: candidateError });
            else process.emitWarning(`monitoring stale fallback failed: ${candidateError instanceof Error ? candidateError.message : String(candidateError)}`, { code: "WORKFLOWHUB_MONITORING_FALLBACK" });
          } catch (warningError) {
            process.emitWarning(`monitoring fallback warning callback failed: ${warningError instanceof Error ? warningError.message : String(warningError)}`, { code: "WORKFLOWHUB_MONITORING_WARNING" });
          }
        }
        if (fallbackError) {
          const publicationError = new Error(
            `${message}; stale fallback also failed: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}`,
            { cause: fallbackError },
          );
          publicationError.code = "WORKFLOWHUB_MONITORING_PUBLICATION_FAILED";
          throw publicationError;
        }
      }
    }
    return attempt;
  }
  if (command === "confirm") {
    return context.kernel.publishHumanConfirmation(values.stage, {
      decision: values.decision,
      ...(values.attempt === undefined ? {} : { subject_ref: values.attempt }),
    });
  }
  if (command === "authorize-operation") {
    return context.kernel.publishIrreversibleAuthorization({
      operation: values.operation,
      ...(values["subject-ref"] === undefined ? {} : { subject_ref: values["subject-ref"] }),
    });
  }
  throw new Error(`unknown internal runtime operation: ${command}`);
}

export async function stageRuntimeCliMain(argv = process.argv.slice(2), {
  delegate = stageRuntimeMain,
  services = {},
  skillBundleContract = LOCAL_SKILL_BUNDLE_CONTRACT,
  runnerContract = LOCAL_RUNNER_CONTRACT,
} = {}) {
  const [behavior, ...raw] = argv;
  if (behavior === "--help" || behavior === "help") {
    return {
      behaviors: ["doctor", "status", "run", "review", "verify", "confirm", "authorize"],
      actions: {
        doctor: ["workspace"],
        status: ["begin", "repair"],
        run: ["execute", "draft"],
        review: ["risk"],
        verify: ["execute"],
        confirm: ["decision"],
        authorize: ["commit", "push", "merge", "archive", "cleanup"],
      },
    };
  }
  if (!RUNTIME_BEHAVIORS.includes(behavior)) throw new Error("unknown public runtime behavior");
  const actionArgument = raw.find((item) => item.startsWith("--action="));
  if (!actionArgument) throw new TypeError("public runtime behavior requires --action=<high-level-action>");
  const action = actionArgument.slice("--action=".length);
  const publicRoute = `${behavior}:${action}`;
  const internalOperation = ({
    "doctor:workspace": "doctor",
    "status:begin": "status",
    "status:repair": "status",
    "run:execute": "run",
    "run:draft": "artifact",
    "review:risk": "review-risk-pause",
    "verify:execute": "capture-tests",
    "confirm:decision": "confirm",
    "authorize:commit": "authorize-operation",
    "authorize:push": "authorize-operation",
    "authorize:merge": "authorize-operation",
    "authorize:archive": "authorize-operation",
    "authorize:cleanup": "authorize-operation",
  })[publicRoute];
  if (!internalOperation) throw new Error("unknown public runtime action");
  const delegatedArgv = [
    internalOperation,
    ...raw.filter((item) => item !== actionArgument),
    ...(behavior === "authorize" ? [`--operation=${action}`] : []),
  ];
  return invokeRuntimeCommand(
    behavior,
    Object.freeze({ action, argv: delegatedArgv }),
    ({ argv: internalArgv }) => delegate(internalArgv, { services }),
    { skillBundleContract, runnerContract },
    internalOperation,
  );
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  stageRuntimeCliMain().then((result) => {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  }).catch((error) => {
    process.stderr.write(`${error?.stack ?? error}\n`);
    process.exitCode = 1;
  });
}

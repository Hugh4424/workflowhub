#!/usr/bin/env node

import { closeSync, existsSync, openSync, readFileSync, readSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { homedir } from "node:os";
import { basename, isAbsolute, resolve } from "node:path";
import process from "node:process";
import { StringDecoder } from "node:string_decoder";
import { fileURLToPath, pathToFileURL } from "node:url";
import { recordSimpleReviewResult } from "../../runtime/review/review-record-route.mjs";
import { assertRuntimeAuthority } from "../../core/runtime-mode.mjs";

import {
  authenticateStageWriteBoundary,
  bootstrapStage,
  prepareMakeDecisionWorkspace,
} from "../../runtime/stage/stage-context.mjs";
import { authenticateStageOutcomeForProjection, runOfficialStage } from "../../runtime/stage/stage-runner.mjs";
import { validateStageInvocation } from "../../runtime/stage/stage-handlers.mjs";
import { runStageReflection } from "../../runtime/stage/stage-reflect.mjs";
import {
  validateAcceptanceEvidence,
  publishEvidence,
  writeCanonicalSpecClarifyReceipt,
} from "../../runtime/evidence/canonical-receipt-writer.mjs";
import { runCapture as captureBuildCodeTests } from "../../workflows/build-code/capture.mjs";
import { runCapture as captureVerifyCodeTests } from "../../workflows/verify-code/capture.mjs";
import { invokeRuntimeCommand, RUNTIME_BEHAVIORS } from "../../runtime/interface/runtime-facade.mjs";
import { LOCAL_RUNNER_CONTRACT, LOCAL_SKILL_BUNDLE_CONTRACT } from "../../runtime/interface/runner-contract.mjs";
import { deriveCurrentProductRelease, deriveProductRelease, deriveStageCompletion, deriveStageOutcomeStatuses, deriveStageProgress, stageMaterialScopeRevisions } from "../../runtime/stage/completion-predicates.mjs";
import { activeAcceptanceCriterionIds } from "../../runtime/stage/stage-content-contracts.mjs";
import { evaluateFactFreshness } from "../../runtime/evidence/freshness.mjs";
import { CURRENT_MATERIAL_FILES } from "../../runtime/task/material-workspace.mjs";
import { materialRevisionFromValues } from "../../runtime/task/git-worktree-snapshot.mjs";
import { createRegisteredCodexSource, parseRegisteredRequirementTranscript } from "../../runtime/evidence/codex-transcript-adapter.mjs";
import { isDshTranscriptPath, normalizeDshTranscript, readDshTranscriptText } from "../../runtime/evidence/dsh-transcript.mjs";
import { createTranscriptSourceReader } from "../../runtime/evidence/fact-collector.mjs";
import { bindCodexSessionTask, buildWorkflowHubSessionInput, currentCodexSessionId, readCurrentCodexSession } from "../host/workflowhub-codex-session-state.mjs";
import { publishCurrentWorkflowHubSession } from "../host/workflowhub-stage-agent-bridge.mjs";
import { resolveStorageRoot } from "../../runtime/evidence/storage-root.mjs";

const DESIGN_ARTIFACTS = Object.freeze({
  "make-decision": new Set(["decision-log.md"]),
  "build-spec": new Set(["spec.md"]),
  "build-plan": new Set(["plan.md", "tasks.md"]),
});
const RUNNER_ROOT = fileURLToPath(new URL("../../", import.meta.url));
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const GIT_OID = /^[a-f0-9]{40,64}$/;
const CODEX_SESSION_ID = /^[A-Za-z0-9._:-]{8,160}$/;
const WORKFLOW_STAGES = Object.freeze(["make-decision", "build-spec", "build-plan", "build-code", "verify-code"]);

export function resolveWorkflowHubIdentity(values, cwd = process.cwd(), env = process.env) {
  const hasProject = typeof values.project === "string" && values.project.trim() !== "";
  const hasTask = typeof values.task === "string" && values.task.trim() !== "";
  if (hasProject !== hasTask) throw new TypeError("--project and --task must be supplied together, or omitted inside a bound WorkflowHub session");
  const sessionId = currentCodexSessionId(env);
  // Explicit identity is already authenticated by the TaskHandle/workspace
  // boundary.  Without a session id there is no session to select, so do not
  // scan every host session and turn unrelated parallel sessions into a
  // blocker.  A supplied exact session id is still inspected to prevent an
  // explicit temporary CLI task from replacing that session's selected task.
  if (hasProject && !sessionId) {
    return Object.freeze({ project: values.project, task: values.task, taskPath: undefined, source: "explicit" });
  }
  const current = readCurrentCodexSession({ cwd, sessionId });
  if (current.status === "conflict") throw new Error("current WorkflowHub session has multiple active Codex sessions");
  const binding = current.status === "present" ? current.task_binding : null;
  if (binding) {
    if (hasProject && (values.project !== binding.project_name || values.task !== binding.task_id)) {
      // Explicit task identity is authenticated by TaskHandle/workspace at
      // the normal write boundary. Session handoff is supporting provenance;
      // a stale binding becomes unavailable evidence, not a public blocker.
      return Object.freeze({ project: values.project, task: values.task, taskPath: undefined, source: "explicit-over-session-binding" });
    }
    // Older handoffs predate the requirement snapshot. Refreshing the same
    // binding is safe: it only freezes transcript identities at the original
    // bound_at_ms and never changes a valid existing snapshot.
    bindCodexSessionTask({
      projectName: binding.project_name,
      taskId: binding.task_id,
      taskPath: binding.task_path,
      cwd,
      sessionId: current.session_id,
    });
    return Object.freeze({ project: binding.project_name, task: binding.task_id, taskPath: binding.task_path, source: "session-binding" });
  }
  if (!hasProject) throw new Error("current WorkflowHub session has no task binding; run task-bootstrap in this session first");
  return Object.freeze({ project: values.project, task: values.task, taskPath: undefined, source: "explicit" });
}

function bindExplicitWorkflowHubIdentity(context, cwd) {
  const sessionId = currentCodexSessionId(process.env);
  const current = readCurrentCodexSession({ cwd, sessionId });
  if (current.status !== "present") return null;
  return bindCodexSessionTask({
    projectName: context.identity.projectName,
    taskId: context.identity.taskId,
    taskPath: context.task.taskPath,
    cwd,
    sessionId,
  });
}

function safeRolloutId(value) {
  return String(value).replace(/[^A-Za-z0-9._:-]/g, "_");
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

function locateCodexRequirementTranscript({ env = process.env, home = homedir(), cwd = process.cwd() } = {}) {
  const sessionId = currentCodexSessionId(env);
  const handoff = readCurrentCodexSession({
    cwd,
    sessionId: typeof sessionId === "string" && CODEX_SESSION_ID.test(sessionId) ? sessionId : null,
  });
  if (handoff.status === "conflict") throw new Error("WorkflowHub Codex session handoff has multiple active sessions for this workspace");
  const requirementMessages = handoff.status === "present" ? handoff.task_binding?.requirement_messages ?? [] : [];
  const explicit = env.CODEX_ROLLOUT_PATH ?? env.WORKFLOWHUB_CODEX_ROLLOUT_PATH;
  if (typeof explicit === "string" && explicit.trim() !== "") {
    if (typeof sessionId !== "string" || !CODEX_SESSION_ID.test(sessionId)) return null;
    const target = isSafeCodexRolloutPath(explicit, { home, threadId: sessionId });
    if (!target) throw new Error("CODEX_ROLLOUT_PATH must point to the current .codex/sessions rollout for the current Codex session");
    return { threadId: sessionId, target, requirementMessages };
  }
  if (handoff.status !== "present") return null;
  const handoffThreadId = handoff.session_id;
  if (!CODEX_SESSION_ID.test(handoffThreadId)) throw new Error("WorkflowHub Codex session handoff has an invalid session_id");
  if (!handoff.transcript_path) return null;
  const target = isSafeCodexRolloutPath(handoff.transcript_path, { home, threadId: handoffThreadId });
  // A handoff from another isolated HOME is not evidence we may read.  Treat
  // it as an unavailable source so the official run can still publish honest
  // stage/step/skill facts instead of dropping the whole sidecar write.
  if (!target) return null;
  return { threadId: handoffThreadId, target, requirementMessages };
}

/**
 * DSH keeps the authentic session log at ~/.dsh/sessions/<cwd-key>/<session>/
 * session.jsonl.zstd (concatenated zstd frames).  Mirror the Codex locate
 * contract against the same session handoff: the frozen requirement snapshot
 * comes from the task binding, and the transcript is re-read for hash
 * verification — never synthesized.
 */
function locateDshTranscript({ env = process.env, home = homedir(), cwd = process.cwd() } = {}) {
  const sessionId = currentCodexSessionId(env);
  const handoff = readCurrentCodexSession({
    cwd,
    sessionId: typeof sessionId === "string" && CODEX_SESSION_ID.test(sessionId) ? sessionId : null,
  });
  if (handoff.status === "conflict") throw new Error("WorkflowHub session handoff has multiple active sessions for this workspace");
  if (handoff.status !== "present") return null;
  const requirementMessages = handoff.task_binding?.requirement_messages ?? [];
  const handoffSessionId = handoff.session_id;
  if (typeof handoffSessionId !== "string" || !CODEX_SESSION_ID.test(handoffSessionId)) throw new Error("WorkflowHub session handoff has an invalid session_id");
  if (!handoff.transcript_path) return null;
  const target = isDshTranscriptPath(handoff.transcript_path, { home, sessionId: handoffSessionId });
  // Same honesty rule as the Codex path: an unreadable or foreign transcript
  // is an unavailable source, never an error that drops sidecar facts.
  if (!target || !existsSync(target) || !statSync(target).isFile()) return null;
  return { sessionId: handoffSessionId, target, requirementMessages };
}

function codexUserInputText(outer) {
  const payload = outer?.payload;
  if (outer?.type !== "response_item" || payload?.type !== "message" || payload?.role !== "user") return null;
  if (!Array.isArray(payload.content)) return null;
  const parts = payload.content
    .filter((part) => part?.type === "input_text" && typeof part.text === "string" && part.text.trim() !== "")
    .map((part) => part.text);
  return parts.length > 0 ? parts.join("\n") : null;
}

function codexUserMessageId(outer, payload, lineIndex) {
  const candidate = payload?.id ?? outer?.id ?? `codex-user-${lineIndex + 1}`;
  const normalized = safeRolloutId(candidate);
  return CODEX_SESSION_ID.test(normalized) ? normalized : `codex-user-${lineIndex + 1}`;
}

function selectedRequirementMessages(value) {
  if (!Array.isArray(value)) return [];
  const messages = [];
  const ids = new Set();
  for (const [index, message] of value.entries()) {
    if (!message || typeof message !== "object" || Array.isArray(message)
      || !CODEX_SESSION_ID.test(message.id ?? "") || ids.has(message.id)
      || message.order !== index + 1 || !/^[a-f0-9]{64}$/.test(message.content_hash ?? "")) return [];
    ids.add(message.id);
    messages.push(message);
  }
  return messages;
}

function* readUtf8Lines(path) {
  const fd = openSync(path, "r");
  const decoder = new StringDecoder("utf8");
  const buffer = Buffer.allocUnsafe(1024 * 1024);
  let carry = "";
  try {
    while (true) {
      const bytes = readSync(fd, buffer, 0, buffer.length, null);
      if (bytes === 0) break;
      carry += decoder.write(buffer.subarray(0, bytes));
      const lines = carry.split(/\r?\n/);
      carry = lines.pop() ?? "";
      yield* lines;
    }
    carry += decoder.end();
    if (carry !== "") yield carry;
  } finally {
    closeSync(fd);
  }
}

function normalizeCodexRequirementTranscript(raw, { taskId, runId, attemptId, stage, sessionId, requirementMessages = [] }) {
  const records = [];
  const selected = selectedRequirementMessages(requirementMessages);
  const selectedById = new Map(selected.map((message) => [message.id, message]));
  const emittedRequirementIds = new Set();
  const lines = typeof raw === "string" || Buffer.isBuffer(raw) || raw instanceof Uint8Array
    ? String(raw).split(/\r?\n/)
    : raw;
  let lineIndex = 0;
  for (const line of lines) {
    const currentLine = lineIndex;
    lineIndex += 1;
    if (!line.trim()) continue;
    let outer;
    try { outer = JSON.parse(line); } catch { continue; }
    if (!outer || typeof outer !== "object" || !outer.payload || typeof outer.payload !== "object") continue;
    const userText = codexUserInputText(outer);
    if (userText === null) continue;
    const userMessageId = codexUserMessageId(outer, outer.payload, currentLine);
    const selectedMessage = selectedById.get(userMessageId);
    if (!selectedMessage) continue;
    records.push(JSON.stringify({
      id: selectedMessage.id,
      type: "requirement_message",
      task_id: taskId,
      run_id: runId,
      stage,
      ...(attemptId ? { attempt_id: attemptId } : {}),
      session_id: sessionId,
      source_version: "v1",
      order: selectedMessage.order,
      content: userText,
      content_hash: selectedMessage.content_hash,
    }));
    emittedRequirementIds.add(selectedMessage.id);
  }
  for (const message of selected) {
    if (emittedRequirementIds.has(message.id)) continue;
    records.push(JSON.stringify({
      id: message.id,
      type: "requirement_message",
      task_id: taskId,
      run_id: runId,
      stage,
      ...(attemptId ? { attempt_id: attemptId } : {}),
      session_id: sessionId,
      source_version: "v1",
      order: message.order,
      content: "",
      content_hash: message.content_hash,
    }));
  }
  return records.join("\n");
}

/**
 * The launcher owns the host path and turns it into a private reader capability.
 * Runtime facts only receive the opaque thread reference and normalized events.
 */
export function resolveRequirementSource({ context, task_id, run_id, attempt_id, stage = null, env = process.env, home = homedir(), cwd = process.cwd() } = {}) {
  const located = locateCodexRequirementTranscript({ env, home, cwd });
  if (!located) {
    const dsh = locateDshTranscript({ env, home, cwd });
    if (!dsh) return null;
    const sessionRef = safeRolloutId(dsh.sessionId);
    return createRegisteredCodexSource({
      source_id: `dsh-session-${sessionRef}`,
      source_ref: `dsh-transcript-${sessionRef}`,
      registration_id: `launcher-dsh-${sessionRef}`,
      required: true,
      task_id: task_id ?? context?.identity?.taskId,
      run_id: run_id ?? context?.workflowRunId,
      session_id: sessionRef,
      source_format: "jsonl",
      source_version: "v1",
      cli_version: env.DSH_CLI_VERSION?.trim() || "dsh-host",
      adapter_version: "dsh-transcript-adapter.v1",
      capabilities: ["requirement_message"],
      reader: createTranscriptSourceReader(() => normalizeDshTranscript(readDshTranscriptText(dsh.target), {
        taskId: task_id ?? context?.identity?.taskId,
        runId: run_id ?? context?.workflowRunId,
        attemptId: attempt_id ?? context?.attempt_id ?? null,
        stage: stage ?? context?.stage ?? null,
        sessionId: sessionRef,
        requirementMessages: dsh.requirementMessages,
      })),
    });
  }
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
    cli_version: env.CODEX_CLI_VERSION?.trim() || "codex-host",
    adapter_version: "codex-rollout-adapter.v1",
      capabilities: ["requirement_message"],
    reader: createTranscriptSourceReader(() => normalizeCodexRequirementTranscript(readUtf8Lines(located.target), {
      taskId: task_id ?? context?.identity?.taskId,
      runId: run_id ?? context?.workflowRunId,
      attemptId: attempt_id ?? context?.attempt_id ?? null,
      stage: stage ?? context?.stage ?? null,
      sessionId: safeRolloutId(located.threadId),
      requirementMessages: located.requirementMessages,
    })),
  });
}

/**
 * The public run is the automatic caller for a normal WorkflowHub session.
 * It consumes the exact hook handoff and boundary events, then reuses the
 * existing authenticated bridge.  An explicit receipt remains authoritative
 * for compatibility; no session directory scan or task/path inference occurs.
 */
export function bindCurrentSessionOutcome({ context, stage, input, cwd = process.cwd() } = {}) {
  if (typeof input?.receipts?.stage_outcomes === "string" && input.receipts.stage_outcomes.trim()) return input;
  const taskId = context?.identity?.taskId;
  const session = buildWorkflowHubSessionInput({ cwd, stage, taskId, sessionId: currentCodexSessionId(process.env) });
  if (session.status !== "present") return input;
  let boundInput = input;
  if (stage === "build-spec" && session.spec_clarify && input?.receipts?.clarify === undefined) {
    const currentMaterialRevision = context.kernel.currentVNextMaterialRevision();
    const currentSnapshot = context.kernel.currentVNextSnapshot();
    if (session.spec_clarify.material_revision !== currentMaterialRevision
        || session.spec_clarify.snapshot_tree !== currentSnapshot.tree) return boundInput;
    const receipt = writeCanonicalSpecClarifyReceipt({
      task: context.task,
      workspace: context.workspace ?? context.candidateWorkspace,
      snapshotTree: session.spec_clarify.snapshot_tree,
      materialRevision: session.spec_clarify.material_revision,
      reason: session.spec_clarify.reason,
      lifecycleRounds: session.spec_clarify.lifecycle_rounds,
      transcript: session.spec_clarify.transcript,
    });
    boundInput = { ...input, receipts: { ...(input.receipts ?? {}), clarify: receipt.ref } };
  }
  const stageOutcome = stage === "verify-code" ? session.code_review : session.spec_analyze;
  if (!stageOutcome || typeof stageOutcome !== "object" || Array.isArray(stageOutcome)) return boundInput;
  // The host handoff can outlive a source edit.  Include the runtime's
  // current source/material identity in the automatic attempt key so a
  // rerun after code changes gets a fresh immutable attempt instead of
  // replaying the old attempt id with different authenticated bytes.
  const currentSnapshot = context.kernel.currentVNextSnapshot();
  const currentMaterialRevision = context.kernel.currentVNextMaterialRevision();
  const attemptId = typeof boundInput?.attempt_id === "string" && boundInput.attempt_id.trim()
    ? boundInput.attempt_id
    : `attempt-${sha256(JSON.stringify({
      task_id: taskId,
      stage,
      workflow_run_id: context?.workflowRunId ?? null,
      snapshot_tree: currentSnapshot.tree,
      material_revision: currentMaterialRevision,
      host: session.host,
      source_id: session.source_id,
      source_family: session.source_family,
      session_id: session.session_id,
      source_ref: session.source_ref,
      events: session.events,
      stage_outcome: stageOutcome,
    })).slice(0, 32)}`;
  const requirementAuthentication = stage === "make-decision"
    ? parseRegisteredRequirementTranscript(resolveRequirementSource({
      context,
      task_id: taskId,
      run_id: context.workflowRunId,
      attempt_id: attemptId,
      stage,
      cwd,
    }), { stage })
    : null;
  let published;
  try {
    published = publishCurrentWorkflowHubSession({
      context,
      stage,
      attemptId,
      requirementAuthentication,
      input: {
        session: {
          host: session.host,
          source_id: session.source_id,
          source_family: session.source_family,
          session_id: session.session_id,
          task_id: session.task_id,
          source_ref: session.source_ref,
          status: session.status_value,
          events: session.events,
          ...(stage === "verify-code" ? { code_review: session.code_review } : { spec_analyze: session.spec_analyze }),
        },
      },
    });
  } catch (error) {
    // A host session can outlive the material revision it reviewed.  Do not
    // turn that stale sidecar into a new current outcome; the official route
    // will keep the existing missing/unavailable quality fact visible.
    if (error?.code === "BRIDGE_STALE_STAGE_OUTCOME") return boundInput;
    throw error;
  }
  return {
    ...boundInput,
    attempt_id: attemptId,
    receipts: { ...(boundInput.receipts ?? {}), stage_outcomes: published.ref },
  };
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

function evaluateFreshnessWithReuse({ fact, factRaw, factSha256, currentSnapshot, materialRevision, materials, read, workspaceRoot, taskId }) {
  const acceptanceEvidence = (fact.evidence ?? []).find((entry) => entry?.evidence_type === "acceptance_evidence" && typeof entry?.ref === "string" && typeof entry?.sha256 === "string");
  if (acceptanceEvidence && currentSnapshot?.tree && materialRevision) {
    try {
      const raw = read(acceptanceEvidence.ref);
      const parsed = validateAcceptanceEvidence(JSON.parse(raw));
      if (
        parsed.freshness?.status === "current"
        && parsed.freshness.snapshot_tree === currentSnapshot.tree
        && parsed.freshness.material_revision === materialRevision
        && parsed.freshness.evidence_freshness.every((entry) => entry.status === "current" && entry.sha256 === acceptanceEvidence.sha256)
      ) {
        return Object.freeze({
          fact_ref: fact.ref,
          status: "current",
          authenticated: true,
          reused: true,
          dependencies: Object.freeze({ material: "current", tree: "current", fact: "current", evidence: "current" }),
        });
      }
    } catch {
      // Fall through to full freshness evaluation on any mismatch or validation failure.
    }
  }
  if (!currentSnapshot?.tree || !materialRevision) {
    return Object.freeze({ fact_ref: fact.ref, status: "unknown", authenticated: false });
  }
  return evaluateFactFreshness(
    { ...fact, ref: fact.ref, sha256: factSha256 },
    {
      material_revision: materialRevision,
      material_scope_revisions: stageMaterialScopeRevisions(materials),
      snapshot_tree: currentSnapshot.tree,
    },
    { read, workspaceRoot, taskId },
  );
}
function currentProductReleaseView({ context, currentSnapshot, materialRevision, materials }) {
  const stageOutcomeRefs = Object.fromEntries(WORKFLOW_STAGES.map((stage) => [
    stage,
    context.task.listCanonicalStageOutcomeRefs(stage),
  ]));
  const stageOutcomeStatuses = deriveStageOutcomeStatuses({
    task_id: context.identity.taskId,
    read: context.task.readRecord,
    stage_outcome_refs: stageOutcomeRefs,
    snapshot_tree: currentSnapshot.tree,
    material_revision: materialRevision,
    material_scope_revisions: stageMaterialScopeRevisions(materials),
    snapshot_root: context.workspace?.worktreeRoot ?? context.candidateWorkspace?.worktreeRoot ?? null,
    authenticate: ({ stage, ref }) => authenticateStageOutcomeForProjection({ ...context, stage }, stage, ref),
  });
  return deriveCurrentProductRelease({
    task_id: context.identity.taskId,
    read: context.task.readRecord,
    refs: context.task.listCanonicalQualityFactRefs(),
    snapshot_tree: currentSnapshot?.tree,
    material_revision: materialRevision,
    material_scope_revisions: stageMaterialScopeRevisions(materials),
    snapshot_root: context.workspace?.worktreeRoot ?? context.candidateWorkspace?.worktreeRoot ?? null,
    expected_acceptance_ids: activeAcceptanceCriterionIds(materials["spec.md"] ?? ""),
    evaluate_freshness: evaluateFactFreshness,
    stage_outcome_statuses: stageOutcomeStatuses,
  });
}

// Keep status as a read-only projection of the existing facts. The grouping
// makes the next action obvious without turning quality facts into a new gate
// or hiding unavailable/not-applicable evidence.
export function deriveStatusGroups({ stage = null, quality, productRelease, observations = [] } = {}) {
  // Status is a projection of the same authenticated/current facts used by
  // deriveStageCompletion. Never let a stale or unauthenticated attempt hide
  // a current actionable gap, and never let array order decide which attempt
  // wins.
  const current = observations.filter((observation) => observation?.authenticated === true
    && observation?.freshness?.status === "current");
  const byRef = new Map();
  const bySubject = new Map();
  for (const observation of current) {
    const fact = observation?.fact?.value ?? observation?.fact;
    const subject = fact?.subject;
    if (typeof observation?.fact?.ref === "string") byRef.set(observation.fact.ref, observation);
    if (typeof subject !== "string" || subject.trim() === "") continue;
    const candidates = bySubject.get(subject) ?? [];
    candidates.push(observation);
    bySubject.set(subject, candidates);
  }
  const latestFor = (subject) => {
    const candidates = bySubject.get(subject) ?? [];
    if (candidates.length === 0) return null;
    const ranked = candidates.map((observation) => ({
      observation,
      recordedAt: Date.parse((observation.fact?.value ?? observation.fact)?.recorded_at ?? ""),
    }));
    if (ranked.some(({ recordedAt }) => !Number.isFinite(recordedAt))) return { conflict: true };
    const latestRecordedAt = Math.max(...ranked.map(({ recordedAt }) => recordedAt));
    const latest = ranked.filter(({ recordedAt }) => recordedAt === latestRecordedAt);
    return latest.length === 1 ? latest[0].observation : { conflict: true };
  };
  const selectedFor = (subject) => {
    const selectedRef = quality?.predicates?.[subject]?.fact_ref;
    return (selectedRef && byRef.get(selectedRef)) ?? latestFor(subject);
  };
  const actionable_now = [];
  const external_unavailable = [];
  const not_applicable = [];
  const missing = quality?.missing ?? [];
  for (const subject of missing) {
    const selected = selectedFor(subject);
    const fact = selected?.fact?.value ?? selected?.fact;
    if (selected?.conflict) {
      actionable_now.push(subject);
    } else if (["unavailable", "unknown"].includes(fact?.status)) {
      external_unavailable.push(`${subject}:${fact.status}`);
    } else if (fact?.status === "not_applicable") {
      not_applicable.push(`${subject}:not_applicable`);
    } else {
      actionable_now.push(subject);
    }
  }
  const quality_gaps = [...new Set(productRelease?.reasons ?? [])];
  const close_supported = stage === "verify-code";
  // Read-only preflight for physical close. These are facts to surface to the
  // operator, never a new gate or a replacement for verify-code quality.
  const close_preparation_gaps = close_supported
    ? [...new Set([
      ...missing.map((subject) => `verify-code prerequisite missing: ${subject}`),
      ...quality_gaps,
    ])]
    : [];
  return Object.freeze({
    actionable_now: Object.freeze(actionable_now),
    external_unavailable: Object.freeze(external_unavailable),
    not_applicable: Object.freeze(not_applicable),
    quality_gaps: Object.freeze(quality_gaps),
    release_gaps: Object.freeze(quality_gaps),
    close_supported,
    close_preparation_gaps: Object.freeze(close_preparation_gaps),
    next_action: actionable_now[0] ?? (external_unavailable[0] ?? null),
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
  if (!new Set(["doctor", "status", "artifact", "review-risk-pause", "review-record", "capture-tests", "capture-evidence", "preflight", "run", "reflect", "confirm", "authorize-operation"]).has(command)) {
    throw new TypeError("usage: stage-runtime.mjs <doctor|status|run|review|verify|confirm|authorize> --stage=<stage> --project=<project> --task=<task> [...]");
  }
  return { command, values };
}

function preflightDiagnostic(error) {
  if (error?.diagnostic && typeof error.diagnostic.path === "string") return error.diagnostic;
  return {
    path: "$",
    expected: "valid stage payload",
    actual: error?.message ?? String(error),
  };
}

function runPreflight(stage, input) {
  validateStageInvocation(stage, input);
  return { status: "valid", diagnostics: [] };
}

function privateEvidenceCaptureInput(input, worktreeRoot, now = () => new Date()) {
  if (!input || typeof input !== "object" || Array.isArray(input)
      || typeof input.source_path !== "string" || input.source_path.trim() === ""
      || typeof input.evidence_type !== "string"
      || Object.keys(input).some((key) => !new Set(["source_path", "evidence_type"]).has(key))) {
    throw new TypeError("capture-evidence input requires source_path and evidence_type only");
  }
  const sourcePath = input.source_path.trim();
  if (isAbsolute(sourcePath) || sourcePath.split(/[\\/]/).includes("..")) {
    throw new TypeError("capture-evidence source_path must be worktree-relative");
  }
  const recordedAt = now();
  if (!(recordedAt instanceof Date) || Number.isNaN(recordedAt.valueOf())) {
    throw new TypeError("capture-evidence clock must return a valid Date");
  }
  return Object.freeze({
    sourcePath: resolve(worktreeRoot, sourcePath),
    evidenceType: input.evidence_type,
    recordedAt: recordedAt.toISOString(),
  });
}

/**
 * The current host owns the session-memory/LLM reflection executor.  Keep the
 * runtime boundary explicit: a direct launcher without that capability must
 * publish an honest failed reflection instead of synthesizing judgment facts.
 */
export function stageReflectionPublication(services = {}) {
  if (!services || typeof services !== "object" || Array.isArray(services)) {
    throw new TypeError("stage-runtime services must be an object");
  }
  if (services.stageReflectionExecutor === undefined && services.runControlledUiQa === undefined) return Object.freeze({});
  if (typeof services.stageReflectionExecutor !== "function") {
    if (services.stageReflectionExecutor === undefined) return Object.freeze({ runControlledUiQa: services.runControlledUiQa });
    throw new TypeError("services.stageReflectionExecutor must be a function");
  }
  return Object.freeze({
    ...(services.stageReflectionExecutor ? { runStageReflection: services.stageReflectionExecutor } : {}),
    ...(services.runControlledUiQa ? { runControlledUiQa: services.runControlledUiQa } : {}),
  });
}

export async function stageRuntimeMain(argv = process.argv.slice(2), { services = {}, cwd = process.cwd() } = {}) {
  const { command, values } = parseArgs(argv);
  if (command === "preflight" || (command === "run" && values.action === "preflight")) {
    const prefix = command === "run" ? "run:" : "";
    const allowed = new Set(command === "run" ? ["action", "stage", "input"] : ["stage", "input"]);
    if (Object.keys(values).some((key) => !allowed.has(key))) throw new TypeError(`${prefix}preflight accepts only --stage and --input`);
    if (!new Set(["build-code", "verify-code"]).has(values.stage)) throw new TypeError(`${prefix}preflight requires --stage=build-code|verify-code`);
    if (typeof values.input !== "string" || values.input.trim() === "") throw new TypeError(`${prefix}preflight requires --input=<payload.json>`);
    const payload = JSON.parse(readFileSync(values.input, "utf8"));
    try {
      return runPreflight(values.stage, payload);
    } catch (error) {
      if (error?.preflight_protocol === true) return { status: "protocol_invalid", diagnostics: [preflightDiagnostic(error)] };
      throw error;
    }
  }
  if (Object.prototype.hasOwnProperty.call(values, "worktree-root") || Object.prototype.hasOwnProperty.call(values, "baseline-commit")) {
    throw new TypeError("--worktree-root/--baseline-commit are no longer supported; make-decision owns deterministic worktree preparation");
  }
  if (Object.prototype.hasOwnProperty.call(values, "runner-root")) throw new TypeError("--runner-root is forbidden; stage-runtime authenticates its own repository root");
  if (command === "review-risk-pause" && !values.input) {
    throw new TypeError(`${command} requires --input=<risk-input.json>`);
  }
  if (command === "review-record" && !values.input) {
    throw new TypeError(`${command} requires --input=<simple-review-result.json>`);
  }
  if (command === "capture-tests" && (!new Set(["build-code", "verify-code"]).has(values.stage) || !values.input)) {
    throw new TypeError("capture-tests requires --stage=build-code|verify-code --input=<test-capture.json>");
  }
  if (command === "capture-evidence" && (values.stage !== "build-code" || !values.input)) {
    throw new TypeError("capture-evidence requires --stage=build-code --input=<evidence-capture.json>");
  }
  if (command === "artifact" && (!values.name || !values.input)) throw new TypeError("artifact requires --name=<artifact.md> --input=<content-file>");
  if (command === "reflect" && (!values.stage || !values.input)) throw new TypeError("reflect requires --stage=<stage> --input=<judgment.json>");
  if (command === "authorize-operation") {
    if (!new Set(["commit", "push", "merge", "archive", "cleanup"]).has(values.operation)) throw new TypeError("authorize-operation requires --operation=commit|push|merge|archive|cleanup");
    if (typeof values["subject-ref"] !== "string" || values["subject-ref"].trim() === "") throw new TypeError("authorize-operation requires --subject-ref=<quality/confirmations/<sha256>.json>");
  }
  // Runtime quiescing is a hard launch boundary.  Check it before resolving
  // session identity so an unrelated/stale host session cannot mask the
  // authoritative refusal with a misleading multi-session binding error.
  const launchHome = homedir();
  const launchEnv = process.env;
  const launchStorageRoot = resolveStorageRoot({ env: launchEnv, home: launchHome });
  assertRuntimeAuthority(launchStorageRoot, {
    home: launchHome,
    expectedEpoch: launchEnv.WORKFLOWHUB_CUTOVER_EPOCH,
  });
  const identity = resolveWorkflowHubIdentity(values, cwd);
  let context = bootstrapStage(values.stage, {
    mode: "launcher",
    projectName: identity.project,
    taskId: identity.task,
    taskPath: identity.taskPath,
    runnerRoot: RUNNER_ROOT,
    readOnly: command === "status",
  });
  // An explicit CLI identity authenticates the requested TaskHandle, but it
  // is not a session-selector.  Only task-bootstrap may select/rebind the
  // current host session; otherwise an isolated runner/test child inheriting
  // CODEX_SESSION_ID could silently replace the active task binding.
  if (identity.source === "explicit") bindExplicitWorkflowHubIdentity(context, cwd);
  const input = new Set(["review-risk-pause", "review-record", "capture-tests", "capture-evidence", "run", "reflect"]).has(command)
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
      materialRevision = materialRevisionFromValues(materialValues);
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
        ? evaluateFreshnessWithReuse({
            fact: { ...value, ref },
            factRaw: raw,
            factSha256: sha256(raw),
            currentSnapshot: current,
            materialRevision,
            materials,
            read: context.task.readRecord,
            workspaceRoot: context.workspace?.worktreeRoot ?? context.candidateWorkspace?.worktreeRoot ?? null,
            taskId: context.task.identity.taskId,
          })
        : { status: "unknown", authenticated: false };
      observations.push({ fact: { ref, value }, authenticated: freshness.authenticated === true, recorded: true, freshness });
    }
    const stageOutcomeStatuses = current
      ? deriveStageOutcomeStatuses({
          task_id: context.identity.taskId,
          read: context.task.readRecord,
          stage_outcome_refs: Object.fromEntries(["make-decision", "build-spec", "build-plan", "build-code", "verify-code"].map((stage) => [stage, context.task.listCanonicalStageOutcomeRefs(stage)])),
          snapshot_tree: current.tree,
          material_revision: materialRevision,
          material_scope_revisions: stageMaterialScopeRevisions(materials),
          snapshot_root: context.workspace?.worktreeRoot ?? context.candidateWorkspace?.worktreeRoot ?? null,
          authenticate: ({ stage, ref }) => authenticateStageOutcomeForProjection({ ...context, stage }, stage, ref),
        })
      : null;
    const quality = deriveStageCompletion(values.stage, observations, {
      requireStageOutcome: stageOutcomeStatuses !== null,
      stageOutcomeStatus: stageOutcomeStatuses?.[values.stage] ?? "unavailable",
    });
    const progression = deriveStageProgress(values.stage, observations, materials);
    const productRelease = current
      ? currentProductReleaseView({ context, currentSnapshot: current, materialRevision, materials })
      : deriveProductRelease({
        stage_completions: [],
        acceptance_results: [],
        expected_acceptance_ids: activeAcceptanceCriterionIds(materials["spec.md"] ?? ""),
        verify_confirmation: null,
      });
    const statusGroups = deriveStatusGroups({ stage: values.stage, quality, productRelease, observations });
    return Object.freeze({
      ...progression,
      quality_status: quality.status,
      quality_missing: quality.missing,
      quality_fact_refs: Object.freeze(observations.map(({ fact }) => fact.ref).sort()),
      quality_predicates: quality.predicates,
      product_release_status: productRelease.status,
      product_release_reasons: productRelease.reasons,
      product_release_input_refs: productRelease.input_refs,
      status_groups: statusGroups,
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
  if (command === "capture-evidence") {
    const allowed = new Set(["stage", "project", "task", "input"]);
    if (Object.keys(values).some((key) => !allowed.has(key))) {
      throw new TypeError("capture-evidence accepts only --stage, --project, --task, and --input");
    }
    const capture = privateEvidenceCaptureInput(input, context.workspace.worktreeRoot, services.now);
    return publishEvidence({
      task: context.task,
      sourcePath: capture.sourcePath,
      sourceRoot: context.workspace.worktreeRoot,
      evidenceType: capture.evidenceType,
      publisher: "build-code",
      recordedAt: capture.recordedAt,
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
  if (command === "review-record") {
    if (!input || typeof input !== "object" || Array.isArray(input) || !Object.prototype.hasOwnProperty.call(input, "result")) {
      throw new TypeError("review-record input requires a 'result' field with the simple review public result");
    }
    const refs = recordSimpleReviewResult({
      task: context.task,
      result: input.result,
      kernel: context.kernel,
    });
    return { status: "recorded", ...refs };
  }
  if (command === "reflect") {
    const allowed = new Set(["stage", "project", "task", "input", "now"]);
    if (Object.keys(values).some((key) => !allowed.has(key))) {
      throw new TypeError("reflect accepts only --stage, --project, --task, --input, and optional --now");
    }
    if (!input || typeof input !== "object" || Array.isArray(input)) {
      throw new TypeError("reflect input must be a judgment object");
    }
    return runStageReflection(context, {
      input,
      ...(values.now === undefined ? {} : { now: values.now }),
    });
  }
  if (command === "run") {
    if (input !== undefined && (typeof input !== "object" || Array.isArray(input))) {
      throw new TypeError("run input must be an object when supplied");
    }
    const allowedRunFields = new Set(values.stage === "build-code"
      ? ["receipts", "attempt_id", "acceptance_coverage", "finding_dispositions", "contract_facts"]
      : ["receipts", "attempt_id", "finding_dispositions", "contract_facts"]);
    const suppliedInput = input ?? {};
    const unknownRunFields = Object.keys(suppliedInput).filter((key) => !allowedRunFields.has(key));
    if (unknownRunFields.length) throw new TypeError(`run input has unknown fields: ${unknownRunFields.join(", ")}`);
    if (Object.prototype.hasOwnProperty.call(suppliedInput.receipts ?? {}, "audit")) throw new TypeError("run audit summary is runtime-derived and caller-forbidden");
    // Missing, stale, or unavailable upstream quality facts remain visible in
    // quality/product-release projections, but never become a work permit.
    // The current stage is allowed to publish its own truthful incomplete
    // result so the same task can repair or add evidence without replaying
    // unrelated stages.
    const controlledInput = bindCurrentSessionOutcome({
      context,
      stage: values.stage,
      cwd,
      input: {
      ...suppliedInput,
      receipts: { ...(suppliedInput.receipts ?? {}) },
      },
    });
    return runOfficialStage(values.stage, context, controlledInput, stageReflectionPublication(services));
  }
  if (command === "confirm") {
    if (typeof values["reply-text"] !== "string" || values["reply-text"].trim() === "") throw new TypeError("confirm requires --reply-text=<user reply>");
    if (typeof values["step-slug"] !== "string" || values["step-slug"].trim() === "") throw new TypeError("confirm requires --step-slug=<current step>");
    return context.kernel.publishHumanConfirmation(values.stage, {
      decision: values.decision,
      ...(values.attempt === undefined ? {} : { subject_ref: values.attempt }),
      reply_text: values["reply-text"],
      step_slug: values["step-slug"],
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
  cwd = process.cwd(),
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
        run: ["execute", "preflight", "draft", "reflect"],
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
  if (behavior === "run" && action === "preflight") {
    const delegatedArgv = ["preflight", ...raw.filter((item) => item !== actionArgument)];
    return invokeRuntimeCommand(
      behavior,
      Object.freeze({ action, argv: delegatedArgv }),
      ({ argv: internalArgv }) => delegate(internalArgv, { services, cwd }),
      { skillBundleContract, runnerContract },
      "run",
    );
  }
  const publicRoute = `${behavior}:${action}`;
  const internalOperation = ({
    "doctor:workspace": "doctor",
    "status:begin": "status",
    "status:repair": "status",
    "run:execute": "run",
    "run:preflight": "run",
    "run:reflect": "reflect",
    "run:draft": "artifact",
    "review:risk": "review-risk-pause",
    "review:record": "review-record",
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
    ({ argv: internalArgv }) => delegate(internalArgv, { services, cwd }),
    { skillBundleContract, runnerContract },
    internalOperation,
  );
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  stageRuntimeCliMain().then((result) => {
    if (result?.status === "valid" && Array.isArray(result.diagnostics) && result.diagnostics.length === 0) {
      process.exitCode = 0;
      return;
    }
    const output = result?.status === "protocol_invalid" && Array.isArray(result.diagnostics)
      ? result.diagnostics
      : result;
    process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
    process.exitCode = result?.status === "protocol_invalid" ? 2 : 0;
  }).catch((error) => {
    if (error?.preflight_protocol === true && error?.diagnostic) {
      process.stdout.write(`${JSON.stringify([error.diagnostic], null, 2)}\n`);
      process.exitCode = 2;
      return;
    }
    process.stderr.write(`${error?.stack ?? error}\n`);
    process.exitCode = 1;
  });
}

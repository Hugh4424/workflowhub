#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  authenticateStageWriteBoundary,
  bootstrapStage,
  prepareMakeDecisionWorkspace,
  recoverMakeDecisionWorkspace,
} from "../core/stage-context.mjs";
import { persistWriteBoundaryPathCard } from "../runtime/evidence/write-boundary-preflight.mjs";
import { acceptStageAttempt, confirmStageAttempt, publishOfficialVerifyPassing, runOfficialStage } from "../core/stage-runner.mjs";
import { requiresHumanConfirmation } from "../runtime/stage/stage-acceptance-policy.mjs";
import {
  validateAcceptanceEvidence,
  writeCanonicalAuditSummary,
  writeOfficialComponentReceipt,
} from "../core/canonical-receipt-writer.mjs";
import { createStageContentEvidenceWriter } from "../core/stage-content-evidence.mjs";
import {
  createBuildSpecReceiptRecoveryRecords,
  issueBuildSpecRecoveryOwnerCapability,
} from "../core/build-spec-receipt-recovery.mjs";
import { runCapture as captureBuildCodeTests } from "../workflows/build-code/capture.mjs";
import { publishBuildCodePhaseEvidence } from "../workflows/build-code/phase-evidence.mjs";
import { runCapture as captureVerifyCodeTests } from "../workflows/verify-code/capture.mjs";
import { publishPhaseTraceLineage, supersedePhaseTraceLineage } from "./task-recovery.mjs";
import { ArtifactDir } from "../core/artifact-dir.mjs";
import { captureGitWorktreeSnapshot } from "../runtime/task/git-worktree-snapshot.mjs";
import { dispatchStageSkill, loadStageSkillManifest, preflightStageSkills } from "../runtime/stage/stage-skill-runtime.mjs";
import { invokeRuntimeCommand, RUNTIME_BEHAVIORS } from "../runtime/interface/runtime-facade.mjs";
import { LOCAL_RUNNER_CONTRACT, LOCAL_SKILL_BUNDLE_CONTRACT } from "../runtime/interface/runner-contract.mjs";

const DESIGN_ARTIFACTS = Object.freeze({
  "build-spec": new Set(["spec.md"]),
  "build-plan": new Set(["plan.md", "tasks.md"]),
});
const RUNNER_ROOT = fileURLToPath(new URL("../", import.meta.url));
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const SHA256 = /^[a-f0-9]{64}$/;
const GIT_OID = /^[a-f0-9]{40,64}$/;

export function normalizeAcceptanceEvidencePublication(input, snapshotTree) {
  if (!input || typeof input !== "object" || Array.isArray(input)
      || typeof input.acceptance_criterion_id !== "string"
      || !new Set(["pass", "fail"]).has(input.result)
      || !Array.isArray(input.refs)) {
    throw new TypeError("acceptance evidence input requires acceptance_criterion_id, result, refs, and optional summary");
  }
  const allowed = new Set(["acceptance_criterion_id", "result", "refs", "summary"]);
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
    ...(input.summary === undefined ? {} : { summary: input.summary }),
    snapshot_tree: snapshotTree,
  });
}

function publishAcceptedDecisionLog(context, accepted) {
  if (accepted?.stage !== "make-decision") return;
  const attemptRaw = context.task.readRecord(`results/make-decision/${accepted.attempt_ref}`);
  if (sha256(attemptRaw) !== String(accepted.integrity_hash ?? "").replace(/^sha256:/, "")) {
    throw new Error("accepted make-decision attempt changed before live artifact publication");
  }
  const attempt = JSON.parse(attemptRaw);
  const ref = attempt.facts?.decision_ref;
  const expectedHash = attempt.facts?.decision_hash;
  if (typeof ref !== "string" || !SHA256.test(expectedHash ?? "")) {
    throw new Error("accepted make-decision result is missing its canonical decision binding");
  }
  const content = context.task.readRecord(ref);
  if (sha256(content) !== expectedHash) {
    throw new Error("accepted make-decision decision binding changed before live artifact publication");
  }
  const artifacts = ArtifactDir.open(context.candidateWorkspace.worktreeRoot, context.task);
  artifacts.writeAtomic("decision-log.md", content);
  if (artifacts.read("decision-log.md") !== content) {
    throw new Error("live decision-log publication did not preserve accepted canonical bytes");
  }
}

function completedStep(task, stage, workflowRunId, stepId) {
  let raw;
  try { raw = task.readRecord("journal.jsonl"); } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
  return raw.split("\n").filter(Boolean).map((line) => JSON.parse(line)).some((event) =>
    event.workflow_run_id === workflowRunId && event.stage_slug === stage
    && event.step_id === stepId && event.attempt_id === "attempt-1"
    && event.event_type === "step_exit" && event.terminal_status === "success");
}

function requireCompletedMakeDecisionStep(context, stepId) {
  const runId = context.kernel.activeStageRun("make-decision").run.workflow_run_id;
  if (!completedStep(context.task, "make-decision", runId, stepId)) {
    throw new Error(`make-decision canonical producer did not complete step ${stepId}`);
  }
}

export function resumableBuildSpecAttempt(context, input) {
  const workflowRunId = context.kernel.activeStageRun("build-spec").run.workflow_run_id;
  let acceptedAttemptRef = null;
  try {
    acceptedAttemptRef = JSON.parse(context.task.readRecord("results/build-spec/accepted.json")).attempt_ref;
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  const candidates = context.task.listStageAttemptRefs("build-spec").map((ref) => {
    const attemptRef = ref.replace(/^results\/build-spec\//, "");
    const raw = context.task.readRecord(`results/build-spec/${attemptRef}`);
    return { attemptRef, raw, attempt: JSON.parse(raw) };
  }).filter(({ attemptRef, attempt }) =>
    attempt.workflow_run_id === workflowRunId && attemptRef !== acceptedAttemptRef);
  if (candidates.length === 0) return null;
  if (candidates.length !== 1) throw new Error("build-spec active run has multiple unpublished attempts; recovery is ambiguous");
  const [{ attemptRef, raw, attempt }] = candidates;
  const evidenceRefs = new Set((attempt.evidence_refs ?? []).map(({ ref }) => ref));
  for (const [name, ref] of Object.entries(input.receipts)) {
    if (!evidenceRefs.has(ref)) {
      throw new Error(`build-spec recovery input ${name} differs from the published attempt`);
    }
  }
  return { attempt_ref: attemptRef, integrity_hash: sha256(raw), attempt, resumed: true };
}

function parseArgs(argv) {
  const [command, ...raw] = argv;
  const values = {};
  for (const item of raw) {
    const split = item.indexOf("=");
    if (!item.startsWith("--") || split < 3) throw new TypeError(`invalid argument: ${item}`);
    values[item.slice(2, split)] = item.slice(split + 1);
  }
  if (!new Set(["prepare", "continue-stage", "start-run", "recover-run", "invoke-stage-skill", "verify-recovery", "invalidate-run", "invalidate-step-attempt", "invalidate-stage-attempt", "invalidate-review-binding", "publish-requirements-ledger", "publish-material-revision", "record-step-entry", "record-step-exit", "record-research", "rebind", "artifact", "receipt", "recover-spec-receipt", "capture-tests", "publish-content-evidence", "publish-phase-evidence", "publish-phase-trace-lineage", "supersede-phase-trace-lineage", "publish-acceptance-evidence", "review-risk-pause", "accept-review-risk", "run", "confirm", "accept", "reopen", "publish-verify-failure", "publish-verify-passing"]).has(command)) {
    throw new TypeError("usage: stage-runtime.mjs <prepare|continue-stage|start-run|recover-run|invoke-stage-skill|verify-recovery|...> --stage=<stage> --project=<project> --task=<task> [...]");
  }
  return { command, values };
}

export async function stageRuntimeMain(argv = process.argv.slice(2)) {
  const { command, values } = parseArgs(argv);
  if (Object.prototype.hasOwnProperty.call(values, "worktree-root") || Object.prototype.hasOwnProperty.call(values, "baseline-commit")) {
    throw new TypeError("--worktree-root/--baseline-commit are no longer supported; make-decision owns deterministic worktree preparation");
  }
  if (Object.prototype.hasOwnProperty.call(values, "runner-root")) throw new TypeError("--runner-root is forbidden; stage-runtime authenticates its own repository root");
  if (values.stage === "make-decision" && new Set(["record-step-entry", "record-step-exit"]).has(command)) {
    throw new TypeError("make-decision journal is runtime-owned; public record-step-entry/record-step-exit are forbidden");
  }
  if (!new Set(["receipt", "recover-spec-receipt", "publish-content-evidence"]).has(command)
      && (Object.prototype.hasOwnProperty.call(values, "revision") || Object.prototype.hasOwnProperty.call(values, "recover"))) {
    throw new TypeError("--revision is only valid for receipt or trusted stage-content publication");
  }
  if (command === "publish-content-evidence" && values.recover !== undefined) throw new TypeError("--recover is only valid for receipt");
  if (command === "receipt" && (!values.component || !values.input)) throw new TypeError("receipt requires --component and --input=<payload.json>");
  if (command === "recover-spec-receipt") {
    const allowed = new Set(["stage", "project", "task", "recover", "input"]);
    if (Object.keys(values).some((key) => !allowed.has(key))) throw new TypeError("recover-spec-receipt accepts only --stage, --project, --task, --recover, and --input");
    if (values.stage !== "build-spec" || values.recover !== "receipts/spec.json" || !values.input) {
      throw new TypeError("recover-spec-receipt requires --stage=build-spec --recover=receipts/spec.json --input=<recovery.json>");
    }
  }
  if (command === "capture-tests" && (!new Set(["build-code", "verify-code"]).has(values.stage) || !values.input)) throw new TypeError("capture-tests requires --stage=build-code|verify-code --input=<test-capture.json>");
  if (command === "publish-content-evidence" && (!values.kind || !values.input)) throw new TypeError("publish-content-evidence requires --kind and --input=<payload.json>");
  if (command === "start-run" && !values.reason) throw new TypeError("start-run requires --reason");
  if (command === "recover-run") {
    const allowed = new Set(["stage", "project", "task", "reason"]);
    if (Object.keys(values).some((key) => !allowed.has(key))) throw new TypeError("recover-run accepts only --stage, --project, --task, and --reason");
    if (values.stage !== "make-decision") throw new TypeError("recover-run is only valid for make-decision");
    if (!values.reason) throw new TypeError("recover-run requires --reason");
  }
  if (command === "invoke-stage-skill" && (!values.name || !values["invocation-key"])) {
    throw new TypeError("invoke-stage-skill requires --name and --invocation-key");
  }
  if (command === "continue-stage" && !values.input) throw new TypeError("continue-stage requires --input=<continuation.json>");
  if (command === "invalidate-run" && !values.input) throw new TypeError("invalidate-run requires --input=<invalidation.json>");
  if (command === "invalidate-step-attempt" && !values.input) throw new TypeError("invalidate-step-attempt requires --input=<invalidation.json>");
  if (command === "invalidate-stage-attempt" && !values.input) throw new TypeError("invalidate-stage-attempt requires --input=<invalidation.json>");
  if (command === "invalidate-review-binding" && !values.input) throw new TypeError("invalidate-review-binding requires --input=<invalidation.json>");
  if (new Set(["publish-requirements-ledger", "record-step-entry", "record-step-exit", "record-research"]).has(command) && !values.input) throw new TypeError(`${command} requires --input`);
  if (command === "record-research" && values.stage !== "make-decision") throw new TypeError("record-research is only valid for make-decision");
  if (command === "publish-phase-evidence") {
    if (values.stage !== "build-code" || !values.input) throw new TypeError("publish-phase-evidence requires --stage=build-code --input=<phase-evidence.json>");
    const allowed = new Set(["stage", "project", "task", "input"]);
    if (Object.keys(values).some((key) => !allowed.has(key))) throw new TypeError("publish-phase-evidence accepts only --stage, --project, --task, and --input");
  }
  if (command === "publish-phase-trace-lineage") {
    if (values.stage !== "build-code" || !values.input) throw new TypeError("publish-phase-trace-lineage requires --stage=build-code --input=<phase-trace-lineage.json>");
    const allowed = new Set(["stage", "project", "task", "input"]);
    if (Object.keys(values).some((key) => !allowed.has(key))) throw new TypeError("publish-phase-trace-lineage accepts only --stage, --project, --task, and --input");
  }
  if (command === "supersede-phase-trace-lineage") {
    if (values.stage !== "build-code" || !values.input) throw new TypeError("supersede-phase-trace-lineage requires --stage=build-code --input=<lineage-supersession.json>");
    const allowed = new Set(["stage", "project", "task", "input"]);
    if (Object.keys(values).some((key) => !allowed.has(key))) throw new TypeError("supersede-phase-trace-lineage accepts only --stage, --project, --task, and --input");
  }
  if (command === "publish-acceptance-evidence" && (values.stage !== "verify-code" || !values.input)) throw new TypeError("publish-acceptance-evidence requires --stage=verify-code --input=<acceptance-evidence.json>");
  if (new Set(["review-risk-pause", "accept-review-risk"]).has(command) && !values.input) {
    throw new TypeError(`${command} requires --input=<risk-input.json>`);
  }
  if (command === "artifact" && (!values.name || !values.input)) throw new TypeError("artifact requires --name=<artifact.md> --input=<content-file>");
  if (command === "reopen" && (values.stage !== "build-code" || !values["verify-attempt"] || !values["failure-evidence"])) throw new TypeError("reopen requires --stage=build-code --verify-attempt=<attempt-0001.json> --failure-evidence=<evidence/ref.json>");
  if (command === "publish-verify-failure" && (values.stage !== "verify-code" || !values["failure-evidence"])) throw new TypeError("publish-verify-failure requires --stage=verify-code --failure-evidence=<evidence/ref.json>");
  if (command === "publish-verify-passing" && (values.stage !== "verify-code" || !values.input)) throw new TypeError("publish-verify-passing requires --stage=verify-code --input=<component-receipts.json>");
  if (Object.prototype.hasOwnProperty.call(values, "reopen") && (command !== "run" || values.stage !== "build-code")) throw new TypeError("--reopen is only valid for build-code run");
  if (Object.prototype.hasOwnProperty.call(values, "baseline-rebind") && (command !== "run" || values.stage !== "build-plan")) throw new TypeError("--baseline-rebind is only valid for build-plan run");
  if (command === "rebind" && values.stage !== "build-plan") throw new TypeError("rebind is only valid for build-plan");
  if (command === "receipt" && Object.prototype.hasOwnProperty.call(values, "revision") && values.revision !== "true") throw new TypeError("--revision must be --revision=true");
  if (command === "receipt" && Object.prototype.hasOwnProperty.call(values, "recover") && values.revision !== "true") throw new TypeError("--recover requires --revision=true");
  if (command === "receipt" && values.revision === "true" && !values.recover) throw new TypeError("receipt revision requires --recover=<previous-receipt-ref>");
  if (command === "run" && !values.input) throw new TypeError("run requires --input=<component-receipts.json>");
  if (command === "publish-material-revision" && !values.input) throw new TypeError("publish-material-revision requires --input=<revision-source.json>");
  let context = bootstrapStage(values.stage, {
    mode: "launcher",
    projectName: values.project,
    taskId: values.task,
    runnerRoot: RUNNER_ROOT,
  });
  const input = new Set(["continue-stage", "invalidate-run", "invalidate-step-attempt", "invalidate-stage-attempt", "invalidate-review-binding", "publish-requirements-ledger", "publish-material-revision", "record-step-entry", "record-step-exit", "record-research", "receipt", "recover-spec-receipt", "capture-tests", "publish-content-evidence", "publish-phase-evidence", "publish-phase-trace-lineage", "supersede-phase-trace-lineage", "publish-acceptance-evidence", "review-risk-pause", "accept-review-risk", "run", "publish-verify-passing"]).has(command)
      && values.input !== undefined
    ? JSON.parse(readFileSync(values.input, "utf8"))
    : undefined;
  if (command === "verify-recovery") {
    const active = context.kernel.activeStageRun(values.stage, { required: false });
    if (active === null) {
      return { schema_version: "recovery-oracle.v1", stage: values.stage, status: "no_run", read_only: true };
    }
    const journalRaw = (() => {
      try { return context.task.readRecord("journal.jsonl"); }
      catch (error) { if (error?.code === "ENOENT") return ""; throw error; }
    })();
    let journalOffset = 0;
    let runJournalStartOffset = null;
    const journalEvents = [];
    for (const line of journalRaw.split(/(?<=\n)/)) {
      const raw = line.endsWith("\n") ? line.slice(0, -1) : line;
      if (raw !== "") {
        const event = JSON.parse(raw);
        if (event.workflow_run_id === active.run.workflow_run_id) {
          if (runJournalStartOffset === null) runJournalStartOffset = journalOffset;
          journalEvents.push(event);
        }
      }
      journalOffset += Buffer.byteLength(line);
    }
    const runEvents = journalEvents;
    const invocationOutcomes = [];
    for (const dependency of loadStageSkillManifest(RUNNER_ROOT, values.stage).manifest.skills) {
      const invocationKeys = dependency.name === "talk-with-zhipeng"
        ? ["talk-1", "talk-2", "talk-3"]
        : dependency.name === "grill-with-docs" ? ["grill", "default"] : ["default"];
      for (const invocationKey of invocationKeys) {
        const observed = context.kernel.readStageSkillInvocation(values.stage, dependency.name, invocationKey);
        if (observed) {
          const fact = observed.fact;
          if (fact.task_id !== context.task.identity.taskId
              || fact.stage !== values.stage
              || fact.workflow_run_id !== active.run.workflow_run_id
              || fact.name !== dependency.name
              || fact.invocation_key !== invocationKey
              || fact.bundle_hash !== preflightStageSkills({ packageRoot: RUNNER_ROOT, stage: values.stage }).payloads.get(dependency.name).bundle_hash
              || fact.declared_trigger !== dependency.trigger) {
            throw new Error(`recovery invocation identity mismatch: ${dependency.name}/${invocationKey}`);
          }
          if (fact.status === "executed") {
            const outcomeRaw = context.task.readRecord(fact.outcome_ref);
            if (sha256(outcomeRaw) !== fact.outcome_hash
                || JSON.parse(outcomeRaw).snapshot_tree !== fact.snapshot_tree) {
              throw new Error(`recovery invocation outcome mismatch: ${dependency.name}/${invocationKey}`);
            }
          }
          invocationOutcomes.push({ ...fact, ref: observed.ref });
        }
      }
    }
    let accepted = false;
    try {
      const acceptedRecord = JSON.parse(context.task.readRecord(`results/${values.stage}/accepted.json`));
      const attempt = JSON.parse(context.task.readRecord(`results/${values.stage}/${acceptedRecord.attempt_ref}`));
      accepted = attempt.workflow_run_id === active.run.workflow_run_id;
    }
    catch (error) { if (error?.code !== "ENOENT") throw error; }
    const requiredRecoveryInvocations = values.stage === "make-decision"
      ? ["talk-with-zhipeng/talk-1", "talk-with-zhipeng/talk-2", "talk-with-zhipeng/talk-3", "grill-with-docs/grill"]
      : [];
    const observedRecoveryInvocations = new Set(invocationOutcomes.map((item) => `${item.name}/${item.invocation_key}`));
    const invocationMissing = requiredRecoveryInvocations.filter((item) => !observedRecoveryInvocations.has(item));
    return {
      schema_version: "recovery-oracle.v1",
      stage: values.stage,
      status: "observed",
      read_only: true,
      run_ref: active.ref,
      run_hash: active.hash,
      previous_run_ref: active.run.previous_run_ref,
      previous_run_hash: active.run.previous_run_hash,
      workflow_run_id: active.run.workflow_run_id,
      invocation_outcomes: invocationOutcomes,
      completion: {
        journal_event_count: runEvents.length,
        run_journal_start_offset: runJournalStartOffset,
        last_journal_offset: Buffer.byteLength(journalRaw),
        invocation_missing: invocationMissing,
        complete: invocationMissing.length === 0,
      },
      confirmation_present: runEvents.some((event) => event.event_type === "human_confirmation"),
      accepted_present: accepted,
    };
  }
  let recoveryPrevious;
  if (values.stage === "make-decision") {
    if (command === "recover-run") {
      recoveryPrevious = context.kernel.latestHistoricalStageRun("make-decision");
      if (recoveryPrevious === null) throw new Error("recover-run requires an existing previous make-decision run");
      context = recoverMakeDecisionWorkspace(context);
    } else {
      const active = command === "prepare"
        ? null
        : context.kernel.activeStageRun("make-decision", { required: false });
      context = active?.run.recovery_source_ref !== undefined
        ? recoverMakeDecisionWorkspace(context)
        : prepareMakeDecisionWorkspace(context);
    }
  }
  const writeBoundary = authenticateStageWriteBoundary(context, {
    runnerRoot: RUNNER_ROOT,
    operation: command,
  });
  if (command === "prepare") {
    if (values.stage !== "make-decision") throw new TypeError("prepare is only valid for make-decision");
    return {
      worktree_root: context.candidateWorkspace.worktreeRoot,
      baseline_commit: context.candidateWorkspace.baselineCommit,
    };
  }
  if (command === "start-run") {
    const allowed = new Set(["stage", "project", "task", "reason", "continuation-ref"]);
    if (Object.keys(values).some((key) => !allowed.has(key))) throw new TypeError("start-run accepts only --stage, --project, --task, --reason, and optional --continuation-ref");
    const started = context.kernel.startStageRun(values.stage, {
      reason: values.reason,
      ...(values["continuation-ref"] ? { continuation_ref: values["continuation-ref"] } : {}),
    });
    return started;
  }
  if (command === "recover-run") {
    const started = context.kernel.startRecoveryStageRun(values.stage, {
      reason: values.reason,
      expected_previous_run_ref: recoveryPrevious.ref,
      expected_previous_run_hash: recoveryPrevious.hash,
    });
    return {
      ...started,
      worktree_root: context.candidateWorkspace.worktreeRoot,
      baseline_commit: context.candidateWorkspace.baselineCommit,
      previous_run_ref: started.run.previous_run_ref,
      previous_run_hash: started.run.previous_run_hash,
      status: "waiting_for_host_response",
      completion: "incomplete",
      accepted: false,
      next_command: "invoke-stage-skill",
    };
  }
  if (command === "invoke-stage-skill") {
    const allowed = new Set(["stage", "project", "task", "name", "invocation-key", "triggered", "reason"]);
    if (Object.keys(values).some((key) => !allowed.has(key))) {
      throw new TypeError("invoke-stage-skill accepts only identity, name, invocation-key, triggered, and reason");
    }
    const prepared = preflightStageSkills({ packageRoot: RUNNER_ROOT, stage: values.stage });
    const dependency = prepared.manifest.skills.find((item) => item.name === values.name);
    if (!dependency) throw new Error(`${values.stage}: undeclared skill ${values.name}`);
    if (values.triggered !== undefined && !new Set(["true", "false"]).has(values.triggered)) {
      throw new TypeError("invoke-stage-skill --triggered must be true or false");
    }
    const triggered = values.triggered !== "false";
    if (triggered && values.reason !== undefined) {
      throw new TypeError("invoke-stage-skill reason is forbidden when triggered=true");
    }
    if (!triggered && (typeof values.reason !== "string" || values.reason.trim() === "")) {
      throw new TypeError("invoke-stage-skill triggered=false requires a concrete reason");
    }
    if (!triggered) {
      const fact = await dispatchStageSkill({
        packageRoot: RUNNER_ROOT,
        stage: values.stage,
        name: values.name,
        invocationKey: values["invocation-key"],
        triggered: false,
        notInvokedReason: values.reason,
        kernel: context.kernel,
      });
      return { status: "trigger=false", invocation: fact };
    }
    const invocationWorkspace = context.candidateWorkspace ?? context.workspace;
    const request = {
      schema_version: "host-invocation-request.v1",
      task_id: context.task.identity.taskId,
      stage: values.stage,
      workflow_run_id: context.kernel.deriveStageWorkflowRunId(values.stage),
      name: values.name,
      invocation_key: values["invocation-key"],
      bundle_hash: prepared.payloads.get(values.name).bundle_hash,
      declared_trigger: dependency.trigger,
      snapshot_tree: captureGitWorktreeSnapshot(invocationWorkspace.worktreeRoot).tree,
    };
    process.stdout.write(`${JSON.stringify(request)}\n`);
    const responseRaw = await new Promise((resolve, reject) => {
      let body = "";
      process.stdin.setEncoding("utf8");
      process.stdin.on("data", (chunk) => { body += chunk; });
      process.stdin.on("end", () => resolve(body));
      process.stdin.on("error", reject);
    });
    const lines = responseRaw.split("\n").filter((line) => line.trim() !== "");
    if (lines.length !== 1) throw new Error("host bridge requires exactly one response after request");
    let response;
    try { response = JSON.parse(lines[0]); } catch { throw new Error("host bridge response must be one JSON line"); }
    const allowedResponse = new Set(["outcome_ref", "outcome_hash", "snapshot_tree"]);
    if (!response || typeof response !== "object" || Array.isArray(response)
        || Object.keys(response).some((key) => !allowedResponse.has(key))) {
      throw new TypeError("host response must contain only outcome_ref, outcome_hash, and snapshot_tree");
    }
    const fact = await dispatchStageSkill({
      packageRoot: RUNNER_ROOT,
      stage: values.stage,
      name: values.name,
      invocationKey: values["invocation-key"],
      kernel: context.kernel,
      hostInvoke: async () => response,
    });
    return { status: "executed", invocation: fact };
  }
  if (command === "continue-stage") {
    const allowed = new Set(["stage", "project", "task", "input"]);
    if (Object.keys(values).some((key) => !allowed.has(key))) throw new TypeError("continue-stage accepts only --stage, --project, --task, and --input");
    return context.kernel.createStageContinuation(values.stage, input);
  }
  if (command === "invalidate-run") {
    const allowed = new Set(["stage", "project", "task", "input"]);
    if (Object.keys(values).some((key) => !allowed.has(key))) throw new TypeError("invalidate-run accepts only --stage, --project, --task, and --input");
    return context.kernel.invalidateStageRun(values.stage, input);
  }
  if (command === "invalidate-step-attempt") {
    const allowed = new Set(["stage", "project", "task", "input"]);
    if (Object.keys(values).some((key) => !allowed.has(key))) throw new TypeError("invalidate-step-attempt accepts only --stage, --project, --task, and --input");
    return context.kernel.invalidateStageStepAttempt(values.stage, input);
  }
  if (command === "invalidate-stage-attempt") {
    const allowed = new Set(["stage", "project", "task", "input"]);
    if (Object.keys(values).some((key) => !allowed.has(key))) throw new TypeError("invalidate-stage-attempt accepts only --stage, --project, --task, and --input");
    return context.kernel.invalidateStageAttempt(values.stage, input);
  }
  if (command === "invalidate-review-binding") {
    const allowed = new Set(["stage", "project", "task", "input"]);
    if (Object.keys(values).some((key) => !allowed.has(key))) throw new TypeError("invalidate-review-binding accepts only --stage, --project, --task, and --input");
    return context.kernel.invalidateReviewBinding(values.stage, input);
  }
  if (command === "publish-requirements-ledger") {
    const allowed = new Set(["stage", "project", "task", "input"]);
    if (Object.keys(values).some((key) => !allowed.has(key))) throw new TypeError("publish-requirements-ledger accepts only --stage, --project, --task, and --input");
    const published = context.kernel.publishRequirementsLedger(values.stage, input);
    return published;
  }
  if (command === "publish-material-revision") {
    const allowed = new Set(["stage", "project", "task", "input"]);
    if (Object.keys(values).some((key) => !allowed.has(key))) {
      throw new TypeError("publish-material-revision accepts only --stage, --project, --task, and --input");
    }
    return context.kernel.publishMaterialRevision(input);
  }
  if (command === "publish-quality-fact") {
    const allowed = new Set(["stage", "project", "task", "input"]);
    if (Object.keys(values).some((key) => !allowed.has(key))) throw new TypeError("publish-quality-fact accepts only --stage, --project, --task, and --input");
    return context.kernel.publishVNextQualityFact(values.stage, input);
  }
  if (command === "publish-publication") {
    const allowed = new Set(["stage", "project", "task", "input"]);
    if (Object.keys(values).some((key) => !allowed.has(key))) throw new TypeError("publish-publication accepts only --stage, --project, --task, and --input");
    return context.kernel.publishVNextPublication(values.stage, input);
  }
  if (command === "record-step-entry") {
    if (values.stage === "make-decision") throw new Error("make-decision journal entries are runtime-owned");
    const allowed = new Set(["stage", "project", "task", "input"]);
    if (Object.keys(values).some((key) => !allowed.has(key))) throw new TypeError("record-step-entry accepts only --stage, --project, --task, and --input");
    return context.kernel.writeStageStepEntry(values.stage, input);
  }
  if (command === "record-step-exit") {
    if (values.stage === "make-decision") throw new Error("make-decision journal exits are runtime-owned");
    const allowed = new Set(["stage", "project", "task", "input"]);
    if (Object.keys(values).some((key) => !allowed.has(key))) throw new TypeError("record-step-exit accepts only --stage, --project, --task, and --input");
    return context.kernel.writeStageStepExit(values.stage, input);
  }
  if (command === "record-research") {
    const allowed = new Set(["status", "reason", "evidence"]);
    if (!input || typeof input !== "object" || Array.isArray(input)
        || Object.keys(input).some((key) => !allowed.has(key))
        || !new Set(["performed", "skipped"]).has(input.status)
        || typeof input.reason !== "string" || input.reason.trim() === ""
        || !input.evidence || typeof input.evidence !== "object" || Array.isArray(input.evidence)
        || typeof input.evidence.kind !== "string" || input.evidence.kind.trim() === ""
        || typeof input.evidence.uri_or_path !== "string" || input.evidence.uri_or_path.trim() === ""
        || !SHA256.test(input.evidence.content_hash ?? "")) {
      throw new TypeError("record-research requires status=performed|skipped, reason, and a canonical evidence ref");
    }
    return context.kernel.completeMakeDecisionResearch(input);
  }
  if (command === "recover-spec-receipt") {
    const identity = context.kernel.deriveReviewFlowIdentity({
      stage: "build-spec",
      review_track: null,
      subject_kind: "worktree",
      phase_id: null,
      review_scope: null,
    });
    const ownerCapability = issueBuildSpecRecoveryOwnerCapability({
      task: context.task,
      workspace: context.workspace,
      boundary: writeBoundary,
    });
    const records = createBuildSpecReceiptRecoveryRecords({
      task: context.task,
      workspace: context.workspace,
      artifacts: context.artifacts,
      input,
      authenticatedFlow: context.kernel.readReviewFlow(identity),
      invocation: ownerCapability.invocation,
    });
    return context.kernel.recoverBuildSpecReceiptRecords(records, ownerCapability);
  }
  if (command === "rebind") return context.kernel.authorizeBuildPlanBaselineRebind();
  if (command === "artifact") {
    if (!DESIGN_ARTIFACTS[values.stage]?.has(values.name)) throw new TypeError(`unsupported ${values.stage} artifact: ${values.name}`);
    context.artifacts.writeAtomic(values.name, readFileSync(values.input, "utf8"));
    return { artifact_ref: context.artifacts.reference(values.name) };
  }
  if (command === "reopen") return context.kernel.reopenBuildCode({ verifyAttemptRef: values["verify-attempt"], failureEvidenceRef: values["failure-evidence"] });
  if (command === "publish-verify-failure") return context.kernel.publishVerifyFailureFromAccepted({ failureEvidenceRef: values["failure-evidence"] });
  if (command === "publish-verify-passing") {
    if (Object.prototype.hasOwnProperty.call(input?.receipts ?? {}, "audit")) throw new TypeError("verify passing audit summary is runtime-derived and caller-forbidden");
    const audit = writeCanonicalAuditSummary({ task: context.task, workspace: context.workspace, stage: "verify-code" });
    return publishOfficialVerifyPassing(context, {
      ...input,
      receipts: { ...input.receipts, audit: audit.audit_summary_ref },
    });
  }
  if (command === "publish-phase-evidence") return publishBuildCodePhaseEvidence(context, input);
  if (command === "publish-phase-trace-lineage") return publishPhaseTraceLineage(context, input);
  if (command === "supersede-phase-trace-lineage") return supersedePhaseTraceLineage(context, input);
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
  if (command === "publish-acceptance-evidence") {
    const snapshot = captureGitWorktreeSnapshot((context.candidateWorkspace ?? context.workspace).worktreeRoot);
    const value = normalizeAcceptanceEvidencePublication(input, snapshot.tree);
    for (const nested of value.refs) {
      const raw = context.task.readRecord(nested.ref);
      const actual = createHash("sha256").update(raw).digest("hex");
      if (actual !== nested.sha256) throw new Error(`acceptance evidence nested ref hash mismatch: ${nested.ref}`);
    }
    const raw = `${JSON.stringify(value, null, 2)}\n`;
    const sha256 = createHash("sha256").update(raw).digest("hex");
    const ref = `evidence/acceptance-${sha256}.json`;
    context.kernel.publishCanonicalRecord(ref, raw);
    return { evidence_ref: ref, evidence_hash: sha256, acceptance_criterion_id: value.acceptance_criterion_id, result: value.result };
  }
  if (command === "review-risk-pause") {
    const allowed = new Set(["review_result_ref", "revision_ref", "adjudication_correction_ref"]);
    if (!input || typeof input !== "object" || Array.isArray(input)
        || typeof input.review_result_ref !== "string"
        || Object.keys(input).some((key) => !allowed.has(key))) {
      throw new TypeError("review-risk-pause input requires review_result_ref and optional authenticated revision ref");
    }
    return context.kernel.prepareReviewRiskPause({
      stage: values.stage,
      reviewResultRef: input.review_result_ref,
      ...(input.revision_ref === undefined ? {} : { revisionRef: input.revision_ref }),
      ...(input.adjudication_correction_ref === undefined ? {} : { adjudicationCorrectionRef: input.adjudication_correction_ref }),
    });
  }
  if (command === "accept-review-risk") {
    const allowed = new Set([
      "review_result_ref", "finding_id", "card_ref", "card_hash", "selected_option",
      "reply_ref", "reply_hash", "revision_ref", "adjudication_correction_ref",
    ]);
    if (!input || typeof input !== "object" || Array.isArray(input)
        || Object.keys(input).some((key) => !allowed.has(key))) {
      throw new TypeError("accept-review-risk input is invalid");
    }
    return context.kernel.acceptReviewRisk({
      stage: values.stage,
      reviewResultRef: input.review_result_ref,
      findingId: input.finding_id,
      cardRef: input.card_ref,
      cardHash: input.card_hash,
      selectedOption: input.selected_option,
      replyRef: input.reply_ref,
      replyHash: input.reply_hash,
      ...(input.revision_ref === undefined ? {} : { revisionRef: input.revision_ref }),
      ...(input.adjudication_correction_ref === undefined ? {} : { adjudicationCorrectionRef: input.adjudication_correction_ref }),
    });
  }
  if (command === "receipt") {
    const result = writeOfficialComponentReceipt({ task: context.task, workspace: context.workspace, stage: values.stage, component: values.component, payload: input, ...(values.revision === "true" ? { revisionOf: values.recover } : {}) });
    if (values.stage === "make-decision" && values.component === "decision") {
      const raw = context.task.readRecord(result.ref);
      context.kernel.completeMakeDecisionReceipt({
        receipt_ref: result.ref,
        receipt_hash: sha256(raw),
      });
    }
    return { receipt_ref: result.ref, receipt_hash: result.sha256, revision: result.revision, ...(result.revision ? { previous_receipt_ref: result.previous_ref, previous_receipt_hash: result.previous_hash, content_hash: result.content_hash } : {}) };
  }
  if (command === "publish-content-evidence") {
    const allowed = new Set(["stage", "project", "task", "kind", "input", "revision"]);
    if (Object.keys(values).some((key) => !allowed.has(key))) throw new TypeError("publish-content-evidence accepts only --stage, --project, --task, --kind, and --input");
    const writer = createStageContentEvidenceWriter({
      task: context.task,
      workspace: context.candidateWorkspace ?? context.workspace,
      stage: values.stage,
      workflowRunId: context.kernel.deriveStageWorkflowRunId(values.stage),
    });
    const revision = values.revision === undefined ? undefined : Number(values.revision);
    const published = writer.publish({ kind: values.kind, payload: input, ...(revision === undefined ? {} : { revision }) });
    return { evidence_ref: published.ref, evidence_hash: published.hash, kind: values.kind };
  }
  if (command === "run") {
    if (!input || typeof input !== "object" || Array.isArray(input)
        || !input.receipts || typeof input.receipts !== "object" || Array.isArray(input.receipts)) {
      throw new TypeError("run input requires a receipts object");
    }
    const allowedRunFields = new Set(values.stage === "build-code" ? ["receipts", "acceptance_coverage"] : ["receipts"]);
    const unknownRunFields = Object.keys(input).filter((key) => !allowedRunFields.has(key));
    if (unknownRunFields.length) throw new TypeError(`run input has unknown fields: ${unknownRunFields.join(", ")}`);
    if (Object.prototype.hasOwnProperty.call(input?.receipts ?? {}, "audit")) throw new TypeError("run audit summary is runtime-derived and caller-forbidden");
    if (values.stage === "make-decision") {
      const reviewEvidence = (track, stepId, ref) => {
        const raw = context.task.readRecord(ref);
        const review = JSON.parse(raw);
        if (review.review_track !== track) throw new Error(`${track} review receipt does not match its track`);
        const identity = context.kernel.deriveReviewFlowIdentity({
          stage: "make-decision",
          review_track: track,
          subject_kind: review.subject_kind,
          phase_id: review.phase_id ?? null,
          review_scope: review.review_scope ?? null,
        });
        const flow = context.kernel.readReviewFlow(identity);
        const semanticHead = review.version === "wh-review-result.v1"
          && flow?.head_result_ref === ref && flow.result_sha256 === sha256(raw);
        const unavailableHead = review.version === "wh-review-attempt.v1"
          && review.terminal_status === "unavailable"
          && flow?.event_kind === "provider_attempt"
          && flow.action_ref === ref && flow.action_sha256 === sha256(raw);
        if (!semanticHead && !unavailableHead) {
          throw new Error(`${track} review receipt is not the current authenticated review-flow head`);
        }
        requireCompletedMakeDecisionStep(context, stepId);
      };
      reviewEvidence("direction", 6, input.receipts.direction_review);
      reviewEvidence("detail", 10, input.receipts.detail_review);
    }
    let audit;
    try {
      audit = writeCanonicalAuditSummary({
        task: context.task,
        workspace: context.candidateWorkspace ?? context.workspace,
        stage: values.stage,
        ...(values.stage === "make-decision" && input.receipts.decision_revision
          ? { decisionRef: input.receipts.decision_revision }
          : {}),
        ...(values.stage === "make-decision"
          ? { throughStepId: 10 }
          : values.stage === "build-spec" ? { throughStepId: 5 }
            : values.stage === "build-plan" ? { throughStepId: 6 } : {}),
      });
    } catch (error) {
      if (!new Set(["build-spec", "build-plan"]).has(values.stage)) throw error;
    }
    const controlledInput = {
      ...input,
      receipts: {
        ...input.receipts,
        ...(audit ? { audit: audit.audit_summary_ref } : {}),
      },
    };
    const attempt = values.stage === "build-spec"
      ? resumableBuildSpecAttempt(context, input) ?? await runOfficialStage(values.stage, context, controlledInput)
      : await runOfficialStage(values.stage, context, controlledInput, {
        ...(values.reopen ? { reopenProvenance: context.kernel.buildCodeReopenProvenance(values.reopen) } : {}),
        ...(values["baseline-rebind"] ? { baselineRebindRef: values["baseline-rebind"] } : {}),
      });
    if (requiresHumanConfirmation(values.stage)) return attempt;
    let buildSpecFullAudit;
    if (values.stage === "build-spec") {
      const attemptRaw = context.task.readRecord(`results/build-spec/${attempt.attempt_ref}`);
      context.kernel.completeBuildSpecResultPublication({
        attempt_ref: attempt.attempt_ref,
        attempt_hash: sha256(attemptRaw),
      });
      try {
        buildSpecFullAudit = context.kernel.readBuildSpecCompletionAudit(
          attempt.attempt_ref,
          sha256(attemptRaw),
        );
      } catch (error) {
        if (error?.code !== "ENOENT") throw error;
        try {
          const finalAudit = writeCanonicalAuditSummary({
            task: context.task,
            workspace: context.workspace,
            stage: "build-spec",
            throughStepId: 6,
          });
          buildSpecFullAudit = {
            status: "recorded",
            ref: finalAudit.audit_summary_ref,
            hash: finalAudit.audit_record_hash,
          };
        } catch (auditError) {
          buildSpecFullAudit = { status: "unavailable", reason: auditError.message };
        }
        buildSpecFullAudit = context.kernel.publishBuildSpecCompletionAudit({
          attempt_ref: attempt.attempt_ref,
          attempt_hash: sha256(attemptRaw),
          audit: buildSpecFullAudit,
        });
      }
    }
    const accepted = acceptStageAttempt(values.stage, context, { attemptRef: attempt.attempt_ref });
    const acceptedSourceRef = `results/${values.stage}/accepted.json`;
    const acceptedSourceRaw = context.task.readRecord(acceptedSourceRef);
    persistWriteBoundaryPathCard({
      task: context.task,
      boundary: writeBoundary,
      source: { ref: acceptedSourceRef, hash: createHash("sha256").update(acceptedSourceRaw).digest("hex") },
    });
    return {
      ...attempt,
      accepted,
      ...(buildSpecFullAudit === undefined ? {} : { completion_audit: buildSpecFullAudit }),
    };
  }
  if (command === "confirm") {
    return confirmStageAttempt(values.stage, context, { attemptRef: values.attempt, decision: values.decision });
  }
  const acceptedResult = acceptStageAttempt(values.stage, context, {
    attemptRef: values.attempt,
    humanConfirmationRef: values["human-confirmation-ref"],
    ...(!new Set(["make-decision", "build-plan"]).has(values.stage) ? {} : {
      fullAuditWriter: () => {
        if (values.stage === "build-plan") {
          const audit = writeCanonicalAuditSummary({
            task: context.task,
            workspace: context.workspace,
            stage: "build-plan",
            throughStepId: 8,
          });
          return {
            ref: audit.audit_summary_ref,
            hash: audit.audit_record_hash,
            summary_hash: audit.audit_summary_hash,
          };
        }
        const attemptRaw = context.task.readRecord(`results/make-decision/${values.attempt}`);
        const attempt = JSON.parse(attemptRaw);
        const decisionRevisionRef = attempt.evidence_refs?.find((entry) =>
          typeof entry?.ref === "string" && entry.ref.startsWith("receipts/revisions/decision/"))?.ref;
        const audit = writeCanonicalAuditSummary({
          task: context.task,
          workspace: context.candidateWorkspace,
          stage: "make-decision",
          ...(decisionRevisionRef ? { decisionRef: decisionRevisionRef } : {}),
          throughStepId: 12,
        });
        return {
          ref: audit.audit_summary_ref,
          hash: audit.audit_record_hash,
          summary_hash: audit.audit_summary_hash,
        };
      },
    }),
  });
  publishAcceptedDecisionLog(context, acceptedResult);
  const acceptedSourceRef = `results/${values.stage}/accepted.json`;
  const acceptedSourceRaw = context.task.readRecord(acceptedSourceRef);
  persistWriteBoundaryPathCard({
    task: context.task,
    boundary: writeBoundary,
    source: { ref: acceptedSourceRef, hash: createHash("sha256").update(acceptedSourceRaw).digest("hex") },
  });
  return acceptedResult;
}

export async function stageRuntimeCliMain(argv = process.argv.slice(2), {
  delegate = stageRuntimeMain,
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
        run: ["execute", "scope", "research", "draft", "record", "content"],
        review: ["invoke", "risk"],
        verify: ["tests", "phase", "lineage", "criterion", "failure", "passing"],
        confirm: ["decision"],
        authorize: ["decision", "risk"],
      },
    };
  }
  if (!RUNTIME_BEHAVIORS.includes(behavior)) throw new Error("unknown public runtime behavior");
  const actionArgument = raw.find((item) => item.startsWith("--action="));
  if (!actionArgument) throw new TypeError("public runtime behavior requires --action=<high-level-action>");
  const action = actionArgument.slice("--action=".length);
  const publicRoute = `${behavior}:${action}`;
  const internalOperation = ({
    "doctor:workspace": "prepare",
    "status:begin": "start-run",
    "status:repair": "reopen",
    "run:execute": "run",
    "run:scope": "publish-requirements-ledger",
    "run:research": "record-research",
    "run:draft": "artifact",
    "run:record": "receipt",
    "run:content": "publish-content-evidence",
    "review:invoke": "invoke-stage-skill",
    "review:risk": "review-risk-pause",
    "verify:tests": "capture-tests",
    "verify:phase": "publish-phase-evidence",
    "verify:lineage": "publish-phase-trace-lineage",
    "verify:criterion": "publish-acceptance-evidence",
    "verify:failure": "publish-verify-failure",
    "verify:passing": "publish-verify-passing",
    "confirm:decision": "confirm",
    "authorize:decision": "accept",
    "authorize:risk": "accept-review-risk",
  })[publicRoute];
  if (!internalOperation) throw new Error("unknown public runtime action");
  const delegatedArgv = [
    internalOperation,
    ...raw
      .filter((item) => item !== actionArgument)
      .map((item) => item.startsWith("--reopen-ref=")
        ? `--reopen=${item.slice("--reopen-ref=".length)}`
        : item),
  ];
  return invokeRuntimeCommand(
    behavior,
    Object.freeze({ action, argv: delegatedArgv }),
    ({ argv: internalArgv }) => delegate(internalArgv),
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

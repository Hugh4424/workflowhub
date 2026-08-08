#!/usr/bin/env node

import { mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { execFileSync, spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  authenticateStageWriteBoundary,
  bootstrapStage,
  prepareMakeDecisionWorkspace,
} from "../../runtime/stage/stage-context.mjs";
import { runOfficialStage } from "../../runtime/stage/stage-runner.mjs";
import {
  validateAcceptanceEvidence,
} from "../../runtime/evidence/canonical-receipt-writer.mjs";
import { ArtifactDir } from "../../core/artifact-dir.mjs";
import { captureGitWorktreeSnapshot } from "../../runtime/task/git-worktree-snapshot.mjs";
import { dispatchStageSkill, preflightStageSkills } from "../../runtime/stage/stage-skill-runtime.mjs";
import { invokeRuntimeCommand, RUNTIME_BEHAVIORS } from "../../runtime/interface/runtime-facade.mjs";
import { LOCAL_RUNNER_CONTRACT, LOCAL_SKILL_BUNDLE_CONTRACT } from "../../runtime/interface/runner-contract.mjs";
import { deriveStageCompletion, deriveStageProgress } from "../../runtime/stage/completion-predicates.mjs";
import { evaluateFactFreshness } from "../../runtime/evidence/freshness.mjs";
import { CURRENT_MATERIAL_FILES } from "../../runtime/task/material-workspace.mjs";
import { loadTrustedThirdReviewConfig } from "../../skills/wh-review/scripts/third-review-host-config.mjs";

const DESIGN_ARTIFACTS = Object.freeze({
  "make-decision": new Set(["decision-log.md"]),
  "build-spec": new Set(["spec.md"]),
  "build-plan": new Set(["plan.md", "tasks.md"]),
});
const RUNNER_ROOT = fileURLToPath(new URL("../../", import.meta.url));
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const SHA256 = /^[a-f0-9]{64}$/;
const GIT_OID = /^[a-f0-9]{40,64}$/;

function pathOverlaps(left, right) {
  const contains = (outer, inner) => {
    const relation = relative(resolve(outer), resolve(inner));
    return relation === "" || (!relation.startsWith("..") && !isAbsolute(relation));
  };
  return contains(left, right) || contains(right, left);
}

function canonicalExistingPath(value, label) {
  if (typeof value !== "string" || !isAbsolute(value)) throw new TypeError(`${label} must be absolute`);
  const normalized = resolve(value);
  let canonical;
  try { canonical = realpathSync(normalized); }
  catch (error) { throw new Error(`${label} must exist and be canonical: ${error.message}`); }
  if (canonical !== normalized) throw new Error(`${label} must not contain a symlink: ${value}`);
  return canonical;
}

function hostBridgeWritableDirs({ trustedThirdReview, protectedPaths = [] } = {}) {
  const attachmentRoot = canonicalExistingPath(trustedThirdReview?.attachmentRoot, "authenticated review packet directory");
  for (const protectedPath of protectedPaths) {
    const canonicalProtectedPath = canonicalExistingPath(protectedPath, "Codex host bridge protected path");
    if (pathOverlaps(attachmentRoot, canonicalProtectedPath)) {
      throw new Error("Codex host bridge review packet directory overlaps a protected WorkflowHub path");
    }
  }
  return Object.freeze({ attachmentRoot });
}

export function buildCodexHostArgs({ trustedThirdReview, taskPath, worktreeRoot, schemaPath, outputPath, prompt } = {}) {
  const { attachmentRoot } = hostBridgeWritableDirs({
    trustedThirdReview,
    protectedPaths: [taskPath, worktreeRoot],
  });
  const canonicalWorktreeRoot = canonicalExistingPath(worktreeRoot, "Codex host bridge worktree");
  return [
    "exec", "--ephemeral", "--json", "--sandbox=workspace-write",
    "--add-dir", attachmentRoot,
    "--output-schema", schemaPath,
    "--output-last-message", outputPath,
    "-C", canonicalWorktreeRoot,
    prompt,
  ];
}

export const HOST_BRIDGE_OUTCOME_SCHEMA = Object.freeze({
  type: "object",
  additionalProperties: false,
  required: ["status", "summary", "evidence_refs", "changed_files", "findings", "next_step"],
  properties: {
    status: { type: "string", enum: ["completed"] },
    summary: { type: "string", minLength: 1, pattern: "\\S" },
    evidence_refs: { type: "array", items: { type: "string", minLength: 1, pattern: "\\S" } },
    changed_files: { type: "array", items: { type: "string", minLength: 1, pattern: "\\S" } },
    findings: { type: "array", items: { type: "string", minLength: 1, pattern: "\\S" } },
    next_step: { type: "string", minLength: 1, pattern: "\\S" },
  },
});

const HOST_RESPONSE_KEYS = new Set(["outcome_ref", "outcome_hash", "snapshot_tree"]);

export function assertHostBridgeResponse(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)
      || Object.keys(value).some((key) => !HOST_RESPONSE_KEYS.has(key))
      || typeof value.outcome_ref !== "string"
      || !/^(?:quality|evidence)\/.+/.test(value.outcome_ref)
      || !SHA256.test(value.outcome_hash ?? "")
      || !GIT_OID.test(value.snapshot_tree ?? "")) {
    throw new TypeError("host response must contain a canonical outcome_ref, outcome_hash, and snapshot_tree");
  }
  return Object.freeze({ ...value });
}

function runChild(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: options.env,
      detached: true,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    const timeoutMs = Number.isInteger(options.timeoutMs) && options.timeoutMs > 0
      ? options.timeoutMs : 15 * 60 * 1000;
    const terminate = (signal) => {
      try {
        if (child.pid) process.kill(-child.pid, signal);
        else child.kill(signal);
      } catch {
        try { child.kill(signal); } catch { /* process already exited */ }
      }
    };
    let settled = false;
    const timer = setTimeout(() => {
      terminate("SIGTERM");
      const killTimer = setTimeout(() => {
        if (!settled) terminate("SIGKILL");
      }, 5000);
      child.once("close", () => clearTimeout(killTimer));
      if (!settled) {
        settled = true;
        reject(new Error(`${options.label ?? command} timed out after ${timeoutMs}ms`));
      }
    }, timeoutMs);
    child.once("error", (error) => {
      clearTimeout(timer);
      if (!settled) {
        settled = true;
        reject(error);
      }
    });
    child.once("close", (code, signal) => {
      clearTimeout(timer);
      if (!settled) {
        settled = true;
        resolve({ code, signal, stdout, stderr });
      }
    });
  });
}

export function assertHostOutcome(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)
      || value.status !== "completed" || typeof value.summary !== "string"
      || value.summary.trim() === "") {
    throw new Error("Codex host bridge returned an incomplete skill outcome");
  }
  const allowed = new Set(Object.keys(HOST_BRIDGE_OUTCOME_SCHEMA.properties));
  const required = Object.keys(HOST_BRIDGE_OUTCOME_SCHEMA.properties);
  const missing = required.filter((key) => !Object.prototype.hasOwnProperty.call(value, key));
  if (missing.length) throw new Error(`Codex host bridge outcome is missing fields: ${missing.join(", ")}`);
  const unknown = Object.keys(value).filter((key) => !allowed.has(key));
  if (unknown.length) throw new Error(`Codex host bridge outcome has unknown fields: ${unknown.join(", ")}`);
  for (const key of ["evidence_refs", "changed_files", "findings"]) {
    if (!Array.isArray(value[key]) || value[key].some((item) => typeof item !== "string" || item.trim() === "")) {
      throw new Error(`Codex host bridge outcome ${key} must be an array of non-empty strings`);
    }
  }
  if (typeof value.next_step !== "string" || value.next_step.trim() === "") {
    throw new Error("Codex host bridge outcome next_step must be a non-empty string");
  }
  return Object.freeze({ ...value });
}

function assertCodexHostOutcomeRecord(value, request, ref) {
  if (!value || typeof value !== "object" || Array.isArray(value)
      || value.schema_version !== "workflowhub-host-invocation-outcome.v1"
      || value.task_id !== request.task_id
      || value.stage !== request.stage
      || value.workflow_run_id !== request.workflow_run_id
      || value.name !== request.name
      || value.invocation_key !== request.invocation_key
      || value.declared_trigger !== request.declared_trigger
      || value.bundle_hash !== request.bundle_hash
      || value.request_snapshot_tree !== request.snapshot_tree
      || value.executor !== "codex"
      || !value.executor_identity
      || typeof value.executor_identity.command !== "string"
      || value.executor_identity.command.trim() === ""
      || typeof value.executor_identity.resolved_path !== "string"
      || value.executor_identity.resolved_path.trim() === ""
      || typeof value.executor_identity.version !== "string"
      || value.executor_identity.version.trim() === ""
      || !GIT_OID.test(value.snapshot_tree ?? "")
      || !Number.isFinite(Date.parse(value.recorded_at ?? ""))) {
    throw new Error(`existing Codex host outcome ${ref} failed identity validation`);
  }
  assertHostOutcome(value.outcome);
  return value;
}

function inspectCodexExecutor(command, cwd, env) {
  let resolvedPath;
  try {
    resolvedPath = String(execFileSync("which", [command], {
      cwd,
      env,
      encoding: "utf8",
      timeout: 5000,
      stdio: ["ignore", "pipe", "pipe"],
    })).trim();
  } catch (error) {
    throw new Error(`Codex host bridge cannot resolve executable ${command}: ${error.message}`);
  }
  let version;
  try {
    version = String(execFileSync(command, ["--version"], {
      cwd,
      env,
      encoding: "utf8",
      timeout: 5000,
      stdio: ["ignore", "pipe", "pipe"],
    })).trim();
  } catch (error) {
    throw new Error(`Codex host bridge cannot read ${command} --version: ${error.message}`);
  }
  if (!version) throw new Error(`Codex host bridge executable ${command} returned an empty version`);
  return Object.freeze({ command, resolved_path: resolvedPath, version });
}

const INTERACTIVE_HOST_STAGES = new Set(["make-decision", "build-spec"]);

async function invokeCodexHost({ request, context, prepared }) {
  const worktreeRoot = context.workspace?.worktreeRoot ?? context.candidateWorkspace?.worktreeRoot;
  if (typeof worktreeRoot !== "string") throw new Error("Codex host bridge requires an authenticated task worktree");
  const skillPath = prepared.payloads.get(request.name)?.resolved_skill_path;
  if (typeof skillPath !== "string") throw new Error(`Codex host bridge cannot resolve skill ${request.name}`);
  if (INTERACTIVE_HOST_STAGES.has(request.stage)) {
    throw new Error(`Codex host bridge refuses interactive stage ${request.stage}; preserve the real user conversation`);
  }
  const trustedThirdReview = loadTrustedThirdReviewConfig({ requestedStage: request.stage });
  const bridgeDir = mkdtempSync(join(tmpdir(), "workflowhub-host-bridge-"));
  const schemaPath = join(bridgeDir, "outcome.schema.json");
  const outputPath = join(bridgeDir, "outcome.json");
  const outcomeIdentity = sha256([
    request.task_id,
    request.stage,
    request.workflow_run_id,
    request.name,
    request.invocation_key,
  ].join("\0"));
  const outcomeRef = `quality/evidence/host-invocations/${outcomeIdentity}.json`;
  try {
    const existingRaw = context.task.readRecord(outcomeRef);
    const existing = JSON.parse(existingRaw);
    assertCodexHostOutcomeRecord(existing, request, outcomeRef);
    return assertHostBridgeResponse({ outcome_ref: outcomeRef, outcome_hash: sha256(existingRaw), snapshot_tree: existing.snapshot_tree });
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  writeFileSync(schemaPath, `${JSON.stringify(HOST_BRIDGE_OUTCOME_SCHEMA, null, 2)}\n`, { mode: 0o600 });
  const prompt = [
    "You are the WorkflowHub Codex host bridge for one real stage-skill invocation.",
    "Execute the named skill now against the authenticated current task and worktree.",
    "Read the skill file and its bundled supporting files before acting.",
    "Do not invoke stage-runtime review, this host bridge, or any replacement workflow.",
    "Do not fabricate receipts, hashes, reviews, user confirmations, or completion facts.",
    "Do not change provider/model, commit, push, merge, or change task status.",
    "WorkflowHub-owned review packet writes are allowed only through the configured attachment root; do not write other home paths.",
    "Perform the skill's actual work; if it is advisory, perform the analysis and preserve its evidence.",
    "At the end, return only JSON matching the supplied output schema with status=completed, a plain-language summary, actual evidence refs, changed files, findings, and next_step.",
    "",
    `stage=${request.stage}`,
    `skill=${request.name}`,
    `invocation_key=${request.invocation_key}`,
    `task_id=${request.task_id}`,
    `task_path=${context.task.taskPath} (authenticated TaskHandle records are read-only; do not write this directory)`,
    `worktree_root=${worktreeRoot}`,
    `runner_root=${RUNNER_ROOT}`,
    `skill_path=${skillPath}`,
    `bundle_hash=${request.bundle_hash}`,
    `request_snapshot_tree=${request.snapshot_tree}`,
  ].join("\n");
  try {
    const codex = process.env.WORKFLOWHUB_CODEX_BIN || "codex";
    const executorIdentity = inspectCodexExecutor(codex, worktreeRoot, process.env);
    const result = await runChild(codex, buildCodexHostArgs({
      trustedThirdReview,
      taskPath: context.task.taskPath,
      worktreeRoot,
      schemaPath,
      outputPath,
      prompt,
    }), {
      cwd: worktreeRoot,
      env: { ...process.env, WORKFLOWHUB_HOST_BRIDGE_ACTIVE: "1" },
      timeoutMs: Number.parseInt(process.env.WORKFLOWHUB_HOST_BRIDGE_TIMEOUT_MS ?? "900000", 10),
      label: `Codex skill ${request.stage}/${request.name}`,
    });
    if (result.code !== 0) {
      const diagnostics = [result.stderr.trim().slice(-2000), result.stdout.trim().slice(-4000)].filter(Boolean).join("\n");
      throw new Error(`Codex skill ${request.stage}/${request.name} exited ${result.code ?? "null"}${result.signal ? ` (${result.signal})` : ""}: ${diagnostics}`);
    }
    const outcome = assertHostOutcome(JSON.parse(readFileSync(outputPath, "utf8")));
    const outcomeRecord = {
      schema_version: "workflowhub-host-invocation-outcome.v1",
      task_id: request.task_id,
      stage: request.stage,
      workflow_run_id: request.workflow_run_id,
      name: request.name,
      invocation_key: request.invocation_key,
      declared_trigger: request.declared_trigger,
      bundle_hash: request.bundle_hash,
      executor: "codex",
      executor_identity: executorIdentity,
      request_snapshot_tree: request.snapshot_tree,
      outcome,
      recorded_at: new Date().toISOString(),
    };
    authenticateStageWriteBoundary(context, {
      runnerRoot: RUNNER_ROOT,
      operation: "host-invocation-result",
    });
    const snapshotTree = captureGitWorktreeSnapshot(worktreeRoot).tree;
    outcomeRecord.snapshot_tree = snapshotTree;
    const raw = `${JSON.stringify(outcomeRecord, null, 2)}\n`;
    try {
      const published = context.kernel.publishCanonicalRecord(outcomeRef, raw);
      return assertHostBridgeResponse({ outcome_ref: published.ref, outcome_hash: published.sha256, snapshot_tree: snapshotTree });
    } catch (error) {
      if (error?.code !== "EEXIST") throw error;
      const existingRaw = context.task.readRecord(outcomeRef);
      const existing = JSON.parse(existingRaw);
      assertCodexHostOutcomeRecord(existing, request, outcomeRef);
      if (existing.snapshot_tree !== snapshotTree) throw new Error(`Codex host outcome ${outcomeRef} was concurrently published with a different snapshot`);
      return assertHostBridgeResponse({ outcome_ref: outcomeRef, outcome_hash: sha256(existingRaw), snapshot_tree: existing.snapshot_tree });
    }
  } finally {
    rmSync(bridgeDir, { recursive: true, force: true });
  }
}

function assertObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError(label + " must be an object");
  return value;
}

/**
 * Bind serialized host outcomes to the private ordered stage-skill dispatcher.
 * The host must have produced each outcome through invoke-stage-skill; this
 * adapter only authenticates immutable outcome references while the official
 * stage runs.
 */
export function createStageSkillDispatchPublication(value, stage) {
  const input = assertObject(value, "stage_skill_dispatch");
  const unknown = Object.keys(input).filter((key) => !new Set(["controls", "outcomes"]).has(key));
  if (unknown.length) throw new TypeError("stage_skill_dispatch has unknown fields: " + unknown.join(", "));
  const controls = assertObject(input.controls ?? {}, "stage_skill_dispatch.controls");
  const outcomes = assertObject(input.outcomes ?? {}, "stage_skill_dispatch.outcomes");
  const scalarControlKeys = new Set([
    "selectedTestingSkill", "selected_testing_skill",
    "testingNotApplicable", "testing_not_applicable",
    "testingNotApplicableReason", "testing_not_applicable_reason",
  ]);
  const perSkillKeys = new Set([
    "triggered", "notInvokedReason", "not_invoked_reason",
    "invocationKey", "invocation_key",
  ]);
  for (const [name, control] of Object.entries(controls)) {
    if (scalarControlKeys.has(name)) continue;
    assertObject(control, "stage_skill_dispatch.controls." + name);
    const invalid = Object.keys(control).filter((key) => !perSkillKeys.has(key));
    if (invalid.length) throw new TypeError("stage_skill_dispatch.controls." + name + " has unknown fields: " + invalid.join(", "));
  }
  for (const [key, response] of Object.entries(outcomes)) {
    assertObject(response, "stage_skill_dispatch.outcomes." + key);
    const invalid = Object.keys(response).filter((field) => !new Set(["outcome_ref", "outcome_hash", "snapshot_tree"]).has(field));
    if (invalid.length) throw new TypeError("stage_skill_dispatch.outcomes." + key + " has unknown fields: " + invalid.join(", "));
    if (typeof response.outcome_ref !== "string"
        || (!response.outcome_ref.startsWith("quality/") && !response.outcome_ref.startsWith("evidence/"))) {
      throw new TypeError("stage_skill_dispatch.outcomes." + key + ".outcome_ref must use a canonical namespace");
    }
    if (!SHA256.test(response.outcome_hash ?? "") || !GIT_OID.test(response.snapshot_tree ?? "")) {
      throw new TypeError("stage_skill_dispatch.outcomes." + key + " must contain authenticated hash and snapshot");
    }
  }
  return Object.freeze({
    stageSkillDispatch: Object.freeze({
      packageRoot: RUNNER_ROOT,
      controls: Object.freeze({ ...controls }),
      hostInvoke: async ({ name, invocationKey }) => {
        const key = name + "/" + invocationKey;
        const response = outcomes[key] ?? outcomes[name];
        if (!response) throw new Error("MATERIAL_INCOMPLETE: missing stage skill outcome for " + stage + "/" + key);
        return Object.freeze({ ...response });
      },
    }),
  });
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
  if (!new Set(["doctor", "status", "invoke-stage-skill", "artifact", "review-risk-pause", "run", "confirm", "authorize-operation"]).has(command)) {
    throw new TypeError("usage: stage-runtime.mjs <doctor|status|run|review|verify|confirm|authorize> --stage=<stage> --project=<project> --task=<task> [...]");
  }
  return { command, values };
}

export async function stageRuntimeMain(argv = process.argv.slice(2)) {
  const { command, values } = parseArgs(argv);
  if (Object.prototype.hasOwnProperty.call(values, "worktree-root") || Object.prototype.hasOwnProperty.call(values, "baseline-commit")) {
    throw new TypeError("--worktree-root/--baseline-commit are no longer supported; make-decision owns deterministic worktree preparation");
  }
  if (Object.prototype.hasOwnProperty.call(values, "runner-root")) throw new TypeError("--runner-root is forbidden; stage-runtime authenticates its own repository root");
  if (command === "invoke-stage-skill" && (!values.name || !values["invocation-key"])) {
    throw new TypeError("invoke-stage-skill requires --name and --invocation-key");
  }
  if (command === "review-risk-pause" && !values.input) {
    throw new TypeError(`${command} requires --input=<risk-input.json>`);
  }
  if (command === "artifact" && (!values.name || !values.input)) throw new TypeError("artifact requires --name=<artifact.md> --input=<content-file>");
  if (command === "authorize-operation") {
    if (!new Set(["commit", "push", "merge", "archive", "cleanup"]).has(values.operation)) throw new TypeError("authorize-operation requires --operation=commit|push|merge|archive|cleanup");
    if (typeof values["subject-ref"] !== "string" || values["subject-ref"].trim() === "") throw new TypeError("authorize-operation requires --subject-ref=<quality/confirmations/<sha256>.json>");
  }
  if (command === "run" && !values.input) throw new TypeError("run requires --input=<component-receipts.json>");
  let context = bootstrapStage(values.stage, {
    mode: "launcher",
    projectName: values.project,
    taskId: values.task,
    runnerRoot: RUNNER_ROOT,
    readOnly: command === "status",
  });
  const input = new Set(["review-risk-pause", "run"]).has(command)
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
  const writeBoundary = authenticateStageWriteBoundary(context, {
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
      const existing = context.kernel.readStageSkillInvocation(values.stage, values.name, values["invocation-key"]);
      if (existing) return { status: "existing", invocation: existing.fact, ref: existing.ref, outcome_hash: existing.hash };
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
    const existing = context.kernel.readStageSkillInvocation(values.stage, values.name, values["invocation-key"]);
    if (existing) {
      const response = assertHostBridgeResponse({
        outcome_ref: existing.fact.outcome_ref,
        outcome_hash: existing.fact.outcome_hash,
        snapshot_tree: existing.fact.snapshot_tree,
      });
      if (response.snapshot_tree !== request.snapshot_tree) {
        throw new Error(`${values.stage}/${values.name}: existing invocation is bound to a different workspace snapshot`);
      }
      return { status: "existing", invocation: existing.fact, ref: response.outcome_ref, outcome_hash: response.outcome_hash };
    }
    process.stdout.write(`${JSON.stringify(request)}\n`);
    let response;
    if (process.env.WORKFLOWHUB_HOST_BRIDGE === "codex") {
      if (process.env.WORKFLOWHUB_HOST_BRIDGE_ACTIVE === "1") {
        throw new Error("nested WorkflowHub host bridge invocation is forbidden");
      }
      response = await invokeCodexHost({ request, context, prepared });
    } else {
      const responseRaw = await new Promise((resolve, reject) => {
        let body = "";
        process.stdin.setEncoding("utf8");
        process.stdin.on("data", (chunk) => { body += chunk; });
        process.stdin.on("end", () => resolve(body));
        process.stdin.on("error", reject);
      });
      const lines = responseRaw.split("\n").filter((line) => line.trim() !== "");
      if (lines.length !== 1) throw new Error("host bridge requires exactly one response after request");
      try { response = JSON.parse(lines[0]); } catch { throw new Error("host bridge response must be one JSON line"); }
      response = assertHostBridgeResponse(response);
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
  if (command === "artifact") {
    if (!DESIGN_ARTIFACTS[values.stage]?.has(values.name)) throw new TypeError(`unsupported ${values.stage} artifact: ${values.name}`);
    context.artifacts.writeAtomic(values.name, readFileSync(values.input, "utf8"));
    return { artifact_ref: context.artifacts.reference(values.name) };
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
    if (!input || typeof input !== "object" || Array.isArray(input)
        || !input.receipts || typeof input.receipts !== "object" || Array.isArray(input.receipts)) {
      throw new TypeError("run input requires a receipts object");
    }
    const allowedRunFields = new Set(values.stage === "build-code"
      ? ["receipts", "acceptance_coverage", "finding_dispositions", "stage_skill_dispatch"]
      : ["receipts", "finding_dispositions", "stage_skill_dispatch"]);
    const unknownRunFields = Object.keys(input).filter((key) => !allowedRunFields.has(key));
    if (unknownRunFields.length) throw new TypeError(`run input has unknown fields: ${unknownRunFields.join(", ")}`);
    if (Object.prototype.hasOwnProperty.call(input?.receipts ?? {}, "audit")) throw new TypeError("run audit summary is runtime-derived and caller-forbidden");
    const audit = undefined;
    const { stage_skill_dispatch: dispatchInput, ...officialInput } = input;
    const controlledInput = {
      ...officialInput,
      receipts: { ...officialInput.receipts },
    };
    const publication = dispatchInput === undefined
      ? undefined
      : createStageSkillDispatchPublication(dispatchInput, values.stage);
    const attempt = await runOfficialStage(values.stage, context, controlledInput, publication);
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
        review: ["invoke", "risk"],
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
    "review:invoke": "invoke-stage-skill",
    "review:risk": "review-risk-pause",
    "verify:execute": "verify-execute",
    "confirm:decision": "confirm",
    "authorize:commit": "authorize-operation",
    "authorize:push": "authorize-operation",
    "authorize:merge": "authorize-operation",
    "authorize:archive": "authorize-operation",
    "authorize:cleanup": "authorize-operation",
  })[publicRoute];
  if (!internalOperation) throw new Error("unknown public runtime action");
  const delegatedArgv = [
    internalOperation === "verify-execute" ? "run" : internalOperation,
    ...raw.filter((item) => item !== actionArgument),
    ...(behavior === "authorize" ? [`--operation=${action}`] : []),
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

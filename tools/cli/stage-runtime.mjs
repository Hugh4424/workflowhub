#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
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

const DESIGN_ARTIFACTS = Object.freeze({
  "make-decision": new Set(["decision-log.md"]),
  "build-spec": new Set(["spec.md"]),
  "build-plan": new Set(["plan.md", "tasks.md"]),
});
const RUNNER_ROOT = fileURLToPath(new URL("../../", import.meta.url));
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const SHA256 = /^[a-f0-9]{64}$/;
const GIT_OID = /^[a-f0-9]{40,64}$/;

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

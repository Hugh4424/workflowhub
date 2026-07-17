#!/usr/bin/env node

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { isAbsolute } from "node:path";
import { pathToFileURL } from "node:url";
import { ReviewProviderClient } from "./review-provider-client.mjs";
import { runReview, verifyFinal } from "./review-runner.mjs";
import { loadTrustedThirdReviewConfig } from "./third-review-host-config.mjs";
import { bootstrapStage, assertWorkspace } from "../../../core/stage-context.mjs";
import { readPhaseSubject } from "../../../core/phase-subject.mjs";

const HASH = /^[a-f0-9]{64}$/;
const OID = /^[a-f0-9]{40}$/;
const PHASE_TESTS = ["targeted", "full", "check", "diff-check"];
const PHASE_TEST_CONTRACT = Object.freeze({
  targeted: Object.freeze({ component: "phase-targeted-tests", command: /^npx vitest run\s+\S/ }),
  full: Object.freeze({ component: "phase-full-tests", command: "npm test" }),
  check: Object.freeze({ component: "phase-check", command: "npm run check" }),
  "diff-check": Object.freeze({ component: "phase-diff-check", command: "git diff --check" }),
});

function sha256(value) { return createHash("sha256").update(value).digest("hex"); }
function canonicalRecord(task, ref) {
  const raw = task.readRecord(ref);
  return { ref, sha256: sha256(Buffer.from(raw)), value: JSON.parse(raw) };
}
function acceptanceCriteria(spec) {
  const lines = String(spec).split(/\r?\n/); const start = lines.findIndex((line) => /^##\s+.*(?:验收标准|Acceptance Criteria)\s*$/i.test(line.trim()));
  if (start < 0) throw new Error("MATERIAL_INCOMPLETE: frozen spec has no acceptance criteria section");
  const endOffset = lines.slice(start + 1).findIndex((line) => /^##\s+/.test(line)); const end = endOffset < 0 ? lines.length : start + 1 + endOffset;
  const result = lines.slice(start, end).join("\n").trim();
  if (!result) throw new Error("MATERIAL_INCOMPLETE: frozen acceptance criteria are empty");
  return `${result}\n`;
}

export function assembleTrustedPhaseMaterials(context, phaseId) {
  const subject = readPhaseSubject(context.task, phaseId, context.workspace);
  const acceptedSpec = context.kernel.readAccepted("build-spec");
  const acceptedPlan = context.kernel.readAccepted("build-plan");
  const expectedSpecUpstream = [{ task_id: context.task.identity.taskId, stage: "build-spec", accepted_ref: "results/build-spec/accepted.json" }];
  if (JSON.stringify(acceptedPlan.attempt.upstream_refs) !== JSON.stringify(expectedSpecUpstream)
    || acceptedPlan.attempt.upstream_refs[0]?.task_id !== acceptedSpec.accepted.task_id) {
    throw new Error("MATERIAL_INCOMPLETE: accepted build-plan is not bound to the current accepted build-spec");
  }
  const spec = String(context.artifacts.read("spec.md"));
  const plan = String(context.artifacts.read("plan.md"));
  const tasks = String(context.artifacts.read("tasks.md"));
  const canonical = [canonicalRecord(context.task, subject.ref), canonicalRecord(context.task, `evidence/phases/${phaseId}/diff.json`)];
  const receipts = PHASE_TESTS.map((name) => canonicalRecord(context.task, `receipts/${phaseId}-${name}.json`));
  const implementationSnapshot = JSON.parse(context.task.readRecord(subject.value.implementation.ref));
  for (const [index, item] of receipts.entries()) {
    const lane = PHASE_TESTS[index]; const contract = PHASE_TEST_CONTRACT[lane];
    const receipt = item.value;
    if (receipt?.schema_version !== "workflowhub-receipt.v1" || receipt.task_id !== context.task.identity.taskId || receipt.stage !== "build-code" || receipt.producer?.stage !== "build-code" || receipt.producer?.component !== contract.component || typeof receipt.producer?.version !== "string") throw new Error(`MATERIAL_INCOMPLETE: invalid phase test receipt ${item.ref}`);
    const commandMatches = typeof contract.command === "string" ? receipt.command === contract.command : contract.command.test(receipt.command ?? "");
    if (!commandMatches || sha256(receipt.command) !== receipt.command_hash) throw new Error(`MATERIAL_INCOMPLETE: invalid phase test command contract ${item.ref}`);
    if (!Number.isInteger(receipt.exit_code) || !HASH.test(receipt.output_hash ?? "") || !OID.test(receipt.snapshot_head ?? "") || !OID.test(receipt.snapshot_tree ?? "") || !OID.test(receipt.snapshot_commit ?? "") || receipt.snapshot_head !== implementationSnapshot.head_oid || receipt.snapshot_tree !== subject.value.implementation.tree_oid) throw new Error(`MATERIAL_INCOMPLETE: phase test receipt is not bound to implementation snapshot ${item.ref}`);
    let commitTree;
    try { commitTree = String(execFileSync("git", ["rev-parse", `${receipt.snapshot_commit}^{tree}`], { cwd: context.workspace.worktreeRoot, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] })).trim(); }
    catch { throw new Error(`MATERIAL_INCOMPLETE: phase test snapshot commit is unavailable ${item.ref}`); }
    if (commitTree !== receipt.snapshot_tree) throw new Error(`MATERIAL_INCOMPLETE: phase test snapshot commit tree mismatch ${item.ref}`);
    const started = Date.parse(receipt.started_at); const completed = Date.parse(receipt.completed_at);
    if (!Number.isFinite(started) || !Number.isFinite(completed) || completed < started) throw new Error(`MATERIAL_INCOMPLETE: invalid phase test timestamps ${item.ref}`);
    if (typeof receipt.output_ref !== "string" || !/^evidence\/[a-zA-Z0-9][a-zA-Z0-9._/-]*$/.test(receipt.output_ref) || receipt.output_ref.includes("..")) throw new Error(`MATERIAL_INCOMPLETE: invalid phase test output ref ${item.ref}`);
    const output = context.task.readRecord(receipt.output_ref);
    if (sha256(Buffer.from(output)) !== receipt.output_hash) throw new Error(`MATERIAL_INCOMPLETE: phase test output hash mismatch ${item.ref}`);
  }
  return Object.freeze({
    approved_spec: spec, approved_plan: plan, approved_tasks: tasks, acceptance_criteria: acceptanceCriteria(spec),
    test_evidence: Object.freeze({ phase_id: phaseId, implementation_tree: subject.value.implementation.tree_oid,
      phase_evidence: canonical.map(({ ref, sha256: digest }) => ({ ref, sha256: digest })),
      test_receipts: receipts.map(({ ref, sha256: digest, value }) => ({ ref, sha256: digest, output_ref: value.output_ref, output_hash: value.output_hash, snapshot_tree: value.snapshot_tree, exit_code: value.exit_code })) })
  });
}

function trustedTaskWorktree(input) {
  if (Object.prototype.hasOwnProperty.call(input, "phase_id")) {
    const context = bootstrapStage("build-code", { projectName: input.project_name, taskId: input.task_id });
    const workspace = assertWorkspace(context.workspace);
    return { taskId: input.task_id, task: context.task, workspace, sourceRoot: workspace.worktreeRoot, targetRepoRoot: context.task.manifest.target_repo_root, context };
  }
  if (!isAbsolute(input.task_path ?? "")) throw new TypeError("task_path must be an absolute TaskHandle path");
  const taskId = input.task_id ?? input.taskId;
  const projectName = input.project_name ?? input.projectName;
  const stage = input.stage;
  if (stage === "make-decision") {
    throw new Error("make-decision review requires an in-process candidate Workspace capability; the CLI only accepts an already accepted Workspace");
  }
  if (input.source_root !== undefined || input.sourceRoot !== undefined) {
    throw new TypeError("source_root is forbidden; Workspace comes from accepted make-decision facts");
  }
  const context = bootstrapStage(stage, {
    mode: "sidecar",
    taskPath: input.task_path,
    projectName,
    taskId,
  });
  const workspace = assertWorkspace(context.workspace);
  return {
    taskId,
    task: context.task,
    workspace,
    sourceRoot: workspace.worktreeRoot,
    targetRepoRoot: context.task.manifest.target_repo_root,
  };
}

function providerClient() {
  const thirdReview = loadTrustedThirdReviewConfig();
  return { thirdReview, client: new ReviewProviderClient({ command: thirdReview.command, config: thirdReview.config }) };
}

export async function runReviewRound(input) {
  const phaseMode = Object.prototype.hasOwnProperty.call(input, "phase_id") || Object.prototype.hasOwnProperty.call(input, "phaseId");
  if (phaseMode) {
    const allowed = new Set(["project_name", "task_id", "stage", "phase_id"]); const unknown = Object.keys(input).filter((key) => !allowed.has(key));
    if (unknown.length) throw new TypeError(`phase review accepts only project_name, task_id, stage, phase_id; rejected: ${unknown.join(", ")}`);
    if (input.stage !== "build-code" || typeof input.project_name !== "string" || typeof input.task_id !== "string" || typeof input.phase_id !== "string") throw new TypeError("phase review requires exact project_name/task_id/stage=build-code/phase_id");
  }
  for (const forbidden of ["path_filter", "paths", "base_commit", "candidate_commit", "commit_range", "diff"]) {
    if (input[forbidden] !== undefined) throw new TypeError(`${forbidden} is forbidden; use phase_id or the full worktree subject`);
  }
  const trusted = trustedTaskWorktree(input);
  const materials = phaseMode ? assembleTrustedPhaseMaterials(trusted.context, input.phase_id) : input.materials;
  const { thirdReview, client } = providerClient();
  const { context: _context, ...reviewAuthority } = trusted;
  const result = await runReview({
    ...reviewAuthority, attachmentRoot: thirdReview.attachmentRoot,
    stage: input.stage, phaseId: input.phase_id ?? input.phaseId ?? null, reviewTrack: input.review_track ?? input.reviewTrack ?? null, uiScope: input.ui_scope === true,
    materials, hostProvider: phaseMode ? "codex" : input.host_provider ?? input.hostProvider,
    providers: phaseMode ? ["opencode"] : input.providers ?? input.provider_allowlist ?? input.providerAllowlist,
    previousRuntimeIds: input.previous_runtime_ids ?? input.previousRuntimeIds ?? {}, providerClient: client,
  });
  return {
    status: result.status, verdict: result.verdict,
    attempt_ref: result.attemptRef,
    result_ref: result.resultRef,
    snapshot_tree: result.snapshotTree, material_id: result.materialId, runtime_ids: result.runtimeIds,
    subject_kind: result.subjectKind, phase_id: result.phaseId, base_tree: result.baseTree, candidate_tree: result.candidateTree,
  };
}

export function verifyFinalReview(input) {
  const trusted = trustedTaskWorktree(input);
  const result = verifyFinal({
    ...trusted, attachmentRoot: providerClient().thirdReview.attachmentRoot, resultRef: input.result_ref ?? input.resultRef,
    taskId: trusted.taskId, stage: input.stage, reviewTrack: input.review_track ?? input.reviewTrack,
  });
  return { status: result.status, snapshot_tree: result.snapshotTree };
}

async function main() {
  const command = process.argv[2];
  if (!new Set(["run", "verify-final"]).has(command)) throw new Error("usage: wh-review-cli.mjs <run|verify-final> [input.json]");
  const input = JSON.parse(readFileSync(process.argv[3] ?? 0, "utf8"));
  const result = command === "run" ? await runReviewRound(input) : verifyFinalReview(input);
  process.stdout.write(`${JSON.stringify(result)}\n`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main().catch((error) => { process.stderr.write(`${error?.stack ?? error}\n`); process.exitCode = 1; });

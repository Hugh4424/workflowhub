import { afterEach, describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createTask } from "../core/task-handle.mjs";
import { createTaskKernel } from "../core/task-kernel.mjs";
import { captureGitWorktreeSnapshot } from "../core/git-worktree-snapshot.mjs";
import { createCanonicalSource, createSourceManifest } from "../core/canonical-source.mjs";
import { loadStageManifest } from "../core/step-manifest.mjs";
import { writeFormalReviewFixture } from "./helpers/formal-review.mjs";

const roots = [];
const runtime = new URL("../scripts/stage-runtime.mjs", import.meta.url).pathname;
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
afterEach(() => { while (roots.length) rmSync(roots.pop(), { recursive: true, force: true }); });

function linkedWorktrees(repo) {
  return String(execFileSync("git", ["worktree", "list", "--porcelain"], { cwd: repo, encoding: "utf8" }))
    .split("\n")
    .filter((line) => line.startsWith("worktree "))
    .map((line) => realpathSync(line.slice("worktree ".length)))
    .filter((path) => path !== realpathSync(repo));
}

function registerReviewHead(task, resultRef) {
  const result = JSON.parse(task.readRecord(resultRef));
  const kernel = createTaskKernel(task);
  const identity = kernel.deriveReviewFlowIdentity({
    stage: result.stage,
    review_track: result.review_track,
    subject_kind: result.subject_kind,
    phase_id: result.phase_id,
    review_scope: result.review_scope,
  });
  kernel.advanceReviewFlow(identity, { expected_head_ref: null, result_ref: resultRef });
}

function prepareOfficialRun(task, stage, reason) {
  const kernel = createTaskKernel(task);
  const source = createCanonicalSource({
    source_type: "offline_fixture",
    source_id: `${task.manifest.task_id}-${stage}`,
    revision: "r1",
    requirements: ["R1"],
  });
  const sourceManifest = createSourceManifest({
    canonical_source: source,
    atoms: [{
      requirement_id: "R1",
      text: "The official make-decision execution must remain auditable.",
      owner: "product",
      authority: "test",
      derived_from: [],
      supersedes: [],
      status: "accepted",
      stale: false,
    }],
  }).manifest;
  kernel.startStageRun(stage, { reason });
  kernel.publishRequirementsLedger(stage, {
    source_manifest: sourceManifest,
    mappings: {
      R1: {
        decision_ref: { kind: "decision", uri_or_path: "decision://R1", content_hash: "b".repeat(64) },
        artifact_refs: [{ kind: "artifact", uri_or_path: "artifact://R1", content_hash: "c".repeat(64) }],
        acceptance_criteria_refs: [{ kind: "ac", uri_or_path: "ac://R1", content_hash: "d".repeat(64) }],
      },
    },
  });
  for (const step of loadStageManifest(stage, realpathSync(join(import.meta.dirname, ".."))).steps) {
    const entry = kernel.writeStageStepEntry(stage, {
      step_id: step.step_id,
      attempt_id: "attempt-1",
      entry_evidence: { kind: "fixture", uri_or_path: `evidence/${stage}-step-${step.step_id}-entry.json` },
    });
    kernel.writeStageStepExit(stage, {
      step_id: step.step_id,
      attempt_id: "attempt-1",
      entry_journal_entry_id: entry.journal_entry_id,
      terminal_status: "success",
      completion_evidence: { kind: "fixture", uri_or_path: `evidence/${stage}-step-${step.step_id}-exit.json` },
    });
  }
}

function interactionTalkPayload(roundNumber, tree) {
  const hasQuestion = roundNumber === 1;
  const questions = hasQuestion ? [{
    question_id: "scope-boundary",
    question_number: 1,
    card_hash: sha256("fixture scope question card"),
    ask: { ref: "host-message://ask/fixture-scope-boundary", hash: sha256("fixture visible ask") },
    reply: { ref: "host-message://reply/fixture-scope-boundary", hash: sha256("fixture visible reply") },
    rerank: { ref: "host-message://rerank/fixture-scope-boundary", hash: sha256("fixture visible rerank") },
  }] : [];
  return {
    interaction_type: "talk",
    rounds: [{
      round_number: roundNumber,
      candidate_queue: [{
        item_id: `fixture-axis-${roundNumber}`,
        impact: hasQuestion ? "high" : "medium",
        status: hasQuestion ? "answered" : "evidence-resolved",
        reason: hasQuestion
          ? "The host-visible reply fixed the scope boundary"
          : `Round ${roundNumber} inputs already resolve the only candidate axis`,
      }],
      questions,
      questions_already_asked: questions.length,
      open_direction_changing_questions: 0,
      current_total: questions.length,
      end_reason: hasQuestion
        ? "The host-visible reply resolved the final direction-changing question"
        : `Round ${roundNumber} candidate queue was resolved from existing facts`,
      zero_question_reason: hasQuestion ? null : `round ${roundNumber} had no remaining direction-changing questions`,
    }],
    grill: null,
    workspace_tree: tree,
  };
}

function interactionGrillPayload(tree) {
  return {
    interaction_type: "grill",
    rounds: [],
    grill: {
      context: { status: "no-change", reason: "Fixture context remains accurate" },
      adr: { status: "not-needed", reason: "Fixture changes no architecture decision" },
      conflicts: { status: "none", reason: "Fixture has no document conflicts" },
      file_references: ["CONTEXT.md"],
      exit_checks: {
        context_checked: true,
        adr_checked: true,
        conflicts_checked: true,
        file_references_checked: true,
      },
    },
    workspace_tree: tree,
  };
}

function publishMakeDecisionContent({ invoke, inputRoot, task, tree, decisionReceipt }) {
  const publish = (name, payload) => {
    const input = join(inputRoot, `${name}.json`);
    writeFileSync(input, `${JSON.stringify(payload)}\n`);
    return JSON.parse(invoke([
      "publish-content-evidence", "--stage=make-decision", `--project=${task.manifest.project_name}`,
      `--task=${task.identity.taskId}`, "--kind=interaction-completion.v1", `--input=${input}`,
    ]));
  };
  const talks = [1, 2, 3].map((roundNumber) => publish(`talk-${roundNumber}`, interactionTalkPayload(roundNumber, tree)));
  const grill = publish("grill", interactionGrillPayload(tree));
  publish("interaction-aggregate", {
    interaction_type: "aggregate",
    rounds: talks.map((item) => ({ ref: item.evidence_ref, hash: item.evidence_hash })),
    grill: { ref: grill.evidence_ref, hash: grill.evidence_hash },
    workspace_tree: tree,
    decision_ref: decisionReceipt.decision_ref,
    decision_hash: decisionReceipt.decision_hash,
  });
  const coverageInput = join(inputRoot, "decision-coverage.json");
  writeFileSync(coverageInput, `${JSON.stringify({
    decision_log_ref: decisionReceipt.decision_ref,
    decision_log_hash: decisionReceipt.decision_hash,
    items: [],
    summary: { covered: 0, accepted_omission: 0, missing: 0 },
  })}\n`);
  invoke([
    "publish-content-evidence", "--stage=make-decision", `--project=${task.manifest.project_name}`,
    `--task=${task.identity.taskId}`, "--kind=decision-coverage-audit.v1", `--input=${coverageInput}`,
  ]);
}

describe("official make-decision CLI", () => {
  it("rejects an interaction aggregate bound to a different canonical decision artifact", () => {
    const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-decision-aggregate-"))); roots.push(root);
    const repo = join(root, "repo"); mkdirSync(repo);
    execFileSync("git", ["init", "-q"], { cwd: repo });
    execFileSync("git", ["config", "user.name", "Test"], { cwd: repo });
    execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: repo });
    execFileSync("git", ["commit", "--allow-empty", "-qm", "base"], { cwd: repo });
    const taskPath = join(root, "Projects", "Demo", "tasks", "aggregate-decision-task");
    const task = createTask({
      storageRoot: root,
      taskPath,
      manifest: {
        schema_version: "1.0.0",
        project_name: "Demo",
        task_id: "aggregate-decision-task",
        created_at: new Date().toISOString(),
        target_repo_root: repo,
        issue_ids: [],
        inputs: {},
      },
    });
    prepareOfficialRun(task, "make-decision", "aggregate decision binding rejection");
    const inputRoot = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-make-decision."))); roots.push(inputRoot);
    const env = { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root };
    const invoke = (args) => execFileSync(process.execPath, [runtime, ...args], { cwd: repo, env, encoding: "utf8" });
    const prepared = JSON.parse(invoke(["prepare", "--stage=make-decision", "--project=Demo", "--task=aggregate-decision-task"]));
    const decisionPayload = join(inputRoot, "decision.json");
    writeFileSync(decisionPayload, `${JSON.stringify({ decision_log: "# Official decision\n\nShip B." })}\n`);
    const decision = JSON.parse(invoke([
      "receipt", "--stage=make-decision", "--project=Demo", "--task=aggregate-decision-task",
      "--component=decision", `--input=${decisionPayload}`,
    ]));
    const officialDecision = JSON.parse(task.readRecord(decision.receipt_ref));
    const otherDecision = "# Other canonical decision\n\nShip A.";
    const otherHash = sha256(otherDecision);
    const otherRef = `receipts/decision-log/${otherHash}.md`;
    createTaskKernel(task).publishCanonicalRecord(otherRef, otherDecision);
    const tree = captureGitWorktreeSnapshot(prepared.worktree_root).tree;
    publishMakeDecisionContent({
      invoke,
      inputRoot,
      task,
      tree,
      decisionReceipt: { decision_ref: otherRef, decision_hash: otherHash },
    });
    const direction = writeFormalReviewFixture({ task, stage: "make-decision", snapshotTree: tree, reviewTrack: "direction" });
    const detail = writeFormalReviewFixture({ task, stage: "make-decision", snapshotTree: tree, reviewTrack: "detail" });
    registerReviewHead(task, direction.resultRef);
    registerReviewHead(task, detail.resultRef);
    const input = join(inputRoot, "run.json");
    writeFileSync(input, `${JSON.stringify({
      receipts: {
        decision: decision.receipt_ref,
        direction_review: direction.resultRef,
        detail_review: detail.resultRef,
      },
    })}\n`);
    const result = spawnSync(process.execPath, [
      runtime, "run", "--stage=make-decision", "--project=Demo", "--task=aggregate-decision-task", `--input=${input}`,
    ], { cwd: repo, env, encoding: "utf8" });
    expect(officialDecision.decision_ref).not.toBe(otherRef);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/interaction aggregate decision binding differs/i);
  });

  it("binds canonical decision receipt ref and exact byte hash into facts", () => {
    const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-decision-cli-"))); roots.push(root);
    const repo = join(root, "repo"); mkdirSync(repo);
    execFileSync("git", ["init", "-q"], { cwd: repo });
    execFileSync("git", ["config", "user.name", "Test"], { cwd: repo });
    execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: repo });
    execFileSync("git", ["commit", "--allow-empty", "-qm", "base"], { cwd: repo });
    const baseStatus = String(execFileSync("git", ["status", "--porcelain", "--untracked-files=all"], { cwd: repo }));
    const head = String(execFileSync("git", ["rev-parse", "HEAD"], { cwd: repo })).trim();
    const taskPath = join(root, "Projects", "Demo", "tasks", "decision-task");
    const task = createTask({ storageRoot: root, taskPath, manifest: { schema_version: "1.0.0", project_name: "Demo", task_id: "decision-task", created_at: new Date().toISOString(), target_repo_root: repo, issue_ids: [], inputs: {} } });
    prepareOfficialRun(task, "make-decision", "official decision CLI execution");
    const inputRoot = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-make-decision."))); roots.push(inputRoot);
    const missingDecisionLogPayload = join(inputRoot, "decision-missing-log.json"); writeFileSync(missingDecisionLogPayload, `${JSON.stringify({ content: "go" })}\n`);
    const decisionPayload = join(inputRoot, "decision.json"); writeFileSync(decisionPayload, `${JSON.stringify({ decision_log: "# Decision\n\nGo." })}\n`);
    const snapshotTree = String(execFileSync("git", ["rev-parse", "HEAD^{tree}"], { cwd: repo })).trim();
    const direction = writeFormalReviewFixture({ task, stage: "make-decision", snapshotTree, reviewTrack: "direction" });
    const detail = writeFormalReviewFixture({ task, stage: "make-decision", snapshotTree, reviewTrack: "detail" });
    registerReviewHead(task, direction.resultRef);
    registerReviewHead(task, detail.resultRef);
    const input = join(inputRoot, "input.json"); writeFileSync(input, `${JSON.stringify({ receipts: { decision: "receipts/decision.json", direction_review: direction.resultRef, detail_review: detail.resultRef } })}\n`);
    const env = { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root };
    const invoke = (args) => execFileSync(process.execPath, [runtime, ...args], { cwd: repo, env, encoding: "utf8" });
    expect(linkedWorktrees(repo)).toEqual([]);
    const missingDecisionLog = spawnSync(process.execPath, [runtime, "receipt", "--stage=make-decision", "--project=Demo", "--task=decision-task", "--component=decision", `--input=${missingDecisionLogPayload}`], { cwd: repo, env, encoding: "utf8" });
    expect(missingDecisionLog.status).not.toBe(0);
    expect(missingDecisionLog.stderr).toMatch(/decision_log/i);
    const decision = JSON.parse(invoke(["receipt", "--stage=make-decision", "--project=Demo", "--task=decision-task", "--component=decision", `--input=${decisionPayload}`]));
    expect(decision.receipt_ref).toBe("receipts/decision.json");
    expect(linkedWorktrees(repo)).toEqual([]);
    const badInput = spawnSync(process.execPath, [runtime, "run", "--stage=make-decision", "--project=Demo", "--task=decision-task", `--input=${join(inputRoot, "missing.json")}`], { cwd: repo, env, encoding: "utf8" });
    expect(badInput.status).not.toBe(0);
    expect(badInput.stderr).toMatch(/ENOENT|missing\.json/i);
    expect(linkedWorktrees(repo)).toEqual([]);
    const decisionRaw = task.readRecord(decision.receipt_ref);
    const decisionReceipt = JSON.parse(decisionRaw);
    expect(task.readRecord(decisionReceipt.decision_ref)).toBe("# Decision\n\nGo.");
    const prepared = JSON.parse(invoke(["prepare", "--stage=make-decision", "--project=Demo", "--task=decision-task"]));
    publishMakeDecisionContent({
      invoke,
      inputRoot,
      task,
      tree: captureGitWorktreeSnapshot(prepared.worktree_root).tree,
      decisionReceipt,
    });
    const result = JSON.parse(invoke(["run", "--stage=make-decision", "--project=Demo", "--task=decision-task", `--input=${input}`]));
    const worktree = realpathSync(`${repo}-decision-task`);
    expect(result.attempt.facts).toMatchObject({
      decision_ref: decisionReceipt.decision_ref, decision_hash: decisionReceipt.decision_hash,
      worktree_root: worktree, baseline_commit: head,
    });
    expect(linkedWorktrees(repo)).toEqual([worktree]);
    expect(() => task.readRecord("results/make-decision/accepted.json")).toThrow();
    const specInputRoot = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-build-spec."))); roots.push(specInputRoot);
    const specPayload = join(specInputRoot, "spec.json"); writeFileSync(specPayload, `${JSON.stringify({ content: "# Spec\n" })}\n`);
    const beforeAccept = spawnSync(process.execPath, [runtime, "receipt", "--stage=build-spec", "--project=Demo", "--task=decision-task", "--component=spec", `--input=${specPayload}`], { cwd: repo, env, encoding: "utf8" });
    expect(beforeAccept.status).not.toBe(0);
    expect(beforeAccept.stderr).toMatch(/accepted make-decision|stage requires/i);
    expect(linkedWorktrees(repo)).toEqual([worktree]);
    execFileSync("git", ["commit", "--allow-empty", "-qm", "unrelated main advance"], { cwd: repo });
    const confirmation = JSON.parse(invoke(["confirm", "--stage=make-decision", "--project=Demo", "--task=decision-task", `--attempt=${result.attempt_ref}`, "--decision=accepted"]));
    expect(linkedWorktrees(repo)).toEqual([worktree]);
    const dirty = join(worktree, "unexpected.txt"); writeFileSync(dirty, "dirty");
    const blocked = spawnSync(process.execPath, [runtime, "accept", "--stage=make-decision", "--project=Demo", "--task=decision-task", `--attempt=${result.attempt_ref}`, `--human-confirmation-ref=${confirmation.ref}`], { cwd: repo, env, encoding: "utf8" });
    expect(blocked.status).not.toBe(0); expect(blocked.stderr).toMatch(/dirty|clean|changed|snapshot/i);
    unlinkSync(dirty);
    expect(JSON.parse(invoke(["accept", "--stage=make-decision", "--project=Demo", "--task=decision-task", `--attempt=${result.attempt_ref}`, `--human-confirmation-ref=${confirmation.ref}`]))).toMatchObject({ stage: "make-decision" });
    expect(linkedWorktrees(repo)).toEqual([worktree]);
    expect(JSON.parse(invoke(["receipt", "--stage=build-spec", "--project=Demo", "--task=decision-task", "--component=spec", `--input=${specPayload}`]))).toMatchObject({ receipt_ref: "receipts/spec.json" });
    expect(String(execFileSync("git", ["status", "--porcelain", "--untracked-files=all"], { cwd: repo }))).toBe(baseStatus);
    expect(String(execFileSync("git", ["status", "--porcelain", "--untracked-files=all"], { cwd: worktree }))).toBe("");
  });

  it("binds full grill-with-docs writes to the published candidate snapshot", () => {
    const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-decision-grill-"))); roots.push(root);
    const repo = join(root, "repo"); mkdirSync(repo);
    execFileSync("git", ["init", "-q"], { cwd: repo });
    execFileSync("git", ["config", "user.name", "Test"], { cwd: repo });
    execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: repo });
    execFileSync("git", ["commit", "--allow-empty", "-qm", "base"], { cwd: repo });
    const taskPath = join(root, "Projects", "Demo", "tasks", "grill-task");
    const task = createTask({ storageRoot: root, taskPath, manifest: { schema_version: "1.0.0", project_name: "Demo", task_id: "grill-task", created_at: new Date().toISOString(), target_repo_root: repo, issue_ids: [], inputs: {} } });
    const env = { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root };
    const inputRoot = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-make-decision."))); roots.push(inputRoot);
    const invoke = (args) => execFileSync(process.execPath, [runtime, ...args], { cwd: repo, env, encoding: "utf8" });
    const prepared = JSON.parse(invoke(["prepare", "--stage=make-decision", "--project=Demo", "--task=grill-task"]));
    prepareOfficialRun(task, "make-decision", "official grill-with-docs execution");
    const contextFile = join(prepared.worktree_root, "CONTEXT.md");
    writeFileSync(contextFile, "# Resolved domain language\n");
    const decisionPayload = join(inputRoot, "decision.json"); writeFileSync(decisionPayload, `${JSON.stringify({ decision_log: "# Decision\n\nGo." })}\n`);
    const decision = JSON.parse(invoke(["receipt", "--stage=make-decision", "--project=Demo", "--task=grill-task", "--component=decision", `--input=${decisionPayload}`]));
    const snapshotTree = captureGitWorktreeSnapshot(prepared.worktree_root).tree;
    publishMakeDecisionContent({
      invoke,
      inputRoot,
      task,
      tree: snapshotTree,
      decisionReceipt: JSON.parse(task.readRecord(decision.receipt_ref)),
    });
    const direction = writeFormalReviewFixture({ task, stage: "make-decision", snapshotTree, reviewTrack: "direction" });
    const detail = writeFormalReviewFixture({ task, stage: "make-decision", snapshotTree, reviewTrack: "detail" });
    registerReviewHead(task, direction.resultRef);
    registerReviewHead(task, detail.resultRef);
    const input = join(inputRoot, "input.json"); writeFileSync(input, `${JSON.stringify({ receipts: { decision: decision.receipt_ref, direction_review: direction.resultRef, detail_review: detail.resultRef } })}\n`);
    const result = JSON.parse(invoke(["run", "--stage=make-decision", "--project=Demo", "--task=grill-task", `--input=${input}`]));
    expect(result.attempt.facts.snapshot_tree).toMatch(/^[a-f0-9]{40}$/);
    writeFileSync(contextFile, "tampered after publication\n");
    const confirmation = JSON.parse(invoke(["confirm", "--stage=make-decision", "--project=Demo", "--task=grill-task", `--attempt=${result.attempt_ref}`, "--decision=accepted"]));
    const blocked = spawnSync(process.execPath, [runtime, "accept", "--stage=make-decision", "--project=Demo", "--task=grill-task", `--attempt=${result.attempt_ref}`, `--human-confirmation-ref=${confirmation.ref}`], { cwd: repo, env, encoding: "utf8" });
    expect(blocked.status).not.toBe(0);
    expect(blocked.stderr).toMatch(/snapshot_tree changed/i);
    writeFileSync(contextFile, "# Resolved domain language\n");
    expect(JSON.parse(invoke(["accept", "--stage=make-decision", "--project=Demo", "--task=grill-task", `--attempt=${result.attempt_ref}`, `--human-confirmation-ref=${confirmation.ref}`]))).toMatchObject({ stage: "make-decision", acceptance_mode: "human" });
    expect(task.readRecord(`results/make-decision/${result.attempt_ref}`)).toContain(result.attempt.facts.snapshot_tree);
    expect(String(execFileSync("git", ["status", "--porcelain", "--untracked-files=all"], { cwd: repo }))).toBe("");
    expect(String(execFileSync("git", ["status", "--porcelain", "--untracked-files=all"], { cwd: prepared.worktree_root }))).toBe("?? CONTEXT.md\n");
  });

  it("rejects removed caller-owned workspace arguments explicitly", () => {
    const result = spawnSync(process.execPath, [runtime, "run", "--stage=make-decision", "--project=Demo", "--task=decision-task", "--worktree-root=/tmp/legacy", "--baseline-commit=deadbeef", "--input=/tmp/input.json"], { cwd: process.cwd(), encoding: "utf8" });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/no longer supported|owns deterministic worktree/i);
  });
});

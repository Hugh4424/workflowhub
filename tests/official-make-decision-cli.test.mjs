import { afterAll, afterEach, describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createTask } from "../core/task-handle.mjs";
import { createTaskKernel } from "../core/task-kernel.mjs";
import { captureGitWorktreeSnapshot } from "../core/git-worktree-snapshot.mjs";
import { createCanonicalSource, createSourceManifest } from "../core/canonical-source.mjs";
import { writeFormalReviewFixture } from "./helpers/formal-review.mjs";

const roots = [];
const packageRoot = realpathSync(new URL("..", import.meta.url).pathname);
const cleanRunnerRoot = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-clean-runner.")));
for (const entry of ["AGENTS.md", "CONSTITUTION.md", "constitution-checklist.md", "package.json", "contracts", "core", "scripts", "schemas", "skills", "workflows"]) {
  cpSync(join(packageRoot, entry), join(cleanRunnerRoot, entry), { recursive: true });
}
symlinkSync(join(packageRoot, "node_modules"), join(cleanRunnerRoot, "node_modules"), "dir");
execFileSync("git", ["init", "-q", "-b", "main"], { cwd: cleanRunnerRoot });
execFileSync("git", ["config", "user.name", "Test"], { cwd: cleanRunnerRoot });
execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: cleanRunnerRoot });
execFileSync("git", ["add", "."], { cwd: cleanRunnerRoot });
execFileSync("git", ["commit", "-qm", "clean runner fixture"], { cwd: cleanRunnerRoot });
const runtime = join(cleanRunnerRoot, "scripts", "stage-runtime.mjs");
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
afterEach(() => { while (roots.length) rmSync(roots.pop(), { recursive: true, force: true }); });
afterAll(() => rmSync(cleanRunnerRoot, { recursive: true, force: true }));

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

function startOfficialDecisionRun({ invoke, inputRoot, task, reason }) {
  const source = createCanonicalSource({
    source_type: "offline_fixture",
    source_id: `${task.manifest.task_id}-make-decision`,
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
  const ledgerInput = join(inputRoot, "requirements-ledger.json");
  writeFileSync(ledgerInput, `${JSON.stringify({
    source_manifest: sourceManifest,
    mappings: {
      R1: {
        decision_ref: { kind: "decision", uri_or_path: "decision://R1", content_hash: "b".repeat(64) },
        artifact_refs: [{ kind: "artifact", uri_or_path: "artifact://R1", content_hash: "c".repeat(64) }],
        acceptance_criteria_refs: [{ kind: "ac", uri_or_path: "ac://R1", content_hash: "d".repeat(64) }],
      },
    },
  })}\n`);
  invoke([
    "start-run", "--stage=make-decision", `--project=${task.manifest.project_name}`,
    `--task=${task.identity.taskId}`, `--reason=${reason}`,
  ]);
  invoke([
    "publish-requirements-ledger", "--stage=make-decision", `--project=${task.manifest.project_name}`,
    `--task=${task.identity.taskId}`, `--input=${ledgerInput}`,
  ]);
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

function makeDecisionPublisher({ invoke, inputRoot, task }) {
  return (name, payload) => {
    const input = join(inputRoot, `${name}.json`);
    writeFileSync(input, `${JSON.stringify(payload)}\n`);
    const published = JSON.parse(invoke([
      "publish-content-evidence", "--stage=make-decision", `--project=${task.manifest.project_name}`,
      `--task=${task.identity.taskId}`, "--kind=interaction-completion.v1", `--input=${input}`,
    ]));
    if (name.startsWith("bad-") || payload.interaction_type === "aggregate") return published;
    const skillName = payload.interaction_type === "talk" ? "talk-with-zhipeng" : "grill-with-docs";
    const invocationKey = payload.interaction_type === "talk"
      ? `talk-${payload.rounds[0].round_number}` : "grill";
    invoke([
      "invoke-stage-skill", "--stage=make-decision", `--project=${task.manifest.project_name}`,
      `--task=${task.identity.taskId}`, `--name=${skillName}`, `--invocation-key=${invocationKey}`,
    ], {
      input: `${JSON.stringify({
        outcome_ref: published.evidence_ref,
        outcome_hash: published.evidence_hash,
        snapshot_tree: payload.workspace_tree,
      })}\n`,
    });
    invoke([
      "publish-content-evidence", "--stage=make-decision", `--project=${task.manifest.project_name}`,
      `--task=${task.identity.taskId}`, "--kind=interaction-completion.v1", `--input=${input}`,
    ]);
    return published;
  };
}

function publishMakeDecisionPrelude({ invoke, inputRoot, task, tree, directionResultRef }) {
  const publish = makeDecisionPublisher({ invoke, inputRoot, task });
  const talkOne = publish("talk-1", interactionTalkPayload(1, tree));
  const researchInput = join(inputRoot, "research-skip.json");
  writeFileSync(researchInput, `${JSON.stringify({
    status: "skipped",
    reason: "The canonical first-round evidence is sufficient.",
    evidence: {
      kind: "stage_content",
      uri_or_path: talkOne.evidence_ref,
      content_hash: talkOne.evidence_hash,
    },
  })}\n`);
  invoke([
    "record-research", "--stage=make-decision", `--project=${task.manifest.project_name}`,
    `--task=${task.identity.taskId}`, `--input=${researchInput}`,
  ]);
  const talkTwo = publish("talk-2", interactionTalkPayload(2, tree));
  registerReviewHead(task, directionResultRef);
  const talkThree = publish("talk-3", interactionTalkPayload(3, tree));
  const grill = publish("grill", interactionGrillPayload(tree));
  return { talks: [talkOne, talkTwo, talkThree], grill };
}

function publishMakeDecisionAggregate({ invoke, inputRoot, task, tree, decisionReceipt, talks, grill }) {
  const publish = makeDecisionPublisher({ invoke, inputRoot, task });
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
  it("records a canonical research skip and permits the next producer", () => {
    const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-decision-research-"))); roots.push(root);
    const repo = join(root, "repo"); mkdirSync(repo);
    execFileSync("git", ["init", "-q"], { cwd: repo });
    execFileSync("git", ["config", "user.name", "Test"], { cwd: repo });
    execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: repo });
    execFileSync("git", ["commit", "--allow-empty", "-qm", "base"], { cwd: repo });
    const taskPath = join(root, "Projects", "Demo", "tasks", "research-task");
    const task = createTask({
      storageRoot: root,
      taskPath,
      manifest: {
        schema_version: "1.0.0",
        project_name: "Demo",
        task_id: "research-task",
        created_at: new Date().toISOString(),
        target_repo_root: repo,
        issue_ids: [],
        inputs: {},
      },
    });
    const inputRoot = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-make-decision-research."))); roots.push(inputRoot);
    const env = { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root };
    const invoke = (args, options = {}) => execFileSync(process.execPath, [runtime, ...args], { cwd: repo, env, encoding: "utf8", ...options });
    const prepared = JSON.parse(invoke(["prepare", "--stage=make-decision", "--project=Demo", "--task=research-task"]));
    invoke(["start-run", "--stage=make-decision", "--project=Demo", "--task=research-task", "--reason=research skip test"]);

    const source = createCanonicalSource({
      source_type: "offline_fixture",
      source_id: "research-task-make-decision",
      revision: "r1",
      requirements: ["R1"],
    });
    const sourceManifest = createSourceManifest({
      canonical_source: source,
      atoms: [{
        requirement_id: "R1",
        text: "The research decision must remain auditable.",
        owner: "product",
        authority: "test",
        derived_from: [],
        supersedes: [],
        status: "accepted",
        stale: false,
      }],
    }).manifest;
    const ledgerInput = join(inputRoot, "ledger.json");
    writeFileSync(ledgerInput, `${JSON.stringify({
      source_manifest: sourceManifest,
      mappings: {
        R1: {
          decision_ref: { kind: "decision", uri_or_path: "decision://R1", content_hash: "b".repeat(64) },
          artifact_refs: [{ kind: "artifact", uri_or_path: "artifact://R1", content_hash: "c".repeat(64) }],
          acceptance_criteria_refs: [{ kind: "ac", uri_or_path: "ac://R1", content_hash: "d".repeat(64) }],
        },
      },
    })}\n`);
    invoke(["publish-requirements-ledger", "--stage=make-decision", "--project=Demo", "--task=research-task", `--input=${ledgerInput}`]);

    const tree = captureGitWorktreeSnapshot(prepared.worktree_root).tree;
    const talkOne = makeDecisionPublisher({ invoke, inputRoot, task })(
      "talk-1",
      interactionTalkPayload(1, tree),
    );
    const researchInput = join(inputRoot, "research.json");
    const research = {
      status: "skipped",
      reason: "The canonical first-round evidence is sufficient.",
      evidence: {
        kind: "stage_content",
        uri_or_path: talkOne.evidence_ref,
        content_hash: talkOne.evidence_hash,
      },
    };
    writeFileSync(researchInput, `${JSON.stringify(research)}\n`);
    expect(JSON.parse(invoke([
      "record-research", "--stage=make-decision", "--project=Demo", "--task=research-task", `--input=${researchInput}`,
    ]))).toMatchObject({ idempotent: false });
    expect(JSON.parse(invoke([
      "record-research", "--stage=make-decision", "--project=Demo", "--task=research-task", `--input=${researchInput}`,
    ]))).toMatchObject({ idempotent: true });

    const badResearchInput = join(inputRoot, "research-bad-hash.json");
    writeFileSync(badResearchInput, `${JSON.stringify({
      ...research,
      evidence: { ...research.evidence, content_hash: "0".repeat(64) },
    })}\n`);
    const badHash = spawnSync(process.execPath, [
      runtime, "record-research", "--stage=make-decision", "--project=Demo", "--task=research-task",
      `--input=${badResearchInput}`,
    ], { cwd: repo, env, encoding: "utf8" });
    expect(badHash.status).not.toBe(0);
    expect(badHash.stderr).toMatch(/(?:content_hash|evidence hash) mismatch/);

    const talkTwoInput = join(inputRoot, "talk-2.json");
    writeFileSync(talkTwoInput, `${JSON.stringify(interactionTalkPayload(2, tree))}\n`);
    expect(JSON.parse(invoke([
      "publish-content-evidence", "--stage=make-decision", "--project=Demo", "--task=research-task",
      "--kind=interaction-completion.v1", `--input=${talkTwoInput}`,
    ]))).toMatchObject({ kind: "interaction-completion.v1" });
    const researchExit = task.readRecord("journal.jsonl").trim().split("\n").map(JSON.parse)
      .find((event) => event.event_type === "step_exit" && event.step_id === 4);
    expect(researchExit).toMatchObject({
      terminal_status: "skipped",
      skip_reason: research.reason,
      authorized_by: "stage-runtime:record-research",
    });
  });

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
    const inputRoot = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-make-decision."))); roots.push(inputRoot);
    const env = { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root };
    const invoke = (args, options = {}) => execFileSync(process.execPath, [runtime, ...args], { cwd: repo, env, encoding: "utf8", ...options });
    const prepared = JSON.parse(invoke(["prepare", "--stage=make-decision", "--project=Demo", "--task=aggregate-decision-task"]));
    startOfficialDecisionRun({ invoke, inputRoot, task, reason: "aggregate decision binding rejection" });
    const tree = captureGitWorktreeSnapshot(prepared.worktree_root).tree;
    const direction = writeFormalReviewFixture({ task, stage: "make-decision", snapshotTree: tree, reviewTrack: "direction" });
    const detail = writeFormalReviewFixture({ task, stage: "make-decision", snapshotTree: tree, reviewTrack: "detail" });
    const interactions = publishMakeDecisionPrelude({
      invoke, inputRoot, task, tree, directionResultRef: direction.resultRef,
    });
    const decisionPayload = join(inputRoot, "decision.json");
    writeFileSync(decisionPayload, `${JSON.stringify({ decision_log: "# Official decision\n\nShip B." })}\n`);
    const decision = JSON.parse(invoke([
      "receipt", "--stage=make-decision", "--project=Demo", "--task=aggregate-decision-task",
      "--component=decision", `--input=${decisionPayload}`,
    ]));
    registerReviewHead(task, detail.resultRef);
    const officialDecision = JSON.parse(task.readRecord(decision.receipt_ref));
    const otherDecision = "# Other canonical decision\n\nShip A.";
    const otherHash = sha256(otherDecision);
    const otherRef = `receipts/decision-log/${otherHash}.md`;
    createTaskKernel(task).publishCanonicalRecord(otherRef, otherDecision);
    publishMakeDecisionAggregate({
      invoke,
      inputRoot,
      task,
      tree,
      decisionReceipt: { decision_ref: otherRef, decision_hash: otherHash },
      ...interactions,
    });
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
    expect(result.stderr).toMatch(/interaction aggregate.*current canonical decision receipt|interaction aggregate decision binding differs/i);
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
    const inputRoot = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-make-decision."))); roots.push(inputRoot);
    const missingDecisionLogPayload = join(inputRoot, "decision-missing-log.json"); writeFileSync(missingDecisionLogPayload, `${JSON.stringify({ content: "go" })}\n`);
    const decisionPayload = join(inputRoot, "decision.json"); writeFileSync(decisionPayload, `${JSON.stringify({ decision_log: "# Decision\n\nGo." })}\n`);
    const env = { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root };
    const invoke = (args, options = {}) => execFileSync(process.execPath, [runtime, ...args], { cwd: repo, env, encoding: "utf8", ...options });
    expect(linkedWorktrees(repo)).toEqual([]);
    const prepared = JSON.parse(invoke(["prepare", "--stage=make-decision", "--project=Demo", "--task=decision-task"]));
    startOfficialDecisionRun({ invoke, inputRoot, task, reason: "official decision CLI execution" });
    const snapshotTree = captureGitWorktreeSnapshot(prepared.worktree_root).tree;
    const direction = writeFormalReviewFixture({ task, stage: "make-decision", snapshotTree, reviewTrack: "direction" });
    const detail = writeFormalReviewFixture({ task, stage: "make-decision", snapshotTree, reviewTrack: "detail" });
    const interactions = publishMakeDecisionPrelude({
      invoke, inputRoot, task, tree: snapshotTree, directionResultRef: direction.resultRef,
    });
    const missingDecisionLog = spawnSync(process.execPath, [runtime, "receipt", "--stage=make-decision", "--project=Demo", "--task=decision-task", "--component=decision", `--input=${missingDecisionLogPayload}`], { cwd: repo, env, encoding: "utf8" });
    expect(missingDecisionLog.status).not.toBe(0);
    expect(missingDecisionLog.stderr).toMatch(/decision_log/i);
    const decision = JSON.parse(invoke(["receipt", "--stage=make-decision", "--project=Demo", "--task=decision-task", "--component=decision", `--input=${decisionPayload}`]));
    expect(decision.receipt_ref).toBe("receipts/decision.json");
    registerReviewHead(task, detail.resultRef);
    const input = join(inputRoot, "input.json"); writeFileSync(input, `${JSON.stringify({ receipts: { decision: "receipts/decision.json", direction_review: direction.resultRef, detail_review: detail.resultRef } })}\n`);
    expect(linkedWorktrees(repo)).toEqual([realpathSync(prepared.worktree_root)]);
    const badInput = spawnSync(process.execPath, [runtime, "run", "--stage=make-decision", "--project=Demo", "--task=decision-task", `--input=${join(inputRoot, "missing.json")}`], { cwd: repo, env, encoding: "utf8" });
    expect(badInput.status).not.toBe(0);
    expect(badInput.stderr).toMatch(/ENOENT|missing\.json/i);
    expect(linkedWorktrees(repo)).toEqual([realpathSync(prepared.worktree_root)]);
    const decisionRaw = task.readRecord(decision.receipt_ref);
    const decisionReceipt = JSON.parse(decisionRaw);
    expect(task.readRecord(decisionReceipt.decision_ref)).toBe("# Decision\n\nGo.");
    publishMakeDecisionAggregate({
      invoke,
      inputRoot,
      task,
      tree: snapshotTree,
      decisionReceipt,
      ...interactions,
    });
    const result = JSON.parse(invoke(["run", "--stage=make-decision", "--project=Demo", "--task=decision-task", `--input=${input}`]));
    expect(result.attempt.facts.audit_through_step_id).toBe(10);
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
    expect(beforeAccept.status).toBe(0);
    expect(linkedWorktrees(repo)).toEqual([worktree]);
    execFileSync("git", ["commit", "--allow-empty", "-qm", "unrelated main advance"], { cwd: repo });
    const confirmation = JSON.parse(invoke(["confirm", "--stage=make-decision", "--project=Demo", "--task=decision-task", `--attempt=${result.attempt_ref}`, "--decision=accepted"]));
    expect(task.readRecord("journal.jsonl")).toContain('"step_id":11');
    expect(linkedWorktrees(repo)).toEqual([worktree]);
    const dirty = join(worktree, "unexpected.txt"); writeFileSync(dirty, "dirty");
    const blocked = spawnSync(process.execPath, [runtime, "accept", "--stage=make-decision", "--project=Demo", "--task=decision-task", `--attempt=${result.attempt_ref}`, `--human-confirmation-ref=${confirmation.ref}`], { cwd: repo, env, encoding: "utf8" });
    expect(blocked.status).not.toBe(0); expect(blocked.stderr).toMatch(/dirty|clean|changed|snapshot/i);
    unlinkSync(dirty);
    expect(JSON.parse(invoke(["accept", "--stage=make-decision", "--project=Demo", "--task=decision-task", `--attempt=${result.attempt_ref}`, `--human-confirmation-ref=${confirmation.ref}`]))).toMatchObject({
      stage: "make-decision",
      full_audit_verdict: "pass",
    });
    expect(task.readRecord("journal.jsonl")).toContain('"step_id":12');
    expect(linkedWorktrees(repo)).toEqual([worktree]);
    expect(JSON.parse(invoke(["receipt", "--stage=build-spec", "--project=Demo", "--task=decision-task", "--component=spec", `--input=${specPayload}`]))).toMatchObject({ receipt_ref: "receipts/spec.json" });
    expect(String(execFileSync("git", ["status", "--porcelain", "--untracked-files=all"], { cwd: repo }))).toBe(baseStatus);
    expect(String(execFileSync("git", ["status", "--porcelain", "--untracked-files=all"], { cwd: worktree }))).toBe("?? specs/decision-task/decision-log.md\n");
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
    const invoke = (args, options = {}) => execFileSync(process.execPath, [runtime, ...args], { cwd: repo, env, encoding: "utf8", ...options });
    const prepared = JSON.parse(invoke(["prepare", "--stage=make-decision", "--project=Demo", "--task=grill-task"]));
    startOfficialDecisionRun({ invoke, inputRoot, task, reason: "official grill-with-docs execution" });
    const contextFile = join(prepared.worktree_root, "CONTEXT.md");
    writeFileSync(contextFile, "# Resolved domain language\n");
    const snapshotTree = captureGitWorktreeSnapshot(prepared.worktree_root).tree;
    const direction = writeFormalReviewFixture({ task, stage: "make-decision", snapshotTree, reviewTrack: "direction" });
    const detail = writeFormalReviewFixture({ task, stage: "make-decision", snapshotTree, reviewTrack: "detail" });
    const interactions = publishMakeDecisionPrelude({
      invoke, inputRoot, task, tree: snapshotTree, directionResultRef: direction.resultRef,
    });
    const decisionPayload = join(inputRoot, "decision.json"); writeFileSync(decisionPayload, `${JSON.stringify({ decision_log: "# Decision\n\nGo." })}\n`);
    const decision = JSON.parse(invoke(["receipt", "--stage=make-decision", "--project=Demo", "--task=grill-task", "--component=decision", `--input=${decisionPayload}`]));
    registerReviewHead(task, detail.resultRef);
    publishMakeDecisionAggregate({
      invoke,
      inputRoot,
      task,
      tree: snapshotTree,
      decisionReceipt: JSON.parse(task.readRecord(decision.receipt_ref)),
      ...interactions,
    });
    const input = join(inputRoot, "input.json"); writeFileSync(input, `${JSON.stringify({ receipts: { decision: decision.receipt_ref, direction_review: direction.resultRef, detail_review: detail.resultRef } })}\n`);
    const result = JSON.parse(invoke(["run", "--stage=make-decision", "--project=Demo", "--task=grill-task", `--input=${input}`]));
    expect(result.attempt.facts.snapshot_tree).toMatch(/^[a-f0-9]{40}$/);
    writeFileSync(contextFile, "tampered after publication\n");
    const confirmation = JSON.parse(invoke(["confirm", "--stage=make-decision", "--project=Demo", "--task=grill-task", `--attempt=${result.attempt_ref}`, "--decision=accepted"]));
    const blocked = spawnSync(process.execPath, [runtime, "accept", "--stage=make-decision", "--project=Demo", "--task=grill-task", `--attempt=${result.attempt_ref}`, `--human-confirmation-ref=${confirmation.ref}`], { cwd: repo, env, encoding: "utf8" });
    expect(blocked.status).not.toBe(0);
    expect(blocked.stderr).toMatch(/snapshot_tree changed|stage content evidence snapshot mismatch/i);
    writeFileSync(contextFile, "# Resolved domain language\n");
    expect(JSON.parse(invoke(["accept", "--stage=make-decision", "--project=Demo", "--task=grill-task", `--attempt=${result.attempt_ref}`, `--human-confirmation-ref=${confirmation.ref}`]))).toMatchObject({ stage: "make-decision", acceptance_mode: "human" });
    expect(task.readRecord(`results/make-decision/${result.attempt_ref}`)).toContain(result.attempt.facts.snapshot_tree);
    expect(String(execFileSync("git", ["status", "--porcelain", "--untracked-files=all"], { cwd: repo }))).toBe("");
    expect(String(execFileSync("git", ["status", "--porcelain", "--untracked-files=all"], { cwd: prepared.worktree_root }))).toBe("?? CONTEXT.md\n?? specs/grill-task/decision-log.md\n");
  });

  it("rejects removed caller-owned workspace arguments explicitly", () => {
    const result = spawnSync(process.execPath, [runtime, "run", "--stage=make-decision", "--project=Demo", "--task=decision-task", "--worktree-root=/tmp/legacy", "--baseline-commit=deadbeef", "--input=/tmp/input.json"], { cwd: process.cwd(), encoding: "utf8" });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/no longer supported|owns deterministic worktree/i);
  });

  it("rejects public make-decision journal mutation commands", () => {
    for (const command of ["record-step-entry", "record-step-exit"]) {
      const result = spawnSync(process.execPath, [
        runtime, command, "--stage=make-decision", "--project=Demo", "--task=decision-task", "--input=/tmp/forbidden.json",
      ], { cwd: process.cwd(), encoding: "utf8" });
      expect(result.status).not.toBe(0);
      expect(result.stderr).toMatch(/runtime-owned|forbidden/i);
    }
  });
});

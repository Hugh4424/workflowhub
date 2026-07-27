import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeAll, describe, expect, it } from "vitest";

import { writeCanonicalAuditSummary } from "../core/canonical-receipt-writer.mjs";
import { createCanonicalSource, createSourceManifest } from "../core/canonical-source.mjs";
import { createTask } from "../core/task-handle.mjs";
import { createTaskKernel } from "../core/task-kernel.mjs";
import { captureGitWorktreeSnapshot } from "../core/git-worktree-snapshot.mjs";
import { loadStageManifest } from "../core/step-manifest.mjs";
import { openAcceptedWorkspace, prepareTaskWorkspace } from "../core/workspace.mjs";

const roots = [];
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const git = (root, args) => execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();

let createStageContentEvidenceWriter;
let verifyStageContentEvidence;
let readLatestStageContentEvidence;
let moduleLoadError;

beforeAll(async () => {
  try {
    ({
      createStageContentEvidenceWriter,
      verifyStageContentEvidence,
      readLatestStageContentEvidence,
    } = await import("../core/stage-content-evidence.mjs"));
  } catch (error) {
    moduleLoadError = error;
  }
});

afterEach(() => {
  while (roots.length > 0) rmSync(roots.pop(), { recursive: true, force: true });
});

function requireApi() {
  expect(moduleLoadError, "core/stage-content-evidence.mjs must load").toBeUndefined();
  expect(createStageContentEvidenceWriter).toBeTypeOf("function");
  expect(verifyStageContentEvidence).toBeTypeOf("function");
  expect(readLatestStageContentEvidence).toBeTypeOf("function");
}

function talkPayload(roundNumber, workspaceTree, {
  selected = "A",
  zeroQuestion = false,
} = {}) {
  const questions = zeroQuestion ? [] : [{
    question_id: `q-${roundNumber}`,
    question_number: 1,
    card_hash: sha256(`card-${roundNumber}`),
    ask: { ref: `host-message://ask/round-${roundNumber}-question-1`, hash: sha256(`ask-${roundNumber}`) },
    reply: { ref: `host-message://reply/round-${roundNumber}-question-1`, hash: sha256(`reply-${roundNumber}`) },
    rerank: { ref: `host-message://rerank/round-${roundNumber}-question-1`, hash: sha256(`rerank-${roundNumber}`) },
    selected,
  }];
  const candidateQueue = zeroQuestion
    ? [{
        item_id: `candidate-${roundNumber}`,
        impact: "medium",
        status: "evidence-resolved",
        reason: `round ${roundNumber} input already resolves this decision axis`,
      }]
    : [{
        item_id: `candidate-${roundNumber}`,
        impact: "high",
        status: "answered",
        reason: `round ${roundNumber} host-visible reply resolved this decision axis`,
      }];
  return {
    interaction_type: "talk",
    rounds: [{
      round_number: roundNumber,
      candidate_queue: candidateQueue,
      questions,
      questions_already_asked: questions.length,
      open_direction_changing_questions: 0,
      current_total: questions.length,
      end_reason: zeroQuestion
        ? `round ${roundNumber} candidate queue was factually resolved without a question`
        : `round ${roundNumber} host-visible reply resolved the final direction-changing question`,
      zero_question_reason: zeroQuestion ? `round ${roundNumber} queue was empty after factual re-ranking` : null,
    }],
    grill: null,
    workspace_tree: workspaceTree,
  };
}

function grillPayload(workspaceTree) {
  return {
    interaction_type: "grill",
    rounds: [],
    grill: {
      context: { status: "no-change", reason: "Existing domain language remains accurate" },
      adr: { status: "not-needed", reason: "No durable architecture decision changed" },
      conflicts: { status: "none", reason: "No document conflict was found" },
      file_references: ["CONTEXT.md"],
      exit_checks: {
        context_checked: true,
        adr_checked: true,
        conflicts_checked: true,
        file_references_checked: true,
      },
    },
    workspace_tree: workspaceTree,
  };
}

function evidenceNamespaceSnapshot(task) {
  const root = join(task.taskPath, "evidence", "stage-content");
  if (!existsSync(root)) return [];
  const files = [];
  const visit = (directory, prefix = "") => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
      const path = join(directory, entry.name);
      if (entry.isDirectory()) visit(path, relative);
      else files.push([relative, readFileSync(path, "utf8")]);
    }
  };
  visit(root);
  return files;
}

function prepareOfficialRun(kernel, taskId) {
  const stage = "make-decision";
  const source = createCanonicalSource({
    source_type: "offline_fixture",
    source_id: `${taskId}-${stage}`,
    revision: "r1",
    requirements: ["R1"],
  });
  const sourceManifest = createSourceManifest({
    canonical_source: source,
    atoms: [{
      requirement_id: "R1",
      text: "The content-evidence writer execution must remain auditable.",
      owner: "product",
      authority: "test",
      derived_from: [],
      supersedes: [],
      status: "accepted",
      stale: false,
    }],
  }).manifest;
  const run = kernel.startStageRun(stage, { reason: "content-evidence writer fixture" });
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
  return run.run.workflow_run_id;
}

function fixture(taskId = "stage-content-evidence") {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-stage-content-")));
  roots.push(root);
  const repo = join(root, "repo");
  mkdirSync(repo);
  git(repo, ["init", "-q"]);
  git(repo, ["config", "user.name", "Test"]);
  git(repo, ["config", "user.email", "test@example.com"]);
  writeFileSync(join(repo, "README.md"), "base\n");
  git(repo, ["add", "README.md"]);
  git(repo, ["commit", "-qm", "base"]);

  const task = createTask({
    storageRoot: root,
    manifest: {
      schema_version: "1.0.0",
      project_name: "Demo",
      task_id: taskId,
      created_at: "2026-07-26T00:00:00.000Z",
      target_repo_root: repo,
      issue_ids: [],
      inputs: {},
    },
  });
  const candidate = prepareTaskWorkspace(task);
  const kernel = createTaskKernel(task, { candidateWorkspace: candidate });
  const setupRunId = prepareOfficialRun(kernel, taskId);
  const setupWriter = createStageContentEvidenceWriter({
    task,
    workspace: candidate,
    stage: "make-decision",
    workflowRunId: setupRunId,
    now: () => "2026-07-26T00:00:30.000Z",
  });
  const setupTree = candidate.captureSnapshot().tree;
  const setupDecisionLog = "# Fixture decision\n";
  const setupDecisionHash = sha256(setupDecisionLog);
  const setupDecisionRef = `receipts/decision-log/${setupDecisionHash}.md`;
  kernel.publishCanonicalRecord(setupDecisionRef, setupDecisionLog);
  const setupTalks = [1, 2, 3].map((roundNumber) => setupWriter.publish({
    kind: "interaction-completion.v1",
    payload: talkPayload(roundNumber, setupTree, { zeroQuestion: roundNumber !== 1 }),
  }));
  const setupGrill = setupWriter.publish({
    kind: "interaction-completion.v1",
    payload: grillPayload(setupTree),
  });
  setupWriter.publish({
    kind: "interaction-completion.v1",
    payload: {
      interaction_type: "aggregate",
      rounds: setupTalks.map(({ ref, hash }) => ({ ref, hash })),
      grill: { ref: setupGrill.ref, hash: setupGrill.hash },
      workspace_tree: setupTree,
      decision_ref: setupDecisionRef,
      decision_hash: setupDecisionHash,
    },
  });
  setupWriter.publish({
    kind: "decision-coverage-audit.v1",
    payload: {
      decision_log_ref: setupDecisionRef,
      decision_log_hash: setupDecisionHash,
      items: [],
      summary: { covered: 0, accepted_omission: 0, missing: 0 },
    },
  });
  const audit = writeCanonicalAuditSummary({
    task,
    workspace: candidate,
    stage: "make-decision",
  });
  const attempt = kernel.publishAttempt("make-decision", {
    facts: {
      worktree_root: candidate.worktreeRoot,
      baseline_commit: candidate.baselineCommit,
      snapshot_tree: candidate.captureSnapshot().tree,
      audit_contract_version: audit.audit_contract_version,
      audit_summary_ref: audit.audit_summary_ref,
      audit_summary_hash: audit.audit_summary_hash,
      audit_verdict: audit.audit_verdict,
      content_evidence_refs: audit.content_evidence_refs,
    },
  });
  const confirmation = kernel.confirmAttempt("make-decision", attempt.attempt_ref, "accepted");
  kernel.acceptAttempt("make-decision", attempt.attempt_ref, confirmation.ref);
  const workspace = openAcceptedWorkspace(task, kernel.readAccepted("make-decision"));
  const nextRun = kernel.startStageRun("make-decision", { reason: "content-evidence test run" });
  return {
    root, task, workspace, workflowRunId: nextRun.run.workflow_run_id,
    decisionRef: setupDecisionRef, decisionHash: setupDecisionHash,
  };
}

function completionPayload(overrides = {}) {
  return {
    schema_version: "stage-completion-facts.v1",
    result: "completed",
    objective: "Complete the stage",
    approach: "Use the official workflow",
    effect: "Stage facts are available",
    verification: { conclusion: "passed", limits: [] },
    artifacts: [],
    review: {
      conclusion: "passed",
      status: "semantic",
      providers: ["fixture/provider"],
      duration_ms: null,
      tokens: null,
      findings: [],
      refs: [],
    },
    missing_items: [],
    risks: [],
    dependencies: [],
    recovery_conditions: [],
    downstream_read_rule: "Read the accepted stage record",
    next_owner: "build-spec",
    user_action: "none",
    ...overrides,
  };
}

function writerFor(state, overrides = {}) {
  return createStageContentEvidenceWriter({
    task: state.task,
    workspace: state.workspace,
    stage: "make-decision",
    workflowRunId: state.workflowRunId,
    now: () => "2026-07-26T01:02:03.000Z",
    ...overrides,
  });
}

async function invoke(operation) {
  return operation();
}

describe("stage-content-evidence.v1 controlled writer", () => {
  it("rejects an unknown kind without creating an evidence namespace", async () => {
    requireApi();
    const state = fixture("unknown-kind");
    const before = evidenceNamespaceSnapshot(state.task);

    await expect(invoke(() => writerFor(state).publish({
      kind: "not-a-stage-content-kind.v1",
      payload: completionPayload(),
    }))).rejects.toThrow(/unknown|allowlist|kind/i);
    expect(evidenceNamespaceSnapshot(state.task)).toEqual(before);
  });

  it.each([
    ["constructor task identity", { task_id: "forged-task" }],
    ["constructor root", { root: "/tmp/forged-root" }],
    ["constructor task path", { taskPath: "/tmp/forged-task" }],
    ["constructor cwd", { cwd: "/tmp/forged-cwd" }],
  ])("rejects caller-supplied %s", async (_label, injected) => {
    requireApi();
    const state = fixture(`constructor-injection-${roots.length}`);
    const before = evidenceNamespaceSnapshot(state.task);

    await expect(invoke(() => writerFor(state, injected))).rejects.toThrow(
      /caller|unknown|identity|root|task.?path|cwd|forbidden/i,
    );
    expect(evidenceNamespaceSnapshot(state.task)).toEqual(before);
  });

  it.each([
    ["task_id", "forged-task"],
    ["stage", "verify-code"],
    ["workflow_run_id", "forged-run"],
    ["producer", { stage: "verify-code", component: "forged" }],
    ["ref", "evidence/forged.json"],
    ["hash", "a".repeat(64)],
    ["snapshot_tree", "b".repeat(40)],
    ["root", "/tmp/forged-root"],
    ["task_path", "/tmp/forged-task"],
    ["cwd", "/tmp/forged-cwd"],
  ])("rejects caller-supplied publish field %s before writing", async (key, value) => {
    requireApi();
    const state = fixture(`publish-injection-${key.replaceAll("_", "-")}`);
    const before = evidenceNamespaceSnapshot(state.task);

    await expect(invoke(() => writerFor(state).publish({
      kind: "stage-completion-facts.v1",
      payload: completionPayload(),
      [key]: value,
    }))).rejects.toThrow(/caller|unknown|identity|binding|root|task.?path|cwd|forbidden/i);
    expect(evidenceNamespaceSnapshot(state.task)).toEqual(before);
  });

  it.each([
    ["task_id", "forged-task"],
    ["stage", "verify-code"],
    ["workflow_run_id", "forged-run"],
    ["producer", { component: "forged" }],
    ["ref", "evidence/forged.json"],
    ["hash", "a".repeat(64)],
    ["snapshot_tree", "c".repeat(40)],
    ["root", "/tmp/forged-root"],
    ["task_path", "/tmp/forged-task"],
    ["cwd", "/tmp/forged-cwd"],
  ])("rejects identity or path field %s hidden inside payload", async (key, value) => {
    requireApi();
    const state = fixture(`payload-injection-${key.replaceAll("_", "-")}`);
    const before = evidenceNamespaceSnapshot(state.task);

    await expect(invoke(() => writerFor(state).publish({
      kind: "stage-completion-facts.v1",
      payload: completionPayload({ [key]: value }),
    }))).rejects.toThrow(/caller|identity|binding|root|task.?path|cwd|forbidden/i);
    expect(evidenceNamespaceSnapshot(state.task)).toEqual(before);
  });

  it("allows the schema-declared decision_location.ref only for decision coverage", async () => {
    requireApi();
    const state = fixture("decision-coverage-location");
    const published = await invoke(() => writerFor(state).publish({
      kind: "decision-coverage-audit.v1",
      payload: {
        decision_log_ref: "receipts/decision.json",
        decision_log_hash: "a".repeat(64),
        items: [{
          source_item_ref: "requirements/R1",
          source_item_hash: "b".repeat(64),
          coverage_status: "covered",
          decision_location: {
            kind: "main",
            ref: "receipts/decision.json",
            entry_index: 0,
          },
        }],
        summary: { covered: 1, accepted_omission: 0, missing: 0 },
      },
    }));

    expect(published.ref).toMatch(/decision-coverage-audit\.v1\.json$/);
  });

  it("injects authenticated identity and rejects wrong hash, run, stage, or tree on read", async () => {
    requireApi();
    const state = fixture("verify-bindings");
    const snapshot = captureGitWorktreeSnapshot(state.workspace.worktreeRoot);
    const published = await invoke(() => writerFor(state).publish({
      kind: "stage-completion-facts.v1",
      payload: completionPayload(),
    }));

    expect(published.value).toMatchObject({
      schema_version: "stage-content-evidence.v1",
      kind: "stage-completion-facts.v1",
      task_id: state.task.identity.taskId,
      stage: "make-decision",
      workflow_run_id: state.workflowRunId,
      snapshot_head: snapshot.head,
      snapshot_tree: snapshot.tree,
    });
    expect(published.value.producer).toEqual(expect.any(Object));
    expect(published.ref).toMatch(/^evidence\/[A-Za-z0-9._/-]+\.json$/);
    expect(published.hash).toBe(sha256(state.task.readRecord(published.ref)));

    const verify = (overrides = {}) => invoke(() => verifyStageContentEvidence({
      task: state.task,
      ref: published.ref,
      hash: published.hash,
      expectedStage: "make-decision",
      expectedRunId: state.workflowRunId,
      expectedTree: snapshot.tree,
      ...overrides,
    }));
    await expect(verify()).resolves.toEqual(published.value);
    await expect(verify({ hash: "0".repeat(64) })).rejects.toThrow(/hash|integrity/i);
    await expect(verify({ expectedStage: "build-spec" })).rejects.toThrow(/stage|binding/i);
    await expect(verify({ expectedRunId: "other-run" })).rejects.toThrow(/run|binding/i);
    await expect(verify({ expectedTree: "1".repeat(40) })).rejects.toThrow(/tree|snapshot|binding/i);
  });

  it("keeps the first create-only record when the same run/kind is published with different content", async () => {
    requireApi();
    const state = fixture("duplicate-conflict");
    const writer = writerFor(state);
    const first = await invoke(() => writer.publish({
      kind: "stage-completion-facts.v1",
      payload: completionPayload(),
    }));
    const firstRaw = state.task.readRecord(first.ref);

    await expect(invoke(() => writer.publish({
      kind: "stage-completion-facts.v1",
      payload: completionPayload({ user_action: "approve" }),
    }))).rejects.toThrow(/already|conflict|duplicate|create.?only/i);
    expect(state.task.readRecord(first.ref)).toBe(firstRaw);
  });

  it("publishes trusted post-interaction revisions with exact lineage and latest-pointer CAS", async () => {
    requireApi();
    const state = fixture("content-revision");
    const writer = writerFor(state);
    const first = await invoke(() => writer.publish({
      kind: "stage-completion-facts.v1",
      payload: completionPayload(),
    }));
    const second = await invoke(() => writer.publish({
      kind: "stage-completion-facts.v1",
      revision: 2,
      payload: completionPayload({ user_action: "approve" }),
    }));
    expect(second.ref).toMatch(/stage-completion-facts\.v1\.revision-0002\.json$/);
    expect(second.value.revision).toEqual({ number: 2, previous_ref: first.ref, previous_hash: first.hash });
    expect(readLatestStageContentEvidence({
      task: state.task, stage: "make-decision", workflowRunId: state.workflowRunId,
      kind: "stage-completion-facts.v1",
    })).toMatchObject({ ref: second.ref, hash: second.hash });
    await expect(invoke(() => writer.publish({
      kind: "stage-completion-facts.v1",
      revision: 2,
      payload: completionPayload({ user_action: "stale" }),
    }))).rejects.toThrow(/CAS|stale/i);
  });

  it("never permits talk or grill revision and never discovers latest by scanning revisions", async () => {
    requireApi();
    const state = fixture("interaction-revision-forbidden");
    const writer = writerFor(state);
    const tree = captureGitWorktreeSnapshot(state.workspace.worktreeRoot).tree;
    const talk = talkPayload(1, tree);
    await invoke(() => writer.publish({ kind: "interaction-completion.v1", payload: talk }));
    await expect(invoke(() => writer.publish({
      kind: "interaction-completion.v1", revision: 2, payload: talk,
    }))).rejects.toThrow(/create-only|cannot be revised|forbidden/i);
    expect(readLatestStageContentEvidence({
      task: state.task, stage: "make-decision", workflowRunId: state.workflowRunId,
      kind: "interaction-completion.v1",
    })).toBeUndefined();
  });

  it("accepts canonical ref/hash bindings inside a revised decision coverage payload", async () => {
    requireApi();
    const state = fixture("coverage-revision");
    const writer = writerFor(state);
    const coverage = (hash) => ({
      decision_log_ref: "receipts/decision-log/example.md",
      decision_log_hash: hash,
      items: [{
        source_item_ref: "evidence/source.json",
        source_item_hash: hash,
        coverage_status: "covered",
        decision_location: { kind: "main", ref: "receipts/decision-log/example.md", entry_index: 0 },
      }],
      summary: { covered: 1, accepted_omission: 0, missing: 0 },
    });
    await invoke(() => writer.publish({
      kind: "decision-coverage-audit.v1", payload: coverage("a".repeat(64)),
    }));
    const revised = await invoke(() => writer.publish({
      kind: "decision-coverage-audit.v1", revision: 2, payload: coverage("b".repeat(64)),
    }));
    expect(revised.ref).toMatch(/decision-coverage-audit\.v1\.revision-0002\.json$/);
  });

  it("publishes three talk rounds and the aggregate under separate writer-derived refs", async () => {
    requireApi();
    const state = fixture("interaction-components");
    const writer = writerFor(state);
    const preGrillTree = captureGitWorktreeSnapshot(state.workspace.worktreeRoot).tree;
    const interaction = (roundNumber, selected) => talkPayload(roundNumber, preGrillTree, { selected });

    const round1 = await invoke(() => writer.publish({
      kind: "interaction-completion.v1",
      payload: interaction(1, "A"),
    }));
    const repeated = await invoke(() => writer.publish({
      kind: "interaction-completion.v1",
      payload: interaction(1, "A"),
    }));
    const round2 = await invoke(() => writer.publish({
      kind: "interaction-completion.v1",
      payload: interaction(2, "B"),
    }));
    const round3 = await invoke(() => writer.publish({
      kind: "interaction-completion.v1",
      payload: interaction(3, "C"),
    }));
    writeFileSync(join(state.workspace.worktreeRoot, "CONTEXT.md"), "# Post-grill context\n");
    const postGrillTree = captureGitWorktreeSnapshot(state.workspace.worktreeRoot).tree;
    const grill = await invoke(() => writer.publish({
      kind: "interaction-completion.v1",
      payload: grillPayload(postGrillTree),
    }));
    const aggregate = await invoke(() => writer.publish({
      kind: "interaction-completion.v1",
      payload: {
        interaction_type: "aggregate",
        rounds: [
          { ref: round1.ref, hash: round1.hash },
          { ref: round2.ref, hash: round2.hash },
          { ref: round3.ref, hash: round3.hash },
        ],
        grill: { ref: grill.ref, hash: grill.hash },
        workspace_tree: postGrillTree,
        decision_ref: state.decisionRef,
        decision_hash: state.decisionHash,
      },
    }));

    expect(repeated.ref).toBe(round1.ref);
    expect(new Set([round1.ref, round2.ref, round3.ref, grill.ref, aggregate.ref]).size).toBe(5);
    expect(round1.ref).toMatch(/interaction-completion\.talk-0001\.json$/);
    expect(round2.ref).toMatch(/interaction-completion\.talk-0002\.json$/);
    expect(round3.ref).toMatch(/interaction-completion\.talk-0003\.json$/);
    expect(grill.ref).toMatch(/interaction-completion\.grill\.json$/);
    expect(aggregate.ref).toMatch(/interaction-completion\.aggregate\.json$/);
    expect(round1.value.snapshot_tree).toBe(preGrillTree);
    expect(grill.value.snapshot_tree).toBe(postGrillTree);
    expect(postGrillTree).not.toBe(preGrillTree);
  });

  it("rejects mixed pre-grill talk trees and a grill that does not bind the final tree", async () => {
    requireApi();
    const state = fixture("interaction-tree-lineage-negative");
    const writer = writerFor(state);
    const preGrillTree = captureGitWorktreeSnapshot(state.workspace.worktreeRoot).tree;
    const round1 = await invoke(() => writer.publish({
      kind: "interaction-completion.v1",
      payload: talkPayload(1, preGrillTree),
    }));
    writeFileSync(join(state.workspace.worktreeRoot, "CONTEXT.md"), "# Changed by grill\n");
    const postGrillTree = captureGitWorktreeSnapshot(state.workspace.worktreeRoot).tree;
    const round2 = await invoke(() => writer.publish({
      kind: "interaction-completion.v1",
      payload: talkPayload(2, postGrillTree),
    }));
    const round3 = await invoke(() => writer.publish({
      kind: "interaction-completion.v1",
      payload: talkPayload(3, postGrillTree, { zeroQuestion: true }),
    }));
    await expect(invoke(() => writer.publish({
      kind: "interaction-completion.v1",
      payload: grillPayload(preGrillTree),
    }))).rejects.toThrow(/current Workspace|tree/i);
    const grill = await invoke(() => writer.publish({
      kind: "interaction-completion.v1",
      payload: grillPayload(postGrillTree),
    }));
    await expect(invoke(() => writer.publish({
      kind: "interaction-completion.v1",
      payload: {
        interaction_type: "aggregate",
        rounds: [round1, round2, round3].map(({ ref, hash }) => ({ ref, hash })),
        grill: { ref: grill.ref, hash: grill.hash },
        workspace_tree: postGrillTree,
        decision_ref: state.decisionRef,
        decision_hash: state.decisionHash,
      },
    }))).rejects.toThrow(/common pre-grill tree/i);
  });

  it("rejects incomplete, wrong-type, and out-of-order interaction aggregates", async () => {
    requireApi();
    const state = fixture("interaction-aggregate-negative");
    const writer = writerFor(state);
    const tree = captureGitWorktreeSnapshot(state.workspace.worktreeRoot).tree;
    const talks = [];
    for (const roundNumber of [1, 2, 3]) {
      talks.push(await invoke(() => writer.publish({
        kind: "interaction-completion.v1",
        payload: talkPayload(roundNumber, tree, { zeroQuestion: roundNumber === 3 }),
      })));
    }
    const grill = await invoke(() => writer.publish({
      kind: "interaction-completion.v1",
      payload: grillPayload(tree),
    }));
    const aggregate = (rounds, grillBinding) => ({
      interaction_type: "aggregate",
      rounds: rounds.map(({ ref, hash }) => ({ ref, hash })),
      grill: grillBinding,
      workspace_tree: tree,
      decision_ref: state.decisionRef,
      decision_hash: state.decisionHash,
    });

    await expect(invoke(() => writer.publish({
      kind: "interaction-completion.v1",
      payload: aggregate(talks.slice(0, 2), { ref: grill.ref, hash: grill.hash }),
    }))).rejects.toThrow(/exactly three|three ordered/i);
    await expect(invoke(() => writer.publish({
      kind: "interaction-completion.v1",
      payload: aggregate(talks, null),
    }))).rejects.toThrow(/aggregate grill|ref.*hash/i);
    await expect(invoke(() => writer.publish({
      kind: "interaction-completion.v1",
      payload: aggregate([grill, talks[1], talks[2]], { ref: grill.ref, hash: grill.hash }),
    }))).rejects.toThrow(/wrong interaction type/i);
    await expect(invoke(() => writer.publish({
      kind: "interaction-completion.v1",
      payload: aggregate([talks[1], talks[0], talks[2]], { ref: grill.ref, hash: grill.hash }),
    }))).rejects.toThrow(/out of order/i);
  });

  it.each([
    ["question ids", (round) => { round.questions[0].question_id = "q-1"; }, /question_id.*globally unique/i],
    ["host-message refs", (round) => { round.questions[0].ask.ref = "host-message://ask/round-1-question-1"; }, /host-message refs.*globally unique/i],
  ])("rejects duplicate %s across talk rounds", async (_label, mutate, expected) => {
    requireApi();
    const state = fixture(`interaction-aggregate-duplicate-${roots.length}`);
    const writer = writerFor(state);
    const tree = captureGitWorktreeSnapshot(state.workspace.worktreeRoot).tree;
    const payloads = [1, 2, 3].map((roundNumber) => talkPayload(roundNumber, tree, {
      zeroQuestion: roundNumber === 3,
    }));
    mutate(payloads[1].rounds[0]);
    const talks = [];
    for (const payload of payloads) {
      talks.push(await invoke(() => writer.publish({ kind: "interaction-completion.v1", payload })));
    }
    const grill = await invoke(() => writer.publish({
      kind: "interaction-completion.v1",
      payload: grillPayload(tree),
    }));
    await expect(invoke(() => writer.publish({
      kind: "interaction-completion.v1",
      payload: {
        interaction_type: "aggregate",
        rounds: talks.map(({ ref, hash }) => ({ ref, hash })),
        grill: { ref: grill.ref, hash: grill.hash },
        workspace_tree: tree,
        decision_ref: state.decisionRef,
        decision_hash: state.decisionHash,
      },
    }))).rejects.toThrow(expected);
  });

  it("requires real ask/reply/rerank bindings or explicit zero-question facts and complete grill exits", async () => {
    requireApi();
    const state = fixture("interaction-facts-negative");
    const writer = writerFor(state);
    const tree = captureGitWorktreeSnapshot(state.workspace.worktreeRoot).tree;
    const incompleteTalk = talkPayload(1, tree);
    delete incompleteTalk.rounds[0].questions[0].reply;
    await expect(invoke(() => writer.publish({
      kind: "interaction-completion.v1",
      payload: incompleteTalk,
    }))).rejects.toThrow(/reply/i);
    const nonVisibleTalk = talkPayload(1, tree);
    nonVisibleTalk.rounds[0].questions[0].ask.ref = "internal://ask/1";
    await expect(invoke(() => writer.publish({
      kind: "interaction-completion.v1",
      payload: nonVisibleTalk,
    }))).rejects.toThrow(/host-message:\/\/ask/i);
    const incompleteZeroQuestion = talkPayload(1, tree, { zeroQuestion: true });
    delete incompleteZeroQuestion.rounds[0].candidate_queue;
    await expect(invoke(() => writer.publish({
      kind: "interaction-completion.v1",
      payload: incompleteZeroQuestion,
    }))).rejects.toThrow(/candidate_queue/i);
    await expect(invoke(() => writer.publish({
      kind: "interaction-completion.v1",
      payload: talkPayload(1, tree, { zeroQuestion: true }),
    }))).resolves.toMatchObject({ value: { payload: { interaction_type: "talk" } } });
    const incompleteGrill = grillPayload(tree);
    delete incompleteGrill.grill.exit_checks.file_references_checked;
    await expect(invoke(() => writer.publish({
      kind: "interaction-completion.v1",
      payload: incompleteGrill,
    }))).rejects.toThrow(/four exit checks/i);
    const unreferencedGrill = grillPayload(tree);
    unreferencedGrill.grill.file_references = [];
    await expect(invoke(() => writer.publish({
      kind: "interaction-completion.v1",
      payload: unreferencedGrill,
    }))).rejects.toThrow(/file_references|no_file_reason/i);
  });

  it("binds an aggregate to the exact canonical decision-log bytes", async () => {
    requireApi();
    const state = fixture("interaction-decision-artifact");
    const writer = writerFor(state);
    const tree = captureGitWorktreeSnapshot(state.workspace.worktreeRoot).tree;
    const talks = [];
    for (const roundNumber of [1, 2, 3]) {
      talks.push(await invoke(() => writer.publish({
        kind: "interaction-completion.v1",
        payload: talkPayload(roundNumber, tree, { zeroQuestion: roundNumber !== 1 }),
      })));
    }
    const grill = await invoke(() => writer.publish({
      kind: "interaction-completion.v1",
      payload: grillPayload(tree),
    }));
    await expect(invoke(() => writer.publish({
      kind: "interaction-completion.v1",
      payload: {
        interaction_type: "aggregate",
        rounds: talks.map(({ ref, hash }) => ({ ref, hash })),
        grill: { ref: grill.ref, hash: grill.hash },
        workspace_tree: tree,
        decision_ref: state.decisionRef,
        decision_hash: "0".repeat(64),
      },
    }))).rejects.toThrow(/decision_ref\/hash|decision-log artifact/i);
  });

  it("requires the final decision only on aggregate and rejects a fourth talk round", async () => {
    requireApi();
    const state = fixture("interaction-decision-boundary");
    const writer = writerFor(state);
    const tree = captureGitWorktreeSnapshot(state.workspace.worktreeRoot).tree;
    const talk = (roundNumber, selected, extra = {}) => ({
      ...talkPayload(roundNumber, tree, { selected }),
      ...extra,
    });

    for (const [index, selected] of ["A", "B", "C"].entries()) {
      await invoke(() => writer.publish({ kind: "interaction-completion.v1", payload: talk(index + 1, selected) }));
    }
    await expect(invoke(() => writer.publish({
      kind: "interaction-completion.v1",
      payload: talk(3, "D"),
    }))).rejects.toThrow(/sequence|complete/i);
    await expect(invoke(() => writer.publish({
      kind: "interaction-completion.v1",
      payload: talk(1, "A", {
        decision_ref: state.decisionRef,
        decision_hash: state.decisionHash,
      }),
    }))).rejects.toThrow(/schema|must not|not/i);
    await expect(invoke(() => writer.publish({
      kind: "interaction-completion.v1",
      payload: {
        interaction_type: "aggregate",
        rounds: [],
        grill: null,
        workspace_tree: tree,
      },
    }))).rejects.toThrow(/decision_ref|decision_hash|required/i);
  });

  it("minimizes secret-bearing fields before hashing and persistence", async () => {
    requireApi();
    const state = fixture("secret-minimization");
    const secrets = [
      "token-value-must-not-persist",
      "password-value-must-not-persist",
      "authorization-value-must-not-persist",
      "private-session-must-not-persist",
      "full-card-text-must-not-persist",
    ];
    const published = await invoke(() => writerFor(state).publish({
      kind: "stage-completion-facts.v1",
      payload: completionPayload({
        private_metadata: {
          token: secrets[0],
          password: secrets[1],
          authorization: secrets[2],
          private_session: secrets[3],
          full_card: secrets[4],
        },
      }),
    }));
    const raw = readFileSync(state.task.recordPath(published.ref), "utf8");

    for (const secret of secrets) expect(raw).not.toContain(secret);
    expect(published.value.payload).not.toHaveProperty("private_metadata");
    expect(published.value.content_hash).toBe(sha256(JSON.stringify(published.value.payload)));
    expect(published.hash).toBe(sha256(raw));
  });
});

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
let requiredStageContentKinds;
let moduleLoadError;

beforeAll(async () => {
  try {
    ({
      createStageContentEvidenceWriter,
      verifyStageContentEvidence,
      readLatestStageContentEvidence,
      requiredStageContentKinds,
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
  expect(requiredStageContentKinds).toBeTypeOf("function");
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
  const setupTalk = setupWriter.publish({
    kind: "interaction-completion.v1",
    payload: { interaction_type: "talk", rounds: [{ selected: "A" }], grill: null, workspace_tree: setupTree },
  });
  const setupGrill = setupWriter.publish({
    kind: "interaction-completion.v1",
    payload: { interaction_type: "grill", rounds: [], grill: { conclusion: "passed" }, workspace_tree: setupTree },
  });
  setupWriter.publish({
    kind: "interaction-completion.v1",
    payload: {
      interaction_type: "aggregate",
      rounds: [{ ref: setupTalk.ref, hash: setupTalk.hash }],
      grill: { ref: setupGrill.ref, hash: setupGrill.hash },
      workspace_tree: setupTree,
      decision_ref: "receipts/decision.json",
      decision_hash: "b".repeat(64),
    },
  });
  setupWriter.publish({
    kind: "decision-coverage-audit.v1",
    payload: {
      decision_log_ref: "receipts/decision.json",
      decision_log_hash: "b".repeat(64),
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
  return { root, task, workspace, workflowRunId: nextRun.run.workflow_run_id };
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

function ambiguityLedgerV2(overrides = {}) {
  const specHash = "a".repeat(64);
  const binding = (id, artifact_kind = "spec") => ({
    artifact_kind,
    ref: artifact_kind === "decision" ? "receipts/decision-log/source.md" : "artifacts/spec.md",
    hash: artifact_kind === "decision" ? "b".repeat(64) : specHash,
    id,
  });
  return {
    spec_content_hash: specHash,
    subject_binding: binding("SPEC-001"),
    pfacts: [{
      id: "PFACT-01",
      statement: "The accepted direction requires a versioned specification.",
      status: "verified",
      evidence: [binding("D1", "decision")],
      affects_frs: [binding("FR-01")],
      affects_acs: [binding("AC-01")],
    }],
    frs: [{
      id: "FR-01",
      behavior: "The specification exposes stable requirement identity.",
      scope_boundary: "This requirement does not select an implementation mechanism.",
      pfact_refs: [binding("PFACT-01")],
      ac_refs: [binding("AC-01")],
    }],
    acs: [{
      id: "AC-01",
      behavior: "A reader can resolve the stable requirement identity.",
      fr_refs: [binding("FR-01")],
      verification_method: "Run the focused content-contract test.",
      pass_condition: "The reference resolves in the bound specification.",
      evidence_type: "test",
    }],
    risks: [{
      id: "RISK-01",
      affected_ids: ["FR-01", "AC-01"],
      trigger_condition: "A binding is missing or stale.",
      consequence: "The downstream task can load the wrong requirement.",
      mitigation_or_stop: "Stop and request corrected accepted input.",
      handling_stage: "build-plan",
      verification: "The focused content-contract test rejects the payload.",
    }],
    ...overrides,
  };
}

async function invoke(operation) {
  return operation();
}

describe("stage-content-evidence.v1 controlled writer", () => {
  it("requires an identity-closed ambiguity-ledger.v2 and keeps v1 records untouched", async () => {
    requireApi();
    const state = fixture("ambiguity-ledger-v2");
    const writer = writerFor(state);
    const before = evidenceNamespaceSnapshot(state.task);

    expect(requiredStageContentKinds("build-spec")).toContain("ambiguity-ledger.v2");
    const published = await invoke(() => writer.publish({
      kind: "ambiguity-ledger.v2",
      payload: ambiguityLedgerV2(),
    }));
    expect(published.value.payload.subject_binding.hash).toBe(published.value.payload.spec_content_hash);

    for (const invalid of [
      ambiguityLedgerV2({ subject_binding: { artifact_kind: "spec", ref: "artifacts/spec.md", hash: "a".repeat(64) } }),
      ambiguityLedgerV2({ pfacts: [
        ...ambiguityLedgerV2().pfacts,
        { ...ambiguityLedgerV2().pfacts[0] },
      ] }),
      ambiguityLedgerV2({ pfacts: [{ ...ambiguityLedgerV2().pfacts[0], status: "claimed" }] }),
      ambiguityLedgerV2({ frs: [{ ...ambiguityLedgerV2().frs[0], pfact_refs: [{ artifact_kind: "spec", ref: "artifacts/spec.md", hash: "0".repeat(64), id: "PFACT-01" }] }] }),
      ambiguityLedgerV2({ risks: [{ id: "RISK-01", affected_ids: ["FR-01"] }] }),
      ambiguityLedgerV2({ code_anchors: ["core/forbidden.mjs"] }),
    ]) {
      await expect(invoke(() => writer.publish({ kind: "ambiguity-ledger.v2", payload: invalid }))).rejects.toThrow(/schema|identity|binding|risk|status|reference|hash/i);
    }
    const after = evidenceNamespaceSnapshot(state.task);
    for (const entry of before) {
      expect(after).toContainEqual(entry);
    }
    expect(after.filter(([path]) => path.includes("ambiguity-ledger.v1")).length).toBe(
      before.filter(([path]) => path.includes("ambiguity-ledger.v1")).length,
    );
  });

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
    const talk = {
      interaction_type: "talk", rounds: [{ selected: "A" }], grill: null,
      workspace_tree: "a".repeat(40),
    };
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
    const interaction = (selected) => ({
      interaction_type: "talk",
      rounds: [{ selected }],
      grill: null,
      workspace_tree: "a".repeat(40),
    });

    const round1 = await invoke(() => writer.publish({
      kind: "interaction-completion.v1",
      payload: interaction("A"),
    }));
    const repeated = await invoke(() => writer.publish({
      kind: "interaction-completion.v1",
      payload: interaction("A"),
    }));
    const round2 = await invoke(() => writer.publish({
      kind: "interaction-completion.v1",
      payload: interaction("B"),
    }));
    const round3 = await invoke(() => writer.publish({
      kind: "interaction-completion.v1",
      payload: interaction("C"),
    }));
    const grill = await invoke(() => writer.publish({
      kind: "interaction-completion.v1",
      payload: {
        interaction_type: "grill",
        rounds: [],
        grill: { conclusion: "passed" },
        workspace_tree: "a".repeat(40),
      },
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
        workspace_tree: "a".repeat(40),
        decision_ref: "receipts/decision.json",
        decision_hash: "b".repeat(64),
      },
    }));

    expect(repeated.ref).toBe(round1.ref);
    expect(new Set([round1.ref, round2.ref, round3.ref, grill.ref, aggregate.ref]).size).toBe(5);
    expect(round1.ref).toMatch(/interaction-completion\.talk-0001\.json$/);
    expect(round2.ref).toMatch(/interaction-completion\.talk-0002\.json$/);
    expect(round3.ref).toMatch(/interaction-completion\.talk-0003\.json$/);
    expect(grill.ref).toMatch(/interaction-completion\.grill\.json$/);
    expect(aggregate.ref).toMatch(/interaction-completion\.aggregate\.json$/);
  });

  it("requires the final decision only on aggregate and rejects a fourth talk round", async () => {
    requireApi();
    const state = fixture("interaction-decision-boundary");
    const writer = writerFor(state);
    const talk = (selected, extra = {}) => ({
      interaction_type: "talk",
      rounds: [{ selected }],
      grill: null,
      workspace_tree: "a".repeat(40),
      ...extra,
    });

    for (const selected of ["A", "B", "C"]) {
      await invoke(() => writer.publish({ kind: "interaction-completion.v1", payload: talk(selected) }));
    }
    await expect(invoke(() => writer.publish({
      kind: "interaction-completion.v1",
      payload: talk("D"),
    }))).rejects.toThrow(/sequence|complete/i);
    await expect(invoke(() => writer.publish({
      kind: "interaction-completion.v1",
      payload: talk("A", {
        decision_ref: "receipts/decision.json",
        decision_hash: "b".repeat(64),
      }),
    }))).rejects.toThrow(/schema|must not|not/i);
    await expect(invoke(() => writer.publish({
      kind: "interaction-completion.v1",
      payload: {
        interaction_type: "aggregate",
        rounds: [],
        grill: null,
        workspace_tree: "a".repeat(40),
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

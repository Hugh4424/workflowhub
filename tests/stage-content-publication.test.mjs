import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { buildAuditSummaryFromJournalEvents } from "../core/audit-aggregator.mjs";
import { hashAuditSummary } from "../core/audit-summary-carrier.mjs";
import { createCanonicalSource, createSourceManifest } from "../core/canonical-source.mjs";
import { computeLedgerHash, computeRequirementContentHash } from "../core/requirement-ledger.mjs";
import { createStageContentEvidenceWriter } from "../core/stage-content-evidence.mjs";
import { createTask } from "../core/task-handle.mjs";
import { createTaskKernel } from "../core/task-kernel.mjs";
import { prepareTaskWorkspace } from "../core/workspace.mjs";

const roots = [];
const STAGE = "make-decision";
const CREATED_AT = "2026-07-26T00:00:00.000Z";
const RUN_ID = `task-created:${CREATED_AT}`;
const KIND = "stage-completion-facts.v1";
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const git = (root, args) => execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();

afterEach(() => {
  while (roots.length > 0) rmSync(roots.pop(), { recursive: true, force: true });
});

function ledger() {
  const requirement = {
    requirement_id: "R1",
    status: "accepted",
    source_ref: { kind: "source", uri_or_path: "source://R1", content_hash: "a".repeat(64) },
    decision_ref: { kind: "decision", uri_or_path: "decision://R1", content_hash: "b".repeat(64) },
    artifact_refs: [{ kind: "artifact", uri_or_path: "artifact://R1", content_hash: "c".repeat(64) }],
    acceptance_criteria_refs: [{ kind: "ac", uri_or_path: "ac://R1", content_hash: "d".repeat(64) }],
    upstream_hashes: ["a".repeat(64)],
    stale: false,
  };
  requirement.content_hash = computeRequirementContentHash(requirement);
  const value = { schema_version: "v1", source_manifest_hash: "e".repeat(64), requirements: [requirement] };
  return { ...value, ledger_hash: computeLedgerHash(value) };
}

function completionPayload() {
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
  };
}

function requirementsInput() {
  const source = createCanonicalSource({
    source_type: "offline_fixture",
    source_id: "stage-run-producer",
    revision: "r1",
    requirements: ["R1"],
  });
  const manifest = createSourceManifest({
    canonical_source: source,
    atoms: [{
      requirement_id: "R1",
      text: "The real execution must remain auditable.",
      owner: "product",
      authority: "user",
      derived_from: [],
      supersedes: [],
      status: "accepted",
      stale: false,
    }],
  }).manifest;
  return {
    source_manifest: manifest,
    mappings: {
      R1: {
        decision_ref: { kind: "decision", uri_or_path: "decision://R1", content_hash: "b".repeat(64) },
        artifact_refs: [{ kind: "artifact", uri_or_path: "artifact://R1", content_hash: "c".repeat(64) }],
        acceptance_criteria_refs: [{ kind: "ac", uri_or_path: "ac://R1", content_hash: "d".repeat(64) }],
      },
    },
  };
}

function fixture(taskId = `publication-${roots.length + 1}`) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-content-publication-")));
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
      created_at: CREATED_AT,
      target_repo_root: repo,
      issue_ids: [],
      inputs: {},
    },
  });
  const candidate = prepareTaskWorkspace(task);
  const kernel = createTaskKernel(task, { candidateWorkspace: candidate });
  const content = createStageContentEvidenceWriter({
    task,
    workspace: candidate,
    stage: STAGE,
    workflowRunId: RUN_ID,
    now: () => "2026-07-26T00:01:00.000Z",
  }).publish({ kind: KIND, payload: completionPayload() });
  const manifest = {
    schema_version: "2.0.0",
    stage_slug: STAGE,
    manifest_hash: "f".repeat(64),
    steps: [{ step_id: 1, attempt_id: "attempt-1", order: 1, depends_on: [] }],
  };
  const entry = {
    event_type: "step_entry",
    workflow_run_id: RUN_ID,
    stage_slug: STAGE,
    step_id: 1,
    attempt_id: "attempt-1",
    timestamp: "2026-07-26T00:02:00.000Z",
    journal_entry_id: "entry-1",
    entry_evidence: { kind: "command", uri_or_path: "evidence/entry-1.json" },
  };
  const exit = {
    event_type: "step_exit",
    workflow_run_id: RUN_ID,
    stage_slug: STAGE,
    step_id: 1,
    attempt_id: "attempt-1",
    timestamp: "2026-07-26T00:03:00.000Z",
    entry_journal_entry_id: "entry-1",
    terminal_status: "success",
    completion_evidence: {
      kind: "stage-content",
      uri_or_path: content.ref,
      content_hash: content.hash,
    },
  };
  const contentRef = { kind: KIND, ref: content.ref, hash: content.hash };
  return {
    root,
    task,
    kernel,
    candidate,
    content,
    contentRef,
    manifest,
    events: [entry, exit],
    snapshot: candidate.captureSnapshot(),
  };
}

function auditContext(state, overrides = {}) {
  return {
    task_id: state.task.identity.taskId,
    snapshot_tree: state.snapshot.tree,
    manifest: state.manifest,
    ledger: ledger(),
    required_content_kinds: [KIND],
    content_evidence: [{
      ref: state.content.ref,
      hash: state.content.hash,
      value: state.content.value,
    }],
    ...overrides,
  };
}

function aggregate(state, {
  events = state.events,
  stage = STAGE,
  run = RUN_ID,
  context = auditContext(state),
} = {}) {
  return buildAuditSummaryFromJournalEvents(events, stage, run, context).audit_summary;
}

function canonicalAudit(state, summary) {
  const unsigned = {
    ...summary,
    task_id: summary.task_id ?? state.task.identity.taskId,
    stage_slug: summary.stage_slug ?? STAGE,
    snapshot_tree: summary.snapshot_tree ?? state.snapshot.tree,
    journal_hash: summary.journal_hash ?? sha256(state.events.map((event) => JSON.stringify(event)).join("\n")),
    content_evidence_refs: summary.content_evidence_refs ?? [state.contentRef],
  };
  delete unsigned.summary_hash;
  const value = { ...unsigned, summary_hash: hashAuditSummary(unsigned) };
  const raw = `${JSON.stringify(value, null, 2)}\n`;
  const ref = `evidence/audits/${STAGE}/${value.summary_hash}.json`;
  state.kernel.publishCanonicalRecord(ref, raw);
  return { ref, value };
}

function facts(state, audit, overrides = {}) {
  return {
    worktree_root: state.candidate.worktreeRoot,
    baseline_commit: state.candidate.baselineCommit,
    snapshot_tree: state.snapshot.tree,
    audit_contract_version: "v1",
    audit_summary_ref: audit.ref,
    audit_summary_hash: audit.value.summary_hash,
    audit_verdict: audit.value.verdict,
    content_evidence_refs: [state.contentRef],
    ...overrides,
  };
}

function attemptExists(task) {
  try {
    task.readRecord("results/make-decision/attempt-0001.json");
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

describe("typed content evidence enters the one canonical audit and publication boundary", () => {
  it("publishes one carrier plus authenticated typed refs, without a second content verdict", () => {
    const state = fixture("normal-publication");
    const summary = aggregate(state);

    expect(summary).toMatchObject({
      task_id: state.task.identity.taskId,
      stage_slug: STAGE,
      workflow_run_id: RUN_ID,
      snapshot_tree: state.snapshot.tree,
      verdict: "pass",
      content_evidence_refs: [state.contentRef],
    });
    expect(summary.journal_hash).toMatch(/^[a-f0-9]{64}$/);
    expect(summary).not.toHaveProperty("content_verdict");

    const audit = canonicalAudit(state, summary);
    const published = state.kernel.publishAttempt(STAGE, { facts: facts(state, audit) });
    expect(published.attempt.facts).toMatchObject({
      audit_contract_version: "v1",
      audit_summary_ref: audit.ref,
      audit_summary_hash: audit.value.summary_hash,
      audit_verdict: "pass",
      content_evidence_refs: [state.contentRef],
    });
    expect(published.attempt.facts).not.toHaveProperty("content_verdict");
  });

  it("makes missing, duplicate, out-of-order, and non-success work structural audit failures", () => {
    const state = fixture("structural-audit-failures");
    const blocked = structuredClone(state.events);
    blocked[1].terminal_status = "blocked";
    const cases = [
      ["missing expected step", { events: [] }],
      ["duplicate terminal exit", { events: [...state.events, structuredClone(state.events[1])] }],
      ["exit before entry", { events: [state.events[1], state.events[0]] }],
      ["terminal status is not success", { events: blocked }],
      ["required content kind is missing", {
        context: auditContext(state, { content_evidence: [] }),
      }],
      ["required content kind is duplicated", {
        context: auditContext(state, {
          content_evidence: [
            { ref: state.content.ref, hash: state.content.hash, value: state.content.value },
            { ref: state.content.ref, hash: state.content.hash, value: state.content.value },
          ],
        }),
      }],
    ];
    for (const [label, mutation] of cases) {
      expect(aggregate(state, mutation).verdict, label).toBe("fail");
    }
  });

  it("rejects cross-task/stage/run/tree and tampered typed evidence in the canonical audit", () => {
    const state = fixture("typed-evidence-bindings");
    const cases = [
      ["task", {
      context: auditContext(state, {
        task_id: "another-task",
        content_evidence: [{ ref: state.content.ref, hash: state.content.hash, value: { ...state.content.value, task_id: "another-task" } }],
      }),
      }],
      ["stage", {
      context: auditContext(state, {
        content_evidence: [{ ref: state.content.ref, hash: state.content.hash, value: { ...state.content.value, stage: "build-spec" } }],
      }),
      }],
      ["run", {
      context: auditContext(state, {
        content_evidence: [{ ref: state.content.ref, hash: state.content.hash, value: { ...state.content.value, workflow_run_id: "another-run" } }],
      }),
      }],
      ["tree", {
      context: auditContext(state, {
        content_evidence: [{ ref: state.content.ref, hash: state.content.hash, value: { ...state.content.value, snapshot_tree: "1".repeat(40) } }],
      }),
      }],
      ["content hash", {
      context: auditContext(state, {
        content_evidence: [{ ref: state.content.ref, hash: "0".repeat(64), value: state.content.value }],
      }),
      }],
    ];
    for (const [label, mutation] of cases) {
      expect(aggregate(state, mutation).verdict, label).toBe("fail");
    }
  });

  it("requires the carrier and typed refs before TaskKernel can create a successful attempt", () => {
    const state = fixture("missing-publication-material");

    expect(() => state.kernel.publishAttempt(STAGE, {
      facts: {
        worktree_root: state.candidate.worktreeRoot,
        baseline_commit: state.candidate.baselineCommit,
        snapshot_tree: state.snapshot.tree,
      },
    })).toThrow(/audit|carrier|content evidence|content_evidence_refs/i);
    expect(attemptExists(state.task)).toBe(false);
  });

  it("rejects forged carrier/content facts and a second verdict without a successful attempt", () => {
    const state = fixture("forged-publication-material");
    const audit = canonicalAudit(state, aggregate(state));
    const cases = [
      ["audit summary hash", facts(state, audit, { audit_summary_hash: "0".repeat(64) })],
      ["audit verdict", facts(state, audit, { audit_verdict: "fail" })],
      ["content ref hash", facts(state, audit, {
        content_evidence_refs: [{ ...state.contentRef, hash: "0".repeat(64) }],
      })],
      ["second verdict", facts(state, audit, { content_verdict: "pass" })],
    ];
    for (const [label, forgedFacts] of cases) {
      expect(() => state.kernel.publishAttempt(STAGE, {
        facts: forgedFacts,
      }), label).toThrow(/audit|hash|verdict|content|unknown|forbidden/i);
      expect(attemptExists(state.task), label).toBe(false);
    }
  });
});

describe("official Stage run, requirements ledger, and journal producers", () => {
  it("creates a unique run identity each time and binds the second run to the first", () => {
    const state = fixture("unique-stage-runs");

    expect(typeof state.kernel.startStageRun).toBe("function");
    const first = state.kernel.startStageRun(STAGE, { reason: "initial execution" });
    const second = state.kernel.startStageRun(STAGE, { reason: "retry after upstream change" });

    expect(first.run.workflow_run_id).not.toBe(second.run.workflow_run_id);
    expect(first.ref).not.toBe(second.ref);
    expect(first.hash).toMatch(/^[a-f0-9]{64}$/);
    expect(second.hash).toMatch(/^[a-f0-9]{64}$/);
    expect(second.run).toMatchObject({
      task_id: state.task.identity.taskId,
      stage: STAGE,
      reason: "retry after upstream change",
      previous_run_ref: first.ref,
      previous_run_hash: first.hash,
    });
  });

  it.each(["task_id", "stage", "workflow_run_id", "worktree_root", "path", "output_ref"])(
    "rejects caller-controlled %s when a Stage run starts",
    (field) => {
      const state = fixture(`forged-run-${field.replaceAll("_", "-")}`);
      expect(() => state.kernel.startStageRun(STAGE, {
        reason: "caller-forgery-check",
        [field]: field === "workflow_run_id" ? "forged-run" : "/tmp/caller-selected",
      })).toThrow(/unknown|forbidden|caller|identity|path/i);
    },
  );

  it("writes the canonical ledger while keeping make-decision journal mutation runtime-owned", async () => {
    const state = fixture("official-run-producers");

    state.kernel.startStageRun(STAGE, { reason: "initial execution" });
    expect(typeof state.kernel.publishRequirementsLedger).toBe("function");
    expect(typeof state.kernel.writeStageStepEntry).toBe("function");
    expect(typeof state.kernel.writeStageStepExit).toBe("function");

    const published = state.kernel.publishRequirementsLedger(STAGE, requirementsInput());
    expect(published).toMatchObject({
      ledger_ref: "requirements/ledger.json",
      coverage_ref: "requirements/coverage.json",
    });

    expect(() => state.kernel.writeStageStepEntry(STAGE, {
      step_id: 1,
      attempt_id: "attempt-1",
      entry_evidence: { kind: "command", uri_or_path: "evidence/entry-1.json", content_hash: "a".repeat(64) },
    })).toThrow(/runtime-owned/i);
  });

  it("records only the runtime-owned bootstrap step when a run is started", () => {
    const state = fixture("run-does-not-complete-work");
    state.kernel.startStageRun(STAGE, { reason: "initial execution" });

    const journal = state.task.readRecord("journal.jsonl").trim().split("\n").map(JSON.parse);
    expect(journal.map(({ event_type, step_id }) => ({ event_type, step_id }))).toEqual([
      { event_type: "step_entry", step_id: 1 },
      { event_type: "step_exit", step_id: 1 },
    ]);
    expect(attemptExists(state.task)).toBe(false);
  });
});

import { afterEach, describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createTask } from "../task-handle.mjs";
import { createTaskKernel, validateStageFacts } from "../../runtime/task/task-kernel.mjs";
import { prepareTaskWorkspace } from "../workspace.mjs";

const temporary = [];

function fixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-kernel-publish-")));
  temporary.push(root);
  const repo = join(root, "repo");
  mkdirSync(repo);
  execFileSync("git", ["init", "-q"], { cwd: repo });
  execFileSync("git", ["config", "user.name", "Test"], { cwd: repo });
  execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: repo });
  writeFileSync(join(repo, "README.md"), "fixture\n");
  execFileSync("git", ["add", "README.md"], { cwd: repo });
  execFileSync("git", ["commit", "-qm", "fixture"], { cwd: repo });
  const taskPath = join(root, "Projects", "Demo", "tasks", "task-one");
  const task = createTask({
    storageRoot: root,
    taskPath,
    manifest: {
      schema_version: "1.0.0",
      project_name: "Demo",
      task_id: "task-one",
      created_at: "2026-08-01T00:00:00.000Z",
      target_repo_root: repo,
      issue_ids: [],
      inputs: {},
    },
  });
  const candidate = prepareTaskWorkspace(task);
  return { task, candidate, kernel: createTaskKernel(task, { candidateWorkspace: candidate }) };
}

function coreDecision(kernel) {
  const decision = "# Decision\n\nProceed.\n";
  const hash = createHash("sha256").update(decision).digest("hex");
  const decision_ref = `receipts/decision-log/${hash}.md`;
  kernel.publishCanonicalRecord(decision_ref, decision);
  return { decision_ref, decision_hash: hash };
}

function publishDecision(kernel, candidate) {
  return kernel.publishAttempt("make-decision", {
    facts: {
      worktree_root: candidate.worktreeRoot,
      baseline_commit: candidate.baselineCommit,
      ...coreDecision(kernel),
    },
    missing_items: ["support:audit"],
  });
}

afterEach(() => {
  while (temporary.length) rmSync(temporary.pop(), { recursive: true, force: true });
});

describe("TaskKernel current-material publication boundary", () => {
  it("keeps historical acceptance readable after current workspace material changes", () => {
    const { candidate, kernel } = fixture();
    const published = publishDecision(kernel, candidate);
    const confirmation = kernel.confirmAttempt("make-decision", published.attempt_ref, "accepted", "comment:test");
    kernel.acceptAttempt("make-decision", published.attempt_ref, confirmation.ref);

    writeFileSync(join(candidate.worktreeRoot, "current-material.md"), "revised\n");
    expect(kernel.readAccepted("make-decision").accepted.attempt_ref).toBe(published.attempt_ref);
    expect(() => kernel.readAccepted("make-decision", { liveCheckpoint: false }))
      .toThrow(/historical|live checkpoint/i);
  });

  it("does not accept continuation or rebind fields when starting ordinary stage work", () => {
    const { kernel } = fixture();

    expect(() => kernel.startStageRun("build-spec", {
      reason: "normal current-material work",
      continuation_ref: "results/build-spec/revisions/continuation-0001.json",
    })).toThrow(/unknown|continuation/i);
    expect(() => kernel.startStageRun("build-spec", {
      reason: "normal current-material work",
      baseline_rebind_ref: "results/build-plan/revisions/baseline-rebind-0001.json",
    })).toThrow(/unknown|rebind/i);
    expect(kernel.startStageRun("build-spec", { reason: "normal current-material work" }).run)
      .toMatchObject({ stage: "build-spec" });
  });

  it("rejects caller-supplied historical upstream acceptance claims", () => {
    const { candidate, kernel } = fixture();
    expect(() => kernel.publishAttempt("make-decision", {
      facts: {
        worktree_root: candidate.worktreeRoot,
        baseline_commit: candidate.baselineCommit,
        ...coreDecision(kernel),
      },
      missing_items: ["support:audit"],
      upstream_acceptances: [{ stage: "build-plan", accepted_ref: "results/build-plan/accepted.json" }],
    })).toThrow(/upstream_acceptances.*kernel-derived/i);
  });

  it("requires real completion evidence instead of a boolean", () => {
    const hash = "b".repeat(64);
    expect(() => validateStageFacts("build-code", {
      changed: [],
      tests: {
        command: "npm test", exit_code: 0, command_hash: hash,
        snapshot_head: "a".repeat(40), snapshot_tree: "a".repeat(40), snapshot_commit: "c".repeat(40),
        started_at: "2026-08-01T00:00:00.000Z", completed_at: "2026-08-01T00:00:01.000Z",
        receipt_ref: "receipts/build-tests.json", receipt_hash: hash,
        output_ref: "evidence/build-tests.txt", output_hash: hash,
      },
      review: { verdict: "revise_required", result_ref: "reviews/results/build-code.json", result_hash: hash, snapshot_tree: "a".repeat(40) },
      phase_completion: true,
      acceptance_coverage: {
        snapshot_tree: "a".repeat(40), accepted_criterion_ids: ["AC-01"],
        items: [{ acceptance_criterion_id: "AC-01", status: "covered", evidence_refs: [] }],
      },
      audit_contract_version: "v1",
      audit_summary_ref: `evidence/audits/build-code/${hash}.json`,
      audit_summary_hash: hash,
      audit_verdict: "pass",
      content_evidence_refs: [],
    })).toThrow(/completion evidence|phase_completion/i);
  });

  it("requires an explicit human confirmation before accepting a human-bound decision", () => {
    const { candidate, kernel } = fixture();
    const published = publishDecision(kernel, candidate);

    expect(() => kernel.acceptAttempt("make-decision", published.attempt_ref, "human:forged"))
      .toThrow(/confirmation|human/i);
    const confirmation = kernel.confirmAttempt("make-decision", published.attempt_ref, "accepted", "comment:test");
    expect(kernel.acceptAttempt("make-decision", published.attempt_ref, confirmation.ref))
      .toMatchObject({ stage: "make-decision", attempt_ref: published.attempt_ref });
  });
});

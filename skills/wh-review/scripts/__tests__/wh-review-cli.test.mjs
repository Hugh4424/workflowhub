import { afterEach, describe, expect, it } from "vitest";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createTask } from "../../../../runtime/task/task-handle.mjs";

const cli = new URL("../wh-review-cli.mjs", import.meta.url);
const roots = [];
afterEach(() => { while (roots.length) rmSync(roots.pop(), { recursive: true, force: true }); });

describe("wh-review production CLI", () => {
  it("exports only current review operations and no resolution writer", async () => {
    const mod = await import(cli.href);
    expect(typeof mod.runReviewRound).toBe("function");
    expect(typeof mod.verifyFinalReview).toBe("function");
    expect(typeof mod.adoptLegacyReviewRoot).toBe("function");
    expect(typeof mod.providerVisibleMaterialsForRound).toBe("function");
    expect(mod.buildNonGateReviewResponseRecord).toBeUndefined();
    expect(mod.ensureResolutionFlowHead).toBeUndefined();
  });

  it("never sends retired response-ledger materials to a provider", async () => {
    const { providerVisibleMaterialsForRound } = await import(cli.href);
    const materials = { draft_spec: "spec.md", response_ledger: { forged: true }, previous_review: { forged: true } };
    expect(providerVisibleMaterialsForRound({ materials, round: "initial" })).toEqual({ draft_spec: "spec.md" });
    expect(providerVisibleMaterialsForRound({ materials, round: "full" })).toEqual({ draft_spec: "spec.md" });
  });

  it("keeps authenticated legacy flow reconciliation free of resolution events", async () => {
    const { reconcileMakeDecisionReviewProgress } = await import(cli.href);
    const identity = { task_id: "task", workflow_run_id: "run-1", stage: "make-decision", review_track: "direction", subject_kind: "worktree", phase_id: null, review_scope: null };
    const calls = [];
    const kernel = {
      advanceReviewFlow: (receivedIdentity, update) => { calls.push(["semantic", receivedIdentity, update]); return {}; },
      recordReviewAttempt: (receivedIdentity, update) => { calls.push(["attempt", receivedIdentity, update]); return {}; },
    };
    const semantic = { event_kind: "semantic_result", event_ref: "reviews/flows/f/event-0001.json", head_result_ref: "reviews/results/result.json" };
    reconcileMakeDecisionReviewProgress({ kernel, identity, flow: semantic });
    reconcileMakeDecisionReviewProgress({ kernel, identity, flow: { event_kind: "resolution", event_ref: "reviews/flows/f/event-0002.json", head_result_ref: semantic.head_result_ref } });
    reconcileMakeDecisionReviewProgress({ kernel, identity, flow: { event_kind: "provider_attempt", event_ref: "reviews/flows/f/event-0003.json", head_result_ref: null, action_ref: "reviews/attempts/a/attempt.json" } });
    expect(calls).toHaveLength(2);
    expect(calls[0][0]).toBe("semantic");
    expect(calls[1][0]).toBe("attempt");
  });

  it("uses the simple runner and no retired resolution route", () => {
    const source = readFileSync(cli, "utf8");
    expect(source).toContain("ReviewProviderClient");
    expect(source).toContain("runReview");
    for (const forbidden of ["buildNonGateReviewResponseRecord", "recordReviewResolution", "writeReviewResolution", "closureFailureCount", "structuralFullAlreadyRecorded"]) {
      expect(source).not.toContain(forbidden);
    }
  });

  it("forbids caller-selected providers and review scope overrides", async () => {
    const { runReviewRound } = await import(cli.href);
    for (const field of ["providers", "provider_allowlist", "providerAllowlist", "path_filter", "paths", "base_commit", "candidate_commit", "commit_range", "diff", "review_scope", "reviewScope"]) {
      await expect(runReviewRound({ [field]: field === "providers" ? ["claude-code"] : "forged", task_path: "/tmp/task", stage: "build-code" }))
        .rejects.toThrow(/forbidden|derived|provider/i);
    }
  });

  it("reconstructs an authenticated make-decision CandidateWorkspace from the TaskHandle", async () => {
    const root = realpathSync(mkdtempSync(join(tmpdir(), "wh-review-cli-decision-"))); roots.push(root);
    const repo = join(root, "repo"); mkdirSync(repo);
    execFileSync("git", ["init", "-q"], { cwd: repo });
    execFileSync("git", ["config", "user.name", "Test"], { cwd: repo });
    execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: repo });
    execFileSync("git", ["commit", "--allow-empty", "-qm", "baseline"], { cwd: repo });
    const taskPath = join(root, "Projects", "Demo", "tasks", "task");
    createTask({ storageRoot: root, taskPath, manifest: { schema_version: "1.0.0", project_name: "Demo", task_id: "task", created_at: "2026-07-19T00:00:00.000Z", target_repo_root: repo, issue_ids: [], inputs: {} } });
    const { resolveTrustedReviewSubject } = await import(cli.href);
    const subject = resolveTrustedReviewSubject({ task_path: taskPath, project_name: "Demo", task_id: "task", stage: "make-decision" });
    expect(subject.candidateWorkspace.worktreeRoot).toBe(`${repo}-task`);
    expect(subject).not.toHaveProperty("sourceRoot");
  });
});

import { afterEach, describe, expect, it } from "vitest";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createTask } from "../../../../runtime/task/task-handle.mjs";

const cli = new URL("../wh-review-cli.mjs", import.meta.url);
const roots = [];
function git(cwd, args) { return String(execFileSync("git", args, { cwd, encoding: "utf8" })).trim(); }
afterEach(() => { while (roots.length) rmSync(roots.pop(), { recursive: true, force: true }); });

describe("wh-review production CLI", () => {
  it("exports only current review operations and no resolution writer", async () => {
    const mod = await import(cli.href);
    expect(typeof mod.verifyFinalReview).toBe("function");
    expect(mod.providerVisibleMaterialsForRound).toBeUndefined();
    expect(mod.adoptLegacyReviewRoot).toBeUndefined();
    expect(mod.reviewFlowIdentity).toBeUndefined();
    expect(mod.resolveReviewFlowHead).toBeUndefined();
    expect(mod.reconcileMakeDecisionReviewProgress).toBeUndefined();
    expect(mod.buildNonGateReviewResponseRecord).toBeUndefined();
    expect(mod.ensureResolutionFlowHead).toBeUndefined();
    expect(typeof mod.runReviewRound).toBe("function");
  });

  it("fails loudly on retired response-ledger and round inputs", async () => {
    const { runReviewRound } = await import(cli.href);
    for (const [field, value] of [
      ["previous_result_ref", "quality/reviews/results/old.json"],
      ["review_round", "incremental"],
      ["review_delta", {}],
      ["request_id", "old-request"],
      ["prior_attempt_refs", []],
      ["dispatch_sequence", 1],
    ]) {
      await expect(runReviewRound({ task_path: "/tmp/task", stage: "build-code", [field]: value }))
        .rejects.toThrow(/retired|fresh broker public run/i);
    }
    await expect(runReviewRound({ task_path: "/tmp/task", stage: "build-code", materials: { response_ledger: {} } }))
      .rejects.toThrow(/materials\.response_ledger.*retired/i);
  });

  it("uses immutable quality facts and no retired review-flow control plane", () => {
    const source = readFileSync(cli, "utf8");
    expect(source).toContain("ReviewProviderClient");
    expect(source).toContain("runReview");
    expect(source).toContain("recordMissingRouteUnavailable");
    expect(source).not.toContain("route is required for");
    expect(source).toContain('source: "wh_review.v2"');
    for (const forbidden of [
      "qualityOnly",
      "withReviewFlowLock",
      "assertReviewFlowReady",
      "readReviewFlow",
      "advanceReviewFlow",
      "recordReviewAttempt",
      "adopt-legacy-root",
      "legacy_3rd_review",
      "buildNonGateReviewResponseRecord",
      "recordReviewResolution",
      "writeReviewResolution",
      "closureFailureCount",
      "structuralFullAlreadyRecorded",
    ]) {
      expect(source).not.toContain(forbidden);
    }
  });

  it("forbids caller-selected providers and review scope overrides", async () => {
    const { runReviewRound } = await import(cli.href);
    for (const field of ["providers", "provider_allowlist", "providerAllowlist", "path_filter", "paths", "base_commit", "candidate_commit", "commit_range", "diff", "review_scope", "reviewScope", "workflow_run_id", "workflowRunId"]) {
      await expect(runReviewRound({ [field]: field === "providers" ? ["claude-code"] : "forged", task_path: "/tmp/task", stage: "build-code" }))
        .rejects.toThrow(/forbidden|derived|provider|unsupported/i);
    }
  });

  it("rejects the removed scope revision public input", async () => {
    const { runReviewRound } = await import(cli.href);
    await expect(runReviewRound({
      task_path: "/tmp/task",
      stage: "build-code",
      materials: { scope_revision: {} },
    })).rejects.toThrow(/current four materials.*ordinary stage review/i);
  });

  it("rejects retired runtime continuation inputs before resolving a task", async () => {
    const { runReviewRound } = await import(cli.href);
    for (const field of ["previous_runtime_ids", "previousRuntimeIds"]) {
      await expect(runReviewRound({
        task_path: "/tmp/task",
        stage: "build-code",
        [field]: { opencode: "old-runtime" },
      })).rejects.toThrow(/runtime continuation is retired.*new broker public request/i);
    }
  });

  it("opens only an existing make-decision Workspace and never prepares one", async () => {
    const root = realpathSync(mkdtempSync(join(tmpdir(), "wh-review-cli-decision-"))); roots.push(root);
    const repo = join(root, "repo"); mkdirSync(repo);
    execFileSync("git", ["init", "-q"], { cwd: repo });
    execFileSync("git", ["config", "user.name", "Test"], { cwd: repo });
    execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: repo });
    execFileSync("git", ["commit", "--allow-empty", "-qm", "baseline"], { cwd: repo });
    const taskPath = join(root, "Projects", "Demo", "tasks", "task");
    const task = createTask({ storageRoot: root, taskPath, manifest: { schema_version: "1.0.0", project_name: "Demo", task_id: "task", created_at: "2026-07-19T00:00:00.000Z", target_repo_root: repo, issue_ids: [], inputs: {} } });
    const { resolveTrustedReviewSubject } = await import(cli.href);
    expect(() => resolveTrustedReviewSubject({ task_path: taskPath, project_name: "Demo", task_id: "task", stage: "make-decision" }))
      .toThrow(/current task Workspace|registered|ENOENT/i);
    expect(git(repo, ["worktree", "list", "--porcelain"]).split("\n").filter((line) => line.startsWith("worktree "))).toHaveLength(1);
    const { prepareTaskWorkspace } = await import("../../../../runtime/task/workspace.mjs");
    prepareTaskWorkspace(task);
    const subject = resolveTrustedReviewSubject({ task_path: taskPath, project_name: "Demo", task_id: "task", stage: "make-decision" });
    expect(subject.workspace.worktreeRoot).toBe(`${repo}-task`);
    expect(subject.candidateWorkspace).toBeUndefined();
    expect(subject).not.toHaveProperty("sourceRoot");
  });

  it("returns unavailable and writes an immutable attempt when the run route is missing", async () => {
    const root = realpathSync(mkdtempSync(join(tmpdir(), "wh-review-cli-route-missing-"))); roots.push(root);
    const repo = join(root, "repo"); mkdirSync(repo);
    execFileSync("git", ["init", "-q"], { cwd: repo });
    execFileSync("git", ["config", "user.name", "Test"], { cwd: repo });
    execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: repo });
    execFileSync("git", ["commit", "--allow-empty", "-qm", "baseline"], { cwd: repo });
    const taskPath = join(root, "Projects", "Demo", "tasks", "task");
    const task = createTask({ storageRoot: root, taskPath, manifest: { schema_version: "1.0.0", project_name: "Demo", task_id: "task", created_at: "2026-07-19T00:00:00.000Z", target_repo_root: repo, issue_ids: [], inputs: {} } });
    const { prepareTaskWorkspace } = await import("../../../../runtime/task/workspace.mjs");
    prepareTaskWorkspace(task);

    const home = join(root, "home");
    const configDir = join(home, ".config", "workflowhub"); mkdirSync(configDir, { recursive: true });
    const packetRoot = join(root, "packets"); mkdirSync(packetRoot);
    const brokerConfig = join(root, "3rd-review.json");
    writeFileSync(brokerConfig, JSON.stringify({
      version: 4,
      tiers: [["kimi"]],
      providers: { kimi: { enabled: true } },
      attachment_roots: [{ root: packetRoot, sources: [".wh-review-packets"] }],
    }));
    writeFileSync(join(configDir, "config.json"), JSON.stringify({
      third_review: { command: [process.execPath, "/unused/3rd-review.mjs"], config: brokerConfig, attachment_root: packetRoot },
    }));
    const inputPath = join(root, "input.json");
    writeFileSync(inputPath, JSON.stringify({
      task_path: taskPath,
      project_name: "Demo",
      task_id: "task",
      stage: "make-decision",
      review_track: "direction",
      host_provider: "codex",
    }));

    const result = JSON.parse(execFileSync(process.execPath, [fileURLToPath(cli), "run", inputPath], {
      encoding: "utf8",
      env: { ...process.env, HOME: home },
    }));
    expect(result).toMatchObject({ status: "unavailable", result_ref: null, runtime_ids: {} });
    const attempt = JSON.parse(task.readRecord(result.attempt_ref));
    expect(attempt).toMatchObject({
      terminal_status: "unavailable",
      provider_attempts: [],
      error: { code: "REVIEW_ROUTE_UNAVAILABLE", message: "workflowhub host wh_review route is unavailable for make-decision.direction" },
    });
  });
});

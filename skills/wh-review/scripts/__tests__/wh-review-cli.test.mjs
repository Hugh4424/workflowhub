import { afterEach, describe, expect, it } from "vitest";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createTask } from "../../../../runtime/task/task-handle.mjs";
import { prepareTaskWorkspace } from "../../../../runtime/task/workspace.mjs";
import { reviewInstructionsFor } from "../review-materials.mjs";

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
    expect(typeof mod.runReviewRecovery).toBe("function");
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

  it("retries only terminal provider unavailability and then exposes a same-source fallback fact", async () => {
    const { runReviewRecovery } = await import(cli.href);
    const calls = [];
    const fallback = [];
    const result = await runReviewRecovery({
      task_path: "/tmp/task",
      stage: "build-code",
      materials: { frozen_packet: "packet-1" },
      snapshot_tree: "tree-1",
      material_id: "material-1",
    }, {
      runRound: async (input) => {
        calls.push(input);
        return { status: "unavailable", attempt_ref: `quality/reviews/attempts/a-${calls.length}.json`, error_code: "AUTH", snapshot_tree: "tree-1", material_id: "material-1" };
      },
      sameSourceFallback: async (input) => {
        fallback.push(input);
        return { status: "incomplete", source: "same_source", independent_context: true, evidence_ref: "quality/evidence/same-source.json" };
      },
    });
    expect(calls).toHaveLength(4);
    expect(calls.map((input) => input.snapshot_tree)).toEqual(["tree-1", "tree-1", "tree-1", "tree-1"]);
    expect(calls.some((input) => input.previous_result_ref || input.prior_attempt_refs || input.dispatch_sequence)).toBe(false);
    expect(fallback).toHaveLength(1);
    expect(result).toMatchObject({ status: "incomplete", recovery: "same_source_fallback", source: "same_source" });
    expect(result.attempt_refs).toHaveLength(4);
    expect(result.recovery_errors).toBeUndefined();
  });

  it("retries a public round exception when the frozen identity remains available", async () => {
    const { runReviewRecovery } = await import(cli.href);
    const calls = [];
    const result = await runReviewRecovery({ snapshot_tree: "tree-1", material_id: "material-1" }, {
      runRound: async () => {
        calls.push(true);
        throw Object.assign(new Error("broker process died"), { code: "PROCESS_DEAD" });
      },
    });
    expect(calls).toHaveLength(4);
    expect(result).toMatchObject({
      status: "incomplete",
      recovery: "same_source_fallback",
      source: "same_source",
      attempt_refs: [],
      snapshot_tree: "tree-1",
      material_id: "material-1",
    });
    expect(result.recovery_errors).toHaveLength(4);
  });

  it("preserves recovery failure provenance when a same-source callback returns a fact", async () => {
    const { runReviewRecovery } = await import(cli.href);
    const result = await runReviewRecovery({ snapshot_tree: "tree-1", material_id: "material-1" }, {
      runRound: async () => ({ status: "unavailable", attempt_ref: "attempt", error_code: "OUTPUT_INVALID", snapshot_tree: "tree-1", material_id: "material-1" }),
      sameSourceFallback: async () => ({ source: "same_source", independent_context: true, status: "incomplete" }),
    });
    expect(result).toMatchObject({ status: "incomplete", source: "same_source", fallback_reason: "heterologous_provider_unavailable_after_public_requests" });
    expect(result.recovery_errors).toBeUndefined();
  });

  it("does not retry material failures or semantic findings", async () => {
    const { runReviewRecovery } = await import(cli.href);
    for (const envelope of [
      { status: "unavailable", attempt_ref: "material", error_code: "MATERIAL_INCOMPLETE", snapshot_tree: "tree-1", material_id: "material-1" },
      { status: "available", result_ref: "semantic", findings: [{ severity: "minor" }], snapshot_tree: "tree-1", material_id: "material-1" },
    ]) {
      const calls = [];
      const result = await runReviewRecovery({ task_path: "/tmp/task", stage: "build-code", snapshot_tree: "tree-1", material_id: "material-1" }, {
        runRound: async () => { calls.push(true); return envelope; },
        sameSourceFallback: async () => { throw new Error("same-source fallback must not run"); },
      });
      expect(calls).toHaveLength(1);
      expect(result).toMatchObject(envelope);
    }
  });

  it("retries a missing route and stops when identity disappears", async () => {
    const { runReviewRecovery } = await import(cli.href);
    const routeCalls = [];
    const routeResult = await runReviewRecovery({ snapshot_tree: "tree-1", material_id: "material-1" }, {
      runRound: async () => { routeCalls.push(true); return { status: "unavailable", error_code: "REVIEW_ROUTE_UNAVAILABLE", snapshot_tree: "tree-1", material_id: "material-1" }; },
    });
    expect(routeCalls).toHaveLength(4);
    expect(routeResult).toMatchObject({ status: "incomplete", recovery: "same_source_fallback", source: "same_source", fallback_reason: "review_route_unavailable_after_public_requests" });

    const identityCalls = [];
    const identityResult = await runReviewRecovery({ snapshot_tree: "tree-1", material_id: "material-1" }, {
      runRound: async () => { identityCalls.push(true); return { status: "unavailable", error_code: "AUTH", attempt_ref: `attempt-${identityCalls.length}`, snapshot_tree: "tree-1" }; },
    });
    expect(identityCalls).toHaveLength(1);
    expect(identityResult).toMatchObject({ status: "incomplete", recovery: "snapshot_or_material_identity_unavailable" });
  });

  it("retries output/protocol/profile failures, but keeps cancellation terminal", async () => {
    const { runReviewRecovery } = await import(cli.href);
    for (const error_code of ["PROTOCOL_INCOMPATIBLE", "PUBLIC_RESULT_INVALID", "PROFILE_MISMATCH", "OUTPUT_INVALID", "PROVIDER_OUTPUT_INVALID"]) {
      const calls = [];
      const fallback = [];
      const result = await runReviewRecovery({ snapshot_tree: "tree-1", material_id: "material-1" }, {
        runRound: async () => {
          calls.push(true);
          return { status: "unavailable", attempt_ref: `attempt-${error_code}`, error_code, snapshot_tree: "tree-1", material_id: "material-1" };
        },
        sameSourceFallback: async () => { fallback.push(true); return { source: "same_source", independent_context: true }; },
      });
      expect(calls).toHaveLength(4);
      expect(fallback).toHaveLength(1);
      expect(result).toMatchObject({ status: "incomplete", recovery: "same_source_fallback", source: "same_source" });
    }

    const calls = [];
    const result = await runReviewRecovery({ snapshot_tree: "tree-1", material_id: "material-1" }, {
      runRound: async () => {
        calls.push(true);
        return { status: "unavailable", attempt_ref: "cancelled", error_code: "CANCELLED", snapshot_tree: "tree-1", material_id: "material-1" };
      },
      sameSourceFallback: async () => { throw new Error("same-source fallback must not run"); },
    });
    expect(calls).toHaveLength(1);
    expect(result).toMatchObject({ status: "unavailable", error_code: "CANCELLED" });
  });

  it("locks SAME_SOURCE truth even when the fallback callback returns conflicting fields", async () => {
    const { runReviewRecovery } = await import(cli.href);
    const result = await runReviewRecovery({ snapshot_tree: "tree-1", material_id: "material-1" }, {
      runRound: async ({ snapshot_tree, material_id }) => ({ status: "unavailable", error_code: "AUTH", attempt_ref: "attempt", snapshot_tree, material_id }),
      sameSourceFallback: async () => ({ status: "available", source: "heterologous", independent_context: true, snapshot_tree: "tree-2", material_id: "material-2", attempt_refs: ["forged"] }),
    });
    expect(result).toMatchObject({ status: "incomplete", source: "same_source", snapshot_tree: "tree-1", material_id: "material-1", attempt_refs: ["attempt"] });
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
    expect(result).toMatchObject({ status: "incomplete", recovery: "same_source_fallback", source: "same_source" });
    expect(result.attempt_refs).toHaveLength(4);
    const attempt = JSON.parse(task.readRecord(result.attempt_refs.at(-1)));
    expect(attempt).toMatchObject({
      terminal_status: "unavailable",
      provider_attempts: [],
      error: { code: "REVIEW_ROUTE_UNAVAILABLE", message: "workflowhub host wh_review route is unavailable for make-decision.direction" },
    });
  });

  it("uses the production run entry for one initial and three recovery requests before same-source fallback", async () => {
    const root = realpathSync(mkdtempSync(join(tmpdir(), "wh-review-cli-recovery-entry-"))); roots.push(root);
    const repo = join(root, "repo"); mkdirSync(repo);
    execFileSync("git", ["init", "-q"], { cwd: repo });
    execFileSync("git", ["config", "user.name", "Test"], { cwd: repo });
    execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: repo });
    execFileSync("git", ["commit", "--allow-empty", "-qm", "baseline"], { cwd: repo });
    const taskPath = join(root, "Projects", "Demo", "tasks", "task");
    const task = createTask({ storageRoot: root, taskPath, manifest: { schema_version: "1.0.0", project_name: "Demo", task_id: "task", created_at: "2026-07-19T00:00:00.000Z", target_repo_root: repo, issue_ids: [], inputs: {} } });
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
    const counter = join(root, "broker-count"); writeFileSync(counter, "0");
    const broker = join(root, "fake-broker.mjs");
    writeFileSync(broker, `import { readFileSync, writeFileSync } from "node:fs";
const requestPath = process.argv.find((value) => value.startsWith("--request="))?.slice("--request=".length);
const attachmentsPath = process.argv.find((value) => value.startsWith("--attachments="))?.slice("--attachments=".length);
if (!requestPath) process.exit(2);
const countPath = process.env.FAKE_REVIEW_COUNTER;
const count = Number(readFileSync(countPath, "utf8")) + 1;
writeFileSync(countPath, String(count));
const request = JSON.parse(readFileSync(requestPath, "utf8"));
const attachments = JSON.parse(readFileSync(attachmentsPath, "utf8"));
process.stdout.write(JSON.stringify({
  version: 4, outcome: "unavailable", runtime_id: "fixture-runtime-" + count, round: 0,
  host_provider: request.host_provider, selected_tier: 0,
  providers: [{
    adapter: "kimi", continuable: false, effort: null, error: { code: "AUTH", message: "fixture auth unavailable" },
    material_id: attachments.bundle_id, model: null, output: null, provider: "kimi", raw_output_ref: null,
    result_protocol: "workflowhub-result.v2", retry: { count: 0, progress_events: 0 }, runtime_id: "fixture-runtime-" + count,
    session_file_path: null, status: "failed", session_id: null, thinking: null,
    timing: { started_at_ms: 1, completed_at_ms: 2, duration_ms: 1 }, unavailable_diagnostics: null, usage: null,
  }],
}));
`);
    writeFileSync(join(configDir, "config.json"), JSON.stringify({
      third_review: { command: [process.execPath, broker], config: brokerConfig, attachment_root: packetRoot },
      wh_review: {
        version: 2,
        profiles: { kimi: { model: null, effort: null, thinking: null, priority: 1 } },
        stages: { "make-decision": { direction: { initial: ["kimi"], minimum_heterologous: 1, mode: "single_round" } } },
      },
    }));
    const inputPath = join(root, "input.json");
    writeFileSync(inputPath, JSON.stringify({
      task_path: taskPath, project_name: "Demo", task_id: "task", stage: "make-decision", review_track: "direction", host_provider: "codex",
      materials: {
        raw_requirement: "A bounded review recovery fixture.", objective_facts: "The task workspace and trusted route exist.",
        review_instructions: reviewInstructionsFor("make-decision", "direction"),
      },
    }));

    const result = JSON.parse(execFileSync(process.execPath, [fileURLToPath(cli), "run", inputPath], {
      encoding: "utf8", env: { ...process.env, HOME: home, FAKE_REVIEW_COUNTER: counter },
    }));
    expect(Number(readFileSync(counter, "utf8"))).toBe(4);
    expect(result).toMatchObject({ status: "incomplete", recovery: "same_source_fallback", source: "same_source" });
    expect(result.attempt_refs).toHaveLength(4);
    for (const attemptRef of result.attempt_refs) expect(JSON.parse(task.readRecord(attemptRef))).toMatchObject({ terminal_status: "unavailable", error: { code: "AUTH" } });
  });
});

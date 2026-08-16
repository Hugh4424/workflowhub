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
  it("rejects a non-object request with a clear boundary error", async () => {
    const { runReviewRound } = await import(cli.href);
    await expect(runReviewRound(null)).rejects.toThrow("review request must be an object");
  });

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

  it("makes one broker request and preserves terminal provider unavailability", async () => {
    const { runReviewRecovery } = await import(cli.href);
    const calls = [];
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
    });
    expect(calls).toHaveLength(1);
    expect(calls[0].snapshot_tree).toBe("tree-1");
    expect(calls.some((input) => input.previous_result_ref || input.prior_attempt_refs || input.dispatch_sequence)).toBe(false);
    expect(result).toMatchObject({ status: "unavailable", error_code: "AUTH" });
  });

  it("turns a public round exception into one unavailable fact", async () => {
    const { runReviewRecovery } = await import(cli.href);
    const calls = [];
    const result = await runReviewRecovery({ snapshot_tree: "tree-1", material_id: "material-1" }, {
      runRound: async () => {
        calls.push(true);
        throw Object.assign(new Error("broker process died"), { code: "PROCESS_DEAD" });
      },
    });
    expect(calls).toHaveLength(1);
    expect(result).toMatchObject({
      status: "unavailable",
      recovery: "run_round_exception",
      error_code: "PROCESS_DEAD",
      snapshot_tree: "tree-1",
      material_id: "material-1",
    });
  });

  it("keeps a code-less local exception out of provider failure taxonomy", async () => {
    const { runReviewRecovery } = await import(cli.href);
    const result = await runReviewRecovery({ snapshot_tree: "tree-1", material_id: "material-1" }, {
      runRound: async () => { throw new TypeError("local input is invalid"); },
    });
    expect(result).toMatchObject({ status: "unavailable", error_code: "WORKFLOWHUB_LOCAL_ERROR" });
  });

  it("rejects the retired same-source fallback callback", async () => {
    const { runReviewRecovery } = await import(cli.href);
    await expect(runReviewRecovery({ snapshot_tree: "tree-1", material_id: "material-1" }, {
      runRound: async () => ({ status: "unavailable", attempt_ref: "attempt", error_code: "OUTPUT_INVALID", snapshot_tree: "tree-1", material_id: "material-1" }),
      sameSourceFallback: async () => ({ source: "same_source", independent_context: true, status: "incomplete" }),
    })).rejects.toThrow(/sameSourceFallback is retired/);
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
      });
      expect(calls).toHaveLength(1);
      expect(result).toMatchObject(envelope);
    }
  });

  it("preserves missing-route and provider identity failures after one call", async () => {
    const { runReviewRecovery } = await import(cli.href);
    const routeCalls = [];
    const routeResult = await runReviewRecovery({ snapshot_tree: "tree-1", material_id: "material-1" }, {
      runRound: async () => { routeCalls.push(true); return { status: "unavailable", error_code: "REVIEW_ROUTE_UNAVAILABLE", snapshot_tree: "tree-1", material_id: "material-1" }; },
    });
    expect(routeCalls).toHaveLength(1);
    expect(routeResult).toMatchObject({ status: "unavailable", error_code: "REVIEW_ROUTE_UNAVAILABLE" });

    const identityCalls = [];
    const identityResult = await runReviewRecovery({ snapshot_tree: "tree-1", material_id: "material-1" }, {
      runRound: async () => { identityCalls.push(true); return { status: "unavailable", error_code: "AUTH", attempt_ref: `attempt-${identityCalls.length}`, snapshot_tree: "tree-1" }; },
    });
    expect(identityCalls).toHaveLength(1);
    expect(identityResult).toMatchObject({ status: "unavailable", error_code: "AUTH" });
  });

  it("preserves output/protocol/profile failures without a second WorkflowHub retry", async () => {
    const { runReviewRecovery } = await import(cli.href);
    for (const error_code of ["PROTOCOL_INCOMPATIBLE", "PUBLIC_RESULT_INVALID", "PROFILE_MISMATCH", "OUTPUT_INVALID", "PROVIDER_OUTPUT_INVALID"]) {
      const calls = [];
      const result = await runReviewRecovery({ snapshot_tree: "tree-1", material_id: "material-1" }, {
        runRound: async () => {
          calls.push(true);
          return { status: "unavailable", attempt_ref: `attempt-${error_code}`, error_code, snapshot_tree: "tree-1", material_id: "material-1" };
        },
      });
      expect(calls).toHaveLength(1);
      expect(result).toMatchObject({ status: "unavailable", error_code });
    }

    const calls = [];
    const result = await runReviewRecovery({ snapshot_tree: "tree-1", material_id: "material-1" }, {
      runRound: async () => {
        calls.push(true);
        return { status: "unavailable", attempt_ref: "cancelled", error_code: "CANCELLED", snapshot_tree: "tree-1", material_id: "material-1" };
      },
    });
    expect(calls).toHaveLength(1);
    expect(result).toMatchObject({ status: "unavailable", error_code: "CANCELLED" });
  });

  it("rejects a caller-provided same-source fallback", async () => {
    const { runReviewRecovery } = await import(cli.href);
    await expect(runReviewRecovery({ snapshot_tree: "tree-1", material_id: "material-1" }, {
      runRound: async ({ snapshot_tree, material_id }) => ({ status: "unavailable", error_code: "AUTH", attempt_ref: "attempt", snapshot_tree, material_id }),
      sameSourceFallback: async () => ({ status: "available", source: "heterologous", independent_context: true, snapshot_tree: "tree-2", material_id: "material-2", attempt_refs: ["forged"] }),
    })).rejects.toThrow(/sameSourceFallback is retired/);
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
      providers: { kimi: { enabled: true, source_id: "fixture-kimi-source" } },
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
    expect(result).toMatchObject({ status: "unavailable", error_code: "REVIEW_ROUTE_UNAVAILABLE" });
    expect(result.attempt_ref).toBeTruthy();
    const attempt = JSON.parse(task.readRecord(result.attempt_ref));
    expect(attempt).toMatchObject({
      terminal_status: "unavailable",
      provider_attempts: [],
      error: { code: "REVIEW_ROUTE_UNAVAILABLE", message: "workflowhub host wh_review route is unavailable for make-decision.direction" },
    });
  });

  it("uses the production run entry for one broker request and preserves the failure", async () => {
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
      providers: { kimi: { enabled: true, source_id: "fixture-kimi-source" } },
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
const runtimeId = "fixture-runtime-" + count;
const error = { code: "AUTH", message: "fixture auth unavailable" };
process.stdout.write(JSON.stringify({
  version: "workflowhub-result.v3", outcome: "partial", runtime_id: runtimeId, round: 1,
  host_provider: request.host_provider, material_id: attachments.bundle_id, selected_tier: 0,
  providers: [{
    attempts: [{ attempt_id: "fixture-attempt-" + count, completed_at_ms: 2, duration_ms: 1, error, kind: "initial", provider_retry_count: 0, session_id: null, started_at_ms: 1, status: "failed" }],
    continuable: false, deadline_ms: 360000, error,
    identity: { adapter: "kimi", config_id: "fixture-config", model: null, provider: "kimi", source_id: "fixture-kimi-source" },
    material: {
      contract_hash: request.contract_hash ?? "fixture-contract-hash",
      contract_id: request.contract_id ?? "fixture-contract",
      material_id: attachments.bundle_id,
      semantic_hash: request.semantic_hash ?? "fixture-semantic-hash",
    },
    output: null,
    provenance: { raw_output_sha256: null, raw_stderr_sha256: null, runtime_id: runtimeId },
    recovery: { fresh_execution_retry_count: 0, provider_internal_retry_count: 0, same_session_repair_count: 0 },
    result_protocol: "workflowhub-result.v3", session_id: null, status: "failed",
    timing: { started_at_ms: 1, completed_at_ms: 2, duration_ms: 1 }, usage: null,
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
      direction_selection: { current_selection: "fixture choice" },
      materials: {
        raw_requirement: "A bounded review recovery fixture.", objective_facts: "The task workspace and trusted route exist.",
        review_instructions: reviewInstructionsFor("make-decision", "direction"),
      },
    }));

    const result = JSON.parse(execFileSync(process.execPath, [fileURLToPath(cli), "run", inputPath], {
      encoding: "utf8", env: { ...process.env, HOME: home, FAKE_REVIEW_COUNTER: counter },
    }));
    expect(Number(readFileSync(counter, "utf8"))).toBe(1);
    expect(result).toMatchObject({ status: "unavailable", error_code: "AUTH" });
    expect(result.attempt_ref).toBeTruthy();
    expect(JSON.parse(task.readRecord(result.attempt_ref))).toMatchObject({ terminal_status: "unavailable", error: { code: "AUTH" } });
  });
});

import { afterEach, describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { MAX_REVIEWER_OUTPUT_BYTES, parseReviewerOutput } from "../review-output.mjs";
import { aggregateProviderResults, classifyAttempt, classificationSummary, renderReviewReport } from "../review-result.mjs";
import { ReviewProviderClient } from "../review-provider-client.mjs";
import { buildReviewMaterials, phaseDiffDeliveryForPath, requirementIds, reviewInstructionsFor } from "../review-materials.mjs";
import { actionableSeriousFindings, reviewCycleDecision, runReview, runReviewFixture, verifyFinalSubject } from "../review-runner.mjs";
import { createTask } from "../../../../runtime/task/task-handle.mjs";
import { captureExecutionSnapshot } from "../../../../runtime/task/git-worktree-snapshot.mjs";

const materialId = "a".repeat(64);
const source = {
  targetCommit: "1".repeat(40), baseCommit: "2".repeat(40), baseTree: "3".repeat(40),
  capturedHead: "4".repeat(40), snapshotTree: "5".repeat(40),
};
const pass = JSON.stringify({ findings: [] });
const revise = JSON.stringify({ findings: [{
    severity: "major", path: "a.js", line: 1, issue: "bug", root_cause: "missing guard",
    recommendation: "fix it", evidence_kind: "direct", evidence: "a.js line 1 calls the unsafe branch",
  }],
});
const temporary = [];

function identityFor(provider) {
  return { adapter: provider.split("/", 1)[0], config_id: `${provider}-config`, model: null, provider, source_id: `${provider}-source` };
}

function publicProvider(provider, {
  status = "completed", output = pass, error = null, material = materialId,
  resultProtocol = "workflowhub-result.v2", sessionFilePath = null, rawOutputRef = null, identity = null,
} = {}) {
  return {
    adapter: provider.split("/", 1)[0],
    continuable: false,
    effort: null,
    error,
    material_id: material,
    model: null,
    ...(identity === null ? {} : { identity }),
    output,
    provider,
    raw_output_ref: null,
    result_protocol: resultProtocol,
    retry: { count: 0, progress_events: 0 },
    raw_output_ref: rawOutputRef,
    runtime_id: "run",
    session_file_path: sessionFilePath,
    status,
    session_id: status === "completed" ? "session" : null,
    thinking: null,
    timing: { started_at_ms: 1, completed_at_ms: 2, duration_ms: 1 },
    unavailable_diagnostics: null,
    usage: null,
  };
}

function publicV3Provider(provider, {
  status = "completed", output = pass, error = null, material = materialId, resultProtocol = "workflowhub-result.v3",
  contractHash = "contract-hash", contractId = "contract-id", semanticHash = "semantic-hash",
} = {}) {
  return {
    attempts: [{
      attempt_id: `${provider}-attempt`, completed_at_ms: 2, duration_ms: 1,
      error, kind: "initial", provider_retry_count: 0, session_id: null, started_at_ms: 1, status,
    }],
    continuable: false, deadline_ms: 360000, error,
    identity: identityFor(provider),
    material: { contract_hash: contractHash, contract_id: contractId, material_id: material, semantic_hash: semanticHash },
    output: status === "completed" ? output : null,
    provenance: { raw_output_sha256: null, raw_stderr_sha256: null, runtime_id: "run" },
    recovery: { fresh_execution_retry_count: 0, provider_internal_retry_count: 0, same_session_repair_count: 0 },
    result_protocol: resultProtocol, session_id: null, status,
    timing: { completed_at_ms: 2, duration_ms: 1, started_at_ms: 1 }, usage: null,
  };
}

function publicV3Group(provider, options = {}) {
  return {
    host_provider: "codex", material_id: materialId, outcome: "completed",
    providers: [publicV3Provider(provider, options)], round: 1, runtime_id: "run", selected_tier: null,
    version: "workflowhub-result.v3",
  };
}

function publicV3GroupForRequest(request, provider, options = {}) {
  return publicV3Group(provider, {
    ...options,
    contractHash: request.request.contract_hash ?? "contract-hash",
    contractId: request.request.contract_id ?? "contract-id",
    semanticHash: request.request.semantic_hash ?? "semantic-hash",
  });
}

function fixture(prefix = "workflowhub-review-") {
  const root = realpathSync(mkdtempSync(join(tmpdir(), prefix)));
  temporary.push(root);
  const attachmentRoot = join(root, "attachments");
  mkdirSync(attachmentRoot);
  const task = createTask({
    storageRoot: root,
    taskPath: join(root, "Projects", "Demo", "tasks", "task"),
    manifest: {
      schema_version: "1.0.0", project_name: "Demo", task_id: "task",
      created_at: "2026-07-16T00:00:00.000Z", target_repo_root: join(root, "repo"),
      issue_ids: [], inputs: {},
    },
  });
  return { root, attachmentRoot, task };
}

function groupClient(providers, calls = []) {
  return {
    runGroup: async (request) => {
      calls.push(request);
      return { runtimeId: "group-runtime", providers };
    },
  };
}

function materialBuilder() {
  return () => ({ bundleRoot: "unused", materialId, manifest: [] });
}

function anchoredMaterialBuilder() {
  const bundleRoot = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-review-bundle-")));
  temporary.push(bundleRoot);
  const content = "export const value = 1;\n";
  writeFileSync(join(bundleRoot, "a.js"), content);
  return () => ({ bundleRoot, materialId, manifest: [{ path: "a.js", bytes: Buffer.byteLength(content), sha256: createHash("sha256").update(content).digest("hex") }] });
}

afterEach(() => { while (temporary.length) rmSync(temporary.pop(), { recursive: true, force: true }); });

describe("review output and facts", () => {
  it("accepts one JSON reviewer object and rejects extra output", () => {
    expect(parseReviewerOutput(pass)).toEqual({ findings: [] });
    expect(parseReviewerOutput(`note\n\`\`\`json\n${revise}\n\`\`\``).findings).toHaveLength(1);
    expect(() => parseReviewerOutput(`\`\`\`json\n${pass}\n\`\`\`\n\`\`\`json\n${pass}\n\`\`\``)).toThrow(/OUTPUT_INVALID/);
    expect(() => parseReviewerOutput("not json")).toThrow(/OUTPUT_INVALID/);
    expect(() => parseReviewerOutput(JSON.stringify({
      findings: [{
        severity: "major", path: "a.js", issue: "bug", recommendation: "fix",
      }],
    }), { requireEvidence: true })).toThrow(/evidence/);
  });

  it("rejects an overlong reviewer response without truncating or retrying it", () => {
    const valid = JSON.stringify({ findings: [] });
    const atLimit = `${valid}${" ".repeat(MAX_REVIEWER_OUTPUT_BYTES - Buffer.byteLength(valid, "utf8"))}`;
    expect(parseReviewerOutput(atLimit)).toEqual({ findings: [] });
    expect(() => parseReviewerOutput(`${atLimit}x`)).toThrow(new RegExp(`exceeds ${MAX_REVIEWER_OUTPUT_BYTES} bytes`));
  });

  it("keeps provider failures separate from finding quality facts", () => {
    const attempt = { provider_attempts: [
      { provider: "kimi", status: "completed", error: null, execution: { timing: { duration_ms: 10 } } },
      { provider: "opencode", status: "failed", error: { code: "OUTPUT_INVALID" }, execution: { timing: { duration_ms: 20 } } },
    ] };
    expect(classifyAttempt(attempt.provider_attempts[0])).toBe("completed");
    expect(classifyAttempt(attempt.provider_attempts[1])).toBe("OUTPUT_INVALID");
    expect(classificationSummary(attempt)).toMatchObject({
      attempt: { completed: 1, OUTPUT_INVALID: 1 }, failed_duration_ms: 20, quality_denominator: 1,
    });
  });

  it("keeps broker recovery counters in cost facts", () => {
    const summary = classificationSummary({ provider_attempts: [{
      provider: "codex/luna", status: "completed", error: null,
      execution: {
        timing: { duration_ms: 10 }, retry: { count: 2, progress_events: 0 },
        recovery: { provider_internal_retry_count: 2, fresh_execution_retry_count: 1, same_session_repair_count: 3 },
      },
    }] });
    expect(summary.retry_count).toBe(6);
    expect(summary.retry_breakdown).toEqual({
      outer_execution_retry_count: 0,
      provider_internal_retry_count: 2,
      fresh_execution_retry_count: 1,
      same_session_repair_count: 3,
    });
  });

  it("reports configured effort separately when the public broker result does not expose it", () => {
    const report = renderReviewReport({
      attempt: {
        stage: "build-code", attempt_id: "attempt", task_id: "task", subject_kind: "worktree", phase_id: null,
        snapshot_tree: "a".repeat(40), material_id: "b".repeat(64), terminal_status: "semantic", provider_attempts: [{
          provider: "opencode/v4flash", status: "completed", error: null, session_id: null, runtime_id: "runtime",
          unavailable_diagnostics: null,
          execution: { adapter: "opencode", model: "deepseek", effort: null, thinking: null, timing: { duration_ms: 1 }, usage: null },
        }],
        review_policy: {
          source: "wh_review.v2", mode: "full_only", requested_profiles: ["opencode/v4flash"],
          requested_profile_specs: [{ provider: "opencode/v4flash", priority: 1, model: "deepseek", effort: "max", thinking: null }],
          eligible_profiles: ["opencode/v4flash"], same_source_exclusions: [],
        },
        coverage: { mode: "parallel_external", valid_provider_count: 1, minimum_required: 1 },
      },
    });
    expect(report).toContain("effort=UNAVAILABLE (configured=max)");
  });

  it("reports configured tuning as broker-attested when v3 carries profile identity", () => {
    const report = renderReviewReport({
      attempt: {
        stage: "build-code", attempt_id: "attempt", task_id: "task", subject_kind: "worktree", phase_id: null,
        snapshot_tree: "a".repeat(40), material_id: "b".repeat(64), terminal_status: "semantic", provider_attempts: [{
          provider: "opencode/v4flash", status: "completed", error: null, session_id: null, runtime_id: "runtime",
          identity: { provider: "opencode/v4flash", adapter: "opencode", source_id: "opencode-source", config_id: "broker-config", model: "deepseek" },
          unavailable_diagnostics: null,
          execution: { adapter: "opencode", model: "deepseek", effort: null, thinking: null, timing: { duration_ms: 1 }, usage: null },
        }],
        review_policy: {
          source: "wh_review.v2", mode: "full_only", requested_profiles: ["opencode/v4flash"],
          requested_profile_specs: [{ provider: "opencode/v4flash", priority: 1, model: "deepseek", effort: "max", thinking: true }],
          eligible_profiles: ["opencode/v4flash"], same_source_exclusions: [],
        },
        coverage: { mode: "parallel_external", valid_provider_count: 1, minimum_required: 1 },
      },
    });
    expect(report).toContain("effort=BROKER_CONFIG_ATTESTED (configured=max)");
    expect(report).toContain("thinking=BROKER_CONFIG_ATTESTED (configured=true)");
  });

  it.each([
    "PROVIDER_OUTPUT_INVALID",
    "PROVIDER_NO_TERMINAL_RESULT",
    "PROCESS_TIMEOUT",
    "RATE_LIMITED",
    "CANCELLED",
  ])("keeps broker failure code %s out of UNKNOWN", (code) => {
    const providerAttempt = {
      provider: "opencode/v4flash",
      status: "failed",
      error: { code },
      execution: { timing: { duration_ms: 20 } },
    };

    expect(classifyAttempt(providerAttempt)).toBe(code);
    expect(classificationSummary({ provider_attempts: [providerAttempt] })).toMatchObject({
      attempt: { [code]: 1, UNKNOWN: 0 },
      failure_taxonomy: { [code]: { code, count: 1 } },
    });
  });

  it("aggregates direct evidence without turning one invalid anchor into a pass finding", () => {
    const direct = { provider: "kimi/coding", review: { findings: [{ severity: "major", path: "a.js", line: 1, issue: "x", recommendation: "fix", evidence_kind: "direct", evidence: "a.js:1", root_cause: "unsafe branch" }] }, final: { status: "completed" }, calls: [], evidenceAnchors: [true] };
    const invalid = { provider: "opencode/v4flash", review: direct.review, final: { status: "completed" }, calls: [], evidenceAnchors: [false] };
    expect(aggregateProviderResults([direct, invalid], 1).adjudication.clusters[0]).toMatchObject({ disposition: "actionable" });
  });

  it("does not pass a review when the configured quorum is not met", () => {
    const result = aggregateProviderResults([
      { provider: "kimi/k3", review: JSON.parse(pass) },
      { provider: "opencode/v4flash", review: null },
    ], 2);
    expect(result).toMatchObject({ status: "unavailable", valid: [{ provider: "kimi/k3" }] });
  });

  it("keeps build-code serious finding closure bounded without a provider pass", () => {
    const serious = { id: "F-serious", severity: "major", disposition: "actionable", path: "a.js", line: 1, issue: "unsafe branch" };
    const current = { findings: [serious], adjudication: { clusters: [serious] } };
    expect(actionableSeriousFindings(current)).toEqual([serious]);
    expect(reviewCycleDecision({ stage: "build-code", result: current })).toMatchObject({ status: "needs_human", action: "stop" });
    expect(reviewCycleDecision({ stage: "build-code", result: current, actualRepair: true })).toMatchObject({ status: "focused_review_required", action: "review_once" });
    expect(reviewCycleDecision({ stage: "build-code", result: current, previousResult: current, actualRepair: true })).toMatchObject({ status: "needs_human", reason: "same_important_finding_repeated_after_focused_review" });
    expect(reviewCycleDecision({ stage: "build-code", result: { findings: [], adjudication: { clusters: [] } } })).toMatchObject({ status: "clean_current_review", action: "stop" });
    expect(reviewCycleDecision({ stage: "build-code", result: { status: "unavailable" } })).toMatchObject({ status: "incomplete", action: "stop" });
  });

  it("makes each stage prompt explicit about its focus and advice-only boundary", () => {
    expect(reviewInstructionsFor("make-decision", "direction")).toMatch(/raw requirement.*user flow/i);
    expect(reviewInstructionsFor("build-spec")).toMatch(/approved decision.*acceptance/i);
    expect(reviewInstructionsFor("build-plan")).toMatch(/plan and tasks.*dependency order/i);
    expect(reviewInstructionsFor("build-code", null, false, "phase")).toMatch(/current Phase diff.*actionable major or blocking/i);
    expect(reviewInstructionsFor("build-code", null, false, "integration")).toMatch(/final current worktree.*actionable major or blocking/i);
    expect(reviewInstructionsFor("build-code", null, false, "phase")).toMatch(/changes\.diff/i);
    expect(reviewInstructionsFor("build-code", null, false, "integration")).not.toMatch(/changes\.diff/i);
    expect(reviewInstructionsFor("verify-code")).toMatch(/advice only/i);
    expect(reviewInstructionsFor("build-code")).toMatch(/按根因合并同类问题/);
    expect(reviewInstructionsFor("build-code")).toMatch(/最小必要的 issue.*root_cause.*recommendation/i);
    for (const prompt of [
      reviewInstructionsFor("make-decision", "direction"),
      reviewInstructionsFor("build-spec"),
      reviewInstructionsFor("build-plan"),
      reviewInstructionsFor("build-code", null, false, "integration"),
      reviewInstructionsFor("verify-code"),
    ]) expect(prompt).toMatch(/unavailable.*not advice.*not empty findings.*not pass/i);
  });

  it("gives the broker a bounded manifest-first reading contract", async () => {
    const calls = [];
    const { attachmentRoot, task } = fixture("review-bounded-prompt-");
    await runReviewFixture({
      task, attachmentRoot, taskId: "task", stage: "build-code", materials: {}, hostProvider: "codex", providers: ["kimi"],
      providerClient: groupClient([publicProvider("kimi")], calls), captureSource: () => source, buildMaterials: materialBuilder(),
    });
    expect(calls).toHaveLength(1);
    expect(calls[0].prompt).toMatch(/manifest\.json.*packet-plan\.json/i);
    expect(calls[0].prompt).toMatch(/only manifest entries marked required/i);
    expect(calls[0].prompt).toMatch(/canonical archives.*out-of-scope summary shards/i);
    expect(calls[0].prompt).not.toMatch(/complete frozen bundle/i);
  });

  it("executes direction as blind reconstruction then reveal, while publishing one fact", async () => {
    const calls = [];
    const { attachmentRoot, task } = fixture("review-direction-reveal-");
    const providerClient = {
      runGroup: async (request) => {
        calls.push(request);
        return { runtimeId: `direction-runtime-${calls.length}`, providers: [publicProvider("kimi", { output: pass })] };
      },
    };
    const result = await runReviewFixture({
      task, attachmentRoot, taskId: "task", stage: "make-decision", reviewTrack: "direction",
      materials: { raw_requirement: "需要可靠交付。", objective_facts: ["当前审查重复"] },
      directionSelection: { current_selection: "方案 A", selection_rationale: "减少重复调用" },
      hostProvider: "codex", providers: ["kimi"], providerClient,
      captureSource: () => source,
    });
    expect(result.status).toBe("available");
    expect(calls).toHaveLength(2);
    expect(calls[0].prompt).toMatch(/reconstruct/i);
    expect(calls[1].prompt).toMatch(/reveal|current choice|blind reconstruction/i);
    expect(existsSync(join(calls[0].materials.bundleRoot, "requirements/current_selection.md"))).toBe(false);
    expect(readFileSync(join(calls[1].materials.bundleRoot, "requirements/current_selection.md"), "utf8")).toMatch(/方案 A/);
    const attempt = JSON.parse(task.readRecord(result.attemptRef));
    expect(attempt.provider_attempts).toHaveLength(2);
    expect(JSON.parse(task.readRecord(result.resultRef))).toMatchObject({ findings: [], review_track: "direction" });
  });
});

describe("broker boundary", () => {
  it("uses one public broker run for a provider group and preserves runtime facts", async () => {
    const calls = [];
    const client = new ReviewProviderClient({
      invoke: async (request) => {
        calls.push(request);
        return { exitCode: 0, stdout: JSON.stringify(publicV3GroupForRequest(request, "kimi/k3")), stderr: "" };
      },
    });
    const result = await client.runGroup({ hostProvider: "codex", providers: ["kimi/k3"], materials: { bundleRoot: "/tmp/bundle", attachmentRoot: "/tmp", sourcePrefix: ".wh-review-packets/bundle", materialId, manifest: [] }, prompt: "review" });
    expect(calls).toHaveLength(1);
    expect(calls[0].command).toBe("run");
    expect(calls[0].request).not.toHaveProperty("continuation");
    expect(result.runtimeId).toBe("run");
    expect(result.outcome).toBe("completed");
    expect(result.round).toBe(1);
    expect(result.providers[0].provider).toBe("kimi/k3");
  });

  it("rejects a provider result bound to another material or an old result protocol", async () => {
    const materials = { bundleRoot: "/tmp/bundle", attachmentRoot: "/tmp", sourcePrefix: ".wh-review-packets/bundle", materialId, manifest: [] };
    const mismatch = new ReviewProviderClient({ invoke: async (request) => ({
      exitCode: 0,
      stdout: JSON.stringify(publicV3GroupForRequest(request, "kimi", { material: "b".repeat(64) })),
      stderr: "",
    }) });
    await expect(mismatch.runGroup({ hostProvider: "codex", providers: ["kimi"], materials, prompt: "review" })).rejects.toThrow(/MATERIAL_INCOMPLETE/);

    const v1 = new ReviewProviderClient({ invoke: async (request) => ({
      exitCode: 0,
      stdout: JSON.stringify(publicV3GroupForRequest(request, "kimi", { resultProtocol: "workflowhub-result.v1" })),
      stderr: "",
    }) });
    await expect(v1.runGroup({ hostProvider: "codex", providers: ["kimi"], materials, prompt: "review" })).rejects.toThrow(/PROTOCOL_INCOMPATIBLE/);
  });

  it("delivers review bundles as file-only attachments without embedding their bytes", async () => {
    const calls = [];
    const client = new ReviewProviderClient({ invoke: async (request) => {
      calls.push(request);
      return { exitCode: 0, stdout: JSON.stringify(publicV3GroupForRequest(request, "kimi")), stderr: "" };
    } });
    await client.runGroup({
      hostProvider: "codex", providers: ["kimi"],
      materials: { bundleRoot: "/tmp/bundle", attachmentRoot: "/tmp", sourcePrefix: ".wh-review-packets/bundle", materialId, manifest: [{ path: "changes.diff", bytes: 800000, sha256: "f".repeat(64) }] },
      prompt: "review bundle",
    });
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({ command: "run", attachmentDelivery: "file_only", request: { prompt: "review bundle" } });
    expect(calls[0].attachments.entries).toEqual([{ source: ".wh-review-packets/bundle/changes.diff", destination: "changes.diff", size: 800000, sha256: "f".repeat(64), embed: false }]);
  });

  it("does not create a WorkflowHub review lock or local lifecycle", async () => {
    const { attachmentRoot, task } = fixture("review-lock-");
    const result = await runReviewFixture({
      task, attachmentRoot, taskId: "task", stage: "build-code", materials: {}, hostProvider: "codex", providers: ["kimi"],
      providerClient: groupClient([publicProvider("kimi")]), captureSource: () => source, buildMaterials: materialBuilder(),
    });
    expect(result.status).toBe("available");
    expect(existsSync(join(task.taskPath, "locks"))).toBe(false);
    expect(existsSync(join(attachmentRoot, ".workflowhub-review-locks"))).toBe(false);
  });

  it("records one semantic result with no lineage or continuation fields", async () => {
    const { attachmentRoot, task } = fixture("review-semantic-");
    const result = await runReviewFixture({
      task, attachmentRoot, taskId: "task", stage: "build-code", materials: {}, hostProvider: "codex", providers: ["kimi"],
      providerClient: groupClient([publicProvider("kimi")]), captureSource: () => source, buildMaterials: materialBuilder(),
    });
    const attempt = JSON.parse(task.readRecord(result.attemptRef));
    const semantic = JSON.parse(task.readRecord(result.resultRef));
    expect(attempt).toMatchObject({ terminal_status: "semantic", provider_attempts: [{ runtime_id: "group-runtime" }] });
    expect(semantic).toMatchObject({ version: "wh-review-result.v1", attempt_ref: result.attemptRef, findings: [] });
    expect(semantic).not.toHaveProperty("verdict");
    for (const record of [attempt, semantic]) {
      expect(record).not.toHaveProperty("lineage");
      expect(record).not.toHaveProperty("classification_manifest");
    }
  });

  it("reuses an unchanged semantic review without another provider call", async () => {
    const calls = [];
    const { attachmentRoot, task } = fixture("review-semantic-reuse-");
    const first = await runReviewFixture({
      task, attachmentRoot, taskId: "task", stage: "build-plan", materials: { draft_plan: "按依赖顺序执行" },
      hostProvider: "codex", providers: ["kimi"], providerClient: groupClient([publicProvider("kimi")], calls),
      captureSource: () => source, buildMaterials: materialBuilder(),
    });
    const second = await runReviewFixture({
      task, attachmentRoot, taskId: "task", stage: "build-plan", materials: { draft_plan: "按依赖顺序执行" },
      hostProvider: "codex", providers: ["kimi"], providerClient: {
        runGroup: async () => { throw new Error("provider must not be called for semantic reuse"); },
      }, captureSource: () => source, buildMaterials: materialBuilder(),
    });
    expect(first.status).toBe("available");
    expect(second).toMatchObject({ status: "available", reused: true, resultRef: first.resultRef });
    expect(calls).toHaveLength(1);
  });

  it("reuses an unchanged semantic review when only target HEAD advances", async () => {
    const calls = [];
    const { attachmentRoot, task } = fixture("review-semantic-target-advance-");
    let targetCommit = source.targetCommit;
    const capture = () => ({ ...source, targetCommit });
    const first = await runReviewFixture({
      task, attachmentRoot, taskId: "task", stage: "build-plan", materials: { draft_plan: "按依赖顺序执行" },
      hostProvider: "codex", providers: ["kimi"], providerClient: groupClient([publicProvider("kimi")], calls),
      captureSource: capture, buildMaterials: materialBuilder(),
    });
    targetCommit = "9".repeat(40);
    const second = await runReviewFixture({
      task, attachmentRoot, taskId: "task", stage: "build-plan", materials: { draft_plan: "按依赖顺序执行" },
      hostProvider: "codex", providers: ["kimi"], providerClient: {
        runGroup: async () => { throw new Error("provider must not be called when only target HEAD advances"); },
      }, captureSource: capture, buildMaterials: materialBuilder(),
    });
    expect(first.status).toBe("available");
    expect(second).toMatchObject({ status: "available", reused: true, resultRef: first.resultRef });
    expect(calls).toHaveLength(1);
  });

  it("proves material-only writeback reuses the old result against real snapshot trees", async () => {
    const calls = [];
    const { root, attachmentRoot, task } = fixture("review-semantic-real-reuse-");
    const repo = join(root, "review-repo");
    mkdirSync(repo);
    const git = (args) => execFileSync("git", args, { cwd: repo, encoding: "utf8" }).trim();
    git(["init", "-q"]);
    git(["config", "user.name", "WorkflowHub Tests"]);
    git(["config", "user.email", "tests@workflowhub.local"]);
    writeFileSync(join(repo, "implementation.mjs"), "export const value = 1;\n");
    mkdirSync(join(repo, "specs", "task"), { recursive: true });
    writeFileSync(join(repo, "specs", "task", "tasks.md"), "# task material\n\n### 执行状态填写区\n事实 v1\n");
    git(["add", "."]); git(["commit", "-qm", "base"]);
    let changed = false;
    const capture = () => {
      const snapshot = captureExecutionSnapshot(repo);
      const head = git(["rev-parse", "HEAD"]);
      const baseTree = git(["rev-parse", "HEAD^{tree}"]);
      return {
        targetCommit: head, baseCommit: head, baseTree, capturedHead: head, snapshotTree: snapshot.tree,
        sourceRoot: repo, changedFiles: [], dispose() {},
      };
    };
    const first = await runReviewFixture({
      task, attachmentRoot, taskId: "task", stage: "build-plan", materials: { draft_plan: "同一计划", draft_tasks: "# Tasks\n\n#### T010\n- 任务：实现核心行为\n\n##### 执行状态填写区（唯一完成权威）\n- status: pending\n" },
      hostProvider: "codex", providers: ["kimi"], providerClient: groupClient([publicProvider("kimi")], calls),
      captureSource: capture, buildMaterials: materialBuilder(),
    });
    writeFileSync(join(repo, "specs", "task", "tasks.md"), "# task material\n\n### 执行状态填写区\n事实 v2\n");
    git(["add", "specs/task/tasks.md"]); git(["commit", "-qm", "record execution fact"]);
    changed = true;
    const second = await runReviewFixture({
      task, attachmentRoot, taskId: "task", stage: "build-plan", materials: { draft_plan: "同一计划", draft_tasks: "# Tasks\n\n#### T010\n- 任务：实现核心行为\n\n##### 执行状态填写区（唯一完成权威）\n- status: completed\n- 执行事实：已写回结果\n" },
      hostProvider: "codex", providers: ["kimi"], providerClient: {
        runGroup: async () => { throw new Error("provider must not be called for material-only reuse"); },
      }, captureSource: () => {
        if (!changed) throw new Error("expected material writeback before second capture");
        return capture();
      }, buildMaterials: materialBuilder(),
    });
    expect(second).toMatchObject({ status: "available", reused: true });
    expect(second.resultRef).not.toBe(first.resultRef);
    expect(JSON.parse(task.readRecord(second.resultRef))).toMatchObject({
      reuse: { source_result_ref: first.resultRef, reason: "semantic_hash_unchanged_material_only" },
      snapshot_tree: second.snapshotTree,
      attempt_ref: second.attemptRef,
    });
    expect(JSON.parse(task.readRecord(second.attemptRef))).toMatchObject({
      attempt_id: second.attemptRef.split("/").at(-2), snapshot_tree: second.snapshotTree, terminal_status: "semantic",
    });
    const reusedAttempt = JSON.parse(task.readRecord(second.attemptRef));
    const reusedAttemptId = second.attemptRef.split("/").at(-2);
    for (const providerAttempt of reusedAttempt.provider_attempts) {
      if (!providerAttempt.output_ref) continue;
      const output = JSON.parse(task.readRecord(providerAttempt.output_ref));
      expect(output.attempt_id).toBe(reusedAttemptId);
      expect(output.provider).toBe(providerAttempt.provider);
    }
    expect(calls).toHaveLength(1);
  });

  it("does not copy broker-private raw-output references into the public v3 fact", async () => {
    const { attachmentRoot, task } = fixture("review-raw-output-ref-");
    const providerClient = new ReviewProviderClient({ invoke: async (request) => ({
      exitCode: 0,
      stdout: JSON.stringify(publicV3GroupForRequest(request, "kimi")),
      stderr: "",
    }) });
    const result = await runReviewFixture({
      task, attachmentRoot, taskId: "task", stage: "build-code", materials: {}, hostProvider: "codex", providers: ["kimi"],
      providerClient, captureSource: () => source, buildMaterials: materialBuilder(),
    });
    const attempt = JSON.parse(task.readRecord(result.attemptRef));
    expect(attempt.provider_attempts[0].raw_output_ref).toBeNull();
  });

  it("records malformed provider output once without a correction call", async () => {
    const { attachmentRoot, task } = fixture("review-output-invalid-");
    const calls = [];
    const result = await runReviewFixture({
      task, attachmentRoot, taskId: "task", stage: "build-code", materials: {}, hostProvider: "codex", providers: ["kimi"],
      providerClient: groupClient([publicProvider("kimi", { output: "not json" })], calls), captureSource: () => source, buildMaterials: materialBuilder(),
    });
    expect(result).toMatchObject({ status: "unavailable", resultRef: null });
    expect(calls).toHaveLength(1);
    expect(JSON.parse(task.readRecord(result.attemptRef)).provider_attempts[0].error).toMatchObject({ code: "OUTPUT_INVALID" });
  });

  it("keeps a terminal unavailable group unavailable even when a member has output", async () => {
    const { attachmentRoot, task } = fixture("review-group-outcome-");
    const result = await runReviewFixture({
      task, attachmentRoot, taskId: "task", stage: "build-code", materials: {}, hostProvider: "codex", providers: ["kimi"],
      providerClient: {
        runGroup: async () => ({
          runtimeId: "group-runtime", outcome: "unavailable", round: 1, selectedTier: null,
          providers: [publicProvider("kimi")],
        }),
      }, captureSource: () => source, buildMaterials: materialBuilder(),
    });
    expect(result).toMatchObject({ status: "unavailable", resultRef: null });
    const attempt = JSON.parse(task.readRecord(result.attemptRef));
    expect(attempt).toMatchObject({
      coverage: { group_outcome: "unavailable" },
      error: { code: "GROUP_OUTCOME_UNAVAILABLE" },
      provider_attempts: [{ provider: "kimi", status: "completed", error: null }],
    });
  });

  it("records provider unavailability without claiming semantic completion", async () => {
    const { attachmentRoot, task } = fixture("review-unavailable-");
    const result = await runReviewFixture({
      task, attachmentRoot, taskId: "task", stage: "build-code", materials: {}, hostProvider: "codex", providers: ["kimi"],
      providerClient: groupClient([publicProvider("kimi", { status: "failed", output: null, error: { code: "AUTH", message: "missing" } })]),
      captureSource: () => source, buildMaterials: materialBuilder(),
    });
    expect(result).toMatchObject({ status: "unavailable", resultRef: null });
    expect(JSON.parse(task.readRecord(result.attemptRef))).toMatchObject({ terminal_status: "unavailable", error: { code: "AUTH" } });
  });

  it("preserves failed provider transport facts without turning a sibling result into pass", async () => {
    const { attachmentRoot, task } = fixture("review-partial-transport-");
    const result = await runReviewFixture({
      task, attachmentRoot, taskId: "task", stage: "build-plan", hostProvider: "codex", providers: ["kimi", "opencode"],
      providerClient: groupClient([
        publicProvider("kimi"),
        publicProvider("opencode", { status: "failed", output: pass, error: { code: "PROCESS_DEAD", message: "provider received SIGTERM" } }),
      ]), captureSource: () => source, buildMaterials: materialBuilder(),
    });
    expect(result.status).toBe("available");
    const attempt = JSON.parse(task.readRecord(result.attemptRef));
    const semantic = JSON.parse(task.readRecord(result.resultRef));
    expect(attempt).toMatchObject({ terminal_status: "semantic", coverage: { selected_profiles: ["kimi", "opencode"], valid_provider_count: 1 } });
    expect(attempt.provider_attempts).toEqual(expect.arrayContaining([
      expect.objectContaining({ provider: "opencode", status: "failed", error: { code: "PROCESS_DEAD", message: "provider received SIGTERM" } }),
    ]));
    expect(semantic.provider_results).toEqual([{ provider: "kimi", output: { findings: [] } }]);
    expect(semantic).not.toHaveProperty("verdict");
  });

  it("keeps configured profiles that share an adapter as separate review members", async () => {
    const { attachmentRoot, task } = fixture("review-same-adapter-profiles-");
    const reviewPolicy = {
      source: "wh_review.v2", mode: "adaptive", minimum_heterologous: 1,
      requested_profiles: ["kimi/k3", "kimi/coding"],
      eligible_profiles: ["kimi/k3", "kimi/coding"], same_source_exclusions: [],
      effective_profiles: [
        { provider: "kimi/k3", adapter: "kimi", model: null, effort: null, thinking: null },
        { provider: "kimi/coding", adapter: "kimi", model: null, effort: null, thinking: null },
      ],
    };
    const result = await runReviewFixture({
      task, attachmentRoot, taskId: "task", stage: "build-plan", hostProvider: "codex",
      providers: ["kimi/k3", "kimi/coding"], reviewPolicy,
      providerClient: groupClient([
        publicProvider("kimi/k3", { identity: identityFor("kimi/k3") }),
        publicProvider("kimi/coding", { identity: identityFor("kimi/coding") }),
      ]),
      captureSource: () => source, buildMaterials: materialBuilder(),
    });
    expect(result.status).toBe("available");
    const attempt = JSON.parse(task.readRecord(result.attemptRef));
    expect(attempt.coverage).toMatchObject({ selected_profiles: ["kimi/k3", "kimi/coding"], selected_count: 2, valid_provider_count: 2 });
    expect(attempt.provider_attempts.map(({ provider }) => provider)).toEqual(["kimi/k3", "kimi/coding"]);
  });

  it("does not publish a reused result when the current quorum no longer holds", async () => {
    const calls = [];
    const { attachmentRoot, task } = fixture("review-reuse-policy-quorum-");
    const basePolicy = {
      source: "wh_review.v2", mode: "adaptive", minimum_heterologous: 1,
      requested_profiles: ["kimi/k3", "kimi/coding"],
      eligible_profiles: ["kimi/k3", "kimi/coding"], same_source_exclusions: [],
      effective_profiles: [
        { provider: "kimi/k3", adapter: "kimi", model: null, effort: null, thinking: null },
        { provider: "kimi/coding", adapter: "kimi", model: null, effort: null, thinking: null },
      ],
    };
    const first = await runReviewFixture({
      task, attachmentRoot, taskId: "task", stage: "build-plan", materials: { draft_plan: "同一计划" },
      hostProvider: "codex", providers: basePolicy.requested_profiles, reviewPolicy: basePolicy,
      providerClient: groupClient([
        publicProvider("kimi/k3", { identity: identityFor("kimi/k3") }),
        publicProvider("kimi/coding", { identity: identityFor("kimi/coding") }),
      ], calls),
      captureSource: () => source, buildMaterials: materialBuilder(),
    });
    const stricterPolicy = { ...basePolicy, minimum_heterologous: 2 };
    const second = await runReviewFixture({
      task, attachmentRoot, taskId: "task", stage: "build-plan", materials: { draft_plan: "同一计划" },
      hostProvider: "codex", providers: stricterPolicy.requested_profiles, reviewPolicy: stricterPolicy,
      providerClient: groupClient([
        publicProvider("kimi/k3", { identity: identityFor("kimi/k3") }),
        publicProvider("kimi/coding", { identity: identityFor("kimi/coding") }),
      ], calls),
      captureSource: () => source, buildMaterials: materialBuilder(),
    });
    expect(first.status).toBe("available");
    expect(second.status).toBe("unavailable");
    expect(calls).toHaveLength(2);
  });

  it("does not reuse a semantic result when the current policy snapshot changes", async () => {
    const calls = [];
    const { attachmentRoot, task } = fixture("review-reuse-policy-snapshot-");
    const basePolicy = {
      source: "wh_review.v2", mode: "adaptive", minimum_heterologous: 1,
      requested_profiles: ["kimi/k3", "kimi/coding"], eligible_profiles: ["kimi/k3", "kimi/coding"], same_source_exclusions: [],
      effective_profiles: [
        { provider: "kimi/k3", adapter: "kimi", model: null, effort: null, thinking: null },
        { provider: "kimi/coding", adapter: "kimi", model: null, effort: null, thinking: null },
      ],
    };
    const providers = [
      publicProvider("kimi/k3", { identity: identityFor("kimi/k3") }),
      publicProvider("kimi/coding", { identity: identityFor("kimi/coding") }),
    ];
    const first = await runReviewFixture({
      task, attachmentRoot, taskId: "task", stage: "build-plan", materials: { draft_plan: "同一计划" },
      hostProvider: "codex", providers: basePolicy.requested_profiles, reviewPolicy: basePolicy,
      providerClient: groupClient(providers, calls), captureSource: () => source, buildMaterials: materialBuilder(),
    });
    const changedPolicy = { ...basePolicy, mode: "full_on_structural_rework" };
    const second = await runReviewFixture({
      task, attachmentRoot, taskId: "task", stage: "build-plan", materials: { draft_plan: "同一计划" },
      hostProvider: "codex", providers: changedPolicy.requested_profiles, reviewPolicy: changedPolicy,
      providerClient: groupClient(providers, calls), captureSource: () => source, buildMaterials: materialBuilder(),
    });
    expect(first.status).toBe("available");
    expect(second.status).toBe("available");
    expect(second.reused).not.toBe(true);
    expect(calls).toHaveLength(2);
  });

  it("treats a path-only direct finding as invalid evidence", async () => {
    const { attachmentRoot, task } = fixture("review-path-only-anchor-");
    const pathOnly = JSON.stringify({ findings: [{
      severity: "major", path: "a.js", issue: "unsafe branch", root_cause: "missing guard",
      recommendation: "fix it", evidence_kind: "direct", evidence: "a.js exists",
    }] });
    const result = await runReviewFixture({
      task, attachmentRoot, taskId: "task", stage: "build-code", materials: {}, hostProvider: "codex", providers: ["kimi"],
      providerClient: groupClient([publicProvider("kimi", { output: pathOnly })]), captureSource: () => source,
      buildMaterials: anchoredMaterialBuilder(),
    });
    expect(result.status).toBe("available");
    expect(JSON.parse(task.readRecord(result.resultRef)).adjudication.clusters[0]).toMatchObject({ disposition: "invalid_evidence", evidence_status: "invalid_anchor" });
  });

  it("accepts a packet path anchor when the reviewer omits an unreliable line", async () => {
    const { attachmentRoot, task } = fixture("review-path-anchor-without-line-");
    const finding = JSON.stringify({ findings: [{
      severity: "major", path: "a.js", issue: "unsafe branch", root_cause: "missing guard",
      recommendation: "fix it", evidence_kind: "direct", evidence: "a.js exports the unsafe branch without the required guard",
    }] });
    const result = await runReviewFixture({
      task, attachmentRoot, taskId: "task", stage: "build-code", materials: {}, hostProvider: "codex", providers: ["kimi"],
      providerClient: groupClient([publicProvider("kimi", { output: finding })]), captureSource: () => source,
      buildMaterials: anchoredMaterialBuilder(),
    });
    expect(result.status).toBe("available");
    expect(JSON.parse(task.readRecord(result.resultRef)).adjudication.clusters[0]).toMatchObject({ disposition: "actionable", evidence_status: "direct" });
  });

  it("sends mixed attachment-delivery profiles in one complete broker group", async () => {
    const calls = [];
    const { attachmentRoot, task } = fixture("review-mixed-delivery-group-");
    const result = await runReviewFixture({
      task, attachmentRoot, taskId: "task", stage: "build-plan", hostProvider: "codex/host",
      providers: ["kimi/coding", "codex/luna"],
      providerClient: groupClient([publicProvider("kimi/coding"), publicProvider("codex/luna")], calls),
      captureSource: () => source, buildMaterials: materialBuilder(),
    });
    expect(result.status).toBe("available");
    expect(calls).toHaveLength(1);
    expect(calls[0].providers).toEqual(["kimi/coding", "codex/luna"]);
    expect(calls[0]).not.toHaveProperty("attachmentDelivery");
  });

  it("records one mixed-delivery group transport failure without provider copies", async () => {
    const calls = [];
    const { attachmentRoot, task } = fixture("review-mixed-delivery-group-failure-");
    const brokerError = Object.assign(new Error("broker exited before creating provider members"), { code: "BROKER_EXIT_NONZERO" });
    const result = await runReviewFixture({
      task, attachmentRoot, taskId: "task", stage: "build-plan", hostProvider: "codex/host",
      providers: ["kimi/coding", "codex/luna"],
      providerClient: {
        runGroup: async (request) => {
          calls.push(request);
          throw brokerError;
        },
      },
      captureSource: () => source, buildMaterials: materialBuilder(),
    });
    expect(result).toMatchObject({ status: "unavailable", runtimeIds: {} });
    expect(calls).toHaveLength(1);
    expect(calls[0].providers).toEqual(["kimi/coding", "codex/luna"]);
    const attempt = JSON.parse(task.readRecord(result.attemptRef));
    expect(attempt).toMatchObject({
      terminal_status: "unavailable",
      error: { code: "BROKER_EXIT_NONZERO" },
      coverage: { selected_profiles: ["kimi/coding", "codex/luna"], selected_count: 2, valid_provider_count: 0 },
    });
    expect(attempt.provider_attempts).toEqual([]);
  });

  it("does not parse semantic output when transport carries a nonzero error", async () => {
    const { attachmentRoot, task } = fixture("review-transport-error-envelope-");
    const result = await runReviewFixture({
      task, attachmentRoot, taskId: "task", stage: "build-code", materials: {}, hostProvider: "codex", providers: ["kimi"],
      providerClient: groupClient([publicProvider("kimi", {
        status: "completed", output: pass,
        error: { code: "PROCESS_EXIT_NONZERO", message: "provider process exited with 1" },
      })]),
      captureSource: () => source, buildMaterials: materialBuilder(),
    });
    expect(result).toMatchObject({ status: "unavailable", resultRef: null });
    expect(JSON.parse(task.readRecord(result.attemptRef))).toMatchObject({
      terminal_status: "unavailable",
      error: { code: "PROCESS_EXIT_NONZERO" },
      provider_attempts: [{ status: "failed", error: { code: "PROCESS_EXIT_NONZERO" } }],
    });
  });

  it("rejects a pinned execution mismatch as unavailable evidence", async () => {
    const { attachmentRoot, task } = fixture("review-profile-mismatch-");
    const policy = {
      source: "wh_review.v2", mode: "full_only", minimum_heterologous: 1,
      requested_profiles: ["kimi/coding"], requested_profile_specs: [{ provider: "kimi/coding", model: "expected", effort: null, thinking: true, priority: 1 }],
      eligible_profiles: ["kimi/coding"], same_source_exclusions: [], effective_profiles: [{ provider: "kimi/coding", adapter: "kimi", model: "expected", effort: null, thinking: true }],
    };
    const execution = { adapter: "kimi", model: "wrong", effort: null, thinking: true, timing: { started_at_ms: 1, completed_at_ms: 2, duration_ms: 1 }, usage: null, retry: { count: 0, progress_events: 0 }, runtime_id: "runtime" };
    const result = await runReviewFixture({
      task, attachmentRoot, taskId: "task", stage: "build-code", materials: {}, hostProvider: "codex", providers: ["kimi/coding"], reviewPolicy: policy,
      providerClient: groupClient([{ ...publicProvider("kimi/coding"), execution }]), captureSource: () => source, buildMaterials: materialBuilder(),
    });
    expect(result.status).toBe("unavailable");
    expect(JSON.parse(task.readRecord(result.attemptRef)).provider_attempts[0].error).toMatchObject({ code: "PROFILE_MISMATCH" });
  });

  it("rejects a v3 result without broker profile identity when tuning is pinned", async () => {
    const { attachmentRoot, task } = fixture("review-profile-attestation-missing-");
    const policy = {
      source: "wh_review.v2", mode: "full_only", minimum_heterologous: 1,
      requested_profiles: ["kimi/coding"], requested_profile_specs: [{ provider: "kimi/coding", model: null, effort: "max", thinking: true, priority: 1 }],
      eligible_profiles: ["kimi/coding"], same_source_exclusions: [], effective_profiles: [{ provider: "kimi/coding", adapter: "kimi", model: null, effort: "max", thinking: true }],
    };
    const provider = {
      ...publicProvider("kimi/coding", { resultProtocol: "workflowhub-result.v3", identity: undefined }),
      execution: { adapter: "kimi", model: null, effort: null, thinking: null, timing: { started_at_ms: 1, completed_at_ms: 2, duration_ms: 1 }, usage: null, retry: { count: 0, progress_events: 0 }, runtime_id: "runtime" },
    };
    const result = await runReviewFixture({
      task, attachmentRoot, taskId: "task", stage: "build-code", materials: {}, hostProvider: "codex", providers: ["kimi/coding"], reviewPolicy: policy,
      providerClient: groupClient([provider]), captureSource: () => source, buildMaterials: materialBuilder(),
    });
    expect(result.status).toBe("unavailable");
    expect(JSON.parse(task.readRecord(result.attemptRef)).provider_attempts[0].error).toMatchObject({ code: "PROFILE_MISMATCH" });
  });
});

describe("material and workspace boundaries", () => {
  it("routes mini-task review kinds away from ordinary build-code integration", () => {
    const runnerSource = readFileSync(new URL("../review-runner.mjs", import.meta.url), "utf8");
    expect(runnerSource).toMatch(/const isIntegration = stage === "build-code" && phaseId === null && reviewKind === null/);
  });

  it("passes the mini-task review kind into material construction", async () => {
    const seen = [];
    const { attachmentRoot, task } = fixture("review-mini-kind-forwarding-");
    const result = await runReviewFixture({
      task, attachmentRoot, taskId: "task", stage: "build-code", reviewKind: "mini_task.design",
      materials: {}, hostProvider: "codex", providers: ["kimi"], providerClient: groupClient([publicProvider("kimi")]),
      captureSource: () => source,
      buildMaterials: (options) => { seen.push(options); return materialBuilder()(); },
    });
    expect(result.status).toBe("available");
    expect(seen).toHaveLength(1);
    expect(seen[0]).toMatchObject({ stage: "build-code", reviewKind: "mini_task.design", reviewScope: "integration" });
  });

  it("captures a complete diff for mini-task implementation review", async () => {
    const captures = [];
    const { attachmentRoot, task } = fixture("review-mini-implementation-diff-");
    const result = await runReviewFixture({
      task, attachmentRoot, taskId: "task", stage: "build-code", reviewKind: "mini_task.implementation",
      materials: {}, hostProvider: "codex", providers: ["kimi"], providerClient: groupClient([publicProvider("kimi")]),
      captureSource: (options) => { captures.push(options); return source; },
      buildMaterials: materialBuilder(),
    });
    expect(result.status).toBe("available");
    expect(captures).toHaveLength(1);
    expect(captures[0].includeDiff).toBe(true);
  });

  it("delivers implementation code and recognizes namespaced requirements", () => {
    expect(phaseDiffDeliveryForPath("paperbuilder/application/smart_iteration.py")).toBe("included");
    expect(phaseDiffDeliveryForPath("frontend/src/smart-iteration.test.tsx")).toBe("included");
    expect(phaseDiffDeliveryForPath("specs/f14-intelligent-iteration/spec.md")).toBe("summary");
    expect([...requirementIds("FR-ROBUST-001 AC-ROBUST-009 FR-001 AC-002")].sort()).toEqual([
      "AC-002", "AC-ROBUST-009", "FR-001", "FR-ROBUST-001",
    ]);
  });

  it("builds a phase packet from current diff and does not require maps", () => {
    const { attachmentRoot, task } = fixture("review-phase-");
    const diff = Buffer.from("diff --git a/runtime/example.mjs b/runtime/example.mjs\nindex 1111111..2222222 100644\n--- a/runtime/example.mjs\n+++ b/runtime/example.mjs\n@@ -1 +1 @@\n-old\n+new\n");
    const diffPath = join(attachmentRoot, "phase.diff");
    writeFileSync(diffPath, diff);
    const diffSha256 = createHash("sha256").update(diff).digest("hex");
    const receipt = `${JSON.stringify({ command: "npx vitest run focused", exit_code: 0, snapshot_tree: source.snapshotTree })}\n`;
    const receiptRef = "quality/tests/phase.json";
    task.createRecordAtomic(receiptRef, receipt);
    const bundle = buildReviewMaterials({
      reviewDataRoot: attachmentRoot, attachmentRoot, source: { ...source, diffPath, diffBytes: diff.length, diffSha256, changedFiles: [{ path: "runtime/example.mjs", old_path: null, status: "modified", mode: "100644", old_mode: "100644", blob: "2".repeat(40), old_blob: "1".repeat(40) }], copyDiffTo(destination) { writeFileSync(destination, diff, { flag: "wx" }); return { bytes: diff.length, sha256: diffSha256 }; } },
      task, taskId: "task", stage: "build-code", phaseId: "T01", reviewScope: "phase", strictV2Maps: true,
      materials: { approved_spec: "# Spec\n\nAC-1: change current behavior.", acceptance_criteria: "AC-1: focused test passes.", test_evidence: { receipt_ref: receiptRef, receipt_hash: createHash("sha256").update(receipt).digest("hex") }, review_instructions: reviewInstructionsFor("build-code", null, false, "phase") },
    });
    expect(bundle.files).toEqual(expect.arrayContaining(["changes.diff", "change-map.json", "requirements/approved_spec.md", "requirements/acceptance_criteria.md", "requirements/test_evidence.json"]));
    expect(bundle.files).not.toContain("requirements/review_delta.json");
  });

  it("rejects pre-compacted object materials instead of sending [object Object] to providers", () => {
    const { attachmentRoot, task } = fixture("review-integration-material-type-");
    const outputRef = "quality/tests/output/build-code.output";
    const receiptRef = "quality/tests/build-code.json";
    const implementationRef = "quality/evidence/implementation.json";
    const output = "pass\n";
    task.createRecordAtomic(outputRef, output);
    const receipt = {
      schema_version: "workflowhub-receipt.v1",
      task_id: "task",
      stage: "build-code",
      producer: { stage: "build-code", component: "build-code-test-capture", version: "1.0.0" },
      command: "npm test",
      command_hash: createHash("sha256").update("npm test").digest("hex"),
      exit_code: 0,
      snapshot_tree: source.snapshotTree,
      output_ref: outputRef,
      output_hash: createHash("sha256").update(output).digest("hex"),
    };
    const receiptRaw = `${JSON.stringify(receipt)}\n`;
    task.createRecordAtomic(receiptRef, receiptRaw);
    const implementationRaw = `${JSON.stringify({ snapshot_tree: source.snapshotTree })}\n`;
    task.createRecordAtomic(implementationRef, implementationRaw);
    const acTrace = {
      schema_version: "ac-change-test-trace.v1",
      snapshot_tree: source.snapshotTree,
      acceptance_ids: ["AC-1"],
      entries: [{
        acceptance_criterion_id: "AC-1",
        coverage_status: "unknown",
        coverage_reason: "no focused receipt",
        change: [{ task_id: null, summary: "current implementation" }],
        test: [],
        evidence: [{ ref: implementationRef, sha256: createHash("sha256").update(implementationRaw).digest("hex") }],
        anchors: [{ id: "ac-1", path: "spec.md", start_line: 1, end_line: 1, role: "acceptance", reason: "current acceptance criterion" }],
      }],
    };
    const integrationSource = {
      ...source,
      changedFiles: [],
      copySnapshotFile(path, destination) {
        const content = path === "spec.md" ? "AC-1\n" : "";
        writeFileSync(destination, content, { flag: "wx" });
        return { sha256: createHash("sha256").update(content).digest("hex") };
      },
    };

    expect(() => buildReviewMaterials({
      reviewDataRoot: attachmentRoot,
      attachmentRoot,
      source: integrationSource,
      task,
      taskId: "task",
      stage: "build-code",
      reviewScope: "integration",
      materials: {
        approved_spec: { schema_version: "wh-review-integration-spec.v1", excerpts: [] },
        acceptance_criteria: { schema_version: "wh-review-acceptance-excerpts.v1", excerpts: [] },
        test_evidence: { receipt_ref: receiptRef, receipt_hash: createHash("sha256").update(receiptRaw).digest("hex") },
        ac_trace: acTrace,
        review_instructions: reviewInstructionsFor("build-code", null, false, "integration"),
      },
    })).toThrow(/MATERIAL_INCOMPLETE.*approved_spec.*markdown text/);
  });

  it("derives raw_requirement from the decision-log original requirement section instead of duplicating the full decision", () => {
    const { attachmentRoot, task } = fixture("review-build-spec-materials-");
    const approvedDecision = [
      "# Decision Log",
      "",
      "## 原始需求",
      "",
      "必须修复 wh-review 可靠性。",
      "",
      "### 原始限制",
      "",
      "不能降低交付质量。",
      "",
      "## 决定",
      "",
      "采用最小修复。",
    ].join("\n");
    const bundle = buildReviewMaterials({
      reviewDataRoot: attachmentRoot,
      attachmentRoot,
      source,
      task,
      taskId: "task",
      stage: "build-spec",
      materials: {
        raw_requirement: approvedDecision,
        approved_decision: approvedDecision,
        draft_spec: "# Spec\n\n修复 packet 与错误分类。",
        review_instructions: reviewInstructionsFor("build-spec"),
      },
    });

    const rawRequirement = readFileSync(join(bundle.bundleRoot, "requirements/raw_requirement.md"), "utf8");
    const frozenDecision = readFileSync(join(bundle.bundleRoot, "requirements/approved_decision.md"), "utf8");
    expect(rawRequirement).toContain("必须修复 wh-review 可靠性。");
    expect(rawRequirement).toContain("### 原始限制");
    expect(rawRequirement).not.toContain("## 决定");
    expect(rawRequirement).not.toBe(frozenDecision);
  });

  it("deduplicates equivalent decision material with CRLF and trailing whitespace differences", () => {
    const { attachmentRoot, task } = fixture("review-build-spec-normalized-materials-");
    const approvedDecision = "# Decision Log\n\n## 原始需求\n\n必须保留实际语义。\n\n## 决定\n\n采用最小修复。\n";
    const bundle = buildReviewMaterials({
      reviewDataRoot: attachmentRoot, attachmentRoot, source, task, taskId: "task", stage: "build-spec",
      materials: {
        raw_requirement: approvedDecision.replaceAll("\n", "\r\n").replace("实际语义。", "实际语义。   "),
        approved_decision: approvedDecision,
        draft_spec: "# Spec\n",
        review_instructions: reviewInstructionsFor("build-spec"),
      },
    });
    expect(readFileSync(join(bundle.bundleRoot, "requirements/raw_requirement.md"), "utf8")).toBe("## 原始需求\n\n必须保留实际语义。\n");
  });

  it("fails before packet delivery when duplicate decision material has no original requirement section", () => {
    const { attachmentRoot, task } = fixture("review-build-spec-duplicate-");
    const decisionWithoutSource = "# Decision Log\n\n## 决定\n\n采用最小修复。\n";

    expect(() => buildReviewMaterials({
      reviewDataRoot: attachmentRoot,
      attachmentRoot,
      source,
      task,
      taskId: "task",
      stage: "build-spec",
      materials: {
        raw_requirement: decisionWithoutSource,
        approved_decision: decisionWithoutSource,
        draft_spec: "# Spec\n\n修复 packet 与错误分类。",
        review_instructions: reviewInstructionsFor("build-spec"),
      },
    })).toThrow(/MATERIAL_INCOMPLETE.*duplicates approved_decision.*original requirement section/);
  });

  it("does not dispatch a provider when source capture fails", async () => {
    const { attachmentRoot, task } = fixture("review-capture-failure-");
    const calls = [];
    await expect(runReviewFixture({
      task, attachmentRoot, taskId: "task", stage: "verify-code", materials: {}, hostProvider: "codex", providers: ["kimi"],
      providerClient: groupClient([publicProvider("kimi")], calls), captureSource: () => { throw new Error("SOURCE_CHANGED_DURING_CAPTURE"); }, buildMaterials: materialBuilder(),
    })).rejects.toThrow(/SOURCE_CHANGED_DURING_CAPTURE/);
    expect(calls).toHaveLength(0);
  });

  it("records material preflight failure without dispatching or leaking a private path", async () => {
    const { attachmentRoot, task } = fixture("review-material-preflight-");
    const calls = [];
    const privatePath = "/private/workflowhub/trace.json";
    const result = await runReviewFixture({
      task, attachmentRoot, taskId: "task", stage: "verify-code", materials: {}, hostProvider: "codex", providers: ["kimi"],
      providerClient: groupClient([publicProvider("kimi")], calls), captureSource: () => source,
      buildMaterials: () => { const error = new Error(`MATERIAL_INCOMPLETE: failed to read ${privatePath}`); error.code = "MATERIAL_INCOMPLETE"; throw error; },
    });
    expect(result).toMatchObject({ status: "unavailable", resultRef: null });
    expect(calls).toHaveLength(0);
    const attempt = JSON.parse(task.readRecord(result.attemptRef));
    expect(attempt.error).toEqual({ code: "MATERIAL_INCOMPLETE", message: "review material preflight failed; private diagnostic withheld" });
    expect(task.readRecord(result.reportRef)).not.toContain(privatePath);
  });

  it("records a source change after packet construction without dispatching a mixed packet", async () => {
    const calls = [];
    const { attachmentRoot, task } = fixture("review-source-stability-");
    const repo = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-review-source-stability-repo-")));
    temporary.push(repo);
    execFileSync("git", ["init", "-q"], { cwd: repo });
    execFileSync("git", ["config", "user.name", "fixture"], { cwd: repo });
    execFileSync("git", ["config", "user.email", "fixture@example.test"], { cwd: repo });
    const sourceFile = join(repo, "source.txt");
    writeFileSync(sourceFile, "base\n");
    execFileSync("git", ["add", "source.txt"], { cwd: repo });
    execFileSync("git", ["commit", "-qm", "fixture"], { cwd: repo });
    const captured = captureExecutionSnapshot(repo, "task");
    const capturedSource = {
      ...source,
      sourceRoot: repo,
      capturedHead: captured.head,
      snapshotTree: captured.tree,
    };
    const result = await runReviewFixture({
      task, attachmentRoot, taskId: "task", stage: "verify-code", materials: {}, hostProvider: "codex", providers: ["kimi"],
      providerClient: groupClient([publicProvider("kimi")], calls),
      captureSource: () => capturedSource,
      buildMaterials: () => {
        writeFileSync(sourceFile, "changed after packet construction\n");
        return { bundleRoot: "unused", materialId, manifest: [] };
      },
    });
    expect(result).toMatchObject({ status: "unavailable", resultRef: null });
    expect(calls).toHaveLength(0);
    expect(JSON.parse(task.readRecord(result.attemptRef)).error).toEqual({
      code: "SOURCE_CHANGED_AFTER_CAPTURE",
      message: "review source changed after the packet was built; provider dispatch was skipped",
    });
  });

  it("rejects an unbranded workspace and naked source paths before capture", async () => {
    const { root, attachmentRoot, task } = fixture("review-workspace-branding-");
    const options = {
      task, attachmentRoot, taskId: "task", stage: "verify-code", materials: {}, hostProvider: "codex", providers: ["kimi"],
      providerClient: groupClient([publicProvider("kimi")]), captureSource: () => source, buildMaterials: materialBuilder(),
    };
    await expect(runReview({ ...options, workspace: {} })).rejects.toThrow(/authentic Workspace capability required/);
    await expect(runReview({ ...options, sourceRoot: root, targetRepoRoot: root })).rejects.toThrow(/naked source\/target paths|Workspace/);
  });

  it("keeps verify final tied to the exact reviewed snapshot", () => {
    const result = { stage: "build-code", review_scope: "integration", subject_kind: "worktree", source: { target_commit: source.targetCommit, base_commit: source.baseCommit, base_tree: source.baseTree, captured_head: source.capturedHead }, base_tree: source.baseTree, candidate_tree: source.snapshotTree, snapshot_tree: source.snapshotTree };
    expect(verifyFinalSubject({ result, current: source, integrationSubject: { base_commit: source.baseCommit, base_tree: source.baseTree, snapshot_tree: source.snapshotTree } })).toMatchObject({ status: "finalized", snapshotTree: source.snapshotTree });
    expect(() => verifyFinalSubject({ result, current: { ...source, snapshotTree: "6".repeat(40) }, integrationSubject: { base_commit: source.baseCommit, base_tree: source.baseTree, snapshot_tree: source.snapshotTree } })).toThrow(/WORKTREE_CHANGED_AFTER_REVIEW/);
  });

  it("does not invalidate an unchanged candidate snapshot when only target HEAD advances", () => {
    const result = { stage: "build-code", review_scope: "integration", subject_kind: "worktree", source: { target_commit: source.targetCommit, base_commit: source.baseCommit, base_tree: source.baseTree, captured_head: source.capturedHead }, base_tree: source.baseTree, candidate_tree: source.snapshotTree, snapshot_tree: source.snapshotTree };
    expect(verifyFinalSubject({
      result,
      current: { ...source, targetCommit: "9".repeat(40) },
      integrationSubject: { base_commit: source.baseCommit, base_tree: source.baseTree, snapshot_tree: source.snapshotTree },
    })).toMatchObject({ status: "finalized", snapshotTree: source.snapshotTree });
  });
});

import { afterEach, describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseReviewerOutput } from "../review-output.mjs";
import { aggregateProviderResults, classifyAttempt, classificationSummary } from "../review-result.mjs";
import { ReviewProviderClient } from "../review-provider-client.mjs";
import { buildReviewMaterials, phaseDiffDeliveryForPath, requirementIds, reviewInstructionsFor } from "../review-materials.mjs";
import { actionableSeriousFindings, reviewCycleDecision, runReview, runReviewFixture, verifyFinalSubject } from "../review-runner.mjs";
import { createTask } from "../../../../runtime/task/task-handle.mjs";

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

function publicProvider(provider, {
  status = "completed", output = pass, error = null, material = materialId,
  resultProtocol = "workflowhub-result.v2", sessionFilePath = null, rawOutputRef = null,
} = {}) {
  return {
    adapter: provider.split("/", 1)[0],
    continuable: false,
    effort: null,
    error,
    material_id: material,
    model: null,
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
});

describe("broker boundary", () => {
  it("uses one public broker run for a provider group and preserves runtime facts", async () => {
    const calls = [];
    const client = new ReviewProviderClient({
      invoke: async (request) => {
        calls.push(request);
        return { exitCode: 0, stdout: JSON.stringify({ version: 4, outcome: "completed", runtime_id: "run", round: 0, host_provider: "codex", selected_tier: 0, providers: [publicProvider("kimi/k3")] }), stderr: "" };
      },
    });
    const result = await client.runGroup({ hostProvider: "codex", providers: ["kimi/k3"], materials: { bundleRoot: "/tmp/bundle", attachmentRoot: "/tmp", sourcePrefix: ".wh-review-packets/bundle", materialId, manifest: [] }, prompt: "review" });
    expect(calls).toHaveLength(1);
    expect(calls[0].command).toBe("run");
    expect(calls[0].request).not.toHaveProperty("continuation");
    expect(result.runtimeId).toBe("run");
    expect(result.providers[0].provider).toBe("kimi/k3");
  });

  it("rejects a provider result bound to another material or an old result protocol", async () => {
    const materials = { bundleRoot: "/tmp/bundle", attachmentRoot: "/tmp", sourcePrefix: ".wh-review-packets/bundle", materialId, manifest: [] };
    const mismatch = new ReviewProviderClient({ invoke: async () => ({
      exitCode: 0,
      stdout: JSON.stringify({ version: 4, outcome: "completed", runtime_id: "run", round: 0, host_provider: "codex", selected_tier: 0, providers: [publicProvider("kimi", { material: "b".repeat(64) })] }),
      stderr: "",
    }) });
    await expect(mismatch.runGroup({ hostProvider: "codex", providers: ["kimi"], materials, prompt: "review" })).rejects.toThrow(/MATERIAL_INCOMPLETE/);

    const v1 = new ReviewProviderClient({ invoke: async () => ({
      exitCode: 0,
      stdout: JSON.stringify({ version: 4, outcome: "completed", runtime_id: "run", round: 0, host_provider: "codex", selected_tier: 0, providers: [publicProvider("kimi", { resultProtocol: "workflowhub-result.v1" })] }),
      stderr: "",
    }) });
    await expect(v1.runGroup({ hostProvider: "codex", providers: ["kimi"], materials, prompt: "review" })).rejects.toThrow(/PROTOCOL_INCOMPATIBLE/);
  });

  it("delivers review bundles as file-only attachments without embedding their bytes", async () => {
    const calls = [];
    const client = new ReviewProviderClient({ invoke: async (request) => {
      calls.push(request);
      return { exitCode: 0, stdout: JSON.stringify({ version: 4, outcome: "completed", runtime_id: "run", round: 0, host_provider: "codex", selected_tier: 0, providers: [publicProvider("kimi")] }), stderr: "" };
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

  it("retains broker raw-output provenance inside the public execution fact", async () => {
    const { attachmentRoot, task } = fixture("review-raw-output-ref-");
    const rawOutputRef = {
      version: "broker-output-ref.v1", provider: "kimi", runtime_id: "run",
      stdout_sha256: "b".repeat(64), stderr_sha256: "c".repeat(64),
    };
    const providerClient = new ReviewProviderClient({ invoke: async () => ({
      exitCode: 0,
      stdout: JSON.stringify({ version: 4, outcome: "completed", runtime_id: "run", round: 0, host_provider: "codex", selected_tier: 0, providers: [publicProvider("kimi", { rawOutputRef })] }),
      stderr: "",
    }) });
    const result = await runReviewFixture({
      task, attachmentRoot, taskId: "task", stage: "build-code", materials: {}, hostProvider: "codex", providers: ["kimi"],
      providerClient, captureSource: () => source, buildMaterials: materialBuilder(),
    });
    const attempt = JSON.parse(task.readRecord(result.attemptRef));
    expect(attempt.provider_attempts[0].raw_output_ref).toEqual(rawOutputRef);
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
});

describe("material and workspace boundaries", () => {
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
});

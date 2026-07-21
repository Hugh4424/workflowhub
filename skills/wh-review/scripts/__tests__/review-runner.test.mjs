import { afterEach } from "vitest";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseReviewerOutput } from "../review-output.mjs";
import { aggregateProviderResults } from "../review-result.mjs";
import { ReviewProviderClient } from "../review-provider-client.mjs";
import { runReview, runReviewFixture, verifyFinal } from "../review-runner.mjs";
import { createTask, createTaskKernel } from "../../../../core/task-handle.mjs";
import { openAcceptedWorkspace, prepareTaskWorkspace } from "../../../../core/workspace.mjs";
import { execFileSync } from "node:child_process";

const materialId = "a".repeat(64);
const source = { targetCommit: "1".repeat(40), baseCommit: "2".repeat(40), baseTree: "3".repeat(40), capturedHead: "4".repeat(40), snapshotTree: "5".repeat(40) };
const pass = JSON.stringify({ verdict: "pass", summary: "ok", findings: [] });
const revise = JSON.stringify({ verdict: "revise_required", summary: "fix", findings: [{ severity: "major", path: "a.js", line: 1, issue: "bug", recommendation: "fix it" }] });
const temporary = [];
function fixture(prefix = "simple-review-") {
  const root = realpathSync(mkdtempSync(join(tmpdir(), prefix))); temporary.push(root);
  const attachmentRoot = join(root, "attachments"); mkdirSync(attachmentRoot);
  const task = createTask({ storageRoot: root, taskPath: join(root, "Projects", "Demo", "tasks", "task"), manifest: {
    schema_version: "1.0.0", project_name: "Demo", task_id: "task", created_at: "2026-07-16T00:00:00.000Z",
    target_repo_root: join(root, "repo"), issue_ids: [], inputs: {},
  } });
  return { root, attachmentRoot, task };
}
afterEach(() => { while (temporary.length) rmSync(temporary.pop(), { recursive: true, force: true }); });

describe("review output", () => {
  it("accepts pure JSON or one fenced JSON object only", () => {
    expect(parseReviewerOutput(pass).verdict).toBe("pass");
    expect(parseReviewerOutput(`note\n\`\`\`json\n${revise}\n\`\`\``).verdict).toBe("revise_required");
    expect(() => parseReviewerOutput(`\`\`\`json\n${pass}\n\`\`\`\n\`\`\`json\n${pass}\n\`\`\``)).toThrow(/OUTPUT_INVALID/);
    expect(() => parseReviewerOutput("not json")).toThrow(/OUTPUT_INVALID/);
    expect(parseReviewerOutput(JSON.stringify({ verdict: "revise_required", summary: "file issue", findings: [{ severity: "major", path: "a.js", line: null, issue: "bug", recommendation: "fix" }] })).findings[0]).not.toHaveProperty("line");
  });
});

describe("public provider client", () => {
  it("consumes only workflowhub-result.v1 and preserves exit-3 provider detail", async () => {
    const calls = []; const client = new ReviewProviderClient({ invoke: async (value) => { calls.push(value); return { exitCode: 3, stdout: JSON.stringify({ runtime_id: "run", providers: [{ result_protocol: "workflowhub-result.v1", provider: "opencode", status: "failed", material_id: materialId, session_id: null, output: null, error: { code: "AUTH", message: "no" } }] }), stderr: "" }; } });
    const result = await client.run({ hostProvider: "codex", provider: "opencode", materials: { bundleRoot: "/attachments/.wh-review-packets/bundle", attachmentRoot: "/attachments", sourcePrefix: ".wh-review-packets/bundle", materialId, manifest: [] }, prompt: "review" });
    expect(result.provider.error.code).toBe("AUTH"); expect(calls).toHaveLength(1);
  });

  it("rejects a public material mismatch", async () => {
    const client = new ReviewProviderClient({ invoke: async () => ({ exitCode: 0, stdout: JSON.stringify({ runtime_id: "run", providers: [{ result_protocol: "workflowhub-result.v1", provider: "kimi", status: "completed", material_id: "b".repeat(64), session_id: "s", output: pass, error: null }] }), stderr: "" }) });
    await expect(client.run({ hostProvider: "codex", provider: "kimi", materials: { bundleRoot: "/attachments/.wh-review-packets/bundle", attachmentRoot: "/attachments", sourcePrefix: ".wh-review-packets/bundle", materialId, manifest: [] }, prompt: "review" })).rejects.toThrow(/MATERIAL_INCOMPLETE/);
  });

  it("delivers large material as file_only paths without embedding it in the prompt", async () => {
    let call; const client = new ReviewProviderClient({ invoke: async (value) => { call = value; return { exitCode: 0, stdout: JSON.stringify({ runtime_id: "run", providers: [{ result_protocol: "workflowhub-result.v1", provider: "opencode", status: "completed", material_id: materialId, session_id: "s", output: pass, error: null }] }), stderr: "" }; } });
    await client.run({ hostProvider: "codex", provider: "opencode", materials: { bundleRoot: "/attachments/.wh-review-packets/large", attachmentRoot: "/attachments", sourcePrefix: ".wh-review-packets/large", materialId, deliveryManifest: [{ path: "changes.diff", bytes: 800000, sha256: "f".repeat(64) }, { path: "manifest.json", bytes: 200, sha256: "e".repeat(64) }] }, prompt: "review bundle" });
    expect(call.attachmentDelivery).toBe("file_only"); expect(call.request.prompt).toBe("review bundle");
    expect(call.attachments.entries[0]).toMatchObject({ source: ".wh-review-packets/large/changes.diff", destination: "changes.diff", embed: false, size: 800000 });
    expect(call.attachments.entries).toEqual([
      { source: ".wh-review-packets/large/changes.diff", destination: "changes.diff", embed: false, size: 800000, sha256: "f".repeat(64) },
      { source: ".wh-review-packets/large/manifest.json", destination: "manifest.json", embed: false, size: 200, sha256: "e".repeat(64) }
    ]);
  });
});

describe("aggregation and runner", () => {
  it("reuses an unchanged canonical pass without calling a provider", async () => {
    const { attachmentRoot, task } = fixture("simple-review-reuse-"); const calls = [];
    const providerClient = { run: async () => { calls.push(true); return { runtimeId: "runtime", provider: { provider: "kimi", status: "completed", session_id: "session", output: pass, error: null } }; } };
    const options = { task, attachmentRoot, taskId: "task", stage: "build-code", materials: {}, hostProvider: "codex", providers: ["kimi"], providerClient,
      captureSource: () => source, buildMaterials: () => ({ bundleRoot: attachmentRoot, materialId, manifest: [] }) };
    const first = await runReviewFixture(options);
    const second = await runReviewFixture(options);
    expect(second).toMatchObject({ reused: true, attemptRef: first.attemptRef, resultRef: first.resultRef });
    expect(calls).toHaveLength(1);
  });

  it("calls providers again when material or snapshot changes", async () => {
    const { attachmentRoot, task } = fixture("simple-review-reuse-change-"); const calls = [];
    const providerClient = { run: async () => { calls.push(true); return { runtimeId: "runtime", provider: { provider: "kimi", status: "completed", session_id: "session", output: pass, error: null } }; } };
    const base = { task, attachmentRoot, taskId: "task", stage: "build-code", materials: {}, hostProvider: "codex", providers: ["kimi"], providerClient };
    await runReviewFixture({ ...base, captureSource: () => source, buildMaterials: () => ({ bundleRoot: attachmentRoot, materialId, manifest: [] }) });
    await runReviewFixture({ ...base, captureSource: () => source, buildMaterials: () => ({ bundleRoot: attachmentRoot, materialId: "b".repeat(64), manifest: [] }) });
    await runReviewFixture({ ...base, captureSource: () => ({ ...source, snapshotTree: "6".repeat(40) }), buildMaterials: () => ({ bundleRoot: attachmentRoot, materialId, manifest: [] }) });
    expect(calls).toHaveLength(3);
  });

  it("does not reuse a pass whose canonical aggregation was changed", async () => {
    const { root, attachmentRoot, task } = fixture("simple-review-reuse-tamper-"); const calls = [];
    const providerClient = { run: async () => { calls.push(true); return { runtimeId: "runtime", provider: { provider: "kimi", status: "completed", session_id: "session", output: pass, error: null } }; } };
    const options = { task, attachmentRoot, taskId: "task", stage: "build-code", materials: {}, hostProvider: "codex", providers: ["kimi"], providerClient,
      captureSource: () => source, buildMaterials: () => ({ bundleRoot: attachmentRoot, materialId, manifest: [] }) };
    const first = await runReviewFixture(options);
    const resultPath = join(root, "Projects", "Demo", "tasks", "task", first.resultRef);
    const changed = JSON.parse(readFileSync(resultPath, "utf8"));
    changed.findings = [{ provider: "kimi", severity: "major", path: "fake", issue: "tampered", recommendation: "ignore" }];
    writeFileSync(resultPath, `${JSON.stringify(changed, null, 2)}\n`);
    const second = await runReviewFixture(options);
    expect(second).not.toHaveProperty("reused");
    expect(calls).toHaveLength(2);
  });

  it.each([
    ["attempt identity", ({ attempt }) => { attempt.attempt_id = "other-attempt"; }],
    ["duplicate provider", ({ result }) => { result.provider_results.push(structuredClone(result.provider_results[0])); }],
    ["provider output ownership", ({ attempt }) => { attempt.provider_attempts[0].output_ref = "reviews/attempts/other-attempt/providers/kimi.output.json"; }],
  ])("does not reuse a pass with invalid %s", async (_label, mutate) => {
    const { root, attachmentRoot, task } = fixture("simple-review-reuse-invalid-"); const calls = [];
    const providerClient = { run: async () => { calls.push(true); return { runtimeId: "runtime", provider: { provider: "kimi", status: "completed", session_id: "session", output: pass, error: null } }; } };
    const options = { task, attachmentRoot, taskId: "task", stage: "build-code", materials: {}, hostProvider: "codex", providers: ["kimi"], providerClient,
      captureSource: () => source, buildMaterials: () => ({ bundleRoot: attachmentRoot, materialId, manifest: [] }) };
    const first = await runReviewFixture(options);
    const taskRoot = join(root, "Projects", "Demo", "tasks", "task");
    const resultPath = join(taskRoot, first.resultRef), attemptPath = join(taskRoot, first.attemptRef);
    const result = JSON.parse(readFileSync(resultPath, "utf8")), attempt = JSON.parse(readFileSync(attemptPath, "utf8"));
    mutate({ result, attempt });
    writeFileSync(resultPath, `${JSON.stringify(result, null, 2)}\n`);
    writeFileSync(attemptPath, `${JSON.stringify(attempt, null, 2)}\n`);
    const second = await runReviewFixture(options);
    expect(second).not.toHaveProperty("reused");
    expect(calls).toHaveLength(2);
  });

  it("records phase subject identity in the attempt, result, and public response", async () => {
    const { attachmentRoot, task } = fixture("simple-review-phase-");
    const phaseSource = { ...source, baseTree: "6".repeat(40), snapshotTree: "7".repeat(40) };
    const result = await runReviewFixture({ task, attachmentRoot, taskId: "task", stage: "build-code", phaseId: "phase-1", materials: {}, hostProvider: "codex", providers: ["kimi"],
      providerClient: { run: async () => ({ runtimeId: "runtime", provider: { provider: "kimi", status: "completed", session_id: "session", output: pass, error: null } }) },
      capturePhaseSource: () => phaseSource, buildMaterials: () => ({ bundleRoot: attachmentRoot, materialId, manifest: [] }) });
    expect(result).toMatchObject({ subjectKind: "phase", phaseId: "phase-1", baseTree: phaseSource.baseTree, candidateTree: phaseSource.snapshotTree });
    expect(JSON.parse(task.readRecord(result.attemptRef))).toMatchObject({ subject_kind: "phase", phase_id: "phase-1", base_tree: phaseSource.baseTree, candidate_tree: phaseSource.snapshotTree });
    expect(JSON.parse(task.readRecord(result.resultRef))).toMatchObject({ subject_kind: "phase", phase_id: "phase-1", base_tree: phaseSource.baseTree, candidate_tree: phaseSource.snapshotTree });
    expect(() => verifyFinal({ resultRef: result.resultRef, task, attachmentRoot })).toThrow(/PHASE_RESULT_NOT_FINAL/);
  });

  it("never calls a provider when source capture reports mutation", async () => {
    const { attachmentRoot, task } = fixture("simple-review-source-mutated-"); const calls = [];
    await expect(runReviewFixture({ task, attachmentRoot, taskId: "task", stage: "verify-code", materials: {}, hostProvider: "codex", providers: ["kimi"], providerClient: { run: async (request) => { calls.push(request); } }, captureSource: () => { throw new Error("SOURCE_CHANGED_DURING_CAPTURE"); } })).rejects.toThrow(/SOURCE_CHANGED_DURING_CAPTURE/);
    expect(calls).toHaveLength(0);
  });

  it("guards an empty code-stage skill plan before the provider fan-out", () => {
    const materialsSource = readFileSync(join(import.meta.dirname, "..", "review-materials.mjs"), "utf8");
    expect(materialsSource).toMatch(/\["build-code",\s*"verify-code"\][\s\S]*required_skills[\s\S]*length === 0[\s\S]*MATERIAL_INCOMPLETE/);
    const runnerSource = readFileSync(join(import.meta.dirname, "..", "review-runner.mjs"), "utf8");
    expect(runnerSource.indexOf("reviewInstructionsFor(stage")).toBeLessThan(runnerSource.indexOf("Promise.all(providers.map"));
  });

  it("keeps a real provider revise result blocked at final verification", async () => {
    const { attachmentRoot, task } = fixture("simple-review-provider-revise-");
    const result = await runReviewFixture({ task, attachmentRoot, taskId: "task", stage: "verify-code", materials: {}, hostProvider: "codex", providers: ["kimi"],
      providerClient: { run: async () => ({ runtimeId: "runtime", provider: { provider: "kimi", status: "completed", session_id: "session", output: revise, error: null } }) },
      captureSource: () => source, buildMaterials: () => ({ bundleRoot: attachmentRoot, materialId, manifest: [] }) });
    expect(result).toMatchObject({ status: "semantic", verdict: "revise_required" });
    expect(() => verifyFinal({ task, resultRef: result.resultRef, attachmentRoot })).toThrow(/REVIEW_NOT_APPROVED/);
  });

  it("requires branded CandidateWorkspace for make-decision direction review", async () => {
    const { root, attachmentRoot, task } = fixture("simple-review-candidate-");
    const repo = join(root, "repo"); mkdirSync(repo);
    execFileSync("git", ["init", "-q"], { cwd: repo });
    execFileSync("git", ["config", "user.name", "Test"], { cwd: repo });
    execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: repo });
    execFileSync("git", ["commit", "--allow-empty", "-qm", "baseline"], { cwd: repo });
    const candidateWorkspace = prepareTaskWorkspace(task);
    const options = { task, attachmentRoot, taskId: "task", stage: "make-decision", reviewTrack: "direction", hostProvider: "codex", providers: ["kimi"],
      providerClient: { run: async () => ({ runtimeId: "r", provider: { provider: "kimi", status: "completed", session_id: "s", output: pass, error: null } }) },
      captureSource: ({ sourceRoot, targetRepoRoot }) => { expect(sourceRoot).toBe(candidateWorkspace.worktreeRoot); expect(targetRepoRoot).toBe(realpathSync(repo)); return source; },
      buildMaterials: () => ({ bundleRoot: attachmentRoot, materialId, manifest: [] }) };
    await expect(runReview({ ...options, sourceRoot: repo })).rejects.toThrow(/naked|CandidateWorkspace|forbid/i);
    await expect(runReview({ ...options, candidateWorkspace })).resolves.toMatchObject({ status: "semantic", verdict: "pass" });
    const detail = {
      ...options,
      reviewTrack: "detail",
      providers: ["kimi", "opencode"],
      providerClient: { run: async ({ provider }) => ({ runtimeId: `r-${provider}`, provider: { provider, status: "completed", session_id: `s-${provider}`, output: pass, error: null } }) },
    };
    await expect(runReview({ ...detail, sourceRoot: repo })).rejects.toThrow(/naked|CandidateWorkspace|forbid/i);
    await expect(runReview({ ...detail, candidateWorkspace })).resolves.toMatchObject({ status: "semantic", verdict: "pass" });
  });
  it("rejects a forged or wrong-worktree Workspace capability", async () => {
    const { attachmentRoot, task } = fixture("simple-review-wrong-worktree-");
    const providerClient = { run: async () => ({ runtimeId: "r", provider: { provider: "kimi", status: "completed", session_id: "s", output: pass, error: null } }) };
    await expect(runReview({ task, workspace: { worktreeRoot: "/wrong" }, attachmentRoot, taskId: "task", stage: "build-code", hostProvider: "codex", providers: ["kimi"], providerClient,
      captureSource: () => source, buildMaterials: () => ({ bundleRoot: attachmentRoot, materialId, manifest: [] }) })).rejects.toThrow(/Workspace|worktree|capability/i);
  });
  it("uses only an authentic Workspace for full worktree capture", async () => {
    const { root, attachmentRoot, task } = fixture("simple-review-workspace-");
    const repo = join(root, "repo"); mkdirSync(repo);
    execFileSync("git", ["init", "-q"], { cwd: repo });
    execFileSync("git", ["config", "user.name", "Test"], { cwd: repo });
    execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: repo });
    execFileSync("git", ["commit", "--allow-empty", "-qm", "baseline"], { cwd: repo });
    const candidate = prepareTaskWorkspace(task);
    const workspace = openAcceptedWorkspace(task, { facts: { worktree_root: candidate.worktreeRoot, baseline_commit: candidate.baselineCommit } });
    const options = { task, workspace, attachmentRoot, taskId: "task", stage: "verify-code", materials: {}, hostProvider: "codex", providers: ["kimi"],
      providerClient: { run: async () => ({ runtimeId: "r", provider: { provider: "kimi", status: "completed", session_id: "s", output: pass, error: null } }) },
      captureSource: (input) => { expect(input).toMatchObject({ workspace, reviewDataRoot: attachmentRoot }); expect(input.sourceRoot).toBeUndefined(); expect(input.targetRepoRoot).toBeUndefined(); return source; },
      buildMaterials: () => ({ bundleRoot: attachmentRoot, materialId, manifest: [] }) };
    await expect(runReview(options)).resolves.toMatchObject({ status: "semantic", verdict: "pass" });
    await expect(runReview({ ...options, sourceRoot: repo })).rejects.toThrow(/naked|Workspace/i);
  });
  it("re-captures verify-final from the same Workspace baseline and rejects target drift", async () => {
    const { root, attachmentRoot, task } = fixture("simple-review-final-workspace-");
    const repo = join(root, "repo"); mkdirSync(repo);
    execFileSync("git", ["init", "-q"], { cwd: repo });
    execFileSync("git", ["config", "user.name", "Test"], { cwd: repo });
    execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: repo });
    execFileSync("git", ["commit", "--allow-empty", "-qm", "baseline"], { cwd: repo });
    const candidate = prepareTaskWorkspace(task);
    const workspace = openAcceptedWorkspace(task, { facts: { worktree_root: candidate.worktreeRoot, baseline_commit: candidate.baselineCommit } });
    const providerClient = { run: async () => ({ runtimeId: "r", provider: { provider: "kimi", status: "completed", session_id: "s", output: pass, error: null } }) };
    const run = await runReview({ task, workspace, attachmentRoot, taskId: "task", stage: "verify-code", materials: {}, hostProvider: "codex", providers: ["kimi"], providerClient,
      buildMaterials: () => ({ bundleRoot: attachmentRoot, materialId, manifest: [] }) });
    expect(verifyFinal({ resultRef: run.resultRef, task, workspace, attachmentRoot, taskId: "task", stage: "verify-code", reviewTrack: null })).toMatchObject({ status: "finalized" });
    writeFileSync(join(repo, "target-drift.txt"), "drift\n");
    execFileSync("git", ["add", "-A"], { cwd: repo }); execFileSync("git", ["commit", "-qm", "target drift"], { cwd: repo });
    expect(() => verifyFinal({ resultRef: run.resultRef, task, workspace, attachmentRoot })).toThrow(/WORKTREE_CHANGED_AFTER_REVIEW/);
  });
  it("uses revise > unavailable > pass independent of completion order", () => {
    const validPass = { provider: "a", review: JSON.parse(pass) }; const validRevise = { provider: "b", review: JSON.parse(revise) };
    expect(aggregateProviderResults([validPass, validRevise], 2).verdict).toBe("revise_required");
    expect(aggregateProviderResults([validPass], 2).status).toBe("unavailable");
    expect(aggregateProviderResults([validPass], 1).verdict).toBe("pass");
  });

  it("corrects format once in-session, writes one terminal attempt, then one semantic result", async () => {
    const { attachmentRoot, task } = fixture("simple-review-runner-"); const calls = [];
    const providerClient = { run: async (request) => { calls.push(request); return calls.length === 1
      ? { runtimeId: "runtime", provider: { provider: "kimi", status: "completed", session_id: "session", output: "preface without json", error: null } }
      : { runtimeId: "runtime", provider: { provider: "kimi", status: "completed", session_id: "session", output: pass, error: null } }; } };
    const result = await runReviewFixture({ task, attachmentRoot, taskId: "task", stage: "build-code", materials: {}, hostProvider: "codex", providers: ["kimi"], providerClient,
      captureSource: () => source, buildMaterials: () => ({ bundleRoot: attachmentRoot, materialId, manifest: [] }) });
    expect(result.status).toBe("semantic"); expect(result.verdict).toBe("pass"); expect(calls).toHaveLength(2); expect(calls[1].continuationRuntimeId).toBe("runtime");
    const attempt = JSON.parse(task.readRecord(result.attemptRef)); expect(attempt.terminal_status).toBe("semantic"); expect(attempt.provider_attempts).toHaveLength(2);
    expect(JSON.parse(task.readRecord(attempt.provider_attempts[0].output_ref)).content).toBe("preface without json");
    expect(JSON.parse(task.readRecord(attempt.provider_attempts[1].output_ref)).content).toBe(pass);
    expect(JSON.parse(task.readRecord(result.resultRef)).verdict).toBe("pass");
  });

  it("records OUTPUT_INVALID on the final provider attempt after correction fails", async () => {
    const { attachmentRoot, task } = fixture("simple-review-format-failed-");
    const providerClient = { run: async () => ({ runtimeId: "runtime", provider: { provider: "kimi", status: "completed", session_id: "session", output: "not json", error: null } }) };
    const result = await runReviewFixture({ task, attachmentRoot, taskId: "task", stage: "build-code", materials: {}, hostProvider: "codex", providers: ["kimi"], providerClient,
      captureSource: () => source, buildMaterials: () => ({ bundleRoot: attachmentRoot, materialId, manifest: [] }) });
    const attempt = JSON.parse(task.readRecord(result.attemptRef));
    expect(attempt.provider_attempts).toHaveLength(2);
    expect(attempt.provider_attempts[1]).toMatchObject({ status: "failed", error: { code: "OUTPUT_INVALID" } });
    expect(attempt.provider_attempts[1].output_ref).not.toBe(null);
    expect(result.resultRef).toBe(null);
  });

  it("fresh-runs once only for an unavailable continuation", async () => {
    const { attachmentRoot, task } = fixture("simple-review-fresh-"); const calls = [];
    const providerClient = { run: async (request) => { calls.push(request); return calls.length === 1
      ? { runtimeId: "old", provider: { provider: "opencode", status: "failed", session_id: null, output: null, error: { code: "NO_CONTINUABLE_SESSION", message: "gone" } } }
      : { runtimeId: "new", provider: { provider: "opencode", status: "completed", session_id: "s", output: pass, error: null } }; } };
    const result = await runReviewFixture({ task, attachmentRoot, taskId: "task", stage: "build-code", materials: {}, hostProvider: "codex", providers: ["opencode"], previousRuntimeIds: { opencode: "old" }, providerClient,
      captureSource: () => source, buildMaterials: () => ({ bundleRoot: attachmentRoot, materialId, manifest: [] }) });
    expect(result.verdict).toBe("pass"); expect(calls.map((item) => item.continuationRuntimeId)).toEqual(["old", null]);
    expect(result.runtimeIds).toEqual({ opencode: "new" });
  });

  it("routes continuation runtimes per provider and rejects invalid provider lists", async () => {
    const { attachmentRoot, task } = fixture("simple-review-routing-"); const calls = [];
    const providerClient = { run: async (request) => { calls.push(request); return { runtimeId: `new-${request.provider}`, provider: { provider: request.provider, status: "completed", session_id: "s", output: pass, error: null } }; } };
    const base = { task, attachmentRoot, taskId: "task", stage: "build-code", materials: {}, hostProvider: "codex", providerClient,
      captureSource: () => source, buildMaterials: () => ({ bundleRoot: attachmentRoot, materialId, manifest: [] }) };
    const result = await runReviewFixture({ ...base, providers: ["kimi", "opencode"], previousRuntimeIds: { kimi: "old-k", opencode: "old-o" } });
    expect(calls.map(({ provider, continuationRuntimeId }) => [provider, continuationRuntimeId]).sort()).toEqual([["kimi", "old-k"], ["opencode", "old-o"]]);
    expect(result.runtimeIds).toEqual({ kimi: "new-kimi", opencode: "new-opencode" });
    await expect(runReviewFixture({ ...base, providers: ["kimi", "kimi"] })).rejects.toThrow(/unique/);
    await expect(runReviewFixture({ ...base, providers: ["codex"] })).rejects.toThrow(/differ/);
  });

  it("writes no result when valid reviewers are insufficient", async () => {
    const { attachmentRoot, task } = fixture("simple-review-unavailable-"); const providerClient = { run: async () => ({ runtimeId: "r", provider: { provider: "kimi", status: "failed", session_id: null, output: null, error: { code: "AUTH", message: "no" } } }) };
    const result = await runReviewFixture({ task, attachmentRoot, taskId: "task", stage: "build-code", materials: {}, hostProvider: "codex", providers: ["kimi"], providerClient,
      captureSource: () => source, buildMaterials: () => ({ bundleRoot: attachmentRoot, materialId, manifest: [] }) });
    expect(result.status).toBe("unavailable"); expect(result.resultRef).toBe(null);
    const attempt = JSON.parse(task.readRecord(result.attemptRef)); expect(attempt.provider_attempts[0].output_ref).toBe(null);
  });

  it("keeps a material delivery mismatch outside semantic results", async () => {
    const { attachmentRoot, task } = fixture("simple-review-material-mismatch-");
    const providerClient = { run: async () => { const error = new Error("different material"); error.code = "MATERIAL_INCOMPLETE"; throw error; } };
    const result = await runReviewFixture({ task, attachmentRoot, taskId: "task", stage: "build-code", materials: {}, hostProvider: "codex", providers: ["kimi"], providerClient,
      captureSource: () => source, buildMaterials: () => ({ bundleRoot: attachmentRoot, materialId, manifest: [] }) });
    expect(result.status).toBe("unavailable"); expect(result.resultRef).toBe(null);
    expect(JSON.parse(task.readRecord(result.attemptRef)).error.code).toBe("MATERIAL_INCOMPLETE");
  });
});

describe("verify final", () => {
  it("accepts a legacy worktree v1 result without subject fields", () => {
    const { attachmentRoot, task } = fixture("simple-review-legacy-final-");
    const resultRef = "reviews/results/legacy-worktree.json";
    const legacy = {
      version: "wh-review-result.v1", task_id: "task", stage: "build-code", review_track: null,
      source: { target_commit: source.targetCommit, base_commit: source.baseCommit, base_tree: source.baseTree, captured_head: source.capturedHead },
      snapshot_tree: source.snapshotTree, material_id: materialId, attempt_ref: "reviews/attempts/legacy/attempt.json",
      provider_results: [{ provider: "kimi", output: JSON.parse(pass) }], verdict: "pass", findings: []
    };
    createTaskKernel(task).publishCanonicalRecord(resultRef, Buffer.from(`${JSON.stringify(legacy)}\n`));
    expect(verifyFinal({ resultRef, task, attachmentRoot, captureSource: () => source })).toEqual({ status: "finalized", snapshotTree: source.snapshotTree });
  });

  it("accepts the same full snapshot and rejects drift", async () => {
    const { attachmentRoot, task } = fixture("simple-review-final-");
    const providerClient={run:async()=>({runtimeId:"runtime",provider:{provider:"kimi",status:"completed",session_id:"session",output:pass,error:null}})};
    const run=await runReviewFixture({task,attachmentRoot,taskId:"task",stage:"build-code",materials:{},hostProvider:"codex",providers:["kimi"],providerClient,captureSource:()=>source,buildMaterials:()=>({bundleRoot:attachmentRoot,materialId,manifest:[]})});
    const resultRef=run.resultRef;
    expect(verifyFinal({ resultRef, task, attachmentRoot, taskId: "task", stage: "build-code", reviewTrack: null, captureSource: () => source })).toEqual({ status: "finalized", snapshotTree: source.snapshotTree });
    expect(() => verifyFinal({ resultRef, task, attachmentRoot, captureSource: () => ({ ...source, targetCommit: "9".repeat(40) }) })).toThrow(/WORKTREE_CHANGED_AFTER_REVIEW/);
    expect(() => verifyFinal({ resultRef: "outside.json", task, attachmentRoot, captureSource: () => source })).toThrow(/RESULT_REF_INVALID/);
    const reviseCalls=[]; const reviseClient={run:async()=>{reviseCalls.push(true); return {runtimeId:"runtime",provider:{provider:"kimi",status:"completed",session_id:"session",output:revise,error:null}};}};
    const revised=await runReviewFixture({task,attachmentRoot,taskId:"task",stage:"build-code",materials:{},hostProvider:"codex",providers:["kimi"],providerClient:reviseClient,captureSource:()=>source,buildMaterials:()=>({bundleRoot:attachmentRoot,materialId,manifest:[]})});
    expect(revised).toMatchObject({ reused: true, resultRef });
    expect(reviseCalls).toHaveLength(0);
    expect(verifyFinal({ resultRef:revised.resultRef, task, attachmentRoot, captureSource: () => source })).toEqual({ status: "finalized", snapshotTree: source.snapshotTree });
  });
});

import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseReviewerOutput } from "../review-output.mjs";
import { aggregateProviderResults } from "../review-result.mjs";
import { ReviewProviderClient } from "../review-provider-client.mjs";
import { runReview, verifyFinal } from "../review-runner.mjs";

const materialId = "a".repeat(64);
const source = { targetCommit: "1".repeat(40), baseCommit: "2".repeat(40), baseTree: "3".repeat(40), capturedHead: "4".repeat(40), snapshotTree: "5".repeat(40) };
const pass = JSON.stringify({ verdict: "pass", summary: "ok", findings: [] });
const revise = JSON.stringify({ verdict: "revise_required", summary: "fix", findings: [{ severity: "major", path: "a.js", line: 1, issue: "bug", recommendation: "fix it" }] });

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
  it("uses revise > unavailable > pass independent of completion order", () => {
    const validPass = { provider: "a", review: JSON.parse(pass) }; const validRevise = { provider: "b", review: JSON.parse(revise) };
    expect(aggregateProviderResults([validPass, validRevise], 2).verdict).toBe("revise_required");
    expect(aggregateProviderResults([validPass], 2).status).toBe("unavailable");
    expect(aggregateProviderResults([validPass], 1).verdict).toBe("pass");
  });

  it("corrects format once in-session, writes one terminal attempt, then one semantic result", async () => {
    const root = mkdtempSync(join(tmpdir(), "simple-review-runner-")); const calls = [];
    const providerClient = { run: async (request) => { calls.push(request); return calls.length === 1
      ? { runtimeId: "runtime", provider: { provider: "kimi", status: "completed", session_id: "session", output: "preface without json", error: null } }
      : { runtimeId: "runtime", provider: { provider: "kimi", status: "completed", session_id: "session", output: pass, error: null } }; } };
    const result = await runReview({ reviewDataRoot: root, attachmentRoot: root, taskId: "task", stage: "build-code", materials: {}, hostProvider: "codex", providers: ["kimi"], providerClient,
      captureSource: () => source, buildMaterials: () => ({ bundleRoot: root, materialId, manifest: [] }) });
    expect(result.status).toBe("semantic"); expect(result.verdict).toBe("pass"); expect(calls).toHaveLength(2); expect(calls[1].continuationRuntimeId).toBe("runtime");
    const attempt = JSON.parse(readFileSync(result.attemptPath, "utf8")); expect(attempt.terminal_status).toBe("semantic"); expect(attempt.provider_attempts).toHaveLength(2);
    expect(readFileSync(join(root, attempt.provider_attempts[0].output_ref), "utf8")).toBe("preface without json");
    expect(readFileSync(join(root, attempt.provider_attempts[1].output_ref), "utf8")).toBe(pass);
    expect(JSON.parse(readFileSync(result.resultPath, "utf8")).verdict).toBe("pass");
  });

  it("records OUTPUT_INVALID on the final provider attempt after correction fails", async () => {
    const root = mkdtempSync(join(tmpdir(), "simple-review-format-failed-"));
    const providerClient = { run: async () => ({ runtimeId: "runtime", provider: { provider: "kimi", status: "completed", session_id: "session", output: "not json", error: null } }) };
    const result = await runReview({ reviewDataRoot: root, attachmentRoot: root, taskId: "task", stage: "build-code", materials: {}, hostProvider: "codex", providers: ["kimi"], providerClient,
      captureSource: () => source, buildMaterials: () => ({ bundleRoot: root, materialId, manifest: [] }) });
    const attempt = JSON.parse(readFileSync(result.attemptPath, "utf8"));
    expect(attempt.provider_attempts).toHaveLength(2);
    expect(attempt.provider_attempts[1]).toMatchObject({ status: "failed", error: { code: "OUTPUT_INVALID" } });
    expect(attempt.provider_attempts[1].output_ref).not.toBe(null);
    expect(result.resultPath).toBe(null);
  });

  it("fresh-runs once only for an unavailable continuation", async () => {
    const root = mkdtempSync(join(tmpdir(), "simple-review-fresh-")); const calls = [];
    const providerClient = { run: async (request) => { calls.push(request); return calls.length === 1
      ? { runtimeId: "old", provider: { provider: "opencode", status: "failed", session_id: null, output: null, error: { code: "NO_CONTINUABLE_SESSION", message: "gone" } } }
      : { runtimeId: "new", provider: { provider: "opencode", status: "completed", session_id: "s", output: pass, error: null } }; } };
    const result = await runReview({ reviewDataRoot: root, attachmentRoot: root, taskId: "task", stage: "build-code", materials: {}, hostProvider: "codex", providers: ["opencode"], previousRuntimeIds: { opencode: "old" }, providerClient,
      captureSource: () => source, buildMaterials: () => ({ bundleRoot: root, materialId, manifest: [] }) });
    expect(result.verdict).toBe("pass"); expect(calls.map((item) => item.continuationRuntimeId)).toEqual(["old", null]);
    expect(result.runtimeIds).toEqual({ opencode: "new" });
  });

  it("routes continuation runtimes per provider and rejects invalid provider lists", async () => {
    const root = mkdtempSync(join(tmpdir(), "simple-review-routing-")); const calls = [];
    const providerClient = { run: async (request) => { calls.push(request); return { runtimeId: `new-${request.provider}`, provider: { provider: request.provider, status: "completed", session_id: "s", output: pass, error: null } }; } };
    const base = { reviewDataRoot: root, attachmentRoot: root, taskId: "task", stage: "build-code", materials: {}, hostProvider: "codex", providerClient,
      captureSource: () => source, buildMaterials: () => ({ bundleRoot: root, materialId, manifest: [] }) };
    const result = await runReview({ ...base, providers: ["kimi", "opencode"], previousRuntimeIds: { kimi: "old-k", opencode: "old-o" } });
    expect(calls.map(({ provider, continuationRuntimeId }) => [provider, continuationRuntimeId]).sort()).toEqual([["kimi", "old-k"], ["opencode", "old-o"]]);
    expect(result.runtimeIds).toEqual({ kimi: "new-kimi", opencode: "new-opencode" });
    await expect(runReview({ ...base, providers: ["kimi", "kimi"] })).rejects.toThrow(/unique/);
    await expect(runReview({ ...base, providers: ["codex"] })).rejects.toThrow(/differ/);
  });

  it("writes no result when valid reviewers are insufficient", async () => {
    const root = mkdtempSync(join(tmpdir(), "simple-review-unavailable-")); const providerClient = { run: async () => ({ runtimeId: "r", provider: { provider: "kimi", status: "failed", session_id: null, output: null, error: { code: "AUTH", message: "no" } } }) };
    const result = await runReview({ reviewDataRoot: root, attachmentRoot: root, taskId: "task", stage: "build-code", materials: {}, hostProvider: "codex", providers: ["kimi"], providerClient,
      captureSource: () => source, buildMaterials: () => ({ bundleRoot: root, materialId, manifest: [] }) });
    expect(result.status).toBe("unavailable"); expect(result.resultPath).toBe(null);
    const attempt = JSON.parse(readFileSync(result.attemptPath, "utf8")); expect(attempt.provider_attempts[0].output_ref).toBe(null);
  });

  it("keeps a material delivery mismatch outside semantic results", async () => {
    const root = mkdtempSync(join(tmpdir(), "simple-review-material-mismatch-"));
    const providerClient = { run: async () => { const error = new Error("different material"); error.code = "MATERIAL_INCOMPLETE"; throw error; } };
    const result = await runReview({ reviewDataRoot: root, attachmentRoot: root, taskId: "task", stage: "build-code", materials: {}, hostProvider: "codex", providers: ["kimi"], providerClient,
      captureSource: () => source, buildMaterials: () => ({ bundleRoot: root, materialId, manifest: [] }) });
    expect(result.status).toBe("unavailable"); expect(result.resultPath).toBe(null);
    expect(JSON.parse(readFileSync(result.attemptPath, "utf8")).error.code).toBe("MATERIAL_INCOMPLETE");
  });
});

describe("verify final", () => {
  it("accepts the same full snapshot and rejects drift", () => {
    const root = mkdtempSync(join(tmpdir(), "simple-review-final-")); const resultPath = join(root, "result.json");
    const result = { version: "wh-review-result.v1", task_id: "task", stage: "build-code", review_track: null,
      source: { target_commit: source.targetCommit, base_commit: source.baseCommit, base_tree: source.baseTree, captured_head: source.capturedHead }, snapshot_tree: source.snapshotTree,
      material_id: materialId, attempt_ref: "reviews/attempts/a/attempt.json", provider_results: [{ provider: "kimi", output: JSON.parse(pass) }], verdict: "pass", findings: [] };
    writeFileSync(resultPath, JSON.stringify(result));
    expect(verifyFinal({ resultPath: "result.json", reviewDataRoot: root, taskId: "task", stage: "build-code", reviewTrack: null, captureSource: () => source })).toEqual({ status: "finalized", snapshotTree: source.snapshotTree });
    expect(() => verifyFinal({ resultPath, reviewDataRoot: root, captureSource: () => ({ ...source, targetCommit: "9".repeat(40) }) })).toThrow(/WORKTREE_CHANGED_AFTER_REVIEW/);
    expect(() => verifyFinal({ resultPath: join(tmpdir(), "outside.json"), reviewDataRoot: root, captureSource: () => source })).toThrow(/RESULT_REF_INVALID/);
    writeFileSync(resultPath, JSON.stringify({ ...result, verdict: "revise_required", findings: [{ provider: "kimi", ...JSON.parse(revise).findings[0] }], provider_results: [{ provider: "kimi", output: JSON.parse(revise) }] }));
    expect(() => verifyFinal({ resultPath, reviewDataRoot: root, captureSource: () => source })).toThrow(/REVIEW_NOT_APPROVED/);
  });
});

import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { runReview } from "../review-runner.mjs";

const oid = "1".repeat(40); const materialId = "a".repeat(64);
const source = { targetCommit: oid, baseCommit: oid, baseTree: oid, capturedHead: oid, snapshotTree: oid };
const pass = JSON.stringify({ verdict: "pass", summary: "complete", findings: [] });
const stages = [["make-decision", "direction"], ["make-decision", "detail"], ["build-spec", null], ["build-plan", null], ["build-code", null], ["verify-code", null]];
function bundle(root) { return { bundleRoot: root, attachmentRoot: root, sourcePrefix: ".wh-review-packets/fake", materialId, manifest: [] }; }
function client(output = pass) { return { run: async ({ provider }) => ({ runtimeId: "runtime", provider: { provider, status: "completed", session_id: "session", output, error: null } }) }; }

describe("simple runner fake E2E and recovery", () => {
  it("publishes one formal result for every stage/track", async () => {
    for (const [stage, reviewTrack] of stages) {
      const root = mkdtempSync(join(tmpdir(), "wh-review-e2e-"));
      const out = await runReview({ reviewDataRoot: root, attachmentRoot: root, taskId: "task", stage, reviewTrack,
        hostProvider: "codex", providers: ["kimi"], providerClient: client(), captureSource: () => source, buildMaterials: () => bundle(root) });
      expect(out.verdict).toBe("pass");
      const result = JSON.parse(readFileSync(out.resultPath, "utf8")); expect(result).toMatchObject({ stage, review_track: reviewTrack, snapshot_tree: oid, material_id: materialId });
    }
  });

  it("does not poison a later run after auth/start failure", async () => {
    const root = mkdtempSync(join(tmpdir(), "wh-review-recover-"));
    const failed = { run: async () => { const error = new Error("no auth"); error.code = "AUTH"; throw error; } };
    const input = { reviewDataRoot: root, attachmentRoot: root, taskId: "task", stage: "build-code", hostProvider: "codex", providers: ["kimi"], captureSource: () => source, buildMaterials: () => bundle(root) };
    expect((await runReview({ ...input, providerClient: failed })).status).toBe("unavailable");
    expect((await runReview({ ...input, providerClient: client() })).verdict).toBe("pass");
  });

  it("keeps protocol mismatch and invalid format non-semantic", async () => {
    const root = mkdtempSync(join(tmpdir(), "wh-review-fault-"));
    const protocol = { run: async () => { const error = new Error("bad protocol"); error.code = "PROTOCOL_INCOMPATIBLE"; throw error; } };
    const input = { reviewDataRoot: root, attachmentRoot: root, taskId: "task", stage: "build-code", hostProvider: "codex", providers: ["kimi"], captureSource: () => source, buildMaterials: () => bundle(root) };
    expect((await runReview({ ...input, providerClient: protocol })).resultPath).toBe(null);
    expect((await runReview({ ...input, providerClient: client("not json") })).resultPath).toBe(null);
  });
});

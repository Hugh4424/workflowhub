import { afterEach } from "vitest";
import { mkdirSync, mkdtempSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { runReviewFixture } from "../review-runner.mjs";
import { createTask } from "../../../../core/task-handle.mjs";

const oid = "1".repeat(40); const materialId = "a".repeat(64);
const source = { targetCommit: oid, baseCommit: oid, baseTree: oid, capturedHead: oid, snapshotTree: oid };
const pass = JSON.stringify({ verdict: "pass", summary: "complete", findings: [] });
const stages = [["make-decision", "direction"], ["make-decision", "detail"], ["build-spec", null], ["build-plan", null], ["build-code", null], ["verify-code", null]];
function bundle(root) { return { bundleRoot: root, attachmentRoot: root, sourcePrefix: ".wh-review-packets/fake", materialId, manifest: [] }; }
function client(output = pass) { return { run: async ({ provider }) => ({ runtimeId: "runtime", provider: { provider, status: "completed", session_id: "session", output, error: null } }) }; }
const temporary=[];
function fixture(prefix) { const root=realpathSync(mkdtempSync(join(tmpdir(),prefix))); temporary.push(root); const attachmentRoot=join(root,"attachments"); mkdirSync(attachmentRoot); const task=createTask({storageRoot:root,taskPath:join(root,"Projects","Demo","tasks","task"),manifest:{schema_version:"1.0.0",project_name:"Demo",task_id:"task",created_at:new Date().toISOString(),target_repo_root:join(root,"repo"),issue_ids:[],inputs:{}}}); return {root,attachmentRoot,task}; }
afterEach(()=>{while(temporary.length)rmSync(temporary.pop(),{recursive:true,force:true});});

describe("simple runner fake E2E and recovery", () => {
  it("publishes one formal result for every stage/track", async () => {
    for (const [stage, reviewTrack] of stages) {
      const { attachmentRoot, task } = fixture("wh-review-e2e-");
      const out = await runReviewFixture({ task, attachmentRoot, taskId: "task", stage, reviewTrack,
        hostProvider: "codex", providers: ["kimi"], providerClient: client(), captureSource: () => source, buildMaterials: () => bundle(attachmentRoot) });
      expect(out.verdict).toBe("pass");
      const result = JSON.parse(task.readRecord(out.resultRef)); expect(result).toMatchObject({ stage, review_track: reviewTrack, snapshot_tree: oid, material_id: materialId });
    }
  });

  it("does not poison a later run after auth/start failure", async () => {
    const { attachmentRoot, task } = fixture("wh-review-recover-");
    const failed = { run: async () => { const error = new Error("no auth"); error.code = "AUTH"; throw error; } };
    const input = { task, attachmentRoot, taskId: "task", stage: "build-code", hostProvider: "codex", providers: ["kimi"], captureSource: () => source, buildMaterials: () => bundle(attachmentRoot) };
    expect((await runReviewFixture({ ...input, providerClient: failed })).status).toBe("unavailable");
    expect((await runReviewFixture({ ...input, providerClient: client() })).verdict).toBe("pass");
  });

  it("keeps protocol mismatch and invalid format non-semantic", async () => {
    const { attachmentRoot, task } = fixture("wh-review-fault-");
    const protocol = { run: async () => { const error = new Error("bad protocol"); error.code = "PROTOCOL_INCOMPATIBLE"; throw error; } };
    const input = { task, attachmentRoot, taskId: "task", stage: "build-code", hostProvider: "codex", providers: ["kimi"], captureSource: () => source, buildMaterials: () => bundle(attachmentRoot) };
    expect((await runReviewFixture({ ...input, providerClient: protocol })).resultRef).toBe(null);
    expect((await runReviewFixture({ ...input, providerClient: client("not json") })).resultRef).toBe(null);
  });
});

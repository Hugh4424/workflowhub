import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { createMulticaAdapter } from "../adapters/multica/index.mjs";
import { createTrustedSignatureProof, createTrustedSignatureVerifier } from "../core/human-confirmation.mjs";
import { createTask } from "../core/task-handle.mjs";
import { createTaskKernel } from "../core/task-kernel.mjs";
import { prepareTaskWorkspace } from "../core/workspace.mjs";

const KEY = "workflowhub-multica-e2e-signing-key-v1";
const runtime = new URL("../bin/workflowhub", import.meta.url).pathname;
const roots = [];
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

function fixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-multica-e2e-"))); roots.push(root);
  const repo = join(root, "repo"); mkdirSync(repo);
  execFileSync("git", ["init", "-q"], { cwd: repo });
  execFileSync("git", ["config", "user.name", "Test"], { cwd: repo });
  execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: repo });
  writeFileSync(join(repo, "README.md"), "fixture\n");
  execFileSync("git", ["add", "README.md"], { cwd: repo });
  execFileSync("git", ["commit", "-qm", "fixture"], { cwd: repo });
  mkdirSync(join(root, ".config", "workflowhub"), { recursive: true });
  writeFileSync(join(root, ".config", "workflowhub", "config.json"), `${JSON.stringify({ confirmation_signing_key: KEY })}\n`);
  const task = createTask({ storageRoot: root, manifest: { schema_version: "1.0.0", project_name: "Demo", task_id: "multica-e2e", created_at: "2026-07-17T00:00:00.000Z", target_repo_root: repo, issue_ids: [], inputs: {} } });
  const candidate = prepareTaskWorkspace(task);
  const kernel = createTaskKernel(task, { candidateWorkspace: candidate, confirmationVerification: { verifyTrustedSignature: createTrustedSignatureVerifier(KEY) } });
  const attempt = kernel.publishAttempt("make-decision", { facts: { worktree_root: candidate.worktreeRoot, baseline_commit: candidate.baselineCommit, snapshot_tree: candidate.captureSnapshot().tree, decision: "go" } });
  return { root, repo, task, kernel, attempt };
}

function cliCapability(f) {
  return async ({ confirmation }) => {
    const input = JSON.stringify({ schema_id: "https://workflowhub.dev/schemas/cli-input.v1.schema.json", schema_version: "1.0.0", command: "stage", input_source: "@-", payload: { stage_payload: confirmation } });
    const child = spawnSync(process.execPath, [runtime, "stage", "confirm", "--stage=make-decision", "--project=Demo", "--task=multica-e2e", `--attempt=${f.attempt.attempt_ref}`, "--input=@-"], { cwd: f.repo, env: { ...process.env, HOME: f.root, WORKFLOWHUB_TASK_DIR: f.root }, encoding: "utf8", input });
    if (child.status !== 0) throw new Error(`${child.stdout}\n${child.stderr}`);
    return JSON.parse(child.stdout);
  };
}

function eventAndRequest(f) {
  const boundRef = `results/make-decision/${f.attempt.attempt_ref}`;
  const event = { ref: "source-events/multica-comment-42.json", sha256: "b".repeat(64), occurred_at: "2026-07-17T00:00:00.000Z", actor_id: "humans/reviewer-7", actor_type: "human", decision: "accepted", proof_ref: "platform-proofs/multica-comment-42.json", proof_hash: "c".repeat(64), private_session: "never-export" };
  const request = { event_ref: event.ref, purpose: "stage", task_id: "multica-e2e", bound_ref: boundRef, bound_hash: sha256(f.task.readRecord(boundRef)) };
  return { event, request };
}

afterEach(() => { while (roots.length) rmSync(roots.pop(), { recursive: true, force: true }); });

describe("Multica canonical confirmation e2e", () => {
  it("flows verified readback through the public CLI into TaskKernel acceptance", async () => {
    const f = fixture(), { event, request } = eventAndRequest(f);
    const adapter = createMulticaAdapter({
      now: () => "2026-07-17T00:00:01.000Z", readbackEvent: async () => event,
      verifyPlatformEvent: async (candidate) => candidate === event,
      signConfirmation: async (envelope) => createTrustedSignatureProof(KEY, envelope),
      publicCli: cliCapability(f), writeStatus: async () => {},
    });
    const confirmation = await adapter.authenticateEvent(request);
    expect(JSON.stringify(confirmation)).not.toMatch(/private_session|never-export/);
    const dispatched = await adapter.dispatch({ confirmation });
    expect(dispatched).toMatchObject({ dispatched: true, result: { status: "ok", exit_code: 0 } });
    const accepted = f.kernel.acceptAttempt("make-decision", f.attempt.attempt_ref, dispatched.result.result_ref);
    expect(accepted).toMatchObject({ stage: "make-decision", confirmation_ref: dispatched.result.result_ref, acceptance_mode: "human" });
  });

  it("fails closed for forged readback and forged launcher signature", async () => {
    const f = fixture(), { event, request } = eventAndRequest(f);
    const rejectedReadback = createMulticaAdapter({ readbackEvent: async () => event, verifyPlatformEvent: async () => false, signConfirmation: async () => "0".repeat(64), publicCli: cliCapability(f), writeStatus: async () => {} });
    await expect(rejectedReadback.authenticateEvent(request)).rejects.toThrow(/verification failed/i);

    const forgedSignature = createMulticaAdapter({ now: () => "2026-07-17T00:00:01.000Z", readbackEvent: async () => event, verifyPlatformEvent: async () => true, signConfirmation: async () => "0".repeat(64), publicCli: cliCapability(f), writeStatus: async () => {} });
    const confirmation = await forgedSignature.authenticateEvent(request);
    await expect(forgedSignature.dispatch({ confirmation })).resolves.toEqual({ dispatched: false, code: "DISPATCH_FAILED" });
    expect(() => f.task.readRecord(`confirmations/make-decision/${f.attempt.attempt_ref}`)).toThrow();
  });
});

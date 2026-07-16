import { afterEach, describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createTask } from "../core/task-handle.mjs";

const roots = [];
const runtime = new URL("../scripts/stage-runtime.mjs", import.meta.url).pathname;
afterEach(() => { while (roots.length) rmSync(roots.pop(), { recursive: true, force: true }); });

function linkedWorktrees(repo) {
  return String(execFileSync("git", ["worktree", "list", "--porcelain"], { cwd: repo, encoding: "utf8" }))
    .split("\n")
    .filter((line) => line.startsWith("worktree "))
    .map((line) => realpathSync(line.slice("worktree ".length)))
    .filter((path) => path !== realpathSync(repo));
}

describe("official make-decision CLI", () => {
  it("binds canonical decision receipt ref and exact byte hash into facts", () => {
    const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-decision-cli-"))); roots.push(root);
    const repo = join(root, "repo"); mkdirSync(repo);
    execFileSync("git", ["init", "-q"], { cwd: repo });
    execFileSync("git", ["config", "user.name", "Test"], { cwd: repo });
    execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: repo });
    execFileSync("git", ["commit", "--allow-empty", "-qm", "base"], { cwd: repo });
    const head = String(execFileSync("git", ["rev-parse", "HEAD"], { cwd: repo })).trim();
    const taskPath = join(root, "Projects", "Demo", "tasks", "decision-task");
    const task = createTask({ storageRoot: root, taskPath, manifest: { schema_version: "1.0.0", project_name: "Demo", task_id: "decision-task", created_at: new Date().toISOString(), target_repo_root: repo, issue_ids: [], inputs: {} } });
    const decisionPayload = join(root, "decision.json"); writeFileSync(decisionPayload, `${JSON.stringify({ content: "go" })}\n`);
    const input = join(root, "input.json"); writeFileSync(input, `${JSON.stringify({ receipts: { decision: "receipts/decision.json" } })}\n`);
    const env = { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root };
    const invoke = (args) => execFileSync(process.execPath, [runtime, ...args], { cwd: repo, env, encoding: "utf8" });
    expect(linkedWorktrees(repo)).toEqual([]);
    const decision = JSON.parse(invoke(["receipt", "--stage=make-decision", "--project=Demo", "--task=decision-task", "--component=decision", `--input=${decisionPayload}`]));
    expect(decision.receipt_ref).toBe("receipts/decision.json");
    expect(linkedWorktrees(repo)).toEqual([]);
    const badInput = spawnSync(process.execPath, [runtime, "run", "--stage=make-decision", "--project=Demo", "--task=decision-task", `--input=${join(root, "missing.json")}`], { cwd: repo, env, encoding: "utf8" });
    expect(badInput.status).not.toBe(0);
    expect(badInput.stderr).toMatch(/ENOENT|missing\.json/i);
    expect(linkedWorktrees(repo)).toEqual([]);
    const decisionRaw = task.readRecord(decision.receipt_ref);
    const result = JSON.parse(invoke(["run", "--stage=make-decision", "--project=Demo", "--task=decision-task", `--input=${input}`]));
    const worktree = realpathSync(`${repo}-decision-task`);
    expect(result.attempt.facts).toMatchObject({
      decision_ref: "receipts/decision.json", decision_hash: createHash("sha256").update(decisionRaw).digest("hex"),
      worktree_root: worktree, baseline_commit: head,
    });
    expect(linkedWorktrees(repo)).toEqual([worktree]);
    expect(() => task.readRecord("results/make-decision/accepted.json")).toThrow();
    const specPayload = join(root, "spec.json"); writeFileSync(specPayload, `${JSON.stringify({ content: "# Spec\n" })}\n`);
    const beforeAccept = spawnSync(process.execPath, [runtime, "receipt", "--stage=build-spec", "--project=Demo", "--task=decision-task", "--component=spec", `--input=${specPayload}`], { cwd: repo, env, encoding: "utf8" });
    expect(beforeAccept.status).not.toBe(0);
    expect(beforeAccept.stderr).toMatch(/accepted make-decision|stage requires/i);
    expect(linkedWorktrees(repo)).toEqual([worktree]);
    execFileSync("git", ["commit", "--allow-empty", "-qm", "unrelated main advance"], { cwd: repo });
    const confirmation = JSON.parse(invoke(["confirm", "--stage=make-decision", "--project=Demo", "--task=decision-task", `--attempt=${result.attempt_ref}`, "--decision=accepted"]));
    expect(linkedWorktrees(repo)).toEqual([worktree]);
    const dirty = join(worktree, "unexpected.txt"); writeFileSync(dirty, "dirty");
    const blocked = spawnSync(process.execPath, [runtime, "accept", "--stage=make-decision", "--project=Demo", "--task=decision-task", `--attempt=${result.attempt_ref}`, `--human-confirmation-ref=${confirmation.ref}`], { cwd: repo, env, encoding: "utf8" });
    expect(blocked.status).not.toBe(0); expect(blocked.stderr).toMatch(/dirty|clean|changed/i);
    unlinkSync(dirty);
    expect(JSON.parse(invoke(["accept", "--stage=make-decision", "--project=Demo", "--task=decision-task", `--attempt=${result.attempt_ref}`, `--human-confirmation-ref=${confirmation.ref}`]))).toMatchObject({ stage: "make-decision" });
    expect(linkedWorktrees(repo)).toEqual([worktree]);
    expect(JSON.parse(invoke(["receipt", "--stage=build-spec", "--project=Demo", "--task=decision-task", "--component=spec", `--input=${specPayload}`]))).toMatchObject({ receipt_ref: "receipts/spec.json" });
  });

  it("rejects removed caller-owned workspace arguments explicitly", () => {
    const result = spawnSync(process.execPath, [runtime, "run", "--stage=make-decision", "--project=Demo", "--task=decision-task", "--worktree-root=/tmp/legacy", "--baseline-commit=deadbeef", "--input=/tmp/input.json"], { cwd: process.cwd(), encoding: "utf8" });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/no longer supported|owns deterministic worktree/i);
  });
});

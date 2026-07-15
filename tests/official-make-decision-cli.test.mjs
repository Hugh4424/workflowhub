import { afterEach, describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createTask } from "../core/task-handle.mjs";
import { writeOfficialComponentReceipt } from "../core/canonical-receipt-writer.mjs";

const roots = [];
afterEach(() => { while (roots.length) rmSync(roots.pop(), { recursive: true, force: true }); });

describe("official make-decision CLI", () => {
  it("binds canonical decision receipt ref and exact byte hash into facts", () => {
    const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-decision-cli-"))); roots.push(root);
    const repo = join(root, "repo"); const worktree = join(root, "worktree"); mkdirSync(repo);
    execFileSync("git", ["init", "-q"], { cwd: repo });
    execFileSync("git", ["config", "user.name", "Test"], { cwd: repo });
    execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: repo });
    execFileSync("git", ["commit", "--allow-empty", "-qm", "base"], { cwd: repo });
    const head = String(execFileSync("git", ["rev-parse", "HEAD"], { cwd: repo })).trim();
    execFileSync("git", ["worktree", "add", "-q", worktree, head], { cwd: repo });
    const taskPath = join(root, "Projects", "Demo", "tasks", "decision-task");
    const task = createTask({ storageRoot: root, taskPath, manifest: { schema_version: "1.0.0", project_name: "Demo", task_id: "decision-task", created_at: new Date().toISOString(), target_repo_root: repo, issue_ids: [], inputs: {} } });
    const decision = writeOfficialComponentReceipt({ task, stage: "make-decision", component: "decision", payload: { content: "go" } });
    const decisionRaw = task.readRecord(decision.ref);
    const input = join(root, "input.json"); writeFileSync(input, `${JSON.stringify({ receipts: { decision: "receipts/decision.json" } })}\n`);
    const output = execFileSync(process.execPath, ["scripts/stage-runtime.mjs", "run", "--stage=make-decision", "--project=Demo", "--task=decision-task", `--worktree-root=${worktree}`, `--baseline-commit=${head}`, `--input=${input}`], {
      cwd: process.cwd(), env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root }, encoding: "utf8",
    });
    expect(JSON.parse(output).attempt.facts).toMatchObject({
      decision_ref: "receipts/decision.json",
      decision_hash: createHash("sha256").update(decisionRaw).digest("hex"),
      worktree_root: realpathSync(worktree), baseline_commit: head,
    });
  });
});

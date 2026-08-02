import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { chmodSync, mkdtempSync, mkdirSync, readdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

import {
  captureExecutionSnapshot,
  captureGitWorktreeSnapshot,
} from "../../runtime/task/git-worktree-snapshot.mjs";

function git(root, args) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

describe("execution snapshot evidence isolation", () => {
  it("stores dirty snapshots outside a read-only repository object database", () => {
    const root = mkdtempSync(resolve(tmpdir(), "workflowhub-readonly-snapshot-"));
    try {
      git(root, ["init", "-q"]);
      git(root, ["config", "user.name", "WorkflowHub Test"]);
      git(root, ["config", "user.email", "workflowhub-test@local"]);
      writeFileSync(resolve(root, "source.txt"), "initial\n");
      git(root, ["add", "source.txt"]);
      git(root, ["commit", "-qm", "fixture"]);
      const objects = resolve(root, ".git", "objects");
      const beforeObjects = readdirSync(objects, { recursive: true }).sort();
      chmodSync(objects, 0o555);
      try {
        writeFileSync(resolve(root, "source.txt"), "changed\n");
        writeFileSync(resolve(root, "untracked.txt"), "new\n");
        const snapshot = captureGitWorktreeSnapshot(root);
        expect(String(execFileSync("git", ["show", `${snapshot.commit}:source.txt`], { cwd: root, encoding: "utf8" }))).toBe("changed\n");
        expect(readdirSync(objects, { recursive: true }).sort()).toEqual(beforeObjects);
      } finally {
        chmodSync(objects, 0o755);
      }
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("ignores evidence-only writes but remains strict for source changes", () => {
    const root = mkdtempSync(resolve(tmpdir(), "workflowhub-execution-snapshot-"));
    try {
      git(root, ["init", "-q"]);
      git(root, ["config", "user.name", "WorkflowHub Test"]);
      git(root, ["config", "user.email", "workflowhub-test@local"]);
      writeFileSync(resolve(root, "source.txt"), "initial\n");
      git(root, ["add", "source.txt"]);
      git(root, ["commit", "-qm", "fixture"]);

      const before = captureExecutionSnapshot(root);
      mkdirSync(resolve(root, "evidence/phase-1"), { recursive: true });
      writeFileSync(resolve(root, "evidence/phase-1/final-gates.json"), "{\"status\":\"pass\"}\n");
      expect(captureExecutionSnapshot(root).tree).toBe(before.tree);
      expect(captureGitWorktreeSnapshot(root).tree).not.toBe(before.tree);

      writeFileSync(resolve(root, "source.txt"), "changed\n");
      expect(captureExecutionSnapshot(root).tree).not.toBe(before.tree);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

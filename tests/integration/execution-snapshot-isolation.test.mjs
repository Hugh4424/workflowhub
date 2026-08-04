import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { chmodSync, mkdtempSync, mkdirSync, readdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

import {
  assertCurrentSourceDigest,
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

  it("binds hydrated LFS content and refuses pointer-only formal snapshots", () => {
    const root = mkdtempSync(resolve(tmpdir(), "workflowhub-lfs-snapshot-"));
    try {
      git(root, ["init", "-q"]);
      git(root, ["config", "user.name", "WorkflowHub Test"]);
      git(root, ["config", "user.email", "workflowhub-test@local"]);
      writeFileSync(resolve(root, ".gitattributes"), "*.bin filter=lfs diff=lfs merge=lfs -text\n");
      writeFileSync(resolve(root, "payload.bin"), "baseline\n");
      git(root, ["add", "."]);
      git(root, ["commit", "-qm", "fixture"]);

      writeFileSync(resolve(root, "payload.bin"), [
        "version https://git-lfs.github.com/spec/v1",
        "oid sha256:" + "a".repeat(64),
        "size 8",
        "",
      ].join("\n"));
      expect(() => captureGitWorktreeSnapshot(root)).toThrow(/FORMAL_LFS_CONTENT_UNAVAILABLE/);

      const hydrated = Buffer.from("real bytes\n");
      writeFileSync(resolve(root, "payload.bin"), hydrated);
      const snapshot = captureGitWorktreeSnapshot(root);
      const source = snapshot.source_manifest.entries.find((entry) => entry.path === "payload.bin");
      expect(snapshot.source_manifest).toMatchObject({
        schema_version: "workflowhub-source-manifest.v1",
        head_commit: git(root, ["rev-parse", "HEAD"]),
        git_tree: git(root, ["rev-parse", "HEAD^{tree}"]),
        content_tree: expect.stringMatching(/^[a-f0-9]{40}$/),
      });
      expect(source).toMatchObject({
        filter: "lfs",
        git_blob_oid: expect.stringMatching(/^[a-f0-9]{40}$/),
        content_sha256: createHash("sha256").update(hydrated).digest("hex"),
        lfs: { configured: true, pointer: false, hydrated: true, oid: null, size: null },
      });
      expect(snapshot.source_digest).toMatch(/^[a-f0-9]{64}$/);
      expect(assertCurrentSourceDigest(root, snapshot.source_digest).source_digest).toBe(snapshot.source_digest);

      mkdirSync(resolve(root, "evidence"), { recursive: true });
      writeFileSync(resolve(root, "evidence", "ignored-by-execution-snapshot.txt"), "receipt\n");
      expect(assertCurrentSourceDigest(root, snapshot.source_digest).source_digest).toBe(snapshot.source_digest);

      writeFileSync(resolve(root, "payload.bin"), "changed bytes\n");
      expect(() => assertCurrentSourceDigest(root, snapshot.source_digest)).toThrow(/FORMAL_SNAPSHOT_MISMATCH/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

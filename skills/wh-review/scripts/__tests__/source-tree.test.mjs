import { afterEach, describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { assertCurrentTree, buildTreeMaterial, captureWorktreeTree, headTree } from "../source-tree.mjs";

const roots = [];
afterEach(() => roots.splice(0).forEach((root) => rmSync(root, { recursive: true, force: true })));

function git(root, args, encoding = "utf8") {
  return execFileSync("git", args, { cwd: root, encoding }).toString().trim();
}
function gitBytes(root, args) { return execFileSync("git", args, { cwd: root }); }
function sha(bytes) { return createHash("sha256").update(bytes).digest("hex"); }
function root() {
  const value = mkdtempSync(join(tmpdir(), "wh-source-tree-")); roots.push(value);
  git(value, ["init", "-q"]); git(value, ["config", "user.email", "review@example.test"]); git(value, ["config", "user.name", "Review Test"]);
  writeFileSync(join(value, ".gitignore"), "ignored.txt\n");
  writeFileSync(join(value, "staged.txt"), "base staged\n");
  writeFileSync(join(value, "modified.txt"), "base modified\n");
  writeFileSync(join(value, "deleted.txt"), "delete me\n");
  writeFileSync(join(value, "renamed.txt"), `${"rename content ".repeat(40)}\n`);
  writeFileSync(join(value, "binary.bin"), Buffer.from([0, 1, 2, 3, 0, 255]));
  git(value, ["add", "."]); git(value, ["commit", "-qm", "base"]);
  return value;
}

describe("source-tree", () => {
  it("captures staged, unstaged, untracked, deleted, renamed, and binary worktree content without changing the real repository state", () => {
    const repository = root();
    writeFileSync(join(repository, "staged.txt"), "staged index\n"); git(repository, ["add", "staged.txt"]);
    writeFileSync(join(repository, "staged.txt"), "unstaged worktree wins\n");
    writeFileSync(join(repository, "modified.txt"), "modified without staging\n");
    rmSync(join(repository, "deleted.txt"));
    git(repository, ["mv", "renamed.txt", "renamed-now.txt"]);
    writeFileSync(join(repository, "untracked.txt"), "untracked is reviewable\n");
    writeFileSync(join(repository, "binary.bin"), Buffer.from([0, 9, 2, 3, 0, 255, 8]));
    writeFileSync(join(repository, "ignored.txt"), "must not enter the tree\n");

    const before = {
      head: git(repository, ["rev-parse", "HEAD"]),
      index: git(repository, ["diff", "--cached", "--binary", "HEAD"]),
      status: git(repository, ["status", "--porcelain=v2", "--untracked-files=all"]),
    };
    const snapshotTree = captureWorktreeTree(repository);
    const after = {
      head: git(repository, ["rev-parse", "HEAD"]),
      index: git(repository, ["diff", "--cached", "--binary", "HEAD"]),
      status: git(repository, ["status", "--porcelain=v2", "--untracked-files=all"]),
    };

    expect(after).toEqual(before);
    expect(snapshotTree).not.toBe(headTree(repository));
    expect(git(repository, ["ls-tree", "-r", "--name-only", snapshotTree]).split("\n")).toEqual(expect.arrayContaining([
      "staged.txt", "modified.txt", "untracked.txt", "renamed-now.txt", "binary.bin",
    ]));
    expect(git(repository, ["ls-tree", "-r", "--name-only", snapshotTree])).not.toContain("deleted.txt");
    expect(git(repository, ["ls-tree", "-r", "--name-only", snapshotTree])).not.toContain("ignored.txt");
    expect(git(repository, ["show", `${snapshotTree}:staged.txt`])).toBe("unstaged worktree wins");
    expect(git(repository, ["show", `${snapshotTree}:untracked.txt`])).toBe("untracked is reviewable");
  });

  it("builds binary-safe material and file hashes directly from the captured tree", () => {
    const repository = root(); const baseTree = headTree(repository);
    const binary = Buffer.from([0, 0, 255, 17, 0, 23, 99]);
    writeFileSync(join(repository, "binary.bin"), binary);
    writeFileSync(join(repository, "new.txt"), "new review material\n");
    const snapshotTree = captureWorktreeTree(repository, { baseTree });
    const material = buildTreeMaterial(repository, { baseTree, snapshotTree });
    const expectedDiff = execFileSync("git", ["diff", "--no-ext-diff", "--binary", "--find-renames", "--full-index", baseTree, snapshotTree], { cwd: repository, encoding: "utf8" });
    const binaryEntry = material.changed_files.find((entry) => entry.path === "binary.bin");
    const addedEntry = material.changed_files.find((entry) => entry.path === "new.txt");

    expect(material).toMatchObject({ source_revision: { base_tree: baseTree, snapshot_tree: snapshotTree }, unified_diff: expectedDiff });
    expect(material.unified_diff).toContain("GIT binary patch");
    expect(binaryEntry).toMatchObject({ status: "modified", sha256: sha(gitBytes(repository, ["show", `${snapshotTree}:binary.bin`])), size: binary.length });
    expect(addedEntry).toMatchObject({ status: "added", sha256: sha(Buffer.from("new review material\n")), size: Buffer.byteLength("new review material\n") });
  });

  it("treats a Git type change as modified material with hashes from both trees", () => {
    const repository = root(); const baseTree = headTree(repository);
    rmSync(join(repository, "modified.txt")); symlinkSync("link-target.txt", join(repository, "modified.txt"));
    const snapshotTree = captureWorktreeTree(repository, { baseTree });
    const material = buildTreeMaterial(repository, { baseTree, snapshotTree });
    const typeChanged = material.changed_files.find((entry) => entry.path === "modified.txt");

    expect(typeChanged).toMatchObject({
      status: "modified",
      sha256: sha(Buffer.from("link-target.txt")), size: Buffer.byteLength("link-target.txt"),
      old_sha256: sha(Buffer.from("base modified\n")), old_size: Buffer.byteLength("base modified\n"),
    });
    expect(material.unified_diff).toContain("deleted file mode 100644");
    expect(material.unified_diff).toContain("new file mode 120000");
  });

  it("rejects final commit when the worktree no longer equals the approved tree", () => {
    const repository = root(); const approvedTree = captureWorktreeTree(repository);
    expect(() => assertCurrentTree(repository, approvedTree)).not.toThrow();
    writeFileSync(join(repository, "newly-untracked.txt"), "not reviewed\n");
    expect(() => assertCurrentTree(repository, approvedTree)).toThrow(/WORKTREE_DRIFT_AFTER_REVIEW/);
  });
});

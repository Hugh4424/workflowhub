import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { inspectWorktreeCleanup } from "../../runtime/task/workspace.mjs";

const temporaryRoots = [];

afterEach(() => {
  while (temporaryRoots.length > 0) {
    rmSync(temporaryRoots.pop(), { recursive: true, force: true });
  }
});

function gitFixture() {
  const root = mkdtempSync(join(tmpdir(), "workflowhub-workspace-cleanup-"));
  temporaryRoots.push(root);
  execFileSync("git", ["init", "-q"], { cwd: root });
  execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: root });
  execFileSync("git", ["config", "user.name", "Test"], { cwd: root });
  writeFileSync(join(root, ".gitignore"), "node_modules/\n", "utf8");
  writeFileSync(join(root, "tracked.mjs"), "export const tracked = true;\n", "utf8");
  execFileSync("git", ["add", ".gitignore", "tracked.mjs"], { cwd: root });
  execFileSync("git", ["commit", "-qm", "baseline"], { cwd: root });
  return root;
}

describe("task worktree cleanup classification", () => {
  it("treats a root node_modules install as generated ignored content", () => {
    const root = gitFixture();
    mkdirSync(join(root, "node_modules", ".bin"), { recursive: true });
    writeFileSync(join(root, "node_modules", ".bin", "vitest"), "generated\n", "utf8");

    const scan = inspectWorktreeCleanup(root);

    expect(scan.safe).toBe(true);
    expect(scan.ignored_unknown).toEqual([]);
    expect(scan.ignored_generated.map(({ path }) => path)).toEqual([
      "node_modules/.bin/vitest",
    ]);
  });
});

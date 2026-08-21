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

  it("treats execution sidecars as safe cleanup-owned content", () => {
    const root = gitFixture();
    mkdirSync(join(root, "quality", "tests"), { recursive: true });
    mkdirSync(join(root, "evidence"), { recursive: true });
    writeFileSync(join(root, "quality", "tests", "run.json"), "{}\n", "utf8");
    writeFileSync(join(root, "evidence", "stage.json"), "{}\n", "utf8");

    const scan = inspectWorktreeCleanup(root);

    expect(scan.safe).toBe(true);
    expect(scan.untracked).toEqual([]);
    expect(scan.execution_sidecars.map(({ path }) => path)).toEqual([
      "evidence/stage.json",
      "quality/tests/run.json",
    ]);
  });

  it("treats tracked execution sidecars as cleanup-owned content", () => {
    const root = gitFixture();
    mkdirSync(join(root, "quality", "tests"), { recursive: true });
    writeFileSync(join(root, "quality", "tests", "tracked.json"), "baseline\n", "utf8");
    execFileSync("git", ["add", "quality/tests/tracked.json"], { cwd: root });
    execFileSync("git", ["commit", "-qm", "tracked execution sidecar"], { cwd: root });
    writeFileSync(join(root, "quality", "tests", "tracked.json"), "runtime update\n", "utf8");

    const scan = inspectWorktreeCleanup(root);

    expect(scan.safe).toBe(true);
    expect(scan.tracked).toEqual([]);
    expect(scan.execution_sidecars.map(({ path, status }) => ({ path, status }))).toEqual([
      { path: "quality/tests/tracked.json", status: " M" },
    ]);
  });

  it("treats nested virtualenv and frontend test output as generated content", () => {
    const root = gitFixture();
    writeFileSync(join(root, ".gitignore"), "node_modules/\n.venv/\nfrontend/test-results/\n", "utf8");
    execFileSync("git", ["add", ".gitignore"], { cwd: root });
    execFileSync("git", ["commit", "-qm", "generated output ignores"], { cwd: root });
    mkdirSync(join(root, ".venv", "bin"), { recursive: true });
    mkdirSync(join(root, "frontend", "test-results"), { recursive: true });
    writeFileSync(join(root, ".venv", "bin", "python"), "generated\n", "utf8");
    writeFileSync(join(root, "frontend", "test-results", "report.json"), "{}\n", "utf8");

    const scan = inspectWorktreeCleanup(root);

    expect(scan.safe).toBe(true);
    expect(scan.ignored_unknown).toEqual([]);
    expect(scan.ignored_generated.map(({ path }) => path)).toEqual([
      ".venv/bin/python",
      "frontend/test-results/report.json",
    ]);
  });
});

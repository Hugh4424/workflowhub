import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { createTaskWorktreeRemoval, inspectWorktreeCleanup } from "../../runtime/task/workspace.mjs";
import { openTask } from "../../runtime/task/task-handle.mjs";

const temporaryRoots = [];

afterEach(() => {
  while (temporaryRoots.length > 0) {
    const root = temporaryRoots.pop();
    if (existsSync(root)) removeOwnedFixture(root);
  }
});

function gitFixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-workspace-cleanup-")));
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

function ownedRemovalFixture({ existing = false, trackedSidecar = false, ignoredSidecar = false } = {}) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-workspace-cleanup-removal-")));
  temporaryRoots.push(root);
  const repo = join(root, "repo"), taskId = "owned-cleanup", branch = `task/workflowhub/${taskId}`;
  const worktree = join(root, `repo-${taskId}`), taskDir = join(root, "storage", "Projects", "workflowhub", "tasks", taskId);
  mkdirSync(repo); mkdirSync(taskDir, { recursive: true });
  const git = (cwd, args) => {
    const env = { ...process.env };
    for (const key of Object.keys(env)) if (key.startsWith("GIT_")) delete env[key];
    return execFileSync("git", args, { cwd, env, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  };
  git(repo, ["init", "-q", "-b", "main"]);
  git(repo, ["config", "user.email", "owned-cleanup@test.invalid"]);
  git(repo, ["config", "user.name", "Owned cleanup fixture"]);
  writeFileSync(join(repo, ".gitignore"), `node_modules/\n${ignoredSidecar ? ".multica/\n" : ""}`);
  writeFileSync(join(repo, "source.mjs"), "export const delivered = true;\n");
  if (trackedSidecar) {
    mkdirSync(join(repo, "evidence"));
    writeFileSync(join(repo, "evidence", "owned.txt"), "baseline evidence\n");
  }
  git(repo, ["add", "."]); git(repo, ["commit", "-qm", "owned baseline"]);
  git(repo, ["worktree", "add", "-q", "-b", branch, worktree, "main"]);
  writeFileSync(join(worktree, "source.mjs"), "export const delivered = 42;\n");
  git(worktree, ["add", "source.mjs"]); git(worktree, ["commit", "-qm", "owned delivery"]);
  const tip = git(worktree, ["rev-parse", "HEAD"]);
  git(repo, ["merge", "--ff-only", branch]);
  expect(git(repo, ["merge-base", "main", branch])).toBe(tip);
  writeFileSync(join(taskDir, "task.json"), JSON.stringify({
    schema_version: "1.0.0", project_name: "workflowhub", task_id: taskId,
    created_at: "2026-10-08T00:00:00Z", target_repo_root: repo,
    record_model: "vnext-single-write", activation_cohort: "post", issue_ids: [], inputs: {},
    ...(existing ? { workspace_mode: "existing", workspace_root: worktree } : {}),
  }) + "\n");
  writeFileSync(join(taskDir, "facts.jsonl"), "");
  mkdirSync(join(taskDir, "quality", "tests"), { recursive: true });
  writeFileSync(join(taskDir, "quality", "tests", "owned-record.md"), "outside worktree original\n");
  const task = openTask(taskDir, { projectName: "workflowhub", taskId });
  return { root, repo, worktree, taskDir, task, branch, tip, git };
}

function removeOwnedFixture(root) {
  expect(realpathSync(root)).toBe(root);
  expect(root.startsWith(join(realpathSync(tmpdir()), "workflowhub-workspace-cleanup-"))).toBe(true);
  rmSync(root, { recursive: true, force: true });
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

  it("protects untracked execution sidecars instead of assuming directory ownership", () => {
    const root = gitFixture();
    mkdirSync(join(root, "quality", "tests"), { recursive: true });
    mkdirSync(join(root, "evidence"), { recursive: true });
    writeFileSync(join(root, "quality", "tests", "run.json"), "{}\n", "utf8");
    writeFileSync(join(root, "evidence", "stage.json"), "{}\n", "utf8");

    const scan = inspectWorktreeCleanup(root);

    expect(scan.safe).toBe(false);
    expect(scan.untracked.map(({ path }) => path)).toEqual([
      "evidence/stage.json",
      "quality/tests/run.json",
    ]);
    expect(scan.execution_sidecars).toEqual([]);
    expect(readFileSync(join(root, "quality", "tests", "run.json"), "utf8")).toBe("{}\n");
    expect(readFileSync(join(root, "evidence", "stage.json"), "utf8")).toBe("{}\n");
  });

  it("protects modified tracked execution sidecars from automatic restore", () => {
    const root = gitFixture();
    mkdirSync(join(root, "quality", "tests"), { recursive: true });
    writeFileSync(join(root, "quality", "tests", "tracked.json"), "baseline\n", "utf8");
    execFileSync("git", ["add", "quality/tests/tracked.json"], { cwd: root });
    execFileSync("git", ["commit", "-qm", "tracked execution sidecar"], { cwd: root });
    writeFileSync(join(root, "quality", "tests", "tracked.json"), "runtime update\n", "utf8");

    const scan = inspectWorktreeCleanup(root);

    expect(scan.safe).toBe(false);
    expect(scan.tracked.map(({ path, status }) => ({ path, status }))).toEqual([
      { path: "quality/tests/tracked.json", status: " M" },
    ]);
    expect(scan.execution_sidecars).toEqual([]);
    expect(readFileSync(join(root, "quality", "tests", "tracked.json"), "utf8")).toBe("runtime update\n");
  });

  it("rejects unique sidecar pollution before removing any generated cache or worktree", async () => {
    const scenarios = [
      { path: "quality/tests/unique.output", bytes: "unique untracked original\n", group: "untracked" },
      { path: "evidence/owned.txt", bytes: "unique tracked update\n", group: "tracked", trackedSidecar: true },
      { path: ".multica/private-note.txt", bytes: "unique ignored note\n", group: "ignored_unknown", ignoredSidecar: true },
    ];
    for (const scenario of scenarios) {
      const state = ownedRemovalFixture(scenario);
      try {
        const target = join(state.worktree, scenario.path), cache = join(state.worktree, "node_modules", "generated-cache");
        mkdirSync(join(target, ".."), { recursive: true });
        writeFileSync(target, scenario.bytes);
        mkdirSync(join(state.worktree, "node_modules")); writeFileSync(cache, "generated cache remains\n");
        const scan = inspectWorktreeCleanup(state.worktree);
        const removal = createTaskWorktreeRemoval(state.task);
        let error;
        try { await removal.execute(); } catch (caught) { error = caught; }
        expect(existsSync(target), scenario.path).toBe(true);
        expect(readFileSync(target, "utf8"), scenario.path).toBe(scenario.bytes);
        expect(readFileSync(cache, "utf8"), scenario.path).toBe("generated cache remains\n");
        expect(existsSync(state.worktree), scenario.path).toBe(true);
        expect(state.git(state.repo, ["worktree", "list", "--porcelain"])).toContain(`worktree ${state.worktree}`);
        expect(state.git(state.repo, ["rev-parse", `refs/heads/${state.branch}`])).toBe(state.tip);
        expect(error, scenario.path).toMatchObject({ code: "FORMAL_CLEANUP_UNSAFE" });
        expect(scan.safe, scenario.path).toBe(false);
        expect(scan[scenario.group].map(({ path }) => path), scenario.path).toEqual([scenario.path]);
        expect(scan.execution_sidecars).toEqual([]);
      } finally { removeOwnedFixture(state.root); }
    }
  });

  it("keeps unknown ignored user bytes unsafe while allowing only generated caches", () => {
    const root = realpathSync(gitFixture());
    try {
      writeFileSync(join(root, ".gitignore"), "node_modules/\n.agent_context/\nprivate-notes/\n");
      execFileSync("git", ["add", ".gitignore"], { cwd: root });
      execFileSync("git", ["commit", "-qm", "owned private ignores"], { cwd: root });
      for (const [path, bytes] of [[".agent_context/memo.md", "unique memo\n"], ["private-notes/note.txt", "unique private note\n"], ["node_modules/generated-cache", "generated cache\n"]]) {
        const target = join(root, path); mkdirSync(join(target, ".."), { recursive: true }); writeFileSync(target, bytes);
      }
      const scan = inspectWorktreeCleanup(root);
      expect(scan.safe).toBe(false);
      expect(scan.ignored_unknown.map(({ path }) => path)).toEqual([".agent_context/memo.md", "private-notes/note.txt"]);
      expect(scan.ignored_generated.map(({ path }) => path)).toEqual(["node_modules/generated-cache"]);
      expect(scan.execution_sidecars).toEqual([]);
      expect(readFileSync(join(root, ".agent_context", "memo.md"), "utf8")).toBe("unique memo\n");
      expect(readFileSync(join(root, "private-notes", "note.txt"), "utf8")).toBe("unique private note\n");
      expect(readFileSync(join(root, "node_modules", "generated-cache"), "utf8")).toBe("generated cache\n");
    } finally { removeOwnedFixture(root); }
  });

  it("removes a delivered task-owned clean worktree and deletes its local branch without force", async () => {
    const state = ownedRemovalFixture();
    try {
      const removal = createTaskWorktreeRemoval(state.task);
      expect(removal.probe().satisfied).toBe(false);
      await removal.execute();
      const after = removal.probe();
      expect(after.satisfied).toBe(true);
      expect(await removal.verify(after)).toBe(true);
      expect(existsSync(state.worktree)).toBe(false);
      expect(state.git(state.repo, ["worktree", "list", "--porcelain"])).not.toContain(`worktree ${state.worktree}`);
      state.git(state.repo, ["branch", "-d", "--", state.branch]);
      expect(state.git(state.repo, ["for-each-ref", "--format=%(refname)", `refs/heads/${state.branch}`])).toBe("");
      expect(state.git(state.repo, ["rev-parse", "main"])).toBe(state.tip);
      expect(readFileSync(join(state.repo, "source.mjs"), "utf8")).toBe("export const delivered = 42;\n");
      expect(JSON.parse(readFileSync(join(state.taskDir, "task.json"), "utf8")).task_id).toBe("owned-cleanup");
      expect(readFileSync(join(state.taskDir, "facts.jsonl"), "utf8")).toBe("");
      expect(readFileSync(join(state.taskDir, "quality", "tests", "owned-record.md"), "utf8")).toBe("outside worktree original\n");
    } finally { removeOwnedFixture(state.root); }
  });

  it("preserves an explicitly existing workspace during removal", async () => {
    const state = ownedRemovalFixture({ existing: true });
    try {
      writeFileSync(join(state.worktree, "memo.md"), "existing workspace memo\n");
      const removal = createTaskWorktreeRemoval(state.task), before = removal.probe();
      expect(before).toMatchObject({ satisfied: true, skipped: true, reason: "existing worktree is not task-owned", worktree_root: state.worktree });
      await removal.execute();
      expect(await removal.verify(removal.probe())).toBe(true);
      expect(existsSync(state.worktree)).toBe(true);
      expect(state.git(state.repo, ["worktree", "list", "--porcelain"])).toContain(`worktree ${state.worktree}`);
      expect(state.git(state.repo, ["rev-parse", `refs/heads/${state.branch}`])).toBe(state.tip);
      expect(readFileSync(join(state.worktree, "source.mjs"), "utf8")).toBe("export const delivered = 42;\n");
      expect(readFileSync(join(state.worktree, "memo.md"), "utf8")).toBe("existing workspace memo\n");
    } finally { removeOwnedFixture(state.root); }
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

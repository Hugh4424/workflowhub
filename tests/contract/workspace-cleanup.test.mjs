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

function enableFsmonitorNoChangeHook(state, path) {
  const hook = join(state.root, "fsmonitor-no-change.sh");
  writeFileSync(hook, "#!/bin/sh\nprintf 'token\\0'\n", { mode: 0o700 });
  state.git(state.worktree, ["config", "--local", "core.fsmonitor", hook]);
  state.git(state.worktree, ["config", "--local", "core.fsmonitorHookVersion", "2"]);
  state.git(state.worktree, ["status", "--porcelain=v1"]);
  state.git(state.worktree, ["update-index", "--fsmonitor"]);
  expect(state.git(state.worktree, ["ls-files", "-f", "-z", "--", path])[0]).toBe("h");
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

  it("blocks worktree removal when Git index flags hide tracked changes", async () => {
    for (const flag of ["assume-unchanged", "skip-worktree"]) {
      const state = ownedRemovalFixture(), path = join(state.worktree, "source.mjs");
      const changedBytes = `${flag} hidden tracked change\n`;
      try {
        state.git(state.worktree, ["update-index", `--${flag}`, "--", "source.mjs"]);
        writeFileSync(path, changedBytes, "utf8");
        expect(state.git(state.worktree, ["status", "--porcelain=v1", "--", "source.mjs"])).toBe("");
        expect(state.git(state.worktree, ["ls-files", "-v", "--", "source.mjs"])[0]).toBe(flag === "assume-unchanged" ? "h" : "S");

        const removal = createTaskWorktreeRemoval(state.task), probe = removal.probe();
        expect(probe.satisfied).toBe(false);
        const scan = inspectWorktreeCleanup(state.worktree);
        expect(scan.safe).toBe(false);
        expect(scan.tracked.map(({ path: trackedPath }) => trackedPath)).toContain("source.mjs");
        await expect(removal.execute()).rejects.toMatchObject({ code: "FORMAL_CLEANUP_UNSAFE" });
        expect(readFileSync(path, "utf8")).toBe(changedBytes);
        expect(existsSync(state.worktree)).toBe(true);
        expect(state.git(state.repo, ["worktree", "list", "--porcelain"])).toContain(`worktree ${state.worktree}`);
        expect(state.git(state.repo, ["rev-parse", `refs/heads/${state.branch}`])).toBe(state.tip);
      } finally { removeOwnedFixture(state.root); }
    }
  });


  it("keeps clean skip-worktree files fail-closed", async () => {
    const state = ownedRemovalFixture(), path = join(state.worktree, "source.mjs");
    const original = readFileSync(path, "utf8");
    try {
      state.git(state.worktree, ["update-index", "--skip-worktree", "--", "source.mjs"]);
      expect(state.git(state.worktree, ["status", "--porcelain=v1", "--", "source.mjs"])).toBe("");
      expect(state.git(state.worktree, ["ls-files", "-v", "-z", "--", "source.mjs"])[0]).toBe("S");
      const scan = inspectWorktreeCleanup(state.worktree);
      expect(scan.safe).toBe(false);
      expect(scan.tracked.map(({ path: trackedPath }) => trackedPath)).toContain("source.mjs");
      const removal = createTaskWorktreeRemoval(state.task);
      await expect(removal.execute()).rejects.toMatchObject({ code: "FORMAL_CLEANUP_UNSAFE" });
      expect(readFileSync(path, "utf8")).toBe(original);
      expect(existsSync(state.worktree)).toBe(true);
    } finally { removeOwnedFixture(state.root); }
  });

  it("allows a clean fsmonitor-valid worktree to be removed", async () => {
    const state = ownedRemovalFixture();
    try {
      enableFsmonitorNoChangeHook(state, "source.mjs");
      expect(state.git(state.worktree, ["ls-files", "-v", "-z", "--", "source.mjs"])[0]).toBe("H");
      expect(state.git(state.worktree, ["ls-files", "-f", "-z", "--", "source.mjs"])[0]).toBe("h");
      expect(inspectWorktreeCleanup(state.worktree).safe).toBe(true);
      await createTaskWorktreeRemoval(state.task).execute();
      expect(existsSync(state.worktree)).toBe(false);
      expect(state.git(state.repo, ["worktree", "list", "--porcelain"])).not.toContain(`worktree ${state.worktree}`);
      expect(state.git(state.repo, ["rev-parse", `refs/heads/${state.branch}`])).toBe(state.tip);
    } finally { removeOwnedFixture(state.root); }
  });

  it("blocks worktree removal when stale fsmonitor-valid hides a tracked change", async () => {
    const state = ownedRemovalFixture(), path = join(state.worktree, "source.mjs");
    const changedBytes = "fsmonitor-valid hidden tracked change\n";
    try {
      enableFsmonitorNoChangeHook(state, "source.mjs");
      expect(state.git(state.worktree, ["ls-files", "-v", "-z", "--", "source.mjs"])[0]).toBe("H");
      expect(state.git(state.worktree, ["ls-files", "-f", "-z", "--", "source.mjs"])[0]).toBe("h");
      writeFileSync(path, changedBytes, "utf8");
      expect(state.git(state.worktree, ["status", "--porcelain=v1", "--", "source.mjs"])).toBe("");
      expect(state.git(state.worktree, ["ls-files", "-f", "-z", "--", "source.mjs"])[0]).toBe("h");
      expect(state.git(state.worktree, ["-c", "core.fsmonitor=false", "--no-optional-locks", "status", "--porcelain=v1", "--", "source.mjs"])).toContain("source.mjs");
      const removal = createTaskWorktreeRemoval(state.task);
      await expect(removal.execute()).rejects.toMatchObject({ code: "FORMAL_CLEANUP_UNSAFE" });
      expect(readFileSync(path, "utf8")).toBe(changedBytes);
      expect(existsSync(state.worktree)).toBe(true);
      expect(state.git(state.repo, ["worktree", "list", "--porcelain"])).toContain("worktree " + state.worktree);
      expect(state.git(state.repo, ["rev-parse", "refs/heads/" + state.branch])).toBe(state.tip);
    } finally { removeOwnedFixture(state.root); }
  });

  it("lets Git preserve a fsmonitor-valid edit injected at final worktree removal", async () => {
    const state = ownedRemovalFixture(), path = join(state.worktree, "source.mjs"), bytes = "last-moment fsmonitor change\n";
    enableFsmonitorNoChangeHook(state, "source.mjs");
    const realGit = execFileSync("/usr/bin/which", ["git"], { encoding: "utf8" }).trim();
    const bin = join(state.root, "race-bin"), savedPath = process.env.PATH;
    mkdirSync(bin);
    writeFileSync(join(bin, "git"), `#!/bin/sh
if [ "$1" = "-c" ] && [ "$2" = "core.fsmonitor=false" ] && [ "$3" = "worktree" ] && [ "$4" = "remove" ]; then
  "${realGit}" -C "${state.worktree}" update-index --fsmonitor-valid -- source.mjs || exit $?
  test "$("${realGit}" -C "${state.worktree}" ls-files -f -- source.mjs)" = "h source.mjs" || exit 97
  printf "%b" ${JSON.stringify(bytes)} > ${JSON.stringify(path)}
fi
exec "${realGit}" "$@"
`, { mode: 0o700 });
    try {
      process.env.PATH = `${bin}:${savedPath}`;
      await expect(createTaskWorktreeRemoval(state.task).execute()).rejects.toThrow(/task worktree removal validation failed/);
    } finally { if (savedPath === undefined) delete process.env.PATH; else process.env.PATH = savedPath; }
    expect(readFileSync(path, "utf8")).toBe(bytes);
    expect(existsSync(state.worktree)).toBe(true);
    expect(state.git(state.repo, ["worktree", "list", "--porcelain"])).toContain(`worktree ${state.worktree}`);
    expect(state.git(state.repo, ["rev-parse", `refs/heads/${state.branch}`])).toBe(state.tip);
  });

  it.each(["assume-unchanged", "skip-worktree"])("preserves a tracked edit injected with %s after the final cleanup scan", async (flag) => {
    const state = ownedRemovalFixture(), path = join(state.worktree, "source.mjs"), bytes = "last-moment " + flag + " change\n";
    const trigger = join(state.root, "index-flag-race-triggered"), countFile = join(state.root, "index-flag-race-count"), lockError = join(state.root, "index-lock-error");
    const realGit = execFileSync("/usr/bin/which", ["git"], { encoding: "utf8" }).trim();
    const bin = join(state.root, "index-flag-race-" + flag), savedPath = process.env.PATH, expectedTag = flag === "assume-unchanged" ? "h" : "S";
    mkdirSync(bin);
    const wrapper = [
      "#!/bin/sh",
      "real_git=" + JSON.stringify(realGit),
      "status_count=" + JSON.stringify(countFile),
      "trigger=" + JSON.stringify(trigger),
      "lock_error=" + JSON.stringify(lockError),
      "if [ \"$(pwd)\" = " + JSON.stringify(state.worktree) + " ] && [ \"$1\" = \"symbolic-ref\" ] && [ \"$2\" = \"--quiet\" ] && [ \"$3\" = \"--short\" ] && [ \"$4\" = \"HEAD\" ]; then",
      "  \"$real_git\" \"$@\"",
      "  command_status=$?",
      "  count=0",
      "  if [ -f \"$status_count\" ]; then read count < \"$status_count\"; fi",
      "  count=$((count + 1))",
      "  printf \"%s\\n\" \"$count\" > \"$status_count\"",
      "  if [ \"$count\" -eq 3 ]; then",
      "    env -u GIT_INDEX_FILE \"$real_git\" -C " + JSON.stringify(state.worktree) + " update-index --" + flag + " -- source.mjs || exit $?",
      "    test \"$(env -u GIT_INDEX_FILE \"$real_git\" -C " + JSON.stringify(state.worktree) + " ls-files -v -- source.mjs)\" = " + JSON.stringify(expectedTag + " source.mjs") + " || exit 97",
      "    printf \"%b\" " + JSON.stringify(bytes) + " > " + JSON.stringify(path),
      "    printf \"%s\\n\" \"$count\" > \"$trigger\"",
      "  fi",
      "  exit \"$command_status\"",
      "fi",
      "if [ \"$1\" = \"-c\" ] && [ \"$2\" = \"core.fsmonitor=false\" ] && [ \"$3\" = \"worktree\" ] && [ \"$4\" = \"remove\" ]; then",
      "  if env -u GIT_INDEX_FILE \"$real_git\" -C " + JSON.stringify(state.worktree) + " update-index --assume-unchanged -- source.mjs 2>\"$lock_error\"; then exit 98; fi",
      "  grep -q \"index.lock\" \"$lock_error\" || exit 99",
      "fi",
      "exec \"$real_git\" \"$@\""
    ].join("\n") + "\n";
    writeFileSync(join(bin, "git"), wrapper, { mode: 0o700 });
    let removalError;
    try {
      process.env.PATH = bin + ":" + savedPath;
      await createTaskWorktreeRemoval(state.task).execute();
    } catch (error) { removalError = error; }
    finally { if (savedPath === undefined) delete process.env.PATH; else process.env.PATH = savedPath; }
    expect(readFileSync(trigger, "utf8")).toBe("3\n");
    expect(readFileSync(lockError, "utf8")).toContain("index.lock");
    expect(removalError).toMatchObject({ message: expect.stringMatching(/task worktree removal validation failed:.*contains modified or untracked files/) });
    expect(state.git(state.worktree, ["ls-files", "-v", "--", "source.mjs"])[0]).toBe(expectedTag);
    expect(readFileSync(path, "utf8")).toBe(bytes);
    expect(existsSync(state.worktree)).toBe(true);
    expect(state.git(state.repo, ["worktree", "list", "--porcelain"])).toContain("worktree " + state.worktree);
    expect(state.git(state.repo, ["rev-parse", "refs/heads/" + state.branch])).toBe(state.tip);
  });

  it("preserves a staged-only index change injected after the final cleanup scan", async () => {
    const state = ownedRemovalFixture(), path = join(state.worktree, "source.mjs"), worktreeBytes = readFileSync(path, "utf8"), stagedBytes = "late staged-only content\n";
    const trigger = join(state.root, "staged-index-race-triggered"), countFile = join(state.root, "staged-index-race-count"), lockError = join(state.root, "staged-index-lock-error");
    const realGit = execFileSync("/usr/bin/which", ["git"], { encoding: "utf8" }).trim();
    const bin = join(state.root, "staged-index-race-bin"), savedPath = process.env.PATH;
    mkdirSync(bin);
    const wrapper = [
      "#!/bin/sh",
      "real_git=" + JSON.stringify(realGit),
      "status_count=" + JSON.stringify(countFile),
      "trigger=" + JSON.stringify(trigger),
      "lock_error=" + JSON.stringify(lockError),
      "if [ \"$(pwd)\" = " + JSON.stringify(state.worktree) + " ] && [ \"$1\" = \"symbolic-ref\" ] && [ \"$2\" = \"--quiet\" ] && [ \"$3\" = \"--short\" ] && [ \"$4\" = \"HEAD\" ]; then",
      "  \"$real_git\" \"$@\"",
      "  command_status=$?",
      "  count=0",
      "  if [ -f \"$status_count\" ]; then read count < \"$status_count\"; fi",
      "  count=$((count + 1))",
      "  printf \"%s\\n\" \"$count\" > \"$status_count\"",
      "  if [ \"$count\" -eq 3 ]; then",
      "    printf \"%b\" " + JSON.stringify(stagedBytes) + " > " + JSON.stringify(path),
      "    \"$real_git\" -C " + JSON.stringify(state.worktree) + " add -- source.mjs || exit $?",
      "    printf \"%b\" " + JSON.stringify(worktreeBytes) + " > " + JSON.stringify(path),
      "    printf \"%s\\n\" \"$count\" > \"$trigger\"",
      "  fi",
      "  exit \"$command_status\"",
      "fi",
      "if [ \"$1\" = \"-c\" ] && [ \"$2\" = \"core.fsmonitor=false\" ] && [ \"$3\" = \"worktree\" ] && [ \"$4\" = \"remove\" ]; then",
      "  if env -u GIT_INDEX_FILE \"$real_git\" -C " + JSON.stringify(state.worktree) + " update-index --assume-unchanged -- source.mjs 2>\"$lock_error\"; then exit 98; fi",
      "  grep -q \"index.lock\" \"$lock_error\" || exit 99",
      "fi",
      "exec \"$real_git\" \"$@\""
    ].join("\n") + "\n";
    writeFileSync(join(bin, "git"), wrapper, { mode: 0o700 });
    let removalError;
    try {
      process.env.PATH = bin + ":" + savedPath;
      await createTaskWorktreeRemoval(state.task).execute();
    } catch (error) { removalError = error; }
    finally { if (savedPath === undefined) delete process.env.PATH; else process.env.PATH = savedPath; }
    expect(readFileSync(trigger, "utf8")).toBe("3\n");
    expect(readFileSync(lockError, "utf8")).toContain("index.lock");
    expect(removalError).toMatchObject({ message: expect.stringMatching(/task worktree removal validation failed:.*contains modified or untracked files/) });
    expect(state.git(state.worktree, ["show", ":source.mjs"])).toBe(stagedBytes.trim());
    expect(readFileSync(path, "utf8")).toBe(worktreeBytes);
    expect(existsSync(state.worktree)).toBe(true);
    expect(state.git(state.repo, ["worktree", "list", "--porcelain"])).toContain("worktree " + state.worktree);
    expect(state.git(state.repo, ["rev-parse", "refs/heads/" + state.branch])).toBe(state.tip);
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

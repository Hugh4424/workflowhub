import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "vitest";

import { ArtifactDir } from "../../core/artifact-dir.mjs";
import { createTask } from "../../runtime/task/task-handle.mjs";
import { stageRuntimeMain } from "../../tools/cli/stage-runtime.mjs";
import { writeCanonicalStageMaterials } from "../helpers/stage-outcome.mjs";

const roots = [];

function git(cwd, args) {
  return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function fixture({ source = "env", writeResolutionSource, secondaryRoot = false, lowerPriorityConfig = false } = {}) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-doctor-storage-")));
  roots.push(root);
  const home = join(root, "home");
  const configHome = join(root, "config");
  const repo = join(root, "repo");
  const storage = secondaryRoot ? join(root, "Hugh", "Hugh", "Knowledge") : source === "home" ? home : join(root, "storage");
  mkdirSync(home);
  mkdirSync(configHome);
  mkdirSync(repo);
  mkdirSync(storage, { recursive: true });
  git(repo, ["init", "-q", "-b", "main"]);
  git(repo, ["config", "user.name", "WorkflowHub Tests"]);
  git(repo, ["config", "user.email", "tests@workflowhub.invalid"]);
  writeFileSync(join(repo, "README.md"), "base\n");
  git(repo, ["add", "README.md"]);
  git(repo, ["commit", "-qm", "base"]);
  const worktree = join(root, "worktree");
  git(repo, ["worktree", "add", "-q", "-b", "task/doctor/storage", worktree]);

  const configPath = join(configHome, "workflowhub");
  mkdirSync(configPath, { recursive: true });
  const configuredStorage = source === "config"
    ? storage
    : lowerPriorityConfig
      ? join(root, "configured-storage")
      : null;
  if (configuredStorage) {
    mkdirSync(configuredStorage, { recursive: true });
    writeFileSync(join(configPath, "config.json"), JSON.stringify({ task_dir: configuredStorage }));
  }

  const task = createTask({
    storageRoot: storage,
    manifest: {
      schema_version: "1.0.0",
      execution_mode: "per_invocation",
      record_model: "vnext-single-write",
      project_name: "workflowhub",
      task_id: "doctor-storage",
      created_at: new Date().toISOString(),
      target_repo_root: repo,
      workspace_mode: "existing",
      workspace_root: worktree,
      issue_ids: [],
      inputs: {},
      ...(writeResolutionSource ? { write_resolution_source: writeResolutionSource } : {}),
    },
  });
  writeCanonicalStageMaterials(ArtifactDir.open(worktree, task));

  if (secondaryRoot) {
    const oldRoot = join(root, "Hugh", "Knowledge");
    mkdirSync(oldRoot, { recursive: true });
    return { root, home, configHome, repo, storage, worktree, task, oldRoot };
  }
  return { root, home, configHome, repo, storage, worktree, task, configuredStorage };
}

async function doctor(state, { envRoot = state.storage, configRoot = state.configHome } = {}) {
  const previous = Object.fromEntries(["HOME", "XDG_CONFIG_HOME", "WORKFLOWHUB_TASK_DIR", "CODEX_SESSION_ID", "CODEX_THREAD_ID", "CODEX_ROLLOUT_PATH", "WORKFLOWHUB_CODEX_ROLLOUT_PATH"].map((key) => [key, process.env[key]]));
  process.env.HOME = state.home;
  process.env.XDG_CONFIG_HOME = configRoot;
  if (envRoot === undefined || envRoot === null) delete process.env.WORKFLOWHUB_TASK_DIR;
  else process.env.WORKFLOWHUB_TASK_DIR = envRoot;
  delete process.env.CODEX_SESSION_ID;
  delete process.env.CODEX_THREAD_ID;
  delete process.env.CODEX_ROLLOUT_PATH;
  delete process.env.WORKFLOWHUB_CODEX_ROLLOUT_PATH;
  try {
    return await stageRuntimeMain(["doctor", "--stage=build-code", "--project=workflowhub", "--task=doctor-storage"], { cwd: state.repo });
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

afterEach(() => {
  while (roots.length) rmSync(roots.pop(), { recursive: true, force: true });
});

describe("doctor storage consistency", () => {
  it.each(["env", "config", "home"])("reports the selected %s source and all resolution values", async (source) => {
    const state = fixture({ source });
    const result = await doctor(state, { envRoot: source === "env" ? state.storage : null });

    expect(result.storage).toMatchObject({
      resolution_chain: {
        env: source === "env" ? state.storage : null,
        config: source === "config" ? state.storage : null,
        home: state.home,
      },
      selected_source: source,
      task_write_root: state.storage,
      suspected_secondary_roots: [],
      warnings: [],
    });
  });

  it("reports writer-source drift without making doctor fail", async () => {
    const state = fixture({ source: "env", writeResolutionSource: "home" });
    const result = await doctor(state);

    expect(result.storage.selected_source).toBe("env");
    expect(result.storage.warnings).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: "write_resolution_source_mismatch", path: state.task.taskPath }),
    ]));
  });

  it("reports the configured candidate even when env overrides it", async () => {
    const state = fixture({ source: "env", lowerPriorityConfig: true });
    const result = await doctor(state);

    expect(result.storage).toMatchObject({
      resolution_chain: {
        env: state.storage,
        config: state.configuredStorage,
        home: state.home,
      },
      selected_source: "env",
      task_write_root: state.storage,
    });
  });

  it("reports a known secondary Knowledge root and keeps exit-success semantics", async () => {
    const state = fixture({ source: "env", secondaryRoot: true });
    const result = await doctor(state);

    expect(result.storage.suspected_secondary_roots).toContain(state.oldRoot);
    expect(result.storage.warnings).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: "suspected_secondary_root", path: state.oldRoot }),
    ]));
  });

  it("shows unknown for a historical task without writer-source metadata", async () => {
    const state = fixture({ source: "env" });
    const result = await doctor(state);

    expect(result.storage.write_resolution_source).toBe("unknown");
    expect(result.storage.warnings).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ type: "write_resolution_source_mismatch" }),
    ]));
  });
});

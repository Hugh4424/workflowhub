import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "vitest";

import { bootstrapTask } from "../../tools/cli/task-bootstrap.mjs";

const roots = [];

function git(cwd, args) {
  return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function fixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-writer-source-")));
  roots.push(root);
  const home = join(root, "home");
  const configHome = join(root, "config");
  const storage = join(root, "storage");
  const repo = join(root, "repo");
  mkdirSync(home);
  mkdirSync(configHome);
  mkdirSync(storage);
  mkdirSync(repo);
  git(repo, ["init", "-q", "-b", "main"]);
  git(repo, ["config", "user.name", "WorkflowHub Tests"]);
  git(repo, ["config", "user.email", "tests@workflowhub.invalid"]);
  git(repo, ["commit", "--allow-empty", "-qm", "base"]);
  return { root, home, configHome, storage, repo };
}

function bootstrap(state, source) {
  const env = {
    HOME: state.home,
    XDG_CONFIG_HOME: state.configHome,
  };
  if (source === "env") env.WORKFLOWHUB_TASK_DIR = state.storage;
  if (source === "config") {
    mkdirSync(join(state.configHome, "workflowhub"), { recursive: true });
    writeFileSync(join(state.configHome, "workflowhub", "config.json"), JSON.stringify({ task_dir: state.storage }));
  }
  return bootstrapTask({ project: "workflowhub", task: `writer-${source}`, "target-repo": state.repo }, { env, home: state.home, cwd: state.repo });
}

afterEach(() => {
  while (roots.length) rmSync(roots.pop(), { recursive: true, force: true });
});

describe("task writer storage resolution source", () => {
  it.each(["env", "config", "home"])("records %s as the immutable task writer source", (source) => {
    const state = fixture();
    const result = bootstrap(state, source);
    const manifest = JSON.parse(readFileSync(join(result.task_path, "task.json"), "utf8"));

    expect(manifest.write_resolution_source).toBe(source);
  });

  it("leaves old task manifests readable when the field is absent", () => {
    const state = fixture();
    const result = bootstrap(state, "env");
    const path = join(result.task_path, "task.json");
    const manifest = JSON.parse(readFileSync(path, "utf8"));
    delete manifest.write_resolution_source;
    writeFileSync(path, `${JSON.stringify(manifest, null, 2)}\n`);

    expect(() => bootstrapTask({ "task-path": result.task_path, project: "workflowhub", task: "writer-env" }, { env: { HOME: state.home, XDG_CONFIG_HOME: state.configHome, WORKFLOWHUB_TASK_DIR: state.storage }, home: state.home, cwd: state.repo })).not.toThrow();
  });
});

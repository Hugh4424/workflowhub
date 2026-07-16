import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { bootstrapTask } from "../task-bootstrap.mjs";

const roots = [];
afterEach(() => { while (roots.length) rmSync(roots.pop(), { recursive: true, force: true }); });

describe("task bootstrap target repository boundary", () => {
  function fixture() {
    const home = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-task-bootstrap-")));
    roots.push(home);
    const storage = join(home, "storage"), repo = join(home, "repo");
    mkdirSync(storage); mkdirSync(repo);
    execFileSync("git", ["init", "-q"], { cwd: repo });
    return { home, storage, repo, env: { HOME: home, WORKFLOWHUB_TASK_DIR: storage } };
  }

  it("rejects a nested target before creating immutable task.json", () => {
    const f = fixture(), nested = join(f.repo, "nested"); mkdirSync(nested);
    expect(() => bootstrapTask({ project: "Demo", task: "nested-target", "target-repo": nested }, f)).toThrow(/Git toplevel/i);
    expect(() => bootstrapTask({ project: "Demo", task: "nested-target", "target-repo": f.repo }, f)).not.toThrow();
  });

  it("rejects a non-Git target before creating immutable task.json", () => {
    const f = fixture(), plain = join(f.home, "plain"); mkdirSync(plain);
    expect(() => bootstrapTask({ project: "Demo", task: "plain-target", "target-repo": plain }, f)).toThrow(/target repository validation failed/i);
    expect(() => bootstrapTask({ project: "Demo", task: "plain-target", "target-repo": f.repo }, f)).not.toThrow();
  });
});

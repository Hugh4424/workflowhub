import { afterEach, describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { migrateTask } from "../migrate-task-v2.mjs";
import { deriveTaskPath } from "../../core/task-identity.mjs";
import { assertRuntimeAuthority, quiesceRuntime, readRuntimeMode } from "../../core/runtime-mode.mjs";

const roots = [];
function fixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-migrate-v2-"))); roots.push(root);
  const storage = join(root, "storage"), legacy = join(root, "legacy"), repo = join(root, "repo"), worktree = join(root, "worktree");
  mkdirSync(storage); mkdirSync(legacy); mkdirSync(repo);
  const active = assertRuntimeAuthority(storage, { home: root });
  const quiet = quiesceRuntime({ storageRoot: storage, home: root, expectedEpoch: active.cutover_epoch });
  execFileSync("git", ["init", "-q"], { cwd: repo }); execFileSync("git", ["config", "user.name", "Test"], { cwd: repo }); execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: repo });
  writeFileSync(join(repo, "README.md"), "base\n"); execFileSync("git", ["add", "."], { cwd: repo }); execFileSync("git", ["commit", "-qm", "base"], { cwd: repo }); execFileSync("git", ["worktree", "add", "-q", worktree, "HEAD"], { cwd: repo });
  mkdirSync(join(worktree, "specs", "ZHI-138"), { recursive: true });
  for (const name of ["spec.md", "plan.md", "tasks.md"]) writeFileSync(join(worktree, "specs", "ZHI-138", name), `${name}\n`);
  writeFileSync(join(legacy, "stage-result-build-code.json"), '{"legacy":true}\n'); writeFileSync(join(legacy, "decision-log.md"), "legacy decision\n");
  const argv = [`--legacy-task-path=${legacy}`, "--project=KnowledgeDigest", "--task=ZHI-138", `--target-repo-root=${repo}`, `--worktree-root=${worktree}`, `--authority-home=${root}`, `--epoch=${quiet.cutover_epoch}`];
  return { root, storage, legacy, repo, worktree, argv, target: deriveTaskPath(storage, "KnowledgeDigest", "ZHI-138") };
}
function samePathFixture() {
  const f = fixture();
  mkdirSync(f.target, { recursive: true });
  for (const name of ["stage-result-build-code.json", "decision-log.md"]) renameSync(join(f.legacy, name), join(f.target, name));
  f.legacy = f.target;
  f.argv[0] = `--legacy-task-path=${f.target}`;
  return f;
}
afterEach(() => { delete process.env.WORKFLOWHUB_TASK_DIR; while (roots.length) rmSync(roots.pop(), { recursive: true, force: true }); });

describe("one-shot task v2 migration", () => {
  it("defaults to a non-mutating dry-run and never promotes flat results", () => {
    const f = fixture(); process.env.WORKFLOWHUB_TASK_DIR = f.storage;
    const report = migrateTask(f.argv);
    expect(report).toMatchObject({ mode: "dry-run", target_task_path: f.target, legacy_stage_results_accepted: false, needs_replay: true });
    expect(report.cutover_epoch).toBe(f.argv.find((item) => item.startsWith("--epoch=")).slice("--epoch=".length));
    expect(existsSync(f.target)).toBe(false);
  });
  it("rejects apply before any write when the cutover epoch is stale", () => {
    const f = fixture(); process.env.WORKFLOWHUB_TASK_DIR = f.storage;
    const argv = f.argv.map((item) => item.startsWith("--epoch=") ? "--epoch=stale" : item);
    expect(() => migrateTask([...argv, "--apply"])).toThrow(/quiescing|epoch/i);
    expect(existsSync(f.target)).toBe(false);
  });
  it("archives legacy evidence, leaves design files in the worktree, and reruns idempotently", () => {
    const f = fixture(); process.env.WORKFLOWHUB_TASK_DIR = f.storage;
    const first = migrateTask([...f.argv, "--apply"]);
    expect(first.mode).toBe("apply");
    expect(readRuntimeMode({ home: f.root })).toMatchObject({ mode: "quiescing", storage_root: f.storage });
    expect(readFileSync(join(f.target, "legacy", "archive", "stage-result-build-code.json"), "utf8")).toContain("legacy");
    expect(existsSync(join(f.target, "results", "build-code", "accepted.json"))).toBe(false);
    expect(existsSync(join(f.target, "spec.md"))).toBe(false);
    expect(readFileSync(join(f.worktree, "specs", "ZHI-138", "spec.md"), "utf8")).toBe("spec.md\n");
    expect(migrateTask([...f.argv, "--apply"])).toMatchObject({ idempotent_replay: true, target_task_path: f.target });
  });
  it("fails loud on a partial or conflicting target", () => {
    const f = fixture(); process.env.WORKFLOWHUB_TASK_DIR = f.storage;
    mkdirSync(f.target, { recursive: true });
    expect(() => migrateTask([...f.argv, "--apply"])).toThrow(/target exists|complete matching|partial|conflict/i);
  });
  it("fails when a design path is a symlink instead of copying it", () => {
    const f = fixture(); process.env.WORKFLOWHUB_TASK_DIR = f.storage;
    rmSync(join(f.worktree, "specs", "ZHI-138", "plan.md"));
    execFileSync("ln", ["-s", join(f.worktree, "specs", "ZHI-138", "spec.md"), join(f.worktree, "specs", "ZHI-138", "plan.md")]);
    expect(() => migrateTask(f.argv)).toThrow(/regular non-symlink/i);
  });
  it("plans and applies safely when legacy path already equals the deterministic target", () => {
    const f = samePathFixture(); process.env.WORKFLOWHUB_TASK_DIR = f.storage;
    expect(migrateTask(f.argv)).toMatchObject({ mode: "dry-run", target_task_path: f.target, needs_replay: true });
    expect(existsSync(join(f.target, "task.json"))).toBe(false);
    migrateTask([...f.argv, "--apply"]);
    expect(existsSync(join(f.target, "legacy", "archive", "stage-result-build-code.json"))).toBe(true);
    expect(existsSync(join(f.target, "stage-result-build-code.json"))).toBe(false);
    expect(JSON.parse(readFileSync(join(f.target, "task.json"), "utf8"))).toMatchObject({ task_id: "ZHI-138" });
    expect(existsSync(join(f.target, "results", "build-code", "accepted.json"))).toBe(false);
  });
  it("resumes an in-place migration after a crash before manifest commit", () => {
    const f = samePathFixture(); process.env.WORKFLOWHUB_TASK_DIR = f.storage;
    let crashed = false;
    expect(() => migrateTask([...f.argv, "--apply"], { afterArchiveRecord() { if (!crashed) { crashed = true; throw new Error("simulated crash"); } } })).toThrow(/simulated crash/);
    expect(existsSync(join(f.target, "task.json"))).toBe(false);
    expect(() => migrateTask([...f.argv, "--apply"])).not.toThrow();
    expect(existsSync(join(f.target, "task.json"))).toBe(true);
    expect(existsSync(join(f.target, "results", "build-code", "accepted.json"))).toBe(false);
  });
  it.each(["afterTargetCreate", "afterArchiveRecord", "beforeReportCommit", "beforeManifestCommit", "afterManifestCommit"])(
    "resumes a cross-directory migration after crash point %s without split writes",
    (point) => {
      const f = fixture(); process.env.WORKFLOWHUB_TASK_DIR = f.storage;
      let fired = false;
      expect(() => migrateTask([...f.argv, "--apply"], { [point]() { if (!fired) { fired = true; throw new Error(`crash:${point}`); } } }))
        .toThrow(`crash:${point}`);
      expect(() => migrateTask([...f.argv, "--apply"])).not.toThrow();
      expect(readFileSync(join(f.target, "legacy", "archive", "stage-result-build-code.json"), "utf8")).toBe('{"legacy":true}\n');
      expect(existsSync(join(f.legacy, "stage-result-build-code.json"))).toBe(false);
    },
  );
});

import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createRepositoryRegistry } from "../core/repository-registry.mjs";
import { createLauncherAuthority, createReleaseAuthority } from "../core/launcher-authority.mjs";
import { createPinnedTask } from "../scripts/task-bootstrap.mjs";

const roots = [];
afterEach(() => { while (roots.length) rmSync(roots.pop(), { recursive: true, force: true }); });

function fixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-release-pin-")));
  roots.push(root);
  const storageRoot = join(root, "storage");
  const repository = join(root, "repository");
  mkdirSync(storageRoot); mkdirSync(repository);
  execFileSync("git", ["init", "-q"], { cwd: repository });
  const launcherAuthority = createLauncherAuthority({ home: root, env: { WORKFLOWHUB_TASK_DIR: storageRoot } });
  const repositoryAuthority = createRepositoryRegistry(launcherAuthority, { "repositories/product": repository });
  const input = {
    schema_id: "https://workflowhub.dev/schemas/task-create-input.v1.schema.json",
    schema_version: "1.0.0",
    project_name: "Demo",
    task_id: "release-pin",
    source_ref: "sources/offline/event-1.json",
    target_repository_ref: "repositories/product",
  };
  const current = { ref: "releases/1.0.0/manifest.json", sha256: "a".repeat(64) };
  const claim = join(storageRoot, "Projects", "Demo", "tasks", ".release-pin.create.lock");
  const releaseOps = {
    readCurrent: vi.fn(() => { expect(existsSync(claim)).toBe(true); return current; }),
    doctor: vi.fn((release) => { expect(existsSync(claim)).toBe(true); return { ok: true, manifest_ref: release.ref, manifest_hash: release.sha256 }; }),
  };
  const releaseAuthority = createReleaseAuthority(launcherAuthority, releaseOps);
  return { launcherAuthority, repositoryAuthority, input, current, releaseAuthority, releaseOps };
}

describe("AC-012/015 task create release pin", () => {
  it("resolves a canonical repo and pins the exact doctor-approved current release under the create lock", () => {
    const f = fixture();
    const task = createPinnedTask(f.input, { ...f, now: () => "2026-07-17T00:00:00.000Z" });
    expect(task.manifest).toEqual({
      schema_id: "https://workflowhub.dev/schemas/task-manifest.v1.schema.json",
      schema_version: "1.0.0",
      project_name: "Demo",
      task_id: "release-pin",
      created_at: "2026-07-17T00:00:00.000Z",
      target_repository_ref: "repositories/product",
      release_manifest_ref: f.current.ref,
      release_manifest_hash: f.current.sha256,
    });
    expect(f.releaseOps.readCurrent).toHaveBeenCalledOnce();
    expect(f.releaseOps.doctor).toHaveBeenCalledWith(f.current);
  });

  it.each(["release_manifest_ref", "release_manifest_hash", "target_repo_root"])("rejects caller field %s before task creation", (field) => {
    const f = fixture();
    expect(() => createPinnedTask({ ...f.input, [field]: "caller-value" }, f)).toThrow(/caller|forbidden/i);
    expect(f.releaseOps.readCurrent).not.toHaveBeenCalled();
  });

  it("fails closed when doctor does not confirm the exact current manifest", () => {
    const f = fixture();
    f.releaseOps.doctor.mockReturnValue({ ok: true, manifest_ref: f.current.ref, manifest_hash: "b".repeat(64) });
    expect(() => createPinnedTask(f.input, f)).toThrow(/exact doctor/i);
  });

  it("rejects forged repository and release authorities", () => {
    const f = fixture();
    expect(() => createPinnedTask(f.input, { ...f, releaseAuthority: { readCurrent() {}, doctor() {} } })).toThrow(/authentic.*ReleaseAuthority/i);
    expect(() => createPinnedTask(f.input, { ...f, repositoryAuthority: { resolve() {} } })).toThrow(/authentic repository registry/i);
  });

  it("closes the real public bin task-create path with trusted launcher config", () => {
    const f = fixture();
    const home = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-public-create-")));
    roots.push(home);
    const storage = join(home, "storage"), repository = join(home, "repository"), configDir = join(home, ".config", "workflowhub");
    mkdirSync(storage); mkdirSync(repository); mkdirSync(configDir, { recursive: true });
    execFileSync("git", ["init", "-q"], { cwd: repository });
    writeFileSync(join(configDir, "config.json"), `${JSON.stringify({
      task_dir: storage,
      repositories: { "repositories/product": repository },
      current_release: f.current,
    })}\n`);
    const stdin = JSON.stringify({
      schema_id: "https://workflowhub.dev/schemas/cli-input.v1.schema.json",
      schema_version: "1.0.0",
      command: "task",
      input_source: "@-",
      payload: f.input,
    });
    const child = spawnSync(process.execPath, [join(process.cwd(), "bin", "workflowhub"), "task", "create", "--input", "@-"], {
      cwd: home,
      env: { ...process.env, HOME: home, XDG_CONFIG_HOME: join(home, ".config") },
      encoding: "utf8",
      input: stdin,
    });
    expect(child.status, child.stderr).toBe(0);
    expect(JSON.parse(child.stdout)).toMatchObject({ status: "ok", exit_code: 0, result_ref: "projects/Demo/tasks/release-pin/task.json" });
    expect(JSON.parse(readFileSync(join(storage, "Projects", "Demo", "tasks", "release-pin", "task.json"), "utf8"))).toMatchObject({
      target_repository_ref: "repositories/product",
      release_manifest_ref: f.current.ref,
      release_manifest_hash: f.current.sha256,
    });
  });
});

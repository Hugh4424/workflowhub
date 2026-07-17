import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { createDoctorAuthority, runDoctorCommand } from "../core/doctor-command.mjs";
import { createLauncherAuthority, createReleaseAuthority } from "../core/launcher-authority.mjs";
import { createReadOnlyFacadeExecutor, executePublicCli } from "../core/public-cli.mjs";
import { createRepositoryRegistry } from "../core/repository-registry.mjs";
import { getTaskStatus, taskBootstrapView } from "../core/task-status.mjs";
import { createPinnedTask } from "../scripts/task-bootstrap.mjs";

const roots = [];
afterEach(() => { while (roots.length) rmSync(roots.pop(), { recursive: true, force: true }); });

function taskFixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-task-status-"))); roots.push(root);
  const storageRoot = join(root, "storage"), repository = join(root, "repo");
  mkdirSync(storageRoot); mkdirSync(repository); execFileSync("git", ["init", "-q"], { cwd: repository });
  const launcherAuthority = createLauncherAuthority({ home: root, env: { WORKFLOWHUB_TASK_DIR: storageRoot } });
  return createPinnedTask({
    schema_id: "https://workflowhub.dev/schemas/task-create-input.v1.schema.json", schema_version: "1.0.0",
    project_name: "Demo", task_id: "status-task", source_ref: "sources/event.json", target_repository_ref: "repositories/product",
  }, {
    launcherAuthority,
    repositoryAuthority: createRepositoryRegistry(launcherAuthority, { "repositories/product": repository }),
    releaseAuthority: createReleaseAuthority(launcherAuthority, { readCurrent: () => ({ ref: "releases/current.json", sha256: "a".repeat(64) }), doctor: (value) => ({ ok: true, manifest_ref: value.ref, manifest_hash: value.sha256 }) }),
  });
}

describe("read-only task/bootstrap/status/doctor facade", () => {
  it("returns canonical refs and next action without paths or capabilities", () => {
    const task = taskFixture();
    for (const result of [getTaskStatus(task), taskBootstrapView(task)]) {
      expect(result).toMatchObject({ task_ref: "projects/Demo/tasks/status-task", manifest_ref: "task.json", next_action: "make-decision prepare", facts_refs: [] });
      expect(JSON.stringify(result)).not.toMatch(/tmp|capability|storage|worktree/i);
    }
  });

  it("returns only doctor facts refs and next action from an authentic authority", async () => {
    const result = await runDoctorCommand(createDoctorAuthority(() => ({ ok: true, facts_refs: ["doctor/runtime.json"] })));
    expect(result).toEqual({ status: "available", facts_refs: ["doctor/runtime.json"], next_action: "none" });
    await expect(runDoctorCommand({ inspect() {} })).rejects.toThrow(/authentic doctor authority/i);
  });

  it("routes task bootstrap/status and doctor through the public read-only facade", async () => {
    const task = taskFixture();
    const executor = createReadOnlyFacadeExecutor({
      taskCapability: task,
      doctorAuthority: createDoctorAuthority(() => ({ ok: true, facts_refs: ["doctor/runtime.json"] })),
    });
    await expect(executePublicCli({ argv: ["task", "bootstrap", "--project", "Demo", "--task", "status-task"], executor })).resolves.toMatchObject({ result_ref: "projects/Demo/tasks/status-task/bootstrap" });
    await expect(executePublicCli({ argv: ["status", "--project", "Demo", "--task", "status-task"], executor })).resolves.toMatchObject({ result_ref: "projects/Demo/tasks/status-task/status" });
    await expect(executePublicCli({ argv: ["doctor"], executor })).resolves.toMatchObject({ result_ref: "doctor/runtime.json" });
  });

  it("rejects non-canonical doctor facts", async () => {
    await expect(runDoctorCommand(createDoctorAuthority(() => ({ ok: true, facts_refs: ["/tmp/doctor.json"] })))).rejects.toThrow(/canonical/i);
    await expect(runDoctorCommand(createDoctorAuthority(() => ({ ok: true, facts_refs: ["doctor/../escape.json"] })))).rejects.toThrow(/canonical/i);
  });
});

import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createTask, openTask } from "../../runtime/task/task-handle.mjs";

const roots = [];
afterEach(() => { while (roots.length) rmSync(roots.pop(), { recursive: true, force: true }); });
function fixture(cohort = "post", extras = {}) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-current-identity-"))); roots.push(root);
  const target = join(root, "target"); mkdirSync(target);
  const taskPath = join(root, "Projects", "workflowhub", "tasks", "current-identity");
  mkdirSync(join(taskPath, "quality", "evidence"), { recursive: true });
  const manifest = { schema_version: "1.0.0", project_name: "workflowhub", task_id: "current-identity",
    created_at: "2026-07-27T00:00:00.000Z", target_repo_root: target, issue_ids: [], inputs: {},
    activation_cohort: cohort, execution_mode: "per_invocation", record_model: "vnext-single-write", ...extras };
  const bytes = `${JSON.stringify(manifest, null, 2)}\n`;
  writeFileSync(join(taskPath, "task.json"), bytes); writeFileSync(join(taskPath, "quality", "evidence", "historical.txt"), "original historical bytes\n");
  return { root, target, taskPath, manifest, bytes };
}

describe("current ordinary task identity and read-only runner provenance", () => {
  it("rejects a mismatched expected task or manifest identity before any record writes", () => {
    const f = fixture();
    expect(() => openTask(f.taskPath, "workflowhub", "other-task")).toThrow(/identity|task|path/i);
    writeFileSync(join(f.taskPath, "task.json"), `${JSON.stringify({ ...f.manifest, task_id: "other-task" })}\n`);
    expect(() => openTask(f.taskPath, "workflowhub", "current-identity")).toThrow(/identity.*mismatch/i);
    expect(existsSync(join(f.taskPath, "quality", "new"))).toBe(false);
    expect(readFileSync(join(f.taskPath, "quality", "evidence", "historical.txt"), "utf8")).toBe("original historical bytes\n");
  });

  it("reads pre/history runner metadata as inert original bytes without migration and rejects all writes", async () => {
    const histories = [
      { runner_root: "/retired/workflowhub-runner", runner_oid: "f".repeat(40), runner_root_migration: { ref: "identity/migrations/runner-root/historical.json" } },
      { runner_root: "relative/old-runner", runner_oid: "old unverified metadata", runner_root_migration: { ref: "../old-migration.json" } },
    ];
    for (const cohort of ["pre", "history"]) for (const history of histories) {
      const f = fixture(cohort, { execution_mode: "legacy_pinned", ...history });
      const beforeNames = readdirSync(f.taskPath).sort();
      const pinned = openTask(f.taskPath, "workflowhub", "current-identity");
      expect(pinned.manifest).toMatchObject({ execution_mode: "legacy_pinned", ...history });
      expect(pinned.readRecord("task.json")).toBe(f.bytes);
      expect(pinned.readRecord("quality/evidence/historical.txt")).toBe("original historical bytes\n");
      await expect(pinned.createRecord("quality/new/create.txt", "bad")).rejects.toThrow(/pre\/history|read.only/i);
      await expect(pinned.writeRecordAtomic("quality/evidence/historical.txt", "bad")).rejects.toThrow(/pre\/history|read.only/i);
      let called = false;
      await expect(pinned.withRecordLock("ordinary-history", () => { called = true; })).rejects.toThrow(/pre\/history|read.only/i);
      expect(called).toBe(false);
      expect(readdirSync(f.taskPath).sort()).toEqual(beforeNames);
      expect(existsSync(join(f.taskPath, "identity"))).toBe(false);
      expect(existsSync(join(f.taskPath, "quality", "new"))).toBe(false);
      expect(readFileSync(join(f.taskPath, "task.json"), "utf8")).toBe(f.bytes);
      expect(readFileSync(join(f.taskPath, "quality", "evidence", "historical.txt"), "utf8")).toBe("original historical bytes\n");
    }
  });

  it("new current task creation rejects retired runner fields before creating task storage", async () => {
    const f = fixture();
    const storage = join(f.root, "fresh-storage"); mkdirSync(storage);
    await expect(createTask({ storageRoot: storage, manifest: { ...f.manifest, task_id: "new-current-task",
      runner_root: "/retired/runner", runner_oid: "f".repeat(40), runner_root_migration: { ref: "identity/migrations/runner-root/old.json" } } }))
      .rejects.toThrow(/retired|unknown/i);
    expect(readdirSync(storage)).toEqual([]);
  });
});

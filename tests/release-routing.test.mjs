import { describe, expect, it } from "vitest";
import { loadPhaseCapability } from "./helpers/side-effect-snapshot.mjs";

const current = { ref: "releases/manifest-new.json", sha256: "a".repeat(64) };
const old = { ref: "releases/manifest-old.json", sha256: "b".repeat(64) };
const taskInput = { schema_id: "https://workflowhub.dev/schemas/task-create-input.v1.schema.json", schema_version: "1.0.0", project_name: "workflowhub", task_id: "task-new", source_ref: "sources/offline/event-1.json", target_repository_ref: "repositories/workflowhub" };
const oldTask = { schema_id: "https://workflowhub.dev/schemas/task-manifest.v1.schema.json", schema_version: "1.0.0", project_name: "workflowhub", task_id: "task-old", created_at: "2026-07-17T00:00:00.000Z", target_repository_ref: "repositories/workflowhub", release_manifest_ref: old.ref, release_manifest_hash: old.sha256 };

describe("AC-012/014/015/019 release pin and routing", () => {
  it("pins a doctor-approved current manifest under the create lock", async () => {
    const create = await loadPhaseCapability("../core/release-routing.mjs", "createPinnedTask");
    expect(await create({ current, doctor: { ok: true, manifest_ref: current.ref, manifest_hash: current.sha256 }, input: taskInput })).toMatchObject({ schema_id: "https://workflowhub.dev/schemas/task-manifest.v1.schema.json", schema_version: "1.0.0", task_id: "task-new", release_manifest_ref: current.ref, release_manifest_hash: current.sha256 });
  });

  it("rejects caller release pin before task creation", async () => {
    const create = await loadPhaseCapability("../core/release-routing.mjs", "createPinnedTask");
    await expect(create({ current, doctor: { ok: true }, input: { ...taskInput, release_manifest_ref: old.ref, release_manifest_hash: old.sha256 } })).rejects.toThrow(/release pin|caller|input|schema/i);
  });

  it("switches one pointer: old task keeps old pin and new task receives new pin", async () => {
    const route = await loadPhaseCapability("../core/release-routing.mjs", "casProductionRoute");
    const result = await route({ pointer: old.sha256, expected: old.sha256, next: current.sha256, existingTasks: [oldTask], newTaskInput: taskInput });
    expect(result).toMatchObject({ pointer: current.sha256, existing_tasks: [expect.objectContaining({ task_id: "task-old", release_manifest_hash: old.sha256 })], new_task: expect.objectContaining({ task_id: "task-new", release_manifest_hash: current.sha256 }) });
  });

  it("forbids ordinary pin drift but permits exact privileged prepare/confirm/execute repin", async () => {
    const repin = await loadPhaseCapability("../core/release-routing.mjs", "repinTaskRelease");
    await expect(repin({ task: oldTask, next: current, authority: null })).rejects.toThrow(/privileged|authority|repin/i);
    expect(await repin({ task: oldTask, next: current, authority: { purpose: "admin-repin", plan_hash: "c".repeat(64), confirmed_plan_hash: "c".repeat(64) } })).toMatchObject({ release_manifest_ref: current.ref, release_manifest_hash: current.sha256 });
  });

  it("requires quiesce and drain when the platform has no atomic pointer", async () => {
    const route = await loadPhaseCapability("../core/release-routing.mjs", "switchNonAtomicRoute");
    await expect(route({ quiesced: false, drained: false, updates: ["runtime", "skills"] })).rejects.toThrow(/quiesce|drain/i);
  });

  it("rolls back only to an approved compatible manifest, otherwise disables entry", async () => {
    const rollback = await loadPhaseCapability("../core/release-routing.mjs", "selectRollbackRoute");
    expect(rollback([{ ...old, approved: true, compatible: true }])).toMatchObject(old);
    expect(rollback([{ ...old, approved: false, compatible: true }])).toMatchObject({ disabled: true });
  });
});

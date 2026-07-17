import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, readFileSync, realpathSync, rmSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createTask, createTaskKernel } from "../core/task-handle.mjs";
import { assertLegacyReadResult, readAcceptedRecordExact, readLegacyAcceptedRecord, validateFrozenLegacyV2Pair, validateLegacyCheckpoint } from "../core/legacy-record-reader.mjs";
import { validateTaskSnapshot } from "../core/task-snapshot.mjs";

const roots = []; afterEach(() => { while (roots.length) rmSync(roots.pop(), { recursive: true, force: true }); });
function fixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "legacy-v2-"))); roots.push(root);
  const task = createTask({ storageRoot: root, manifest: { schema_version: "1.0.0", project_name: "Demo", task_id: "legacy-task", created_at: new Date().toISOString(), target_repo_root: join(root, "repo"), issue_ids: [], inputs: {} } });
  const kernel = createTaskKernel(task); const attempt = kernel.publishAttempt("make-decision", { facts: { worktree_root: join(root, "repo-legacy-task"), baseline_commit: "a".repeat(40), decision: "go", scope: "legacy", risks: [] }, upstream_refs: [] });
  const confirmation = kernel.confirmAttempt("make-decision", attempt.attempt_ref, "accepted"); kernel.acceptAttempt("make-decision", attempt.attempt_ref, confirmation.ref);
  return task;
}
describe("legacy v2 exact readonly reader", () => {
  it("keeps the authorized v2 frozen fixtures byte-identical", () => {
    const fixtureRoot = new URL("./fixtures/multica-isolation-recovery-v2/", import.meta.url); const manifest = JSON.parse(readFileSync(new URL("manifest.json", fixtureRoot)));
    for (const item of manifest.frozen_files) {
      const raw = readFileSync(new URL(item.path.split("/").at(-1), fixtureRoot));
      expect(createHash("sha256").update(raw).digest("hex"), item.path).toBe(item.sha256);
    }
    expect(validateLegacyCheckpoint(JSON.parse(readFileSync(new URL("git-checkpoint.v1.json", fixtureRoot))))).toHaveProperty("tree_oid");
    const pair = validateFrozenLegacyV2Pair({ attemptRaw: readFileSync(new URL("task-attempt.v2.json", fixtureRoot), "utf8"), acceptedRaw: readFileSync(new URL("task-accepted.v2.json", fixtureRoot), "utf8") });
    expect(assertLegacyReadResult(pair).value.integrity).toEqual({ declared: "a".repeat(64), actual: manifest.frozen_files.find((item) => item.kind === "task-attempt.v2").sha256, matches: false });
  });
  it("preserves bytes/hash and never sends accepted v2 to snapshot v1", () => {
    const task = fixture(); const before = task.readRecord("results/make-decision/accepted.json");
    const result = readLegacyAcceptedRecord(task, "make-decision"); expect(assertLegacyReadResult(result).kind).toBe("task-accepted.v2");
    expect(readAcceptedRecordExact(task, "make-decision").sha256).toBe(result.sha256); expect(task.readRecord(result.ref)).toBe(before);
    expect(() => validateTaskSnapshot(result.value)).toThrow(/snapshot schema_version|unknown or missing/i);
  });
  it("validates checkpoint v1 exactly and rejects upgrades", () => {
    const checkpoint = { schema_version: "git-checkpoint-plan.v1", stage: "build-plan", parent_commit: "a".repeat(40), artifacts: [], plan_hash: "b".repeat(64) };
    expect(validateLegacyCheckpoint(checkpoint).schema_version).toBe("git-checkpoint-plan.v1");
    expect(() => validateLegacyCheckpoint({ ...checkpoint, upgraded: true })).toThrow(/unknown/);
  });
});

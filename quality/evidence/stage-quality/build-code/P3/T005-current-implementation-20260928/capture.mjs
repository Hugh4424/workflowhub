import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { realpathSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const root = realpathSync(process.cwd());
const expectedRoot = "/Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-04-20260919";
const taskPath = "/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-thin-core-card-04-20260919";
const taskId = "workflowhub-thin-core-card-04-20260919";
const expectedBranch = "task/workflowhub/workflowhub-thin-core-card-04-20260919";
const expectedHead = "ef920f1fbd415fe87d50930359059b661e141acd";
const expectedTree = "4381e90d43a7072ba12d1a4359ba757c3ddd5786";
const expectedMaterial = "revision-30e50b760cb29e92f9b114a9be6db6105647a76b7c3c8caeb15a4a949a4975b6";
if (root !== expectedRoot) throw new Error("wrong CARD04 worktree");
const git = (args) => execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
if (git(["branch", "--show-current"]) !== expectedBranch || git(["rev-parse", "HEAD"]) !== expectedHead) {
  throw new Error("CARD04 branch or HEAD changed");
}
const importFromRoot = async (path) => import(pathToFileURL(join(root, path)).href);
const { openTask, createTaskKernel } = await importFromRoot("runtime/task/task-handle.mjs");
const { openCurrentTaskWorkspace } = await importFromRoot("runtime/task/workspace.mjs");
const { writeCurrentImplementationReceipt } = await importFromRoot("runtime/evidence/canonical-receipt-writer.mjs");
const task = openTask(taskPath, "workflowhub", taskId);
const workspace = openCurrentTaskWorkspace(task);
const kernel = createTaskKernel(task, { workspace });
const before = kernel.currentVNextSnapshot({ fresh: true });
const material = kernel.currentVNextMaterialRevision();
if (before.tree !== expectedTree || material !== expectedMaterial) throw new Error("CARD04 source or material changed before capture");
const result = writeCurrentImplementationReceipt({ task, workspace });
const after = kernel.currentVNextSnapshot({ fresh: true });
if (after.tree !== expectedTree || result.value.snapshot_tree !== expectedTree
    || result.value.snapshot_head !== expectedHead) throw new Error("CARD04 source changed during capture");
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const receiptRaw = task.readRecord(result.ref);
const diffRaw = task.readRecord(result.value.diff_ref);
if (sha256(receiptRaw) !== result.sha256 || sha256(diffRaw) !== result.value.diff_hash) {
  throw new Error("implementation receipt or diff readback mismatch");
}
process.stdout.write(`${JSON.stringify({ task_id: taskId, worktree: root,
  branch: expectedBranch, head: expectedHead, snapshot_tree: expectedTree,
  source_digest: after.source_digest, material_revision: material,
  receipt_ref: result.ref, receipt_sha256: result.sha256,
  diff_ref: result.value.diff_ref, diff_sha256: result.value.diff_hash,
  changed_count: result.value.changed.length }, null, 2)}\n`);

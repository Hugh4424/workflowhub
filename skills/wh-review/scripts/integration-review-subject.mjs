import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const OID = /^[a-f0-9]{40,64}$/;
const HASH = /^[a-f0-9]{64}$/;
const MATERIAL_NAMES = Object.freeze(["decision-log.md", "spec.md", "plan.md", "tasks.md"]);

function incomplete(message) {
  const error = new Error(`MATERIAL_INCOMPLETE: ${message}`);
  error.code = "MATERIAL_INCOMPLETE";
  throw error;
}

function sha256(raw) {
  return createHash("sha256").update(raw).digest("hex");
}

function parseJson(raw, label) {
  try { return JSON.parse(raw); }
  catch { incomplete(`${label} is not JSON`); }
}

function requiredTask(task) {
  if (!task || typeof task !== "object" || typeof task.readRecord !== "function"
    || typeof task.identity?.taskId !== "string" || task.identity.taskId.length === 0) {
    throw new TypeError("task with identity.taskId and readRecord is required");
  }
  return task;
}

function git(root, args, label) {
  try {
    return execFileSync("git", args, {
      cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch {
    incomplete(`${label} is unavailable from Git`);
  }
}

/**
 * Read only the active material revision.  Accepted checkpoints, phase
 * successors, corrections and historic traces deliberately do not appear in
 * this module: they are audit records, never a licence to progress work.
 */
function currentMaterials(task, sourceRoot) {
  let pointerRaw;
  try { pointerRaw = task.readRecord("materials/current.json"); }
  catch { incomplete("current material pointer is missing"); }
  const pointer = parseJson(pointerRaw, "current material pointer");
  if (pointer?.task_id !== task.identity.taskId || typeof pointer.revision_ref !== "string"
    || !HASH.test(pointer.revision_hash ?? "")) {
    incomplete("current material pointer is invalid");
  }

  let revisionRaw;
  try { revisionRaw = task.readRecord(pointer.revision_ref); }
  catch { incomplete("current material revision is missing"); }
  if (sha256(revisionRaw) !== pointer.revision_hash) incomplete("current material revision hash mismatch");
  const revision = parseJson(revisionRaw, "current material revision");
  if (revision?.task_id !== task.identity.taskId || !revision.hashes || typeof revision.hashes !== "object") {
    incomplete("current material revision is invalid");
  }

  const root = resolve(sourceRoot, "specs", task.identity.taskId);
  const hashes = {};
  for (const name of MATERIAL_NAMES) {
    let raw;
    try { raw = readFileSync(resolve(root, name), "utf8"); }
    catch { incomplete(`current material is missing: ${name}`); }
    const actual = sha256(raw);
    const expected = revision.hashes[name] ?? revision.hashes[name.replace(".md", "").replace("-", "_")];
    if (!HASH.test(expected ?? "") || expected !== actual) incomplete(`current material hash mismatch: ${name}`);
    hashes[name] = actual;
  }
  return Object.freeze({ ref: pointer.revision_ref, sha256: pointer.revision_hash, hashes: Object.freeze(hashes) });
}

function unavailableSubject({ sourceRoot, task, finalTree, reason }) {
  const head = typeof sourceRoot === "string" && sourceRoot.length > 0
    ? (() => {
      try {
        const commit = git(sourceRoot, ["rev-parse", "HEAD"], "current snapshot");
        return { commit, tree: git(sourceRoot, ["rev-parse", "HEAD^{tree}"], "current snapshot") };
      } catch { return { commit: null, tree: null }; }
    })()
    : { commit: null, tree: null };
  return Object.freeze({
    schema_version: "integration-review-subject.v1",
    subject_kind: "worktree",
    review_scope: "integration",
    base_commit: head.commit,
    base_tree: head.tree,
    snapshot_tree: finalTree,
    material_revision: task?.identity?.taskId ? { task_id: task.identity.taskId } : null,
    formal_record_status: Object.freeze({ status: "unavailable", reason }),
    // Keep the public shape stable.  review-materials rejects this incomplete
    // payload, so an unavailable audit can never be mistaken for semantic PASS.
    phase_coverage: Object.freeze({
      schema_version: "phase-review-coverage.v1", snapshot_tree: finalTree,
      checkpoint: null, phases: Object.freeze([]),
    }),
    seam_index: Object.freeze({
      schema_version: "cross-phase-seam-index.v1", snapshot_tree: finalTree, entries: Object.freeze([]),
    }),
    ac_trace: Object.freeze({
      schema_version: "ac-change-test-trace.v1", snapshot_tree: finalTree,
      acceptance_ids: Object.freeze([]), entries: Object.freeze([]),
    }),
  });
}

/**
 * Integration review is intentionally current-state only.  This function
 * validates the four active materials and the requested worktree snapshot,
 * then reports that a same-snapshot semantic evidence bundle is still needed.
 * The final stage handler owns that bundle and is the sole formal-completion
 * gate.  Historic phase traces remain readable elsewhere as audit data only.
 */
export function buildIntegrationReviewSubject({ task, sourceRoot, finalTree } = {}) {
  const safeTask = requiredTask(task);
  if (typeof sourceRoot !== "string" || sourceRoot.length === 0) throw new TypeError("sourceRoot is required");
  if (!OID.test(finalTree ?? "")) throw new TypeError("finalTree is invalid");
  const materials = currentMaterials(safeTask, sourceRoot);
  const head = git(sourceRoot, ["rev-parse", "HEAD"], "current snapshot");
  const tree = git(sourceRoot, ["rev-parse", "HEAD^{tree}"], "current snapshot");
  if (!OID.test(head) || !OID.test(tree)) incomplete("current Git snapshot is invalid");
  return Object.freeze({
    ...unavailableSubject({
      sourceRoot, task: safeTask, finalTree,
      reason: "current materials are valid; final same-snapshot semantic review facts have not been supplied",
    }),
    base_commit: head,
    base_tree: tree,
    material_revision: materials,
  });
}

/** Best-effort audit view.  It never reads or reconstructs historic lineage. */
export function inspectIntegrationReviewSubject(options = {}) {
  try { return buildIntegrationReviewSubject(options); }
  catch (error) {
    if (error?.code !== "MATERIAL_INCOMPLETE") throw error;
    return unavailableSubject({
      sourceRoot: options.sourceRoot, task: options.task, finalTree: options.finalTree,
      reason: String(error.message).replace(/^MATERIAL_INCOMPLETE:\s*/, ""),
    });
  }
}

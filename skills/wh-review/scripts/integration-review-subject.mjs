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
const sha256 = (raw) => createHash("sha256").update(raw).digest("hex");

function parseJson(raw, label) {
  try { return JSON.parse(raw); } catch { incomplete(`${label} is not JSON`); }
}
function requiredTask(task) {
  if (!task || typeof task !== "object" || typeof task.readRecord !== "function" || typeof task.identity?.taskId !== "string" || task.identity.taskId === "") {
    throw new TypeError("task with identity.taskId and readRecord is required");
  }
  return task;
}
function git(root, args, label) {
  try { return execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim(); }
  catch { incomplete(`${label} is unavailable from Git`); }
}

/** Current material revision is the only design authority. */
function currentMaterials(task, sourceRoot) {
  let pointerRaw;
  try { pointerRaw = task.readRecord("materials/current.json"); } catch { incomplete("current material pointer is missing"); }
  const pointer = parseJson(pointerRaw, "current material pointer");
  if (pointer?.task_id !== task.identity.taskId || typeof pointer.revision_ref !== "string" || !HASH.test(pointer.revision_hash ?? "")) incomplete("current material pointer is invalid");
  let revisionRaw;
  try { revisionRaw = task.readRecord(pointer.revision_ref); } catch { incomplete("current material revision is missing"); }
  if (sha256(revisionRaw) !== pointer.revision_hash) incomplete("current material revision hash mismatch");
  const revision = parseJson(revisionRaw, "current material revision");
  if (revision?.task_id !== task.identity.taskId || !revision.hashes || typeof revision.hashes !== "object") incomplete("current material revision is invalid");
  const root = resolve(sourceRoot, "specs", task.identity.taskId);
  const texts = {};
  for (const name of MATERIAL_NAMES) {
    let raw;
    try { raw = readFileSync(resolve(root, name), "utf8"); } catch { incomplete(`current material is missing: ${name}`); }
    const expected = revision.hashes[name] ?? revision.hashes[name.replace(".md", "").replace("-", "_")];
    if (!HASH.test(expected ?? "") || expected !== sha256(raw)) incomplete(`current material hash mismatch: ${name}`);
    texts[name] = raw;
  }
  return Object.freeze({ ref: pointer.revision_ref, sha256: pointer.revision_hash, texts: Object.freeze(texts) });
}

function binding(task, item, label) {
  if (!item || typeof item.ref !== "string" || !HASH.test(item.sha256 ?? "")) incomplete(`${label} binding is invalid`);
  let raw;
  try { raw = task.readRecord(item.ref); } catch { incomplete(`${label} is missing: ${item.ref}`); }
  if (sha256(raw) !== item.sha256) incomplete(`${label} hash mismatch: ${item.ref}`);
  return Object.freeze({ ref: item.ref, sha256: item.sha256, value: parseJson(raw, label) });
}

function ids(text) { return [...new Set((text.match(/\bAC-\d+\b/g) ?? []))]; }
function completedTasks(task, taskText) {
  const output = [];
  const matcher = /^####\s+(T\d+)\b[^\n]*\n([\s\S]*?)(?=^####\s+T\d+\b|(?![\s\S]))/gm;
  for (const found of taskText.matchAll(matcher)) {
    const [whole, taskId, body] = found;
    if (!/\[x\]\s+\*\*任务完成\*\*/.test(body) || !/\*\*status\*\*：`completed`/.test(body)) continue;
    const acLine = /\*\*covered_ac\*\*：([^\n]+)/.exec(body)?.[1] ?? "";
    const acceptanceIds = ids(acLine);
    const evidenceRaw = /\*\*evidence_refs\*\*：`?([^\n`]+)`?/.exec(body)?.[1];
    if (acceptanceIds.length === 0 || !evidenceRaw) incomplete(`completed ${taskId} lacks covered_ac or evidence_refs`);
    const evidence = parseJson(evidenceRaw, `${taskId} evidence_refs`);
    if (!Array.isArray(evidence) || evidence.length === 0) incomplete(`completed ${taskId} evidence_refs are invalid`);
    const evidenceBindings = evidence.map((item) => binding(task, item, `${taskId} evidence`));
    const actualChanges = /\*\*actual_changes\*\*：([^\n]+)/.exec(body)?.[1]?.trim() ?? "completed task evidence";
    const line = taskText.slice(0, found.index).split("\n").length + 1;
    output.push(Object.freeze({ task_id: taskId, acceptance_ids: acceptanceIds, evidence: evidenceBindings, summary: actualChanges, line }));
  }
  return output;
}

function currentBinding(tasks, finalTree, kind) {
  const selected = [];
  for (const task of tasks) for (const item of task.evidence) {
    const value = item.value;
    const implementation = kind === "implementation" && item.ref.startsWith("receipts/revisions/implementation/");
    const green = kind === "green" && item.ref.startsWith("receipts/build-tests") && value.exit_code === 0;
    if ((implementation || green) && value?.snapshot_tree === finalTree) selected.push(item);
  }
  if (selected.length === 0) incomplete(`current ${kind} receipt for final snapshot is missing`);
  const first = selected[0];
  if (selected.some(({ ref, sha256 }) => ref !== first.ref || sha256 !== first.sha256)) incomplete(`current ${kind} receipt for final snapshot is ambiguous`);
  return Object.freeze({ ref: first.ref, sha256: first.sha256 });
}

function unavailable({ sourceRoot, task, finalTree, reason }) {
  let base_commit = null; let base_tree = null;
  try { base_commit = git(sourceRoot, ["rev-parse", "HEAD"], "current snapshot"); base_tree = git(sourceRoot, ["rev-parse", "HEAD^{tree}"], "current snapshot"); } catch { /* audit only */ }
  return Object.freeze({
    schema_version: "integration-review-subject.v1", subject_kind: "worktree", review_scope: "integration",
    base_commit, base_tree, snapshot_tree: finalTree,
    formal_record_status: Object.freeze({ status: "unavailable", reason }),
    phase_coverage: Object.freeze({ schema_version: "current-worktree-coverage.v1", snapshot_tree: finalTree, completed_tasks: Object.freeze([]) }),
    seam_index: Object.freeze({ schema_version: "current-worktree-seam-index.v1", snapshot_tree: finalTree, entries: Object.freeze([]) }),
    ac_trace: Object.freeze({ schema_version: "ac-change-test-trace.v1", snapshot_tree: finalTree, acceptance_ids: Object.freeze([]), entries: Object.freeze([]) }),
  });
}

/**
 * Final integration is proved from current materials, completed tasks, and
 * current-snapshot implementation/GREEN receipts only. Historic phase maps,
 * successors and corrections are deliberately absent: they remain audit data.
 */
export function buildIntegrationReviewSubject({ task, sourceRoot, finalTree } = {}) {
  const safeTask = requiredTask(task);
  if (typeof sourceRoot !== "string" || sourceRoot === "") throw new TypeError("sourceRoot is required");
  if (!OID.test(finalTree ?? "")) throw new TypeError("finalTree is invalid");
  const materials = currentMaterials(safeTask, sourceRoot);
  const base_commit = git(sourceRoot, ["rev-parse", "HEAD"], "current snapshot");
  const base_tree = git(sourceRoot, ["rev-parse", "HEAD^{tree}"], "current snapshot");
  const acceptanceIds = ids(materials.texts["spec.md"]);
  if (acceptanceIds.length === 0) incomplete("current spec declares no acceptance criteria");
  const tasks = completedTasks(safeTask, materials.texts["tasks.md"]);
  const covered = new Map();
  for (const item of tasks) for (const id of item.acceptance_ids) if (!covered.has(id)) covered.set(id, item);
  for (const id of acceptanceIds) if (!covered.has(id)) incomplete(`current tasks have no completed evidence for ${id}`);
  const implementation = currentBinding(tasks, finalTree, "implementation");
  const green = currentBinding(tasks, finalTree, "green");
  const root = `specs/${safeTask.identity.taskId}/tasks.md`;
  const entries = acceptanceIds.map((id) => {
    const item = covered.get(id);
    return Object.freeze({
      acceptance_criterion_id: id,
      change: Object.freeze([{ task_id: item.task_id, summary: item.summary }]),
      test: Object.freeze([{ receipt_ref: green.ref, receipt_hash: green.sha256 }]),
      evidence: Object.freeze([{ ref: implementation.ref, sha256: implementation.sha256 }]),
      anchors: Object.freeze([{ id: `${item.task_id}:${id}`, path: root, start_line: item.line, end_line: item.line, role: "completion", reason: "current task completion evidence" }]),
    });
  });
  return Object.freeze({
    schema_version: "integration-review-subject.v1", subject_kind: "worktree", review_scope: "integration",
    base_commit, base_tree, snapshot_tree: finalTree, material_revision: { ref: materials.ref, sha256: materials.sha256 },
    formal_record_status: Object.freeze({ status: "available", reason: "current materials and same-snapshot task evidence are complete" }),
    phase_coverage: Object.freeze({
      schema_version: "current-worktree-coverage.v1", snapshot_tree: finalTree,
      implementation_receipt: implementation, green_test_receipt: green,
      completed_tasks: Object.freeze(tasks.map(({ task_id, acceptance_ids, summary }) => Object.freeze({ task_id, acceptance_ids: Object.freeze(acceptance_ids), summary }))),
    }),
    seam_index: Object.freeze({ schema_version: "current-worktree-seam-index.v1", snapshot_tree: finalTree, entries: Object.freeze([]) }),
    ac_trace: Object.freeze({ schema_version: "ac-change-test-trace.v1", snapshot_tree: finalTree, acceptance_ids: Object.freeze(acceptanceIds), entries: Object.freeze(entries) }),
  });
}

export function inspectIntegrationReviewSubject(options = {}) {
  try { return buildIntegrationReviewSubject(options); }
  catch (error) {
    if (error?.code !== "MATERIAL_INCOMPLETE") throw error;
    return unavailable({ sourceRoot: options.sourceRoot, task: options.task, finalTree: options.finalTree, reason: String(error.message).replace(/^MATERIAL_INCOMPLETE:\s*/, "") });
  }
}

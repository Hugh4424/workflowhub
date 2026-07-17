import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { assertWorkspace } from "./workspace.mjs";
import { hashCanonical } from "./task-snapshot.mjs";
import { assertCanonicalPhaseSubject } from "./phase-subject.mjs";

function git(root, args) { return String(execFileSync("git", args, { cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 })).replace(/\r\n/g, "\n"); }
export function scanPhaseTreeDiff(workspace, subjectRecord) {
  if (arguments.length !== 2) throw new TypeError("scanPhaseTreeDiff accepts only Workspace and canonical subject");
  const root = assertWorkspace(workspace).worktreeRoot; assertCanonicalPhaseSubject(subjectRecord); const subject = subjectRecord.value;
  if (!subject || subject.schema_version !== "1.0.0") throw new TypeError("canonical phase subject required");
  for (const oid of [subject.baseline?.tree_oid, subject.implementation?.tree_oid]) {
    if (!/^[a-f0-9]{40}$/.test(oid ?? "")) throw new Error("subject tree OID invalid");
    execFileSync("git", ["cat-file", "-e", `${oid}^{tree}`], { cwd: root, stdio: "ignore" });
  }
  const changedFiles = git(root, ["diff", "--name-only", "-z", subject.baseline.tree_oid, subject.implementation.tree_oid]).split("\0").filter(Boolean).sort();
  const patch = git(root, ["diff", "--binary", "--full-index", "--no-ext-diff", "--no-renames", subject.baseline.tree_oid, subject.implementation.tree_oid]);
  const allowed = changedFiles.every((file) => subject.allowed_files.includes(file));
  const value = { schema_version: "1.0.0", phase_id: subject.phase_id, task_id: subject.task_id,
    subject: { ref: subjectRecord.ref, hash: subjectRecord.hash }, baseline_tree: subject.baseline.tree_oid,
    implementation_tree: subject.implementation.tree_oid, changed_files: changedFiles, allowed, patch,
    patch_hash: createHash("sha256").update(patch).digest("hex") };
  return Object.freeze({ ref: `evidence/phases/${subject.phase_id}/diff.json`, hash: hashCanonical(value), value: Object.freeze(value) });
}

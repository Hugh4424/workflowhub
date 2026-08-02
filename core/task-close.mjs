import { createHash, randomUUID } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, lstatSync, mkdirSync, realpathSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";

import { assertTaskHandle } from "./task-handle.mjs";
import { assertTaskKernel } from "../runtime/task/task-kernel.mjs";
import { captureGitWorktreeSnapshot } from "../runtime/task/git-worktree-snapshot.mjs";
import { createTaskWorktreeRemoval, openAcceptedWorkspace } from "./workspace.mjs";

const HASH = /^[a-f0-9]{64}$/;
const STEP_ID = /^[a-z0-9](?:[a-z0-9._-]{0,62})$/;
const GOVERNED_EXECUTORS = new WeakSet();

function plain(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${label} must be an object`);
  return value;
}

function canonical(value, label = "close plan") {
  if (value === null || typeof value === "string" || typeof value === "boolean") return JSON.stringify(value);
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new TypeError(`${label} contains a non-finite number`);
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map((item) => canonical(item, label)).join(",")}]`;
  if (!value || typeof value !== "object" || Object.getPrototypeOf(value) !== Object.prototype) {
    throw new TypeError(`${label} must contain JSON values only`);
  }
  const keys = Object.keys(value).sort();
  if (keys.some((key) => value[key] === undefined || typeof value[key] === "function" || typeof value[key] === "symbol" || typeof value[key] === "bigint")) {
    throw new TypeError(`${label} must contain JSON values only`);
  }
  return `{${keys.map((key) => `${JSON.stringify(key)}:${canonical(value[key], label)}`).join(",")}}`;
}

function sha256(value) { return createHash("sha256").update(value).digest("hex"); }

export function closePlanHash(plan) { return sha256(canonical(plain(plan, "close plan"))); }

function validatePlan(plan, task) {
  plain(plan, "close plan");
  if (plan.schema_version !== "task-close-plan.v1") throw new TypeError("close plan schema_version must be task-close-plan.v1");
  if (plan.task_id !== task.identity.taskId) throw new Error("close plan task identity mismatch");
  if (!Array.isArray(plan.steps)) throw new TypeError("close plan steps must be an array");
  const seen = new Set();
  for (const [index, step] of plan.steps.entries()) {
    plain(step, `close plan step ${index}`);
    if (!STEP_ID.test(step.step_id ?? "")) throw new TypeError(`close plan step ${index} has an invalid step_id`);
    if (seen.has(step.step_id)) throw new Error(`duplicate close plan step_id: ${step.step_id}`);
    seen.add(step.step_id);
    if (typeof step.operation !== "string" || step.operation.trim() === "") throw new TypeError(`close plan step ${step.step_id} operation is required`);
  }
  // Canonicalization also rejects functions, undefined, class instances, and
  // other values whose meaning could change between confirmation and execution.
  canonical(plan);
  return plan;
}

function readOptional(task, path) {
  try { return task.readRecord(path); }
  catch (error) { if (error?.code === "ENOENT") return undefined; throw error; }
}

function createOrVerify(task, path, record, label) {
  const raw = `${JSON.stringify(record, null, 2)}\n`;
  const existing = readOptional(task, path);
  if (existing !== undefined) {
    if (existing !== raw) throw new Error(`${label} conflicts with immutable record: ${path}`);
    return record;
  }
  try { task.createRecordAtomic(path, raw); }
  catch (error) {
    if (error?.code !== "EEXIST") throw error;
    if (task.readRecord(path) !== raw) throw new Error(`${label} conflicts with immutable record: ${path}`);
  }
  return record;
}

function verifyFactsFreshForClose(acceptedVerify, worktreeRoot) {
  if (!existsSync(worktreeRoot)) return Object.freeze({ current: true, reason: "worktree-already-removed" });
  const snapshot = captureGitWorktreeSnapshot(worktreeRoot);
  const expectedTrees = [
    acceptedVerify?.facts?.tests?.snapshot_tree,
    acceptedVerify?.facts?.review?.snapshot_tree,
  ].filter((value) => typeof value === "string" && value !== "");
  if (expectedTrees.length === 0) {
    return Object.freeze({ current: false, reason: "accepted verify-code facts have no snapshot binding", snapshot_tree: snapshot.tree });
  }
  if (expectedTrees.some((tree) => tree !== snapshot.tree)) {
    return Object.freeze({
      current: false,
      reason: "accepted verify-code facts are stale relative to the current Workspace",
      snapshot_tree: snapshot.tree,
      expected_trees: [...new Set(expectedTrees)],
    });
  }
  return Object.freeze({ current: true, snapshot_tree: snapshot.tree });
}

/** Persist one immutable, plan-bound close decision. */
export function confirmClosePlan({ task: taskHandle, kernel: taskKernel, plan, outcome, now = () => new Date().toISOString() } = {}) {
  const task = assertTaskHandle(taskHandle);
  const kernel = assertTaskKernel(taskKernel);
  if (kernel.task !== task) throw new Error("close confirmation TaskHandle/TaskKernel mismatch");
  validatePlan(plan, task);
  if (!new Set(["confirmed", "rejected", "timeout"]).has(outcome)) throw new TypeError("close confirmation outcome must be confirmed, rejected, or timeout");
  if (typeof now !== "function") throw new TypeError("close confirmation now must be a function");
  const planHash = closePlanHash(plan);
  const ref = `operations/close/confirmations/${planHash}/${randomUUID()}.json`;
  const confirmation = {
    schema_version: "task-close-confirmation.v1",
    task_id: task.identity.taskId,
    plan_hash: planHash,
    outcome,
    confirmed_at: now(),
  };
  createOrVerify(task, ref, confirmation, "close confirmation");
  return Object.freeze({ ref, confirmation: Object.freeze(confirmation) });
}

function executorFor(executors, step) {
  if (!GOVERNED_EXECUTORS.has(executors)) throw new TypeError("governed close executor registry required");
  const executor = executors.executorFor(step);
  plain(executor, `close executor ${step.step_id}`);
  if (typeof executor.probe !== "function" || typeof executor.execute !== "function" || typeof executor.verify !== "function") throw new TypeError(`close executor ${step.step_id} requires probe, execute, and verify functions`);
  return executor;
}

async function probeSatisfied(executor, step, phase) {
  const observation = plain(await executor.probe(step), `close step ${step.step_id} ${phase} probe`);
  if (typeof observation.satisfied !== "boolean") throw new TypeError(`close step ${step.step_id} probe must return satisfied boolean`);
  if (observation.satisfied && executor.verify) {
    const verified = await executor.verify(observation, step);
    if (verified !== true) throw new Error(`close step ${step.step_id} physical state verification failed`);
  }
  return observation;
}

function completedRecord(task, planHash, step, observation, mode, now) {
  const physical = canonical(observation, `close step ${step.step_id} observation`);
  return {
    schema_version: "task-close-operation.v1",
    task_id: task.identity.taskId,
    plan_hash: planHash,
    step_id: step.step_id,
    operation: step.operation,
    status: "completed",
    completion_mode: mode,
    physical_state_hash: sha256(physical),
    physical_state: structuredClone(observation),
    completed_at: now(),
  };
}

function git(cwd, args, { allowFailure = false } = {}) {
  const result = execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", allowFailure ? "ignore" : "pipe"] });
  return String(result).trim();
}

function gitResult(cwd, args) {
  const result = spawnSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  return { ok: result.status === 0, status: result.status, stdout: String(result.stdout ?? "").trim(), stderr: String(result.stderr ?? "").trim() };
}

function oid(value, label) {
  if (!/^[a-f0-9]{40}$/i.test(value ?? "")) throw new TypeError(`${label} must be a full commit OID`);
  return value.toLowerCase();
}

function repositoryPath(value, label) {
  if (typeof value !== "string" || value === "" || /[\0\r\n\t]/.test(value) || isAbsolute(value) || value.split("/").includes("..")) {
    throw new TypeError(`${label} must be a repository-relative path`);
  }
  return value;
}

function inside(root, candidate) {
  const path = relative(root, candidate);
  return path === "" || (path !== ".." && !path.startsWith(`..${sep}`) && !isAbsolute(path));
}

function createArchiveParent(worktree, archivePath) {
  const root = realpathSync(worktree);
  const parent = dirname(resolve(root, repositoryPath(archivePath, "delivery spec_archive_path")));
  if (!inside(root, parent)) throw new Error("spec archive parent escapes the task worktree");
  let cursor = root;
  for (const part of relative(root, parent).split(sep).filter(Boolean)) {
    cursor = join(cursor, part);
    let stat;
    try { stat = lstatSync(cursor); }
    catch (error) { if (error?.code === "ENOENT") break; throw error; }
    if (stat.isSymbolicLink()) throw new Error("spec archive parent must not traverse symbolic links");
    if (!stat.isDirectory()) throw new Error("spec archive parent ancestor must be a directory");
  }
  mkdirSync(parent, { recursive: true });
  if (!inside(root, realpathSync(parent))) throw new Error("spec archive parent escapes the task worktree");
}

function treeEntry(root, commit, path) {
  const result = gitResult(root, ["ls-tree", "-z", commit, "--", path]);
  if (!result.ok || result.stdout === "") return null;
  const match = /^([0-7]{6}) (blob|tree) ([a-f0-9]{40})\t([^\0]+)\0?$/i.exec(result.stdout);
  if (!match || match[4] !== path) return null;
  return Object.freeze({ mode: match[1], type: match[2], oid: match[3].toLowerCase() });
}

function remoteOid(root, remote, branch) {
  const result = gitResult(root, ["ls-remote", "--exit-code", remote, `refs/heads/${branch}`]);
  if (!result.ok) {
    const exit = Number.isInteger(result.status) ? result.status : "unknown";
    throw new Error(`git ls-remote failed (exit ${exit}): ${result.stderr || "no error output"}`);
  }
  const value = result.stdout.split(/\s+/)[0]?.toLowerCase();
  if (!/^[a-f0-9]{40}$/.test(value ?? "")) throw new Error("git ls-remote returned an invalid commit OID");
  return value;
}

function branchOid(root, branch) {
  const result = gitResult(root, ["rev-parse", "--verify", `refs/heads/${branch}`]);
  return result.ok && /^[a-f0-9]{40}$/i.test(result.stdout) ? result.stdout.toLowerCase() : null;
}

function exactDirectoryRenames(raw, source, archive) {
  const fields = raw.split("\0").filter(Boolean);
  if (fields.length === 0 || fields.length % 3 !== 0) return false;
  for (let index = 0; index < fields.length; index += 3) {
    const [status, from, to] = fields.slice(index, index + 3);
    if (status !== "R100" || !from.startsWith(`${source}/`) || to !== `${archive}/${from.slice(source.length + 1)}`) return false;
  }
  return true;
}

function archiveFacts(root, ref, delivery) {
  if (!ref) return { commit: null, tree_preserved: false, only_renames: false };
  const log = gitResult(root, ["log", "-1", "--format=%H", ref, "--", delivery.spec_archive_path]);
  const commit = log.ok && /^[a-f0-9]{40}$/i.test(log.stdout) ? log.stdout.toLowerCase() : null;
  if (!commit) return { commit: null, tree_preserved: false, only_renames: false };
  const parent = gitResult(root, ["rev-parse", `${commit}^`]);
  const source = treeEntry(root, delivery.task_commit, delivery.spec_source_path);
  const archive = treeEntry(root, commit, delivery.spec_archive_path);
  const treePreserved = parent.ok && parent.stdout.toLowerCase() === delivery.task_commit && source?.type === "tree" && archive?.type === "tree" && source.oid === archive.oid;
  const diff = gitResult(root, ["diff-tree", "--no-commit-id", "--name-status", "--find-renames=100%", "-r", "-z", `${commit}^`, commit]);
  return { commit, tree_preserved: treePreserved, only_renames: treePreserved && diff.ok && exactDirectoryRenames(diff.stdout, delivery.spec_source_path, delivery.spec_archive_path) };
}

function targetPreflight(delivery, expectedLocal = delivery.target_baseline) {
  const root = delivery.target_repo_root;
  if (gitResult(root, ["symbolic-ref", "--quiet", "--short", "HEAD"]).stdout !== delivery.target_branch) throw new Error("target branch must be checked out in the target repository");
  if (git(root, ["status", "--porcelain", "--untracked-files=all"]) !== "") throw new Error("target repository must be clean");
  if (gitResult(root, ["rev-parse", "--verify", "MERGE_HEAD"]).ok) throw new Error("target repository has an unfinished merge");
  if (branchOid(root, delivery.target_branch) !== expectedLocal) throw new Error("local target baseline changed");
  if (remoteOid(root, delivery.remote, delivery.target_branch) !== delivery.remote_target_baseline) throw new Error("remote target baseline changed");
}

function plannedMergePreflight(delivery) {
  const tip = branchOid(delivery.target_repo_root, delivery.task_branch);
  if (!tip) throw new Error("task branch does not exist before merge");
  const result = gitResult(delivery.target_repo_root, ["merge-tree", "--write-tree", delivery.target_baseline, tip]);
  if (result.ok) return Object.freeze({ target_baseline: delivery.target_baseline, task_tip: tip, conflict: false });
  if (result.status === 1) throw new Error("planned merge has conflicts; run skills/resolving-merge-conflicts on the task branch, then retry close");
  throw new Error(`planned merge preflight failed: ${result.stderr || result.stdout || "git merge-tree failed"}`);
}

function effectiveAcceptedWorkspaceBinding(task, kernel) {
  const accepted = kernel.readAccepted("make-decision");
  return Object.freeze({
    taskId: accepted.accepted.task_id,
    stage: accepted.accepted.stage,
    worktreeRoot: accepted.facts.worktree_root,
    baselineCommit: accepted.facts.baseline_commit,
  });
}

function validateDeliveryPlan(plan, task, kernel) {
  validatePlan(plan, task);
  if (kernel.task !== task) throw new Error("delivery close TaskHandle/TaskKernel mismatch");
  const delivery = plain(plan.delivery, "delivery close plan");
  const required = ["target_repo_root", "worktree_root", "task_branch", "target_branch", "remote", "task_commit", "spec_source_path", "spec_archive_path", "target_baseline", "remote_target_baseline", "merge_strategy"];
  if (required.some((key) => typeof delivery[key] !== "string" || delivery[key] === "")) throw new TypeError("delivery close plan is missing required fields");
  if (resolve(delivery.target_repo_root) !== task.manifest.target_repo_root) throw new Error("delivery close target repository mismatch");
  const effective = effectiveAcceptedWorkspaceBinding(task, kernel);
  if (resolve(delivery.worktree_root) !== resolve(effective.worktreeRoot)) throw new Error("delivery close worktree does not match the authenticated effective Workspace");
  oid(delivery.task_commit, "delivery task_commit");
  oid(delivery.target_baseline, "delivery target_baseline");
  oid(delivery.remote_target_baseline, "delivery remote_target_baseline");
  if (delivery.merge_strategy !== "--no-ff --no-edit") throw new Error("delivery merge strategy must be --no-ff --no-edit");
  repositoryPath(delivery.spec_source_path, "delivery spec_source_path");
  repositoryPath(delivery.spec_archive_path, "delivery spec_archive_path");
  if (delivery.spec_source_path === delivery.spec_archive_path) throw new Error("delivery spec source and archive paths must differ");
  for (const branch of [delivery.task_branch, delivery.target_branch]) {
    if (!gitResult(delivery.target_repo_root, ["check-ref-format", "--branch", branch]).ok) throw new TypeError(`invalid Git branch: ${branch}`);
  }
  if (delivery.task_branch === delivery.target_branch) throw new Error("task branch and target branch must differ");
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(delivery.remote)) throw new TypeError("delivery remote must be an explicit remote name");
  return delivery;
}

function closeConfirmation(task, planHash, ref) {
  const prefix = `operations/close/confirmations/${planHash}/`;
  if (typeof ref !== "string" || !ref.startsWith(prefix) || !/^operations\/close\/confirmations\/[a-f0-9]{64}\/[a-f0-9-]{36}\.json$/.test(ref)) {
    throw new TypeError("canonical plan-bound closeConfirmationRef is required");
  }
  const confirmation = plain(JSON.parse(task.readRecord(ref)), "close confirmation");
  const keys = new Set(["schema_version", "task_id", "plan_hash", "outcome", "confirmed_at"]);
  if (Object.keys(confirmation).some((key) => !keys.has(key))) throw new Error("close confirmation contains unknown fields");
  if (confirmation.schema_version !== "task-close-confirmation.v1" || confirmation.task_id !== task.identity.taskId || !Number.isFinite(Date.parse(confirmation.confirmed_at))) throw new Error("close confirmation identity is invalid");
  if (!HASH.test(confirmation.plan_hash ?? "") || confirmation.plan_hash !== planHash) throw new Error("close confirmation plan hash mismatch");
  return confirmation;
}

const DELIVERY_STEPS = Object.freeze([
  ["commit-delivery", "commit-delivery"],
  ["archive-spec", "archive-spec"],
  ["merge-task-branch", "merge-task-branch"],
  ["push-target-branch", "push-target-branch"],
  ["remove-task-worktree", "remove-task-worktree"],
  ["remove-task-branch", "remove-task-branch"],
]);

/** Freeze the concrete close actions before asking for their independent authorization. */
export function prepareDeliveryClosePlan({ task: taskHandle, kernel: taskKernel, delivery: requested } = {}) {
  const task = assertTaskHandle(taskHandle);
  const kernel = assertTaskKernel(taskKernel);
  if (kernel.task !== task) throw new Error("delivery close TaskHandle/TaskKernel mismatch");
  const accepted = kernel.readAccepted("make-decision");
  const acceptedVerify = kernel.readAccepted("verify-code");
  const input = plain(requested, "delivery close input");
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(input.remote ?? "")) throw new TypeError("delivery remote must be an explicit remote name");
  const root = task.manifest.target_repo_root;
  if (git(root, ["rev-parse", "--show-toplevel"]) !== root) throw new Error("task target repository must be the Git toplevel");
  const workspace = openAcceptedWorkspace(task, accepted);
  const worktree = resolve(workspace.worktreeRoot);
  if (!existsSync(worktree)) throw new Error("accepted task worktree does not exist");
  const verifyFreshness = verifyFactsFreshForClose(acceptedVerify, worktree);
  if (!verifyFreshness.current) throw new Error(`delivery close requires fresh verify-code facts: current Workspace does not match accepted verify-code snapshot (${verifyFreshness.reason})`);
  if (git(worktree, ["symbolic-ref", "--quiet", "--short", "HEAD"]) !== input.task_branch) throw new Error("task branch does not match the accepted Workspace");
  const common = (cwd) => resolve(cwd, git(cwd, ["rev-parse", "--git-common-dir"]));
  if (common(root) !== common(worktree)) throw new Error("task worktree is not registered in the target repository");
  const taskCommit = oid(input.task_commit, "delivery task_commit");
  if (taskCommit !== oid(acceptedVerify.facts.tests.snapshot_commit, "accepted verify-code snapshot_commit")) {
    throw new Error("delivery task_commit does not match the accepted verify-code snapshot");
  }
  const branchTip = gitResult(root, ["rev-parse", "--verify", `refs/heads/${input.task_branch}`]);
  if (!branchTip.ok) throw new Error("task branch does not exist");
  const tip = branchTip.stdout.toLowerCase();
  if (tip === taskCommit) {
    if (git(worktree, ["status", "--porcelain"]) !== "") throw new Error("published task commit requires a clean task worktree");
  } else {
    const parent = gitResult(root, ["rev-parse", `${taskCommit}^`]);
    const taskTree = gitResult(root, ["rev-parse", `${taskCommit}^{tree}`]);
    if (!parent.ok || parent.stdout.toLowerCase() !== tip) throw new Error("task snapshot commit must have the current task branch tip as its parent");
    if (!taskTree.ok) throw new Error("task snapshot commit does not exist");
    const snapshot = captureGitWorktreeSnapshot(worktree);
    if (snapshot.head.toLowerCase() !== tip || snapshot.tree.toLowerCase() !== taskTree.stdout.toLowerCase()) {
      throw new Error("task worktree does not match the verified task snapshot commit");
    }
  }
  const targetBaseline = branchOid(root, input.target_branch);
  if (!targetBaseline) throw new Error("target branch does not exist");
  const remoteTargetBaseline = remoteOid(root, input.remote, input.target_branch);
  if (!remoteTargetBaseline || remoteTargetBaseline !== targetBaseline) throw new Error("local and remote target baselines must match");
  const plan = {
    schema_version: "task-close-plan.v1",
    task_id: task.identity.taskId,
    delivery: {
      target_repo_root: root,
      worktree_root: worktree,
      task_branch: input.task_branch,
      target_branch: input.target_branch,
      remote: input.remote,
      task_commit: taskCommit,
      spec_source_path: repositoryPath(input.spec_source_path, "delivery spec_source_path"),
      spec_archive_path: repositoryPath(input.spec_archive_path, "delivery spec_archive_path"),
      target_baseline: targetBaseline,
      remote_target_baseline: remoteTargetBaseline,
      merge_strategy: "--no-ff --no-edit",
    },
    steps: DELIVERY_STEPS.map(([step_id, operation]) => ({ step_id, operation })),
  };
  const delivery = validateDeliveryPlan(plan, task, kernel);
  targetPreflight(delivery);
  if (!gitResult(root, ["cat-file", "-e", `${delivery.task_commit}^{commit}`]).ok) throw new Error("task commit does not exist");
  if (treeEntry(root, delivery.task_commit, delivery.spec_source_path)?.type !== "tree") throw new Error("accepted spec source must be a directory in the task commit");
  if (gitResult(root, ["cat-file", "-e", `${delivery.task_commit}:${delivery.spec_archive_path}`]).ok) throw new Error("spec is already archived in the task commit");
  const planHash = closePlanHash(plan);
  createOrVerify(task, `operations/close/plans/${planHash}/plan.json`, {
    schema_version: "task-close-plan-record.v1",
    task_id: task.identity.taskId,
    plan_hash: planHash,
    plan: structuredClone(plan),
  }, "close plan");
  return Object.freeze({ plan: Object.freeze(plan), plan_hash: planHash });
}

/** Read final delivery facts without performing fetch or any other Git write. */
export function inspectDeliveryCloseState({ task: taskHandle, kernel: taskKernel, plan } = {}) {
  const task = assertTaskHandle(taskHandle);
  const kernel = assertTaskKernel(taskKernel);
  const delivery = validateDeliveryPlan(plan, task, kernel);
  const root = delivery.target_repo_root;
  const acceptedVerify = kernel.readAccepted("verify-code");
  const verifyFreshness = verifyFactsFreshForClose(acceptedVerify, delivery.worktree_root);
  const localTarget = gitResult(root, ["rev-parse", "--verify", `refs/heads/${delivery.target_branch}`]);
  const commitExists = gitResult(root, ["cat-file", "-e", `${delivery.task_commit}^{commit}`]).ok;
  const merged = localTarget.ok && commitExists && gitResult(root, ["merge-base", "--is-ancestor", delivery.task_commit, localTarget.stdout]).ok;
  const archivePathExists = localTarget.ok && gitResult(root, ["cat-file", "-e", `${delivery.target_branch}:${delivery.spec_archive_path}`]).ok;
  const sourcePathAbsent = localTarget.ok && !gitResult(root, ["cat-file", "-e", `${delivery.target_branch}:${delivery.spec_source_path}`]).ok;
  const archive = archiveFacts(root, localTarget.ok ? delivery.target_branch : null, delivery);
  const archiveCommitIncluded = archive.commit !== null && gitResult(root, ["merge-base", "--is-ancestor", archive.commit, localTarget.stdout]).ok;
  const remoteTarget = remoteOid(root, delivery.remote, delivery.target_branch);
  const pushed = merged && localTarget.ok && /^[a-f0-9]{40}$/.test(remoteTarget ?? "") && remoteTarget === localTarget.stdout.toLowerCase();
  const listedWorktrees = gitResult(root, ["worktree", "list", "--porcelain"]).stdout.split("\n").filter((line) => line.startsWith("worktree ")).map((line) => resolve(line.slice(9)));
  const worktreeCleanup = !existsSync(delivery.worktree_root) && !listedWorktrees.includes(resolve(delivery.worktree_root));
  const branchCleanup = !gitResult(root, ["show-ref", "--verify", "--quiet", `refs/heads/${delivery.task_branch}`]).ok;
  const facts = {
    delivery_committed: merged,
    archive: archivePathExists && sourcePathAbsent && archiveCommitIncluded && archive.tree_preserved && archive.only_renames,
    archive_commit: archive.commit,
    archive_blob_preserved: archive.tree_preserved,
    archive_only_rename: archive.only_renames,
    merge: merged,
    push: pushed,
    local_target_oid: localTarget.ok ? localTarget.stdout.toLowerCase() : null,
    remote_target_oid: remoteTarget,
    worktree_cleanup: worktreeCleanup,
    branch_cleanup: branchCleanup,
  };
  facts.verify_facts_fresh = verifyFreshness.current;
  if (!verifyFreshness.current) facts.verify_facts_fresh_reason = verifyFreshness.reason;
  const missing = [["delivery", facts.delivery_committed], ["archive", facts.archive], ["merge", facts.merge], ["push", facts.push], ["worktree_cleanup", facts.worktree_cleanup], ["branch_cleanup", facts.branch_cleanup], ["verify_facts_fresh", verifyFreshness.current]].filter(([, done]) => !done).map(([name]) => name);
  return Object.freeze({ schema_version: "task-close-delivery-state.v1", status: missing.length === 0 ? "ready" : "incomplete", missing: Object.freeze(missing), facts: Object.freeze(facts) });
}

/** Write completed only after every plan-bound delivery fact is currently true. */
export async function completeDeliveryClosePlan({ task: taskHandle, kernel: taskKernel, plan, closeConfirmationRef, now = () => new Date().toISOString() } = {}) {
  const task = assertTaskHandle(taskHandle);
  const kernel = assertTaskKernel(taskKernel);
  validateDeliveryPlan(plan, task, kernel);
  const planHash = closePlanHash(plan);
  const prepared = JSON.parse(task.readRecord(`operations/close/plans/${planHash}/plan.json`));
  if (prepared.schema_version !== "task-close-plan-record.v1" || prepared.task_id !== task.identity.taskId || prepared.plan_hash !== planHash || canonical(prepared.plan) !== canonical(plan)) throw new Error("prepared close plan record is invalid");
  const confirmation = closeConfirmation(task, planHash, closeConfirmationRef);
  if (confirmation.outcome !== "confirmed") return Object.freeze({ status: "blocked", confirmationOutcome: confirmation.outcome });
  if (typeof now !== "function") throw new TypeError("close now must be a function");
  return task.withRecordLock("locks/close.execution.lock", async () => {
    const existing = readOptional(task, "operations/close/completed.json");
    if (existing !== undefined) {
      const completed = JSON.parse(existing);
      if (completed.schema_version !== "task-close-completed.v1" || completed.task_id !== task.identity.taskId || completed.plan_hash !== planHash || completed.status !== "completed") throw new Error("task close completed by a conflicting or invalid plan");
      return Object.freeze(completed);
    }
    const state = inspectDeliveryCloseState({ task, kernel, plan });
    if (state.status !== "ready") throw new Error(`delivery close is incomplete: ${state.missing.join(", ")}`);
    const completion = { schema_version: "task-close-completed.v1", task_id: task.identity.taskId, plan_hash: planHash, status: "completed", physical_state: structuredClone(state.facts), completed_at: now() };
    createOrVerify(task, "operations/close/completed.json", completion, "close completion");
    return Object.freeze(completion);
  });
}

/** Mint the only supported close executors from a verified repository root. */
export function createGovernedCloseExecutorRegistry({ task, kernel } = {}) {
  const safeTask = assertTaskHandle(task);
  const safeKernel = assertTaskKernel(kernel);
  if (safeKernel.task !== safeTask) throw new Error("close executor TaskHandle/TaskKernel mismatch");
  const root = safeTask.manifest.target_repo_root;
  if (git(root, ["rev-parse", "--show-toplevel"]) !== root) throw new Error("task target repository must be the Git toplevel");
  let removal;
  const registry = {
    executorFor(step) {
      if (step.operation === "verify-checkpoint-ancestry") {
        const { checkpoint_oid: checkpoint, final_oid: final } = step;
        if (!/^[a-f0-9]{40}$/i.test(checkpoint ?? "") || !/^[a-f0-9]{40}$/i.test(final ?? "")) throw new TypeError("checkpoint ancestry step requires commit OIDs");
        const observe = () => {
          let satisfied = false;
          try { execFileSync("git", ["merge-base", "--is-ancestor", checkpoint, final], { cwd: root, stdio: "ignore" }); satisfied = true; } catch {}
          return { satisfied, checkpoint_oid: checkpoint, final_oid: final };
        };
        return { probe: observe, execute: async () => { if (!observe().satisfied) throw new Error("checkpoint is not an ancestor of final commit"); }, verify: async (value) => value.satisfied && value.checkpoint_oid === checkpoint && value.final_oid === final };
      }
      if (step.operation === "remove-worktree") {
        if (Object.prototype.hasOwnProperty.call(step, "worktree_root")) throw new TypeError("remove-worktree path is selected only by the current accepted Workspace");
        removal ??= createTaskWorktreeRemoval(safeTask, effectiveAcceptedWorkspaceBinding(safeTask, safeKernel));
        return removal;
      }
      throw new Error(`unsupported governed close operation: ${step.operation}`);
    },
  };
  GOVERNED_EXECUTORS.add(registry);
  return Object.freeze(registry);
}

/** Mint the fixed six delivery executors for one prepared delivery plan. */
export function createDeliveryCloseExecutorRegistry({ task: taskHandle, kernel: taskKernel, plan } = {}) {
  const task = assertTaskHandle(taskHandle);
  const kernel = assertTaskKernel(taskKernel);
  const delivery = validateDeliveryPlan(plan, task, kernel);
  if (plan.steps.length !== DELIVERY_STEPS.length || plan.steps.some((step, index) => step.step_id !== DELIVERY_STEPS[index][0] || step.operation !== DELIVERY_STEPS[index][1])) {
    throw new Error("delivery close plan must contain exactly the fixed six steps");
  }
  const root = delivery.target_repo_root;
  const worktree = delivery.worktree_root;
  const contains = (ancestor, descendant) => Boolean(descendant) && gitResult(root, ["merge-base", "--is-ancestor", ancestor, descendant]).ok;
  const findArchive = () => {
    const taskTip = branchOid(root, delivery.task_branch);
    const targetTip = branchOid(root, delivery.target_branch);
    const ref = taskTip && contains(delivery.task_commit, taskTip) ? delivery.task_branch : targetTip && contains(delivery.task_commit, targetTip) ? delivery.target_branch : null;
    return archiveFacts(root, ref, delivery);
  };
  const published = () => {
    const taskTip = branchOid(root, delivery.task_branch);
    const targetTip = branchOid(root, delivery.target_branch);
    const referenced = contains(delivery.task_commit, taskTip) || contains(delivery.task_commit, targetTip);
    const staged = existsSync(worktree) ? gitResult(worktree, ["diff", "--cached", "--name-status", "--find-renames=100%", "-z"]).stdout : "";
    const advanced = !existsSync(worktree) || (contains(delivery.task_commit, git(worktree, ["rev-parse", "HEAD"])) && (git(worktree, ["status", "--porcelain", "--untracked-files=all"]) === "" || exactDirectoryRenames(staged, delivery.spec_source_path, delivery.spec_archive_path)));
    return { satisfied: referenced && advanced, task_commit: delivery.task_commit };
  };
  const archived = () => {
    const value = findArchive();
    return { satisfied: value.commit !== null && value.tree_preserved && value.only_renames, archive_commit: value.commit, tree_oid: treeEntry(root, delivery.task_commit, delivery.spec_source_path)?.oid ?? null };
  };
  const mergeState = () => {
    const archive = findArchive();
    const target = branchOid(root, delivery.target_branch);
    const parents = target ? gitResult(root, ["rev-list", "--parents", "-n", "1", target]).stdout.split(" ").slice(1) : [];
    const branchTip = branchOid(root, delivery.task_branch);
    // Once close removes the task branch, the immutable second parent of the
    // planned no-ff merge remains the authoritative published task tip.
    const taskTip = branchTip ?? (parents.length === 2 && parents[0] === delivery.target_baseline ? parents[1] : null);
    const taskParents = taskTip ? gitResult(root, ["rev-list", "--parents", "-n", "1", taskTip]).stdout.split(" ").slice(1) : [];
    const taskTipIsArchived = taskTip === archive.commit;
    const taskTipIsResolved = taskParents.length === 2 && taskParents[0] === archive.commit && taskParents[1] === delivery.target_baseline;
    const satisfied = Boolean(archive.commit && taskTip && (taskTipIsArchived || taskTipIsResolved))
      && parents.length === 2 && parents[0] === delivery.target_baseline && parents[1] === taskTip;
    return { satisfied, target_oid: target, task_tip: taskTip, archive_commit: archive.commit, resolved: taskTipIsResolved };
  };
  let removal;
  const registry = {
    executorFor(step) {
      if (step.operation === "commit-delivery") return {
        probe: published,
        execute: async () => {
          targetPreflight(delivery);
          const tip = branchOid(root, delivery.task_branch);
          if (tip !== delivery.task_commit) {
            const parent = gitResult(root, ["rev-parse", `${delivery.task_commit}^`]).stdout.toLowerCase();
            if (tip !== parent) throw new Error("task branch changed before publishing verified snapshot");
            git(root, ["update-ref", `refs/heads/${delivery.task_branch}`, delivery.task_commit, parent]);
          }
          const snapshot = captureGitWorktreeSnapshot(worktree);
          if (snapshot.tree.toLowerCase() !== git(root, ["rev-parse", `${delivery.task_commit}^{tree}`]).toLowerCase()) throw new Error("task worktree bytes changed before snapshot publish");
          git(worktree, ["reset", "--mixed", delivery.task_commit]);
          if (git(worktree, ["status", "--porcelain", "--untracked-files=all"]) !== "") throw new Error("published task worktree is not clean");
        },
        verify: async (value) => value.satisfied && value.task_commit === delivery.task_commit,
      };
      if (step.operation === "archive-spec") return {
        probe: archived,
        execute: async () => {
          targetPreflight(delivery);
          if (!published().satisfied) throw new Error("verified snapshot is not published");
          const staged = gitResult(worktree, ["diff", "--cached", "--name-status", "--find-renames=100%", "-z"]).stdout;
          if (existsSync(join(worktree, delivery.spec_source_path))) {
            if (git(worktree, ["status", "--porcelain", "--untracked-files=all"]) !== "") throw new Error("task worktree changed before spec archive");
            createArchiveParent(worktree, delivery.spec_archive_path);
            git(worktree, ["mv", "--", delivery.spec_source_path, delivery.spec_archive_path]);
          } else if (!existsSync(join(worktree, delivery.spec_archive_path)) || !exactDirectoryRenames(staged, delivery.spec_source_path, delivery.spec_archive_path)) {
            throw new Error("partial spec archive does not match the planned directory move");
          }
          if (!gitResult(worktree, ["diff", "--quiet"]).ok) throw new Error("spec archive contains unstaged changes");
          const moves = gitResult(worktree, ["diff", "--cached", "--name-status", "--find-renames=100%", "-z"]).stdout;
          if (!exactDirectoryRenames(moves, delivery.spec_source_path, delivery.spec_archive_path)) throw new Error("spec archive is not an exact directory move");
          git(worktree, ["commit", "-m", `archive ${delivery.spec_source_path}`]);
        },
        verify: async (value) => value.satisfied && value.tree_oid === treeEntry(root, delivery.task_commit, delivery.spec_source_path)?.oid,
      };
      if (step.operation === "merge-task-branch") return {
        probe: mergeState,
        execute: async () => {
          targetPreflight(delivery);
          if (!archived().satisfied) throw new Error("spec archive is incomplete");
          plannedMergePreflight(delivery);
          targetPreflight(delivery);
          try {
            git(root, ["merge", "--no-ff", "--no-edit", delivery.task_branch]);
          } catch (error) {
            if (gitResult(root, ["rev-parse", "--verify", "MERGE_HEAD"]).ok) gitResult(root, ["merge", "--abort"]);
            throw new Error(`merge-task-branch failed; target merge was aborted: ${error.message}`);
          }
        },
        verify: async (value) => value.satisfied && value.archive_commit !== null,
      };
      if (step.operation === "push-target-branch") return {
        probe: () => { const merged = mergeState(); const remote = remoteOid(root, delivery.remote, delivery.target_branch); return { satisfied: merged.satisfied && remote === merged.target_oid, target_oid: merged.target_oid, remote_oid: remote }; },
        execute: async () => {
          const merged = mergeState();
          if (!merged.satisfied) throw new Error("target branch is not the planned no-ff merge");
          if (remoteOid(root, delivery.remote, delivery.target_branch) !== delivery.remote_target_baseline) throw new Error("remote target baseline changed before push");
          git(root, ["push", delivery.remote, `refs/heads/${delivery.target_branch}:refs/heads/${delivery.target_branch}`]);
        },
        verify: async (value) => value.satisfied && value.target_oid === value.remote_oid,
      };
      if (step.operation === "remove-task-worktree") {
        const effective = effectiveAcceptedWorkspaceBinding(task, kernel);
        removal ??= createTaskWorktreeRemoval(task, {
          ...effective,
          worktreeRoot: delivery.worktree_root,
        });
        return removal;
      }
      if (step.operation === "remove-task-branch") return {
        probe: () => ({ satisfied: branchOid(root, delivery.task_branch) === null, task_branch: delivery.task_branch }),
        execute: async () => {
          if (existsSync(worktree)) throw new Error("task worktree must be removed before branch cleanup");
          const target = branchOid(root, delivery.target_branch);
          const tip = branchOid(root, delivery.task_branch);
          if (!tip || !contains(tip, target)) throw new Error("task branch is not merged into target");
          git(root, ["branch", "-d", "--", delivery.task_branch]);
        },
        verify: async (value) => value.satisfied && value.task_branch === delivery.task_branch,
      };
      throw new Error(`unsupported delivery close operation: ${step.operation}`);
    },
  };
  GOVERNED_EXECUTORS.add(registry);
  return Object.freeze(registry);
}

/**
 * Execute a confirmed immutable close plan.
 *
 * `executors` is keyed by plan step_id. Each executor probes physical state,
 * performs the operation only when needed, then probes/verifies again. Durable
 * task records are create-only; after a crash, physical state is authoritative.
 */
export async function executeClosePlan(options = {}) {
  const task = assertTaskHandle(options.task);
  const kernel = assertTaskKernel(options.kernel);
  if (kernel.task !== task) throw new Error("close TaskHandle/TaskKernel mismatch");
  const plan = validatePlan(options.plan, task);
  const planRaw = canonical(plan);
  const planHash = sha256(planRaw);
  const confirmationRef = options.closeConfirmationRef;
  const confirmationPrefix = `operations/close/confirmations/${planHash}/`;
  if (typeof confirmationRef !== "string" || !confirmationRef.startsWith(confirmationPrefix) || !/^operations\/close\/confirmations\/[a-f0-9]{64}\/[a-f0-9-]{36}\.json$/.test(confirmationRef)) {
    throw new TypeError("canonical plan-bound closeConfirmationRef is required");
  }
  const confirmation = plain(JSON.parse(task.readRecord(confirmationRef)), "close confirmation");
  const confirmationKeys = new Set(["schema_version", "task_id", "plan_hash", "outcome", "confirmed_at"]);
  if (Object.keys(confirmation).some((key) => !confirmationKeys.has(key))) throw new Error("close confirmation contains unknown fields");
  if (confirmation.schema_version !== "task-close-confirmation.v1" || confirmation.task_id !== task.identity.taskId || !Number.isFinite(Date.parse(confirmation.confirmed_at))) {
    throw new Error("close confirmation identity is invalid");
  }
  if (!HASH.test(confirmation.plan_hash ?? "") || confirmation.plan_hash !== planHash) {
    throw new Error("close confirmation plan hash mismatch");
  }
  if (confirmation.outcome !== "confirmed") return Object.freeze({ status: "blocked", confirmationOutcome: confirmation.outcome });
  const executors = options.executors;
  // Validate every executable boundary before creating a record or performing a
  // physical probe. A malformed later step must have zero side effects.
  for (const step of plan.steps) executorFor(executors, step);
  const now = options.now ?? (() => new Date().toISOString());
  if (typeof now !== "function") throw new TypeError("close now must be a function");

  return task.withRecordLock("locks/close.execution.lock", async () => {
    const base = `operations/close/plans/${planHash}`;
    createOrVerify(task, `${base}/plan.json`, {
      schema_version: "task-close-plan-record.v1",
      task_id: task.identity.taskId,
      plan_hash: planHash,
      plan: structuredClone(plan),
    }, "close plan");
    createOrVerify(task, `${base}/confirmation.json`, {
      schema_version: "task-close-confirmation.v1",
      task_id: task.identity.taskId,
      plan_hash: planHash,
      confirmation_ref: confirmationRef,
      outcome: "confirmed",
    }, "close confirmation");

    const existingCompletion = readOptional(task, "operations/close/completed.json");
    let acceptedCompletion;
    if (existingCompletion !== undefined) {
      const completed = JSON.parse(existingCompletion);
      if (completed.plan_hash !== planHash || completed.task_id !== task.identity.taskId) throw new Error("task close completed by a conflicting plan");
      if (completed.schema_version !== "task-close-completed.v1" || completed.status !== "completed") throw new Error("task close completed record is invalid");
      acceptedCompletion = completed;
    }

    for (const step of plan.steps) {
      const executor = executorFor(executors, step);
      const recordPath = `${base}/steps/${step.step_id}.json`;
      const priorRaw = readOptional(task, recordPath);
      const before = await probeSatisfied(executor, step, priorRaw === undefined ? "initial" : "reconcile");
      if (priorRaw !== undefined) {
        const prior = JSON.parse(priorRaw);
        if (prior.plan_hash !== planHash || prior.step_id !== step.step_id || prior.status !== "completed") throw new Error(`close step ${step.step_id} record conflicts with plan`);
        if (!before.satisfied) throw new Error(`close step ${step.step_id} completed record conflicts with physical state`);
        continue;
      }
      if (before.satisfied) {
        createOrVerify(task, recordPath, completedRecord(task, planHash, step, before, "reconciled", now), `close step ${step.step_id}`);
        continue;
      }
      await executor.execute(step, before);
      const after = await probeSatisfied(executor, step, "post-execution");
      if (!after.satisfied) throw new Error(`close step ${step.step_id} did not reach its declared physical state`);
      createOrVerify(task, recordPath, completedRecord(task, planHash, step, after, "executed", now), `close step ${step.step_id}`);
    }

    const deliveryState = plan.delivery ? inspectDeliveryCloseState({ task, kernel, plan }) : null;
    if (deliveryState && deliveryState.status !== "ready") throw new Error(`delivery close is incomplete: ${deliveryState.missing.join(", ")}`);
    if (acceptedCompletion) return Object.freeze(acceptedCompletion);
    const completion = {
      schema_version: "task-close-completed.v1",
      task_id: task.identity.taskId,
      plan_hash: planHash,
      status: "completed",
      ...(deliveryState ? { physical_state: structuredClone(deliveryState.facts) } : {}),
      completed_at: now(),
    };
    createOrVerify(task, "operations/close/completed.json", completion, "close completion");
    return Object.freeze(completion);
  });
}

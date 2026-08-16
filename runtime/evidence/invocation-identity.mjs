import { createHash, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { canonical } from "./canonical-utils.mjs";
import { assertTaskHandle } from "../../runtime/task/task-handle.mjs";
import { inspectRunnerIdentity } from "./runner-identity.mjs";
import { captureGitWorktreeSnapshot } from "../task/git-worktree-snapshot.mjs";

const FORBIDDEN = new Set(["identity", "runner_root", "runnerRoot", "root", "path", "task_path", "taskPath"]);
const OFFICIAL_INVOCATION = Symbol("workflowhub.official-invocation");

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function fileHash(root, relativePath) {
  return sha256(readFileSync(resolve(root, relativePath)));
}

/**
 * Authenticate one official invocation. The caller supplies only the live
 * executable location, stage and optional opaque run id; identity facts are
 * calculated from the executable release itself and written create-only.
 */
export function inspectOfficialInvocation(taskHandle, options = {}) {
  const task = assertTaskHandle(taskHandle);
  const unexpected = Object.keys(options).find((key) => !new Set(["runnerRoot", "stage", "runId", "sourceKind"]).has(key));
  if (unexpected || Object.keys(options).some((key) => FORBIDDEN.has(key) && key !== "runnerRoot")) {
    throw new TypeError(`caller-supplied invocation identity/root/path is forbidden: ${unexpected ?? "identity"}`);
  }
  const sourceKind = options.sourceKind ?? "git_invocation";
  if (sourceKind === "release_manifest") throw new Error("release_manifest invocation source is unsupported");
  if (sourceKind !== "git_invocation") throw new TypeError("sourceKind must be git_invocation");
  const runId = options.runId ?? randomUUID();
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(runId)) throw new TypeError("runId must be an opaque safe identifier");
  const runner = inspectRunnerIdentity({
    runnerRoot: options.runnerRoot,
    projectName: task.identity.projectName,
    taskId: task.identity.taskId,
    stage: options.stage,
    // A task normally executes from its dirty candidate worktree. Bind the
    // current bytes below instead of treating HEAD cleanliness as a permit.
    requireClean: false,
    bindTask: false,
  });
  const snapshot = captureGitWorktreeSnapshot(runner.runner_root, task.identity.taskId);
  const source = {
    git_oid: runner.runner_oid,
    // This ephemeral tree contains tracked and untracked current files. It is
    // an observed source identity, not a caller-supplied path or clean gate.
    git_tree: snapshot.tree,
    git_branch: runner.runner_branch,
  };
  const contracts = {
    agents: { ref: runner.agents_ref, sha256: fileHash(runner.runner_root, runner.agents_ref) },
    stage_skill: { ref: runner.stage_skill_ref, sha256: fileHash(runner.runner_root, runner.stage_skill_ref) },
    constitution: { ref: "CONSTITUTION.md", sha256: fileHash(runner.runner_root, "CONSTITUTION.md") },
  };
  const capabilities = Object.freeze(["task-handle", "task-kernel", `stage:${options.stage}`]);
  const value = {
    schema_version: "workflowhub-invocation-identity.v1",
    project_name: task.identity.projectName,
    task_id: task.identity.taskId,
    run_id: runId,
    stage: options.stage,
    source_kind: "git_invocation",
    source_clean: !runner.runner_dirty,
    source,
    release: {
      content_id: sha256(canonical({ git_oid: source.git_oid ?? null, git_tree: source.git_tree, contracts })),
    },
    contracts,
    capabilities,
  };
  value.execution_manifest_hash = sha256(canonical(value));
  const raw = `${canonical(value)}\n`;
  const ref = `identity/executions/${runId}.json`;
  const inspected = {
    ref,
    hash: sha256(raw),
    raw,
    identity: Object.freeze(value),
  };
  Object.defineProperty(inspected, OFFICIAL_INVOCATION, { value: true });
  return Object.freeze(inspected);
}

export function isOfficialInvocation(value) {
  return value?.[OFFICIAL_INVOCATION] === true;
}

export function persistOfficialInvocation(taskHandle, inspected) {
  const task = assertTaskHandle(taskHandle);
  if (!inspected || typeof inspected !== "object"
      || !isOfficialInvocation(inspected)
      || typeof inspected.ref !== "string"
      || typeof inspected.raw !== "string"
      || sha256(inspected.raw) !== inspected.hash
      || inspected.identity?.task_id !== task.identity.taskId
      || inspected.identity?.project_name !== task.identity.projectName) {
    throw new TypeError("inspected official invocation is invalid");
  }
  task.createInvocationIdentityRecord(inspected.ref, inspected.raw);
  return Object.freeze({
    ref: inspected.ref,
    hash: inspected.hash,
    identity: inspected.identity,
  });
}

export function authenticateOfficialInvocation(taskHandle, options = {}) {
  const inspected = inspectOfficialInvocation(taskHandle, options);
  return persistOfficialInvocation(taskHandle, inspected);
}

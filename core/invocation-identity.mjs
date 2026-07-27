import { createHash, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { canonical } from "./canonical-utils.mjs";
import { assertTaskHandle, migrateTaskToPerInvocation as migrateTaskManifestToPerInvocation } from "./task-handle.mjs";
import { inspectRunnerIdentity } from "./runner-identity.mjs";

const FORBIDDEN = new Set(["identity", "runner_root", "runnerRoot", "root", "path", "task_path", "taskPath"]);

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
export function authenticateOfficialInvocation(taskHandle, options = {}) {
  const task = assertTaskHandle(taskHandle);
  const unexpected = Object.keys(options).find((key) => !new Set(["runnerRoot", "stage", "runId", "sourceKind"]).has(key));
  if (unexpected || Object.keys(options).some((key) => FORBIDDEN.has(key) && key !== "runnerRoot")) {
    throw new TypeError(`caller-supplied invocation identity/root/path is forbidden: ${unexpected ?? "identity"}`);
  }
  if (task.manifest.execution_mode !== "per_invocation") {
    throw new Error("legacy pinned-runner task is read-only until per-invocation migration");
  }
  const sourceKind = options.sourceKind ?? "git_invocation";
  if (sourceKind === "release_manifest") throw new Error("release_manifest invocation source is unsupported");
  if (!["git_invocation", "git_clean"].includes(sourceKind)) throw new TypeError("sourceKind must be git_invocation");
  const runId = options.runId ?? randomUUID();
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(runId)) throw new TypeError("runId must be an opaque safe identifier");
  let inspected;
  let unavailable;
  try {
    inspected = inspectRunnerIdentity({
      runnerRoot: options.runnerRoot,
      projectName: task.identity.projectName,
      taskId: task.identity.taskId,
      stage: options.stage,
      // Per-invocation runner facts are audit metadata. They must never block
      // stage execution because a runner branch or dirty checkout is not a
      // business-result condition.
      requireClean: false,
      bindTask: false,
    });
  } catch (error) {
    unavailable = error;
  }
  const source = inspected
    ? { git_oid: inspected.runner_oid, git_tree: String(execFileSync("git", ["rev-parse", "--verify", "HEAD^{tree}"], { cwd: inspected.runner_root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] })).trim().toLowerCase(), git_branch: inspected.runner_branch }
    : { status: "unavailable", reason: unavailable?.message ?? "runner identity unavailable" };
  const contracts = inspected ? {
    agents: { ref: inspected.agents_ref, sha256: fileHash(inspected.runner_root, inspected.agents_ref) },
    stage_skill: { ref: inspected.stage_skill_ref, sha256: fileHash(inspected.runner_root, inspected.stage_skill_ref) },
    constitution: { ref: "CONSTITUTION.md", sha256: fileHash(inspected.runner_root, "CONSTITUTION.md") },
  } : {};
  const capabilities = Object.freeze(["task-handle", "task-kernel", `stage:${options.stage}`]);
  const value = {
    schema_version: "workflowhub-invocation-identity.v1",
    project_name: task.identity.projectName,
    task_id: task.identity.taskId,
    run_id: runId,
    stage: options.stage,
    source_kind: inspected ? "git_invocation" : "unavailable",
    source_clean: inspected ? String(execFileSync("git", ["status", "--porcelain", "--untracked-files=all"], { cwd: inspected.runner_root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] })).trim() === "" : false,
    source,
    release: {
      content_id: sha256(canonical({ git_oid: source.git_oid ?? null, contracts })),
    },
    contracts,
    capabilities,
  };
  value.execution_manifest_hash = sha256(canonical(value));
  const raw = `${canonical(value)}\n`;
  const ref = `identity/executions/${runId}.json`;
  task.createInvocationIdentityRecord(ref, raw);
  return Object.freeze({ ref, hash: sha256(raw), identity: Object.freeze(value) });
}

export function migrateTaskToPerInvocation(options) {
  return migrateTaskManifestToPerInvocation(options);
}

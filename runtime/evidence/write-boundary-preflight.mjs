import { realpathSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";

import { assertTaskHandle } from "../../runtime/task/task-handle.mjs";
import { inspectOfficialInvocation, persistOfficialInvocation } from "./invocation-identity.mjs";
import { assertCandidateWorkspace, assertWorkspace } from "../../runtime/task/workspace.mjs";

const STAGES = new Set(["make-decision", "build-spec", "build-plan", "build-code", "verify-code"]);

function bytes(value, label) {
  if (Buffer.isBuffer(value)) return value;
  if (value instanceof Uint8Array) return Buffer.from(value);
  if (typeof value === "string") return Buffer.from(value, "utf8");
  throw new TypeError(`${label} must be bytes or text`);
}

function boundWorkspacePath(workspace) {
  if (workspace === undefined || workspace === null) return null;
  let authenticated;
  try { authenticated = assertWorkspace(workspace); }
  catch { authenticated = assertCandidateWorkspace(workspace); }
  return realpathSync(authenticated.worktreeRoot);
}

/**
 * Read-only structural facts shared by formal write boundaries. The boundary
 * has exactly three inputs: task identity, workspace path, and write bytes.
 * Review quality and source snapshots are outside this check.
 */
export function inspectWriteBoundary({
  task,
  stage,
  operation,
  taskId,
  workspace,
  workspacePath,
  bytesToWrite,
  authenticatedSourceBytes,
  sourceBytes,
} = {}) {
  const handle = assertTaskHandle(task);
  if (!STAGES.has(stage)) throw new TypeError("write boundary stage is invalid");
  if (typeof operation !== "string" || !/^[a-z][a-z0-9._-]*$/.test(operation)) {
    throw new TypeError("write boundary operation is invalid");
  }

  const violations = [];
  const checkedTaskId = taskId ?? handle.identity.taskId;
  if (checkedTaskId !== handle.identity.taskId) violations.push("TASK_ID_MISMATCH");

  let authenticatedPath = null;
  try { authenticatedPath = boundWorkspacePath(workspace); }
  catch { violations.push("WORKSPACE_PATH_INVALID"); }
  const checkedWorkspacePath = workspacePath ?? authenticatedPath;
  if (checkedWorkspacePath !== undefined && checkedWorkspacePath !== null) {
    if (typeof checkedWorkspacePath !== "string" || !isAbsolute(checkedWorkspacePath)) {
      violations.push("WORKSPACE_PATH_INVALID");
    } else {
      try {
        const realPath = realpathSync(resolve(checkedWorkspacePath));
        if (authenticatedPath !== null && realPath !== authenticatedPath) violations.push("WORKSPACE_PATH_MISMATCH");
        if (handle.manifest.workspace_root !== undefined
            && realPath !== realpathSync(handle.manifest.workspace_root)) violations.push("WORKSPACE_PATH_MISMATCH");
        authenticatedPath = realPath;
      } catch {
        violations.push("WORKSPACE_PATH_INVALID");
      }
    }
  }

  const declaredSourceBytes = authenticatedSourceBytes ?? sourceBytes;
  if (bytesToWrite !== undefined && declaredSourceBytes !== undefined
      && !bytes(bytesToWrite, "bytesToWrite").equals(bytes(declaredSourceBytes, "authenticatedSourceBytes"))) {
    throw new Error("write boundary source bytes mismatch");
  }

  return Object.freeze({
    schema_version: "workflowhub-write-boundary-preflight.v1",
    task_id: checkedTaskId,
    stage,
    operation,
    workspace_path: authenticatedPath,
    status: violations.length === 0 ? "valid" : "invalid",
    violations: Object.freeze(violations),
  });
}

export function assertWriteBoundary(input) {
  const result = inspectWriteBoundary(input);
  if (result.status !== "valid") {
    throw new Error(`WRITE_BOUNDARY_PREFLIGHT_FAILED: ${result.violations.join(",")}`);
  }
  return result;
}

/** Authenticate one owner transaction before its canonical write. */
export function authenticateWriteBoundary({
  task,
  stage,
  operation,
  runnerRoot,
  workspace,
  sourceDigest: _sourceDigest,
  runId,
} = {}) {
  const handle = assertTaskHandle(task);
  const inspected = inspectOfficialInvocation(handle, {
    runnerRoot,
    stage,
    ...(runId === undefined ? {} : { runId }),
  });
  const boundary = assertWriteBoundary({
    task: handle,
    stage,
    operation,
    ...(workspace === undefined ? {} : { workspace }),
  });
  persistOfficialInvocation(handle, inspected);
  return Object.freeze({
    ...boundary,
    invocation_ref: inspected.ref,
    invocation_hash: inspected.hash,
  });
}

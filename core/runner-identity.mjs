import { execFileSync } from "node:child_process";
import { accessSync, constants, lstatSync, realpathSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";

import { validateProjectName, validateTaskId } from "./task-identity.mjs";

const STAGES = new Set(["make-decision", "build-spec", "build-plan", "build-code", "verify-code"]);

function regularReadableFile(path, label) {
  const stat = lstatSync(path);
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`${label} must be a regular non-symlink file`);
  if (realpathSync(path) !== path) throw new Error(`${label} must not traverse a symlink`);
  accessSync(path, constants.R_OK);
}

/** Authenticate only an explicitly supplied WorkflowHub runner root. */
export function inspectRunnerIdentity({ runnerRoot, projectName, taskId, stage, requireClean = false } = {}) {
  if (typeof runnerRoot !== "string" || !isAbsolute(runnerRoot)) throw new TypeError("runnerRoot must be an explicit absolute path");
  const requestedRoot = resolve(runnerRoot);
  const rootStat = lstatSync(requestedRoot);
  if (!rootStat.isDirectory() || rootStat.isSymbolicLink()) throw new Error("runnerRoot must be a real directory");
  const root = realpathSync(requestedRoot);
  if (root !== requestedRoot) throw new Error("runnerRoot must be its canonical real path");
  let top;
  try {
    top = realpathSync(String(execFileSync("git", ["rev-parse", "--show-toplevel"], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    })).trim());
  } catch (error) {
    throw new Error(`runnerRoot Git validation failed: ${error.stderr?.toString().trim() || error.message}`);
  }
  if (top !== root) throw new Error("runnerRoot must be a Git toplevel directory");
  const project = validateProjectName(projectName);
  const task = validateTaskId(taskId);
  const expectedBranch = `task/${project}/${task}`;
  let branch;
  try {
    branch = String(execFileSync("git", ["symbolic-ref", "--quiet", "--short", "HEAD"], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    })).trim();
  } catch (error) {
    throw new Error(`runner identity branch validation failed: ${error.stderr?.toString().trim() || error.message}`);
  }
  if (branch !== expectedBranch) throw new Error(`runner identity mismatch: expected branch ${expectedBranch}, actual ${branch}`);
  if (requireClean) {
    let dirty;
    try {
      dirty = String(execFileSync("git", ["status", "--porcelain", "--untracked-files=all"], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] })).trim();
    } catch (error) {
      throw new Error(`runner identity cleanliness validation failed: ${error.stderr?.toString().trim() || error.message}`);
    }
    if (dirty !== "") throw new Error("runnerRoot must be a clean Git worktree");
  }
  let oid;
  try {
    oid = String(execFileSync("git", ["rev-parse", "--verify", "HEAD^{commit}"], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    })).trim().toLowerCase();
  } catch (error) {
    throw new Error(`runner identity HEAD validation failed: ${error.stderr?.toString().trim() || error.message}`);
  }
  if (!/^[a-f0-9]{40}$/.test(oid)) throw new Error("runner identity HEAD must be a full Git commit OID");
  if (!STAGES.has(stage)) throw new TypeError(`unsupported runner stage: ${stage}`);
  const agentsRef = "AGENTS.md";
  const stageSkillRef = `workflows/${stage}/SKILL.md`;
  regularReadableFile(resolve(root, agentsRef), "runner AGENTS.md");
  regularReadableFile(resolve(root, stageSkillRef), `runner ${stage} SKILL.md`);
  return Object.freeze({
    runner_root: root,
    runner_oid: oid,
    runner_branch: branch,
    project,
    task,
    stage,
    agents_ref: agentsRef,
    stage_skill_ref: stageSkillRef,
  });
}

/** Bind a live explicit runner to the immutable identity of one task. */
export function assertTaskRunnerIdentity(taskHandle, { runnerRoot, stage } = {}) {
  const expectedRoot = taskHandle?.manifest?.runner_root;
  const expectedOid = taskHandle?.manifest?.runner_oid;
  if (typeof expectedRoot !== "string" || !/^[a-f0-9]{40}$/.test(expectedOid ?? "")) throw new Error("task runner identity is missing; controlled migration is required");
  const identity = inspectRunnerIdentity({
    runnerRoot,
    projectName: taskHandle.identity.projectName,
    taskId: taskHandle.identity.taskId,
    stage,
  });
  if (identity.runner_root !== expectedRoot || identity.runner_oid !== expectedOid) {
    throw new Error(`runner identity mismatch: expected ${expectedRoot}@${expectedOid}, actual ${identity.runner_root}@${identity.runner_oid}`);
  }
  return identity;
}

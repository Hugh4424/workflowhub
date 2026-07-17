#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { readFileSync, realpathSync } from "node:fs";
import { isAbsolute } from "node:path";
import { pathToFileURL } from "node:url";

import { assertRuntimeAuthority } from "../core/runtime-mode.mjs";
import { assertCanonicalRef, createReleaseAuthority, createTaskWithLauncherAuthority, releaseAuthorityOperations } from "../core/launcher-authority.mjs";
import { resolveRepositoryRef } from "../core/repository-registry.mjs";
import { resolveStorageRoot } from "../core/storage-root.mjs";
import { createTask, createTaskUnderLock } from "../core/task-handle.mjs";

const TASK_MANIFEST_SCHEMA = "https://workflowhub.dev/schemas/task-manifest.v1.schema.json";
const TASK_CREATE_SCHEMA = "https://workflowhub.dev/schemas/task-create-input.v1.schema.json";

export function createPinnedTask(input, { launcherAuthority, repositoryAuthority, releaseAuthority, now = () => new Date().toISOString() } = {}) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new TypeError("task create input must be an object");
  const allowed = new Set(["schema_id", "schema_version", "project_name", "task_id", "source_ref", "target_repository_ref"]);
  const forbidden = ["release_manifest_ref", "release_manifest_hash", "target_repo_root", "target-repo", "cwd", "worktree"];
  const bad = Object.keys(input).find((key) => !allowed.has(key) || forbidden.includes(key));
  if (bad) throw new TypeError(`caller task input field is forbidden: ${bad}`);
  if (input.schema_id !== TASK_CREATE_SCHEMA || input.schema_version !== "1.0.0") throw new TypeError("task create input schema mismatch");
  for (const field of ["project_name", "task_id", "source_ref", "target_repository_ref"]) if (typeof input[field] !== "string" || input[field].length === 0) throw new TypeError(`task create ${field} is required`);
  resolveRepositoryRef(repositoryAuthority, input.target_repository_ref);
  const release = releaseAuthorityOperations(releaseAuthority);

  return createTaskWithLauncherAuthority(launcherAuthority, {
    projectName: input.project_name,
    taskId: input.task_id,
    prepareManifest() {
      const current = release.readCurrent();
      if (!current || typeof current.ref !== "string" || !/^[a-f0-9]{64}$/.test(current.sha256)) throw new Error("current release pointer is invalid");
      assertCanonicalRef(current.ref, "current release manifest ref");
      const diagnosis = release.doctor(current);
      if (!diagnosis?.ok || diagnosis.manifest_ref !== current.ref || diagnosis.manifest_hash !== current.sha256) throw new Error("current release failed exact doctor verification");
      assertCanonicalRef(diagnosis.manifest_ref, "doctor release manifest ref");
      return {
        schema_id: TASK_MANIFEST_SCHEMA,
        schema_version: "1.0.0",
        project_name: input.project_name,
        task_id: input.task_id,
        created_at: now(),
        target_repository_ref: input.target_repository_ref,
        release_manifest_ref: current.ref,
        release_manifest_hash: current.sha256,
      };
    },
  });
}

function args(argv) { const out = {}; for (const item of argv) { const at = item.indexOf("="); if (!item.startsWith("--") || at < 3) throw new TypeError(`invalid argument: ${item}`); out[item.slice(2, at)] = item.slice(at + 1); } return out; }
export function bootstrapTask(values, { env = process.env, home } = {}) {
  if (Object.prototype.hasOwnProperty.call(values, "candidate-worktree") || Object.prototype.hasOwnProperty.call(values, "baseline-commit")) throw new TypeError("--candidate-worktree/--baseline-commit are no longer supported; make-decision owns worktree preparation");
  for (const key of ["project", "task", "target-repo"]) if (typeof values[key] !== "string" || values[key].trim() === "") throw new TypeError(`--${key} is required`);
  const target = realpathSync(values["target-repo"]);
  let targetTop;
  try { targetTop = realpathSync(String(execFileSync("git", ["rev-parse", "--show-toplevel"], { cwd: target, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] })).trim()); }
  catch (error) { throw new Error(`target repository validation failed: ${error.stderr?.toString().trim() || error.message}`); }
  if (targetTop !== target) throw new Error("target repository must be a Git toplevel directory");
  const inputs = values.inputs ? JSON.parse(readFileSync(values.inputs, "utf8")) : {};
  if (!inputs || typeof inputs !== "object" || Array.isArray(inputs) || Object.keys(inputs).some((key) => !["decision", "spec", "build_plan"].includes(key)) || Object.values(inputs).some((ref) => typeof ref !== "string" || !isAbsolute(ref))) throw new TypeError("inputs must contain only absolute decision/spec/build_plan accepted refs");
  const storageRoot = resolveStorageRoot({ env, home });
  const authority = assertRuntimeAuthority(storageRoot, { home, expectedEpoch: values.epoch });
  const task = createTask({ storageRoot, manifest: { schema_version: "1.0.0", project_name: values.project, task_id: values.task, created_at: new Date().toISOString(), target_repo_root: target, issue_ids: values.issues ? values.issues.split(",").filter(Boolean) : [], inputs } });
  return Object.freeze({ task_path: task.taskPath, project: task.identity.projectName, task: task.identity.taskId, storage_root: authority.storage_root, cutover_epoch: authority.cutover_epoch });
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.stderr.write("task-bootstrap.mjs is an internal handler; use the workflowhub public CLI\n");
  process.exitCode = 2;
}

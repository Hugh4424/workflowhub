import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, isAbsolute, resolve } from "node:path";
import yaml from "js-yaml";
import { deriveTaskPath, validateProjectName, validateTaskId } from "../runtime/task/task-identity.mjs";
import { resolveStorageRootDetails } from "../runtime/evidence/storage-root.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const DEFAULT_CONFIG_PATH = resolve(here, "..", "config", "workflowhub.yaml");

// Allowed top-level keys in static config (FR-CFG-003).
const ALLOWED_KEYS = new Set([
  "registry",
  "external_deps",
  "metrics_path",
  "cli_map",
  "path_guard",
  "task_dir",
]);

/**
 * Load and validate a workflow hub YAML config file.
 * @param {string} path - Absolute path to YAML config file.
 * @returns {object} Parsed config object.
 * @throws {Error} On missing registry, wrong placeholder shapes, or runtime-state fields.
 */
export function loadConfig(path = DEFAULT_CONFIG_PATH) {
  const raw = readFileSync(path, "utf8");
  const config = yaml.load(raw);

  // FR-CFG-001: registry is required.
  if (!config || !Object.prototype.hasOwnProperty.call(config, "registry")) {
    throw new Error("Invalid config: registry (组件清单) is required");
  }

  // FR-CFG-003: reject any key not in the allowed static whitelist.
  for (const key of Object.keys(config)) {
    if (!ALLOWED_KEYS.has(key)) {
      throw new Error(
        `Invalid config: key "${key}" is a runtime/current/active state field — only static keys are allowed`
      );
    }
  }

  // FR-CFG-002: shape-only validation for the 4 placeholder keys.
  if (Object.prototype.hasOwnProperty.call(config, "external_deps")) {
    if (!Array.isArray(config.external_deps)) {
      throw new Error(
        "Invalid config: external_deps must be a list (array) — wrong shape"
      );
    }
  }
  if (Object.prototype.hasOwnProperty.call(config, "path_guard")) {
    if (!Array.isArray(config.path_guard)) {
      throw new Error(
        "Invalid config: path_guard must be a list (array) — wrong shape"
      );
    }
  }
  if (Object.prototype.hasOwnProperty.call(config, "metrics_path")) {
    if (typeof config.metrics_path !== "string") {
      throw new Error(
        "Invalid config: metrics_path must be a string — wrong shape"
      );
    }
  }
  if (Object.prototype.hasOwnProperty.call(config, "cli_map")) {
    if (
      typeof config.cli_map !== "object" ||
      config.cli_map === null ||
      Array.isArray(config.cli_map)
    ) {
      throw new Error(
        "Invalid config: cli_map must be a map (object) — wrong shape"
      );
    }
  }

  return config;
}

/**
 * Resolve a task leaf from one canonical project/task identity. An explicit
 * task path is a diagnostic override and is returned with its source so a
 * caller cannot mistake it for the canonical resolver result.
 */
export function resolveCanonicalTaskPath({ project, task, taskPath, env = process.env, home } = {}) {
  const projectName = validateProjectName(project);
  const taskId = validateTaskId(task);
  if (taskPath !== undefined) {
    if (typeof taskPath !== "string" || taskPath.trim() === "" || !isAbsolute(taskPath)) {
      throw new TypeError("taskPath diagnostic override must be a non-empty absolute path");
    }
    return Object.freeze({
      project: projectName,
      task: taskId,
      taskPath: resolve(taskPath),
      source: "diagnostic_override",
    });
  }
  const storage = resolveStorageRootDetails({ env, home });
  return Object.freeze({
    project: projectName,
    task: taskId,
    taskPath: deriveTaskPath(storage.storage_root, projectName, taskId),
    source: "canonical_resolver",
    storage_root: storage.storage_root,
  });
}

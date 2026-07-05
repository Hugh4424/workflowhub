/**
 * task-dir-parser.mjs — FR-TASKDIR-001 / FR-WORKTREE-ENVVAR-003
 *
 * Reads task_tracking_root via priority order:
 *   1. WORKFLOWHUB_TASK_DIR env var (if set and non-empty)
 *   2. config/workflowhub.yaml `task_dir` field (yaml fallback)
 *   3. Both absent → fail-loud (non-zero exit, explicit error message)
 *
 * yaml `task_dir` trailing `/tasks` or `/tasks/` suffix is trimmed (at most once)
 * to return the pure task_tracking_root, preventing `/tasks/tasks/{id}` double-join.
 * WORKFLOWHUB_TASK_DIR value is NOT trimmed (caller must supply correct root).
 *
 * Path validation: returned path must exist and be a directory; otherwise fail-loud.
 * No third-party dependencies (FR-TASKDIR-001).
 *
 * AC-16 consumable call (grep anchor: parseTaskDir):
 *   import { parseTaskDir } from "./core/task-dir-parser.mjs";
 *   const taskTrackingRoot = parseTaskDir();
 *
 * @module task-dir-parser
 */

import { readFileSync, existsSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { homedir } from "node:os";

/**
 * Yaml fallback resolves config/workflowhub.yaml relative to process.cwd().
 * Callers relying on yaml fallback (not WORKFLOWHUB_TASK_DIR) must invoke from
 * repo root. Production callers should prefer setting WORKFLOWHUB_TASK_DIR to
 * avoid cwd sensitivity.
 */
const DEFAULT_CONFIG_PATH = resolve(process.cwd(), "config", "workflowhub.yaml");

/**
 * Trim at most one trailing `/tasks` or `/tasks/` suffix from a path value.
 * Only trims when the path ends exactly with `/tasks` or `/tasks/`.
 * `/mytasks` and similar are NOT trimmed.
 *
 * @param {string} value - Raw path value from yaml task_dir field.
 * @returns {string} Path with at most one trailing `/tasks[/]` removed.
 */
function trimTasksSuffix(value) {
  // Remove one trailing `/tasks/` or `/tasks` (exact word boundary)
  return value.replace(/\/tasks\/?$/, "");
}

/**
 * Expand a leading `~` to the home directory.
 *
 * @param {string} p - Path possibly starting with `~`.
 * @returns {string} Expanded absolute path.
 */
function expandHome(p) {
  if (p.startsWith("~/") || p === "~") {
    return p.replace(/^~/, homedir());
  }
  return p;
}

/**
 * Fail-loud: write message to stderr and exit with code 1.
 * Never returns.
 *
 * @param {string} message - Human-readable error message.
 */
function failLoud(message) {
  process.stderr.write(`[task-dir-parser] FAIL: ${message}\n`);
  process.exit(1);
}

/**
 * Validate that a resolved path exists and is a directory.
 * Calls failLoud if validation fails.
 *
 * @param {string} resolvedPath - Absolute path to validate.
 * @param {string} source - Description of where the path came from (for error message).
 */
function validateDir(resolvedPath, source) {
  if (!existsSync(resolvedPath)) {
    failLoud(
      `path does not exist (source: ${source}): ${resolvedPath}`
    );
  }
  let stat;
  try {
    stat = statSync(resolvedPath);
  } catch (err) {
    failLoud(
      `cannot stat path (source: ${source}): ${resolvedPath} — ${err.message}`
    );
  }
  if (!stat.isDirectory()) {
    failLoud(
      `path exists but is not a directory (source: ${source}): ${resolvedPath}`
    );
  }
}

/**
 * Parse a single top-level `task_dir:` key from a YAML config file.
 * Uses a line-level scan — no third-party YAML parser required.
 *
 * @param {string} configPath - Absolute path to workflowhub.yaml.
 * @returns {string|null} The raw task_dir value, or null if absent/unreadable.
 */
function readTaskDirFromYaml(configPath) {
  if (!existsSync(configPath)) return null;
  let raw;
  try {
    raw = readFileSync(configPath, "utf8");
  } catch {
    return null;
  }
  for (const line of raw.split("\n")) {
    if (line.trimStart().startsWith("#")) continue;
    const match = line.match(/^task_dir:\s*(.+)$/);
    if (match) {
      const value = match[1].trim().replace(/^['"]|['"]$/g, "");
      if (value) return value;
    }
  }
  return null;
}

/**
 * Resolve task_tracking_root via priority:
 *   1. WORKFLOWHUB_TASK_DIR env var
 *   2. yaml task_dir field (with trailing /tasks[/] trim)
 *   3. fail-loud
 *
 * Returned path is validated to exist and be a directory.
 *
 * @param {string} [configPath] - Path to workflowhub.yaml. Defaults to repo-relative config/workflowhub.yaml.
 * @returns {string} Absolute task_tracking_root path.
 */
export function parseTaskDir(configPath = DEFAULT_CONFIG_PATH) {
  // Priority 1: WORKFLOWHUB_TASK_DIR env var (set and non-empty)
  const envVar = process.env.WORKFLOWHUB_TASK_DIR;
  if (envVar && envVar.trim() !== "") {
    const resolved = resolve(expandHome(envVar.trim()));
    validateDir(resolved, "WORKFLOWHUB_TASK_DIR");
    return resolved;
  }

  // Priority 2: yaml task_dir field
  const rawYaml = readTaskDirFromYaml(configPath);
  if (rawYaml !== null) {
    const trimmed = trimTasksSuffix(rawYaml);
    const resolved = resolve(expandHome(trimmed));
    validateDir(resolved, `yaml task_dir (${configPath})`);
    return resolved;
  }

  // Priority 3: both absent — fail-loud
  failLoud(
    `WORKFLOWHUB_TASK_DIR is not set and no task_dir found in ${configPath}. ` +
      `Set the WORKFLOWHUB_TASK_DIR environment variable to the task tracking root directory, ` +
      `or add a task_dir entry to config/workflowhub.yaml.`
  );
}

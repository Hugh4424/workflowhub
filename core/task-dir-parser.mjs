/**
 * task-dir-parser.mjs — FR-TASKDIR-001 / FR-WORKTREE-ENVVAR-003 / FR-TASKDIR-002
 *
 * Reads task_tracking_root via priority order:
 *   1. WORKFLOWHUB_TASK_DIR env var (if set and non-empty, direct task root)
 *   2. ~/.workflowhub/config.json `task_dir` field (config fallback)
 *   3. Both absent → fail-loud (non-zero exit, explicit error message)
 *
 * Config `task_dir` may be either a direct task_tracking_root or a global
 * knowledge root that contains Projects/<project-key>/tasks. When the latter
 * layout is present, this parser derives the project key from the current git
 * remote / repo_root_map and returns the project-scoped task_tracking_root.
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
import { execFileSync } from "node:child_process";
import { resolve, basename, join } from "node:path";
import { homedir } from "node:os";

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

function normalizeRemoteUrl(value) {
  return String(value || "")
    .trim()
    .replace(/\.git$/, "")
    .replace(/\/$/, "");
}

function projectKeyFromRemote(value) {
  const normalized = normalizeRemoteUrl(value);
  if (!normalized) return null;
  const lastPart = normalized.split(/[/:]/).filter(Boolean).at(-1);
  return lastPart || null;
}

function currentGitRemote(cwd = process.cwd()) {
  try {
    return execFileSync("git", ["-C", cwd, "remote", "get-url", "origin"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return null;
  }
}

function currentProjectKey(config, cwd = process.cwd()) {
  const envProjectKey = process.env.WORKFLOWHUB_PROJECT_KEY;
  if (envProjectKey && envProjectKey.trim() !== "") {
    return envProjectKey.trim();
  }

  const remote = currentGitRemote(cwd);
  if (!remote) return null;

  const normalizedRemote = normalizeRemoteUrl(remote);
  const repoRootMap = config?.repo_root_map;
  if (repoRootMap && typeof repoRootMap === "object") {
    for (const [configuredRemote, repoRoot] of Object.entries(repoRootMap)) {
      if (normalizeRemoteUrl(configuredRemote) !== normalizedRemote) continue;
      if (typeof repoRoot === "string" && repoRoot.trim() !== "") {
        return basename(resolve(expandHome(repoRoot.trim())));
      }
    }
  }

  return projectKeyFromRemote(remote);
}

function maybeProjectScopedTaskRoot(configTaskDir, config) {
  const projectKey = currentProjectKey(config);
  if (!projectKey) return configTaskDir;

  if (basename(configTaskDir) === "tasks") {
    return configTaskDir;
  }

  const projectsDir = join(configTaskDir, "Projects");
  if (!existsSync(projectsDir)) {
    return configTaskDir;
  }

  const candidate = join(projectsDir, projectKey, "tasks");
  validateDir(candidate, `config.json project task_dir (${projectKey})`);
  return candidate;
}

/**
 * Read task_dir from ~/.workflowhub/config.json.
 * - File doesn't exist → return null (not configured)
 * - Malformed JSON → fail-loud
 * - task_dir field missing or empty → fail-loud
 * - Path doesn't exist on disk → fail-loud (via validateDir)
 *
 * @returns {string|null} The resolved, validated task_dir path, or null if file doesn't exist.
 */
function readTaskDirFromConfig() {
  const configPath = expandHome("~/.workflowhub/config.json");
  if (!existsSync(configPath)) return null;

  let config;
  try {
    config = JSON.parse(readFileSync(configPath, "utf8"));
  } catch {
    failLoud("配置有问题 (config.json malformed)");
  }

  if (
    !config ||
    typeof config.task_dir !== "string" ||
    config.task_dir.trim() === ""
  ) {
    failLoud(
      `WORKFLOWHUB_TASK_DIR is not set and no task_dir found in ${configPath}. ` +
        `Set the WORKFLOWHUB_TASK_DIR environment variable to the task tracking root directory, ` +
        `or add a task_dir entry to ~/.workflowhub/config.json.`
    );
  }

  const resolved = resolve(expandHome(config.task_dir.trim()));
  validateDir(resolved, `config.json (${configPath})`);
  return maybeProjectScopedTaskRoot(resolved, config);
}

/**
 * Resolve task_tracking_root via priority:
 *   1. WORKFLOWHUB_TASK_DIR env var (direct task root)
 *   2. ~/.workflowhub/config.json task_dir field. If this is a knowledge root
 *      containing Projects/<current-project>/tasks, return that project root.
 *   3. fail-loud
 *
 * Returned path is validated to exist and be a directory.
 *
 * @param {string} [_configPath] - Deprecated, kept for backward compat. No longer used in priority chain.
 * @returns {string} Absolute task_tracking_root path.
 */
export function parseTaskDir(_configPath) {
  // Priority 1: WORKFLOWHUB_TASK_DIR env var (set and non-empty)
  const envVar = process.env.WORKFLOWHUB_TASK_DIR;
  if (envVar && envVar.trim() !== "") {
    const resolved = resolve(expandHome(envVar.trim()));
    validateDir(resolved, "WORKFLOWHUB_TASK_DIR");
    return resolved;
  }

  // Priority 2: config.json task_dir field
  const configResult = readTaskDirFromConfig();
  if (configResult !== null) {
    return configResult;
  }

  // Priority 3: both absent — fail-loud
  const configPath = expandHome("~/.workflowhub/config.json");
  failLoud(
    `WORKFLOWHUB_TASK_DIR is not set and no task_dir found in ${configPath}. ` +
      `Set the WORKFLOWHUB_TASK_DIR environment variable to the task tracking root directory, ` +
      `or add a task_dir entry to ~/.workflowhub/config.json.`
  );
}

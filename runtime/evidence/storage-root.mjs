import { homedir } from "node:os";
import { closeSync, constants, existsSync, fstatSync, openSync, readFileSync, lstatSync, realpathSync } from "node:fs";
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { deriveTaskPath } from "../task/task-identity.mjs";
import { DEFAULT_TASK_DISK_LIMITS } from "./disk-budget.mjs";

/**
 * Unique owner of the WorkflowHub user configuration path.
 *
 * Callers that already know the current stage must pass this value explicitly
 * instead of re-deriving the XDG/HOME rule. The portable wh-review scripts keep
 * their own documented HOME default; WorkflowHub callers bind this path.
 */
export function workflowHubConfigPath({ env = process.env, home = homedir() } = {}) {
  const xdgConfigHome = env?.XDG_CONFIG_HOME;
  const configHome = typeof xdgConfigHome === "string" && xdgConfigHome.trim() !== ""
    ? xdgConfigHome.trim()
    : join(home, ".config");
  if (!isAbsolute(configHome)) throw new TypeError(`WorkflowHub config home must be absolute: ${configHome}`);
  return join(resolve(configHome), "workflowhub", "config.json");
}

function safeJsonPosition(error) {
  const message = String(error?.message ?? "");
  const located = /line (\d+) column (\d+)/.exec(message);
  if (located) return `line ${located[1]}, column ${located[2]}`;
  const positioned = /at position (\d+)/.exec(message);
  return positioned ? `position ${positioned[1]}` : "position unknown";
}

function readOperatorConfig(path, source = path) {
  if (source === path && !existsSync(path)) return undefined;
  let config;
  try {
    config = JSON.parse(readFileSync(source, "utf8"));
  } catch (error) {
    throw new TypeError(`invalid WorkflowHub config JSON at ${path} (${safeJsonPosition(error)}); parser content is not echoed`);
  }
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    throw new TypeError(`WorkflowHub config must be a JSON object: ${path}`);
  }
  return config;
}

function configuredTaskDir(config, path) {
  if (!config) return undefined;
  if (typeof config.task_dir !== "string" || config.task_dir.trim() === "") {
    throw new TypeError(`WorkflowHub config task_dir must be a non-empty absolute path: ${path}`);
  }
  return config.task_dir.trim();
}

/** Operator-only exception, resolved by the existing authenticated task handle. */
export function resolveTaskTestsDiskLimits({ projectName, taskId, taskRoot }) {
  const path = workflowHubConfigPath();
  const invalid = () => Object.assign(new Error("TASK_TESTS_DISK_BUDGET_INVALID: check operator config identity, canonical root, ownership and hard_bytes"), { code: "TASK_TESTS_DISK_BUDGET_INVALID" });
  let fd;
  try { fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK); }
  catch (error) {
    if (error.code === "ENOENT") return undefined;
    if (error.code === "ELOOP") throw invalid();
    throw error;
  }
  try {
    const stat = fstatSync(fd);
    if (!stat.isFile()) throw invalid();
    const config = readOperatorConfig(path, fd);
    if (!Object.hasOwn(config, "task_tests_disk_budget")) return undefined;
    const entry = config.task_tests_disk_budget;
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) throw invalid();
    const { project_name, task_id, task_root, hard_bytes } = entry;
    const matchesIdentity = project_name === projectName && task_id === taskId;
    const namesRoot = typeof task_root === "string" && isAbsolute(task_root) && resolve(task_root) === taskRoot;
    if (!matchesIdentity && !namesRoot) return undefined;
    if (!matchesIdentity || task_root !== taskRoot || Object.keys(entry).length !== 4 ||
        !Number.isSafeInteger(hard_bytes) || hard_bytes <= DEFAULT_TASK_DISK_LIMITS.tests.hardBytes ||
        hard_bytes > DEFAULT_TASK_DISK_LIMITS.evidence.hardBytes) throw invalid();
    const storage = realpathSync(validateStorageRoot(configuredTaskDir(config, path)));
    const placement = relative(join(storage, "Projects"), path);
    const named = lstatSync(path);
    if (deriveTaskPath(storage, projectName, taskId) !== taskRoot ||
        !(placement === ".." || placement.startsWith(`..${sep}`) || isAbsolute(placement)) ||
        stat.nlink !== 1 || stat.uid !== process.getuid?.() || (stat.mode & 0o022) !== 0 ||
        stat.dev !== named.dev || stat.ino !== named.ino || realpathSync(path) !== path) throw invalid();
    return { tests: { hardBytes: hard_bytes } };
  } finally { closeSync(fd); }
}

function validateStorageRoot(value) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError("storage root must be a non-empty absolute path");
  }
  if (!isAbsolute(value)) {
    throw new TypeError(`storage root must be absolute: ${value}`);
  }

  const normalized = resolve(value);
  if (
    basename(normalized) === "tasks" &&
    basename(dirname(dirname(normalized))) === "Projects"
  ) {
    throw new TypeError(
      `legacy WORKFLOWHUB_TASK_DIR semantics are not supported; expected global storage root, got project tasks root: ${normalized}`,
    );
  }
  return normalized;
}

/**
 * Resolve the global storage root and retain the inputs used by the launcher.
 * Missing optional sources are represented as null so doctor can distinguish
 * an absent source from an unrecorded historical task field.
 */
export function resolveStorageRootDetails({ env = process.env, home = homedir() } = {}) {
  const configured = env?.WORKFLOWHUB_TASK_DIR;
  const envValue = typeof configured === "string" && configured.trim() !== ""
    ? configured.trim()
    : null;
  const configPath = workflowHubConfigPath({ env, home });
  const configValue = configuredTaskDir(readOperatorConfig(configPath), configPath) ?? null;
  const homeValue = home;
  const selectedSource = envValue !== null ? "env" : configValue !== null ? "config" : "home";
  const selectedValue = envValue ?? configValue ?? homeValue;

  return Object.freeze({
    resolution_chain: Object.freeze({ env: envValue, config: configValue, home: homeValue }),
    selected_source: selectedSource,
    storage_root: validateStorageRoot(selectedValue),
  });
}

/**
 * Resolve the global WorkflowHub storage root.
 *
 * This is launcher-only policy. It never inspects cwd, Git metadata, or
 * repository names.
 */
export function resolveStorageRoot({ env = process.env, home = homedir() } = {}) {
  return resolveStorageRootDetails({ env, home }).storage_root;
}

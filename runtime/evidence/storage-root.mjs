import { homedir } from "node:os";
import { existsSync, readFileSync } from "node:fs";
import { basename, dirname, isAbsolute, join, resolve } from "node:path";

export function workflowHubConfigPath({ env = process.env, home = homedir() } = {}) {
  const xdgConfigHome = env?.XDG_CONFIG_HOME;
  const configHome = typeof xdgConfigHome === "string" && xdgConfigHome.trim() !== ""
    ? xdgConfigHome.trim()
    : join(home, ".config");
  if (!isAbsolute(configHome)) throw new TypeError(`WorkflowHub config home must be absolute: ${configHome}`);
  return join(resolve(configHome), "workflowhub", "config.json");
}

function readConfiguredTaskDir({ env, home }) {
  const path = workflowHubConfigPath({ env, home });
  if (!existsSync(path)) return undefined;
  let config;
  try {
    config = JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    throw new TypeError(`invalid WorkflowHub config JSON at ${path}: ${error.message}`);
  }
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    throw new TypeError(`WorkflowHub config must be a JSON object: ${path}`);
  }
  if (typeof config.task_dir !== "string" || config.task_dir.trim() === "") {
    throw new TypeError(`WorkflowHub config task_dir must be a non-empty absolute path: ${path}`);
  }
  return config.task_dir.trim();
}

/**
 * Resolve the global WorkflowHub storage root.
 *
 * This is launcher-only policy. It never inspects cwd, Git metadata, or
 * repository names.
 */
export function resolveStorageRoot({ env = process.env, home = homedir() } = {}) {
  const configured = env?.WORKFLOWHUB_TASK_DIR;
  const value =
    typeof configured === "string" && configured.trim() !== ""
      ? configured.trim()
      : readConfiguredTaskDir({ env, home }) ?? home;

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

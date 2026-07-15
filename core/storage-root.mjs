import { homedir } from "node:os";
import { basename, dirname, isAbsolute, resolve } from "node:path";

/**
 * Resolve the global WorkflowHub storage root.
 *
 * This is launcher-only policy. It deliberately does not inspect config files,
 * cwd, Git metadata, or repository names.
 */
export function resolveStorageRoot({ env = process.env, home = homedir() } = {}) {
  const configured = env?.WORKFLOWHUB_TASK_DIR;
  const value =
    typeof configured === "string" && configured.trim() !== ""
      ? configured.trim()
      : home;

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

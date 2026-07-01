/**
 * task-dir-parser.mjs — FR-TASKDIR-001
 *
 * Reads config/workflowhub.yaml and extracts the `task_dir` field.
 * Falls back to ~/Knowledge/workflowhub/ when the field is absent or the
 * config file cannot be read.  No third-party dependencies (FR-TASKDIR-001).
 *
 * AC-16 consumable call (grep anchor: parseTaskDir):
 *   import { parseTaskDir } from "./core/task-dir-parser.mjs";
 *   const taskDir = parseTaskDir(); // uses default config/workflowhub.yaml
 *
 * @module task-dir-parser
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));

/** Absolute path to the default config file (relative to this module). */
const DEFAULT_CONFIG_PATH = resolve(here, "..", "config", "workflowhub.yaml");

/**
 * Default task directory when config does not specify one.
 * FR-TASKDIR-001: fall back to ~/Knowledge/workflowhub/.
 */
const DEFAULT_TASK_DIR = join(homedir(), "Knowledge", "workflowhub");

/**
 * Parse `task_dir` from a workflowhub YAML config file without third-party deps.
 *
 * Uses a line-level scan for the top-level `task_dir:` key — the only key
 * this parser needs; full YAML parsing is intentionally out of scope to
 * satisfy FR-TASKDIR-001 (no external dependencies).
 *
 * @param {string} [configPath] - Absolute path to workflowhub.yaml.
 *   Defaults to config/workflowhub.yaml relative to the repo root.
 * @returns {string} Configured task_dir value, or DEFAULT_TASK_DIR if absent.
 */
export function parseTaskDir(configPath = DEFAULT_CONFIG_PATH) {
  try {
    if (!existsSync(configPath)) {
      return DEFAULT_TASK_DIR;
    }
    const raw = readFileSync(configPath, "utf8");
    for (const line of raw.split("\n")) {
      // Match top-level `task_dir: <value>` — skip comment lines.
      if (line.trimStart().startsWith("#")) continue;
      const match = line.match(/^task_dir:\s*(.+)$/);
      if (match) {
        const value = match[1].trim().replace(/^['"]|['"]$/g, "");
        if (value) return value;
      }
    }
    return DEFAULT_TASK_DIR;
  } catch (err) {
    // FR-RESEARCH-002 / fail-loud: only missing config is a fallback;
    // any other I/O error must propagate instead of being swallowed.
    if (err && err.code === "ENOENT") {
      return DEFAULT_TASK_DIR;
    }
    throw err;
  }
}

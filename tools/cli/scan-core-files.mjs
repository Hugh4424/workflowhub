/**
 * scan-core-files.mjs
 * Shared boundary anchor (FR-CI-001) — single source of truth for what counts
 * as the production runtime body when running anti-host lint and extensibility checks.
 *
 * Returns all *.mjs files under runtime/. Compatibility files under core/ are
 * intentionally outside this production-root check.
 */

import { readdirSync, statSync } from "fs";
import { join, resolve, relative } from "path";
import { fileURLToPath } from "url";

const repoRoot = resolve(fileURLToPath(import.meta.url), "..", "..", "..");

/**
 * Recursively collect *.mjs files under `dir`, skipping `__tests__` directories.
 * @param {string} dir  absolute path to scan
 * @returns {string[]}  absolute paths
 */
function collectMjs(dir) {
  const results = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (entry.name === "__tests__") continue; // exclude test directories
      results.push(...collectMjs(join(dir, entry.name)));
    } else if (entry.name.endsWith(".mjs")) {
      results.push(join(dir, entry.name));
    }
  }
  return results;
}

/**
 * Return sorted absolute paths of all runtime/*.mjs files (excluding __tests__).
 * @returns {string[]}
 */
export function scanCoreFiles() {
  const runtimeDir = join(repoRoot, "runtime");
  return collectMjs(runtimeDir).sort();
}

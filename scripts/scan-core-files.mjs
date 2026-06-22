/**
 * scan-core-files.mjs
 * Shared boundary anchor (FR-CI-001) — single source of truth for what counts
 * as "core body" when running anti-host lint, extensibility checks, etc.
 *
 * Returns all *.mjs files under core/ excluding core/__tests__/.
 */

import { readdirSync, statSync } from "fs";
import { join, resolve, relative } from "path";
import { fileURLToPath } from "url";

const repoRoot = resolve(fileURLToPath(import.meta.url), "..", "..");

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
 * Return sorted absolute paths of all core/*.mjs files (excluding __tests__).
 * @returns {string[]}
 */
export function scanCoreFiles() {
  const coreDir = join(repoRoot, "core");
  return collectMjs(coreDir).sort();
}

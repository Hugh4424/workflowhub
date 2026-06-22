/**
 * Single path-resolution entry point (FR-PATHG-004, decision 7/13).
 * Accepts only an explicit path string — no cwd inference, no env reads, no dir crawl.
 */
import { resolve } from "node:path";

/**
 * @param {string} explicitPath
 * @returns {string} absolute resolved path
 * @throws if explicitPath is absent, null, or empty string
 */
export function resolvePath(explicitPath) {
  if (!explicitPath) {
    throw new Error("resolvePath: explicit path required — no cwd inference, no REPO_ROOT fallback");
  }
  return resolve(explicitPath);
}

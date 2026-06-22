/**
 * Parse and validate framework config object (FR-CFG-004, decision 13).
 * task_dir is resolved via the single entry point resolvePath; absent key skips resolution.
 */
import { resolvePath } from "./resolve-path.mjs";

/**
 * @param {object} config
 * @returns {{ task_dir?: string }}
 */
export function parseFrameworkConfig(config) {
  const result = {};
  if (config.task_dir !== undefined) {
    result.task_dir = resolvePath(config.task_dir);
  }
  return result;
}

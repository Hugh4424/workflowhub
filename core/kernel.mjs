import { loadConfig } from "./load-config.mjs";
import { resolveComponent } from "./resolve-component.mjs";
import { dispatchComponent } from "./dispatch-component.mjs";

/**
 * runKernel — FR-CORE-003
 * Load config → resolve component by workflowId (registry lookup only, zero
 * business branching) → dispatch component → return structured result.
 * @param {string} configPath - Absolute path to YAML config.
 * @param {string} workflowId - Workflow identifier to look up.
 * @returns {Promise<object>} Parsed JSON output from the dispatched component.
 */
export async function runKernel(configPath, workflowId) {
  const config = loadConfig(configPath);
  const entry = resolveComponent(config, workflowId);
  return dispatchComponent(entry);
}

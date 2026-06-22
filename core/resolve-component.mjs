/**
 * resolveComponent — FR-CORE-001
 * Locate a registry entry by workflowId.
 * @param {object} config - Parsed config object with a `registry` array.
 * @param {string} workflowId - Lookup key matching registry[].workflow.
 * @returns {{ component_id: string, workflow: string, path: string }} Registry entry.
 * @throws {Error} If no matching entry found.
 */
export function resolveComponent(config, workflowId) {
  const entry = config.registry.find((e) => e.workflow === workflowId);
  if (!entry) {
    throw new Error(`No component registered for workflow: "${workflowId}"`);
  }
  return entry;
}

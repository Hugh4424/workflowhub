/**
 * core/chain-topology.mjs
 *
 * Topology traversal — pure functions, no I/O.
 * Uses the FIRST-exit view to discover which steps are on the canonical chain.
 * The first-exit / latest-exit separation is the core design invariant:
 *   - chain-topology always uses firstByStepId (topology must not shift on retries)
 *   - audit-aggregator uses latestByStepId for counting (reflect most-recent outcome)
 */

// ---- private helpers ----

function isStageStepId(stepId, stageSlug) {
  return typeof stepId === "string" && stepId.startsWith(`${stageSlug}.`);
}

function orderedDistinctHeads(entryEvents, stageSlug) {
  const heads = [];
  for (const event of entryEvents) {
    if (event.prev_step_id !== null && isStageStepId(event.prev_step_id, stageSlug)) continue;
    heads.push(event);
  }
  return heads;
}

function orderedDistinctUnvisitedNextEntries(entryEvents, currentStepId, visited) {
  const entries = [];
  const seenStepIds = new Set();
  for (const event of entryEvents) {
    if (event.prev_step_id !== currentStepId) continue;
    if (visited.has(event.step_id)) continue;
    if (seenStepIds.has(event.step_id)) continue;
    seenStepIds.add(event.step_id);
    entries.push(event);
  }
  return entries;
}

function firstEntryForStepId(entryEvents, stepId) {
  return entryEvents.find((event) => event.step_id === stepId);
}

// ---- public exports ----

/**
 * Build a Map keyed by step_id from the first occurrence of each exit event.
 * Used exclusively for topology discovery (not for counting).
 *
 * @param {object[]} exitEvents
 * @returns {Map<string, object>}
 */
export function firstByStepId(exitEvents) {
  const map = new Map();
  for (const event of exitEvents) {
    if (!map.has(event.step_id)) {
      map.set(event.step_id, event);
    }
  }
  return map;
}

/**
 * Discover the canonical chain of step IDs by traversing entry/exit pointers.
 * Uses the first-exit view (exitByStepId must be the result of firstByStepId()).
 *
 * @param {object[]} entryEvents - All STEP_ENTRY events for the current run+stage
 * @param {Map<string,object>} exitByStepId - First exit per step_id (from firstByStepId())
 * @param {string} stageSlug
 * @returns {{ stepIds: string[], selectedEntries: Map<string,object>, warnings: string[] }}
 */
export function discoverChainStepIds(entryEvents, exitByStepId, stageSlug) {
  const warnings = [];
  const heads = orderedDistinctHeads(entryEvents, stageSlug);
  const head = heads[0];
  if (!head) return { stepIds: [], selectedEntries: new Map(), warnings: ["missing_chain_head"] };
  if (heads.length > 1) warnings.push("duplicate_chain_heads");

  const stepIds = [];
  const selectedEntries = new Map();
  const visited = new Set();
  let topologyEntry = head;

  while (topologyEntry) {
    const currentStepId = topologyEntry.step_id;
    if (visited.has(currentStepId)) {
      warnings.push(`cycle_detected:${currentStepId}`);
      break;
    }

    visited.add(currentStepId);
    stepIds.push(currentStepId);
    selectedEntries.set(currentStepId, topologyEntry);

    const exit = exitByStepId.get(currentStepId);

    if (!Object.prototype.hasOwnProperty.call(topologyEntry, "next_step_id")) {
      warnings.push(`missing_entry_next_step_id:${currentStepId}`);
      break;
    }
    if (exit && !Object.prototype.hasOwnProperty.call(exit, "next_step_id")) {
      warnings.push(`missing_exit_next_step_id:${currentStepId}`);
      break;
    }
    if (exit && topologyEntry.next_step_id !== null && exit.next_step_id !== topologyEntry.next_step_id) {
      warnings.push(`pointer_mismatch:${currentStepId}`);
      break;
    }

    const explicitNext = exit ? exit.next_step_id : topologyEntry.next_step_id;
    if (exit && explicitNext === null) break;
    if (explicitNext != null) {
      if (!isStageStepId(explicitNext, stageSlug)) break;
      const nextEntry = firstEntryForStepId(entryEvents, explicitNext);
      if (!nextEntry) {
        warnings.push(`missing_link:${currentStepId}->${explicitNext}`);
        break;
      }
      topologyEntry = nextEntry;
      continue;
    }

    const nextCandidateEntries = orderedDistinctUnvisitedNextEntries(entryEvents, currentStepId, visited);
    if (nextCandidateEntries.length === 0) break;
    if (nextCandidateEntries.length > 1) {
      warnings.push(`duplicate_next:${currentStepId}`);
      break;
    }
    topologyEntry = nextCandidateEntries[0];
  }

  return { stepIds, selectedEntries, warnings };
}

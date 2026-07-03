/**
 * core/chain-topology.mjs
 *
 * Topology traversal — pure functions, no I/O.
 * Uses the FIRST-exit view to discover which steps are on the canonical chain.
 *
 * Design invariant:
 *   - chain-topology uses firstByStepAndEntry (keyed by step_id::journal_entry_id)
 *     so repeated attempts of the same step_id remain distinguishable.
 *   - audit-aggregator uses latestByStepAndEntry for counting (most-recent outcome).
 *
 * ChainNode shape:
 *   {
 *     step_id: string,
 *     journal_entry_id: string,   // from the selected STEP_ENTRY
 *     attempt_index: number,       // 0-based occurrence of step_id in this chain
 *     exit_journal_entry_id: string | null  // from the first matching STEP_EXIT, null if absent
 *   }
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

/**
 * Returns unvisited entries whose prev_step_id === currentStepId.
 * De-duplicates by journal_entry_id (not step_id) so repeated attempts of
 * the same step_id can both appear as distinct candidates.
 * visitedEntryIds is the set of already-consumed journal_entry_id values
 * (or `step_id:<id>` sentinels for legacy events without journal_entry_id).
 */
function orderedDistinctUnvisitedNextEntries(entryEvents, currentStepId, visitedEntryIds) {
  const entries = [];
  const seenEntryIds = new Set();
  for (const event of entryEvents) {
    if (event.prev_step_id !== currentStepId) continue;
    const eid = event.journal_entry_id ?? `step_id:${event.step_id}`;
    if (visitedEntryIds.has(eid)) continue;
    if (seenEntryIds.has(eid)) continue;
    seenEntryIds.add(eid);
    entries.push(event);
  }
  return entries;
}

function firstEntryForStepId(entryEvents, stepId) {
  return entryEvents.find((event) => event.step_id === stepId);
}

// ---- public exports ----

/**
 * Build a Map keyed by `${step_id}::${journal_entry_id}` from the FIRST occurrence
 * of each (step_id, journal_entry_id) pair in exitEvents.
 *
 * The journal_entry_id is read from the exit event's own `exit_journal_entry_id` field,
 * which must have been written by writeExitReceipt (bound to the matching STEP_ENTRY).
 *
 * Used exclusively for topology discovery (not for counting).
 *
 * @param {object[]} exitEvents
 * @returns {Map<string, object>}
 */
export function firstByStepAndEntry(exitEvents) {
  const map = new Map();
  for (const event of exitEvents) {
    const entryId = event.exit_journal_entry_id ?? null;
    const key = `${event.step_id}::${entryId}`;
    if (!map.has(key)) {
      map.set(key, event);
    }
  }
  return map;
}

/**
 * Build a Map keyed by step_id from the first occurrence of each exit event.
 * Kept for backward compatibility with code that has not yet migrated to
 * firstByStepAndEntry. New code should use firstByStepAndEntry.
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
 * Discover the canonical chain of steps by traversing entry/exit pointers.
 * Returns ChainNode objects that carry both step_id and journal_entry_id so
 * repeated attempts of the same step_id are physically distinct.
 *
 * exitByStepAndEntry MUST be the result of firstByStepAndEntry() — never
 * latestByStepId() — to preserve the topology-must-not-shift-on-retries invariant.
 *
 * @param {object[]} entryEvents - All STEP_ENTRY events for the current run+stage
 * @param {Map<string,object>} firstExitByStepAndEntry
 *   Key format: `${step_id}::${journal_entry_id}` (from firstByStepAndEntry())
 * @param {string} stageSlug
 * @returns {{ chainNodes: ChainNode[], warnings: string[] }}
 */
export function discoverChainNodes(entryEvents, firstExitByStepAndEntry, stageSlug) {
  const warnings = [];
  const heads = orderedDistinctHeads(entryEvents, stageSlug);
  const head = heads[0];
  if (!head) return { chainNodes: [], warnings: ["missing_chain_head"] };
  if (heads.length > 1) warnings.push("duplicate_chain_heads");

  /** @type {ChainNode[]} */
  const chainNodes = [];
  // visited keyed by journal_entry_id (not step_id) to allow step_id retries
  const visitedEntryIds = new Set();
  // step_id attempt counter
  const attemptsByStepId = new Map();
  let topologyEntry = head;

  while (topologyEntry) {
    const currentStepId = topologyEntry.step_id;
    const currentEntryId = topologyEntry.journal_entry_id ?? null;

    // Cycle guard: same entry ID seen twice means a real loop
    if (currentEntryId !== null && visitedEntryIds.has(currentEntryId)) {
      warnings.push(`cycle_detected:${currentStepId}`);
      break;
    }
    // Fallback cycle guard when journal_entry_id is absent (shouldn't happen post-fix)
    if (currentEntryId === null && visitedEntryIds.has(`step_id:${currentStepId}`)) {
      warnings.push(`cycle_detected:${currentStepId}`);
      break;
    }

    if (currentEntryId !== null) {
      visitedEntryIds.add(currentEntryId);
    } else {
      visitedEntryIds.add(`step_id:${currentStepId}`);
    }

    const attemptIndex = attemptsByStepId.get(currentStepId) ?? 0;
    attemptsByStepId.set(currentStepId, attemptIndex + 1);

    // Look up the first exit for this specific (step_id, journal_entry_id) pair
    const exitKey = `${currentStepId}::${currentEntryId}`;
    const exit = firstExitByStepAndEntry.get(exitKey) ?? null;
    const exitEntryId = exit?.exit_journal_entry_id ?? null;

    chainNodes.push({
      step_id: currentStepId,
      journal_entry_id: currentEntryId,
      attempt_index: attemptIndex,
      exit_journal_entry_id: exitEntryId,
    });

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
      // Resolve by prev_step_id scan restricted to the explicit next step_id,
      // so repeated attempts of the same step_id are resolved by journal order
      // among unvisited entries — not by firstEntryForStepId which ignores attempts.
      const nextCandidates = entryEvents.filter(
        (e) => e.step_id === explicitNext && !visitedEntryIds.has(e.journal_entry_id ?? `step_id:${e.step_id}`),
      );
      if (nextCandidates.length === 0) {
        warnings.push(`missing_link:${currentStepId}->${explicitNext}`);
        break;
      }
      topologyEntry = nextCandidates[0];
      continue;
    }

    // No explicit next pointer — fall back to implicit (prev_step_id) scan.
    // Pass visitedEntryIds so dedup operates on journal_entry_id identity.
    const nextCandidateEntries = orderedDistinctUnvisitedNextEntries(entryEvents, currentStepId, visitedEntryIds);
    if (nextCandidateEntries.length === 0) break;
    if (nextCandidateEntries.length > 1) {
      warnings.push(`duplicate_next:${currentStepId}`);
      break;
    }
    topologyEntry = nextCandidateEntries[0];
  }

  return { chainNodes, warnings };
}

/**
 * Backward-compat shim: wraps discoverChainNodes and returns the legacy
 * { stepIds, selectedEntries, warnings } shape expected by older callers.
 *
 * @param {object[]} entryEvents
 * @param {Map<string,object>} exitByStepId - result of firstByStepId()
 * @param {string} stageSlug
 * @returns {{ stepIds: string[], selectedEntries: Map<string,object>, warnings: string[] }}
 */
export function discoverChainStepIds(entryEvents, exitByStepId, stageSlug) {
  // Build a firstByStepAndEntry-compatible map from the legacy firstByStepId map.
  // Since old exit events have no exit_journal_entry_id, key becomes step_id::null.
  const firstExitByStepAndEntry = new Map();
  for (const [stepId, exitEvent] of exitByStepId) {
    const entryId = exitEvent.exit_journal_entry_id ?? null;
    const key = `${stepId}::${entryId}`;
    firstExitByStepAndEntry.set(key, exitEvent);
  }

  const { chainNodes, warnings } = discoverChainNodes(entryEvents, firstExitByStepAndEntry, stageSlug);

  const stepIds = chainNodes.map((n) => n.step_id);
  const selectedEntries = new Map();
  // Re-derive selectedEntries: use exact journal_entry_id match when present;
  // fall back to step_id only when journal_entry_id is absent (legacy events).
  for (const node of chainNodes) {
    let entry;
    if (node.journal_entry_id != null) {
      entry = entryEvents.find((e) => e.journal_entry_id === node.journal_entry_id);
    }
    if (!entry) {
      entry = entryEvents.find((e) => e.step_id === node.step_id && e.journal_entry_id == null);
    }
    if (entry) selectedEntries.set(node.step_id, entry);
  }

  return { stepIds, selectedEntries, warnings };
}

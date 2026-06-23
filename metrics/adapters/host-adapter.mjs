/**
 * host-adapter.mjs — M4 host adaptation layer (FR-COLLECT-005).
 *
 * Translates a host's timing events into the collector core's three timing calls.
 * The collector core itself has NO host-specific binding; swapping the host means
 * replacing only this thin adapter. This adapter is deliberately host-agnostic at the
 * core boundary — it merely forwards a {execution_id, ...} payload to the core.
 */

import { recordSkeleton, updateOwnResult, updateStageImpact } from "../collector.mjs";

/**
 * makeHostAdapter — bind a config and expose the three timing hooks a host calls.
 * A concrete host wires its own start/end/stage-end signals to these methods.
 */
export function makeHostAdapter(cfg) {
  return {
    onSkillStart(seed) {
      return recordSkeleton(seed, cfg);
    },
    onSkillEnd(execution_id, patch) {
      return updateOwnResult(execution_id, patch ?? {}, cfg);
    },
    onStageEnd(execution_id, patch) {
      return updateStageImpact(execution_id, patch ?? {}, cfg);
    },
  };
}

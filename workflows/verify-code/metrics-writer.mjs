/**
 * metrics-writer.mjs — M10 Phase 2: collector wiring for verify-code (FR-COLL-001/002).
 *
 * Accepts external executionId from verify-code flow. Only calls updateOwnResult
 * to append verdict to the existing record (verify-code already called recordSkeleton).
 */

import { updateOwnResult, configForCollector } from "../../metrics/collector.mjs";

export async function runMetricsWriter({ task, workspace, metricsLauncherConfig, verdict, executionId } = {}) {
  if (!executionId) throw new Error("executionId required — must come from verify-code recordSkeleton");

  const cfg = configForCollector(
    metricsLauncherConfig,
    { task, workspace }
  );

  if (verdict) {
    updateOwnResult(executionId, { verdict }, cfg);
  }

  return { executionId };
}

export default runMetricsWriter;

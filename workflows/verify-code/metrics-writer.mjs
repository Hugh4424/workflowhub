/**
 * metrics-writer.mjs — M10 Phase 2: collector wiring for verify-code (FR-COLL-001/002).
 */

import { recordSkeleton, updateOwnResult, configForCollector } from "../../metrics/collector.mjs";
import { randomUUID } from "node:crypto";
import { join } from "node:path";
import { homedir } from "node:os";

export async function runMetricsWriter({ taskDir, taskId, verdict, executionId: extExecId } = {}) {
  const executionId = extExecId || randomUUID();

  const cfg = configForCollector(
    { metrics_path: join(homedir(), ".workflowhub", "metrics", "global-metrics.jsonl") },
    { taskDir, taskId, project: "workflowhub" }
  );

  recordSkeleton({
    execution_id: executionId,
    skill_or_stage: "verify-code",
    stage: "test-acceptance",
    executed: true,
  }, cfg);

  if (verdict) {
    updateOwnResult(executionId, { verdict }, cfg);
  }

  return { executionId };
}

export default runMetricsWriter;

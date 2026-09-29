import assert from "node:assert/strict";
import { buildPostAcceptanceChainRows } from "../../../../../runtime/stage/stage-runner.mjs";

const [row] = buildPostAcceptanceChainRows({
  rows: [{ acceptance_criterion_id: "AC-99", coverage_limits: ["existing failure", "existing boundary"] }],
  spec: "",
  decisionLog: "",
  boundEvidenceRefs: [],
  materialRevision: "probe-revision",
  snapshotTree: "a".repeat(40),
  taskId: "probe-task",
  tests: null,
});
assert.match(row.coverage_limits, /existing failure/);
assert.match(row.coverage_limits, /existing boundary/);
assert.match(row.coverage_limits, /CARD-05/);
console.log("T006_ARRAY_LIMITS_PRESERVED");

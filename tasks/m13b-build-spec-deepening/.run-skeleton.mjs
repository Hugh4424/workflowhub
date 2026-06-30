import { recordSkeleton } from "../../metrics/collector.mjs";
import { homedir } from "os";
import { readFileSync } from "fs";

const eid = readFileSync(new URL("./.execution_id", import.meta.url), "utf8").trim();
const cfg = {
  taskMetricsPath: "tasks/m13b-build-spec-deepening/task-metrics.jsonl",
  globalMetricsPath: `${homedir()}/.workflowhub/metrics/global-metrics.jsonl`,
  taskId: "m13b-build-spec-deepening",
  project: "workflowhub",
  onWarn: (m) => process.stderr.write(`[warn] ${m}\n`),
};
recordSkeleton({
  execution_id: eid,
  skill_or_stage: "make-decision",
  stage: "make-decision",
  skill_version: "2.0.0",
  executed: true,
  tokens: null,
  duration_ms: null,
  rework_rounds: 0,
  human_intervention: true,
  friction_ref: null,
}, cfg);
console.log("recordSkeleton ok:", eid);
